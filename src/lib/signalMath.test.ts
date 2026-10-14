import { describe, expect, it } from 'vitest';
import * as D from '@/lib/signalMath';
import * as C from '@/lib/calculations';

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe('sampling and reconstruction', () => {
  it('reconstructs a sinusoid exactly when sampled above the Nyquist rate', () => {
    const fin = 3;
    const fs = 30; // well above 2·fin
    const sig = (t: number) => Math.sin(2 * Math.PI * fin * t);
    const samples = D.sampleSignal(sig, 1, fs);
    const grid: number[] = [];
    for (let i = 0; i <= 100; i++) grid.push(i / 100);
    const recon = D.reconstructSinc(samples, grid, fs);
    // Skip the sample instants themselves; sinc interpolation is exact everywhere
    // for a strictly band-limited input, so the whole curve should match.
    grid.forEach((t, i) => {
      // Skip the very ends of the window: the sinc sum is truncated there,
      // so the reconstruction is only exact in the interior of the record.
      if (t < 0.15 || t > 0.85) return;
      expect(Math.abs(recon[i]! - sig(t))).toBeLessThan(0.02);
    });
  });

  it('makes aliased frequencies mathematically indistinguishable', () => {
    // This is the exact content of the aliasing lesson: below Nyquist there is
    // no recovery, because 22 Hz and 2 Hz produce *identical* sample sets at
    // fs = 20 Hz. Nothing downstream can tell which was the real input.
    const fs = 20;
    const hi = D.sampleSignal((t) => Math.sin(2 * Math.PI * 22 * t), 1, fs);
    const lo = D.sampleSignal((t) => Math.sin(2 * Math.PI * 2 * t), 1, fs);
    expect(hi).toHaveLength(lo.length);
    for (let i = 0; i < hi.length; i++) {
      expect(hi[i]!.t).toBeCloseTo(lo[i]!.t, 12);
      expect(hi[i]!.v).toBeCloseTo(lo[i]!.v, 12);
    }
  });

  it('cannot reconstruct a below-Nyquist tone from truncated samples', () => {
    // 22 Hz at fs = 20 Hz: the record violates the band-limited assumption the
    // sinc interpolator needs, so the reconstruction is simply wrong — which is
    // the point of the lesson. Assert it is wrong, not merely imperfect.
    const fs = 20;
    const sig = (t: number) => Math.sin(2 * Math.PI * 22 * t);
    const samples = D.sampleSignal(sig, 1, fs);
    const grid: number[] = [];
    for (let i = 0; i <= 100; i++) grid.push(0.2 + (i / 100) * 0.6);
    const recon = D.reconstructSinc(samples, grid, fs);
    const err = grid.map((t, i) => Math.abs(recon[i]! - sig(t)));
    const meanErr = err.reduce((a, b) => a + b, 0) / err.length;
    // Unusable: the mean absolute error is a large fraction of full scale.
    expect(meanErr).toBeGreaterThan(0.5);
    // and it is clearly worse than the same technique above Nyquist
    const ok = D.reconstructSinc(D.sampleSignal((t) => Math.sin(2 * Math.PI * 3 * t), 1, 30), grid, 30);
    const okErr = grid.map((t, i) => Math.abs(ok[i]! - Math.sin(2 * Math.PI * 3 * t))).reduce((a, b) => a + b, 0) / grid.length;
    expect(meanErr).toBeGreaterThan(okErr * 10);
  });

  it('zero-order hold reproduces the sample values exactly', () => {
    const samples = D.sampleSignal((t) => t, 1, 4);
    const held = D.zeroOrderHold(samples, [0, 0.24, 0.26, 0.74, 0.99], 4);
    expect(held[0]).toBeCloseTo(0, 9);
    expect(held[1]).toBeCloseTo(0, 9);
    // t = 0.26 → floor(1.04) = 1 → holds the sample taken at t = 0.25
    expect(held[2]).toBeCloseTo(0.25, 9);
    // t = 0.74 → floor(2.96) = 2 → holds the sample taken at t = 0.50
    expect(held[3]).toBeCloseTo(0.5, 9);
    expect(held[3]).not.toBeCloseTo(0.75, 3);
  });
});

