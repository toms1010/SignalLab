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
import { roundRect } from '@/components/visualizations/scenes/modules12';
import type { ControlValues, Readout } from '@/types';

const SINE = (f = 2, a = 1) => (t: number) => a * Math.sin(2 * Math.PI * f * t);

/* ==========================================================================
   Quantiser with a draggable probe and live code display
   ========================================================================== */

export function QuantizerScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { bits: 4, vfsr: 2, amp: 0.85, kind: 'midrise', probe: 0.5, code: true, vmin: -1 };
  const { values, set, reset } = useLabValues(key_ ?? 'quantizer', { ...defaults, ...(overrides ?? {}) });

  const bits = Math.round(num(values.bits, 4));
  const vfsr = num(values.vfsr, 2);
  const vmin = num(values.vmin, -1);
  const amp = num(values.amp, 0.85);
  const kind = str(values.kind, 'midrise');
  const probeT = num(values.probe, 0.5);
  const showCode = bool(values.code, true);

  const step = (vfsr - vmin) / 2 ** bits;

  const specs: Control[] = [
    { kind: 'slider', id: 'bits', label: 'Bit depth', min: 1, max: 10, step: 1, unit: ' bits' },
    { kind: 'slider', id: 'vmin', label: 'Input range minimum', min: -2, max: 0, step: 0.25, unit: ' V' },
    { kind: 'slider', id: 'vfsr', label: 'Full-scale range', min: 0.5, max: 8, step: 0.25, unit: ' V', hint: 'Span from Vmin to Vmin + V_FSR.' },
    { kind: 'slider', id: 'amp', label: 'Input amplitude', min: 0.1, max: 2, step: 0.05, unit: ' V' },
    {
      kind: 'select',
      id: 'kind',
      label: 'Quantiser type',
      options: [
        { value: 'midrise', label: 'Midrise' },
        { value: 'midtread', label: 'Midtread' },
      ],
    },
    { kind: 'toggle', id: 'code', label: 'Show binary codes' },
  ];

  const range = useDerived(() => ({ vmin, vmax: vmin + vfsr }), [vmin, vfsr]);

  const quantise = useCallback(
    (x: number) => {
      const idx = D.clamp(Math.round((x - range.vmin) / step - 0.5), 0, 2 ** bits - 1);
      return { idx, value: kind === 'midtread' ? range.vmin + idx * step : range.vmin + (idx + 0.5) * step };
    },
    [step, bits, kind, range],
  );

  const probeValue = useDerived(() => {
    // Probe sits at a fixed fraction of the visible window and reports the
    // instantaneous input value there — deterministic and easy to reason about.
    const sig = SINE(1, amp);
    return sig(probeT);
  }, [probeT, amp]);

  const probe = useDerived(() => quantise(probeValue), [probeValue, quantise]);
  const signMag = useDerived(
    () => D.signMagCode(probeValue, vfsr, bits, kind as D.QuantizerKind),
    [probeValue, vfsr, bits, kind],
  );
  const sqnrTheory = useDerived(() => D.sqnrFullScaleDb(bits), [bits]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const midY = h / 2;
      const span = vfsr * 1.15;
      const toX = (v: number) => x0 + ((v - (range.vmin - span * 0.15)) / (span * 1.3)) * (x1 - x0);
      const toY = (v: number) => midY - ((v - range.vmin) / (vfsr || 1)) * h * 0.4;

      grid(ctx, w, h);
      axisX(ctx, w, midY, '0 V');

      // level grid
      ctx.save();
      for (let i = 0; i <= 2 ** bits && i < 300; i++) {
        const v = kind === 'midtread' ? range.vmin + i * step : range.vmin + (i + 0.5) * step;
        if (v > range.vmax + step) break;
        const y = toY(v);
        ctx.strokeStyle = i % 2 === 0 ? `${c.cyan}22` : `${c.cyan}14`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.stroke();
      }
      ctx.restore();

      // range limits
      ctx.save();
      ctx.strokeStyle = c.red;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, toY(range.vmin));
      ctx.lineTo(x1, toY(range.vmin));
      ctx.moveTo(x0, toY(range.vmax));
      ctx.lineTo(x1, toY(range.vmax));
      ctx.stroke();
      ctx.restore();

      const times: number[] = [];
      const input: number[] = [];
      const output: number[] = [];
      const N = 400;
      const sig = SINE(1, amp);
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const t = u * 1.2;
        times.push(t);
        input.push(sig(t));
        output.push(quantise(sig(t)).value);
      }

      // staircase
      ctx.save();
      glow(ctx, c.magenta, 2);
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = toX(input[i]!);
        const y = toY(output[i]!);
        if (i === 0) ctx.moveTo(x, y);
        else {
          ctx.lineTo(x, toY(output[i - 1]!));
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.restore();

      // input
      ctx.save();
      ctx.globalAlpha = 0.55;
      glow(ctx, c.cyan, 1.3);
      polyline(ctx, times, input, (t) => toX(sig(t)), toY, 1);
      ctx.restore();

      // probe
      const px = toX(probeValue);
      const py = toY(probeValue);
      const qy = toY(probe.value);
      ctx.save();
      ctx.strokeStyle = `${c.gold}88`;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(px, 8);
      ctx.lineTo(px, h - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = c.red;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = c.red;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(px + 8, py);
      ctx.lineTo(px + 8, qy);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = c.cyan;
      ctx.shadowColor = c.cyan;
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.magenta;
      ctx.shadowColor = c.magenta;
      ctx.beginPath();
      ctx.arc(px, qy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      label(ctx, `x = ${probeValue.toFixed(4)} V`, px, 12, c.cyan, 9.5, px > w * 0.6 ? 'right' : 'left', true);
      label(ctx, `x̂ = ${probe.value.toFixed(4)} V   e = ${(probeValue - probe.value).toFixed(4)} V`, px, h - 12, c.red, 9.5, px > w * 0.6 ? 'right' : 'left', true);
      label(ctx, `L = ${2 ** bits} levels · step = ${(step * 1000).toFixed(3)} mV`, x1 - 2, 12, c.text, 9.5, 'right');
    },
    [bits, kind, step, range, amp, probeValue, probe, quantise, vfsr],
  );

  return (
    <LabShell
      title="Uniform quantiser laboratory"
      description="Step size, levels, midrise vs midtread, saturation and the live binary code for the probed sample."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: probeValue < range.vmin || probeValue > range.vmax ? 'bad' : 'info',
        text:
          probeValue < range.vmin || probeValue > range.vmax
            ? `The probe sample (${probeValue.toFixed(3)} V) lies outside the input range, so the quantiser saturates. The error is then unbounded — the ±V_LSB/2 guarantee only applies inside the range.`
            : `Rounding to the nearest level bounds the error at ±V_LSB/2 = ±${(step / 2000).toFixed(4)} V. This is the only irreversible stage in the PCM chain.`,
      }}
      readouts={makeReadouts([
        { label: 'Levels L = 2^n', value: String(2 ** bits), tone: 'info' },
        { label: 'Step V_LSB', value: `${(step * 1000).toFixed(3)} mV`, tone: 'info' },
        { label: 'Max |error|', value: `${(step / 2000).toFixed(4)} V`, tone: 'info' },
        { label: 'SQNR (full-scale sine)', value: `${sqnrTheory.toFixed(1)} dB`, tone: 'info' },
        { label: 'Dynamic range', value: `${(20 * Math.log10(2 ** bits)).toFixed(1)} dB`, tone: 'info' },
        showCode
          ? { label: 'Sign-magnitude code', value: signMag.bits, tone: 'good' as const }
          : { label: 'Sign-magnitude code', value: '', tone: 'info' as const },
        showCode ? { label: 'Percent error', value: `${percentErr(probeValue, probe.value)} %`, tone: 'info' } : { label: 'Percent error', value: '', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={290} label="Uniform quantiser staircase under a sine input with a probe showing sample, level and error" />
    </LabShell>
  );
}

function percentErr(x: number, xh: number) {
  return x === 0 ? 0 : Math.abs(((x - xh) / x) * 100);
}

/* ==========================================================================
   Companding curve
   ========================================================================== */

export function CompandingScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { mu: 255, law: 'mu-law', showDb: false };
  const { values, set, reset } = useLabValues(key_ ?? 'companding', { ...defaults, ...(overrides ?? {}) });

  const mu = num(values.mu, 255);
  const law = str(values.law, 'mu-law');
  const showDb = bool(values.showDb);

  const specs: Control[] = [
    { kind: 'slider', id: 'mu', label: 'μ parameter', min: 0, max: 255, step: 1, format: (v) => String(Math.round(v)) },
    {
      kind: 'select',
      id: 'law',
      label: 'Law',
      options: [
        { value: 'mu-law', label: 'μ-law (G.711)' },
        { value: 'a-law', label: 'A-law (G.711)' },
      ],
    },
    { kind: 'toggle', id: 'showDb', label: 'Show gain in dB' },
  ];

  const apply = useCallback(
    (x: number) => (law === 'a-law' ? D.aLaw(x) : D.muLaw(x, mu)),
    [law, mu],
  );

  const gainDb = useDerived(() => {
    const y = apply(0.1);
    return 20 * Math.log10(Math.max(y, 1e-9) / 0.1);
  }, [apply]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const pad = 34;
      const toX = (v: number) => pad + ((v + 1) / 2) * (w - pad * 2);
      const toY = (v: number) => h - pad - ((v + 1) / 2) * (h - pad * 2);

      grid(ctx, w, h, 30);
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = `${c.gray}88`;
      ctx.beginPath();
      ctx.moveTo(toX(-1), toY(-1));
      ctx.lineTo(toX(1), toY(1));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // the curve
      ctx.save();
      glow(ctx, c.gold, 2.4);
      ctx.beginPath();
      for (let px = 0; px <= w - pad * 2; px += 2) {
        const x = (px / (w - pad * 2)) * 2 - 1;
        const y = apply(x);
        if (px === 0) ctx.moveTo(toX(x), toY(y));
        else ctx.lineTo(toX(x), toY(y));
      }
      ctx.stroke();
      ctx.restore();

      // gain marker at x = 0.1
      const mx = toX(0.1);
      const my = toY(apply(0.1));
      ctx.save();
      ctx.strokeStyle = `${c.cyan}88`;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(mx, toY(0.1));
      ctx.lineTo(mx, my);
      ctx.lineTo(toX(0), my);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = c.cyan;
      ctx.shadowColor = c.cyan;
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(mx, my, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      label(ctx, 'linear (no companding)', toX(0.66), toY(0.52), c.gray, 9);
      label(ctx, 'input amplitude x →', w - pad, h - 10, c.textDim, 9, 'right');
      label(ctx, 'compressed', pad + 2, pad - 8, c.gold, 10, 'left', true);
      label(ctx, `${law === 'a-law' ? 'A-law' : `μ = ${Math.round(mu)}`}  ·  gain at x=0.1: ${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB`, w - pad, pad - 8, c.cyan, 9.5, 'right', true);

      if (showDb) {
        // small dB gain inset along the bottom
        const gx0 = pad;
        const gx1 = w - pad;
        const gy = h - pad + 12;
        ctx.save();
        ctx.strokeStyle = c.violet;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let px = gx0; px <= gx1; px += 2) {
          const x = ((px - pad) / (w - pad * 2)) * 2 - 1;
          const a = Math.abs(x);
          const g = a < 1e-3 ? 0 : D.muLawDb(a, mu);
          const clamped = Math.max(-30, Math.min(30, g));
          const y = gy - (clamped + 30) / 60 * 20;
          if (px === gx0) ctx.moveTo(px, y);
          else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.restore();
        label(ctx, 'gain (dB) at each amplitude — large near zero', gx0, gy - 24, c.violet, 8.5);
      }
    },
    [apply, law, mu, gainDb, showDb],
  );

  return (
    <LabShell
      title="Companding transfer curve"
      description="Where the quantiser's resolution is spent. Drag μ from 1 (linear) toward 255 and watch resolution move toward zero."
      accent="var(--gold)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text: `At x = 0.1 the compressed value is ${apply(0.1).toFixed(4)}, i.e. ${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(1)} dB of gain. That is exactly why idle-channel hiss drops: quantisation error at small amplitudes is divided down before it reaches the quantiser.`,
      }}
      readouts={makeReadouts([
        { label: 'Law', value: law === 'a-law' ? 'A-law' : 'μ-law', tone: 'info' },
        { label: 'μ parameter', value: mu === 0 ? 'linear' : String(Math.round(mu)), tone: 'info' },
        { label: 'F(0.1)', value: apply(0.1).toFixed(4), tone: 'info' },
        { label: 'Gain at x = 0.1', value: `${gainDb >= 0 ? '+' : ''}${gainDb.toFixed(2)} dB`, tone: 'good' },
        { label: 'F(0.5)', value: apply(0.5).toFixed(4), tone: 'info' },
        { label: 'Exact inverse?', value: 'yes — F(±1) = ±1', tone: 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={290} label="Companding transfer characteristic with a small-signal gain marker" />
    </LabShell>
  );
}

/* ==========================================================================
   12-bit → 8-bit companded code walkthrough
   ========================================================================== */

export function CodecScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { linear: 0.62, stage: 0 };
  const { values, set, reset } = useLabValues(key_ ?? 'codec', { ...defaults, ...(overrides ?? {}) });

  const linear = num(values.linear, 0.62);
  const stage = Math.round(num(values.stage, 0));

  const stages = ['Sign', 'Segment', 'Interval', 'Reconstructed', 'Difference'];

  const specs: Control[] = [
    { kind: 'slider', id: 'linear', label: 'Input sample', min: -1.2, max: 1.2, step: 0.005, unit: ' V', hint: 'Moves through the pipeline; the stage buttons below control what is highlighted.' },
    { kind: 'slider', id: 'stage', label: 'Highlighted stage', min: 0, max: 4, step: 1, format: (v) => stages[Math.round(v)] ?? '' },
  ];

  /**
   * Documented segmentation model (stated in the lesson, not a claim to be
   * G.711): segment s spans |x| in [s/16, (s+1)/16) of full-scale for
   * s = 0..6, and s = 7 covers the outer half. Four interval bits give 16
   * levels inside whichever segment the sample lands in.
   */
  const result = useDerived(() => {
    const clamped = D.clamp(linear, -1, 1);
    const sign = clamped < 0 ? 1 : 0;
    const a = Math.abs(clamped);

    let segment = Math.min(7, Math.floor(a * 16));
    if (a >= 1) segment = 7;
    const segStart = segment >= 7 ? 0.5 : segment / 16;
    const segWidth = segment >= 7 ? 0.5 : 1 / 16;
    const segStep = segWidth / 16;
    const interval = D.clamp(Math.round((a - segStart) / segStep), 0, 15);
    const reconMag = segStart + interval * segStep;

    const code = `${sign}${D.toBin(segment, 3)}${D.toBin(interval, 4)}`;
    return {
      sign,
      segment,
      interval,
      recon: sign ? -reconMag : reconMag,
      segStep,
      segStart,
      code,
      diff: clamped - (sign ? -reconMag : reconMag),
      orig: clamped,
      valid: a <= 1,
    };
  }, [linear]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const pad = 40;
      const toX = (v: number) => pad + ((v + 1.25) / 2.5) * (w - pad * 2);
      const toY = (v: number) => h - pad - ((v + 1.25) / 2.5) * (h - pad * 2);

      grid(ctx, w, h, 34);
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
      ctx.restore();

      // segment boundaries
      ctx.save();
      for (let s = 0; s <= 7; s++) {
        const v = s / 16;
        const vx = toX(v);
        const vy = toY(v);
        ctx.strokeStyle = `${c.grid}`;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(vx, pad);
        ctx.lineTo(vx, h - pad);
        ctx.moveTo(pad, vy);
        ctx.lineTo(w - pad, vy);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, `${s}`, vx, h - pad + 10, c.textDim, 8, 'center');
      }
      for (let s = 0; s <= 7; s++) {
        const v = s / 16;
        label(ctx, `${s}`, pad - 8, toY(v), c.textDim, 8, 'right');
      }
      ctx.restore();

      // active segment rectangle
      const segA = result.segment >= 7 ? 0.5 : result.segment / 16;
      const segB = result.segment >= 7 ? 1 : (result.segment + 1) / 16;
      ctx.save();
      ctx.fillStyle = `${c.gold}18`;
      ctx.fillRect(toX(segA), toY(segB), toX(segB) - toX(segA), toY(segA) - toY(segB));
      ctx.strokeStyle = `${c.gold}88`;
      ctx.strokeRect(toX(segA), toY(segB), toX(segB) - toX(segA), toY(segA) - toY(segB));
      ctx.restore();
      label(ctx, `segment ${result.segment}`, toX((segA + segB) / 2), toY(segA) - 10, c.gold, 10, 'center', true);

      // input / reconstructed markers
      ctx.save();
      const stageCol = [c.cyan, c.gold, c.violet, c.green, c.red];
      const pts: [number, string][] = [
        [result.orig, 'input sample'],
        [result.recon, 'reconstructed'],
      ];
      pts.forEach(([v, name], i) => {
        const col = stageCol[stage === 2 && i === 0 ? 2 : i === 0 ? 0 : 3] ?? c.cyan;
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(toX(v), toY(0), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `${col}66`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(toX(v), toY(0));
        ctx.lineTo(toX(v), pad + 6);
        ctx.stroke();
        ctx.setLineDash([]);
        label(ctx, `${v.toFixed(4)} V`, toX(v), pad + 14, col, 9, 'center');
        void name;
      });
      ctx.restore();

      label(ctx, 'input amplitude →', w - pad, h - 10, c.textDim, 9, 'right');
      label(ctx, '16 segment lines each side', pad + 2, pad - 10, c.textDim, 9);
    },
    [result, stage],
  );

  const bits: Omit<Readout, 'key'>[] = [
    { label: 'Sign bit', value: String(result.sign), tone: 'info' },
    { label: 'Segment', value: D.toBin(result.segment, 3), tone: 'info' },
    { label: 'Interval', value: D.toBin(result.interval, 4), tone: 'info' },
    { label: 'Segment step', value: `${(result.segStep * 1000).toFixed(2)} mV`, tone: 'info' },
    { label: '8-bit code', value: result.code, tone: 'good' },
    { label: 'Difference', value: `${(result.diff * 1000).toFixed(2)} mV`, tone: 'bad' },
  ];

  return (
    <LabShell
      title="12-bit linear → 8-bit companded code"
      description="An explicit, checkable segmentation model: sign bit, 3-bit segment, 4-bit interval, reconstruction and difference."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: result.valid ? 'limit' : 'bad',
        text: result.valid
          ? 'This is a documented segmentation scheme in the style of G.711, using the segment table printed in the lesson. It is not a claim that any arbitrary 12-bit input has “the” 8-bit telephony equivalent — real G.711 has its own segment boundaries and endpoint conventions.'
          : `The sample (${result.orig.toFixed(3)} V) is outside ±1 V full scale, so the encoder clips to segment 7.`,
      }}
      readouts={makeReadouts(bits)}
      readoutColumns={3}
    >
      <VizCanvas draw={draw} height={280} label="Segmented companding grid showing the active segment, input sample and reconstructed value" />
    </LabShell>
  );
}

