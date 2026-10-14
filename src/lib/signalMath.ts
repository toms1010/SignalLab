/**
 * Deterministic signal-processing primitives.
 *
 * Every function here is pure: the same inputs always produce the same output.
 * Random effects (noise) use a seeded mulberry32 PRNG rather than Math.random,
 * so a laboratory re-opened with the same slider values reproduces exactly the
 * same figure and the same measured numbers.
 */

export const TAU = Math.PI * 2;

/* --------------------------------------------------------------- helpers */

export const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const mapRange = (v: number, inA: number, inB: number, outA: number, outB: number): number =>
  outA + (outB - outA) * ((v - inA) / (inB - inA || 1));

export const round = (v: number, digits = 3): number => {
  const p = 10 ** digits;
  return Math.round(v * p) / p;
};

/** Compact significant-figure formatting for engineering readouts. */
export const sig = (v: number, digits = 4): string => {
  if (!Number.isFinite(v) || v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e5 || a < 1e-3) {
    const [mant, exp] = v.toExponential(2).split('e');
    const n = Number(exp);
    return `${mant}×10^${n}`;
  }
  return String(round(v, digits));
};

export const dbToAmp = (db: number): number => 10 ** (db / 20);
export const ampToDb = (a: number): number => 20 * Math.log10(Math.max(a, 1e-12));
export const dbToPower = (db: number): number => 10 ** (db / 10);

/** Abramowitz & Stegun 26.2.17 — Gaussian tail probability. */
export function qFunction(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989422804014327 * Math.exp(-(x * x) / 2);
  const p =
    d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return x >= 0 ? p : 1 - p;
}

/* --------------------------------------------------------------- statistics */

export const mean = (a: readonly number[]): number =>
  a.length === 0 ? 0 : a.reduce((s, v) => s + v, 0) / a.length;

export const rms = (a: readonly number[]): number =>
  a.length === 0 ? 0 : Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);

export const variance = (a: readonly number[]): number => {
  const m = mean(a);
  return a.length === 0 ? 0 : mean(a.map((v) => (v - m) ** 2));
};

export const stdev = (a: readonly number[]): number => Math.sqrt(variance(a));

export const median = (a: readonly number[]): number => {
  if (a.length === 0) return 0;
  const s = [...a].sort((x, y) => x - y);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
};

/* --------------------------------------------------------------------- RNG */

/** mulberry32 — small, fast, fully deterministic 32-bit PRNG. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller transform: uniform PRNG output → standard normal sample. */
export function gaussian(rand: () => number): number {
  const u = Math.max(1e-12, rand());
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
}

/** Deterministic pseudo-random binary sequence of `n` bits (m-sequence-like). */
export function pseudoRandomBits(n: number, seed = 0x5eed): string {
  let s = (seed || 1) >>> 0;
  let out = '';
  for (let i = 0; i < n; i++) {
    s = (1103515245 * s + 12345) >>> 0;
    out += (s >>> 16) & 1 ? '1' : '0';
  }
  return out;
}

/* ------------------------------------------------------------------- bits */

export const toBin = (n: number, width: number): string => {
  const s = (n >>> 0).toString(2);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
};

export const binToNum = (s: string): number => parseInt(s, 2) >>> 0;

/** Clean and validate a user's binary input string. */
export function sanitizeBits(input: string, maxLength = 256): string {
  return input.replace(/[^01]/g, '').slice(0, maxLength);
}

/* ------------------------------------------------------------ basic signals */

export const sine = (f: number, t: number): number => Math.sin(TAU * f * t);

/** Uniformly sampled time vector over [0, duration). */
export function timeVector(duration: number, points: number): number[] {
  const out = new Array<number>(points + 1);
  for (let i = 0; i <= points; i++) out[i] = (i / points) * duration;
  return out;
}

/* ---------------------------------------------------------------- sampling */

export interface Sample {
  t: number;
  v: number;
}

export function sampleSignal(fn: (t: number) => number, duration: number, fs: number): Sample[] {
  const n = Math.max(1, Math.round(duration * fs));
  const out: Sample[] = [];
  for (let i = 0; i <= n; i++) out.push({ t: i / fs, v: fn(i / fs) });
  return out;
}

/**
 * Whittaker–Shannon (sinc) interpolation. This reconstructs the band-limited
 * signal exactly only when the signal contains nothing above fs/2 — which the
 * sampling lesson states as an explicit assumption.
 */
