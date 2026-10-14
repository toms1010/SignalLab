import { useCallback } from 'react';
import { VizCanvas, axisX, glow, grid, label, polyline, themeColors } from '@/components/ui/VizCanvas';
import {
  LabShell,
  bool,
  makeReadouts,
  num,
  str,
  useDerived,
  useLabValues,
  type Control,
  type SceneProps,
} from '@/components/visualizations/Lab';
import * as D from '@/lib/signalMath';
import type { ControlValues, StatusBanner } from '@/types';

/* ==========================================================================
   Shared helpers
   ========================================================================== */

/** Uniformly spaced time grid over `dur`, for waveform plots. */
function tGrid(dur: number, n = 420): number[] {
  const out = new Array<number>(n + 1);
  for (let i = 0; i <= n; i++) out[i] = (i / n) * dur;
  return out;
}

/** Adaptive y-range that always includes zero and some headroom. */
function yRange(values: readonly number[], pad = 1.25): [number, number] {
  let lo = 0;
  let hi = 0;
  for (const v of values) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return [lo * pad, Math.max(hi * pad, 0.6)];
}

const SINE_FN = (f: number, amp = 1, phase = 0) => (t: number) => amp * Math.sin(2 * Math.PI * f * t + phase);

/* ==========================================================================
   1 — Sampling theorem + aliasing
   ========================================================================== */

export function SamplingScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { fin: 5, fs: 24, dur: 1, recon: true, showSpectrum: true };
  const { values, set, reset } = useLabValues(key_ ?? 'sampling', { ...defaults, ...(overrides ?? {}) });

  const fin = num(values.fin, 5);
  const fs = num(values.fs, 24);
  const dur = num(values.dur, 1);
  const showRecon = bool(values.recon, true);
  const showSpec = bool(values.showSpectrum, true);

  const nyquist = 2 * fin;
  const ok = fs >= nyquist;
  const aliasFreq = D.clamp(Math.abs(fin - Math.round(fin / fs) * fs), 0, fs / 2);
  const ratio = fs / nyquist;

  const specs: Control[] = [
    { kind: 'slider', id: 'fin', label: 'Input frequency', min: 1, max: 20, step: 0.5, unit: ' Hz', hint: 'The tone being sampled. This is f_max.' },
    { kind: 'slider', id: 'fs', label: 'Sampling frequency', min: 3, max: 90, step: 1, unit: ' Hz', hint: 'Move it below 2 × f_max to trigger aliasing.' },
    { kind: 'toggle', id: 'recon', label: 'Show sinc reconstruction' },
    { kind: 'toggle', id: 'showSpectrum', label: 'Show spectral replicas' },
  ];

  const status: StatusBanner = ok
    ? {
        tone: 'ok',
        text: `Nyquist satisfied (${fs} ≥ ${nyquist} Hz). Sinc interpolation reproduces the tone exactly — the laboratory computes the Whittaker–Shannon sum.`,
      }
    : {
        tone: 'bad',
        text: `Aliasing: ${fs} Hz < 2 × ${fin} Hz = ${nyquist} Hz. The tone folds to ${aliasFreq.toFixed(2)} Hz and is indistinguishable from a genuine ${aliasFreq.toFixed(2)} Hz input. This loss cannot be undone after sampling.`,
      };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const specH = showSpec ? Math.min(110, h * 0.3) : 0;
      const waveH = h - specH;
      const x0 = 8;
      const x1 = w - 8;
      const midY = waveH / 2;
      const toX = (t: number) => x0 + (t / dur) * (x1 - x0);

      grid(ctx, w, waveH);
      axisX(ctx, w, midY);

      const sig = SINE_FN(fin);
      const times = tGrid(dur, 500);
      const amps = times.map(sig);
      const [lo, hi] = yRange(amps, 1.2);
      const toY = (v: number) => midY - ((v - lo) / (hi - lo || 1)) * (waveH * 0.82) - waveH * 0.06;

      // 1. sinc reconstruction.
      //    When the sampling condition holds this reproduces the tone exactly.
      //    When it does not, the samples form a *different* band-limited
      //    signal — the alias — and sinc interpolation faithfully rebuilds
      //    that instead. Same computation, both outcomes.
      if (showRecon) {
        const samples = D.sampleSignal(sig, dur, fs);
        const recon = D.reconstructSinc(samples, times, fs);
        ctx.save();
        glow(ctx, ok ? c.green : c.red, 1.9);
        polyline(ctx, times, recon, toX, toY, 2);
        ctx.restore();
      }

      // 2. true analogue signal
      ctx.save();
      glow(ctx, c.cyan, 1.6);
      polyline(ctx, times, amps, toX, toY, 1);
      ctx.restore();

      // 3. samples
      const samples = D.sampleSignal(sig, dur, fs);
      ctx.save();
      for (const s of samples) {
        const px = toX(s.t);
        const py = toY(s.v);
        ctx.strokeStyle = `${c.gold}55`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, midY);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = c.gold;
        ctx.shadowColor = c.gold;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      label(ctx, 'analogue input', x0 + 2, 12, c.cyan, 10, 'left', true);
      if (showRecon) label(ctx, ok ? 'sinc reconstruction (exact)' : 'aliased reconstruction', x1 - 2, 12, ok ? c.green : c.red, 9.5, 'right', true);

      // ---- spectral replicas ----
      if (specH > 0) {
        const sTop = waveH;
        const sBase = h - 12;
        const fMax = Math.max(fs * 1.6, fin * 3, 24);
        const fToX = (f: number) => x0 + (f / fMax) * (x1 - x0);

        ctx.save();
        ctx.strokeStyle = c.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, sBase);
        ctx.lineTo(x1, sBase);
        ctx.stroke();
        ctx.strokeStyle = c.grid;
        for (let f = 0; f <= fMax; f += 10) {
          ctx.beginPath();
          ctx.moveTo(fToX(f), sTop);
          ctx.lineTo(fToX(f), sBase);
          ctx.stroke();
        }

        const triangle = (centre: number, color: string, alpha: number) => {
          ctx.beginPath();
          ctx.moveTo(fToX(centre - fin), sBase);
          ctx.lineTo(fToX(centre), sTop + 8);
          ctx.lineTo(fToX(centre + fin), sBase);
          ctx.closePath();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = 1;
        };

        // replicas at ±k·fs
        for (let k = 1; k <= 2; k++) {
          triangle(k * fs, c.violet, 0.45);
          triangle(-k * fs, c.violet, 0.25);
        }

        // highlight the overlap region
        if (!ok) {
          ctx.fillStyle = 'rgba(255,92,122,.18)';
          ctx.fillRect(fToX(fs - fin), sTop, Math.max(0, fToX(fin) - fToX(fs - fin)), sBase - sTop);
          label(ctx, 'overlap = aliasing', (fToX(fs - fin) + fToX(fin)) / 2, (sTop + sBase) / 2, c.red, 9.5, 'center', true);
        }
        triangle(0, c.cyan, 0.55);

        for (let f = 0; f <= fMax; f += Math.max(10, Math.round(fMax / 6 / 10) * 10)) {
          label(ctx, `${f}`, fToX(f), sBase + 8, c.textDim, 8.5, 'center');
        }
        label(ctx, 'spectrum — replicas every fs', x0 + 2, sTop - 4, c.text, 9, 'left', true);
        ctx.restore();
      }
    },
    [fin, fs, dur, ok, aliasFreq, showRecon, showSpec],
  );

  return (
    <LabShell
      title="Sampling & aliasing laboratory"
      description="Change the input tone or the sampling rate and watch the reconstruction succeed — then deliberately fail it."
      accent="var(--cyan)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={status}
      readouts={makeReadouts([
        { label: 'Nyquist rate 2·f_max', value: `${nyquist.toFixed(1)} Hz`, tone: 'info' },
        { label: 'Sampling rate', value: `${fs.toFixed(0)} Hz`, tone: 'info' },
        { label: 'fs / 2f_max', value: `${ratio.toFixed(2)}×`, tone: ok ? 'good' : 'bad' },
        { label: 'Samples per cycle', value: (fs / fin).toFixed(1), tone: 'info' },
        { label: 'Reconstructed frequency', value: `${(ok ? fin : aliasFreq).toFixed(2)} Hz`, tone: ok ? 'good' : 'bad' },
      ])}
    >
      <VizCanvas draw={draw} height={330} label="Analogue sine wave with sample points and sinc reconstruction, plus a spectral replica diagram" />
    </LabShell>
  );
}