/* ==========================================================================
   PCM vs DPCM
   ========================================================================== */

export function DpcmScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { bits: 4, vmax: 1.2, corr: 2, showRecon: true };
  const { values, set, reset } = useLabValues(key_ ?? 'dpcm', { ...defaults, ...(overrides ?? {}) });

  const bits = Math.round(num(values.bits, 4));
  const vmax = num(values.vmax, 1.2);
  const corr = num(values.corr, 2);
  const showRecon = bool(values.showRecon, true);

  const specs: Control[] = [
    { kind: 'slider', id: 'bits', label: 'Error quantiser bits', min: 2, max: 8, step: 1, unit: ' bits' },
    { kind: 'slider', id: 'vmax', label: 'Input range ±', min: 0.5, max: 2, step: 0.1, unit: ' V' },
    { kind: 'slider', id: 'corr', label: 'Signal frequency', min: 0.5, max: 8, step: 0.1, unit: ' Hz', hint: 'High frequency decorrelates the samples and erodes DPCM’s advantage.' },
    { kind: 'toggle', id: 'showRecon', label: 'Show reconstruction' },
  ];

  const N = 64;
  const samples = useDerived(() => {
    const out: number[] = [];
    for (let i = 0; i < N; i++) out.push(Math.sin((2 * Math.PI * corr * i) / N) * vmax * 0.9);
    return out;
  }, [corr, vmax]);

  const dpcm = useDerived(() => D.dpcmEncode(samples, bits, vmax), [samples, bits, vmax]);

  const pcmStep = useDerived(() => D.stepSize(2 * vmax, bits), [vmax, bits]);
  const pcmError = useDerived(
    () => samples.map((s) => s - D.quantize(s, 2 * vmax, bits)),
    [samples, vmax, bits],
  );
  const dpcmError = dpcm.quantError;

  const rmsA = useDerived(() => Math.sqrt(D.mean(pcmError.map((e) => e * e))), [pcmError]);
  const rmsB = useDerived(() => Math.sqrt(D.mean(dpcmError.map((e) => e * e))), [dpcmError]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const lanes = [
        { title: 'original samples', color: c.cyan, data: samples },
        { title: 'prediction errors sent', color: c.gold, data: dpcm.diff },
        showRecon ? { title: 'DPCM reconstruction', color: c.green, data: dpcm.recon } : null,
      ].filter(Boolean) as { title: string; color: string; data: number[] }[];

      const laneH = h / lanes.length;
      const colW = (x1 - x0) / N;

      lanes.forEach((lane, li) => {
        const midY = laneH * li + laneH / 2;
        grid(ctx, w, laneH, 26);
        axisX(ctx, w, midY);
        label(ctx, lane.title, x0 + 2, laneH * li + 12, lane.color, 10, 'left', true);

        let maxAbs = 0.001;
        for (const v of lane.data) maxAbs = Math.max(maxAbs, Math.abs(v));
        const amp = laneH * 0.34;

        ctx.save();
        for (let i = 0; i < lane.data.length; i++) {
          const v = lane.data[i]!;
          const y = midY - (v / maxAbs) * amp;
          ctx.fillStyle = v >= 0 ? `${lane.color}cc` : `${lane.color}55`;
          ctx.fillRect(x0 + i * colW, Math.min(y, midY), Math.max(1, colW - 0.6), Math.max(1, Math.abs(y - midY)));
        }
        ctx.restore();
        label(ctx, `±${maxAbs.toFixed(3)} V`, x1 - 2, laneH * li + 12, c.textDim, 9, 'right');
      });
    },
    [samples, dpcm, showRecon],
  );

  return (
    <LabShell
      title="PCM versus DPCM"
      description="Absolute amplitude versus prediction error — the same bit budget applied to both, with the closed loop shown."
      accent="var(--green)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: `Toy codec, stated plainly: a first-order (previous-sample) predictor with a uniform error quantiser. The comparison here is exact — same bit count, same signal — but it is not adaptive, and no bit-rate saving is claimed without the allocation being visible. The reconstruction curve comes from the encoder’s own closed loop, so encoder and decoder stay in step by construction.`,
      }}
      readouts={makeReadouts([
        { label: 'Bits per sample', value: String(bits), tone: 'info' },
        { label: 'PCM step', value: `${(pcmStep * 1000).toFixed(2)} mV`, tone: 'info' },
        { label: 'PCM RMS error', value: `${(rmsA * 1000).toFixed(2)} mV`, tone: 'warn' },
        { label: 'DPCM RMS error', value: `${(rmsB * 1000).toFixed(2)} mV`, tone: rmsB < rmsA ? 'good' : 'warn' },
        { label: 'Error range ratio', value: `${(Math.max(...samples.map(Math.abs)) / Math.max(...dpcm.diff.map(Math.abs), 1e-6)).toFixed(1)}×`, tone: 'good' },
        { label: 'Samples simulated', value: String(N), tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={300} label="Three lanes comparing original samples, prediction errors and DPCM reconstruction" />
    </LabShell>
  );
}

/* ==========================================================================
   Delta modulation
   ========================================================================== */

export function DeltaModScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { fin: 1, amp: 1, fs: 40, step: 0.2, adaptive: false, blocks: false, highlight: true };
  const { values, set, reset } = useLabValues(key_ ?? 'delta-mod', { ...defaults, ...(overrides ?? {}) });

  const fin = num(values.fin, 1);
  const amp = num(values.amp, 1);
  const fs = num(values.fs, 40);
  const step = num(values.step, 0.2);
  const adaptive = bool(values.adaptive);
  const showBlocks = bool(values.blocks);
  const highlight = bool(values.highlight);

  const specs: Control[] = [
    { kind: 'slider', id: 'fin', label: 'Input frequency', min: 0.2, max: 4, step: 0.05, unit: ' Hz' },
    { kind: 'slider', id: 'amp', label: 'Input amplitude', min: 0.2, max: 2, step: 0.05, unit: ' V' },
    { kind: 'slider', id: 'fs', label: 'Sampling rate', min: 10, max: 120, step: 2, unit: ' samples/s' },
    { kind: 'slider', id: 'step', label: 'Step size δ', min: 0.02, max: 0.8, step: 0.01, format: (v) => v.toFixed(2) },
    { kind: 'toggle', id: 'adaptive', label: 'Adaptive step (ADM)', hint: 'Raises δ on runs of identical bits, lowers it on alternation.' },
    { kind: 'toggle', id: 'blocks', label: 'Show encoder/decoder blocks' },
    { kind: 'toggle', id: 'highlight', label: 'Highlight distortion regions' },
  ];

  /** Reference run with a fixed step, used for the slope-overload judgement. */
  const fixed = useDerived(() => D.deltaModulate(SINE(fin, amp), fs, 1, step), [fin, amp, fs, step]);

  /** Adaptive variant: step follows the bit history. */
  const adm = useDerived(() => {
    const sig = SINE(fin, amp);
    const n = Math.round(fs);
    let recon = 0;
    let delta = step;
    const bits: number[] = [];
    const ts: number[] = [];
    const values: number[] = [];
    const steps: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / fs;
      const x = sig(t);
      const bit = x > recon ? 1 : 0;
      bits.push(bit);
      ts.push(t);
      recon = D.clamp(recon + (bit ? delta : -delta), -4, 4);
      values.push(recon);
      steps.push(delta);
      // Up/down counter: run of identical bits raises δ, alternation lowers it.
      if (i > 0) {
        if (bits[i] === bits[i - 1]) delta = D.clamp(delta * 1.06, 0.02, 1.2);
        else delta = D.clamp(delta * 0.94, 0.02, 1.2);
      }
    }
    const errors = values.map((v, i) => sig(ts[i]!) - v);
    return { bits, t: ts, recon: values, steps, errors, peak: Math.max(...errors.map(Math.abs)) };
  }, [fin, amp, fs, step]);

  const requiredStep = useDerived(() => (2 * Math.PI * amp * fin) / fs, [amp, fin, fs]);
  const slopeOk = step >= requiredStep;
  const granularLikely = step > amp * 0.35 && fin < 1.2;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const blockH = showBlocks ? 54 : 0;
      const waveH = h - blockH - 34;
      const x0 = 8;
      const x1 = w - 8;
      const midY = blockH + waveH / 2;
      const toX = (t: number) => x0 + t * (x1 - x0);
      const ampPx = waveH * 0.36;

      grid(ctx, w, waveH);
      axisX(ctx, w, midY);

      const sig = SINE(fin, amp);
      const recon = adaptive ? adm.recon : fixed.recon;
      const errors = adaptive ? adm.errors : fixed.errors;
      const overload = fixed.slopeOverload;

      // error shading
      ctx.save();
      ctx.fillStyle = `${c.red}22`;
      for (let i = 0; i < errors.length; i++) {
        if (!highlight) break;
        const e = errors[i]!;
        if (Math.abs(e) < step * 1.05) continue;
        const t = i / fs;
        const segW = (x1 - x0) / fs;
        ctx.fillRect(toX(t), midY - ampPx * 1.4, segW, ampPx * 2.8);
      }
      ctx.restore();

      // true signal
      ctx.save();
      glow(ctx, c.cyan, 1.5);
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const t = i / 300;
        const y = midY - sig(t) * ampPx;
        if (i === 0) ctx.moveTo(toX(t), y);
        else ctx.lineTo(toX(t), y);
      }
      ctx.stroke();
      ctx.restore();

      // staircase
      ctx.save();
      glow(ctx, c.gold, 2);
      ctx.beginPath();
      for (let i = 0; i < recon.length; i++) {
        const t = i / fs;
        const y = midY - recon[i]! * ampPx;
        if (i === 0) ctx.moveTo(toX(t), y);
        else {
          ctx.lineTo(toX(t), midY - recon[i - 1]! * ampPx);
          ctx.lineTo(toX(t), y);
        }
      }
      ctx.stroke();
      ctx.restore();

      label(ctx, 'analogue input', x0 + 2, blockH + 12, c.cyan, 10, 'left', true);
      label(ctx, adaptive ? 'ADM staircase (adaptive δ)' : 'DM staircase', x1 - 2, blockH + 12, c.gold, 10, 'right', true);

      // bit ribbon
      const bits = adaptive ? adm.bits : fixed.bits;
      const ribY = h - 26;
      const segW = (x1 - x0) / bits.length;
      ctx.save();
      for (let i = 0; i < bits.length; i++) {
        const x = x0 + i * segW;
        const overloadHere = highlight && !adaptive && overload[i];
        ctx.fillStyle = overloadHere ? c.red : bits[i] ? c.green : c.violet;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x, bits[i] ? ribY : ribY + 11, Math.max(1, segW), 11);
      }
      ctx.restore();
      label(ctx, '1 = step up   0 = step down', x0 + 2, ribY - 6, c.textDim, 8.5);

      // block diagram
      if (showBlocks) {
        const names = ['S&H', 'Comparator', '1-bit encoder', 'Accumulator + DAC', 'Decoder'];
        const bw = (x1 - x0) / names.length - 6;
        names.forEach((nm, i) => {
          const bx = x0 + i * (bw + 6);
          ctx.fillStyle = 'rgba(255,255,255,.04)';
          ctx.strokeStyle = c.axis;
          ctx.lineWidth = 1.2;
          roundRect(ctx, bx, 8, bw, 34, 6);
          ctx.fill();
          ctx.stroke();
          label(ctx, nm, bx + bw / 2, 25, c.text, 8.5, 'center');
          if (i < names.length - 1) {
            ctx.beginPath();
            ctx.moveTo(bx + bw, 25);
            ctx.lineTo(bx + bw + 5, 25);
            ctx.stroke();
          }
        });
        // feedback path
        ctx.strokeStyle = `${c.gold}88`;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x0 + (names.length - 2) * (bw + 6) + bw / 2, 42);
        ctx.lineTo(x0 + (names.length - 2) * (bw + 6) + bw / 2, 50);
        ctx.lineTo(x0 + bw / 2, 50);
        ctx.lineTo(x0 + bw / 2, 42);
        ctx.stroke();
        ctx.restore?.();
        label(ctx, 'feedback', (x0 + x1) / 2, 47, c.gold, 8, 'center');
      }
    },
    [fin, amp, fs, step, adaptive, showBlocks, highlight, fixed, adm],
  );

  const peak = adaptive ? adm.peak : fixed.peakError;
  const rms = adaptive ? Math.sqrt(D.mean(adm.errors.map((e) => e * e))) : fixed.rmsError;

  return (
    <LabShell
      title="Delta modulation laboratory"
      description="One bit per sample. Change the step size and sampling rate and watch slope overload and granular noise trade against each other."
      accent="var(--violet)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: !slopeOk && !granularLikely ? 'bad' : slopeOk && granularLikely ? 'warn' : 'ok',
        text: !slopeOk
          ? `Slope overload: δ = ${step.toFixed(2)} V is below the ${requiredStep.toFixed(3)} V needed to follow the steepest input slope (2πAf_m/f_s). The staircase lags and the error grows without bound.`
          : granularLikely
            ? `Granular noise: δ = ${step.toFixed(2)} V is large relative to this slow signal, so the staircase hunts ±δ around it. Reduce δ or enable adaptive stepping.`
            : `Both distortions are under control: δ = ${step.toFixed(2)} V clears the slope limit of ${requiredStep.toFixed(3)} V without producing a visible ripple.`,
      }}
      readouts={makeReadouts([
        { label: 'Required δ (no overload)', value: `${requiredStep.toFixed(3)} V`, tone: slopeOk ? 'good' : 'bad' },
        { label: 'Peak tracking error', value: `${peak.toFixed(3)} V`, tone: 'info' },
        { label: 'RMS tracking error', value: `${rms.toFixed(3)} V`, tone: 'info' },
        { label: 'Bit rate', value: `${fs.toFixed(0)} bit/s`, tone: 'info' },
        { label: 'Tie rule', value: 'x = x̂ → 0', tone: 'info' },
        { label: 'Overload samples', value: `${fixed.overloadSamples}`, tone: fixed.overloadSamples > 0 ? 'bad' : 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={330} label="Delta modulation staircase tracking a sine, with the one-bit ribbon and optional block diagram" />
    </LabShell>
  );
}

/* ==========================================================================
   First-order sigma-delta
   ========================================================================== */

export function SigmaDeltaScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { osr: 32, fin: 1, spectrum: true };
  const { values, set, reset } = useLabValues(key_ ?? 'sigma-delta', { ...defaults, ...(overrides ?? {}) });

  const osr = Math.round(num(values.osr, 32));
  const fin = num(values.fin, 1);
  const showSpectrum = bool(values.spectrum, true);

  const specs: Control[] = [
    { kind: 'slider', id: 'osr', label: 'Oversampling ratio', min: 4, max: 128, step: 4, unit: '×', hint: 'Rate multiplier above the baseband Nyquist rate.' },
    { kind: 'slider', id: 'fin', label: 'Signal frequency', min: 0.1, max: 2, step: 0.1, unit: ' Hz' },
    { kind: 'toggle', id: 'spectrum', label: 'Show noise-shaping spectrum' },
  ];

  const run = useDerived(() => {
    const baseFs = 8;
    const Fs = baseFs * osr;
    const n = Math.min(2400, Math.round(Fs));
    const sig = SINE(fin, 0.8);
    const bits: number[] = [];
    const ts: number[] = [];
    let integrator = 0;
    let q = 1;
    for (let i = 0; i <= n; i++) {
      const t = i / Fs;
      integrator = D.clamp(integrator + sig(t) - q, -2, 2);
      q = integrator > 0 ? 1 : -1;
      bits.push(q > 0 ? 1 : 0);
      ts.push(t);
    }
    // digital decimation: average over each baseband period
    const decimated: number[] = [];
    const decT: number[] = [];
    const per = osr;
    for (let i = 0; i + per <= bits.length; i += per) {
      let acc = 0;
      for (let j = 0; j < per; j++) acc += bits[i + j]! === 1 ? 1 : -1;
      decimated.push(acc / per);
      decT.push(i / Fs);
    }
    const residual = decimated.map((v, i) => v - sig(decT[i]!));
    const inBand = residual.length ? Math.sqrt(D.mean(residual.map((e) => e * e))) : 0;
    // A plain (unshaped) quantiser at the same rate, for comparison.
    const flatNoise = Math.sqrt(1 / 12) * 1.0;
    return { bits, ts, decimated, decT, inBand, flatNoise, Fs, baseFs };
  }, [osr, fin]);

  const gainDb = useDerived(() => 20 * Math.log10(Math.max(1e-9, run.flatNoise / Math.max(run.inBand, 1e-9))), [run]);
  const theoryDb = useDerived(() => 9 * Math.log2(osr / 4), [osr]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;

      // --- bitstream ribbon ---
      const bitH = 34;
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.lineWidth = 1;
      const step = Math.max(1, Math.floor(run.bits.length / (x1 - x0)));
      for (let i = 0; i < run.bits.length; i += step) {
        const x = x0 + (i / run.bits.length) * (x1 - x0);
        ctx.fillStyle = run.bits[i] === 1 ? c.magenta : c.cyan;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(x, run.bits[i] ? 16 : 16 + bitH / 2, Math.max(1, (x1 - x0) / run.bits.length * step), bitH / 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      label(ctx, `1-bit stream at ${(run.Fs).toFixed(0)} samples/s`, x0 + 2, 10, c.magenta, 9.5, 'left', true);
      label(ctx, '1', x1 - 2, 22, c.magenta, 8.5, 'right');
      label(ctx, '0', x1 - 2, 22 + bitH / 2, c.cyan, 8.5, 'right');

      // --- decimated output vs input ---
      const outTop = 16 + bitH + 10;
      const outH = h - outTop - (showSpectrum ? 70 : 0) - 14;
      grid(ctx, w, outH, 30);
      const midY = outTop + outH / 2;
      const toY = (v: number) => midY - v * outH * 0.36;
      axisX(ctx, w, midY);

      ctx.save();
      ctx.globalAlpha = 0.5;
      glow(ctx, c.cyan, 1.3);
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const t = (i / 200) * 0.5;
        const y = toY(SINE(fin, 0.8)(t));
        if (i === 0) ctx.moveTo(x0 + (t / 0.5) * (x1 - x0), y);
        else ctx.lineTo(x0 + (t / 0.5) * (x1 - x0), y);
      }
      ctx.stroke();
      ctx.restore();

      ctx.save();
      glow(ctx, c.gold, 2);
      ctx.beginPath();
      run.decT.forEach((t, i) => {
        const x = x0 + (t / 0.5) * (x1 - x0);
        const y = toY(run.decimated[i]!);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
      label(ctx, 'after decimation filter (green) vs input (cyan)', x0 + 2, outTop + 10, c.gold, 9.5, 'left', true);

      // --- noise spectrum ---
      if (showSpectrum) {
        const specTop = h - 62;
        const specH = 44;
        grid(ctx, w, specH, 26);
        const nyq = run.Fs / 2;
        const toFx = (f: number) => x0 + (f / nyq) * (x1 - x0);
        const toFy = (v: number) => specTop + specH - v * specH * 0.9;

        // shaped: f^2
        ctx.save();
        glow(ctx, c.magenta, 2);
        ctx.beginPath();
        for (let i = 0; i <= 120; i++) {
          const f = (i / 120) * nyq;
          const shaped = ((f / nyq) ** 2) * 0.9;
          if (i === 0) ctx.moveTo(toFx(f), toFy(shaped));
          else ctx.lineTo(toFx(f), toFy(shaped));
        }
        ctx.stroke();
        // flat reference
        ctx.strokeStyle = `${c.gray}aa`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(toFx(0), toFy(0.9));
        ctx.lineTo(toFx(nyq), toFy(0.9));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // signal band marker
        const bandW = toFx(fin * 2);
        ctx.fillStyle = `${c.green}22`;
        ctx.fillRect(x0, specTop, bandW, specH);
        ctx.strokeStyle = c.green;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0, specTop, bandW, specH);
        label(ctx, 'signal band', x0 + 3, specTop + 8, c.green, 8.5);
        label(ctx, 'shaped noise ∝ f²', toFx(nyq * 0.62), specTop + 12, c.magenta, 9, 'center', true);
        label(ctx, 'flat (unshaped) reference', toFx(nyq * 0.72), specTop + 26, c.gray, 8.5, 'center');
        label(ctx, '0', x0 - 2, specTop + specH, c.textDim, 8, 'right');
        label(ctx, `Fs/2 = ${(nyq / 1000).toFixed(1)} kHz`, x1, specTop + specH, c.textDim, 8.5, 'right');
      }
    },
    [run, fin, showSpectrum],
  );

  return (
    <LabShell
      title="First-order ΣΔ laboratory"
      description="Oversampling plus noise shaping, with the decimated result and the shaped noise spectrum."
      accent="var(--violet)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: `Measured in-band noise is ${(20 * Math.log10(Math.max(1e-9, run.inBand))).toFixed(1)} dB relative to full scale, about ${gainDb.toFixed(1)} dB better than a plain quantiser at the same rate. First-order theory predicts ≈ ${theoryDb.toFixed(1)} dB across an OSR change of ${osr}/4. Note the split: oversampling alone gives only 3·log₁₀(OSR); the noise shaping supplies the rest. This is the conceptual loop, not a production converter.`,
      }}
      readouts={makeReadouts([
        { label: 'Oversampling ratio', value: `${osr}×`, tone: 'info' },
        { label: 'Sample rate', value: `${run.Fs} /s`, tone: 'info' },
        { label: 'In-band noise (RMS)', value: run.inBand.toExponential(2), tone: 'info' },
        { label: 'Improvement', value: `${gainDb.toFixed(1)} dB`, tone: 'good' },
        { label: 'Quantiser', value: '1 bit', tone: 'info' },
        { label: 'Theory (1st order)', value: `9 dB per doubling`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={340} label="Sigma-delta bitstream, decimated output and noise-shaping spectrum" />
    </LabShell>
  );
}

/* ==========================================================================
   Constellation builder
   ========================================================================== */

export function ConstellationScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { scheme: 'QAM', order: 16, bits: '11001011', gray: true, noise: 0 };
  const { values, set, reset } = useLabValues(key_ ?? 'constellation', { ...defaults, ...(overrides ?? {}) });

  const scheme = str(values.scheme, 'QAM');
  const order = Math.round(num(values.order, 16));
  const bits = str(values.bits, '11001011');
  const gray = bool(values.gray, true);
  const noise = num(values.noise, 0);

  const specs: Control[] = [
    {
      kind: 'select',
      id: 'scheme',
      label: 'Scheme',
      options: [
        { value: 'ASK', label: 'ASK (2-level)' },
        { value: 'PSK', label: 'M-PSK' },
        { value: 'QAM', label: 'Square M-QAM' },
      ],
    },
    { kind: 'slider', id: 'order', label: 'Constellation size M', min: 2, max: 256, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'text', id: 'bits', label: 'Bit string', placeholder: 'e.g. 11001011', hint: 'Grouped into log₂(M) bits per symbol.' },
    { kind: 'toggle', id: 'gray', label: 'Gray labelling' },
    { kind: 'slider', id: 'noise', label: 'Added noise (σ)', min: 0, max: 0.3, step: 0.01, format: (v) => v.toFixed(2) },
  ];

  const cons = useDerived(() => {
    const effective = gray
      ? scheme === 'QAM'
        ? D.squareQamConstellation(order)
        : D.pskConstellation(order)
      : // Natural binary labelling instead of Gray.
        scheme === 'QAM'
          ? unGrayMap(D.squareQamConstellation(order))
          : unGrayMap(D.pskConstellation(order));
    return effective;
  }, [scheme, order, gray]);

  const symbols = useDerived(() => {
    if (!cons) return { groups: [], remainder: 0, bitsPerSymbol: 0 };
    const k = cons.k;
    const groups: { bits: string; point: D.ConstellationPoint }[] = [];
    for (let i = 0; i + k <= bits.length; i += k) {
      const g = bits.slice(i, i + k);
      const p = cons.points.find((pt) => pt.bits === g);
      if (p) groups.push({ bits: g, point: p });
    }
    return { groups, remainder: bits.length % k, bitsPerSymbol: k };
  }, [bits, cons]);

  const status = !cons
    ? {
        tone: 'bad' as const,
        text: `${order}-${scheme} is not a square grid (${Math.sqrt(order).toFixed(2)} is not an integer), so no points are drawn. 8-, 32- and 128-QAM are genuinely cross-shaped constellations with their own labelling convention — drawing a 4×2 grid and calling it “8-QAM” would be wrong.`,
      }
    : symbols.remainder > 0
      ? {
          tone: 'warn' as const,
          text: `The bit string has ${symbols.remainder} trailing bit${symbols.remainder === 1 ? '' : 's'} that cannot fill a whole ${symbols.bitsPerSymbol}-bit symbol. They are shown ungrouped and are not transmitted as a partial symbol.`,
        }
      : {
          tone: 'ok' as const,
          text: `${bits.length} bits → ${symbols.groups.length} symbols of ${symbols.bitsPerSymbol} bits each. ${gray ? 'Grey labelling means a nearest-neighbour error costs one bit.' : 'Natural binary labelling means a nearest-neighbour error can cost several bits — this is why Gray coding is used in practice.'}`,
        };

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;

      grid(ctx, w, h, 30);
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(8, cy);
      ctx.lineTo(w - 8, cy);
      ctx.moveTo(cx, 8);
      ctx.lineTo(cx, h - 8);
      ctx.stroke();
      ctx.restore();

      if (!cons) {
        label(ctx, 'unsupported order — see the note below', cx, cy, c.red, 11, 'center', true);
        return;
      }

      const sent = new Set(symbols.groups.map((g) => g.point.bits));

      // decision-region boundaries for the current constellation
      ctx.save();
      ctx.strokeStyle = `${c.cyan}22`;
      ctx.setLineDash([2, 4]);
      for (const p of cons.points) {
        for (const q of cons.points) {
          if (p === q) continue;
          ctx.beginPath();
          ctx.moveTo(cx + p.normI * R, cy - p.normQ * R);
          ctx.lineTo(cx + q.normI * R, cy - q.normQ * R);
          ctx.stroke();
        }
      }
      ctx.restore();

      const rand = D.createRng(0x51fe + Math.round(noise * 1000));
      cons.points.forEach((p) => {
        const on = sent.has(p.bits);
        ctx.fillStyle = on ? c.cyan : c.gray;
        ctx.globalAlpha = on ? 0.95 : 0.5;
        ctx.beginPath();
        ctx.arc(cx + p.normI * R, cy - p.normQ * R, on ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (on) {
          label(ctx, p.bits, cx + p.normI * R, cy - p.normQ * R - 11, c.cyan, 8.5, 'center', true);
        }
      });

      // received points with noise
      if (noise > 0) {
        ctx.save();
        for (const g of symbols.groups) {
          for (let k = 0; k < 12; k++) {
            const ni = g.point.normI + D.gaussian(rand) * noise;
            const nq = g.point.normQ + D.gaussian(rand) * noise;
            ctx.fillStyle = c.magenta;
            ctx.globalAlpha = 0.55;
            ctx.beginPath();
            ctx.arc(cx + ni * R, cy - nq * R, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      label(ctx, 'I (in-phase) →', w - 10, cy - 10, c.textDim, 9, 'right');
      label(ctx, 'Q (quadrature) ↑', cx + 10, 14, c.textDim, 9);
      label(ctx, `${cons.name} · ${cons.k} bits/symbol · ${gray ? 'Gray' : 'natural binary'}`, 8, 12, c.text, 10, 'left', true);

      // group the user's bit string
      label(ctx, symbols.groups.map((g) => g.bits).join(' '), 8, h - 10, c.gold, 9, 'left');
    },
    [cons, symbols, gray, noise],
  );

  return (
    <LabShell
      title="Constellation builder"
      description="Type bits, choose an order, and watch the mapping, labelling and decision geometry."
      accent="var(--cyan)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={status}
      readouts={makeReadouts([
        { label: 'Scheme', value: cons ? cons.name : `${order}-${scheme} (n/a)`, tone: cons ? 'info' : 'bad' },
        { label: 'Bits per symbol', value: String(symbols.bitsPerSymbol), tone: 'info' },
        { label: 'Symbols from input', value: String(symbols.groups.length), tone: 'info' },
        { label: 'Unused trailing bits', value: String(symbols.remainder), tone: symbols.remainder > 0 ? 'warn' : 'good' },
        { label: 'Smallest |point distance|', value: cons ? minDistance(cons).toFixed(3) : '—', tone: 'info' },
        { label: 'Min distance (2-PSK)', value: '2.000', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={320} label="I/Q constellation with bit labels, decision geometry and optional noise" />
    </LabShell>
  );
}

function unGrayMap(cons: D.Constellation | null): D.Constellation | null {
  if (!cons) return null;
  return { ...cons, points: cons.points.map((p, i) => ({ ...p, bits: D.toBin(i, cons.k) })) };
}

function minDistance(cons: D.Constellation): number {
  let best = Infinity;
  for (let i = 0; i < cons.points.length; i++) {
    for (let j = i + 1; j < cons.points.length; j++) {
      const a = cons.points[i]!;
      const b = cons.points[j]!;
      best = Math.min(best, Math.hypot(a.normI - b.normI, a.normQ - b.normQ));
    }
  }
  return best === Infinity ? 0 : best;
}

/* ==========================================================================
   ASK / FSK / PSK waveform generator
   ========================================================================== */

export function WaveformScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { scheme: 'ASK', bits: '10110100', rs: 4, fc: 18, sep: 0.14 };
  const { values, set, reset } = useLabValues(key_ ?? 'waveforms', { ...defaults, ...(overrides ?? {}) });

  const scheme = str(values.scheme, 'ASK');
  const bits = str(values.bits, '10110100').replace(/[^01]/g, '').slice(0, 32);
  const rs = num(values.rs, 4);
  const fc = num(values.fc, 18);
  const sep = num(values.sep, 0.14);

  const specs: Control[] = [
    {
      kind: 'select',
      id: 'scheme',
      label: 'Scheme',
      options: [
        { value: 'ASK', label: 'ASK' },
        { value: 'FSK', label: 'BFSK' },
        { value: 'BPSK', label: 'BPSK' },
        { value: 'QPSK', label: 'QPSK' },
        { value: '16QAM', label: '16-QAM' },
      ],
    },
    { kind: 'text', id: 'bits', label: 'Bit string', placeholder: '10110100' },
    { kind: 'slider', id: 'rs', label: 'Symbol rate', min: 1, max: 12, step: 1, unit: ' baud' },
    { kind: 'slider', id: 'fc', label: 'Carrier frequency', min: 4, max: 60, step: 1, unit: ' Hz' },
    { kind: 'slider', id: 'sep', label: 'FSK separation', min: 0.03, max: 0.5, step: 0.01, format: (v) => `${(v * 100).toFixed(0)}%` },
  ];

  const bitsPerSymbol = scheme === 'QPSK' ? 2 : scheme === '16QAM' ? 4 : 1;

  const wave = useDerived(() => {
    const schemeName: D.ModulationScheme = scheme === '16QAM' ? 'QAM' : (scheme as D.ModulationScheme);
    const cons =
      scheme === 'QPSK'
        ? D.squareQamConstellation(4)
        : scheme === '16QAM'
          ? D.squareQamConstellation(16)
          : scheme === 'BPSK'
            ? D.pskConstellation(2)
            : null;
    const carrierCycles = fc;
    return D.modulateBits(schemeName, bits, rs, carrierCycles, {
      f0: carrierCycles * (1 - sep),
      f1: carrierCycles * (1 + sep),
      constellation: cons,
    });
  }, [scheme, bits, rs, fc, sep]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const baseH = 46;
      const midY = (h - baseH) / 2;

      grid(ctx, w, h - baseH);
      axisX(ctx, w, midY);

      // symbol separators
      const nSymbols = Math.floor(bits.length / bitsPerSymbol);
      const segW = (x1 - x0) / Math.max(1, nSymbols);
      ctx.save();
      ctx.strokeStyle = `${c.gray}55`;
      ctx.setLineDash([2, 4]);
      for (let i = 0; i <= nSymbols; i++) {
        ctx.beginPath();
        ctx.moveTo(x0 + i * segW, 8);
        ctx.lineTo(x0 + i * segW, h - baseH - 6);
        ctx.stroke();
      }
      ctx.restore();

      // modulated waveform
      ctx.save();
      glow(ctx, c.cyan, 1.7);
      polyline(ctx, wave.t, wave.y, (t) => x0 + (t / wave.duration) * (x1 - x0), (v) => midY - v * (h - baseH) * 0.36, 1);
      ctx.restore();

      label(ctx, `${scheme} modulated waveform`, x0 + 2, 12, c.cyan, 10, 'left', true);

      // baseband ribbon
      const ribY = h - baseH + 12;
      const bitW = (x1 - x0) / Math.max(1, bits.length);
      ctx.save();
      for (let i = 0; i < bits.length; i++) {
        ctx.fillStyle = bits[i] === '1' ? `${c.cyan}cc` : `${c.gray}66`;
        ctx.fillRect(x0 + i * bitW, ribY, Math.max(1, bitW - 0.5), 18);
        label(ctx, bits[i]!, x0 + (i + 0.5) * bitW, ribY + 9, bits[i] === '1' ? '#04121a' : '#dbe7ff', 8.5, 'center', true);
      }
      ctx.restore();
      label(ctx, 'data', x0 + 2, ribY + 9, c.textDim, 9);

      // For ASK, overlay the envelope
      if (scheme === 'ASK') {
        ctx.save();
        ctx.strokeStyle = `${c.gold}88`;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        for (let i = 0; i < bits.length; i++) {
          const a = bits[i] === '1' ? 1 : 0;
          ctx.moveTo(x0 + i * bitW, midY - a * (h - baseH) * 0.36);
          ctx.lineTo(x0 + (i + 1) * bitW, midY - a * (h - baseH) * 0.36);
        }
        ctx.stroke();
        ctx.restore();
        label(ctx, 'amplitude envelope', x1 - 2, 12, c.gold, 9, 'right');
      }
    },
    [wave, scheme, bits, bitsPerSymbol],
  );

  const bitRate = rs * bitsPerSymbol;

  return (
    <LabShell
      title="ASK / FSK / PSK waveform generator"
      description="Type a bit string and watch the carrier carry it — amplitude, frequency or phase."
      accent="var(--cyan)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text:
          scheme === 'FSK'
            ? `The carrier switches between ${(fc * (1 - sep)).toFixed(1)} Hz and ${(fc * (1 + sep)).toFixed(1)} Hz. Bandwidth estimate: 2(Δf + R_s/2) = ${(2 * (fc * sep + rs / 2)).toFixed(1)} Hz.`
            : scheme === 'ASK'
              ? 'ASK varies amplitude, which is the parameter noise attacks first — it is the most noise-sensitive of the simple schemes.'
              : `Phase keying keeps a constant envelope, so amplitude noise is removed by a limiter before detection. ${bitsPerSymbol} bits per symbol here.`,
      }}
      readouts={makeReadouts([
        { label: 'Bit rate', value: `${bitRate.toFixed(0)} bit/s`, tone: 'info' },
        { label: 'Symbol rate', value: `${rs.toFixed(0)} baud`, tone: 'info' },
        { label: 'Bits per symbol', value: String(bitsPerSymbol), tone: 'info' },
        { label: 'Input bits', value: String(bits.length), tone: 'info' },
        { label: 'Trailing bits', value: String(bits.length % bitsPerSymbol), tone: bits.length % bitsPerSymbol > 0 ? 'warn' : 'good' },
        { label: 'Occupied BW (α=0)', value: `${(bitRate).toFixed(0)} Hz`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={290} label="Modulated carrier waveform above the binary data stream" />
    </LabShell>
  );
}

/* ==========================================================================
   QAM with noise and error counting
   ========================================================================== */

export function QamScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { order: 16, noise: 0.06, ebn0: 14, symbols: 60 };
  const { values, set, reset } = useLabValues(key_ ?? 'qam', { ...defaults, ...(overrides ?? {}) });

  const order = Math.round(num(values.order, 16));
  const noise = num(values.noise, 0.06);
  const ebn0 = num(values.ebn0, 14);
  const symbolCount = Math.round(num(values.symbols, 60));

  const specs: Control[] = [
    { kind: 'slider', id: 'order', label: 'Constellation size M', min: 4, max: 256, step: 4, format: (v) => String(Math.round(v)) },
    { kind: 'slider', id: 'noise', label: 'Noise σ', min: 0, max: 0.4, step: 0.01, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'ebn0', label: 'Eb/N0', min: 0, max: 30, step: 0.5, unit: ' dB', hint: 'Used for the theoretical reference curve only.' },
    { kind: 'slider', id: 'symbols', label: 'Symbols simulated', min: 20, max: 400, step: 20, unit: ' symbols' },
  ];

  const cons = useDerived(() => D.squareQamConstellation(order), [order]);

  const run = useDerived(() => {
    if (!cons) return null;
    const rand = D.createRng(0xc0ffee + order * 13 + Math.round(noise * 1000));
    let errors = 0;
    const rx: { i: number; q: number; correct: D.ConstellationPoint }[] = [];
    for (let n = 0; n < symbolCount; n++) {
      const p = cons.points[Math.floor(rand() * cons.points.length)]!;
      const di = D.gaussian(rand) * noise;
      const dq = D.gaussian(rand) * noise;
      const decided = D.nearestConstellationPoint(cons, p.normI + di, p.normQ + dq);
      if (decided.bits !== p.bits) errors++;
      rx.push({ i: p.normI + di, q: p.normQ + dq, correct: p });
    }
    const dMin = minDistance(cons);
    const evm = Math.sqrt(D.mean(rx.map((r) => (r.i - r.correct.normI) ** 2 + (r.q - r.correct.normQ) ** 2)));
    const avgPower = cons.averageEnergy;
    return { errors, total: symbolCount, ser: errors / symbolCount, evm, dMin, avgPower };
  }, [cons, noise, symbolCount]);

  const theoryBer = useDerived(() => {
    const k = Math.log2(order);
    return ((k - 1) * D.qFunction(Math.sqrt((3 * k / (order - 1)) * D.dbToPower(ebn0)))) / k;
  }, [order, ebn0]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.36;

      grid(ctx, w, h, 30);
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.beginPath();
      ctx.moveTo(8, cy);
      ctx.lineTo(w - 8, cy);
      ctx.moveTo(cx, 8);
      ctx.lineTo(cx, h - 8);
      ctx.stroke();
      ctx.restore();

      if (!cons || !run) {
        label(ctx, `${order}-QAM is not a square grid`, cx, cy, c.red, 11, 'center', true);
        return;
      }

      // decision region boundaries
      ctx.save();
      ctx.strokeStyle = `${c.cyan}22`;
      ctx.setLineDash([2, 4]);
      for (let i = 0; i < cons.points.length; i++) {
        for (let j = i + 1; j < cons.points.length; j++) {
          const a = cons.points[i]!;
          const b = cons.points[j]!;
          ctx.beginPath();
          ctx.moveTo(cx + a.normI * R, cy - a.normQ * R);
          ctx.lineTo(cx + b.normI * R, cy - b.normQ * R);
          ctx.stroke();
        }
      }
      ctx.restore();

      // ideal points
      ctx.save();
      for (const p of cons.points) {
        ctx.strokeStyle = c.cyan;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + p.normI * R - 3, cy - p.normQ * R);
        ctx.lineTo(cx + p.normI * R + 3, cy - p.normQ * R);
        ctx.moveTo(cx + p.normI * R, cy - p.normQ * R - 3);
        ctx.lineTo(cx + p.normI * R, cy - p.normQ * R + 3);
        ctx.stroke();
      }
      ctx.restore();

      // received points, coloured by decision correctness
      const rand = D.createRng(0xbeef + order);
      for (let n = 0; n < symbolCount; n++) {
        const p = cons.points[Math.floor(rand() * cons.points.length)]!;
        const di = D.gaussian(rand) * noise;
        const dq = D.gaussian(rand) * noise;
        const decided = D.nearestConstellationPoint(cons, p.normI + di, p.normQ + dq);
        const wrong = decided.bits !== p.bits;
        ctx.fillStyle = wrong ? c.red : c.magenta;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(cx + (p.normI + di) * R, cy - (p.normQ + dq) * R, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      label(ctx, `${cons.name} — ideal points vs received points`, 8, 12, c.text, 10, 'left', true);
      label(ctx, '× = correct decision   • red = symbol error', w - 8, 12, c.textDim, 9, 'right');
      label(ctx, 'I →', w - 10, cy - 10, c.textDim, 9, 'right');
      label(ctx, 'Q ↑', cx + 10, 14, c.textDim, 9);
    },
    [cons, run, noise, symbolCount, order],
  );

  return (
    <LabShell
      title="QAM noise laboratory"
      description="Add noise to a square QAM constellation and count the symbol errors the receiver actually makes."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: !cons ? 'bad' : 'info',
        text: !cons
          ? `${order}-QAM is cross-shaped, not square. This lab only draws square grids; the lesson explains what cross-QAM is and why it needs its own labelling.`
          : `Measured symbol error rate ${(run!.ser * 100).toFixed(1)} % from ${run!.total} symbols. The asymptotic QAM formula gives a BER of ${theoryBer.toExponential(2)} at Eb/N0 = ${ebn0} dB — compare only when the measured point is well inside the constellation, since that closed form is a high-Eb/N0 approximation.`,
      }}
      readouts={makeReadouts([
        { label: 'Constellation', value: cons ? cons.name : `${order}-QAM (n/a)`, tone: cons ? 'info' : 'bad' },
        { label: 'Bits per symbol', value: cons ? String(cons.k) : '—', tone: 'info' },
        { label: 'Symbol errors', value: run ? `${run.errors} / ${run.total}` : '—', tone: 'info' },
        { label: 'Measured SER', value: run ? `${(run.ser * 100).toFixed(2)} %` : '—', tone: run && run.errors > 0 ? 'warn' : 'good' },
        { label: 'EVM', value: run ? `${(run.evm * 100).toFixed(1)} %` : '—', tone: 'info' },
        { label: 'Min distance', value: run ? run.dMin.toFixed(3) : '—', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={320} label="QAM constellation with noise and highlighted symbol errors" />
    </LabShell>
  );
}