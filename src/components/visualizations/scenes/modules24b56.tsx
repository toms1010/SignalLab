import { useCallback } from 'react';
import { VizCanvas, axisX, glow, grid, label, polyline, themeColors } from '@/components/ui/VizCanvas';
import { LabShell, bool, makeReadouts, num, str, useDerived, useLabValues, type Control, type SceneProps } from '@/components/visualizations/Lab';
import * as D from '@/lib/signalMath';
import type { ControlValues } from '@/types';

/* ==========================================================================
   OFDM — subcarriers, their sum, and the cyclic prefix
   ========================================================================== */

export function OfdmScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { carriers: 8, cp: 0.25, bits: '1101001011110001' };
  const { values, set, reset } = useLabValues(key_ ?? 'ofdm', { ...defaults, ...(overrides ?? {}) });

  const carriers = Math.round(num(values.carriers, 8));
  const cp = num(values.cp, 0.25);
  const bits = str(values.bits, '1101001011110001').replace(/[^01]/g, '').padEnd(carriers * 4, '0');

  const specs: Control[] = [
    { kind: 'slider', id: 'carriers', label: 'Subcarriers', min: 4, max: 32, step: 1, unit: ' N' },
    { kind: 'slider', id: 'cp', label: 'Cyclic prefix', min: 0, max: 0.6, step: 0.05, format: (v) => `${(v * 100).toFixed(0)}%` },
    { kind: 'text', id: 'bits', label: 'Bit stream', hint: 'Four bits per 16-QAM subcarrier.' },
  ];

  const sym = useDerived(() => D.ofdmFromBits(bits, carriers, 14), [bits, carriers]);
  const overhead = useDerived(() => (cp / (1 + cp)) * 100, [cp]);
  const ortho = useDerived(() => {
    // Analytic inner product of two subcarriers over one useful symbol.
    return D.ofdmOrthogonalityIntegral(3, 3, 1);
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const subH = h * 0.42;
      const sumTop = subH + 8;
      const sumH = h - sumTop;

      // individual subcarriers
      grid(ctx, w, subH, 30);
      const midSub = subH / 2;
      axisX(ctx, w, midSub);
      label(ctx, `${carriers} orthogonal subcarriers`, 8, 11, c.text, 10, 'left', true);

      const x0 = 8;
      const x1 = w - 8;
      sym.subcarriers.forEach((s, idx) => {
        const colour = idx % 4 === 0 ? c.cyan : idx % 4 === 1 ? c.gold : idx % 4 === 2 ? c.magenta : c.violet;
        ctx.save();
        ctx.strokeStyle = colour;
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        s.y.forEach((v, i) => {
          const t = i / (s.y.length - 1);
          const x = x0 + t * (x1 - x0);
          const y = midSub - v * subH * 0.3;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
      });
      label(ctx, `k = 1 … ${carriers}, Δf = 1/Tᵤ`, x1 - 2, 11, c.textDim, 9, 'right');

      // summed signal + cyclic prefix
      grid(ctx, w, sumH, 30);
      const midSum = sumTop + sumH / 2;
      axisX(ctx, w, midSum);
      const amp = sumH * 0.32;

      // CP region shaded
      const cpFrac = cp;
      ctx.save();
      ctx.fillStyle = `${c.gold}18`;
      ctx.fillRect(x0, sumTop + 4, (x1 - x0) * cpFrac, sumH - 10);
      ctx.restore();

      // cyclic prefix (drawn as the tail of the symbol, prepended)
      ctx.save();
      ctx.strokeStyle = c.gold;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      const cpLen = Math.floor(sym.t.length * cpFrac);
      for (let i = 0; i < cpLen; i++) {
        const src = sym.t.length - cpLen + i;
        const x = x0 - (x1 - x0) * cpFrac + (i / cpLen) * (x1 - x0) * cpFrac;
        const y = midSum - sym.y[src]! * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // the useful symbol
      ctx.save();
      glow(ctx, c.green, 1.8);
      polyline(ctx, sym.t, sym.y, (t) => x0 + t * (x1 - x0), (v) => midSum - v * amp, 1);
      ctx.restore();

      label(ctx, 'summed OFDM symbol', x0 + 4, sumTop + 11, c.green, 10, 'left', true);
      label(ctx, `cyclic prefix (${(cpFrac * 100).toFixed(0)} % — pure overhead)`, x0 + 4, sumTop + 26, c.gold, 9);
      label(ctx, 'I →', x1 - 2, midSum - 10, c.textDim, 9, 'right');
    },
    [sym, carriers, cp],
  );

  return (
    <LabShell
      title="OFDM subcarriers laboratory"
      description="Individual subcarriers, their sum, and the cyclic prefix that absorbs multipath delay."
      accent="var(--gold)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'ok',
        text: `Orthogonality holds because Δf = 1/Tᵤ: the inner product of subcarrier 3 with itself over one useful symbol is ${ortho.toFixed(2)} (nonzero), and with any other subcarrier it is exactly 0. The cyclic prefix costs ${overhead.toFixed(1)} % of transmitted symbols and carries no information.`,
      }}
      readouts={makeReadouts([
        { label: 'Subcarriers', value: String(carriers), tone: 'info' },
        { label: 'Spacing Δf = 1/Tᵤ', value: '1 / Tᵤ', tone: 'info' },
        { label: 'Modulation', value: '16-QAM', tone: 'info' },
        { label: 'Bits/symbol', value: `${carriers * 4}`, tone: 'info' },
        { label: 'CP overhead', value: `${overhead.toFixed(1)} %`, tone: 'warn' },
        { label: '∫cos(2πkΔf·t)cos(2πkΔf·t)', value: `${ortho.toFixed(2)}`, tone: 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={330} label="Orthogonal OFDM subcarriers above their summed symbol with a cyclic prefix" />
    </LabShell>
  );
}

/* ==========================================================================
   DSSS and FHSS
   ========================================================================== */

export function SpreadScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { mode: 'DSSS', bits: '10110', chips: '1101001011010010', channels: 6, hopSpacing: 2600 };
  const { values, set, reset } = useLabValues(key_ ?? 'spread', { ...defaults, ...(overrides ?? {}) });

  const mode = str(values.mode, 'DSSS');
  const bits = str(values.bits, '10110').replace(/[^01]/g, '');
  const chips = str(values.chips, '1101001011010010').replace(/[^01]/g, '');
  const channels = Math.round(num(values.channels, 6));
  const hopSpacing = num(values.hopSpacing, 2600);

  const specs: Control[] = [
    { kind: 'select', id: 'mode', label: 'Technique', options: [{ value: 'DSSS', label: 'DSSS (multiply by chips)' }, { value: 'FHSS', label: 'FHSS (hop between channels)' }] },
    { kind: 'text', id: 'bits', label: 'Data bits', hint: 'One bit per unit interval.' },
    { kind: 'text', id: 'chips', label: 'Chip sequence', hint: 'Each chip is much shorter than a data bit.' },
    { kind: 'slider', id: 'channels', label: 'FHSS channels', min: 4, max: 20, step: 1 },
    { kind: 'slider', id: 'hopSpacing', label: 'Hop spacing', min: 800, max: 6000, step: 200, unit: ' Hz' },
  ];

  const dsss = useDerived(() => (bits ? D.dsssSpread(bits, chips || '1010') : null), [bits, chips]);
  const fhss = useDerived(() => (bits ? D.fhssTransmit(bits, channels, 1200, hopSpacing) : null), [bits, channels, hopSpacing]);
  const processingGain = useDerived(() => (chips ? chips.length : 0), [chips]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;

      if (mode === 'DSSS' && dsss) {
        const lanes = [
          { title: 'data d(t)', color: c.cyan, data: dsss.data },
          { title: `chip code c(t) — ${chips.length} chips per bit`, color: c.magenta, data: dsss.chips },
          { title: 'transmitted d(t)·c(t) (spread)', color: c.gold, data: dsss.spread },
        ];
        const laneH = h / 3;
        lanes.forEach((lane, li) => {
          const midY = laneH * li + laneH / 2;
          grid(ctx, w, laneH, 26);
          axisX(ctx, w, midY);
          label(ctx, lane.title, x0 + 2, laneH * li + 12, lane.color, 10, 'left', true);
          ctx.save();
          glow(ctx, lane.color, 1.5);
          ctx.beginPath();
          const step = Math.max(1, Math.floor(lane.data.length / (x1 - x0)));
          for (let i = 0; i < lane.data.length; i += step) {
            const u = i / lane.data.length;
            const x = x0 + u * (x1 - x0);
            const y = midY - lane.data[i]! * laneH * 0.3;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        });
        label(ctx, 'energy spread across N× the bandwidth; a receiver knowing the code despreads it back', x1 - 2, h - 8, c.textDim, 9, 'right');
      } else if (fhss) {
        grid(ctx, w, h, 30);
        const padL = 44;
        const padT = 22;
        const padB = 22;
        const cw = (x1 - padL) / Math.max(1, fhss.t.length - 1);
        const chH = (h - padT - padB) / channels;

        for (let r = 0; r < channels; r++) {
          const y = padT + (channels - 1 - r) * chH;
          ctx.fillStyle = 'rgba(120,160,255,.04)';
          ctx.fillRect(padL, y, x1 - padL, chH - 1);
          label(ctx, `f${r + 1}`, padL - 6, y + chH / 2, c.textDim, 9, 'right');
        }

        // hopping trace
        ctx.save();
        ctx.strokeStyle = `${c.magenta}66`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        let prevChannel = fhss.hop[0]!;
        fhss.hop.forEach((hp, i) => {
          const x = padL + i * cw;
          const y = padT + (channels - 1 - hp) * chH + chH / 2;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const py = padT + (channels - 1 - prevChannel) * chH + chH / 2;
            ctx.lineTo(x, py);
            ctx.lineTo(x, y);
          }
          prevChannel = hp;
        });
        ctx.stroke();
        ctx.restore();

        fhss.hop.forEach((hp, i) => {
          const x = padL + i * cw;
          const cellW = Math.max(2, (x1 - padL) / fhss.hop.length - 1);
          ctx.fillStyle = fhss.data[i] === 1 ? c.gold : c.cyan;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(x, padT + (channels - 1 - hp) * chH + 2, cellW, chH - 4);
        });
        ctx.globalAlpha = 1;
        label(ctx, 'FHSS — the carrier hops pseudo-randomly; an interferer can only hit a few hops', padL, 12, c.text, 10, 'left', true);
        label(ctx, 'one hop per data bit', x1 - 2, h - 8, c.textDim, 9, 'right');
      }
    },
    [mode, dsss, fhss, bits, chips, channels, hopSpacing],
  );

  return (
    <LabShell
      title="Spread spectrum laboratory"
      description="DSSS multiplies by a fast chip sequence; FHSS moves one narrowband channel around. Different mechanisms."
      accent="var(--gold)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: `Processing gain here is ${processingGain} (${(20 * Math.log10(Math.max(1, processingGain))).toFixed(1)} dB) — the ratio of spread to unspread bandwidth. That figure is only a real SNR gain against a *narrowband* interferer. A spread receiver also collects noise across the wide band, so against broadband thermal noise the net gain is far smaller.`,
      }}
      readouts={makeReadouts([
        { label: 'Technique', value: mode, tone: 'info' },
        { label: 'Chips per bit', value: String(processingGain), tone: 'info' },
        { label: 'Processing gain', value: `${(20 * Math.log10(Math.max(1, processingGain))).toFixed(1)} dB`, tone: 'info' },
        { label: 'Hop channels', value: String(channels), tone: 'info' },
        { label: 'Hop dwell time', value: `${(1 / Math.max(1, bits.length)).toFixed(3)} s`, tone: 'info' },
        { label: 'Gain vs broadband noise', value: 'much less', tone: 'warn' },
      ])}
    >
      <VizCanvas draw={draw} height={320} label="DSSS chip multiplication in three lanes, or an FHSS hopping pattern over a channel grid" />
    </LabShell>
  );
}

