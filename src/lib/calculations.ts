/**
 * Derived engineering calculations shared by lessons, laboratories and
 * exercises. Kept separate from `signalMath` (raw signal generation) because
 * these functions are about *reporting* an engineering result.
 */

import { amTotalPower, carsonBandwidth, qFunction, round, sig, stdev } from './signalMath';

/* ----------------------------------------------------------------- SNR/BER */

export const snrDb = (signalPower: number, noisePower: number): number =>
  10 * Math.log10(Math.max(signalPower, 1e-30) / Math.max(noisePower, 1e-30));

export const snrFromDb = (db: number): number => 10 ** (db / 10);

/** Empirical bit error rate from a transmitted / received bit pair. */
export function empiricalBer(tx: string, rx: string): { errors: number; total: number; ber: number } {
  const n = Math.min(tx.length, rx.length);
  let errors = 0;
  for (let i = 0; i < n; i++) if (tx[i] !== rx[i]) errors++;
  return { errors, total: n, ber: n === 0 ? 0 : errors / n };
}

/**
 * Wilson score interval for a binomial proportion.
 * Used so the BER panel can honestly say "this short run cannot pin down BER
 * more tightly than X…Y" instead of over-claiming.
 */
export function wilsonInterval(errors: number, total: number, z = 1.96): { low: number; high: number } {
  if (total === 0) return { low: 0, high: 1 };
  const p = errors / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const spread = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return {
    low: Math.max(0, (centre - spread) / denom),
    high: Math.min(1, (centre + spread) / denom),
  };
}

/** Theoretical BER for coherent binary schemes in AWGN (Eb/N0 in linear). */
export const theoreticalBerBpsk = (ebn0Linear: number): number =>
  qFunction(Math.sqrt(2 * safeEbn0(ebn0Linear)));

/** Coherent orthogonal BFSK. */
export const theoreticalBerBfsk = (ebn0Linear: number): number => 0.5 * qFunction(Math.sqrt(safeEbn0(ebn0Linear)));

/** Non-coherent BFSK. */
export const theoreticalBerNcBfsk = (ebn0Linear: number): number =>
  0.5 * Math.exp(-0.5 * safeEbn0(ebn0Linear));

/** Guard against a non-positive or non-finite Eb/N0. */
const safeEbn0 = (x: number): number => (Number.isFinite(x) && x > 0 ? x : 1e-9);

/** Approximate BER of Gray-coded M-QAM at high Eb/N0 (valid for BER ≲ 1e-3). */
export function theoreticalBerMqam(order: number, ebn0Db: number, k: number): number {
  const ebn0 = 10 ** (ebn0Db / 10);
  const logM = Math.log2(order);
  // Standard asymptotic expression with the Gray-decoding gain factor 1 - 1/k.
  const p = (logM - 1) * qFunction(Math.sqrt((3 * k / (order - 1)) * ebn0)) / logM;
  return Math.max(0, Math.min(0.5, p));
}

/** dB value of the measured noise floor needed to hit a target SNR. */
export const noisePowerForSnr = (signalPower: number, snrTargetDb: number): number =>
  signalPower / snrFromDb(snrTargetDb);

/* ------------------------------------------------------------- quantization */

/** SQNR actually measured from a set of (input, output) pairs, in dB. */
export function measureSqnrDb(input: readonly number[], output: readonly number[]): number {
  let sigPow = 0;
  let noisePow = 0;
  const n = Math.min(input.length, output.length);
  for (let i = 0; i < n; i++) {
    sigPow += input[i]! * input[i]!;
    noisePow += (input[i]! - output[i]!) ** 2;
  }
  return 10 * Math.log10(Math.max(sigPow, 1e-30) / Math.max(noisePow, 1e-30));
}

/** Percent error between a measured value and the ideal value. */
export const percentError = (measured: number, ideal: number): number =>
  ideal === 0 ? 0 : (Math.abs(measured - ideal) / Math.abs(ideal)) * 100;

/* -------------------------------------------------------------- modulation */