/* ==========================================================================
   2 — Sample & hold: natural vs flat-top, aperture, droop
   ========================================================================== */

export function SampleHoldScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { fin: 2, fs: 24, aperture: 12, droop: 15, mode: 'flat-top' };
  const { values, set, reset } = useLabValues(key_ ?? 'sample-hold', { ...defaults, ...(overrides ?? {}) });

  const fin = num(values.fin, 2);
  const fs = num(values.fs, 24);
  const aperture = num(values.aperture, 12); // % of one sample period
  const droop = num(values.droop, 15); // % decay across the hold interval
  const mode = str(values.mode, 'flat-top');

  const specs: Control[] = [
    { kind: 'slider', id: 'fin', label: 'Input frequency', min: 0.5, max: 6, step: 0.1, unit: ' Hz' },
    { kind: 'slider', id: 'fs', label: 'Sampling frequency', min: 6, max: 60, step: 1, unit: ' Hz' },
    { kind: 'slider', id: 'aperture', label: 'Aperture time', min: 2, max: 60, step: 1, unit: ' % of T_s', hint: 'Fraction of the sample interval the switch stays closed.' },
    { kind: 'slider', id: 'droop', label: 'Droop across hold', min: 0, max: 50, step: 1, unit: ' %' },
    {
      kind: 'select',
      id: 'mode',
      label: 'Sampling method',
      options: [
        { value: 'natural', label: 'Natural sampling' },
        { value: 'flat-top', label: 'Flat-top (sample & hold)' },
        { value: 'both', label: 'Show both' },
      ],
    },
  ];

  /** Average of a sine over [t-a, t+a] — the flat-top sample value. */
  const flatSample = useCallback(
    (t: number) => {
      const a = (aperture / 100) / fs / 2;
      if (a <= 0) return Math.sin(2 * Math.PI * fin * t);
      return Math.sin(2 * Math.PI * fin * t) * (Math.sin(Math.PI * 2 * fin * a) / (Math.PI * 2 * fin * a));
    },
    [fin, aperture, fs],
  );

  const apertureErrorPct = useDerived(() => {
    const a = (aperture / 100) / fs;
    const factor = Math.abs(Math.sin(Math.PI * fin * a) / (Math.PI * fin * a));
    return (1 - factor) * 100;
  }, [fin, aperture, fs]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const midY = h / 2;
      const toX = (t: number) => x0 + (t / 1) * (x1 - x0);
      const toY = (v: number) => midY - v * h * 0.36;

      grid(ctx, w, h);
      axisX(ctx, w, midY, 'time');

      const sig = SINE_FN(fin);
      const n = Math.max(60, Math.floor(fs));
      const times = tGrid(1, 500);

      // natural samples: instantaneous values
      const natX: number[] = [];
      const natY: number[] = [];
      for (let i = 0; i <= n; i++) {
        const t = i / fs;
        if (t > 1) break;
        natX.push(t);
        natY.push(sig(t));
      }

      if (mode === 'natural' || mode === 'both') {
        // pulse tops that follow the waveform during the aperture
        ctx.save();
        ctx.fillStyle = `${c.magenta}22`;
        ctx.strokeStyle = c.magenta;
        ctx.lineWidth = 1.4;
        const pw = (aperture / 100) / fs;
        for (let i = 0; i < natX.length; i++) {
          const tc = natX[i]!;
          const xa = toX(Math.max(0, tc - pw / 2));
          const xb = toX(Math.min(1, tc + pw / 2));
          ctx.beginPath();
          for (let x = xa; x <= xb; x += 2) {
            const y = toY(sig(toTime(x)));
            if (x === xa) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.lineTo(xb, midY + h * 0.12);
          ctx.lineTo(xa, midY + h * 0.12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
        label(ctx, 'natural sampling (ideal)', x0 + 2, 12, c.magenta, 9.5, 'left', true);
      }

      if (mode === 'flat-top' || mode === 'both') {
        // zero-order hold with droop
        ctx.save();
        ctx.strokeStyle = c.gold;
        ctx.lineWidth = 2;
        ctx.shadowColor = c.gold;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        for (let i = 0; i < natX.length; i++) {
          const t0 = natX[i]!;
          const t1 = i + 1 < natX.length ? natX[i + 1]! : 1;
          const v0 = flatSample(t0) * (1 - droop / 200);
          const v1 = flatSample(t1) * (1 - droop / 200);
          const X0 = toX(t0);
          const X1 = toX(t1);
          ctx.moveTo(X0, toY(v0));
          ctx.lineTo(X1, toY(v1));
        }
        ctx.stroke();
        ctx.restore();
        label(ctx, 'flat-top + droop', x0 + 2, mode === 'both' ? 26 : 12, c.gold, 9.5, 'left', true);
      }

      // true signal, drawn on top at reduced weight
      ctx.save();
      ctx.globalAlpha = 0.45;
      glow(ctx, c.cyan, 1.3);
      polyline(ctx, times, times.map(sig), toX, toY, 1);
      ctx.restore();

      // aperture markers
      ctx.save();
      ctx.strokeStyle = `${c.gold}77`;
      ctx.setLineDash([3, 3]);
      const pw = (aperture / 100) / fs;
      for (let i = 0; i < natX.length && i < 14; i++) {
        const tc = natX[i]!;
        ctx.beginPath();
        ctx.moveTo(toX(tc - pw / 2), midY - h * 0.46);
        ctx.lineTo(toX(tc + pw / 2), midY - h * 0.46);
        ctx.stroke();
      }
      ctx.restore();
      label(ctx, 'aperture window', x1 - 2, midY - h * 0.44, c.textDim, 8.5, 'right');

      function toTime(px: number) {
        return D.clamp((px - x0) / (x1 - x0), 0, 1);
      }
    },
    [fin, fs, aperture, droop, mode, flatSample],
  );

  return (
    <LabShell
      title="Sample-and-hold laboratory"
      description="Natural versus flat-top sampling, with aperture distortion and droop made visible and measured."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: apertureErrorPct > 3 ? 'warn' : 'ok',
        text: `Aperture distortion currently costs ${apertureErrorPct.toFixed(2)} % peak amplitude error, and it grows linearly with input frequency. Droop adds a further ${droop.toFixed(0)} % decay across each hold interval — a separate error that aperture compensation cannot remove.`,
      }}
      readouts={makeReadouts([
        { label: 'Sample period', value: `${(1 / fs * 1000).toFixed(1)} ms`, tone: 'info' },
        { label: 'Aperture time', value: `${((aperture / 100) / fs * 1000).toFixed(3)} ms`, tone: 'info' },
        { label: 'Aperture error', value: `${apertureErrorPct.toFixed(2)} %`, tone: apertureErrorPct > 3 ? 'warn' : 'good' },
        { label: 'Droop per hold', value: `${droop.toFixed(0)} %`, tone: droop > 5 ? 'warn' : 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={300} label="Natural versus flat-top sampling of a sine, showing aperture windows and droop" />
    </LabShell>
  );
}

/* ==========================================================================
   3 — Regeneration vs amplification, and multiplexing
   ========================================================================== */

export function RegenerationScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { hops: 3, noise: 22, threshold: 0.25, showMux: false, source: 'sine' };
  const { values, set, reset } = useLabValues(key_ ?? 'regeneration', { ...defaults, ...(overrides ?? {}) });

  const hops = Math.round(num(values.hops, 3));
  const noise = num(values.noise, 22);
  const threshold = num(values.threshold, 0.25);
  const showMux = bool(values.showMux);
  const source = str(values.source, 'sine');

  const specs: Control[] = [
    { kind: 'slider', id: 'hops', label: 'Number of repeater hops', min: 1, max: 6, step: 1, hint: 'Each hop adds fresh noise to the analogue chain only.' },
    { kind: 'slider', id: 'noise', label: 'Noise added per hop', min: 0, max: 60, step: 1, unit: ' %' },
    { kind: 'slider', id: 'threshold', label: 'Decision threshold', min: 0.05, max: 0.7, step: 0.01, format: (v) => v.toFixed(2) },
    {
      kind: 'select',
      id: 'source',
      label: 'Source signal',
      options: [
        { value: 'sine', label: 'Analogue sine' },
        { value: 'bits', label: 'Digital bit stream' },
      ],
    },
    { kind: 'toggle', id: 'showMux', label: 'Show TDM multiplexing' },
  ];

  /** Analogue chain: noise accumulates as powers; digital chain: it does not. */
  const analogueNoise = useDerived(() => Math.sqrt(hops) * (noise / 100), [hops, noise]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const laneH = showMux ? h / 3 : h / 2;

      const drawLane = (top: number, title: string, noisy: boolean, color: string) => {
        const midY = top + laneH / 2;
        grid(ctx, w, laneH, 30);
        axisX(ctx, w, midY);
        label(ctx, title, x0 + 2, top + 12, color, 10, 'left', true);

        const rand = D.createRng(0xc0ffee + hops * 31 + noise);
        const N = 420;
        ctx.save();
        glow(ctx, color, 1.7);
        ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          let v: number;
          if (source === 'sine') {
            v = Math.sin(2 * Math.PI * 1.5 * u + t * 1.2);
          } else {
            const bitIndex = Math.floor(u * 12) % 2;
            v = bitIndex === 1 ? 1 : -1;
          }
          if (noisy) v += D.gaussian(rand) * analogueNoise * 0.5;
          const y = midY - v * laneH * 0.3;
          if (i === 0) ctx.moveTo(x0 + u * (x1 - x0), y);
          else ctx.lineTo(x0 + u * (x1 - x0), y);
        }
        ctx.stroke();
        ctx.restore();

        // repeater markers
        ctx.save();
        for (let k = 1; k <= hops; k++) {
          const px = x0 + (k / (hops + 1)) * (x1 - x0);
          ctx.strokeStyle = 'rgba(255,255,255,.18)';
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(px, top + 18);
          ctx.lineTo(px, top + laneH - 4);
          ctx.stroke();
          label(ctx, `hop ${k}`, px + 3, top + laneH - 8, c.textDim, 8);
        }
        ctx.restore();
        return midY;
      };

      drawLane(0, 'ANALOGUE — amplifier per hop (noise accumulates)', true, c.red);

      const midY2 = drawLane(laneH, 'DIGITAL — regenerative repeater per hop (noise discarded)', false, c.green);

      // decision threshold band
      ctx.save();
      ctx.strokeStyle = c.gold;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, midY2 - threshold * laneH * 0.3);
      ctx.lineTo(x1, midY2 - threshold * laneH * 0.3);
      ctx.stroke();
      label(ctx, `decision threshold ${threshold.toFixed(2)}`, x1 - 2, midY2 - threshold * laneH * 0.3 - 8, c.gold, 9, 'right');
      ctx.restore();

      if (showMux) {
        const top = laneH * 2;
        const midY = top + laneH / 2;
        grid(ctx, w, laneH, 30);
        label(ctx, 'TDM — three channels interleaved then separated', x0 + 2, top + 12, c.violet, 10, 'left', true);
        const slotW = (x1 - x0) / 12;
        const chans = [
          { name: 'A', color: c.cyan },
          { name: 'B', color: c.gold },
          { name: 'C', color: c.magenta },
        ];
        for (let i = 0; i < 12; i++) {
          const ch = chans[i % 3]!;
          const px = x0 + i * slotW;
          ctx.fillStyle = `${ch.color}33`;
          ctx.fillRect(px, top + 22, slotW - 1, laneH - 40);
          ctx.strokeStyle = ch.color;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let p = 0; p <= slotW; p += 2) {
            const u = (i + p / slotW) * 2.2;
            const y = midY - Math.sin(2 * Math.PI * (0.6 + (i % 3) * 0.4) * u + t) * laneH * 0.16;
            if (p === 0) ctx.moveTo(px + p, y);
            else ctx.lineTo(px + p, y);
          }
          ctx.stroke();
          label(ctx, ch.name, px + slotW / 2, top + laneH - 10, ch.color, 8.5, 'center');
        }
      }
    },
    [hops, noise, threshold, source, showMux, analogueNoise],
  );

  const readouts = makeReadouts([
    { label: 'Analogue out-of-band noise', value: `√${hops} × hop noise`, tone: 'bad' },
    { label: 'Digital noise at output', value: '0 (discarded)', tone: 'good' },
    { label: 'Hops', value: String(hops), tone: 'info' },
    { label: 'Decision threshold', value: threshold.toFixed(2), tone: 'info' },
  ]);

  return (
    <LabShell
      title="Regeneration versus amplification"
      description="The same noise pushed through an analogue chain and a digital chain with identical repeaters."
      accent="var(--green)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text: 'Noise power adds in the analogue chain (total amplitude grows as √N). The digital repeater makes a decision at the threshold and re-emits a clean level, so nothing accumulates. This is the structural reason digital links do not degrade with distance.',
      }}
      readouts={readouts}
    >
      <VizCanvas draw={draw} height={330} label="Two signal chains compared: analogue amplification accumulating noise, digital regeneration discarding it" />
    </LabShell>
  );
}

