import type { Formula } from '@/types';

/**
 * Searchable formula reference. Each entry carries its own assumptions and a
 * worked example, because the assumptions are what stop these relationships
 * from being mistaken for universal laws.
 */
export const formulas: Formula[] = [
  /* ---------------------------------------------- Module 1 */
  {
    id: 'nyquist',
    module: 1,
    name: 'Nyquist sampling condition',
    tex: 'f_s \\;\\geq\\; 2 f_{max} \\;\\equiv\\; 2 f_a',
    plain: 'fs >= 2*fmax  (= 2*fa)',
    vars: [
      { symbol: 'f_s', meaning: 'sampling frequency', unit: 'samples/s (Hz)' },
      { symbol: 'f_max', meaning: 'highest frequency component present in the input', unit: 'Hz' },
      { symbol: 'f_a', meaning: 'highest message (analogue) frequency', unit: 'Hz' },
    ],
    assumptions:
      'The input must be strictly band-limited to f_max by an ideal anti-aliasing filter, and reconstruction uses an impulse train of infinite duration. Real systems sample well above 2·f_max and use a steep, non-ideal filter.',
    example: {
      question: 'A voice signal is band-limited to 3.4 kHz. What is the minimum sampling rate, and what is used in practice?',
      steps: ['f_max = 3400 Hz', 'f_s(min) = 2 × 3400 = 6800 samples/s', 'In practice sample at 8000 samples/s, the telephony rate, so the filter transition band fits in the guard margin'],
      answer: '6800 samples/s minimum; 8000 samples/s is the standard telephony choice.',
    },
    tags: ['sampling', 'nyquist', 'theorem'],
    relatedLessons: ['m1-sampling', 'm1-aliasing'],
  },
  {
    id: 'nyquist-freq',
    module: 1,
    name: 'Nyquist frequency',
    tex: 'f_N \\;=\\; \\frac{f_s}{2}',
    plain: 'fN = fs / 2',
    vars: [
      { symbol: 'f_N', meaning: 'Nyquist frequency — half the sampling rate; content above it aliases', unit: 'Hz' },
      { symbol: 'f_s', meaning: 'sampling frequency', unit: 'Hz' },
    ],
    assumptions:
      'Meaningful only for an ideal sampler. Any input component above f_N folds down into the baseband and is indistinguishable from a genuine lower-frequency component.',
    example: {
      question: 'f_s = 8000 Hz. What is the Nyquist frequency?',
      steps: ['f_N = 8000 / 2 = 4000 Hz', 'A 3.4 kHz voice signal sits below 4 kHz, which is why 8 kHz sampling works'],
      answer: '4000 Hz',
    },
    tags: ['sampling', 'nyquist'],
    relatedLessons: ['m1-sampling', 'm1-aliasing'],
  },
  {
    id: 'snr-db',
    module: 1,
    name: 'SNR in decibels (power ratio)',
    tex: '\\mathrm{SNR}_{dB} \\;=\\; 10 \\log_{10}\\!\\left(\\frac{P_s}{P_n}\\right)',
    plain: 'SNR_dB = 10*log10(Ps / Pn)',
    vars: [
      { symbol: 'SNR_dB', meaning: 'signal-to-noise ratio, power basis', unit: 'dB' },
      { symbol: 'P_s', meaning: 'wanted signal power', unit: 'W' },
      { symbol: 'P_n', meaning: 'noise power', unit: 'W' },
    ],
    assumptions:
      'This is a power ratio, hence the factor of 10. If you work with amplitude or RMS values use 20·log₁₀ — mixing the two is the most common SNR error in this field. Signal and noise must be measured over the same bandwidth.',
    example: {
      question: 'Signal power is 1.2 mW and noise power is 3.0 µW. Find the SNR in dB.',
      steps: ['P_s/P_n = 1.2e-3 / 3.0e-6 = 400', 'SNR_dB = 10·log₁₀(400) = 26.02 dB'],
      answer: '26.0 dB',
    },
    tags: ['snr', 'db', 'noise'],
    relatedLessons: ['m1-snr-ber', 'm1-digital-vs-analog'],
  },
  {
    id: 'ber',
    module: 1,
    name: 'Bit error rate',
    tex: '\\mathrm{BER} \\;=\\; \\frac{N_{error}}{N_{total}}',
    plain: 'BER = N_error / N_total',
    vars: [
      { symbol: 'BER', meaning: 'measured (empirical) bit error rate', unit: 'dimensionless (0…1)' },
      { symbol: 'N_error', meaning: 'bits decided incorrectly', unit: 'bits' },
      { symbol: 'N_total', meaning: 'bits transmitted', unit: 'bits' },
    ],
    assumptions:
      'An empirical figure for one specific run. With a few thousand bits the sample is noisy: 5 errors in 20 000 bits (1.6 × 10⁻⁴) is consistent with a true BER anywhere in roughly 6 × 10⁻⁵ … 9 × 10⁻⁴. Never quote a short run as a theoretical value.',
    example: {
      question: '25 000 bits are sent and 4 are received incorrectly.',
      steps: ['BER = 4 / 25000', 'BER = 0.00016 = 1.6 × 10⁻⁴'],
      answer: '1.6 × 10⁻⁴ — about one error in 6250 bits.',
    },
    tags: ['ber', 'errors'],
    relatedLessons: ['m1-snr-ber'],
  },
  {
    id: 'ber-bpsk',
    module: 1,
    name: 'BER of coherent BPSK in AWGN',
    tex: '\\mathrm{BER} \\;=\\; Q\\!\\left(\\sqrt{2\\,\\frac{E_b}{N_0}}\\right)',
    plain: 'BER_BPSK = Q(sqrt(2*Eb/N0))',
    vars: [
      { symbol: 'E_b', meaning: 'energy per bit', unit: 'J' },
      { symbol: 'N_0', meaning: 'one-sided noise power spectral density × noise bandwidth', unit: 'J' },
      { symbol: 'Q(x)', meaning: 'Gaussian tail probability, Q(x) = ½·erfc(x/√2)', unit: '—' },
    ],
    assumptions:
      'Additive white Gaussian noise, ideal coherent detection and exactly antipodal signals. Changing modulation, adding coding or switching to non-coherent detection changes this result completely — it is not a universal BER law.',
    example: {
      question: 'E_b/N_0 = 9.6 dB. Estimate the BPSK BER.',
      steps: ['E_b/N_0 = 10^(9.6/10) = 9.12', '√(2 × 9.12) = 4.27', 'Q(4.27) ≈ 9.8 × 10⁻⁶'],
      answer: '≈ 9.8 × 10⁻⁶',
    },
    tags: ['ber', 'psk', 'awgn'],
    relatedLessons: ['m1-snr-ber', 'm4-psk'],
  },
  {
    id: 'repeater-spacing',
    module: 1,
    name: 'Digital repeater spacing versus analogue',
    tex: 'N_{\\max} \\approx \\frac{\\mathrm{SNR}_{dB,\\text{allowed}} - \\mathrm{SNR}_{dB,\\text{per km}}\\,(N-1)}{\\mathrm{SNR}_{dB,\\text{per km}}}',
    plain: 'linear in dB: each repeater restores SNR_dB to a fixed value',
    vars: [
      { symbol: 'N_max', meaning: 'number of repeater spans before the SNR budget is exhausted', unit: 'spans' },
      { symbol: 'SNR_dB per km', meaning: 'loss of SNR accumulated over one span', unit: 'dB/km' },
    ],
    assumptions:
      'A qualitative budget argument rather than a closed design law: in an analogue link noise accumulates linearly in power, while in a digital link each regenerator resets the noise, so span length can be chosen from the SNR budget alone rather than from accumulated noise.',
    example: {
      question: 'Why can a digital link use longer spans than an analogue link?',
      steps: ['Analogue: noise power adds at every amplifier, so SNR degrades along the link', 'Digital: the repeater re-decides the symbol and re-emits a clean level, so noise does not accumulate', 'Span length becomes an SNR-budget problem rather than an accumulation problem'],
      answer: 'Regeneration removes accumulated noise, so digital spans are governed by the SNR budget, not by cumulative noise.',
    },
    tags: ['regeneration', 'repeater'],
    relatedLessons: ['m1-digital-vs-analog'],
  },

  /* ---------------------------------------------- Module 2 */
  {
    id: 'levels',
    module: 2,
    name: 'Number of quantisation levels',
    tex: 'L \\;=\\; 2^{n}',
    plain: 'L = 2^n',
    vars: [
      { symbol: 'L', meaning: 'number of distinct quantiser output levels', unit: 'levels' },
      { symbol: 'n', meaning: 'number of bits used per sample', unit: 'bits' },
    ],
    assumptions: 'A uniform binary encoder, in which each level is addressed by a unique n-bit word. This describes linear PCM before any companding is applied.',
    example: {
      question: 'How many levels does an 8-bit uniform quantiser have?',
      steps: ['L = 2^8 = 256'],
      answer: '256 levels',
    },
    tags: ['quantisation', 'pcm', 'levels'],
    relatedLessons: ['m2-quantization', 'm2-coding'],
  },
  {
    id: 'vlsb',
    module: 2,
    name: 'Quantiser step size (resolution)',
    tex: 'V_{LSB} \\;=\\; \\frac{V_{FSR}}{2^{n}} \\;\\equiv\\; \\frac{V_{FSR}}{L}',
    plain: 'V_LSB = V_FSR / 2^n  =  V_FSR / L',
    vars: [
      { symbol: 'V_LSB', meaning: 'step size — the smallest amplitude change the quantiser can represent', unit: 'V' },
      { symbol: 'V_FSR', meaning: 'full-scale input range (span between the negative and positive clipping limits)', unit: 'V' },
      { symbol: 'n', meaning: 'bit depth', unit: 'bits' },
    ],
    assumptions:
      'The "step = range / number of levels" convention, consistent with L = 2^n levels addressing the whole range. Some texts use V_FSR/(2^n − 1); the difference is small but state which you use. For a bipolar signal V_FSR = 2·V_pk.',
    example: {
      question: 'A bipolar ADC has a ±5 V input range and 12 bits. What is its step size?',
      steps: ['V_FSR = 5 − (−5) = 10 V', '2^12 = 4096', 'V_LSB = 10 / 4096 = 2.441 mV'],
      answer: '2.44 mV per LSB',
    },
    tags: ['quantisation', 'resolution', 'adc'],
    relatedLessons: ['m2-quantization', 'm2-chain'],
  },
  {
    id: 'quant-error',
    module: 2,
    name: 'Maximum quantisation error',
    tex: '\\left|e_q\\right| \\;\\leq\\; \\frac{V_{LSB}}{2}',
    plain: '|eq| <= V_LSB / 2',
    vars: [
      { symbol: 'e_q', meaning: 'difference between the input sample and the nearest output level', unit: 'V' },
      { symbol: 'V_LSB', meaning: 'step size', unit: 'V' },
    ],
    assumptions:
      'Uniform quantisation, input inside the representable range, rounding to the nearest level. Outside the range the error grows without bound (saturation). With truncation toward the next lower level the bound is V_LSB instead of V_LSB/2.',
    example: {
      question: 'With V_LSB = 2.441 mV, what is the largest possible quantisation error?',
      steps: ['|e_q|max = 2.441 / 2 = 1.221 mV'],
      answer: '1.22 mV',
    },
    tags: ['quantisation', 'error'],
    relatedLessons: ['m2-quantization'],
  },
  {
    id: 'sqnr',
    module: 2,
    name: 'SQNR of a full-scale sinusoid (uniform quantiser)',
    tex: '\\mathrm{SQNR}_{dB} \\;\\approx\\; 6.02\\,n \\;+\\; 1.76',
    plain: 'SQNR_dB ≈ 6.02*n + 1.76',
    vars: [
      { symbol: 'SQNR_dB', meaning: 'signal-to-quantisation-noise ratio', unit: 'dB' },
      { symbol: 'n', meaning: 'bit depth', unit: 'bits' },
    ],
    assumptions:
      'Uniform quantisation, a full-scale sine (peak = V_FSR/2) and the "step = range/L" convention. The bare 6.02·n dB figure is the dynamic-range rule of thumb — 20·log₁₀(2^n) — and the +1.76 dB offset only appears in the sine-wave SQNR definition. Dropping the peak to half scale costs about 6 dB.',
    example: {
      question: 'Find the SQNR for n = 10.',
      steps: ['SQNR = 6.02 × 10 + 1.76 = 61.96 dB'],
      answer: '≈ 62.0 dB',
    },
    tags: ['sqnr', 'quantisation'],
    relatedLessons: ['m2-quantization', 'm2-nonlinear'],
  },
  {
    id: 'dynamic-range',
    module: 2,
    name: 'Dynamic range from bit depth',
    tex: 'D_R \\;=\\; 20 \\log_{10} L \\;=\\; 6.02\\,n \\quad [\\mathrm{dB}]',
    plain: 'DR = 20*log10(L) = 6.02*n  [dB]',
    vars: [
      { symbol: 'D_R', meaning: 'dynamic range — ratio of the largest representable magnitude to the smallest step', unit: 'dB' },
      { symbol: 'L', meaning: 'number of levels, 2^n', unit: '—' },
      { symbol: 'n', meaning: 'bit depth', unit: 'bits' },
    ],
    assumptions:
      'A range ratio, not a signal-to-noise ratio. Keep "6.02·n dB of dynamic range" distinct from the "6.02n + 1.76 dB sine-wave SQNR".',
    example: {
      question: 'n = 12.',
      steps: ['D_R = 6.02 × 12 = 72.2 dB'],
      answer: '72.2 dB',
    },
    tags: ['dynamic range', 'bits'],
    relatedLessons: ['m2-quantization', 'm2-nonlinear'],
  },
  {
    id: 'mulaw',
    module: 2,
    name: 'μ-law compression characteristic',
    tex: 'F_{\\mu}(x) \\;=\\; \\operatorname{sgn}(x)\\,\\frac{\\ln\\!\\left(1+\\mu |x|\\right)}{\\ln\\!\\left(1+\\mu\\right)}',
    plain: 'F_mu(x) = sign(x) * ln(1 + mu*|x|) / ln(1 + mu)',
    vars: [
      { symbol: 'F_μ(x)', meaning: 'compressed amplitude, normalised to [−1, +1]', unit: 'normalised' },
      { symbol: 'x', meaning: 'input amplitude, normalised to [−1, +1]', unit: 'normalised' },
      { symbol: 'μ', meaning: 'companding parameter; ITU-T G.711 uses μ = 255', unit: 'dimensionless' },
    ],
    assumptions:
      'A continuous, monotone law whose endpoints map exactly onto ±1, so compressor and expander are exact inverses. The law is symmetric about zero; larger μ concentrates more resolution near zero at the cost of coarser steps at full scale.',
    example: {
      question: 'For μ = 255, what is the output for x = 0.1?',
      steps: ['ln(1 + 255 × 0.1) = ln(26.5) = 3.277', 'ln(256) = 5.545', 'F = 3.277 / 5.545 = 0.591', 'That is 20·log₁₀(0.591 / 0.1) ≈ +15.4 dB of gain for small signals'],
      answer: '0.591 normalised (≈ +15.4 dB of low-level gain)',
    },
    tags: ['companding', 'mu-law', 'g711'],
    relatedLessons: ['m2-nonlinear', 'm2-companding-impl'],
  },
  {
    id: 'alaw',
    module: 2,
    name: 'A-law compression characteristic',
    tex: 'A(x)=\\begin{cases} A\\,x, & |x| < \\tfrac{1}{A} \\\\ \\dfrac{1+\\ln\\!\\left(A|x|\\right)}{1+\\ln A}, & |x| \\ge \\tfrac{1}{A} \\end{cases}',
    plain: 'A(x) = A*x for |x| < 1/A, else (1 + ln(A*|x|))/(1 + ln(A))',
    vars: [
      { symbol: 'A', meaning: 'slope of the linear segment; A = 87.7 for ITU-T G.711 A-law', unit: 'dimensionless' },
      { symbol: 'x', meaning: 'input amplitude normalised to [−1, +1]', unit: 'normalised' },
    ],
    assumptions:
      'Piecewise: a linear region within ±1/A (≈ ±0.0114 full scale) giving good absolute resolution near zero, then logarithmic compression out to ±1. A-law deliberately overshoots the maximum slightly so that G.711\'s 13-bit segment range fully covers the 12-bit linear input range.',
    example: {
      question: 'A = 87.7, x = 0.5.',
      steps: ['|x| = 0.5 > 1/A = 0.0114, so use the log branch', 'ln(87.7 × 0.5) = 3.781', '1 + ln(87.7) = 5.473', 'A(0.5) = (1 + 3.781) / 5.473 = 0.873'],
      answer: '0.873 normalised',
    },
    tags: ['companding', 'a-law', 'g711'],
    relatedLessons: ['m2-nonlinear', 'm2-companding-impl'],
  },
  {
    id: 'dpcm',
    module: 2,
    name: 'DPCM prediction error and reconstruction',
    tex: 'e_n = x_n - \\hat{x}_n \\quad ; \\quad \\hat{x}_n = \\hat{x}_{n-1} + \\tilde{e}_n',
    plain: 'en = xn - xhatn ;  xhatn = xhat(n-1) + e_tilde_n',
    vars: [
      { symbol: 'e_n', meaning: 'prediction error that is quantised and transmitted', unit: 'V' },
      { symbol: 'x_n', meaning: 'original sample', unit: 'V' },
      { symbol: 'x̂_n', meaning: 'encoder predictor estimate of x_n', unit: 'V' },
      { symbol: 'ẽ_n', meaning: 'error after quantisation — what the decoder receives', unit: 'V' },
    ],
    assumptions:
      'Encoder and decoder use identical predictors driven by the same reconstructed history, so their states stay in step. This closed-loop construction is what prevents drift. The gain comes from the error signal occupying a far smaller dynamic range than the samples themselves.',
    example: {
      question: 'True error 0.8 mV, step 0.5 mV, round to nearest.',
      steps: ['code = round(0.8 / 0.5) = 2', 'ẽ = 2 × 0.5 = 1.0 mV', 'x̂ = x̂(n−1) + 1.0 mV'],
      answer: 'Transmitted error 1.0 mV; reconstruction adds 1.0 mV to the previous estimate.',
    },
    tags: ['dpcm', 'prediction'],
    relatedLessons: ['m2-dpcm'],
  },
  {
    id: 'coding-efficiency',
    module: 2,
    name: 'Percent error and codeword value (sign-magnitude)',
    tex: '\\%\\,\\mathrm{err} = \\frac{x - \\hat{x}}{x}\\times 100\\% , \\qquad \\hat{x} = v_{min} + (n+\\tfrac12)V_{LSB}',
    plain: 'percent error = (x - xhat)/x * 100',
    vars: [
      { symbol: 'x', meaning: 'input sample', unit: 'V' },
      { symbol: 'x̂', meaning: 'reconstructed sample', unit: 'V' },
      { symbol: 'n', meaning: 'level index, 0 … L−1', unit: '—' },
    ],
    assumptions: 'Midrise uniform quantiser with rounding to the nearest level, input inside the full-scale range.',
    example: {
      question: 'x = 0.37 V, V_FSR = 2 V, n = 4 bits (midrise).',
      steps: ['V_LSB = 2/16 = 0.125 V', 'index = round((0.37 + 1)/0.125 − 0.5) = round(10.46) = 10', 'x̂ = −1 + 10.5 × 0.125 = 0.3125 V', '%error = (0.37 − 0.3125)/0.37 = 15.5 %'],
      answer: 'x̂ = 0.3125 V, error 15.5 %',
    },
    tags: ['coding', 'percent error'],
    relatedLessons: ['m2-coding'],
  },

  /* ---------------------------------------------- Module 3 */
  {
    id: 'dm-slope',
    module: 3,
    name: 'Maximum slope a DM staircase can follow',
    tex: '\\left|\\frac{\\Delta x}{\\Delta t}\\right|_{\\max} = \\frac{\\delta}{T_s} = \\delta\\, f_s',
    plain: 'max slope = delta / Ts = delta * fs',
    vars: [
      { symbol: 'δ', meaning: 'DM step size (the quantiser increment)', unit: 'V' },
      { symbol: 'T_s', meaning: 'sampling period', unit: 's' },
      { symbol: 'f_s', meaning: 'sampling frequency', unit: 'samples/s' },
    ],
    assumptions:
      'A one-bit quantiser can change its output by exactly one step per sample, so this is a hard ceiling. "Unit-slope" design chooses δ so that this ceiling exceeds the steepest expected input slope; for a sine of amplitude A that means δ ≥ 2π·A·f_m.',
    example: {
      question: 'A 1 kHz sine of amplitude 2 V sampled at 8 kHz. What δ avoids slope overload?',
      steps: ['max slope = 2π × 2 × 1000 = 12566 V/s', 'δ ≥ 12566 / 8000 = 1.571 V'],
      answer: 'δ ≥ 1.57 V; a practical design uses somewhat more.',
    },
    tags: ['delta modulation', 'slope overload'],
    relatedLessons: ['m3-dm', 'm3-distortion'],
  },
  {
    id: 'dm-sine',
    module: 3,
    name: 'Slope-overload criterion for a sine input',
    tex: '\\delta \\;\\geq\\; \\frac{2\\pi\\, A\\, f_m}{f_s}',
    plain: 'delta >= 2*pi*A*fm / fs',
    vars: [
      { symbol: 'A', meaning: 'peak amplitude of the input', unit: 'V' },
      { symbol: 'f_m', meaning: 'input frequency', unit: 'Hz' },
      { symbol: 'f_s', meaning: 'sampling rate', unit: 'samples/s' },
      { symbol: 'δ', meaning: 'step size', unit: 'V' },
    ],
    assumptions:
      'Applies to a sinusoidal input tracked by a simple one-bit staircase. Exceeding it produces slope overload: the staircase lags systematically, and the error grows in proportion to the input slope instead of staying bounded by δ.',
    example: {
      question: 'A = 1 V, f_m = 500 Hz, f_s = 4000 samples/s.',
      steps: ['2π × 1 × 500 / 4000 = 0.785 V'],
      answer: 'δ ≥ 0.785 V',
    },
    tags: ['delta modulation', 'slope'],
    relatedLessons: ['m3-distortion', 'm3-adaptive'],
  },
  {
    id: 'granular',
    module: 3,
    name: 'Peak granular noise amplitude',
    tex: 'e_{gran} \\;\\leq\\; \\delta',
    plain: 'granular error <= delta',
    vars: [
      { symbol: 'e_gran', meaning: 'tracking error while the input is slow or constant', unit: 'V' },
      { symbol: 'δ', meaning: 'step size', unit: 'V' },
    ],
    assumptions:
      'Granular noise is amplitude-limited, not power-limited: halving δ halves the visible granularity but also halves the slope the staircase can follow, doubling slope-overload risk. This is the central ADM trade-off.',
    example: {
      question: 'δ = 0.1 V, constant input.',
      steps: ['The staircase alternates around the input value', 'Peak error is bounded by 0.1 V'],
      answer: 'Error bounded by ±0.1 V',
    },
    tags: ['granular noise', 'delta modulation'],
    relatedLessons: ['m3-distortion', 'm3-adaptive'],
  },
  {
    id: 'sdm-noise',
    module: 3,
    name: 'First-order ΣΔ quantisation noise shaping',
    tex: 'S_n(f) \\propto \\left|1-e^{-j2\\pi f/F_s}\\right|^{2} \\sim f^{2}',
    plain: 'Sn(f) ∝ |1 - exp(-j2πf/Fs)|² ∝ f²',
    vars: [
      { symbol: 'S_n(f)', meaning: 'quantisation noise PSD after the modulator', unit: 'W/Hz' },
      { symbol: 'f', meaning: 'frequency offset from DC', unit: 'Hz' },
      { symbol: 'F_s', meaning: 'oversampled sampling rate', unit: 'Hz' },
    ],
    assumptions:
      'A first-order loop has noise transfer function (1 − z⁻¹), so noise rises as f² and the band around the signal stays quiet. The in-band integral of an f² spectrum scales as the cube of the filter bandwidth, so doubling the oversampling ratio improves in-band SNR by about 9 dB. Oversampling alone gives only 3 dB per doubling (3·log₁₀ OSR); the shaping supplies the other 6 dB.',
    example: {
      question: 'OSR = 4, first order. How much better than the same rate without shaping?',
      steps: ['Plain oversampling: 3·log₁₀(4) = 1.8 dB', 'Noise shaping adds 6·log₁₀(4) = 3.6 dB', 'Total ≈ 5.4 dB, i.e. 9 dB per doubling of OSR'],
      answer: '≈ 5.4 dB better than a plain quantiser at the same rate',
    },
    tags: ['sigma delta', 'noise shaping', 'oversampling'],
    relatedLessons: ['m3-sigma-delta'],
  },

  /* ---------------------------------------------- Module 4 */
  {
    id: 'bit-baud',
    module: 4,
    name: 'Bit rate from symbol rate',
    tex: 'R_b \\;=\\; R_s \\log_2 M',
    plain: 'Rb = Rs * log2(M)',
    vars: [
      { symbol: 'R_b', meaning: 'bit rate', unit: 'bit/s' },
      { symbol: 'R_s', meaning: 'symbol (baud) rate', unit: 'symbol/s' },
      { symbol: 'M', meaning: 'number of distinct symbols', unit: 'symbols' },
    ],
    assumptions:
      'Valid for a fixed-length mapping where every symbol carries the same number of bits. With non-uniform symbol probabilities (Huffman, constrained codes) the information rate is R_s·H, below R_s·log₂M. Framing, coding and protocol overhead push the payload throughput below R_b.',
    example: {
      question: '16-QAM at 2400 baud.',
      steps: ['log₂16 = 4 bits/symbol', 'R_b = 2400 × 4 = 9600 bit/s'],
      answer: '9600 bit/s',
    },
    tags: ['bit rate', 'baud', 'qam'],
    relatedLessons: ['m4-dac', 'm4-rate'],
  },
  {
    id: 'spectral-efficiency',
    module: 4,
    name: 'Spectral efficiency (idealised)',
    tex: '\\eta \\;=\\; \\frac{R_b}{B} \\;\\leq\\; \\log_2 M',
    plain: 'eta = Rb / B <= log2(M)',
    vars: [
      { symbol: 'η', meaning: 'spectral efficiency', unit: 'bit/s/Hz' },
      { symbol: 'R_b', meaning: 'bit rate', unit: 'bit/s' },
      { symbol: 'B', meaning: 'occupied bandwidth', unit: 'Hz' },
      { symbol: 'M', meaning: 'constellation size', unit: '—' },
    ],
    assumptions:
      'The bound log₂M is the Shannon limit of a noiseless band-limited channel, reached only with Nyquist pulse shaping (α = 0). Any roll-off reduces η, so real systems sit strictly below log₂M. Coding adds redundancy that lowers net efficiency even though it lowers the required E_b/N_0.',
    example: {
      question: '16-QAM with raised-cosine roll-off α = 0.35 at R_b = 9600 bit/s.',
      steps: ['B = (1 + 0.35)·R_b = 12 960 Hz', 'η = 9600 / 12 960 = 0.74 bit/s/Hz'],
      answer: '0.74 bit/s/Hz — well below the 4 bit/s/Hz ceiling for 16-QAM',
    },
    tags: ['spectral efficiency', 'bandwidth'],
    relatedLessons: ['m4-rate', 'm4-qam'],
  },
  {
    id: 'linear-bw',
    module: 4,
    name: 'Occupied bandwidth of linear modulations (raised cosine)',
    tex: 'B \\;=\\; (1+\\alpha)\\,R_s',
    plain: 'B = (1 + alpha) * Rs',
    vars: [
      { symbol: 'B', meaning: 'RF passband width centred on the carrier', unit: 'Hz' },
      { symbol: 'R_s', meaning: 'symbol rate', unit: 'baud' },
      { symbol: 'α', meaning: 'roll-off factor, 0 ≤ α ≤ 1', unit: 'dimensionless' },
    ],
    assumptions:
      'Represents raised-cosine pulse-shaped linear modulation. At α = 0 the main lobe collapses to R_s, which is idealised (an infinitely long pulse). At α = 1 the spectrum doubles in width but has linear phase. Practical receivers use 0.2–0.35 to tolerate some timing error while limiting bandwidth. "Bandwidth = symbol rate" is only the α = 0 limit.',
    example: {
      question: 'QPSK, R_s = 1200 baud, α = 0.35.',
      steps: ['B = 1.35 × 1200 = 1620 Hz'],
      answer: '1620 Hz',
    },
    tags: ['bandwidth', 'ask', 'psk', 'qam', 'rolloff'],
    relatedLessons: ['m4-rate', 'm4-ask', 'm4-fsk'],
  },
  {
    id: 'fsk-bw',
    module: 4,
    name: 'FSK occupied bandwidth (Carson-type approximation)',
    tex: 'B \\;\\approx\\; 2\\!\\left(\\Delta f + \\frac{R_s}{2}\\right)',
    plain: 'B ≈ 2*(df + Rs/2)',
    vars: [
      { symbol: 'B', meaning: 'occupied bandwidth', unit: 'Hz' },
      { symbol: 'Δf', meaning: 'peak deviation from the centre frequency — half the mark–space separation', unit: 'Hz' },
      { symbol: 'R_s', meaning: 'symbol rate', unit: 'baud' },
    ],
    assumptions:
      'The same engineering approximation used for FM, and independent of where in the band the signal sits. The alternative rule "mark–space separation + R_s" is cruder because it ignores the symbol pulse spectrum. Actual FSK bandwidth depends strongly on the modulation index, the deviation and the pulse shaping.',
    example: {
      question: 'BFSK with f_1 = 1300 Hz, f_0 = 1100 Hz, R_s = 300 baud.',
      steps: ['Δf = (1300 − 1100)/2 = 100 Hz', 'B = 2(100 + 150) = 500 Hz'],
      answer: '≈ 500 Hz — about 1.67 × the symbol rate',
    },
    tags: ['fsk', 'bandwidth', 'carson'],
    relatedLessons: ['m4-fsk'],
  },
  {
    id: 'ofdm-spacing',
    module: 4,
    name: 'OFDM subcarrier spacing and orthogonality',
    tex: '\\Delta f = \\frac{1}{T_u} , \\qquad \\int_0^{T_u} \\cos(2\\pi k\\Delta f t)\\cos(2\\pi l\\Delta f t)\\,dt = \\begin{cases} T_u/2 & k=l \\\\ 0 & k\\neq l \\end{cases}',
    plain: 'df = 1/Tu, and the inner product of two subcarriers is 0 unless k == l',
    vars: [
      { symbol: 'Δf', meaning: 'subcarrier spacing', unit: 'Hz' },
      { symbol: 'T_u', meaning: 'useful symbol duration, excluding the cyclic prefix', unit: 's' },
      { symbol: 'k, l', meaning: 'subcarrier indices', unit: '—' },
    ],
    assumptions:
      'Orthogonality relies on sampling exactly at symbol boundaries, or on an FFT receiver which performs the equivalent operation. The cyclic prefix, with T_cp no longer than the channel delay spread, converts linear convolution into circular convolution so one FFT per symbol suffices.',
    example: {
      question: 'T_u = 3.2 µs (a Wi-Fi-style useful symbol).',
      steps: ['Δf = 1 / 3.2e-6 = 312.5 kHz'],
      answer: '312.5 kHz',
    },
    tags: ['ofdm', 'orthogonality'],
    relatedLessons: ['m4-ofdm'],
  },
  {
    id: 'processing-gain',
    module: 4,
    name: 'DSSS processing gain',
    tex: 'G_p \\;=\\; \\frac{B_{SS}}{B_{DS}} \\;\\approx\\; \\frac{R_c}{R_b} = N_{chips}',
    plain: 'Gp = Bss / Bds ≈ Rc / Rb = Nchips',
    vars: [
      { symbol: 'G_p', meaning: 'processing gain (linear)', unit: '— (or dB if 10·log₁₀)' },
      { symbol: 'B_SS', meaning: 'spread bandwidth', unit: 'Hz' },
      { symbol: 'B_DS', meaning: 'unspread data bandwidth', unit: 'Hz' },
      { symbol: 'N_chips', meaning: 'chips per data bit', unit: 'chips/bit' },
    ],
    assumptions:
      'The gain is only free SNR against an interferer whose power is reduced proportionally. Spreading also makes the receiver collect noise power across the wide bandwidth, so the net gain against broadband noise is far below G_p.',
    example: {
      question: '10 chips per bit, chip rate 10 Mchip/s, data rate 1 Mbit/s.',
      steps: ['G_p = 10 Mchip/s / 1 Mbit/s = 10 → 10 dB'],
      answer: '10 (10 dB)',
    },
    tags: ['dsss', 'processing gain'],
    relatedLessons: ['m4-spread'],
  },

  /* ---------------------------------------------- Module 5 */
  {
    id: 'am-index',
    module: 5,
    name: 'AM modulation index (single tone)',
    tex: 'm_a = \\frac{V_m}{V_c} , \\qquad \\%\\,\\mathrm{mod} = 100\\, m_a',
    plain: 'ma = Vm / Vc ; % mod = 100 * ma',
    vars: [
      { symbol: 'm_a', meaning: 'modulation index (0…1 for undistorted AM)', unit: 'dimensionless' },
      { symbol: 'V_m', meaning: 'peak message voltage', unit: 'V' },
      { symbol: 'V_c', meaning: 'peak carrier voltage', unit: 'V' },
    ],
    assumptions:
      'Conventional AM only, with a resistive (envelope-detectable) load so peak carrier voltage relates to carrier power through the usual resistance. m_a > 1 is overmodulation: the envelope crosses zero and the phase reverses, so a diode detector recovers a distorted message.',
    example: {
      question: 'V_m = 0.8 V, V_c = 1.0 V.',
      steps: ['m_a = 0.8 / 1.0 = 0.8', '% modulation = 80 %'],
      answer: 'm_a = 0.8 (80 % modulation)',
    },
    tags: ['am', 'modulation index'],
    relatedLessons: ['m5-am', 'm5-comparison'],
  },
  {
    id: 'am-bandwidth',
    module: 5,
    name: 'AM bandwidth',
    tex: 'B_{AM} \\;=\\; 2 f_{m,max}',
    plain: 'B_AM = 2 * fm_max',
    vars: [
      { symbol: 'B_AM', meaning: 'transmitted bandwidth, upper sideband to lower sideband', unit: 'Hz' },
      { symbol: 'f_m,max', meaning: 'highest frequency in the message signal', unit: 'Hz' },
    ],
    assumptions:
      'True for conventional AM with both sidebands, whatever the modulation index — including m = 0, where the bandwidth is still 2·f_m,max even though no sideband energy exists at all. DSB-SC halves it; SSB quarters it.',
    example: {
      question: 'Voice band-limited to 4 kHz.',
      steps: ['B_AM = 2 × 4000 = 8000 Hz'],
      answer: '8 kHz for AM, 4 kHz for DSB-SC, 2 kHz for SSB',
    },
    tags: ['am', 'bandwidth', 'sideband'],
    relatedLessons: ['m5-am', 'm5-comparison'],
  },
  {
    id: 'am-power',
    module: 5,
    name: 'Total AM transmit power',
    tex: 'P_T = P_C\\left(1 + \\frac{m_a^{2}}{2}\\right)',
    plain: 'PT = PC * (1 + ma^2/2)',
    vars: [
      { symbol: 'P_T', meaning: 'total transmitted power', unit: 'W' },
      { symbol: 'P_C', meaning: 'unmodulated carrier power', unit: 'W' },
      { symbol: 'm_a', meaning: 'modulation index', unit: 'dimensionless' },
    ],
    assumptions:
      'A single-tone message, where total sideband power equals m_a²·P_C/2. At m_a = 1 all the extra power is useful, so full-carrier AM is at best twice as power-efficient as DSB-SC and far worse than SSB — the price of a simple envelope detector.',
    example: {
      question: 'P_C = 500 W at 70 % modulation.',
      steps: ['P_T = 500 × (1 + 0.49/2) = 622.5 W', 'Sidebands carry 122.5 W, the carrier 500 W'],
      answer: '622.5 W total — only 19.7 % of it carries information',
    },
    tags: ['am', 'power'],
    relatedLessons: ['m5-am'],
  },
  {
    id: 'fm-index',
    module: 5,
    name: 'FM modulation index (deviation ratio)',
    tex: '\\beta = \\frac{\\Delta f}{f_m}',
    plain: 'beta = df / fm',
    vars: [
      { symbol: 'β', meaning: 'FM modulation index / deviation ratio', unit: 'dimensionless' },
      { symbol: 'Δf', meaning: 'peak frequency deviation', unit: 'Hz' },
      { symbol: 'f_m', meaning: 'modulating frequency', unit: 'Hz' },
    ],
    assumptions:
      'A single sinusoidal message. β is only a single meaningful number for one tone; a composite message has a different index at each frequency, which is why wideband FM quotes the worst-case deviation divided by the highest modulating frequency.',
    example: {
      question: 'Δf = 75 kHz, f_m = 1.5 kHz.',
      steps: ['β = 75000 / 1500 = 50'],
      answer: 'β = 50 — a wideband FM signal',
    },
    tags: ['fm', 'modulation index'],
    relatedLessons: ['m5-fm', 'm5-comparison'],
  },
  {
    id: 'carson',
    module: 5,
    name: "Carson's rule",
    tex: 'B \\;\\approx\\; 2\\,\\left(\\Delta f + f_{m,max}\\right)',
    plain: 'B ≈ 2*(df + fm_max)',
    vars: [
      { symbol: 'B', meaning: 'bandwidth estimated by Carson\'s rule', unit: 'Hz' },
      { symbol: 'Δf', meaning: 'peak frequency deviation', unit: 'Hz' },
      { symbol: 'f_m,max', meaning: 'highest modulating frequency', unit: 'Hz' },
    ],
    assumptions:
      'A design rule of thumb, not an exact result. An FM signal with a sinusoidal message technically has infinitely many sidebands whose amplitudes are Bessel functions; Carson retains roughly 98 % of the power. As β → ∞ it approaches 2·N·f_m with N significant sideband pairs.',
    example: {
      question: 'Δf = 75 kHz, f_m,max = 15 kHz (broadcast FM).',
      steps: ['B = 2 × (75000 + 15000) = 180 kHz', 'Broadcast FM channels are spaced 200 kHz, consistent with this estimate'],
      answer: '180 kHz',
    },
    tags: ['fm', 'carson', 'bandwidth'],
    relatedLessons: ['m5-fm', 'm5-comparison'],
  },
  {
    id: 'carrier-swing',
    module: 5,
    name: 'Carrier swing',
    tex: 'CS = f_{max} - f_{min} = 2\\,\\Delta f',
    plain: 'CS = fmax - fmin = 2 * df',
    vars: [
      { symbol: 'CS', meaning: 'total swing between the highest and lowest instantaneous frequency', unit: 'Hz' },
      { symbol: 'Δf', meaning: 'peak deviation', unit: 'Hz' },
    ],
    assumptions:
      'An instrument set to peak-programme deviation reads CS/2. Broadcast practice calls a channel fully modulated when Δf = 75 kHz in the 88–108 MHz band.',
    example: { question: 'Δf = 75 kHz.', steps: ['CS = 2 × 75 kHz = 150 kHz'], answer: '150 kHz' },
    tags: ['fm', 'swing'],
    relatedLessons: ['m5-fm'],
  },
  {
    id: 'superhet',
    module: 5,
    name: 'Frequency conversion in a superheterodyne receiver',
    tex: 'f_{IF} = \\left| f_{LO} - f_{RF} \\right|',
    plain: 'fIF = |fLO - fRF|',
    vars: [
      { symbol: 'f_IF', meaning: 'intermediate frequency, fixed for the receiver', unit: 'Hz' },
      { symbol: 'f_LO', meaning: 'local oscillator frequency', unit: 'Hz' },
      { symbol: 'f_RF', meaning: 'incoming radio frequency being received', unit: 'Hz' },
    ],
    assumptions:
      'High-side injection means f_LO = f_RF + f_IF. The mixer output also contains a sum term near 2f_LO − f_RF, which the tuned IF filter rejects.',
    example: {
      question: 'f_RF = 100 MHz, f_IF = 10.7 MHz, high-side injection.',
      steps: ['f_LO = 100 + 10.7 = 110.7 MHz', '|f_LO − f_RF| = 10.7 MHz ✓'],
      answer: '110.7 MHz',
    },
    tags: ['superheterodyne', 'if', 'mixer'],
    relatedLessons: ['m5-receiver'],
  },
  {
    id: 'image',
    module: 5,
    name: 'Image frequency',
    tex: 'f_{image} = f_{RF} + 2 f_{IF} \\quad (\\text{high-side injection})',
    plain: 'fimage = fRF + 2*fIF  (high-side injection)',
    vars: [
      { symbol: 'f_image', meaning: 'unwanted RF that produces the same IF as the desired signal', unit: 'Hz' },
      { symbol: 'f_RF', meaning: 'desired signal frequency', unit: 'Hz' },
      { symbol: 'f_IF', meaning: 'intermediate frequency', unit: 'Hz' },
    ],
    assumptions:
      'High-side injection puts the image above the tuned frequency; low-side injection puts it below. The image is not a curiosity — it is why the RF preselector must reject a band 2·f_IF wide.',
    example: {
      question: 'Receiver tuned to 100 MHz, f_IF = 10.7 MHz, high-side.',
      steps: ['f_LO = 110.7 MHz', 'f_image = 100 + 2(10.7) = 121.4 MHz', '|121.4 − 110.7| = 10.7 MHz — indistinguishable at the IF filter'],
      answer: '121.4 MHz',
    },
    tags: ['image', 'superheterodyne', 'ifrr'],
    relatedLessons: ['m5-receiver'],
  },

  /* ---------------------------------------------- Module 6 */
  {
    id: 'hamming-distance',
    module: 6,
    name: 'Detection and correction capability from Hamming distance',
    tex: 'd_{min} \\Rightarrow \\underbrace{\\left\\lfloor\\frac{d_{min}-1}{2}\\right\\rfloor}_{\\mathrm{correct}} \\ \\mathrm{errors} \\,;\\, d_{min}-1 \\ \\mathrm{errors\\ detected}',
    plain: 'correct floor((dmin-1)/2); detect dmin-1',
    vars: [{ symbol: 'd_min', meaning: 'minimum Hamming distance between any two codewords', unit: 'bits' }],
    assumptions:
      'Applies to a block code used against independent random errors. It does not protect against bursts: an error burst of length b can look like up to b single-bit errors, which is why burst codes and interleaving are used together.',
    example: {
      question: 'Hamming (7,4) has d_min = 3.',
      steps: ['Corrects ⌊(3−1)/2⌋ = 1 error', 'Detects up to 3 − 1 = 2 errors'],
      answer: 'Corrects 1 bit, detects 2 bits',
    },
    tags: ['hamming', 'distance', 'code'],
    relatedLessons: ['m6-hamming', 'm6-errors'],
  },
  {
    id: 'parity',
    module: 6,
    name: 'Parity bit (even or odd)',
    tex: 'p = \\left( \\sum_{i} b_i \\right) \\bmod 2 \\quad (\\text{even}) \\qquad \\mathrm{or} \\qquad p = \\left(1-\\sum_i b_i\\right)\\bmod 2 \\quad (\\text{odd})',
    plain: 'p = sum(bits) mod 2 (even); p = (1 - sum(bits)) mod 2 (odd)',
    vars: [
      { symbol: 'p', meaning: 'added parity bit', unit: 'bit' },
      { symbol: 'b_i', meaning: 'data bits', unit: 'bits' },
    ],
    assumptions:
      'A single parity bit forces the total number of 1s to be even (or odd). It therefore detects every odd number of bit errors but misses every even number, including the common two-bit error. It never identifies which bit is wrong, so it cannot correct anything.',
    example: {
      question: 'Data 1011001, even parity.',
      steps: ['Count of 1s = 4', 'p = 4 mod 2 = 0'],
      answer: 'Codeword 10110010',
    },
    tags: ['parity', 'detection'],
    relatedLessons: ['m6-parity'],
  },
  {
    id: 'crc',
    module: 6,
    name: 'CRC codeword construction',
    tex: 'C(x) = x^{r} M(x) + R(x), \\qquad R(x) = \\left(x^{r} M(x)\\right) \\bmod g(x)',
    plain: 'C(x) = x^r*M(x) + R(x);  R(x) = (x^r*M(x)) mod g(x)',
    vars: [
      { symbol: 'M(x)', meaning: 'message polynomial', unit: '—' },
      { symbol: 'g(x)', meaning: 'generator polynomial of degree r', unit: '—' },
      { symbol: 'R(x)', meaning: 'remainder — the frame check sequence', unit: 'bits' },
      { symbol: 'C(x)', meaning: 'transmitted codeword: message followed by remainder', unit: 'bits' },
    ],
    assumptions:
      'Arithmetic is over GF(2), where addition and subtraction are both XOR. CRC-32 detects all burst errors up to 32 bits, all odd numbers of bit errors, and all double-bit errors within a word shorter than 2³²−1. It detects only — it cannot correct.',
    example: {
      question: 'Message 1101, generator x³+x+1 → 1011.',
      steps: ['Append r = 3 zeros: 1101000', '1101000 mod 1011 = 001', 'Codeword = 1101 001', 'Check: 1101001 divides evenly by 1011'],
      answer: '1101001',
    },
    tags: ['crc', 'polynomial', 'gf2'],
    relatedLessons: ['m6-crc'],
  },
  {
    id: 'stop-and-wait',
    module: 6,
    name: 'Stop-and-wait ARQ throughput',
    tex: '\\eta = \\frac{1-p}{1+2a} \\quad (\\text{ignoring retransmission cost}), \\qquad a = \\frac{T_{prop}}{T_{frame}}',
    plain: 'eta = (1-p)/(1+2a);  a = Tprop/Tframe',
    vars: [
      { symbol: 'η', meaning: 'normalised throughput', unit: '—' },
      { symbol: 'p', meaning: 'frame error probability (frame + ACK)', unit: '—' },
      { symbol: 'a', meaning: 'one-way propagation delay ÷ frame transmission time', unit: '—' },
    ],
    assumptions:
      'Ignores the time spent on retransmission, so it is an upper bound. If a retransmission costs the same as a first transmission, η = (1−p)·T_f/(T_f + 2T_prop). Long satellite links (large a) are exactly why windowed protocols exist.',
    example: {
      question: 'T_f = 10 ms, T_prop = 60 ms, p = 0.',
      steps: ['a = 60/10 = 6', 'η = 1/(1 + 12) = 0.077'],
      answer: '7.7 % — the link spends 92 % of its time waiting',
    },
    tags: ['arq', 'throughput'],
    relatedLessons: ['m6-arq'],
  },
  {
    id: 'gbn',
    module: 6,
    name: 'Go-Back-N throughput',
    tex: '\\eta = \\frac{1-p}{1 + 2a(1-p)} \\quad \\text{with window } W \\ge \\lceil 1+2a \\rceil',
    plain: 'eta = (1-p)/(1 + 2a(1-p))',
    vars: [
      { symbol: 'a', meaning: 'propagation delay ÷ frame transmission time', unit: '—' },
      { symbol: 'p', meaning: 'frame error probability', unit: '—' },
    ],
    assumptions:
      'Requires a window large enough to cover every frame that can be lost in one round trip. Each error costs a whole window retransmission, so GBN degrades sharply when p is high or frames are short.',
    example: {
      question: 'a = 6, p = 0.01.',
      steps: ['η = 0.99 / (1 + 12 × 0.99) = 0.99 / 12.88 = 0.077'],
      answer: '7.7 % — barely better than stop-and-wait here, because p is small and a is large',
    },
    tags: ['arq', 'gbn'],
    relatedLessons: ['m6-arq'],
  },
  {
    id: 'interleave-depth',
    module: 6,
    name: 'Burst separation by block interleaving',
    tex: 'd \\;\\geq\\; \\left\\lfloor L / b \\right\\rfloor',
    plain: 'd >= floor(L/b)',
    vars: [
      { symbol: 'd', meaning: 'minimum separation between originally adjacent symbols after de-interleaving', unit: 'symbols' },
      { symbol: 'L', meaning: 'interleaver block length', unit: 'symbols' },
      { symbol: 'b', meaning: 'maximum burst length', unit: 'symbols' },
    ],
    assumptions:
      'A block interleaver of depth L turns any single burst of up to b consecutive channel errors into errors at least ⌊L/b⌋ apart. The code — not the interleaver — then corrects each one individually. Interleaving alone detects nothing and corrects nothing; it only redistributes the damage.',
    example: {
      question: 'Interleaver depth L = 20, burst of 4 symbols.',
      steps: ['d ≥ ⌊20/4⌋ = 5', 'The four errors land at least 5 symbols apart'],
      answer: 'Separation of at least 5 symbols',
    },
    tags: ['interleaving', 'burst'],
    relatedLessons: ['m6-interleaving'],
  },
];

export const formulaMap = new Map(formulas.map((f) => [f.id, f]));

export const formulasForModule = (module: number): Formula[] => formulas.filter((f) => f.module === module);