/** Conventional AM: total power, sideband power and their ratio. */
export function amPowerBreakdown(carrierPower: number, m: number) {
  const total = amTotalPower(carrierPower, m);
  return {
    carrier: carrierPower,
    sidebands: total - carrierPower,
    total,
    sidebandFraction: total === 0 ? 0 : (total - carrierPower) / total,
    efficiency: carrierPower / total,
  };
}

/** FM bandwidth estimates. */
export function fmBandwidth(deviation: number, maxModFreq: number) {
  const carson = carsonBandwidth(deviation, maxModFreq);
  return {
    carson,
    /** Narrowband / wideband FM classification at the highest message freq. */
    beta: maxModFreq === 0 ? 0 : deviation / maxModFreq,
    significantSidebands: maxModFreq === 0 ? 0 : Math.ceil(deviation / maxModFreq) + 1,
    classification: deviation === 0 ? 'unmodulated' : maxModFreq === 0 ? '—' : deviation < maxModFreq ? 'narrowband FM' : 'wideband FM',
  };
}

/** Occupied bandwidth using the raised-cosine convention used throughout. */
export const occupiedBandwidth = (symbolRate: number, rolloff: number): number => (1 + rolloff) * symbolRate;

/* -------------------------------------------------------------- receivers */

export interface SuperhetState {
  rf: number;
  lo: number;
  if: number;
  image: number;
  ifrrDb: number | null;
  valid: boolean;
}

/**
 * Superheterodyne frequency plan.
 * `injection` is 'high' when the local oscillator sits above the signal
 * (f_LO = f_RF + f_IF) or 'low' when it sits below.
 */
export function superhetPlan(rf: number, ifFreq: number, injection: 'high' | 'low', rfRejectionDb = 20): SuperhetState {
  const lo = injection === 'high' ? rf + ifFreq : Math.max(0, rf - ifFreq);
  const image = injection === 'high' ? rf + 2 * ifFreq : Math.max(0, rf - 2 * ifFreq);
  return {
    rf,
    lo,
    if: ifFreq,
    image,
    // Image rejection is set by how much the RF preselector attenuates a signal
    // 2·f_IF away; without a filter model there is nothing honest to report.
    ifrrDb: ifFreq > 0 ? rfRejectionDb : null,
    valid: rf > 0 && ifFreq > 0 && lo > 0,
  };
}

/* ------------------------------------------------------------- throughput */

/** Stop-and-wait normalised throughput, ignoring retransmission cost. */
export const stopAndWaitThroughput = (a: number, p: number): number => (1 - p) / (1 + 2 * a);

/** Stop-and-wait throughput including retransmission cost. */
export const stopAndWaitThroughputWithRetx = (a: number, p: number): number =>
  ((1 - p) * 1) / (1 + 2 * a + p * (1 + 2 * a));

/** Go-Back-N normalised throughput. */
export const goBackNThroughput = (a: number, p: number): number => (1 - p) / (1 + 2 * a * (1 - p));

/** Selective Repeat normalised throughput for a window W. */
export function selectiveRepeatThroughput(a: number, p: number, window: number): number {
  const usable = Math.max(1, window - 2 * Math.ceil(a));
  if (usable <= 0) return stopAndWaitThroughput(a, p);
  return Math.min(1, (1 - p) / (1 + (2 * a) / usable));
}

/* ------------------------------------------------------------ code metrics */

/** Error-correction capability implied by a minimum Hamming distance. */
export const hammingCapability = (dMin: number) => ({
  correctable: Math.floor((dMin - 1) / 2),
  detectable: dMin - 1,
});

/** Separation between originally adjacent symbols after block interleaving. */
export const interleaveSeparation = (depth: number, burst: number): number =>
  burst === 0 ? 0 : Math.floor(depth / burst);

/* ----------------------------------------------------------------- format */

/** Standard "engineering value with unit" formatting for readouts. */
export const withUnit = (v: number, unit: string, digits = 4): string => `${sig(v, digits)} ${unit}`;

/** Human-readable dB from a linear ratio. */
export const ratioToDb = (r: number): number => 10 * Math.log10(Math.max(r, 1e-30));

/** Spread of values, used to describe noise statistics in a lesson panel. */
export const spread = (values: readonly number[]): number => round(stdev(values), 4);