export function reconstructSinc(samples: readonly Sample[], tGrid: readonly number[], fs: number): number[] {
  return tGrid.map((t) => {
    let acc = 0;
    for (let k = 0; k < samples.length; k++) {
      const x = (t - k / fs) * fs;
      acc += samples[k]!.v * (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    }
    return acc;
  });
}

export function zeroOrderHold(samples: readonly Sample[], tGrid: readonly number[], fs: number): number[] {
  return tGrid.map((t) => {
    const k = clamp(Math.floor(t * fs + 1e-9), 0, samples.length - 1);
    return samples[k]!.v;
  });
}

export function linearHold(samples: readonly Sample[], tGrid: readonly number[], fs: number): number[] {
  return tGrid.map((t) => {
    const x = t * fs;
    const k = clamp(Math.floor(x + 1e-9), 0, samples.length - 1);
    const k2 = clamp(k + 1, 0, samples.length - 1);
    const a = x - Math.floor(x);
    return samples[k]!.v * (1 - a) + samples[k2]!.v * a;
  });
}

/* ------------------------------------------------------------ quantisation */

export type QuantizerKind = 'midrise' | 'midtread';

export const levelsFor = (bits: number): number => 2 ** bits;

/**
 * Step size for a uniform quantiser spanning V_FSR with 2^bits levels:
 *   V_LSB = V_FSR / 2^bits          (the "step = range / levels" convention)
 */
export const stepSize = (vfsr: number, bits: number): number => vfsr / 2 ** bits;

export function quantIndex(x: number, vfsr: number, bits: number): number {
  const q = stepSize(vfsr, bits);
  const vmin = -vfsr / 2;
  return clamp(Math.round((x - vmin) / q - 0.5), 0, levelsFor(bits) - 1);
}

export function quantValue(index: number, vfsr: number, bits: number, kind: QuantizerKind): number {
  const q = stepSize(vfsr, bits);
  const vmin = -vfsr / 2;
  return kind === 'midtread' ? vmin + index * q : vmin + (index + 0.5) * q;
}

export function quantize(x: number, vfsr: number, bits: number, kind: QuantizerKind = 'midrise'): number {
  return quantValue(quantIndex(x, vfsr, bits), vfsr, bits, kind);
}

export interface SignMagCode {
  index: number;
  negative: boolean;
  magnitude: number;
  signBit: number;
  bits: string;
  value: number;
  error: number;
}

/**
 * Sign-magnitude natural-binary coding: one sign bit (1 = negative) followed by
 * (bits − 1) magnitude bits. The all-ones magnitude slot is the "negative zero"
 * slot, so 2^(bits-1) magnitudes are addressable per polarity.
 */
export function signMagCode(x: number, vfsr: number, bits: number, kind: QuantizerKind = 'midrise'): SignMagCode {
  const L = levelsFor(bits);
  const K = L / 2;
  const index = quantIndex(x, vfsr, bits);
  const negative = index < K;
  const magnitude = negative ? K - 1 - index : index - K;
  const value = quantValue(index, vfsr, bits, kind);
  return {
    index,
    negative,
    magnitude,
    signBit: negative ? 1 : 0,
    bits: (negative ? '1' : '0') + toBin(magnitude, bits - 1),
    value,
    error: x - value,
  };
}

/** Folded binary (natural binary / two's-complement style) coding. */
export function foldedCode(x: number, vfsr: number, bits: number): { index: number; bits: string; value: number } {
  const index = quantIndex(x, vfsr, bits);
  return { index, bits: toBin(index, bits), value: quantValue(index, vfsr, bits, 'midrise') };
}

/** SQNR of a full-scale sinusoid through an ideal uniform quantiser. */
export const sqnrFullScaleDb = (bits: number): number => 6.0206 * bits + 1.7609;

/** Dynamic range implied by the number of levels: 20·log10(2^bits). */
export const dynamicRangeDb = (bits: number): number => 6.0206 * bits;

/* -------------------------------------------------------------- companding */

/** ITU-T G.711 μ-law: domain [-1,1] → [-1,1], exact inverse of muLawInverse. */
export function muLaw(x: number, mu = 255): number {
  if (mu === 0) return clamp(x, -1, 1);        // linear limit: ln(1+0)/ln(1+0) is 0/0
  const a = Math.abs(clamp(x, -1, 1));
  const y = Math.log(1 + mu * a) / Math.log(1 + mu);
  return x < 0 ? -y : y;
}

export function muLawInverse(y: number, mu = 255): number {
  if (mu === 0) return clamp(y, -1, 1);
  const a = Math.abs(clamp(y, -1, 1));
  const x = (Math.exp(a * Math.log(1 + mu)) - 1) / mu;
  return y < 0 ? -x : x;
}

/** μ-law transfer function expressed in dB, used on the companding plot. */
export const muLawDb = (a: number, mu = 255): number =>
  ampToDb(Math.log(1 + mu * Math.abs(a)) / Math.log(1 + mu) / Math.max(a, 1e-9));

/**
 * ITU-T G.711 A-law.
 * The linear segment runs for |x| < 1/A (≈ 0.0114 for A = 87.7), NOT for
 * |x| ≤ 1/16: at x = 1/16 the logarithmic branch has already taken over.
 */
export function aLaw(x: number, A = 87.7): number {
  const a = Math.abs(clamp(x, -1, 1));
  const y = a < 1 / A ? A * a : (1 + Math.log(A * a)) / (1 + Math.log(A));
  return x < 0 ? -y : y;
}

export function aLawInverse(y: number, A = 87.7): number {
  const a = Math.abs(clamp(y, -1, 1));
  // Compressed value inside the linear segment is A·x, so x = y / A.
  // Above the breakpoint the log branch inverts to exp(y·(1+lnA) − 1) / A.
  const x = a <= 1 / (1 + Math.log(A)) ? a / A : Math.exp(a * (1 + Math.log(A)) - 1) / A;
  return y < 0 ? -x : x;
}
/** Slope of a companding curve in dB per dB, at a given input magnitude. */
export function compandingSlopeDb(a: number, mu = 255): number {
  const h = 1e-5;
  const a1 = Math.max(a, h);
  const a2 = a1 + h;
  return (muLawDb(a2, mu) - muLawDb(a1, mu)) / ampToDb(a2 / a1);
}

/* ----------------------------------------------------------- pulse modulation */

export interface PulseModSample {
  t: number;
  sample: number;
  width: number;
  position: number;
  amplitude: number;
}

export type PulseModKind = 'PAM' | 'PWM' | 'PPM';

/**
 * Natural pulse modulation of a sampled signal.
 *   PAM — pulse amplitude carries the sample.
 *   PWM — pulse width carries the sample.
 *   PPM — pulse position within the symbol period carries the sample.
 */
export function pulseModulate(samples: readonly number[], kind: PulseModKind, span = 0.9): PulseModSample[] {
  return samples.map((v) => ({
    t: 0,
    sample: v,
    width: kind === 'PWM' ? (v + 1) / 2 : span,
    position: kind === 'PPM' ? (v + 1) / 2 : 0.5,
    amplitude: kind === 'PAM' ? v : 1,
  }));
}

/* --------------------------------------------------------- delta modulation */

export interface DmResult {
  bits: number[];
  recon: number[];
  t: number[];
  errors: number[];
  slopeOverload: boolean[];
  peakError: number;
  rmsError: number;
  overloadSamples: number;
}

/**
 * One-bit delta modulation.
 * Convention (documented in the lesson): output 1 when the input sample is
 * greater than the current staircase estimate, otherwise 0. Equality resolves
 * to 0 — no step up — which keeps the decoder loop-free of ambiguity.
 */
export function deltaModulate(
  signal: (t: number) => number,
  fs: number,
  duration: number,
  step: number,
): DmResult {
  const n = Math.max(1, Math.round(duration * fs));
  const bits: number[] = [];
  const recon: number[] = [];
  const t: number[] = [];
  const errors: number[] = [];
  const slopeOverload: boolean[] = [];
  let prev = 0;
  let peak = 0;
  let overload = 0;
  let acc = 0;

  for (let i = 0; i <= n; i++) {
    const ti = i / fs;
    const x = signal(ti);
    const bit = x > prev ? 1 : 0;
    bits.push(bit);
    prev = clamp(prev + (bit ? step : -step), -4, 4);
    t.push(ti);
    recon.push(prev);
    const e = x - prev;
    errors.push(e);
    peak = Math.max(peak, Math.abs(e));
    acc += e * e;
    // Slope overload: the true input slope exceeds one step per sample and the
    // error keeps growing in the same direction over consecutive samples.
    const prevErr = i > 0 ? errors[i - 1]! : 0;
    const over = Math.sign(e) === Math.sign(prevErr) && Math.abs(e) > step * 1.05 && Math.abs(e) > prevErr;
    slopeOverload.push(over);
    if (over) overload++;
  }

  return {
    bits,
    recon,
    t,
    errors,
    slopeOverload,
    peakError: peak,
    rmsError: Math.sqrt(acc / errors.length),
    overloadSamples: overload,
  };
}

/* ------------------------------------------------------------- sigma-delta */

export interface SigmaDeltaResult {
  bits: number[];
  t: number[];
  output: number[];
  /** Digital decimation result: integrate + LPF + decimate back to baseband. */
  decimatedT: number[];
  decimated: number[];
  oversampleRate: number;
  /** In-band noise estimate, linear power, from the decimated residual. */
  inBandNoisePower: number;
  /** Same estimate without noise shaping, for comparison. */
  flatNoisePower: number;
}

/**
 * First-order sigma-delta modulator with a 1-bit quantiser.
 * `quantise` is a sign (1-bit) quantiser on the integrator state.
 */
export function sigmaDeltaModulate(
  signal: (t: number) => number,
  fs: number,
  duration: number,
  oversampleRate: number,
  seed = 20240501,
): SigmaDeltaResult {
  const Fs = fs * oversampleRate;
  const n = Math.max(1, Math.round(duration * Fs));
  const bits: number[] = [];
  const t: number[] = [];
  const output: number[] = [];
  let integrator = 0;
  let q = 1;

  for (let i = 0; i <= n; i++) {
    const ti = i / Fs;
    integrator = clamp(integrator + signal(ti) - q, -2, 2);
    q = integrator > 0 ? 1 : -1; // 1-bit sign quantiser with feedback
    bits.push(q > 0 ? 1 : 0);
    t.push(ti);
    output.push(q);
  }

  // Digital decimation: integrate the bitstream over each baseband period
  // (this is the matched filter a real ΣΔ receiver uses) then decimate.
  const decimatedT: number[] = [];
  const decimated: number[] = [];
  const perOsr = oversampleRate;
  for (let i = 0; i + perOsr <= bits.length; i += perOsr) {
    let acc = 0;
    for (let j = 0; j < perOsr; j++) acc += (bits[i + j]! === 1 ? 1 : -1);
    // The box average represents the signal at the MIDDLE of its window, so
    // timestamp it there. Without this half-window correction the reported
    // in-band error is dominated by a fixed group-delay phase error that does
    // not average down as the oversampling ratio grows.
    decimatedT.push((i + perOsr / 2) / Fs);
    decimated.push(acc / perOsr);
  }

  // Compare the decimated output to the ideal signal (in-band error power).
  const residual = decimated.map((v, i) => v - signal(decimatedT[i]!));
  const inBandNoisePower = residual.length ? mean(residual.map((v) => v * v)) : 0;

  // Without shaping, a plain uniform quantiser at the same rate has noise
  // variance (V_LSB)^2/12 = (2/2)^2/12 for a ±1 bipolar full-scale range.
  const flatNoisePower = 1 / 3;

  // Deterministic jitter used only to make the noise spectrum visualisation
  // reproducible from run to run.
  const rand = createRng(seed);
  void rand;

  return { bits, t, output, decimatedT, decimated, oversampleRate, inBandNoisePower, flatNoisePower };
}

/* ------------------------------------------------------------------- DPCM */

export interface DpcmResult {
  /** Quantised prediction errors, in step units (the transmitted code values). */
  code: number[];
  /** Transmitted error in signal units. */
  diff: number[];
  /** Encoder/decoder reconstruction (identical in a closed loop). */
  recon: number[];
  quantError: number[];
  step: number;
  /** Bit rate of the conventional PCM encoder for the same resolution. */
  pcmBits: number;
  dpcmBits: number;
}

/**
 * Toy DPCM codec, documented explicitly: a first-order (previous-sample)
 * predictor closed-loop encoder with a uniform error quantiser.
 */
export function dpcmEncode(samples: readonly number[], bits: number, vmax: number): DpcmResult {
  const step = stepSize(2 * vmax, bits);
  const span = step * 2 ** (bits - 1);
  const code: number[] = [];
  const diff: number[] = [];
  const recon: number[] = [];
  const quantError: number[] = [];
  let predictor = 0;

  for (const x of samples) {
    const e = clamp(x - predictor, -span, span - step);
    const c = Math.round((e + span) / step);
    const d = c * step - span;
    code.push(c);
    diff.push(d);
    predictor = predictor + d;
    recon.push(predictor);
    quantError.push(x - predictor);
  }

  return {
    code,
    diff,
    recon,
    quantError,
    step,
    pcmBits: bits,
    dpcmBits: bits,
  };
}

/* ------------------------------------------------------- analog modulation */

/** Conventional AM (DSB-FC): s(t) = Vc·(1 + m·sin(2π f_m t)). */
export const amSignal = (t: number, fm: number, m: number, vc = 1): number =>
  vc * (1 + m * Math.sin(TAU * fm * t));

/** FM: cos(2π f_c t + β·sin(2π f_m t)) with β = Δf / f_m. */
export const fmSignal = (t: number, fc: number, fm: number, beta: number): number =>
  Math.cos(TAU * fc * t + beta * Math.sin(TAU * fm * t));

/** Instantaneous frequency of fmSignal, used to verify Δf visually. */
export const fmInstantaneousFrequency = (t: number, fc: number, fm: number, df: number): number =>
  fc + df * Math.cos(TAU * fm * t);

/** PM: cos(2π f_c t + m_p·sin(2π f_m t)). */
export const pmSignal = (t: number, fc: number, fm: number, mp: number): number =>
  Math.cos(TAU * fc * t + mp * Math.sin(TAU * fm * t));

/** Total AM transmit power for a single-tone message: P_T = P_C(1 + m²/2). */
export const amTotalPower = (carrierPower: number, m: number): number => carrierPower * (1 + (m * m) / 2);

export const carsonBandwidth = (deviation: number, maxModFreq: number): number => 2 * (deviation + maxModFreq);

/* ----------------------------------------------------- digital passband */

export interface ConstellationPoint {
  /** In-phase coordinate in units of the constellation's own step. */
  i: number;
  /** Quadrature coordinate. */
  q: number;
  /** Normalised to the unit average power. */
  normI: number;
  normQ: number;
  /** Bit label, most significant group first. */
  bits: string;
  /** Phase and amplitude of the point. */
  phase: number;
  amplitude: number;
}

export interface Constellation {
  points: ConstellationPoint[];
  /** Bits carried per symbol. */
  k: number;
  /** Grid size (square QAM) or phase count (PSK). */
  order: number;
  kind: 'ASK' | 'PSK' | 'QAM';
  name: string;
  /** Average symbol energy (normalisation reference). */
  averageEnergy: number;
}

/** Gray-encode a binary word. The transform needs no bit width. */
export const grayEncode = (n: number): number => n ^ (n >> 1);

/** Gray-decode a binary word. */
export function grayDecode(g: number, bits: number): number {
  let b = g;
  for (let i = 1; i < bits; i++) b ^= g >> i;
  return b;
}

export function pskConstellation(order: number): Constellation {
  const k = Math.round(Math.log2(order));
  const points: ConstellationPoint[] = [];
  for (let n = 0; n < order; n++) {
    const phase = (TAU * n) / order;
    points.push({
      i: Math.cos(phase),
      q: Math.sin(phase),
      normI: Math.cos(phase),
      normQ: Math.sin(phase),
      bits: toBin(n, k),
      phase,
      amplitude: 1,
    });
  }
  return { points, k, order, kind: 'PSK', name: `${order}-PSK`, averageEnergy: 1 };
}

/**
 * Gray-coded square QAM. Square grids only: 4, 16, 64-QAM (and 256).
 * Non-square orders (8, 32, 128) are cross-QAM and are declared unsupported
 * rather than drawn incorrectly — the lesson explains why.
 */
export function squareQamConstellation(order: number): Constellation | null {
  const n = Math.round(Math.sqrt(order));
  if (n * n !== order || n < 2) return null;
  const axisBits = Math.round(Math.log2(n));
  if (2 ** axisBits !== n) return null;
  const k = axisBits * 2;
  const scale = (n - 1) / 2 || 1;
  const labels: string[] = [];
  for (let i = 0; i < n; i++) labels.push(toBin(grayDecode(i, axisBits), axisBits));

  const points: ConstellationPoint[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const gi = 2 * c - (n - 1);
      const gq = 2 * r - (n - 1);
      const normI = gi / scale;
      const normQ = gq / scale;
      points.push({
        i: gi,
        q: gq,
        normI,
        normQ,
        bits: labels[r]! + labels[c]!,
        phase: Math.atan2(normQ, normI),
        amplitude: Math.hypot(normI, normQ),
      });
    }
  }
  return { points, k, order, kind: 'QAM', name: `${order}-QAM`, averageEnergy: mean(points.map((p) => p.normI ** 2 + p.normQ ** 2)) };
}

