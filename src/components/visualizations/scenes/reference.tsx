import { useCallback } from 'react';
import { VizCanvas, axisX, glow, grid, label, themeColors } from '@/components/ui/VizCanvas';
import { LabShell, makeReadouts, num, str, useDerived, useLabValues, type Control, type SceneProps } from '@/components/visualizations/Lab';
import * as D from '@/lib/signalMath';
import type { ControlValues } from '@/types';

/* ==========================================================================
   Modem standards reference
   --------------------------------------------------------------------------
   Historical reference data, presented as such. These are the commonly
   published rates for each standard; anyone depending on an exact parameter
   must check the ITU-T recommendation itself.
   ========================================================================== */

interface ModemSpec {
  family: string;
  name: string;
  rate: number;
  baud: number | null;
  modulation: string;
  note: string;
}

const MODEMS: ModemSpec[] = [
  { family: 'Bell', name: 'Bell 103', rate: 300, baud: 300, modulation: 'FSK', note: 'First commercial Bell data modem.' },
  { family: 'Bell', name: 'Bell 202', rate: 1200, baud: 600, modulation: 'PSK', note: 'Doubled the rate of the 103.' },
  { family: 'Bell', name: 'Bell 212', rate: 1200, baud: 600, modulation: 'QPSK / PSK', note: '1200 bit/s over 600 baud.' },
  { family: 'Bell', name: 'Bell 201', rate: 2400, baud: 1200, modulation: 'QPSK', note: 'Early 2400 bit/s modem.' },
  { family: 'Bell', name: 'Bell 208', rate: 2400, baud: 1200, modulation: 'QAM', note: 'Same rate, different constellation.' },
  { family: 'Bell', name: 'Bell 209', rate: 4800, baud: 2400, modulation: 'QAM', note: 'First commercial 4800 bit/s modem.' },
  { family: 'ITU-T', name: 'V.22bis', rate: 2400, baud: 600, modulation: 'QPSK', note: '4 bits per symbol at 600 baud.' },
  { family: 'ITU-T', name: 'V.32', rate: 9600, baud: 2400, modulation: '32-QAM', note: 'Made 9600 practical on dial-up.' },
  { family: 'ITU-T', name: 'V.32bis', rate: 14400, baud: 2400, modulation: '16-QAM + TCM', note: 'Same baud, trellis coding.' },
  { family: 'ITU-T', name: 'V.32terbo', rate: 19200, baud: 2400, modulation: '256-QAM + TCM', note: 'Raised the rate without raising baud.' },
  { family: 'ITU-T', name: 'V.33', rate: 14400, baud: 2400, modulation: '4-D QAM', note: 'Four-dimensional signalling at 2400 baud.' },
  { family: 'ITU-T', name: 'V.34', rate: 28800, baud: 3360, modulation: '512-QAM + TCM', note: 'Raised the baud rate as well as the order.' },
  { family: 'ITU-T', name: 'V.90', rate: 56000, baud: null, modulation: 'PCM-based (asymmetric)', note: 'Bottleneck moved to the local loop.' },
  { family: 'ITU-T', name: 'V.92', rate: 56000, baud: null, modulation: 'PCM-based (asymmetric)', note: 'Refinements to the V.90 scheme.' },
];