/* ==========================================================================
   Bit rate / baud / bandwidth table
   ========================================================================== */

export function RateCompareScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { rb: 9600, alpha: 0.35, m: 16 };
  const { values, set, reset } = useLabValues(key_ ?? 'rate', { ...defaults, ...(overrides ?? {}) });

  const rb = num(values.rb, 9600);
  const alpha = num(values.alpha, 0.35);
  const m = Math.round(num(values.m, 16));

  const specs: Control[] = [
    { kind: 'slider', id: 'rb', label: 'Bit rate', min: 300, max: 51200, step: 100, unit: ' bit/s', format: (v) => v.toFixed(0) },
    { kind: 'slider', id: 'alpha', label: 'Roll-off factor α', min: 0, max: 1, step: 0.05, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'm', label: 'Constellation size M', min: 2, max: 256, step: 2, format: (v) => String(Math.round(v)) },
  ];

  const rows = useDerived(() => {
    const schemes = [
      { name: 'BPSK', order: 2, kind: 'PSK' },
      { name: 'QPSK', order: 4, kind: 'PSK' },
      { name: '8-PSK', order: 8, kind: 'PSK' },
      { name: '16-QAM', order: 16, kind: 'QAM' },
      { name: '64-QAM', order: 64, kind: 'QAM' },
    ];
    return schemes.map((s) => {
      const k = Math.log2(s.order);
      const rs = rb / k;
      const bw = (1 + alpha) * rs;
      return {
        name: s.name,
        k,
        rs,
        bw,
        eta: rb / bw,
        ceiling: k,
        dMin: 2 * Math.sin(Math.PI / s.order),
      };
    });
  }, [rb, alpha]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const rowsN = rows.length;
      const rowH = Math.min(30, (h - 10) / rowsN);
      const labelW = 58;
      const maxBw = Math.max(...rows.map((r) => r.bw));

      label(ctx, 'bandwidth (Hz) — bar length', 8, 10, c.text, 10, 'left', true);
      label(ctx, 'η = R_b / B', w - 8, 10, c.gold, 10, 'right', true);

      rows.forEach((r, i) => {
        const y = 20 + i * rowH;
        label(ctx, r.name, labelW, y + rowH / 2 - 1, c.text, 10, 'left', true);
        const barW = ((w - labelW - 46) * r.bw) / maxBw;
        ctx.fillStyle = i % 2 === 0 ? `${c.cyan}55` : `${c.cyan}33`;
        ctx.fillRect(labelW + 6, y + rowH * 0.22, barW, rowH * 0.5);
        label(ctx, `${r.bw.toFixed(0)} Hz`, labelW + 10 + barW, y + rowH / 2 - 1, c.textDim, 9);
        label(ctx, `${r.eta.toFixed(2)} b/s/Hz`, w - 8, y + rowH / 2 - 1, c.gold, 9.5, 'right', true);
      });
    },
    [rows],
  );

  return (
    <LabShell
      title="Bit rate, baud and bandwidth"
      description="One bit rate held fixed while the modulation order changes — watch symbol rate, bandwidth and efficiency move together."
      accent="var(--cyan)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: `B = (1 + α)·R_s is the raised-cosine convention used throughout SignalLab. α = 0 gives B = R_s, which is the limit of an infinitely long pulse — the familiar “bandwidth = symbol rate” is only that special case. Spectral efficiency is capped at log₂M; the selected M = ${m} would cap it at ${Math.log2(m).toFixed(0)} bit/s/Hz.`,
      }}
      readouts={makeReadouts([
        { label: 'Bit rate', value: `${rb.toFixed(0)} bit/s`, tone: 'info' },
        { label: 'Roll-off α', value: alpha.toFixed(2), tone: 'info' },
        { label: '16-QAM symbol rate', value: `${(rb / 4).toFixed(0)} baud`, tone: 'info' },
        { label: '16-QAM bandwidth', value: `${((1 + alpha) * rb) / 4 < 1e6 ? ((1 + alpha) * rb / 4).toFixed(0) + ' Hz' : ((1 + alpha) * rb / 4 / 1000).toFixed(1) + ' kHz'}`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={190} label="Bar comparison of required bandwidth across six modulations at one bit rate" isStatic />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[440px] border-collapse text-[12.3px]">
          <thead>
            <tr>
              {['Scheme', 'bits/sym', 'Symbol rate', 'Bandwidth', 'η (bit/s/Hz)', 'ceiling', 'd_min'].map((h) => (
                <th key={h} className="border-b px-2.5 py-2 text-left text-[10.5px] tracking-[0.08em] text-faint uppercase" style={{ borderColor: 'var(--stroke)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="border-b px-2.5 py-1.5 font-medium">{r.name}</td>
                <td className="mono border-b px-2.5 py-1.5 text-dim">{r.k}</td>
                <td className="mono border-b px-2.5 py-1.5 text-dim">{r.rs.toFixed(0)} baud</td>
                <td className="mono border-b px-2.5 py-1.5 text-dim">{r.bw.toFixed(0)} Hz</td>
                <td className="mono border-b px-2.5 py-1.5" style={{ color: 'var(--gold)' }}>{r.eta.toFixed(2)}</td>
                <td className="mono border-b px-2.5 py-1.5 text-faint">{r.ceiling.toFixed(0)}</td>
                <td className="mono border-b px-2.5 py-1.5 text-faint">{r.dMin.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LabShell>
  );
}

/* ==========================================================================
   AM laboratory
   ========================================================================== */

export function AmLabScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { fm: 0.04, ma: 0.6, carrier: 30, variant: 'DSB-FC' };
  const { values, set, reset } = useLabValues(key_ ?? 'am-lab', { ...defaults, ...(overrides ?? {}) });

  const fm = num(values.fm, 0.04);
  const ma = num(values.ma, 0.6);
  const carrier = num(values.carrier, 30);
  const variant = str(values.variant, 'DSB-FC');

  const specs: Control[] = [
    { kind: 'slider', id: 'fm', label: 'Message frequency', min: 0.005, max: 0.15, step: 0.005, unit: ' Hz', format: (v) => v.toFixed(3) },
    { kind: 'slider', id: 'ma', label: 'Modulation index m', min: 0, max: 1.8, step: 0.02, format: (v) => (v * 100).toFixed(0) + '%' },
    { kind: 'slider', id: 'carrier', label: 'Carrier frequency', min: 8, max: 80, step: 1, unit: ' Hz' },
    { kind: 'select', id: 'variant', label: 'Variant', options: [{ value: 'DSB-FC', label: 'DSB-FC (full carrier)' }, { value: 'DSB-SC', label: 'DSB-SC (suppressed)' }, { value: 'SSB', label: 'SSB (one sideband)' }] },
  ];

  const overmodulated = ma > 1;
  const power = useDerived(() => {
    const total = D.amTotalPower(1, ma);
    return { total, sidebands: total - 1, efficiency: 1 / total };
  }, [ma]);
  const bw = variant === 'SSB' ? fm : 2 * fm;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const lanes = h / 3;
      const toX = (t: number) => x0 + t * (x1 - x0);
      const msg = (t: number) => Math.sin(2 * Math.PI * fm * t);

      for (let li = 0; li < 3; li++) {
        grid(ctx, w, lanes, 26);
        axisX(ctx, w, lanes * li + lanes / 2);
      }

      // 1. message
      ctx.save();
      glow(ctx, c.cyan, 1.5);
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const t = (i / 300) * 1;
        const y = lanes / 2 - msg(t) * lanes * 0.32;
        if (i === 0) ctx.moveTo(toX(t), y);
        else ctx.lineTo(toX(t), y);
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, 'message m(t)', x0 + 2, 11, c.cyan, 10, 'left', true);

      // 2. modulated carrier
      const mid2 = lanes * 1.5;
      const amp = lanes * 0.3;
      ctx.save();
      glow(ctx, overmodulated ? c.red : c.gold, 1.5);
      ctx.beginPath();
      for (let i = 0; i <= 1200; i++) {
        const t = (i / 1200) * 1;
        const env = variant === 'DSB-SC' ? msg(t) * ma : 1 + ma * msg(t);
        const y = mid2 - env * Math.cos(2 * Math.PI * carrier * t) * amp;
        if (i === 0) ctx.moveTo(toX(t), y);
        else ctx.lineTo(toX(t), y);
      }
      ctx.stroke();
      ctx.restore();

      // envelope for DSB-FC
      if (variant === 'DSB-FC') {
        ctx.save();
        ctx.strokeStyle = `${c.magenta}aa`;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 1.4;
        for (const s of [1, -1]) {
          ctx.beginPath();
          for (let i = 0; i <= 300; i++) {
            const t = (i / 300) * 1;
            const y = mid2 - s * (1 + ma * msg(t)) * amp;
            if (i === 0) ctx.moveTo(toX(t), y);
            else ctx.lineTo(toX(t), y);
          }
          ctx.stroke();
        }
        ctx.restore();
        label(ctx, `envelope ±(1 + m·cos) — ${ma > 1 ? 'INVERTED (overmodulated)' : 'follows the message'}`, x1 - 2, lanes + 11, overmodulated ? c.red : c.magenta, 9.5, 'right', true);
      } else {
        label(ctx, `${variant} — no carrier line to detect`, x1 - 2, lanes + 11, c.gold, 9.5, 'right');
      }
      label(ctx, 'AM waveform', x0 + 2, lanes + 11, c.gold, 10, 'left', true);

      // 3. spectrum
      const mid3 = lanes * 2.5;
      const fMax = Math.max(carrier * 2, fm * 6);
      const fToX = (f: number) => x0 + (f / fMax) * (x1 - x0);
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.beginPath();
      ctx.moveTo(x0, mid3 + lanes * 0.32);
      ctx.lineTo(x1, mid3 + lanes * 0.32);
      ctx.stroke();
      const stem = (f: number, hgt: number, color: string, name: string) => {
        const x = fToX(f);
        const y = mid3 + lanes * 0.32 - hgt * lanes * 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(x, mid3 + lanes * 0.32);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        label(ctx, name, x, y - 7, color, 8.5, 'center', true);
      };
      if (variant !== 'DSB-SC') stem(carrier, 1, c.cyan, 'fc');
      if (variant !== 'SSB') stem(carrier - fm, ma / 2, c.magenta, 'LSB');
      stem(carrier + fm, ma / 2, c.magenta, 'USB');
      label(ctx, 'spectrum', x0 + 2, lanes * 2 + 11, c.text, 10, 'left', true);
      ctx.restore();
    },
    [fm, ma, carrier, variant, overmodulated],
  );

  return (
    <LabShell
      title="Amplitude modulation laboratory"
      description="Push m past 1.0 and watch the envelope invert and the detected message distort."
      accent="var(--gold)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: overmodulated ? 'bad' : ma >= 0.95 ? 'warn' : 'ok',
        text: overmodulated
          ? `Overmodulation: m = ${ma.toFixed(2)} > 1. The envelope crosses zero and reappears with reversed phase, so an envelope detector cannot follow it and the recovered message is badly distorted. Bring m back below 1.`
          : ma >= 0.95
            ? `m = ${(ma * 100).toFixed(0)} % is close to 1. Full modulation uses the most sideband power while staying distortion-free; this is why broadcast keeps m ≈ 1 rather than overmodulating.`
            : `m = ${(ma * 100).toFixed(0)} %: undistorted, but only ${(power.efficiency * 100).toFixed(1)} % of the transmitted power carries information — the rest is carrier.`,
      }}
      readouts={makeReadouts([
        { label: 'Modulation index', value: `${(ma * 100).toFixed(0)} %`, tone: overmodulated ? 'bad' : 'info' },
        { label: 'Bandwidth', value: `${(bw * 1000).toFixed(1)} Hz (2 f_m)`, tone: 'info' },
        { label: 'Total power', value: `${power.total.toFixed(3)} × P_c`, tone: 'info' },
        { label: 'Sideband power', value: `${power.sidebands.toFixed(3)} × P_c`, tone: 'info' },
        { label: 'Power efficiency', value: `${(power.efficiency * 100).toFixed(1)} %`, tone: 'warn' },
        { label: 'Peak envelope', value: `${(1 + ma).toFixed(2)} / ${(1 - ma).toFixed(2)}`, tone: overmodulated ? 'bad' : 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={330} label="AM message, modulated carrier with envelope, and resulting spectrum" />
    </LabShell>
  );
}

/* ==========================================================================
   FM / PM laboratory
   ========================================================================== */

export function FmLabScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { fm: 0.03, df: 1.2, fc: 20, mode: 'FM', pm: 1.6 };
  const { values, set, reset } = useLabValues(key_ ?? 'fm-lab', { ...defaults, ...(overrides ?? {}) });

  const fm = num(values.fm, 0.03);
  const df = num(values.df, 1.2);
  const fc = num(values.fc, 20);
  const mode = str(values.mode, 'FM');
  const mp = num(values.pm, 1.6);

  const specs: Control[] = [
    { kind: 'slider', id: 'fm', label: 'Message frequency', min: 0.005, max: 0.2, step: 0.005, unit: ' Hz', format: (v) => v.toFixed(3) },
    { kind: 'slider', id: 'df', label: 'Peak deviation Δf', min: 0, max: 8, step: 0.1, unit: ' Hz', format: (v) => v.toFixed(1) },
    { kind: 'slider', id: 'fc', label: 'Carrier frequency', min: 6, max: 60, step: 1, unit: ' Hz' },
    { kind: 'select', id: 'mode', label: 'Mode', options: [{ value: 'FM', label: 'FM (constant deviation)' }, { value: 'PM', label: 'PM (constant phase deviation)' }] },
    { kind: 'slider', id: 'pm', label: 'Phase deviation (PM)', min: 0, max: 4, step: 0.1, unit: ' rad', format: (v) => v.toFixed(1) },
  ];

  const carson = useDerived(() => D.carsonBandwidth(df, fm), [df, fm]);
  const beta = useDerived(() => (fm > 0 ? df / fm : 0), [df, fm]);
  const pmEquivalentDf = useDerived(() => (mp * fm) / (2 * Math.PI), [mp, fm]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const waveH = h * 0.55;
      const specTop = waveH + 8;
      const midY = waveH / 2;
      const toX = (t: number) => x0 + t * (x1 - x0);

      grid(ctx, w, waveH, 26);
      axisX(ctx, w, midY);

      // message
      ctx.save();
      glow(ctx, c.cyan, 1.3);
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const t = i / 300;
        const y = midY - Math.sin(2 * Math.PI * fm * t) * waveH * 0.28;
        if (i === 0) ctx.moveTo(toX(t), y);
        else ctx.lineTo(toX(t), y);
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, 'message', x0 + 2, 11, c.cyan, 10, 'left', true);

      // modulated waveform — constant amplitude, varying phase
      ctx.save();
      glow(ctx, c.gold, 1.5);
      ctx.beginPath();
      const amp = waveH * 0.32;
      for (let i = 0; i <= 1600; i++) {
        const t = (i / 1600) * 1;
        const phase = mode === 'FM' ? beta * Math.sin(2 * Math.PI * fm * t) : mp * Math.sin(2 * Math.PI * fm * t);
        const y = midY - Math.cos(2 * Math.PI * fc * t + phase) * amp;
        if (i === 0) ctx.moveTo(toX(t), y);
        else ctx.lineTo(toX(t), y);
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, `${mode} waveform (constant amplitude)`, x0 + 2, waveH - 6, c.gold, 10, 'left', true);

      // instantaneous frequency plot
      const specH = h - specTop - 4;
      grid(ctx, w, specH, 26);
      const ifMid = specTop + specH / 2;
      const devScale = specH * 0.35;
      ctx.save();
      glow(ctx, c.magenta, 1.5);
      ctx.beginPath();
      for (let i = 0; i <= 400; i++) {
        const t = i / 400;
        const f = mode === 'FM' ? fc + df * Math.cos(2 * Math.PI * fm * t) : fc + (mp * fm / (2 * Math.PI)) * Math.cos(2 * Math.PI * fm * t);
        const y = ifMid - ((f - fc) / Math.max(df, 1)) * devScale;
        if (i === 0) ctx.moveTo(toX(t), y);
        else ctx.lineTo(toX(t), y);
      }
      ctx.stroke();
      ctx.restore();
      label(ctx, 'instantaneous frequency − f_c', x0 + 2, specTop + 10, c.magenta, 9.5, 'left', true);
      label(ctx, mode === 'FM' ? `±${df.toFixed(1)} Hz (flat, independent of f_m)` : `±${pmEquivalentDf.toFixed(2)} Hz (∝ f_m)`, x1 - 2, specTop + 10, c.textDim, 9, 'right');
    },
    [fm, df, fc, mode, mp, beta, pmEquivalentDf],
  );

  return (
    <LabShell
      title="FM / PM laboratory"
      description="Change the deviation and watch the zero crossings spread; switch to PM and the deviation itself becomes frequency-dependent."
      accent="var(--green)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text:
          mode === 'FM'
            ? `FM holds the deviation Δf constant, so β = Δf/f_m = ${beta.toFixed(1)} varies with message frequency. Carson estimates ${carson.toFixed(0)} Hz of bandwidth — an estimate retaining ~98 % of power, not an exact result.`
            : `PM holds the phase deviation m_p constant, so the equivalent frequency deviation scales with f_m (here ±${pmEquivalentDf.toFixed(2)} Hz). Applying a −6 dB/octave filter after a PM modulator gives exactly the FM signal.`,
      }}
      readouts={makeReadouts([
        { label: 'Mode', value: mode, tone: 'info' },
        { label: 'Modulation index β', value: mode === 'FM' ? beta.toFixed(2) : `n/a (PM)`, tone: 'info' },
        { label: "Carson's estimate", value: `${carson.toFixed(0)} Hz`, tone: 'info' },
        { label: 'Carrier swing', value: `${(2 * df).toFixed(1)} Hz`, tone: 'info' },
        { label: 'Classification', value: df < fm && fm > 0 ? 'narrowband FM' : df > 0 ? 'wideband FM' : 'unmodulated', tone: 'info' },
        { label: 'Peak deviation', value: mode === 'FM' ? `${df.toFixed(1)} Hz` : `${pmEquivalentDf.toFixed(2)} Hz`, tone: 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={320} label="FM or PM waveform above its instantaneous frequency deviation" />
    </LabShell>
  );
}

/* ==========================================================================
   Superheterodyne receiver
   ========================================================================== */

export function ReceiverScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { rf: 100, ifFreq: 10.7, injection: 'high', rejection: 30 };
  const { values, set, reset } = useLabValues(key_ ?? 'receiver', { ...defaults, ...(overrides ?? {}) });

  const rf = num(values.rf, 100);
  const ifFreq = num(values.ifFreq, 10.7);
  const injection = str(values.injection, 'high');
  const rejection = num(values.rejection, 30);

  const specs: Control[] = [
    { kind: 'slider', id: 'rf', label: 'Tuned signal f_RF', min: 88, max: 108, step: 0.1, unit: ' MHz', format: (v) => v.toFixed(1) },
    { kind: 'slider', id: 'ifFreq', label: 'Intermediate frequency', min: 0.5, max: 30, step: 0.1, unit: ' MHz', format: (v) => v.toFixed(1) },
    { kind: 'select', id: 'injection', label: 'Injection side', options: [{ value: 'high', label: 'High-side (LO above signal)' }, { value: 'low', label: 'Low-side (LO below signal)' }] },
    { kind: 'slider', id: 'rejection', label: 'Preselector rejection of image', min: 0, max: 80, step: 1, unit: ' dB' },
  ];

  const plan = useDerived(
    () => ({
      lo: injection === 'high' ? rf + ifFreq : Math.max(0.1, rf - ifFreq),
      image: injection === 'high' ? rf + 2 * ifFreq : Math.max(0.1, rf - 2 * ifFreq),
    }),
    [rf, ifFreq, injection],
  );

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;

      // spectrum along RF
      const specH = h * 0.44;
      grid(ctx, w, specH, 26);
      const fMin = 85;
      const fMax = 135;
      const fToX = (f: number) => x0 + ((f - fMin) / (fMax - fMin)) * (x1 - x0);
      const baseY = specH - 12;

      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.beginPath();
      ctx.moveTo(x0, baseY);
      ctx.lineTo(x1, baseY);
      ctx.stroke();

      const stem = (f: number, hgt: number, color: string, name: string, sub?: string) => {
        const x = fToX(f);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.6;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, baseY - hgt * specH * 0.42);
        ctx.stroke();
        ctx.shadowBlur = 0;
        label(ctx, name, x, baseY - hgt * specH * 0.42 - 10, color, 9, 'center', true);
        if (sub) label(ctx, sub, x, baseY - hgt * specH * 0.42 - 22, color, 8, 'center');
      };

      stem(rf, 1, c.green, 'wanted', 'f_RF');
      stem(plan.lo, 0.7, c.cyan, 'LO', 'f_LO');
      stem(plan.image, 0.85, c.red, 'image', 'same IF!');
      label(ctx, 'RF band', x0 + 2, 11, c.text, 10, 'left', true);
      label(ctx, `${fMin}–${fMax} MHz`, x1, baseY + 10, c.textDim, 9, 'right');
      ctx.restore();

      // receiver chain
      const chainTop = specH + 10;
      const chainH = h - chainTop;
      const stages = [
        { n: 'RF + preselector', c: c.green },
        { n: 'Mixer', c: c.magenta },
        { n: 'IF filter + amp', c: c.cyan },
        { n: 'AGC', c: c.gold },
        { n: 'Detector', c: c.violet },
      ];
      const bw = (x1 - x0 - (stages.length - 1) * 8) / stages.length;
      ctx.save();
      stages.forEach((s, i) => {
        const bx = x0 + i * (bw + 8);
        const hot = i === 1;
        ctx.fillStyle = hot ? `${c.magenta}22` : 'rgba(255,255,255,.03)';
        ctx.strokeStyle = hot ? c.magenta : c.axis;
        ctx.lineWidth = hot ? 1.7 : 1.1;
        ctx.strokeRect(bx, chainTop + 4, bw, chainH * 0.5);
        ctx.fill();
        label(ctx, s.n, bx + bw / 2, chainTop + 4 + chainH * 0.25, hot ? c.magenta : c.text, 8.5, 'center');
        if (i < stages.length - 1) {
          ctx.strokeStyle = c.axis;
          ctx.beginPath();
          ctx.moveTo(bx + bw, chainTop + 4 + chainH * 0.25);
          ctx.lineTo(bx + bw + 7, chainTop + 4 + chainH * 0.25);
          ctx.stroke();
        }
      });
      ctx.restore();
      label(ctx, 'superheterodyne chain — only the RF filter can reject the image', x0 + 2, chainTop + chainH * 0.5 + 14, c.text, 9.5, 'left', true);
    },
    [rf, plan, injection],
  );

  return (
    <LabShell
      title="Superheterodyne receiver"
      description="Tune the front end and watch the local oscillator, the intermediate frequency and the image all move together."
      accent="var(--green)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: rejection >= 40 ? 'ok' : rejection >= 20 ? 'warn' : 'bad',
        text: `High-side convention: f_LO = f_RF + f_IF. The image at ${plan.image.toFixed(1)} MHz produces the same ${ifFreq.toFixed(1)} MHz intermediate frequency, so no filter after the mixer can separate it. Image rejection equals whatever the RF preselector provides — ${rejection} dB here, and nothing else in the receiver can improve on that.`,
      }}
      readouts={makeReadouts([
        { label: 'Signal f_RF', value: `${rf.toFixed(1)} MHz`, tone: 'info' },
        { label: `f_LO (${injection === 'high' ? 'high' : 'low'}-side)`, value: `${plan.lo.toFixed(1)} MHz`, tone: 'info' },
        { label: 'Intermediate f_IF', value: `${ifFreq.toFixed(1)} MHz`, tone: 'good' },
        { label: 'Image frequency', value: `${plan.image.toFixed(1)} MHz`, tone: 'bad' },
        { label: 'Image rejection', value: `${rejection} dB`, tone: rejection >= 40 ? 'good' : 'warn' },
        { label: 'Tuning range needed', value: `${(injection === 'high' ? plan.lo - rf : rf - plan.lo).toFixed(1)} MHz`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={300} label="RF spectrum showing wanted signal, local oscillator and image, above the receiver block chain" />
    </LabShell>
  );
}

/* ==========================================================================
   AM / FM / PM comparison
   ========================================================================== */

export function ModCompareScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { fm: 0.04, ma: 1, df: 2 };
  const { values, set, reset } = useLabValues(key_ ?? 'mod-compare', { ...defaults, ...(overrides ?? {}) });

  const fm = num(values.fm, 0.04);
  const ma = num(values.ma, 1);
  const df = num(values.df, 2);

  const specs: Control[] = [
    { kind: 'slider', id: 'fm', label: 'Message frequency', min: 0.005, max: 0.2, step: 0.005, unit: ' Hz', format: (v) => v.toFixed(3) },
    { kind: 'slider', id: 'ma', label: 'AM index m', min: 0, max: 1.5, step: 0.05, format: (v) => `${(v * 100).toFixed(0)}%` },
    { kind: 'slider', id: 'df', label: 'FM deviation Δf', min: 0, max: 10, step: 0.1, unit: ' Hz' },
  ];

  const data = useDerived(() => {
    const amBw = 2 * fm;
    const fmBw = D.carsonBandwidth(df, fm);
    const pt = D.amTotalPower(1, ma);
    return {
      amBw,
      fmBw,
      pt,
      beta: fm > 0 ? df / fm : 0,
      improvement: 1 + (fm > 0 ? (df / fm) ** 2 : 0) / 2,
    };
  }, [fm, ma, df]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const schemes = [
        { name: 'AM', color: c.gold, bw: data.amBw, param: 'amplitude' },
        { name: 'FM', color: c.green, bw: data.fmBw, param: 'frequency' },
        { name: 'PM', color: c.magenta, bw: data.fmBw, param: 'phase' },
      ];
      const rowH = h / 3;
      const maxBw = Math.max(...schemes.map((s) => s.bw));

      label(ctx, 'occupied bandwidth for the same message', 8, 11, c.text, 10, 'left', true);
      schemes.forEach((s, i) => {
        const y = 22 + i * rowH;
        label(ctx, s.name, 34, y + rowH / 2 - 6, s.color, 11, 'left', true);
        const barW = Math.max(4, ((w - 90) * s.bw) / maxBw);
        ctx.fillStyle = `${s.color}55`;
        ctx.fillRect(52, y + rowH * 0.18, barW, rowH * 0.34);
        label(ctx, `${s.bw.toFixed(0)} Hz`, 56 + barW, y + rowH / 2 - 6, c.textDim, 9.5);
        label(ctx, s.param, w - 8, y + rowH / 2 - 6, s.color, 9.5, 'right');
      });
    },
    [data],
  );

  return (
    <LabShell
      title="AM vs FM vs PM"
      description="Three modulations of the same message, compared on the parameters that actually differ."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: `FM/PM bandwidth is Carson's estimate, not an exact figure — a real FM spectrum has infinitely many sidebands. AM power follows P_T = P_C(1 + m²/2) for a single-tone message only. The FM improvement factor shown here is the ideal wideband expression; real systems also pay a threshold effect below a certain input SNR.`,
      }}
      readouts={makeReadouts([
        { label: 'AM bandwidth', value: `${data.amBw.toFixed(0)} Hz`, tone: 'info' },
        { label: 'FM (Carson)', value: `${data.fmBw.toFixed(0)} Hz`, tone: 'info' },
        { label: 'FM index β', value: data.beta.toFixed(2), tone: 'info' },
        { label: 'AM total power', value: `${data.pt.toFixed(3)} × P_c`, tone: 'warn' },
        { label: 'AM power efficiency', value: `${((1 / data.pt) * 100).toFixed(1)} %`, tone: 'warn' },
        { label: 'FM improvement factor', value: `${data.improvement.toFixed(2)} (${(10 * Math.log10(data.improvement)).toFixed(1)} dB)`, tone: 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={170} label="Bar comparison of AM, FM and PM bandwidth for the same message" isStatic />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[12.3px]">
          <thead>
            <tr>
              {['Property', 'AM', 'FM', 'PM'].map((h) => (
                <th key={h} className="border-b px-2.5 py-2 text-left text-[10.5px] tracking-[0.08em] text-faint uppercase" style={{ borderColor: 'var(--stroke)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Information parameter', 'amplitude', 'frequency', 'phase'],
              ['Envelope', 'varies', 'constant', 'constant'],
              ['Bandwidth (this message)', `${data.amBw.toFixed(0)} Hz`, `${data.fmBw.toFixed(0)} Hz (est.)`, `${data.fmBw.toFixed(0)} Hz (est.)`],
              ['Noise behaviour', 'envelope detector: noise passes', 'limiter removes amplitude noise', 'as FM'],
              ['Transmitter linearity', 'linear amplifier required', 'nonlinear amplifier usable', 'as FM'],
              ['Capture effect', 'no', 'yes (conditional)', 'yes (conditional)'],
              ['Typical use', 'broadcast, two-way radio', 'broadcast, two-way radio', 'as an FM implementation stage'],
            ].map((row) => (
              <tr key={row[0]!}>
                <td className="border-b px-2.5 py-1.5 text-dim">{row[0]}</td>
                <td className="border-b px-2.5 py-1.5">{row[1]}</td>
                <td className="border-b px-2.5 py-1.5">{row[2]}</td>
                <td className="border-b px-2.5 py-1.5">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LabShell>
  );
}

/* ==========================================================================
   Noise + capture effect
   ========================================================================== */

export function NoiseScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { noise: 0.25, competing: 0.4, fm: 0.02, separation: 0.02 };
  const { values, set, reset } = useLabValues(key_ ?? 'noise-lab', { ...defaults, ...(overrides ?? {}) });

  const noise = num(values.noise, 0.25);
  const competing = num(values.competing, 0.4);
  const fm = num(values.fm, 0.02);
  const sep = num(values.separation, 0.02);

  const specs: Control[] = [
    { kind: 'slider', id: 'noise', label: 'AWGN level', min: 0, max: 1.2, step: 0.05, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'competing', label: 'Competing signal strength', min: 0, max: 1.5, step: 0.05, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'fm', label: 'Message frequency', min: 0.005, max: 0.1, step: 0.005, unit: ' Hz', format: (v) => v.toFixed(3) },
    { kind: 'slider', id: 'separation', label: 'Frequency offset of competitor', min: 0.005, max: 0.1, step: 0.005, unit: ' Hz', format: (v) => v.toFixed(3) },
  ];

  const outcome = useDerived(() => {
    if (competing <= 0.01) return 'single';
    if (competing > 1.05) return 'capture';
    if (competing < 0.85) return 'suppressed';
    return 'partial';
  }, [competing]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const x0 = 8;
      const x1 = w - 8;
      const lanes = h / 3;
      const rand = D.createRng(0xfeed + Math.round(noise * 100));

      const drawLane = (li: number, title: string, amp: number, fn: (t: number) => number, colour: string) => {
        const midY = lanes * li + lanes / 2;
        grid(ctx, w, lanes, 26);
        axisX(ctx, w, midY);
        label(ctx, title, x0 + 2, lanes * li + 12, colour, 10, 'left', true);
        ctx.save();
        glow(ctx, colour, 1.4);
        ctx.beginPath();
        for (let i = 0; i <= 600; i++) {
          const t = i / 600;
          const y = midY - fn(t) * amp;
          if (i === 0) ctx.moveTo(x0 + t * (x1 - x0), y);
          else ctx.lineTo(x0 + t * (x1 - x0), y);
        }
        ctx.stroke();
        ctx.restore();
      };

      // AM: noise passes straight through
      drawLane(0, 'AM — detector output (noise passes 1:1)', lanes * 0.3, (t) => {
        const m = Math.sin(2 * Math.PI * fm * t);
        return m + D.gaussian(rand) * noise * 0.5;
      }, c.gold);

      // FM limiter: amplitude noise removed
      drawLane(1, 'FM — after limiter (amplitude noise removed)', lanes * 0.3, (t) => {
        const m = Math.sin(2 * Math.PI * fm * t);
        return m + D.gaussian(rand) * noise * 0.06;
      }, c.green);

      // capture demonstration
      drawLane(2, `FM with competing signal — ${outcome === 'capture' ? 'stronger signal CAPTURES the limiter' : 'weaker signal suppressed'}`, lanes * 0.3, (t) => {
        const m = Math.sin(2 * Math.PI * fm * t);
        const w = competing > 1.05 ? 1 : competing < 0.85 ? 0.05 : 0.5;
        const other = Math.sin(2 * Math.PI * (fm + sep) * t + 1.1);
        return m + w * other + D.gaussian(rand) * noise * 0.08;
      }, outcome === 'capture' ? c.magenta : c.cyan);
    },
    [noise, competing, fm, sep, outcome],
  );

  return (
    <LabShell
      title="AM vs FM noise and the capture effect"
      description="Same noise on both channels; then two FM signals competing for the same limiter."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: outcome === 'capture' ? 'warn' : 'info',
        text:
          outcome === 'capture'
            ? `The competing signal at ${(competing * 100).toFixed(0)} % of the wanted one drives the limiter into limiting while the wanted signal does not — so it suppresses the weaker. This is the capture effect. It requires a limiter and a strength difference; two equal-strength signals still interfere, and FM is not immune to noise.`
            : `The competing signal is not strong enough to capture. Raise it above the wanted level to see the limiter switch abruptly.`,
      }}
      readouts={makeReadouts([
        { label: 'Noise (σ)', value: noise.toFixed(2), tone: 'info' },
        { label: 'Competitor strength', value: `${(competing * 100).toFixed(0)} %`, tone: 'info' },
        { label: 'Outcome', value: outcome, tone: outcome === 'capture' ? 'warn' : 'good' },
        { label: 'AM output SNR change', value: '−3 dB per doubling of noise', tone: 'bad' },
        { label: 'FM after limiter', value: 'amplitude noise removed', tone: 'good' },
        { label: 'Threshold effect', value: 'exists below a minimum SNR', tone: 'warn' },
      ])}
    >
      <VizCanvas draw={draw} height={330} label="Three lanes: AM detector output, FM after limiter, and FM with a competing signal" />
    </LabShell>
  );
}

/* ==========================================================================
   CRC laboratory
   ========================================================================== */

export function CrcScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { message: '1101', generator: '1011', flip: -1 };
  const { values, set, reset } = useLabValues(key_ ?? 'crc', { ...defaults, ...(overrides ?? {}) });

  const message = str(values.message, '1101').replace(/[^01]/g, '').slice(0, 24) || '1101';
  const generator = str(values.generator, '1011').replace(/[^01]/g, '').slice(0, 17) || '1011';
  const flip = Math.round(num(values.flip, -1));

  const specs: Control[] = [
    { kind: 'text', id: 'message', label: 'Message bits', hint: 'Up to 24 bits.' },
    { kind: 'text', id: 'generator', label: 'Generator polynomial', hint: 'Binary, e.g. 1011 = x³+x+1.' },
    { kind: 'slider', id: 'flip', label: 'Inject an error at bit position', min: -1, max: message.length + generator.length - 1, step: 1, format: (v) => (v < 0 ? 'none' : `${Math.round(v)}`) },
  ];

  const result = useDerived(() => D.crcCompute(message, generator), [message, generator]);

  const received = useDerived(() => {
    if (flip < 0 || flip >= result.codeword.length) return result.codeword;
    const arr = result.codeword.split('');
    arr[flip] = arr[flip] === '1' ? '0' : '1';
    return arr.join('');
  }, [result.codeword, flip]);

  const check = useDerived(() => D.crcCheck(received, generator), [received, generator]);
  const r = result.remainder.length;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const cw = (w - 16) / Math.max(1, received.length);

      const drawRow = (y: number, title: string, bits: string, colour: (i: number, bit: string) => string, diffFrom?: string) => {
        label(ctx, title, 8, y - 10, c.text, 9.5, 'left', true);
        for (let i = 0; i < bits.length; i++) {
          const x = 8 + i * cw;
          ctx.fillStyle = colour(i, bits[i]!);
          ctx.fillRect(x + 0.5, y, Math.max(2, cw - 1), 26);
          label(ctx, bits[i]!, x + cw / 2, y + 13, '#04121a', 10, 'center', true);
          if (diffFrom !== undefined && bits[i] !== diffFrom[i]) {
            ctx.strokeStyle = c.red;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 0.5, y, Math.max(2, cw - 1), 26);
          }
        }
      };

      drawRow(24, 'message', message, () => c.cyan + 'cc');
      drawRow(72, `augmented (${r} zeros appended)`, result.augmented, () => c.violet + '88');
      drawRow(120, 'codeword (message + remainder)', result.codeword, (i) => (i >= message.length ? c.gold + 'cc' : c.green + 'cc'));
      drawRow(168, 'received (after channel)', received, (i) => (i >= message.length ? c.gold + 'cc' : c.green + 'cc'), result.codeword);

      // remainder check result
      label(ctx, `divisor g = ${generator}  (degree ${r})`, 8, h - 40, c.textDim, 9.5);
      label(ctx, `remainder after dividing the received word = ${check ? 'all zeros → PASS' : 'non-zero → ERROR DETECTED'}`, 8, h - 22, check ? c.green : c.red, 11, 'left', true);

      // step list
      label(ctx, `XOR steps: ${result.steps.length} shown`, 8, h - 6, c.textDim, 9);
      result.steps.slice(0, 3).forEach((s, i) => {
        label(ctx, `p${s.position}: ${s.before} ⊕ ${s.generator} = ${s.after}`, w - 8, 24 + i * 14, c.textDim, 8.5, 'right');
      });
    },
    [message, generator, result, received, check, r],
  );

  return (
    <LabShell
      title="CRC laboratory"
      description="Polynomial division over GF(2) — every XOR step visible — with an injectable error."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: flip < 0 ? 'ok' : check ? 'bad' : 'ok',
        text:
          flip < 0
            ? 'No error injected. Move the slider to flip a bit in the received word and see whether the CRC catches it.'
            : check
              ? `A bit was flipped at position ${flip} and the CRC did NOT detect it. Some multi-bit patterns produce a zero remainder — that is why CRC is documented as detecting specific error classes, not every error.`
              : `A bit was flipped at position ${flip}; dividing the received word by ${generator} leaves a non-zero remainder, so the frame is flagged as corrupt.`,
      }}
      readouts={makeReadouts([
        { label: 'Generator degree', value: `${r}`, tone: 'info' },
        { label: 'Generator value', value: generator, tone: 'info' },
        { label: 'Message length', value: `${message.length} bits`, tone: 'info' },
        { label: 'Remainder (FCS)', value: result.remainder, tone: 'good' },
        { label: 'Codeword length', value: `${result.codeword.length} bits`, tone: 'info' },
        { label: 'Error detected?', value: flip < 0 ? 'no error' : check ? 'MISSED' : 'yes', tone: flip < 0 ? 'good' : check ? 'bad' : 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={230} label="CRC computation rows: message, augmented, codeword and received word with error highlighted" isStatic />
    </LabShell>
  );
}

/* ==========================================================================
   Hamming (7,4)
   ========================================================================== */

export function HammingScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { data: '1010', flip: -1 };
  const { values, set, reset } = useLabValues(key_ ?? 'hamming', { ...defaults, ...(overrides ?? {}) });

  const data = str(values.data, '1010').replace(/[^01]/g, '').padEnd(4, '0').slice(0, 4);
  const flip = Math.round(num(values.flip, -1));

  const specs: Control[] = [
    { kind: 'text', id: 'data', label: 'Four data bits', hint: 'Positions 3, 5, 6 and 7 of the codeword.' },
    { kind: 'slider', id: 'flip', label: 'Flip received bit at position', min: -1, max: 7, step: 1, format: (v) => (v < 0 ? 'no error' : `${Math.round(v)}`) },
  ];

  const codeword = useDerived(() => D.hamming74Encode(data), [data]);
  const received = useDerived(() => {
    if (flip < 0 || flip >= 7) return codeword;
    const arr = codeword.split('').map(Number);
    arr[flip] = arr[flip]! ^ 1;
    return arr.join('');
  }, [codeword, flip]);
  const syndrome = useDerived(() => D.hamming74Syndrome(received), [received]);
  const corrected = useDerived(() => D.hamming74Correct(received, syndrome.position), [received, syndrome.position]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const names = ['p1', 'p2', 'd1', 'p4', 'd2', 'd3', 'd4'];
      const cw = (w - 20) / 7;
      const rowY = 26;

      label(ctx, 'transmitted codeword [p1 p2 d1 p4 d2 d3 d4]', 8, 12, c.text, 10, 'left', true);
      for (let i = 0; i < 7; i++) {
        const x = 10 + i * cw;
        const isParity = names[i]!.startsWith('p');
        ctx.fillStyle = isParity ? `${c.magenta}33` : `${c.cyan}33`;
        ctx.fillRect(x + 1, rowY, cw - 2, 30);
        ctx.strokeStyle = isParity ? c.magenta : c.cyan;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 1, rowY, cw - 2, 30);
        label(ctx, codeword[i]!, x + cw / 2, rowY + 15, isParity ? c.magenta : c.cyan, 14, 'center', true);
        label(ctx, `${i + 1}`, x + cw / 2, rowY + 42, c.textDim, 9, 'center');
        label(ctx, names[i]!, x + cw / 2, rowY + 54, c.textDim, 8, 'center');
      }

      label(ctx, 'received word', 8, rowY + 76, c.text, 10, 'left', true);
      for (let i = 0; i < 7; i++) {
        const x = 10 + i * cw;
        const wrong = received[i] !== codeword[i];
        const located = syndrome.position === i + 1;
        ctx.fillStyle = wrong ? `${c.red}33` : `${c.green}22`;
        ctx.fillRect(x + 1, rowY + 86, cw - 2, 30);
        ctx.strokeStyle = wrong ? c.red : located ? c.gold : c.green;
        ctx.lineWidth = wrong || located ? 1.8 : 1;
        ctx.strokeRect(x + 1, rowY + 86, cw - 2, 30);
        label(ctx, received[i]!, x + cw / 2, rowY + 101, wrong ? c.red : c.green, 14, 'center', true);
        if (wrong) label(ctx, '✕', x + cw - 8, rowY + 94, c.red, 10, 'center');
        if (located) label(ctx, '◀', x + cw / 2, rowY + 124, c.gold, 10, 'center');
      }

      // syndrome display
      const sy = rowY + 152;
      const bits = `${syndrome.s4}${syndrome.s2}${syndrome.s1}`;
      label(ctx, 'parity checks', 8, sy, c.text, 10, 'left', true);
      label(ctx, `s1=${syndrome.s1}  s2=${syndrome.s2}  s4=${syndrome.s4}`, 130, sy, c.text, 10);
      label(ctx, 'syndrome (c3 c2 c1) =', 8, sy + 20, c.text, 10, 'left');
      label(ctx, bits, 130, sy + 20, syndrome.position ? c.gold : c.green, 14, 'left', true);
      label(ctx, syndrome.position ? `→ error at position ${syndrome.position}` : '→ no error detected', 8, sy + 40, syndrome.position ? c.gold : c.green, 11, 'left', true);

      // parity group boxes
      label(ctx, 'parity groups:  p1={1,3,5,7}   p2={2,3,6,7}   p4={4,5,6,7}', 8, h - 10, c.textDim, 9.5);
    },
    [codeword, received, syndrome],
  );

  return (
    <LabShell
      title="Hamming (7,4) laboratory"
      description="Enter four data bits, flip any received bit, and read the syndrome that names it."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: flip < 0 ? 'ok' : syndrome.position === flip + 1 ? 'ok' : 'warn',
        text:
          flip < 0
            ? `Codeword ${codeword.replace(/(\d)/g, '$1 ')} is error-free. Move the slider to flip any single bit.`
            : syndrome.position === 0
              ? 'Syndrome is zero but a bit was flipped — this cannot happen for a single-bit error in Hamming(7,4), which is exactly why it corrects them.'
              : `Syndrome ${syndrome.s4}${syndrome.s2}${syndrome.s1}₂ = ${syndrome.position} points at position ${syndrome.position}, which is the bit that was flipped. Correcting gives ${corrected.replace(/(\d)/g, '$1 ')}, which matches the transmitted codeword.`,
      }}
      readouts={makeReadouts([
        { label: 'Data bits', value: data.replace(/(\d)/g, '$1 '), tone: 'info' },
        { label: 'Codeword', value: codeword.replace(/(\d)/g, '$1 '), tone: 'good' },
        { label: 'Received', value: received.replace(/(\d)/g, '$1 '), tone: syndrome.position ? 'bad' : 'good' },
        { label: 'Syndrome', value: `${syndrome.s4}${syndrome.s2}${syndrome.s1}₂`, tone: syndrome.position ? 'warn' : 'good' },
        { label: 'Error position', value: syndrome.position === 0 ? 'none' : String(syndrome.position), tone: 'info' },
        { label: 'd_min = 3', value: 'correct 1, detect 2', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={250} label="Hamming(7,4) codeword, received word with an injected error, and the decoded syndrome" isStatic />
    </LabShell>
  );
}

/* ==========================================================================
   ARQ simulator
   ========================================================================== */

export function ArqScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { protocol: 'gbn', loss: 0.2, ackLoss: 0.1, window: 8, running: true };
  const { values, set, reset } = useLabValues(key_ ?? 'arq', { ...defaults, ...(overrides ?? {}) });

  const protocol = str(values.protocol, 'gbn');
  const loss = num(values.loss, 0.2);
  const ackLoss = num(values.ackLoss, 0.1);
  const window = Math.round(num(values.window, 8));
  const running = bool(values.running, true);

  const specs: Control[] = [
    { kind: 'select', id: 'protocol', label: 'Protocol', options: [{ value: 'saw', label: 'Stop-and-Wait' }, { value: 'gbn', label: 'Go-Back-N' }, { value: 'sr', label: 'Selective Repeat' }] },
    { kind: 'slider', id: 'loss', label: 'Frame loss probability', min: 0, max: 0.6, step: 0.05, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'ackLoss', label: 'ACK loss probability', min: 0, max: 0.5, step: 0.05, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'window', label: 'Window size W', min: 1, max: 16, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'toggle', id: 'running', label: 'Run the simulation' },
  ];

  const sim = useDerived(() => {
    const rand = D.createRng(0x51ee + Math.round(loss * 100) + protocol.length * 13);
    const frames = 14;
    const log: { frame: number; event: string; kind: 'ok' | 'bad' | 'info' }[] = [];
    let acked = 0;
    let sentCount = 0;
    let round = 0;

    for (let guard = 0; guard < 400 && acked < frames; guard++) {
      round++;
      const sendStart = protocol === 'saw' ? acked : acked;
      const sendEnd = protocol === 'saw' ? acked + 1 : Math.min(frames, acked + window);
      sentCount += sendEnd - sendStart;

      let lostAt = -1;
      for (let f = sendStart; f < sendEnd; f++) {
        const lost = rand() < loss;
        if (lost && lostAt < 0) lostAt = f;
      }
      if (lostAt >= 0) log.push({ frame: lostAt, event: 'frame lost', kind: 'bad' });

      let ackedUpTo = sendEnd;
      if (lostAt >= 0) {
        ackedUpTo = protocol === 'sr' ? lostAt : lostAt;
        if (protocol !== 'sr') {
          const n = sendEnd - lostAt;
          log.push({ frame: lostAt, event: `${n} frame${n === 1 ? '' : 's'} discarded — retransmit from ${lostAt}`, kind: 'info' });
          sentCount += n;
        } else {
          log.push({ frame: lostAt, event: 'only the lost frame retransmitted', kind: 'info' });
          sentCount += 1;
        }
      }

      const ackOk = rand() >= ackLoss;
      if (!ackOk) {
        log.push({ frame: lostAt, event: 'ACK lost — sender times out', kind: 'bad' });
        sentCount += protocol === 'sr' ? 1 : Math.max(1, ackedUpTo - acked);
        ackedUpTo = lostAt >= 0 ? lostAt : acked;
      }

      acked = Math.max(acked, ackedUpTo);
      if (round > 60) break;
    }

    const throughput = acked / Math.max(1, sentCount);
    return { frames, acked, sentCount, log: log.slice(0, 10), throughput };
  }, [protocol, loss, ackLoss, window]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const senderY = 30;
      const receiverY = h - 44;
      const x0 = 20;
      const x1 = w - 20;

      // nodes
      ctx.fillStyle = `${c.cyan}22`;
      ctx.strokeStyle = c.cyan;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(x0, senderY - 14, 60, 28);
      ctx.fillRect(x0, senderY - 14, 60, 28);
      label(ctx, 'SENDER', x0 + 30, senderY, c.cyan, 10, 'center', true);
      ctx.strokeStyle = c.green;
      ctx.fillStyle = `${c.green}22`;
      ctx.strokeRect(x0, receiverY - 14, 60, 28);
      ctx.fillRect(x0, receiverY - 14, 60, 28);
      label(ctx, 'RECEIVER', x0 + 30, receiverY, c.green, 10, 'center', true);

      // channel
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(x0, senderY + 24);
      ctx.lineTo(x1, receiverY - 24);
      ctx.moveTo(x0, receiverY - 24);
      ctx.lineTo(x1, senderY + 24);
      ctx.stroke();
      ctx.restore();
      label(ctx, 'channel', (x0 + x1) / 2, h / 2, c.textDim, 9.5, 'center');

      // frame in flight
      const phase = ((_t * 0.35) % 1);
      const fx = x0 + 60 + phase * (x1 - x0 - 70);
      const fy = senderY + 24 + phase * (receiverY - 24 - senderY - 24);
      ctx.fillStyle = running ? c.gold : c.gray;
      ctx.shadowColor = c.gold;
      ctx.shadowBlur = 8;
      ctx.fillRect(fx, fy, 10, 6);
      ctx.shadowBlur = 0;

      // log
      label(ctx, 'event log', 8, 14, c.text, 10, 'left', true);
      sim.log.forEach((l, i) => {
        const col = l.kind === 'bad' ? c.red : l.kind === 'ok' ? c.green : c.textDim;
        label(ctx, `f${l.frame}: ${l.event}`, x0, senderY + 44 + i * 13, col, 9.5);
      });
    },
    [sim, running],
  );

  return (
    <LabShell
      title="ARQ simulator"
      description="Sender, lossy channel and receiver — watch which frames a timeout causes to be resent."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: sim.throughput > 0.6 ? 'ok' : sim.throughput > 0.3 ? 'warn' : 'bad',
        text: `Delivered ${sim.acked} of ${sim.frames} frames using ${sim.sentCount} transmissions → normalised throughput ${(sim.throughput * 100).toFixed(0)} %. The difference between the protocols is entirely in how many *good* frames a single error forces to be resent.`,
      }}
      readouts={makeReadouts([
        { label: 'Protocol', value: protocol.toUpperCase(), tone: 'info' },
        { label: 'Frames delivered', value: `${sim.acked} / ${sim.frames}`, tone: 'good' },
        { label: 'Transmissions used', value: String(sim.sentCount), tone: 'info' },
        { label: 'Throughput', value: `${(sim.throughput * 100).toFixed(1)} %`, tone: sim.throughput > 0.5 ? 'good' : 'warn' },
        { label: 'Retransmissions', value: String(Math.max(0, sim.sentCount - sim.acked)), tone: 'warn' },
        { label: 'Window W', value: String(window), tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={300} label="ARQ sender-receiver animation with a running event log" />
    </LabShell>
  );
}

/* ==========================================================================
   Interleaving
   ========================================================================== */

export function InterleaveScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { depth: 6, burstStart: 4, burstLen: 3, showDe: true };
  const { values, set, reset } = useLabValues(key_ ?? 'interleaving', { ...defaults, ...(overrides ?? {}) });

  const depth = Math.round(num(values.depth, 6));
  const burstStart = Math.round(num(values.burstStart, 4));
  const burstLen = Math.round(num(values.burstLen, 3));
  const showDe = bool(values.showDe, true);

  const total = 24;
  const specs: Control[] = [
    { kind: 'slider', id: 'depth', label: 'Interleaver depth L', min: 2, max: 12, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'slider', id: 'burstStart', label: 'Burst start (transmitted)', min: 0, max: total - 1, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'slider', id: 'burstLen', label: 'Burst length b', min: 1, max: 8, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'toggle', id: 'showDe', label: 'Show de-interleaved result' },
  ];

  const result = useDerived(() => {
    const data = Array.from({ length: total }, (_, i) => (i * 7 + 3) % 2);
    // Block interleaver: write row-wise into a matrix of `depth` columns, read column-wise.
    const rows = Math.ceil(total / depth);
    const tx: number[] = new Array(total).fill(0);
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / depth);
      const col = i % depth;
      tx[col * rows + row] = data[i]!;
    }
    const errTx = tx.map((_, i) => i >= burstStart && i < burstStart + burstLen);
    const errDe = new Array(total).fill(false);
    errTx.forEach((bad, i) => {
      if (!bad) return;
      const row = Math.floor(i / rows);
      const col = i % rows;
      errDe[row * depth + col] = true;
    });
    // separation between adjacent original symbols after de-interleaving
    const separation = burstLen === 0 ? 0 : Math.floor(depth / burstLen);
    const perRow = Array.from({ length: rows }, (_, r) => {
      let n = 0;
      for (let c = 0; c < depth; c++) if (errDe[r * depth + c]) n++;
      return n;
    });
    return { data, tx, errTx, errDe, rows, separation, perRow, maxPerRow: Math.max(...perRow, 0) };
  }, [depth, burstStart, burstLen]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number) => {
      const c = themeColors();
      const cell = Math.min(22, (w - 40) / Math.max(depth, 1));
      const startX = (w - cell * depth) / 2;

      // transmitted stream
      label(ctx, 'transmitted order (column-wise)', 8, 12, c.text, 10, 'left', true);
      const cw = (w - 60) / total;
      for (let i = 0; i < total; i++) {
        const x = 8 + i * cw;
        ctx.fillStyle = result.errTx[i] ? `${c.red}55` : `${c.cyan}33`;
        ctx.fillRect(x + 0.5, 20, Math.max(2, cw - 1), 22);
        ctx.strokeStyle = result.errTx[i] ? c.red : c.cyan;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, 20, Math.max(2, cw - 1), 22);
        label(ctx, String(i), x + cw / 2, 52, c.textDim, 7.5, 'center');
      }
      label(ctx, `burst: ${burstStart}…${burstStart + burstLen - 1} contiguous`, 8, 66, c.red, 9);

      // matrix
      const matTop = 82;
      label(ctx, `matrix written row-wise, read column-wise (L = ${depth})`, 8, matTop - 4, c.text, 10, 'left', true);
      for (let r = 0; r < result.rows; r++) {
        for (let cIdx = 0; cIdx < depth; cIdx++) {
          const i = r * depth + cIdx;
          if (i >= total) continue;
          const x = startX + cIdx * cell;
          const y = matTop + r * cell;
          const bad = result.errDe[i] ?? false;
          ctx.fillStyle = bad ? `${c.red}44` : `${c.gold}22`;
          ctx.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
          ctx.strokeStyle = bad ? c.red : c.gold;
          ctx.lineWidth = bad ? 1.6 : 0.9;
          ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
          label(ctx, result.data[i] ? '1' : '0', x + cell / 2, y + cell / 2, bad ? c.red : c.gold, 9, 'center');
        }
        label(ctx, `row ${r}: ${result.perRow[r]} error${result.perRow[r] === 1 ? '' : 's'}`, startX + depth * cell + 6, matTop + r * cell + cell / 2, result.perRow[r] > 1 ? c.red : c.green, 8.5);
      }

      if (showDe) {
        const deTop = matTop + result.rows * cell + 14;
        label(ctx, 'after de-interleaving: the burst is now spread out', 8, deTop, c.text, 10, 'left', true);
        for (let i = 0; i < total; i++) {
          const x = 8 + i * cw;
          ctx.fillStyle = result.errDe[i] ? `${c.red}55` : `${c.cyan}22`;
          ctx.fillRect(x + 0.5, deTop + 8, Math.max(2, cw - 1), 20);
          ctx.strokeStyle = result.errDe[i] ? c.red : c.cyan;
          ctx.lineWidth = result.errDe[i] ? 1.5 : 0.8;
          ctx.strokeRect(x + 0.5, deTop + 8, Math.max(2, cw - 1), 20);
        }
        label(ctx, `minimum separation between adjacent originally-adjacent symbols: ${result.separation}`, 8, deTop + 42, c.cyan, 10);
      }
    },
    [result, depth, burstStart, burstLen, showDe],
  );

  return (
    <LabShell
      title="Interleaving laboratory"
      description="A contiguous burst on the wire becomes separated errors after de-interleaving — same number of errors, different spacing."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: result.maxPerRow <= 1 ? 'ok' : 'bad',
        text:
          result.maxPerRow <= 1
            ? `Every row now holds at most one error, so a single-error-correcting code can repair each one independently. The number of errors is unchanged (${burstLen}) — interleaving redistributed them, it did not remove them.`
            : `Some rows still hold more than one error, so a single-error-correcting code cannot help. Increase the depth or shorten the burst.`,
      }}
      readouts={makeReadouts([
        { label: 'Interleaver depth L', value: String(depth), tone: 'info' },
        { label: 'Burst length b', value: String(burstLen), tone: 'info' },
        { label: 'Separation ⌊L/b⌋', value: String(result.separation), tone: 'good' },
        { label: 'Errors in wire', value: String(burstLen), tone: 'warn' },
        { label: 'Max errors per row', value: String(result.maxPerRow), tone: result.maxPerRow <= 1 ? 'good' : 'bad' },
        { label: 'Total errors', value: `${result.errTx.filter(Boolean).length} (unchanged)`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={320} label="Interleaver matrix showing a burst in transmitted order spread across rows" isStatic />
    </LabShell>
  );
}