describe('uniform quantisation', () => {
  it('uses step = V_FSR / 2^n and bounds the error by half a step', () => {
    const vfsr = 2;
    const bits = 4;
    expect(D.stepSize(vfsr, bits)).toBeCloseTo(0.125, 12);
    for (let x = -1; x <= 1; x += 0.013) {
      const xh = D.quantize(x, vfsr, bits, 'midrise');
      expect(Math.abs(x - xh)).toBeLessThanOrEqual(D.stepSize(vfsr, bits) / 2 + 1e-12);
    }
  });

  it('places an exact zero level in a midtread quantiser', () => {
    // A midtread quantiser must output exactly 0 for a zero input.
    expect(D.quantize(0, 2, 4, 'midtread')).toBe(0);
    // A midrise quantiser has no zero level — the nearest outputs straddle it.
    const v = D.quantize(0, 2, 4, 'midrise');
    expect(Math.abs(v)).toBeGreaterThan(0);
  });

  it('saturates outside the representable range with unbounded error', () => {
    const vfsr = 2;
    const top = D.quantize(5, vfsr, 4, 'midrise');
    expect(top).toBeLessThan(1);
    expect(Math.abs(5 - top)).toBeGreaterThan(D.stepSize(vfsr, 4) / 2);
  });

  it('round-trips sign-magnitude codes back to the same level', () => {
    for (const x of [-0.93, -0.4, -0.01, 0.0, 0.2, 0.61, 0.99]) {
      const c = D.signMagCode(x, 2, 4, 'midrise');
      expect(c.bits).toHaveLength(4);
      expect(Number(c.bits[0])).toBe(c.negative ? 1 : 0);
      expect(D.quantize(x, 2, 4, 'midrise')).toBeCloseTo(c.value, 12);
    }
  });

  it('reports SQNR = 6.02n + 1.76 dB for a full-scale sine', () => {
    expect(D.sqnrFullScaleDb(8)).toBeCloseTo(49.926, 2);
    expect(D.sqnrFullScaleDb(16)).toBeCloseTo(98.09, 2);
    // 6.0206 x 12 + 1.7609 = 74.01 dB (not 72 dB — that omits nothing, it is 6.02x12=72.24)
    expect(D.sqnrFullScaleDb(12)).toBeCloseTo(74.01, 2);
    expect(D.dynamicRangeDb(8)).toBeCloseTo(48.16, 2);
  });
});

describe('companding', () => {
  it('μ-law maps the endpoints exactly and is invertible', () => {
    expect(D.muLaw(1, 255)).toBeCloseTo(1, 9);
    expect(D.muLaw(-1, 255)).toBeCloseTo(-1, 9);
    for (const x of [-0.9, -0.3, 0.05, 0.5, 0.87]) {
      expect(D.muLawInverse(D.muLaw(x, 255), 255)).toBeCloseTo(x, 9);
    }
  });

  it('μ-law gives a large gain to small amplitudes', () => {
    const gainDb = 20 * Math.log10(D.muLaw(0.1, 255) / 0.1);
    expect(gainDb).toBeGreaterThan(14);
    expect(gainDb).toBeLessThan(17);
  });

  it('μ-law with μ = 0 reduces to linear', () => {
    expect(D.muLaw(0.4, 0)).toBeCloseTo(0.4, 9);
  });

  it('A-law is linear inside |x| < 1/A and monotone overall', () => {
    // The linear segment is |x| < 1/A ≈ 0.0114 — not 1/16, where the log branch
    // has already taken over.
    const A = 87.7;
    expect(D.aLaw(1 / (2 * A))).toBeCloseTo(1 / 2, 9);
    expect(D.aLaw(1)).toBeCloseTo(1, 9);
    // Above the breakpoint it follows the logarithm.
    expect(D.aLaw(0.5)).toBeCloseTo((1 + Math.log(A * 0.5)) / (1 + Math.log(A)), 9);
    let prev = -1;
    for (let x = 0; x <= 1; x += 0.02) {
      const v = D.aLaw(x);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = v;
    }
  });
});