export function askConstellation(): Constellation {
  const mk = (bits: string, normI: number): ConstellationPoint => ({
    i: normI > 0 ? 1 : -1,
    q: 0,
    normI,
    normQ: 0,
    bits,
    phase: normI > 0 ? 0 : Math.PI,
    amplitude: 1,
  });
  return {
    points: [mk('0', -1), mk('1', 1)],
    k: 1,
    order: 2,
    kind: 'ASK',
    name: 'ASK (2-level)',
    averageEnergy: 1,
  };
}

export type ModulationScheme = 'ASK' | 'FSK' | 'BPSK' | 'PSK' | 'QAM';

/** Resolve a scheme + order string into a usable constellation. */
export function buildConstellation(scheme: ModulationScheme, order: number): Constellation | null {
  switch (scheme) {
    case 'ASK':
      return askConstellation();
    case 'PSK':
      return pskConstellation(order);
    case 'BPSK':
      return pskConstellation(2);
    case 'QAM':
      return squareQamConstellation(order);
    default:
      return null;
  }
}

export interface ModulatedWave {
  t: number[];
  y: number[];
  base: number[];
  symbolIndex: number[];
  duration: number;
  symbolRate: number;
}

/** Raised-cosine pulse shaping of a baseband symbol stream. */
export function raisedCosinePulse(bitValue: number, tNorm: number, alpha: number): number {
  if (Math.abs(tNorm) >= 1 + alpha) return 0;
  if (Math.abs(tNorm) <= 1 - alpha || alpha === 0) {
    return bitValue * (Math.PI * tNorm >= 0 ? 0.5 : -0.5);
  }
  const num = Math.sin(Math.PI * tNorm * (1 - alpha));
  const den = Math.PI * tNorm * (1 - (4 * alpha * tNorm) ** 2);
  return bitValue * (num / den);
}