export function ModemScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { family: 'all' };
  const { values, set, reset } = useLabValues(key_ ?? 'modems', { ...defaults, ...(overrides ?? {}) });
  const family = str(values.family, 'all');

  const specs: Control[] = [
    {
      kind: 'select',
      id: 'family',
      label: 'Show',
      options: [
        { value: 'all', label: 'All standards' },
        { value: 'Bell', label: 'Bell series' },
        { value: 'ITU-T', label: 'ITU-T V-series' },
      ],
    },
  ];

  const list = family === 'all' ? MODEMS : MODEMS.filter((m) => m.family === family);
  const maxRate = 56000;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const rowH = Math.max(14, Math.min(26, (h - 24) / list.length));
      label(ctx, 'bit rate (bit/s) — bar length', 8, 11, c.text, 10, 'left', true);
      list.forEach((m, i) => {
        const y = 20 + i * rowH;
        const accent = m.family === 'Bell' ? c.gold : c.cyan;
        label(ctx, m.name, 84, y + rowH / 2 - 1, c.text, 9.5, 'right', true);
        const barW = Math.max(3, ((w - 190) * m.rate) / maxRate);
        ctx.fillStyle = `${accent}${i % 2 ? '55' : '88'}`;
        ctx.fillRect(92, y + rowH * 0.2, barW, rowH * 0.55);
        label(ctx, `${(m.rate / 1000).toFixed(m.rate % 1000 ? 1 : 0)}k`, 96 + barW, y + rowH / 2 - 1, c.textDim, 9);
        label(ctx, m.baud ? `${m.baud} Bd` : '—', w - 6, y + rowH / 2 - 1, c.textDim, 9, 'right');
      });
    },
    [list],
  );

  return (
    <LabShell
      title="Telephone modem standards"
      description="Historical progression in data rate, and the modulation family each generation used."
      accent="var(--cyan)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: 'Reference data, not a specification. These are the commonly published rates and principal modulation families; verify anything you rely on against the ITU-T recommendation or a reputable secondary source. The notable pattern is that from V.32 onward the baud rate stopped rising while the bits per symbol did — once the channel caps the symbol rate, that is the only lever left.',
      }}
      readouts={makeReadouts([
        { label: 'Standards listed', value: String(list.length), tone: 'info' },
        { label: 'Highest rate', value: '56 000 bit/s (V.90/V.92)', tone: 'good' },
        { label: 'First', value: 'Bell 103 · 300 bit/s', tone: 'info' },
        { label: 'V.32 baud', value: '2400 (fixed from here on)', tone: 'info' },
        { label: 'Main lever', value: 'bits per symbol', tone: 'info' },
        { label: 'V.90 change', value: 'bottleneck moved to the loop', tone: 'warn' },
      ])}
    >
      <VizCanvas draw={draw} height={Math.min(360, 26 * list.length + 30)} label="Bar chart of modem bit rates across the Bell and ITU-T families" isStatic />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[12.3px]">
          <thead>
            <tr>
              {['Standard', 'Bit rate', 'Baud', 'Modulation', 'Note'].map((hh) => (
                <th key={hh} className="border-b px-2.5 py-2 text-left text-[10.5px] tracking-[0.08em] text-faint uppercase" style={{ borderColor: 'var(--stroke)' }}>
                  {hh}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.name}>
                <td className="border-b px-2.5 py-1.5 font-medium">{m.name}</td>
                <td className="mono border-b px-2.5 py-1.5" style={{ color: 'var(--gold)' }}>{m.rate.toLocaleString()} bps</td>
                <td className="mono border-b px-2.5 py-1.5 text-dim">{m.baud ?? '—'}</td>
                <td className="border-b px-2.5 py-1.5 text-dim">{m.modulation}</td>
                <td className="border-b px-2.5 py-1.5 text-faint">{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LabShell>
  );
}

/* ==========================================================================
   Spectrum comparison (AM / FM / PM sidebands)
   ========================================================================== */

export function SpectrumScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { scheme: 'AM', fm: 0.05, beta: 4, fc: 40, components: 6 };
  const { values, set, reset } = useLabValues(key_ ?? 'spectrum', { ...defaults, ...(overrides ?? {}) });

  const scheme = str(values.scheme, 'AM');
  const fm = num(values.fm, 0.05);
  const beta = num(values.beta, 4);
  const fc = num(values.fc, 40);
  const components = Math.round(num(values.components, 6));

  const specs: Control[] = [
    { kind: 'select', id: 'scheme', label: 'Scheme', options: [{ value: 'AM', label: 'AM' }, { value: 'FM', label: 'FM' }, { value: 'PM', label: 'PM' }] },
    { kind: 'slider', id: 'fm', label: 'Message frequency', min: 0.01, max: 0.4, step: 0.01, unit: ' Hz', format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'beta', label: 'FM index β', min: 0.2, max: 10, step: 0.2, format: (v) => v.toFixed(1) },
    { kind: 'slider', id: 'fc', label: 'Carrier', min: 10, max: 100, step: 1, unit: ' Hz' },
    { kind: 'slider', id: 'components', label: 'Sideband pairs drawn', min: 1, max: 12, step: 1 },
  ];

  /** Bessel function J_n(x) by power series — real sideband amplitudes. */
  const bessel = useCallback((n: number, x: number) => {
    let sum = 0;
    const fact = (v: number) => {
      let r = 1;
      for (let i = 2; i <= v; i++) r *= i;
      return r;
    };
    for (let k = 0; k < 20; k++) sum += ((-1) ** k * (x / 2) ** (2 * k + n)) / (fact(k) * fact(k + n));
    return sum;
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const x0 = 20;
      const x1 = w - 20;
      const baseY = h - 16;
      const span = Math.max(fc * 2, fm * (components * 2 + 3));
      const fToX = (f: number) => x0 + ((f - (fc - span / 2)) / span) * (x1 - x0);

      grid(ctx, w, h, 26);
      ctx.save();
      ctx.strokeStyle = c.axis;
      ctx.beginPath();
      ctx.moveTo(x0, baseY);
      ctx.lineTo(x1, baseY);
      ctx.stroke();

      const stem = (f: number, amp: number, colour: string, name: string) => {
        const x = fToX(f);
        const y = baseY - Math.abs(amp) * (h - 44);
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = colour;
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        if (name) label(ctx, name, x, y - 8, colour, 8.5, 'center', true);
      };

      if (scheme === 'AM') {
        stem(fc, 1, c.cyan, 'carrier');
        stem(fc - fm, 0.5, c.magenta, 'LSB');
        stem(fc + fm, 0.5, c.magenta, 'USB');
      } else {
        stem(fc, bessel(0, beta), c.cyan, 'fc · J₀');
        for (let n = 1; n <= components; n++) {
          const a = bessel(n, beta);
          if (Math.abs(a) < 0.01) continue;
          stem(fc - n * fm, a, c.magenta, n === 1 ? 'J₁' : `J${n}`);
          stem(fc + n * fm, a, c.magenta, '');
        }
      }
      ctx.restore();

      label(ctx, `${scheme} spectrum`, x0, 11, c.text, 10, 'left', true);
      label(ctx, scheme === 'AM' ? 'one sideband pair' : `≈ 2 × ⌈β⌉ sideband pairs`, x1, 11, c.textDim, 9, 'right');
      label(ctx, scheme === 'AM' ? `BW = 2 f_m = ${(2 * fm).toFixed(3)} Hz (independent of m)` : `BW ≈ 2(Δf + f_m) = ${(2 * (beta * fm + fm)).toFixed(3)} Hz (Carson estimate)`, x0, h - 4, c.textDim, 9);
    },
    [scheme, fm, beta, fc, components, bessel],
  );

  const carson = useDerived(() => D.carsonBandwidth(beta * fm, fm), [beta, fm]);

  return (
    <LabShell
      title="Modulated spectrum"
      description="Carrier and sidebands with real Bessel amplitudes for the angle-modulation cases."
      accent="var(--magenta)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text:
          scheme === 'AM'
            ? 'AM bandwidth is 2·f_m whatever the modulation index — even at m = 0, when nothing is transmitted at all. The sideband amplitudes shown are illustrative of the m = 1 case.'
            : `FM/PM amplitudes come from Bessel functions Jₙ(β), which decay slowly — a real FM spectrum has infinitely many sidebands. ${carson.toFixed(2)} Hz is Carson's estimate (about 98 % of power), not an exact result.`,
      }}
      readouts={makeReadouts([
        { label: 'Carrier', value: `${fc} Hz`, tone: 'info' },
        { label: 'Message f_m', value: `${fm.toFixed(2)} Hz`, tone: 'info' },
        { label: 'AM bandwidth', value: `${(2 * fm).toFixed(3)} Hz`, tone: 'info' },
        { label: 'Carson estimate', value: `${carson.toFixed(2)} Hz`, tone: 'warn' },
        { label: 'FM index β', value: beta.toFixed(1), tone: 'info' },
        { label: 'Significant pairs', value: `≈ 2 × ${Math.ceil(beta)}`, tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={200} label="Frequency spectrum showing carrier and sidebands for the selected modulation" isStatic />
    </LabShell>
  );
}

/* ==========================================================================
   Transmission error patterns
   ========================================================================== */

export function ErrorScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { kind: 'random', rate: 0.12, burst: 3, seed: 7 };
  const { values, set, reset } = useLabValues(key_ ?? 'errors', { ...defaults, ...(overrides ?? {}) });

  const kind = str(values.kind, 'random');
  const rate = num(values.rate, 0.12);
  const burst = Math.round(num(values.burst, 3));
  const seed = Math.round(num(values.seed, 7));

  const specs: Control[] = [
    { kind: 'select', id: 'kind', label: 'Error pattern', options: [{ value: 'random', label: 'Random (independent) errors' }, { value: 'burst', label: 'Burst error' }] },
    { kind: 'slider', id: 'rate', label: 'Bit error probability', min: 0.01, max: 0.5, step: 0.01, format: (v) => v.toFixed(2) },
    { kind: 'slider', id: 'burst', label: 'Burst length', min: 2, max: 12, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'slider', id: 'seed', label: 'Seed (deterministic)', min: 1, max: 50, step: 1, format: (v) => String(Math.round(v)) },
  ];

  const N = 48;
  const pattern = useDerived(() => {
    const rand = D.createRng(seed * 7919);
    const errs = new Array<boolean>(N).fill(false);
    if (kind === 'random') {
      for (let i = 0; i < N; i++) errs[i] = rand() < rate;
    } else {
      const start = Math.floor(rand() * (N - burst));
      for (let i = 0; i < burst; i++) errs[start + i] = true;
    }
    const count = errs.filter(Boolean).length;
    // longest run of consecutive errors — the quantity burst codes care about
    let longest = 0;
    let run = 0;
    for (const e of errs) {
      run = e ? run + 1 : 0;
      longest = Math.max(longest, run);
    }
    return { errs, count, longest, ber: count / N };
  }, [kind, rate, burst, seed]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const cw = (w - 16) / N;
      grid(ctx, w, h - 20, 26);
      label(ctx, 'transmitted bit positions', 8, 11, c.text, 10, 'left', true);
      for (let i = 0; i < N; i++) {
        const x = 8 + i * cw;
        const bad = pattern.errs[i]!;
        ctx.fillStyle = bad ? `${c.red}66` : `${c.cyan}33`;
        ctx.fillRect(x + 0.5, 20, Math.max(2, cw - 1), h - 46);
        ctx.strokeStyle = bad ? c.red : c.cyan;
        ctx.lineWidth = bad ? 1.6 : 0.8;
        ctx.strokeRect(x + 0.5, 20, Math.max(2, cw - 1), h - 46);
        if (bad) label(ctx, '✕', x + cw / 2, (h - 46) / 2 + 20, '#fff', 10, 'center', true);
      }
      label(ctx, `${pattern.count} errors over ${N} bits · longest run: ${pattern.longest}`, 8, h - 8, c.textDim, 9.5);
    },
    [pattern, N],
  );

  return (
    <LabShell
      title="Error pattern laboratory"
      description="Random errors and burst errors look nothing alike to a code — and the same code handles them very differently."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text: `${pattern.count} errors in ${N} bits (BER ${pattern.ber.toFixed(3)}), with a longest consecutive run of ${pattern.longest}. A code designed for independent errors sees a burst as up to ${pattern.longest} separate single errors, which is why burst channels need burst-oriented codes or interleaving.`,
      }}
      readouts={makeReadouts([
        { label: 'Pattern', value: kind, tone: 'info' },
        { label: 'Errors', value: `${pattern.count} / ${N}`, tone: 'warn' },
        { label: 'Measured BER', value: pattern.ber.toFixed(3), tone: 'info' },
        { label: 'Longest run', value: String(pattern.longest), tone: pattern.longest > 2 ? 'bad' : 'good' },
        { label: 'Designed against', value: kind === 'random' ? 'random errors' : 'bursts', tone: 'info' },
        { label: 'Hamming(7,4) can fix', value: '1 isolated error', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={150} label="Bit grid showing a random or burst error pattern" isStatic />
    </LabShell>
  );
}

/* ==========================================================================
   Parity and checksum
   ========================================================================== */

export function ParityScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { word: '1011001', mode: 'even', errors: '2' };
  const { values, set, reset } = useLabValues(key_ ?? 'parity', { ...defaults, ...(overrides ?? {}) });

  const word = str(values.word, '1011001').replace(/[^01]/g, '').slice(0, 24) || '1';
  const mode = str(values.mode, 'even');
  const errorCount = Math.round(num(values.errors, 2));

  const specs: Control[] = [
    { kind: 'text', id: 'word', label: 'Data word', hint: 'Parity is generated over these bits.' },
    { kind: 'select', id: 'mode', label: 'Parity mode', options: [{ value: 'even', label: 'Even parity' }, { value: 'odd', label: 'Odd parity' }] },
    { kind: 'slider', id: 'errors', label: 'Injected error count', min: 0, max: 4, step: 1, format: (v) => String(Math.round(v)) },
  ];

  const result = useDerived(() => {
    const p = D.parityBit(word, mode as 'even' | 'odd');
    const codeword = word + String(p);
    const rand = D.createRng(0x9a9 + word.length);
    const positions = new Set<number>();
    let guard = 0;
    while (positions.size < errorCount && guard++ < 200) positions.add(Math.floor(rand() * codeword.length));
    const received = codeword
      .split('')
      .map((b, i) => (positions.has(i) ? (b === '1' ? '0' : '1') : b))
      .join('');
    const rp = D.parityBit(received.slice(0, word.length), mode as 'even' | 'odd');
    const passed = String(rp) === received[word.length];
    return { p, codeword, positions: [...positions].sort((a, b) => a - b), received, passed, ones: word.split('').reduce((s, b) => s + Number(b), 0) };
  }, [word, mode, errorCount]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const cw = Math.min(34, (w - 20) / result.codeword.length);

      const row = (y: number, title: string, bits: string, colour: (i: number) => string, mark: Set<number>) => {
        label(ctx, title, 8, y - 10, c.text, 9.5, 'left', true);
        for (let i = 0; i < bits.length; i++) {
          const x = 10 + i * cw;
          const bad = mark.has(i);
          ctx.fillStyle = colour(i);
          ctx.fillRect(x + 1, y, cw - 2, 28);
          ctx.strokeStyle = bad ? c.red : 'transparent';
          ctx.lineWidth = 1.8;
          ctx.strokeRect(x + 1, y, cw - 2, 28);
          label(ctx, bits[i]!, x + cw / 2, y + 14, '#04121a', 11, 'center', true);
        }
      };

      row(26, `data word (${result.ones} ones)`, word, () => `${c.cyan}cc`, new Set());
      row(70, `+ ${mode} parity bit p = ${result.p}`, result.codeword, (i) => (i === word.length ? `${c.magenta}cc` : `${c.cyan}99`), new Set());
      row(114, `received after ${result.positions.length} error(s)`, result.received, (i) => (i === word.length ? `${c.magenta}88` : `${c.green}99`), new Set(result.positions));

      label(ctx, `Parity check result: ${result.passed ? 'PASS — error not detected' : 'FAIL — error detected'}`, 8, 170, result.passed ? c.red : c.green, 12, 'left', true);
      label(ctx, result.passed ? 'Even numbers of flipped bits always leave parity unchanged.' : 'An odd number of flips always changes parity.', 8, 190, c.textDim, 10, 'left');
      label(ctx, `ones in the word: ${result.ones} · parity bit: ${result.p} · codeword length: ${result.codeword.length}`, 8, h - 12, c.textDim, 9.5);
    },
    [word, result],
  );

  return (
    <LabShell
      title="Parity and checksum laboratory"
      description="Generate a parity bit, inject one to four errors, and see exactly which ones slip through."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: result.passed && result.positions.length > 0 ? 'bad' : 'info',
        text: result.passed && result.positions.length > 0
          ? `${result.positions.length} bit(s) flipped at position(s) ${result.positions.join(', ')} and the parity check still passed. Any *even* number of bit errors leaves the parity unchanged — including the common two-bit error.`
          : result.positions.length === 0
            ? `No error injected. The ${mode} parity check will pass. Flip one, two, three or four bits and compare.`
            : `The parity check failed, so an error is present. But parity never tells you *which* bit — that is why it cannot correct anything.`,
      }}
      readouts={makeReadouts([
        { label: 'Word', value: word, tone: 'info' },
        { label: `${mode} parity bit`, value: String(result.p), tone: 'good' },
        { label: 'Codeword', value: result.codeword, tone: 'good' },
        { label: 'Ones in data', value: String(result.ones), tone: 'info' },
        { label: 'Errors injected', value: String(result.positions.length), tone: 'info' },
        { label: 'Detected?', value: result.passed ? 'no' : 'yes', tone: result.passed ? 'bad' : 'good' },
      ])}
    >
      <VizCanvas draw={draw} height={220} label="Parity bit generation and injected error detection" isStatic />
    </LabShell>
  );
}