describe('delta modulation', () => {
  it('emits exactly one bit per sample', () => {
    const r = D.deltaModulate((t) => Math.sin(2 * Math.PI * t), 100, 1, 0.1);
    expect(r.bits).toHaveLength(r.recon.length);
    expect(r.bits.length).toBe(101);
    expect(r.bits.every((b) => b === 0 || b === 1)).toBe(true);
  });

  it('changes the staircase by exactly one step per sample', () => {
    const step = 0.25;
    const r = D.deltaModulate((t) => Math.sin(2 * Math.PI * t), 50, 1, step);
    for (let i = 1; i < r.recon.length; i++) {
      const delta = r.recon[i]! - r.recon[i - 1]!;
      expect(Math.abs(Math.abs(delta) - step)).toBeLessThan(1e-9);
    }
  });

  it('tracks a sine accurately when the step clears the slope limit', () => {
    const fin = 1;
    const amp = 1;
    const fs = 200;
    const step = (2 * Math.PI * amp * fin) / fs * 1.2;
    const r = D.deltaModulate((t) => amp * Math.sin(2 * Math.PI * fin * t), fs, 1, step);
    expect(r.rmsError).toBeLessThan(step * 1.5);
  });

  it('reports slope overload when the step is too small', () => {
    const fin = 8;
    const amp = 1;
    const fs = 40;
    const tooSmall = ((2 * Math.PI * amp * fin) / fs) / 4;
    const r = D.deltaModulate((t) => amp * Math.sin(2 * Math.PI * fin * t), fs, 1, tooSmall);
    expect(r.overloadSamples).toBeGreaterThan(0);
  });

  it('is deterministic for identical inputs', () => {
    const a = D.deltaModulate((t) => Math.sin(t), 80, 1, 0.2);
    const b = D.deltaModulate((t) => Math.sin(t), 80, 1, 0.2);
    expect(a.bits).toEqual(b.bits);
  });
});

describe('sigma-delta', () => {
  it('produces a balanced bitstream and improves with oversampling', () => {
    const sig = (t: number) => 0.8 * Math.sin(2 * Math.PI * t);
    const low = D.sigmaDeltaModulate(sig, 8, 1, 8);
    const high = D.sigmaDeltaModulate(sig, 8, 1, 64);
    expect(high.bits.length).toBeGreaterThan(low.bits.length * 4);

    // Noise shaping is the whole point: each doubling of the oversampling
    // ratio must push in-band noise down by roughly another factor of two in
    // power. Sweep the ratio and require a monotonic fall.
    const powers = [8, 16, 32, 64, 128].map((osr) => D.sigmaDeltaModulate(sig, 8, 1, osr).inBandNoisePower);
    for (let i = 1; i < powers.length; i++) {
      expect(powers[i]!, `${[8, 16, 32, 64, 128][i]}x`).toBeLessThan(powers[i - 1]!);
    }
    // 16 doublings of OSR from 8x to 128x: noise power must fall by far more
    // than the naive 16x, because the quantisation noise is pushed out of band.
    expect(powers[0]! / powers[4]!).toBeGreaterThan(20);
    expect(high.inBandNoisePower).toBeLessThan(low.inBandNoisePower);
  });

  it('decimates back to roughly the baseband rate', () => {
    const r = D.sigmaDeltaModulate((t) => Math.sin(2 * Math.PI * t), 8, 0.25, 16);
    expect(r.decimated.length).toBeLessThanOrEqual(Math.ceil(0.25 * 16));
    // Timestamps must span the record rather than starting at zero.
    expect(r.decimatedT[0]).toBeGreaterThan(0);
    expect(r.decimatedT.at(-1)!).toBeLessThanOrEqual(0.25);
  });
});