/**
 * Generate a passband waveform for a bit string.
 * Symbols occupy exactly 1/Rs seconds. Square (unshaped) pulse symbols are used
 * so the effect of the modulation scheme itself is visible without pulse-shaping
 * complexity; the bandwidth lesson covers roll-off separately.
 */
export function modulateBits(
  scheme: ModulationScheme,
  bits: string,
  symbolRate: number,
  carrierHz: number,
  options: { f0?: number; f1?: number; constellation?: Constellation | null } = {},
): ModulatedWave {
  const duration = bits.length / symbolRate;
  const points = clamp(Math.round(duration * Math.max(symbolRate * 140, 700)), 280, 2600);
  const cons = options.constellation ?? null;
  const index = new Map<string, ConstellationPoint>();
  if (cons) cons.points.forEach((p) => index.set(p.bits, p));

  const t: number[] = [];
  const y: number[] = [];
  const base: number[] = [];
  const symbolIndex: number[] = [];

  const f0 = options.f0 ?? carrierHz * 0.94;
  const f1 = options.f1 ?? carrierHz * 1.06;

  for (let i = 0; i <= points; i++) {
    const tt = (i / points) * duration;
    const k = clamp(Math.floor(tt * symbolRate), 0, Math.max(0, bits.length - 1));
    const bit = bits.charAt(k);
    let v = 0;

    switch (scheme) {
      case 'ASK':
        v = bit === '1' ? 1 : 0;
        break;
      case 'FSK':
        v = Math.cos(TAU * (bit === '1' ? f1 : f0) * tt);
        break;
      case 'BPSK':
        v = Math.cos(TAU * carrierHz * tt + (bit === '1' ? 0 : Math.PI));
        break;
      case 'PSK':
      case 'QAM': {
        const offset = k - (k % (cons?.k ?? 1));
        const group = bits.slice(offset, offset + (cons?.k ?? 1));
        const p = index.get(group);
        if (p) {
          v = p.normI * Math.cos(TAU * carrierHz * tt) - p.normQ * Math.sin(TAU * carrierHz * tt);
        } else {
          v = Math.cos(TAU * carrierHz * tt);
        }
        break;
      }
    }

    t.push(tt);
    y.push(v);
    base.push(bit === '1' ? 1 : 0);
    symbolIndex.push(k);
  }

  return { t, y, base, symbolIndex, duration, symbolRate };
}