/* ==========================================================================
   Advanced coding families
   ========================================================================== */

const FAMILIES = [
  { name: 'Convolutional', rate: 'k/n', block: 'continuous', corrects: '≈ 2–5 dB over uncoded', limit: 'Viterbi complexity grows exponentially in constraint length; fixed latency of ~4–5K symbols.', use: 'GPS, legacy cellular, deep space' },
  { name: 'Reed–Solomon', rate: 'n/(n+2t)', block: 'symbol', corrects: 't symbols ≈ a burst', limit: 'Weak against random errors; strongest at the start of the codeword, weakest at the end.', use: 'Optical discs, QR codes, DVB, SSD' },
  { name: 'Turbo', rate: '≈ 1/3', block: 'block', corrects: 'within 0.5 dB of the limit', limit: 'High latency from many iterations and deep interleaving; expensive to decode.', use: '3G/4G data, satellite CCSDS' },
  { name: 'LDPC', rate: '0.5–0.9', block: 'block', corrects: 'near-Shannon limit', limit: 'Trails turbo codes at short block lengths; irregular graphs are hard to analyse.', use: 'Wi-Fi 6/7, 5G NR, DVB-S2, storage' },
];

export function AdvancedCodingScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { burst: 4, length: 1500 };
  const { values, set, reset } = useLabValues(key_ ?? 'advanced-coding', { ...defaults, ...(overrides ?? {}) });

  const burst = Math.round(num(values.burst, 4));
  const length = num(values.length, 1500);

  const specs: Control[] = [
    { kind: 'slider', id: 'burst', label: 'Burst length (bits)', min: 1, max: 200, step: 1, format: (v) => String(Math.round(v)) },
    { kind: 'slider', id: 'length', label: 'Total codeword length', min: 500, max: 4000, step: 100, format: (v) => String(Math.round(v)) },
  ];

  const rsCapability = useDerived(() => {
    // r = 8 bits/symbol; a burst of `burst` bits spans ceil(burst/8) symbols.
    const symbols = Math.ceil(burst / 8);
    const parityNeeded = 2 * symbols;
    return { symbols, parityNeeded, overhead: (parityNeeded / length) * 100 };
  }, [burst, length]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const c = themeColors();
      const lanes = h / 4;
      FAMILIES.forEach((f, i) => {
        const midY = lanes * i + lanes / 2;
        grid(ctx, w, lanes, 30);
        axisX(ctx, w, midY);
        label(ctx, f.name, 8, lanes * i + 12, [c.cyan, c.gold, c.magenta, c.green][i]!, 10, 'left', true);
        label(ctx, `${f.rate} · ${f.block}`, w - 6, lanes * i + 12, c.textDim, 9, 'right');
        label(ctx, f.limit, 8, lanes * i + lanes - 6, c.textDim, 8.5);
      });
    },
    [],
  );

  return (
    <LabShell
      title="Modern error-control codes"
      description="Four families, what each is genuinely good at, and where each one stops working."
      accent="var(--blue)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'limit',
        text: `For a burst of ${burst} bits with 8-bit RS symbols, the burst spans ${rsCapability.symbols} symbol(s), so RS needs ${rsCapability.parityNeeded} parity symbols — ${rsCapability.overhead.toFixed(2)} % overhead at this codeword length. A convolutional or LDPC code has no burst capability at all without interleaving, which is the practical reason interleaving and an outer code are paired.`,
      }}
      readouts={makeReadouts([
        { label: 'Burst length', value: `${burst} bits`, tone: 'info' },
        { label: 'RS symbols hit', value: String(rsCapability.symbols), tone: 'warn' },
        { label: 'RS parity needed', value: `${rsCapability.parityNeeded} symbols`, tone: 'info' },
        { label: 'RS overhead here', value: `${rsCapability.overhead.toFixed(2)} %`, tone: 'info' },
        { label: 'Convolutional / LDPC', value: 'need interleaving', tone: 'warn' },
        { label: 'Interleaving', value: 'redistributes, does not correct', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={220} label="Summary of four error-control code families and their limitations" isStatic />
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-[12.3px]">
          <thead>
            <tr>
              {['Family', 'Typical rate', 'Structure', 'Corrects', 'Main limitation', 'Deployed in'].map((hh) => (
                <th key={hh} className="border-b px-2.5 py-2 text-left text-[10.5px] tracking-[0.08em] text-faint uppercase" style={{ borderColor: 'var(--stroke)' }}>
                  {hh}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FAMILIES.map((f) => (
              <tr key={f.name}>
                <td className="border-b px-2.5 py-2 font-medium">{f.name}</td>
                <td className="mono border-b px-2.5 py-2 text-dim">{f.rate}</td>
                <td className="border-b px-2.5 py-2 text-dim">{f.block}</td>
                <td className="border-b px-2.5 py-2 text-dim">{f.corrects}</td>
                <td className="border-b px-2.5 py-2 text-faint">{f.limit}</td>
                <td className="border-b px-2.5 py-2 text-faint">{f.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LabShell>
  );
}

/* ==========================================================================
   Digital-vs-analogue transmission comparison (Module 1 opener)
   ========================================================================== */

export function AnalogDigitalScene({ key_, overrides }: SceneProps) {
  const defaults: ControlValues = { noise: 25, hops: 3, mode: 'both' };
  const { values, set, reset } = useLabValues(key_ ?? 'digital-vs-analog', { ...defaults, ...(overrides ?? {}) });

  const noise = num(values.noise, 25);
  const hops = Math.round(num(values.hops, 3));
  const mode = str(values.mode, 'both');

  const specs: Control[] = [
    { kind: 'slider', id: 'noise', label: 'Noise per hop', min: 0, max: 60, step: 1, unit: ' %' },
    { kind: 'slider', id: 'hops', label: 'Repeater hops', min: 1, max: 8, step: 1 },
    { kind: 'select', id: 'mode', label: 'Show', options: [{ value: 'both', label: 'Analogue vs digital' }, { value: 'analog', label: 'Analogue only' }, { value: 'digital', label: 'Digital only' }] },
  ];

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) => {
      const c = themeColors();
      const lanes = mode === 'both' ? 2 : 1;
      const laneH = h / lanes;
      const x0 = 10;
      const x1 = w - 10;

      const showAnalog = mode !== 'digital';
      const showDigital = mode !== 'analog';

      if (showAnalog) {
        const midY = laneH / 2;
        grid(ctx, w, laneH, 30);
        axisX(ctx, w, midY);
        label(ctx, 'ANALOGUE — amplifier per hop: noise accumulates', 8, 12, c.red, 10, 'left', true);
        const rand = D.createRng(0xa0 + hops);
        ctx.save();
        glow(ctx, c.gold, 1.6);
        ctx.beginPath();
        for (let i = 0; i <= 500; i++) {
          const u = i / 500;
          const n = Math.sqrt(hops) * (noise / 100) * 0.4;
          const v = Math.sin(2 * Math.PI * 1.5 * u + _t * 1.1) + D.gaussian(rand) * n;
          const y = midY - v * laneH * 0.3;
          if (i === 0) ctx.moveTo(x0 + u * (x1 - x0), y);
          else ctx.lineTo(x0 + u * (x1 - x0), y);
        }
        ctx.stroke();
        ctx.restore();
        // hop markers
        for (let k = 1; k <= hops; k++) {
          const px = x0 + (k / (hops + 1)) * (x1 - x0);
          ctx.strokeStyle = 'rgba(255,255,255,.16)';
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(px, 18);
          ctx.lineTo(px, laneH - 4);
          ctx.stroke();
          ctx.setLineDash([]);
          label(ctx, `amp ${k}`, px + 3, laneH - 8, c.textDim, 8);
        }
      }

      if (showDigital) {
        const top = showAnalog ? laneH : 0;
        const midY = top + laneH / 2;
        grid(ctx, w, laneH, 30);
        axisX(ctx, w, midY);
        label(ctx, 'DIGITAL — regenerator per hop: noise discarded', 8, top + 12, c.green, 10, 'left', true);
        ctx.save();
        glow(ctx, c.cyan, 2);
        ctx.beginPath();
        for (let i = 0; i <= 500; i++) {
          const u = i / 500;
          const v = Math.sin(2 * Math.PI * 1.5 * u + _t * 1.1);
          const y = midY - v * laneH * 0.3;
          if (i === 0) ctx.moveTo(x0 + u * (x1 - x0), y);
          else ctx.lineTo(x0 + u * (x1 - x0), y);
        }
        ctx.stroke();
        ctx.restore();
        for (let k = 1; k <= hops; k++) {
          const px = x0 + (k / (hops + 1)) * (x1 - x0);
          ctx.strokeStyle = 'rgba(255,255,255,.16)';
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.moveTo(px, top + 18);
          ctx.lineTo(px, top + laneH - 4);
          ctx.stroke();
          ctx.setLineDash([]);
          label(ctx, `reg ${k}`, px + 3, top + laneH - 8, c.textDim, 8);
        }
      }
    },
    [hops, noise, mode],
  );

  const analogNoise = Math.sqrt(hops) * noise;

  return (
    <LabShell
      title="Analogue vs digital transmission"
      description="Identical hops, identical per-hop noise — only the repeater differs."
      accent="var(--green)"
      specs={specs}
      values={values}
      set={set}
      reset={reset}
      status={{
        tone: 'info',
        text: `Analogue noise amplitude grows as √N across ${hops} hops (now ≈ ${analogNoise.toFixed(1)} % of signal). Digital noise stays at zero because each regenerator makes a decision and re-emits a clean level. This is a structural property, not an implementation quality.`,
      }}
      readouts={makeReadouts([
        { label: 'Hops', value: String(hops), tone: 'info' },
        { label: 'Noise per hop', value: `${noise} %`, tone: 'info' },
        { label: 'Analogue out', value: `${analogNoise.toFixed(1)} %`, tone: 'bad' },
        { label: 'Digital out', value: '0 %', tone: 'good' },
        { label: 'Amplifier vs repeater', value: 'linear vs decision', tone: 'info' },
        { label: 'Drift', value: 'yes / no', tone: 'info' },
      ])}
    >
      <VizCanvas draw={draw} height={320} label="Analogue chain accumulating noise above a digital chain that discards it" />
    </LabShell>
  );
}