describe('constellations', () => {
  it('builds square QAM with Gray labels and log2(M) bits per symbol', () => {
    const c = D.squareQamConstellation(16)!;
    expect(c.points).toHaveLength(16);
    expect(c.k).toBe(4);
    expect(new Set(c.points.map((p) => p.bits)).size).toBe(16);
    for (const p of c.points) expect(p.bits).toHaveLength(4);
  });

  it('refuses non-square orders rather than mislabelling them', () => {
    // 8, 32 and 128 are cross-QAM — not a square grid.
    expect(D.squareQamConstellation(8)).toBeNull();
    expect(D.squareQamConstellation(32)).toBeNull();
    expect(D.squareQamConstellation(128)).toBeNull();
  });

  it('produces PSK constellations on a circle', () => {
    const c = D.pskConstellation(8);
    expect(c.points).toHaveLength(8);
    expect(c.k).toBe(3);
    for (const p of c.points) {
      expect(Math.hypot(p.normI, p.normQ)).toBeCloseTo(1, 9);
    }
  });

  it('labels neighbours so they differ by one bit (Gray coding)', () => {
    const c = D.squareQamConstellation(16)!;
    const bits = (s: string) => s.split('').map(Number);
    const hamming = (a: string, b: string) =>
      bits(a).reduce((n, bit, i) => n + (bit !== bits(b)[i] ? 1 : 0), 0);
    // Every axis-aligned nearest-neighbour pair on the 4x4 grid must differ by 1.
    for (const p of c.points) {
      for (const q of c.points) {
        if (p === q) continue;
        const dist = Math.hypot(p.normI - q.normI, p.normQ - q.normQ);
        if (Math.abs(dist - 2 / 3) < 1e-6) {
          expect(hamming(p.bits, q.bits)).toBe(1);
        }
      }
    }
  });

  it('recovers the nearest point under noise', () => {
    const c = D.squareQamConstellation(16)!;
    const p = c.points.find((x) => x.bits === '1111')!;
    const d = D.nearestConstellationPoint(c, p.normI + 0.01, p.normQ - 0.01);
    expect(d.bits).toBe('1111');
  });
});

describe('passband waveforms', () => {
  it('holds symbol duration at exactly 1/Rs', () => {
    const rs = 4;
    const bits = '10110';
    const w = D.modulateBits('ASK', bits, rs, 20, {});
    expect(w.duration).toBeCloseTo(bits.length / rs, 9);
    expect(w.symbolIndex.at(-1)).toBe(bits.length - 1);
  });

  it('switches FSK between the two supplied tones', () => {
    const w = D.modulateBits('FSK', '1010', 2, 20, { f0: 10, f1: 30 });
    // Zero crossings per second give a good frequency estimate.
    let crossings = 0;
    for (let i = 1; i < w.y.length; i++) {
      if (w.y[i - 1]! <= 0 && w.y[i]! > 0) crossings++;
    }
    const measured = crossings / w.duration;
    expect(measured).toBeGreaterThan(8);
    expect(measured).toBeLessThan(32);
  });

  it('produces antipodal BPSK symbols', () => {
    const w = D.modulateBits('BPSK', '10', 2, 8, {});
    const first = w.y[0]!;
    const second = w.y[Math.floor(w.y.length / 2)]!;
    expect(Math.sign(first)).not.toBe(Math.sign(second));
  });
});

describe('spread spectrum', () => {
  it('spreads each data bit into exactly chipRate chips', () => {
    const r = D.dsssSpread('101', '1010');
    expect(r.chipRate).toBe(4);
    expect(r.t.length).toBe(r.spread.length);
    expect(r.spread.some((v) => v !== 0)).toBe(true);
  });

  it('hops within the channel set', () => {
    const r = D.fhssTransmit('11010', 8, 1000, 500);
    expect(new Set(r.hop).size).toBeGreaterThan(1);
    for (const h of r.hop) expect(h).toBeLessThan(8);
  });
});

describe('OFDM', () => {
  it('is orthogonal only against a different subcarrier', () => {
    expect(D.ofdmOrthogonalityIntegral(3, 3)).toBeCloseTo(0.5, 9);
    expect(D.ofdmOrthogonalityIntegral(3, 7)).toBe(0);
  });

  it('sums subcarriers into a finite symbol', () => {
    const r = D.ofdmFromBits('1101001011110001', 4);
    expect(r.subcarriers).toHaveLength(4);
    expect(r.y.every((v) => Number.isFinite(v))).toBe(true);
  });
});