/* ==========================================================================
   4 — SNR and BER
   ========================================================================== */

export function SnrBerScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { ebn0: 9, bits: 24, scheme: 'BPSK' };
  const { values, set, reset } = useLabValues(key_ ?? 'snr-ber', { ...defaults, ...(overrides ?? {}) });

  const ebn0 = num(values.ebn0, 9);
  const bitCount = Math.round(num(values.bits, 24));
  const scheme = str(values.scheme, 'BPSK');

  const specs: Control[] = [
    { kind: 'slider', id: 'ebn0', label: 'Eb/N0', min: 0, max: 16, step: 0.5, unit: ' dB' },
    { kind: 'slider', id: 'bits', label: 'Bits transmitted per run', min: 8, max: 512, step: 8, unit: ' bits', hint: 'More bits → a tighter empirical estimate. A short run cannot resolve a small BER.' },
    {
      kind: 'select',
      id: 'scheme',
      label: 'Scheme',
      options: [
        { value: 'BPSK', label: 'Coherent BPSK' },
        { value: 'BFSK', label: 'Coherent orthogonal BFSK' },
        { value: 'NC-BFSK', label: 'Non-coherent BFSK' },
      ],
    },
  ];

  const theory = useDerived(() => {
    const lin = D.dbToPower(ebn0);
    switch (scheme) {
      case 'BFSK':
        return 0.5 * D.qFunction(Math.sqrt(lin));
      case 'NC-BFSK':
        return 0.5 * Math.exp(-0.5 * lin);
      default:
        return D.qFunction(Math.sqrt(2 * lin));
    }
  }, [ebn0, scheme]);

  /** Deterministic "channel": a seeded flip process with probability = theory. */
  const run = useDerived(() => {
    const rand = D.createRng(0xbeef + Math.round(ebn0 * 100) + scheme.length * 7);
    const txBits: number[] = [];
    const rxBits: number[] = [];
    for (let i = 0; i < bitCount; i++) {
      const bit = Math.floor(rand() * 2);
      txBits.push(bit);
      // Each bit flips with probability equal to the theoretical BER.
      rxBits.push(rand() < theory ? bit ^ 1 : bit);
    }
    let errors = 0;
    for (let i = 0; i < bitCount; i++) if (txBits[i] !== rxBits[i]) errors++;
    return { txBits, rxBits, errors, total: bitCount, ber: bitCount ? errors / bitCount : 0, ci: wilson(errors, bitCount) };
  }, [ebn0, scheme, bitCount, theory]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const padL = 46;
      const padB = 26;
      const padT = 14;
      const pw = w - padL - 10;
      const ph = h - padT - padB;
      const xMax = 16;
      const yMinLog = -7;
      const X = (db: number) => padL + (db / xMax) * pw;
      const Y = (ber: number) => {
        const l = Math.max(yMinLog, Math.log10(Math.max(ber, 1e-7)));
        return padT + ((0 - l) / (0 - yMinLog)) * ph;
      };

      ctx.save();
      ctx.strokeStyle = c.grid;
      ctx.lineWidth = 1;
      for (let db = 0; db <= xMax; db += 2) {
        ctx.beginPath();
        ctx.moveTo(X(db), padT);
        ctx.lineTo(X(db), padT + ph);
        ctx.stroke();
        label(ctx, `${db}`, X(db), padT + ph + 12, c.textDim, 8.5, 'center');
      }
      for (let e = 0; e >= yMinLog; e -= 1) {
        ctx.beginPath();
        ctx.moveTo(padL, Y(10 ** e));
        ctx.lineTo(padL + pw, Y(10 ** e));
        ctx.stroke();
        label(ctx, `1e${e}`, padL - 5, Y(10 ** e), c.textDim, 8, 'right');
      }
      ctx.strokeStyle = c.axis;
      ctx.strokeRect(padL, padT, pw, ph);

      // theoretical curves for all three schemes, for comparison
      const curves: { name: string; color: string; fn: (db: number) => number }[] = [
        { name: 'BPSK', color: c.cyan, fn: (db) => D.qFunction(Math.sqrt(2 * D.dbToPower(db))) },
        { name: 'coherent BFSK', color: c.gold, fn: (db) => 0.5 * D.qFunction(Math.sqrt(D.dbToPower(db))) },
        { name: 'non-coherent BFSK', color: c.magenta, fn: (db) => 0.5 * Math.exp(-0.5 * D.dbToPower(db)) },
      ];

      for (const curve of curves) {
        ctx.strokeStyle = curve.color;
        ctx.globalAlpha = curve.name === scheme ? 1 : 0.28;
        ctx.lineWidth = curve.name === scheme ? 2.4 : 1.2;
        ctx.setLineDash(curve.name === scheme ? [] : [4, 3]);
        ctx.beginPath();
        for (let i = 0; i <= pw; i += 2) {
          const db = (i / pw) * xMax;
          const y = Y(curve.fn(db));
          if (i === 0) ctx.moveTo(X(db), y);
          else ctx.lineTo(X(db), y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // empirical point with confidence band
      ctx.fillStyle = `${c.green}22`;
      ctx.fillRect(X(ebn0) - 3, Y(run.ci.high), 6, Math.max(1, Y(run.ci.low) - Y(run.ci.high)));
      ctx.fillStyle = c.green;
      ctx.shadowColor = c.green;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(X(ebn0), Y(run.ber), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      label(ctx, `BER vs Eb/N0 — ${scheme}`, padL, 10, c.text, 10, 'left', true);
      label(ctx, 'Eb/N0 (dB)', padL + pw / 2, h - 4, c.textDim, 9, 'center');
      label(ctx, '95 % interval shown as the green band', padL + pw, 10, c.green, 8.5, 'right');
    },
    [ebn0, scheme, run],
  );

  const drawBits = useCallback(
    (ctx: CanvasRenderingContext2D, w: number) => {
      const c = themeColors();
      const n = run.total;
      const colW = (w - 16) / n;
      label(ctx, 'transmitted', 8, 12, c.textDim, 9);
      label(ctx, 'received', 8, 30, c.textDim, 9);
      for (let i = 0; i < n; i++) {
        const x = 8 + i * colW;
        ctx.fillStyle = run.txBits[i] === 1 ? c.cyan : c.gray;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x, 16, Math.max(1, colW - 0.5), 9);
        const wrong = run.rxBits[i] !== run.txBits[i];
        ctx.globalAlpha = 1;
        ctx.fillStyle = wrong ? c.red : run.rxBits[i] === 1 ? c.cyan : c.gray;
        ctx.fillRect(x, 34, Math.max(1, colW - 0.5), 9);
      }
      ctx.globalAlpha = 1;
    },
    [run],
  );

  return (
    <LabShell
      title="SNR and BER laboratory"
      description="Theory curves against a deterministic simulated channel, with an honest confidence interval on the measurement."
      accent="var(--cyan)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: run.errors > 0 ? 'warn' : 'ok',
        text: `${run.errors} error${run.errors === 1 ? '' : 's'} in ${run.total} bits → empirical BER ${run.ber.toExponential(2)}. The 95 % interval is ${run.ci.low.toExponential(1)} to ${run.ci.high.toExponential(1)}, which is how much this run can actually tell you. Theory predicts ${theory.toExponential(2)}.`,
      }}
      readouts={makeReadouts([
        { label: 'Theoretical BER', value: theory.toExponential(2), tone: 'info' },
        { label: 'Empirical BER', value: run.ber.toExponential(2), tone: run.errors > 0 ? 'warn' : 'good' },
        { label: 'Errors observed', value: `${run.errors} / ${run.total}`, tone: 'info' },
        { label: '95 % interval', value: `${run.ci.low.toExponential(1)} … ${run.ci.high.toExponential(1)}`, tone: 'info' },
      ])}
    >
      <div className="space-y-2">
        <VizCanvas draw={draw} height={230} label="Bit error rate versus Eb/N0 for three binary schemes, with an empirical measurement" />
        <div className="rounded-xl border bord-soft">
          <VizCanvas draw={drawBits} height={50} label="Transmitted and received bit sequence with errors highlighted" isStatic />
        </div>
      </div>
    </LabShell>
  );
}