/** Nearest-point decision on a noisy constellation. */
export function nearestConstellationPoint(cons: Constellation, normI: number, normQ: number): ConstellationPoint {
  let best = cons.points[0]!;
  let bestD = Infinity;
  for (const p of cons.points) {
    const d = (p.normI - normI) ** 2 + (p.normQ - normQ) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/* ------------------------------------------------------------------- OFDM */

export interface OfdmResult {
  t: number[];
  y: number[];
  subcarriers: { k: number; i: number; q: number; bits: string; y: number[] }[];
  /** Cyclic-prefix-extended waveform (conceptual). */
  cpT: number[];
  cpY: number[];
  cpFraction: number;
  nCarriers: number;
}

/**
 * Synthesise one OFDM useful symbol directly from its subcarrier symbols.
 * This is mathematically equivalent to evaluating an inverse DFT: summing
 * (I_k cos(2πkΔf t) + Q_k sin(2πkΔf t)) with Δf = 1/T_u.
 */
export function ofdmSymbol(
  symbols: { k: number; i: number; q: number; bits: string }[],
  samplesPerCarrier = 16,
  cpFraction = 0.25,
): OfdmResult {
  const nCarriers = symbols.length;
  const Tu = 1; // useful-symbol period; subcarrier spacing is therefore 1/Tu
  const points = clamp(nCarriers * samplesPerCarrier, 200, 1200);
  const norm = Math.sqrt(nCarriers);
  const t: number[] = [];
  const y: number[] = [];
  const sub = symbols.map((s) => ({ ...s, y: [] as number[] }));

  for (let i = 0; i <= points; i++) {
    const tt = (i / points) * Tu;
    let acc = 0;
    for (let j = 0; j < nCarriers; j++) {
      const s = sub[j]!;
      const v = (s.i * Math.cos(TAU * s.k * tt) + s.q * Math.sin(TAU * s.k * tt)) / norm;
      acc += v;
      s.y.push(v);
    }
    t.push(tt);
    y.push(acc);
  }

  // Cyclic prefix: copy the tail of the useful symbol to the front.
  const cpLength = Math.max(1, Math.floor(t.length * cpFraction));
  const cpT: number[] = [];
  const cpY: number[] = [];
  for (let i = 0; i < cpLength; i++) {
    const src = y.length - cpLength + i;
    cpT.push(-(cpLength - i) / points);
    cpY.push(y[src]!);
  }

  return { t, y, subcarriers: sub, cpT, cpY, cpFraction, nCarriers };
}

/** Build OFDM subcarrier symbols from a bit string using Gray-coded 16-QAM. */
export function ofdmFromBits(bits: string, nCarriers: number, samplesPerCarrier?: number): OfdmResult {
  const map = squareQamConstellation(16)!;
  const index = new Map(map.points.map((p) => [p.bits, p]));
  const symbols = [];
  for (let c = 0; c < nCarriers; c++) {
    const b = (bits.slice(c * 4, c * 4 + 4) + '0000').slice(0, 4);
    const p = index.get(b) ?? map.points[0]!;
    symbols.push({ k: c + 1, i: p.normI / Math.sqrt(2), q: p.normQ / Math.sqrt(2), bits: b });
  }
  return ofdmSymbol(symbols, samplesPerCarrier);
}

/** ∫₀^Tu cos(2πkΔf t)·cos(2πlΔf t) dt — zero unless k = l (orthogonality). */
export const ofdmOrthogonalityIntegral = (k: number, l: number, Tu = 1): number => (k === l ? Tu / 2 : 0);

/* --------------------------------------------------------- spread spectrum */

export interface DsssResult {
  t: number[];
  data: number[];
  chips: number[];
  spread: number[];
  chipBoundary: number[];
  chipRate: number;
}

export function dsssSpread(bits: string, chipSequence: string): DsssResult {
  const chipRate = chipSequence.length; // chips per second; 1 s per data bit
  const duration = bits.length;
  const points = clamp(Math.round(duration * 800), 400, 2400);
  const t: number[] = [];
  const data: number[] = [];
  const chips: number[] = [];
  const spread: number[] = [];
  const chipBoundary: number[] = [];

  for (let i = 0; i <= points; i++) {
    const tt = (i / points) * duration;
    const k = clamp(Math.floor(tt), 0, bits.length - 1);
    const ci = Math.floor(tt * chipRate) % chipSequence.length;
    const b = bits.charAt(k) === '1' ? 1 : -1;
    const c = chipSequence.charAt(ci) === '1' ? 1 : -1;
    t.push(tt);
    data.push(b);
    chips.push(c);
    spread.push(b * c);
    chipBoundary.push(ci / chipSequence.length);
  }
  return { t, data, chips, spread, chipRate, chipBoundary };
}

export interface FhssResult {
  t: number[];
  y: number[];
  hop: number[];
  data: number[];
  nChannels: number;
  hopInterval: number;
}

export function fhssTransmit(bits: string, nChannels: number, baseHz: number, hopSpacing: number): FhssResult {
  const hops: number[] = [];
  let seed = 12345;
  for (let i = 0; i < bits.length; i++) {
    seed = (1103515245 * seed + 12345) >>> 0;
    hops.push((seed >>> 9) % nChannels);
  }
  const steps = bits.length * 14;
  const t: number[] = [];
  const y: number[] = [];
  const hop: number[] = [];
  const data: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const tt = (i / steps) * bits.length;
    const h = clamp(Math.floor(tt), 0, bits.length - 1);
    const fc = baseHz + hops[h]! * hopSpacing;
    t.push(tt);
    y.push(Math.cos(TAU * fc * tt));
    hop.push(hops[h]!);
    data.push(bits.charAt(h) === '1' ? 1 : 0);
  }
  return { t, y, hop, data, nChannels, hopInterval: 1 };
}

/* ------------------------------------------------------- error control code */

export function xorBits(a: string, b: string): string {
  const n = Math.max(a.length, b.length);
  let out = '';
  for (let i = 0; i < n; i++) out += String((Number(a[i] ?? 0) ^ Number(b[i] ?? 0)) & 1);
  return out;
}

/**
 * CRC by polynomial division over GF(2). Division is implemented as a
 * left-shifting XOR sweep, which is exactly the usual hardware/table method.
 */
export interface CrcStep {
  position: number;
  before: string;
  generator: string;
  after: string;
}

export interface CrcResult {
  augmented: string;
  remainder: string;
  codeword: string;
  steps: CrcStep[];
  generator: string;
  generatorValue: number;
}

export function crcCompute(message: string, generator: string): CrcResult {
  const gen = generator.replace(/[^01]/g, '') || '1001';
  const r = gen.length - 1;
  const augmented = message + '0'.repeat(r);
  const bits = augmented.split('').map(Number);
  const genBits = gen.split('').map(Number);
  const steps: CrcStep[] = [];

  for (let i = 0; i <= bits.length - genBits.length; i++) {
    if (bits[i] === 1) {
      const before = bits.slice(i, i + genBits.length).join('');
      for (let j = 0; j < genBits.length; j++) bits[i + j] = bits[i + j]! ^ genBits[j]!;
      if (steps.length < 40) {
        steps.push({ position: i, before, generator: gen, after: bits.slice(i, i + genBits.length).join('') });
      }
    }
  }

  const remainder = bits.slice(-r).join('');
  return {
    augmented,
    remainder,
    codeword: message + remainder,
    steps,
    generator: gen,
    generatorValue: binToNum(gen),
  };
}

/** True when a received codeword is error-free (CRC check). */
export function crcCheck(received: string, generator: string): boolean {
  const gen = generator.replace(/[^01]/g, '') || '1001';
  const genBits = gen.split('').map(Number);
  const bits = received.split('').map(Number);
  for (let i = 0; i <= bits.length - genBits.length; i++) {
    if (bits[i] === 1) for (let j = 0; j < genBits.length; j++) bits[i + j] = bits[i + j]! ^ genBits[j]!;
  }
  return bits.every((b) => b === 0);
}

/**
 * Hamming(7,4) encoding, SEC.
 * Bit numbering is 1..7, MSB first: codeword = [p1 p2 d1 p4 d2 d3 d4].
 *   p1 covers positions {1,3,5,7}, p2 covers {2,3,6,7}, p4 covers {4,5,6,7}.
 */
export function hamming74Encode(data: string): string {
  const d = data.split('').map(Number);
  const p1 = (d[0]! + d[1]! + d[3]!) % 2;
  const p2 = (d[0]! + d[2]! + d[3]!) % 2;
  const p4 = (d[1]! + d[2]! + d[3]!) % 2;
  return [p1, p2, d[0]!, p4, d[1]!, d[2]!, d[3]!].join('');
}

export interface HammingSyndrome {
  s1: number;
  s2: number;
  s4: number;
  /** Binary position of the faulty bit (0 = no error). */
  position: number;
}

export function hamming74Syndrome(codeword: string): HammingSyndrome {
  const c = codeword.padEnd(7, '0').split('').map(Number);
  // Groups must match the encoder exactly:
  //   p1 (position 1) covers {1,3,5,7}  -> indices 0,2,4,6
  //   p2 (position 2) covers {2,3,6,7}  -> indices 1,2,5,6
  //   p4 (position 4) covers {4,5,6,7}  -> indices 3,4,5,6
  const s1 = (c[0]! + c[2]! + c[4]! + c[6]!) % 2;
  const s2 = (c[1]! + c[2]! + c[5]! + c[6]!) % 2;
  const s4 = (c[3]! + c[4]! + c[5]! + c[6]!) % 2;
  return { s1, s2, s4, position: s1 * 1 + s2 * 2 + s4 * 4 };
}

export function hamming74Correct(codeword: string, position: number): string {
  const c = codeword.padEnd(7, '0').split('').map(Number);
  if (position >= 1 && position <= 7) c[position - 1] = c[position - 1]! ^ 1;
  return c.join('');
}

/** Hamming distance between two equal-length binary strings. */
export const hammingDistance = (a: string, b: string): number => {
  const n = Math.min(a.length, b.length);
  let d = 0;
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) d++;
  return d;
};

/** Parity bit for even (mode 'even') or odd parity. */
export const parityBit = (bits: string, mode: 'even' | 'odd' = 'even'): number => {
  const ones = bits.split('').reduce<number>((s, b) => s + Number(b), 0);
  // `%` in JavaScript keeps the sign of the dividend, so odd parity is computed
  // by adding before reducing — otherwise a word with an even count of ones
  // produces a negative result.
  return mode === 'even' ? ones % 2 : (ones + 1) % 2;
};

/** Two's-complement style additive checksum over fixed-width words. */
export function onesComplementChecksum(words: readonly number[], wordBits = 16): string {
  const max = 2 ** wordBits - 1;
  let sum = 0;
  for (const w of words) sum = (sum + w) % max;
  return toBin(sum === 0 ? max - 1 : max - sum, wordBits);
}

/** Block interleaver write depth (column-major) and de-interleaver inverse. */
export function interleave(data: number[], depth: number): number[] {
  const out = new Array<number>(data.length).fill(0);
  for (let i = 0; i < data.length; i++) out[(i % depth) * Math.floor(data.length / depth) + Math.floor(i / depth)] = data[i]!;
  return out;
}