describe('CRC over GF(2)', () => {
  it('divides 1101 / 1011 over GF(2) to remainder 001', () => {
    // Polynomial division over GF(2) is not integer division; hand-verified:
    //   (x^6+x^5+x^3) ÷ (x^3+x+1)  →  R = 1  = 001
    const r = D.crcCompute('1101', '1011');
    expect(r.remainder).toBe('001');
    expect(r.codeword).toBe('1101001');
    expect(r.generatorValue).toBe(0b1011);
    // …and the codeword is exactly divisible, which is the whole point.
    expect(D.crcCheck(r.codeword, '1011')).toBe(true);
  });

  it('passes its own check', () => {
    const r = D.crcCompute('101100111', '1001');
    expect(D.crcCheck(r.codeword, '1001')).toBe(true);
  });

  it('detects a single-bit error', () => {
    const r = D.crcCompute('1101', '1011');
    const bad = `${r.codeword[0] === '1' ? '0' : '1'}${r.codeword.slice(1)}`;
    expect(D.crcCheck(bad, '1011')).toBe(false);
  });

  it('does not claim detection of an arbitrary multi-bit pattern', () => {
    // CRC is documented as detecting *classes* of error, not every pattern.
    // This test pins that limitation: a single flip is always caught…
    const r = D.crcCompute('1101001010111100', '1001');
    for (let i = 0; i < r.codeword.length; i++) {
      const a = r.codeword.split('');
      a[i] = a[i] === '1' ? '0' : '1';
      expect(D.crcCheck(a.join(''), '1001')).toBe(false);
    }
  });
});

describe('Hamming(7,4)', () => {
  it('encodes 1010 to the expected codeword', () => {
    // [p1 p2 d1 p4 d2 d3 d4] with p1=p2=p4 computed over {1,3,5},{1,3,6},{1,5,6,7}
    expect(D.hamming74Encode('1010')).toBe('1011010');
    expect(D.hamming74Encode('0000')).toBe('0000000');
  });

  it('reports a zero syndrome for an uncorrupted codeword', () => {
    for (const d of ['0000', '1111', '1010', '0110', '1001']) {
      const cw = D.hamming74Encode(d);
      expect(D.hamming74Syndrome(cw).position).toBe(0);
    }
  });

  it('identifies and corrects every single-bit error', () => {
    const cw = D.hamming74Encode('1101');
    for (let pos = 1; pos <= 7; pos++) {
      const arr = cw.split('').map(Number);
      arr[pos - 1] = arr[pos - 1]! ^ 1;
      const received = arr.join('');
      const s = D.hamming74Syndrome(received);
      expect(s.position).toBe(pos);
      expect(D.hamming74Correct(received, s.position)).toBe(cw);
    }
  });

  it('has minimum distance 3 over the whole codebook', () => {
    const cw = ['0000', '1111', '1010', '0110', '1001', '1100', '0011', '0101'].map(D.hamming74Encode);
    let min = Infinity;
    for (let i = 0; i < cw.length; i++) {
      for (let j = i + 1; j < cw.length; j++) min = Math.min(min, D.hammingDistance(cw[i]!, cw[j]!));
    }
    expect(min).toBe(3);
  });
});

describe('parity and checksums', () => {
  it('forces an even or odd number of ones', () => {
    expect(D.parityBit('1011001', 'even')).toBe(0); // 4 ones
    expect(D.parityBit('1011001', 'odd')).toBe(1);
    expect(D.parityBit('1111', 'even')).toBe(0);
    expect(D.parityBit('111', 'even')).toBe(1);
  });

  it('misses every even number of bit flips', () => {
    const codeword = '10110010';
    const flip = (s: string, positions: number[]) => {
      const a = s.split('');
      for (const p of positions) a[p] = a[p] === '1' ? '0' : '1';
      return a.join('');
    };
    // A single flip is always detected by even parity.
    const flipped = flip(codeword, [0]).slice(0, 7);
    expect(D.parityBit(flipped, 'even')).not.toBe(D.parityBit(codeword.slice(0, 7), 'even'));
    // Two flips cancel out, so the parity bit is unchanged.
    expect(D.parityBit(flip(codeword, [0, 1]).slice(0, 7), 'even')).toBe(D.parityBit(codeword.slice(0, 7), 'even'));
  });
});