function wilson(errors: number, total: number, z = 1.96) {
  if (total === 0) return { low: 0, high: 1 };
  const p = errors / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return { low: Math.max(0, (centre - spread) / denom), high: Math.min(1, (centre + spread) / denom) };
}

/* ==========================================================================
   5 — PAM / PWM / PPM
   ========================================================================== */

export function PulseModScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { kind: 'PAM', fs: 8, dur: 1 };
  const { values, set, reset } = useLabValues(key_ ?? 'pulse-mod', { ...defaults, ...(overrides ?? {}) });

  const kind = str(values.kind, 'PAM');
  const fs = num(values.fs, 8);
  const dur = num(values.dur, 1);

  const specs: Control[] = [
    {
      kind: 'select',
      id: 'kind',
      label: 'Scheme',
      options: [
        { value: 'PAM', label: 'PAM — pulse amplitude' },
        { value: 'PWM', label: 'PWM / PDM — pulse width' },
        { value: 'PPM', label: 'PPM / PLM — pulse position' },
      ],
    },
    { kind: 'slider', id: 'fs', label: 'Pulse repetition rate', min: 3, max: 24, step: 1, unit: ' pulses/s' },
  ];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const n = Math.max(4, Math.round(fs * dur));
      const topLane = h * 0.42;
      const toX = (t: number) => x0 + t * (x1 - x0);

      grid(ctx, w, topLane);
      axisX(ctx, w, topLane / 2);
      label(ctx, 'message  m(t)', x0 + 2, 11, c.cyan, 10, 'left', true);

      const sig = SINE_FN(1.2);
      ctx.save();
      glow(ctx, c.cyan, 1.6);
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const u = i / 240;
        const y = topLane / 2 - sig(u) * topLane * 0.34;
        if (i === 0) ctx.moveTo(toX(u), y);
        else ctx.lineTo(toX(u), y);
      }
      ctx.stroke();
      ctx.restore();

      // pulse train lane
      const laneTop = topLane + 6;
      const laneH = h - laneTop;
      grid(ctx, w, laneH);
      const baseY = laneTop + laneH * 0.86;
      label(ctx, `${kind} pulse train`, x0 + 2, laneTop + 11, c.gold, 10, 'left', true);

      const slotW = (x1 - x0) / n;
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.setLineDash([3, 4]);
      for (let i = 0; i <= n; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + i * slotW, laneTop + 18);
        ctx.lineTo(x0 + i * slotW, baseY + 4);
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = c.gold;
      ctx.fillStyle = `${c.gold}33`;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = c.gold;
      ctx.shadowBlur = 4;
      for (let i = 0; i < n; i++) {
        const sample = sig(((i + 0.5) / n));
        const norm = (sample + 1) / 2;
        const sx = x0 + i * slotW;

        if (kind === 'PAM') {
          const hgt = Math.max(2, sample * laneH * 0.42);
          ctx.fillStyle = `${c.gold}44`;
          ctx.fillRect(sx + slotW * 0.1, baseY - Math.max(0, hgt), slotW * 0.8, Math.max(0, hgt));
          ctx.fillStyle = `${c.gold}88`;
          ctx.fillRect(sx + slotW * 0.1, baseY + Math.max(0, -hgt) * 0 - laneH * 0.42, slotW * 0.8, Math.max(0, -hgt));
        } else if (kind === 'PWM') {
          const wdt = norm * slotW * 0.85;
          ctx.fillStyle = `${c.gold}66`;
          ctx.fillRect(sx + slotW * 0.08, laneTop + 20, wdt, laneH * 0.36);
        } else {
          const pw = slotW * 0.2;
          const pos = norm * (slotW - pw);
          ctx.fillStyle = `${c.gold}88`;
          ctx.fillRect(sx + slotW * 0.05 + pos, laneTop + 20, pw, laneH * 0.36);
        }
      }
      ctx.restore();

      label(ctx, 'time →', x1 - 2, baseY + 12, c.textDim, 9, 'right');
    },
    [kind, fs, dur],
  );

  return (
    <LabShell
      title="PAM / PWM / PPM comparator"
      description="The same message, drawn three ways: amplitude, width and position."
      accent="var(--gold)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text:
          kind === 'PAM'
            ? 'PAM carries a continuous amplitude, so noise on the pulse height stays in the signal — it is analogue pulse modulation, not a code.'
            : kind === 'PWM'
              ? 'PWM carries the sample as a pulse duration, so the receiver measures time rather than amplitude and becomes immune to amplitude noise.'
              : 'PPM is PWM with the leading edge discarded: only the pulse position carries the sample. Average power is lower than PWM for the same information.',
      }}
      readouts={makeReadouts([
        { label: 'Pulse rate', value: `${fs} /s`, tone: 'info' },
        { label: 'Information parameter', value: kind === 'PAM' ? 'amplitude' : kind === 'PWM' ? 'width' : 'position', tone: 'info' },
        { label: 'Signal type', value: 'analogue pulse modulation', tone: 'warn' },
        { label: 'PCM bit rate at 8 bits', value: `${(fs * 8).toFixed(0)} bit/s`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={300} label="Message waveform above a PAM, PWM or PPM pulse train depending on the selection" />
    </LabShell>
  );
}

/* ==========================================================================
   6 — PCM block diagram
   ========================================================================== */

export function PcmChainScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { bits: 8, fs: 8, animate: true, fin: 0.9 };
  const { values, set, reset } = useLabValues(key_ ?? 'pcm-chain', { ...defaults, ...(overrides ?? {}) });

  const bits = Math.round(num(values.bits, 8));
  const fs = num(values.fs, 8);
  const fin = num(values.fin, 0.9);
  const animate = bool(values.animate, true);

  const specs: Control[] = [
    { kind: 'slider', id: 'bits', label: 'Bits per sample', min: 2, max: 12, step: 1, unit: ' bits' },
    { kind: 'slider', id: 'fs', label: 'Sampling rate', min: 2, max: 40, step: 1, unit: ' samples/s' },
    { kind: 'slider', id: 'fin', label: 'Input frequency', min: 0.2, max: 2, step: 0.1, unit: ' Hz' },
    { kind: 'toggle', id: 'animate', label: 'Animate the sample travelling' },
  ];

  const blockNames = [
    { n: 'Analogue in', c: 'var(--cyan)' },
    { n: 'Anti-alias LPF', c: 'var(--cyan)' },
    { n: 'Sample & hold', c: 'var(--gold)' },
    { n: 'ADC / quantiser', c: 'var(--magenta)' },
    { n: 'Encoder', c: 'var(--violet)' },
    { n: 'Digital channel', c: 'var(--green)' },
    { n: 'Decoder', c: 'var(--violet)' },
    { n: 'DAC', c: 'var(--magenta)' },
    { n: 'Reconstruction LPF', c: 'var(--gold)' },
    { n: 'Analogue out', c: 'var(--cyan)' },
  ];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
      const c = themeColors();
      const rows = 2;
      const perRow = 5;
      const padY = 14;
      const boxH = Math.min(34, (h - padY * 3) / rows - 12);
      const gap = 8;
      const boxW = (w - 20 - gap * (perRow - 1)) / perRow;

      const pos = blockNames.map((_, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        return {
          x: 10 + col * (boxW + gap),
          y: padY + row * (boxH + 30),
          w: boxW,
          h: boxH,
        };
      });

      // stage progression
      const progress = animate ? (t * 0.55) % 1 : 0;
      const activeIndex = Math.min(blockNames.length - 1, Math.floor(progress * blockNames.length));

      ctx.save();
      blockNames.forEach((b, i) => {
        const p = pos[i]!;
        const hot = i === activeIndex;
        ctx.fillStyle = hot ? 'rgba(0,240,255,.14)' : 'rgba(255,255,255,.03)';
        ctx.strokeStyle = hot ? c.cyan : c.axis;
        ctx.lineWidth = hot ? 1.8 : 1;
        roundRect(ctx, p.x, p.y, p.w, p.h, 7);
        ctx.fill();
        ctx.stroke();
        label(ctx, b.n, p.x + p.w / 2, p.y + p.h / 2, hot ? c.cyan : c.text, 8.6, 'center');
      });

      // connectors
      ctx.strokeStyle = c.axis;
      ctx.lineWidth = 1.2;
      blockNames.forEach((_, i) => {
        const p = pos[i]!;
        if (i % perRow === perRow - 1 && i !== blockNames.length - 1) {
          // wrap down
          const next = pos[i + 1]!;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y + p.h);
          ctx.lineTo(p.x + p.w / 2, p.y + p.h + 14);
          ctx.lineTo(next.x + next.w / 2, p.y + p.h + 14);
          ctx.lineTo(next.x + next.w / 2, next.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y + p.h + 5);
          ctx.lineTo(p.x + p.w / 2 + 3, p.y + p.h);
          ctx.lineTo(p.x + p.w / 2 - 3, p.y + p.h);
          ctx.closePath();
          ctx.fillStyle = c.axis;
          ctx.fill();
        } else if (i !== blockNames.length - 1) {
          const next = pos[i + 1]!;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w, p.y + p.h / 2);
          ctx.lineTo(next.x - 3, p.y + p.h / 2);
          ctx.stroke();
        }
      });

      // travelling sample dot
      if (animate) {
        const p = pos[activeIndex]!;
        const f = progress * blockNames.length - activeIndex;
        const px = p.x + f * p.w;
        ctx.fillStyle = c.gold;
        ctx.shadowColor = c.gold;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, p.y + p.h / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    [animate],
  );

  return (
    <LabShell
      title="PCM system block diagram"
      description="Every stage from analogue voltage to analogue voltage, with the sample visibly travelling the chain."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text: 'Only the quantiser introduces an irreversible error. Filters remove out-of-band content, the sample-and-hold freezes the input during conversion, and the encoder merely expresses the level index in binary.',
      }}
      readouts={makeReadouts([
        { label: 'Samples per second', value: String(fs), tone: 'info' },
        { label: 'Levels 2^n', value: String(2 ** bits), tone: 'info' },
        { label: 'Raw PCM bit rate', value: `${(fs * bits).toFixed(0)} bit/s`, tone: 'info' },
        { label: 'Input frequency', value: `${fin} Hz`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={190} label="PCM transmit and receive block diagram with an animated sample" />
    </LabShell>
  );
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}