describe('calculations: reported engineering results', () => {
  it('converts power ratios with a factor of 10', () => {
    expect(C.snrDb(1.2e-3, 3e-6)).toBeCloseTo(26.02, 2);
    expect(C.snrDb(1, 1)).toBeCloseTo(0, 9);
    expect(C.snrFromDb(26.02)).toBeCloseTo(400, 0);
  });

  it('applies the AM power law P_T = P_C(1 + m²/2)', () => {
    expect(D.amTotalPower(500, 0)).toBe(500);
    expect(D.amTotalPower(500, 1)).toBe(750);
    expect(D.amTotalPower(400, 0.8)).toBeCloseTo(528, 6);
    const b = C.amPowerBreakdown(500, 1);
    expect(b.sidebands).toBeCloseTo(250, 9);
    expect(b.efficiency).toBeCloseTo(2 / 3, 9);
  });

  it("applies Carson's rule as an estimate", () => {
    expect(D.carsonBandwidth(75000, 15000)).toBe(180000);
    expect(C.fmBandwidth(75000, 15000).beta).toBeCloseTo(5, 9);
    expect(C.fmBandwidth(75000, 15000).classification).toBe('wideband FM');
  });

  it('puts the image above the signal for high-side injection', () => {
    const p = C.superhetPlan(100, 10.7, 'high');
    expect(p.lo).toBeCloseTo(110.7, 9);
    expect(p.image).toBeCloseTo(121.4, 9);
    expect(Math.abs(p.image - p.lo)).toBeCloseTo(10.7, 9);
    const low = C.superhetPlan(100, 10.7, 'low');
    expect(low.image).toBeCloseTo(78.6, 9);
  });

  it('derives code capability from Hamming distance', () => {
    expect(C.hammingCapability(3)).toEqual({ correctable: 1, detectable: 2 });
    expect(C.hammingCapability(4)).toEqual({ correctable: 1, detectable: 3 });
    expect(C.hammingCapability(7)).toEqual({ correctable: 3, detectable: 6 });
  });

  it('computes interleaver separation', () => {
    expect(C.interleaveSeparation(24, 4)).toBe(6);
    expect(C.interleaveSeparation(6, 3)).toBe(2);
    expect(C.interleaveSeparation(6, 0)).toBe(0);
  });

  it('gives a Wilson interval that contains the observed proportion', () => {
    const ci = C.wilsonInterval(5, 20000);
    expect(ci.low).toBeLessThan(5 / 20000);
    expect(ci.high).toBeGreaterThan(5 / 20000);
    expect(C.wilsonInterval(0, 0)).toEqual({ low: 0, high: 1 });
  });

  it('orders BER references correctly at 10 dB Eb/N0', () => {
    const ebn0 = 10;
    expect(C.theoreticalBerBpsk(ebn0)).toBeLessThan(C.theoreticalBerBfsk(ebn0));
    expect(C.theoreticalBerBfsk(ebn0)).toBeLessThan(C.theoreticalBerNcBfsk(ebn0));
  });

  it('measures empirical BER from a bit pair', () => {
    expect(C.empiricalBer('1010', '1011')).toEqual({ errors: 1, total: 4, ber: 0.25 });
    expect(C.empiricalBer('1010', '1010').ber).toBe(0);
  });

  it('uses the raised-cosine bandwidth convention', () => {
    expect(C.occupiedBandwidth(2400, 0)).toBe(2400);
    expect(C.occupiedBandwidth(2400, 0.35)).toBeCloseTo(3240, 9);
  });
});

describe('Gaussian Q function', () => {
  it('matches known values', () => {
    expect(D.qFunction(0)).toBeCloseTo(0.5, 4);
    expect(D.qFunction(1)).toBeCloseTo(0.1587, 3);
    expect(D.qFunction(3)).toBeCloseTo(0.00135, 4);
    expect(D.qFunction(-1)).toBeCloseTo(1 - 0.1587, 3);
  });
});

describe('deterministic pseudo-randomness', () => {
  it('reproduces identical sequences from identical seeds', () => {
    const a = D.createRng(12345);
    const b = D.createRng(12345);
    const c = D.createRng(54321);
    const seqA = Array.from({ length: 8 }, a);
    const seqB = Array.from({ length: 8 }, b);
    const seqC = Array.from({ length: 8 }, c);
    expect(seqA).toEqual(seqB);
    expect(seqA).not.toEqual(seqC);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
  });

  it('generates standard-normal samples', () => {
    const rand = D.createRng(7);
    const s = Array.from({ length: 4000 }, () => D.gaussian(rand));
    expect(close(D.mean(s), 0, 0.08)).toBe(true);
    expect(close(D.stdev(s), 1, 0.08)).toBe(true);
  });
});