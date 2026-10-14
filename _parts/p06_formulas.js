/* =========================================================================
   SL.data — embedded course data
   Everything below is literal, checked content: no fetch(), no external JSON.
   ========================================================================= */
var DATA = SL.data = {};

DATA.formulas = [
/* ---------------- MODULE 1 ---------------- */
{
  id: 'nyq', m: 1, name: 'Nyquist sampling condition',
  tex: 'f_s \\;\\geq\\; 2 f_{max} \\;\\equiv\\; 2 f_a',
  vars: [['f_s', 'sampling frequency', 'samples/s (Hz)'], ['f_{max}', 'highest frequency component present in the input', 'Hz'],
  ['f_a', 'highest message (analogue) frequency', 'Hz']],
  assumptions: 'The input must be strictly band-limited to f_max (an ideal anti-aliasing filter is assumed), and the impulse train used for ideal reconstruction must have infinite duration. A practical system samples comfortably above 2·f_max and uses a steep, non-ideal filter.',
  ex: { q: 'A voice signal is band-limited to 3.4 kHz. What is the minimum sampling rate?',
    steps: ['f_max = 3400 Hz', 'f_s(min) = 2 × 3400 = 6800 samples/s', 'In practice use ≥ 8000 samples/s (the telephony rate)'],
    a: '6800 samples/s minimum; 8000 samples/s is the standard telephony choice.' },
  tags: ['sampling', 'nyquist', 'theorem']
},
{
  id: 'nyqf', m: 1, name: 'Nyquist frequency',
  tex: 'f_N \\;=\\; \\frac{f_s}{2}',
  vars: [['f_N', 'Nyquist frequency — half the sampling rate; content above it aliases', 'Hz'], ['f_s', 'sampling frequency', 'Hz']],
  assumptions: 'Only meaningful for an ideal sampler. Any input component above f_N folds down into the baseband.',
  ex: { q: 'f_s = 8000 Hz. What is the Nyquist frequency?',
    steps: ['f_N = 8000 / 2 = 4000 Hz', 'A 3.4 kHz voice signal fits below 4 kHz — that is why 8 kHz sampling works'],
    a: '4000 Hz.' },
  tags: ['sampling', 'nyquist']
},
{
  id: 'snrdb', m: 1, name: 'SNR in decibels (power ratio)',
  tex: '\\mathrm{SNR}_{dB} \\;=\\; 10 \\log_{10}\\!\\left(\\frac{P_s}{P_n}\\right)',
  vars: [['SNR_dB', 'signal-to-noise ratio, power basis', 'dB'], ['P_s', 'wanted signal power', 'W'], ['P_n', 'noise power', 'W']],
  assumptions: 'Power ratio → factor of 10. If instead you use a ratio of amplitude or RMS values, use 20·log₁₀ — mixing the two is the single most common SNR error in this field. Noise and signal must be measured over the same bandwidth.',
  ex: { q: 'Signal power is 1.2 mW and noise power is 3.0 µW. Find the SNR in dB.',
    steps: ['P_s/P_n = 1.2e-3 / 3.0e-6 = 400', 'SNR_dB = 10·log₁₀(400) = 26.02 dB'],
    a: '26.0 dB.' },
  tags: ['snr', 'db', 'noise']
},
{
  id: 'ber', m: 1, name: 'Bit error rate',
  tex: '\\mathrm{BER} \\;=\\; \\frac{N_{error}}{N_{total}}',
  vars: [['BER', 'measured (empirical) bit error rate', 'dimensionless (0…1)'], ['N_error', 'bits decided incorrectly', 'bits'], ['N_total', 'bits transmitted', 'bits']],
  assumptions: 'An empirical figure for the specific run shown. With only a few thousand bits the sample is noisy: a run of 20 000 bits that shows 5 errors (BER = 2.5e-4) is entirely consistent with a true BER anywhere in roughly the 6e-5…9e-4 range. Never quote a short-run BER as if it were the theoretical value.',
  ex: { q: '25 000 bits are sent and 4 are received incorrectly.',
    steps: ['BER = 4 / 25000', 'BER = 0.00016 = 1.6 × 10⁻⁴'], a: '1.6 × 10⁻⁴ (one error in about 6 250 bits).' },
  tags: ['ber', 'errors']
},
{
  id: 'berbpsk', m: 1, name: 'BER of coherent BPSK in AWGN',
  tex: '\\mathrm{BER}_{BPSK} \\;=\\; Q\\!\\left(\\sqrt{2\\,\\frac{E_b}{N_0}}\\right)',
  vars: [['E_b', 'energy per bit', 'J'], ['N_0', 'one-sided noise PSD times noise bandwidth', 'J'], ['Q(x)', 'Gaussian tail probability, Q(x)=½·erfc(x/√2)', '—']],
  assumptions: 'Additive white Gaussian noise, ideal coherent detection, exactly antipodal signals (no amplitude/phase error). Changing modulation, adding coding, or using non-coherent detection changes this result completely — it is not a universal BER law.',
  ex: { q: 'E_b/N_0 = 9.6 dB. Estimate the BPSK BER.',
    steps: ['E_b/N_0 = 10^(9.6/10) = 9.12', '√(2×9.12) = 4.27', 'Q(4.27) ≈ 9.8 × 10⁻⁶'],
    a: '≈ 9.8 × 10⁻⁶' },
  tags: ['ber', 'psk', 'awgn']
},

/* ---------------- MODULE 2 ---------------- */
{
  id: 'levels', m: 2, name: 'Number of quantisation levels',
  tex: 'L \\;=\\; 2^{m}',
  vars: [['L', 'number of distinct quantiser output levels', 'levels'], ['m', 'number of bits used per sample', 'bits']],
  assumptions: 'A uniform binary encoder: each level is addressed by a unique m-bit word. Applies to linear PCM coding before any companding is applied.',
  ex: { q: 'How many levels does an 8-bit uniform quantiser have?',
    steps: ['L = 2^8 = 256 levels'], a: '256 levels.' },
  tags: ['quantisation', 'pcm', 'levels']
},
{
  id: 'vlsb', m: 2, name: 'Quantiser step size (resolution)',
  tex: 'V_{LSB} \\;=\\; \\frac{V_{FSR}}{2^{m}} \\;\\equiv\\; \\frac{V_{FSR}}{L}',
  vars: [['V_LSB', 'step size — smallest amplitude change the quantiser can represent', 'V (volts)'], ['V_FSR', 'full-scale input range (span between the negative and positive clipping limits)', 'V'], ['m', 'bit depth', 'bits']],
  assumptions: 'This is the "step = range / number of levels" convention, consistent with L = 2^m addressing levels across the range. Some texts define resolution as V_FSR/(2^m − 1); the difference is small but state which one you use. For a bipolar signal the input range is normally V_FSR = 2·V_pk.',
  ex: { q: 'A bipolar ADC has a ±5 V input range and 12 bits. What is its step size?',
    steps: ['V_FSR = 5 − (−5) = 10 V', '2^12 = 4096', 'V_LSB = 10 / 4096 = 2.441 mV'], a: '2.44 mV per LSB.' },
  tags: ['quantisation', 'resolution', 'adc']
},
{
  id: 'qerr', m: 2, name: 'Maximum quantisation error',
  tex: '\\left|e_q\\right| \\;\\leq\\; \\frac{V_{LSB}}{2}',
  vars: [['e_q', 'difference between the input sample and the nearest output level', 'V'], ['V_LSB', 'step size', 'V']],
  assumptions: 'Uniform quantisation, input inside the representable range, and rounding to the nearest level. Outside the range the error grows without bound (saturation). With truncation to the next lower level the bound is V_LSB instead of V_LSB/2.',
  ex: { q: 'With V_LSB = 2.441 mV, what is the largest possible quantisation error?',
    steps: ['|e_q|max = 2.441/2 = 1.221 mV'], a: '1.22 mV' },
  tags: ['quantisation', 'error']
},
{
  id: 'sqnr', m: 2, name: 'SQNR of a full-scale sinusoid (uniform quantiser)',
  tex: '\\mathrm{SQNR}_{dB} \\;\\approx\\; 6.02\\,m \\;+\\; 1.76',
  vars: [['SQNR_dB', 'signal-to-quantisation-noise ratio', 'dB'], ['m', 'bit depth', 'bits']],
  assumptions: 'Uniform (linear) quantisation, a full-scale sine wave (peak = V_FSR/2) and the usual "step = range/L" convention. The bare 6.02·m dB figure is the dynamic-range rule of thumb: the number of levels L = 2^m itself corresponds to 20·log₁₀(L) = 6.02·m dB. The +1.76 dB offset only appears for the sine-wave SQNR definition, and the result falls by about 6 dB if the signal peak drops to half of full scale.',
  ex: { q: 'Find the SQNR for m = 10.',
    steps: ['SQNR = 6.02 × 10 + 1.76 = 61.96 dB'], a: '≈ 62.0 dB' },
  tags: ['sqnr', 'quantisation']
},
{
  id: 'dynrange', m: 2, name: 'Dynamic range from bit depth',
  tex: 'D_R \\;=\\; 20 \\log_{10} L \\;=\\; 6.02\\,m \\quad [\\mathrm{dB}]',
  vars: [['D_R', 'dynamic range — ratio of the largest representable magnitude to the smallest step', 'dB'], ['L', 'number of levels (2^m)', '—'], ['m', 'bit depth', 'bits']],
  assumptions: 'This is a range ratio, not a signal-to-noise ratio. Quote it as "6.02·m dB of dynamic range per bit" and keep it distinct from the 6.02m + 1.76 dB sine-wave SQNR.',
  ex: { q: 'm = 12.', steps: ['D_R = 6.02 × 12 = 72.2 dB'], a: '72.2 dB' }, tags: ['dynamic range', 'bits']
},
{
  id: 'mulaw', m: 2, name: 'μ-law compression characteristic',
  tex: 'F_{\\mu}(x) \\;=\\; \\operatorname{sgn}(x)\\,\\frac{\\ln\\!\\left(1+\\mu |x|\\right)}{\\ln\\!\\left(1+\\mu\\right)}',
  vars: [['F_μ(x)', 'compressed amplitude, normalised to [−1, +1]', 'normalised'], ['x', 'input amplitude, normalised to [−1, +1]', 'normalised'], ['μ', 'companding parameter (ITU-T G.711 uses μ = 255)', 'dimensionless']],
  assumptions: 'A continuous, monotone law whose endpoints map exactly onto ±1, so the compressor and expander are exact inverses. The law is symmetric about zero. Larger μ gives finer resolution at small amplitudes and a larger low-level gain.',
  ex: { q: 'For μ = 255, what is the output for x = 0.1?',
    steps: ['ln(1 + 255×0.1) = ln(26.5) = 3.277', 'ln(256) = 5.545', 'F = 3.277 / 5.545 = 0.591', 'In dB the low-level gain is 20·log₁₀(0.591/0.1) = +15.4 dB'],
    a: '0.591 normalised (about +15.4 dB of gain for small signals).' },
  tags: ['companding', 'mu-law', 'g711']
},
{
  id: 'alaw', m: 2, name: 'A-law compression characteristic',
  tex: 'A(x)=\\begin{cases} A\\,x, & |x| \\le \\tfrac{1}{16} \\\\ \\dfrac{1+\\ln\\!\\left(A|x|\\right)}{1+\\ln A}, & |x| > \\tfrac{1}{16} \\end{cases}',
  vars: [['A', 'slope of the linear segment, A = 87.7 for ITU-T G.711 A-law', 'dimensionless'], ['x', 'input amplitude normalised to [−1, +1]', 'normalised']],
  assumptions: 'Piecewise law: a linear region within ±1/16 that gives good absolute resolution near zero, then logarithmic compression out to ±1. A-law deliberately overshoots the maximum slightly so that the 12-bit input range of G.711 is fully covered by the 13-bit A-law segment range.',
  ex: { q: 'A = 87.7, x = 0.5.',
    steps: ['|x| > 1/16, so use the log branch', 'ln(87.7 × 0.5) = ln(43.85) = 3.781', '1 + ln(87.7) = 5.473', 'A(0.5) = (1 + 3.781)/5.473 = 0.873'],
    a: '0.873 normalised.' },
  tags: ['companding', 'a-law', 'g711']
},
{
  id: 'dpcmdiff', m: 2, name: 'DPCM difference and reconstruction',
  tex: 'e_n \\;=\\; x_n - \\hat{x}_n \\quad ; \\quad \\hat{x}_n \\;=\\; \\hat{x}_{n-1} + \\tilde{e}_n',
  vars: [['e_n', 'prediction error actually quantised and transmitted', 'V'], ['x_n', 'original sample', 'V'], ['x̂_n', 'encoder predictor estimate of x_n', 'V'], ['ẽ_n', 'error after quantisation (what the decoder gets)', 'V']],
  assumptions: 'The encoder and decoder use the identical predictor driven by the same reconstructed history, so their states stay in step. It is this closed-loop construction that prevents drift. The gain comes from the error signal having a much smaller dynamic range than the original samples.',
  ex: { q: 'True error 0.8 mV, step 0.5 mV, rounding to nearest.',
    steps: ['code = round(0.8/0.5) = 2', 'ẽ = 2 × 0.5 = 1.0 mV', 'x̂ = x̂(n−1) + 1.0 mV'], a: 'Transmitted error 1.0 mV; reconstruction adds 1.0 mV to the previous estimate.' },
  tags: ['dpcm', 'prediction']
},

/* ---------------- MODULE 3 ---------------- */
{
  id: 'dmstep', m: 3, name: 'Maximum slope a DM staircase can follow',
  tex: '\\left|\\frac{\\Delta x}{\\Delta t}\\right|_{\\max} \\;=\\; \\frac{\\delta}{T_s} \\;=\\; \\delta\\, f_s',
  vars: [['δ', 'DM step size (the quantiser increment)', 'V'], ['T_s', 'sampling period', 's'], ['f_s', 'sampling frequency', 'samples/s']],
  assumptions: 'A one-bit quantiser can only change its output by exactly one step per sample, so this is a hard ceiling. "Unit slope" design means choosing δ so that this ceiling exceeds the steepest expected slope of the input — δ = A·2π·f_m for a sine of amplitude A.',
  ex: { q: 'A 1 kHz sine of amplitude 2 V, sampled at 8 kHz. What δ avoids slope overload?',
    steps: ['max slope = 2π × 2 × 1000 = 12566 V/s', 'δ ≥ 12566 / 8000 = 1.571 V'], a: 'δ ≥ 1.57 V; a practical design uses somewhat more.' },
  tags: ['delta modulation', 'slope overload']
},
{
  id: 'dmslope', m: 3, name: 'Slope-overload criterion for a sine input',
  tex: '\\delta \\;\\geq\\; 2\\pi\\, A\\, f_m / f_s',
  vars: [['A', 'peak amplitude of the input', 'V'], ['f_m', 'input frequency', 'Hz'], ['f_s', 'sampling rate', 'samples/s'], ['δ', 'step size', 'V']],
  assumptions: 'Applies to a sinusoidal input tracked by a simple one-bit staircase. Exceeding it produces slope overload: the staircase systematically lags, and the error grows in proportion to the input slope rather than staying bounded by δ.',
  ex: { q: 'A = 1 V, f_m = 500 Hz, f_s = 4000 samples/s.',
    steps: ['2π × 1 × 500 / 4000 = 0.785 V'], a: 'δ ≥ 0.785 V' },
  tags: ['delta modulation', 'slope']
},
{
  id: 'granular', m: 3, name: 'Peak granular noise amplitude',
  tex: 'e_{gran,peak} \\;\\leq\\; \\delta',
  vars: [['e_gran', 'tracking error while the input is slow or constant', 'V'], ['δ', 'step size', 'V']],
  assumptions: 'Granular noise is not a power-limited effect but an amplitude-limited one: halving δ halves the visible granularity but also halves the slope the staircase can follow, so slope-overload risk doubles. This is the central ADM trade-off.',
  ex: { q: 'δ = 0.1 V, constant input.', steps: ['The staircase alternates around the input', 'Peak error ≤ 0.1 V'], a: 'Error bounded by ±0.1 V.' },
  tags: ['granular noise', 'delta modulation']
},
{
  id: 'sdnoise', m: 3, name: 'First-order ΣΔ in-band quantisation noise',
  tex: 'S_n(f) \\;\\propto\\; \\left|1-e^{-j2\\pi f/F_s}\\right|^{2} \\;\\sim\\; f^{2}',
  vars: [['S_n(f)', 'quantisation noise power spectral density after the modulator', 'W/Hz'], ['f', 'frequency offset from DC', 'Hz'], ['F_s', 'oversampled sampling rate', 'Hz']],
  assumptions: 'A first-order loop gives a noise transfer function (1 − z⁻¹), i.e. noise rises as f², so the band around the signal stays quiet while the noise is pushed towards F_s/2 where a simple low-pass decimator removes it. Because the in-band integral of an f² spectrum scales as the cube of the filter bandwidth, halving the signal bandwidth (doubling the OSR) improves the in-band SNR by about 9 dB. Oversampling *alone* — a plain high-rate uniform quantiser — only improves SNR by 3·log₁₀(OSR) ≈ 3 dB per doubling; it is the noise shaping that gives the extra 6 dB per doubling.',
  ex: { q: 'OSR = 4, first order.',
    steps: ['Plain oversampling: 3·log₁₀(4) = 1.8 dB', 'Noise shaping adds 6·log₁₀(4) = 3.6 dB', 'Total ≈ 5.4 dB (i.e. 9 dB per doubling of OSR)'],
    a: '≈ 5.4 dB better than the equivalent 1× oversampled quantiser.' },
  tags: ['sigma delta', 'noise shaping', 'oversampling']
},

/* ---------------- MODULE 4 ---------------- */
{
  id: 'rbrs', m: 4, name: 'Bit rate from symbol rate',
  tex: 'R_b \\;=\\; R_s \\log_2 M',
  vars: [['R_b', 'bit rate', 'bits/s'], ['R_s', 'symbol (baud) rate', 'symbols/s'], ['M', 'number of distinct symbols', 'symbols']],
  assumptions: 'Valid for a fixed-length mapping in which every symbol always carries the same number of bits. If some symbols are used more often than others (e.g. Huffman or constrained codes), the information rate is below R_s·H where H is the entropy in bits/symbol. Framing, coding and protocol overhead reduce the payload throughput below R_b.',
  ex: { q: '16-QAM at 2400 baud.',
    steps: ['log₂16 = 4 bits/symbol', 'R_b = 2400 × 4 = 9600 bit/s'], a: '9600 bit/s' },
  tags: ['bit rate', 'baud', 'qam']
},
{
  id: 'spectral', m: 4, name: 'Spectral efficiency (idealised)',
  tex: '\\eta \\;=\\; \\frac{R_b}{B} \\;\\leq\\; \\log_2 M',
  vars: [['η', 'spectral efficiency', 'bit/s/Hz'], ['R_b', 'bit rate', 'bit/s'], ['B', 'occupied bandwidth', 'Hz'], ['M', 'constellation size', '—']],
  assumptions: 'The bound log₂M is the Shannon limit of a noiseless band-limited channel and is reached only with Nyquist pulse shaping (raised cosine with α = 0). Any roll-off reduces η, so real systems sit strictly below log₂M. Coding adds redundancy that lowers the net (post-decoding) efficiency even while it lowers the required Eb/N0.',
  ex: { q: '16-QAM with raised-cosine α = 0.35 at R_b = 9600 bit/s.',
    steps: ['B = (1 + 0.35)·R_b = 12960 Hz', 'η = 9600 / 12960 = 0.74 bit/s/Hz'], a: '0.74 bit/s/Hz, well below the 4 bit/s/Hz ceiling for 16-QAM.' },
  tags: ['spectral efficiency', 'bandwidth']
},
{
  id: 'askbw', m: 4, name: 'Occupied bandwidth of linear modulations (raised cosine)',
  tex: 'B \\;=\\; (1+\\alpha)\\,R_s',
  vars: [['B', 'one-sided RF passband width centred on the carrier', 'Hz'], ['R_s', 'symbol rate', 'baud'], ['α', 'roll-off factor (0 ≤ α ≤ 1)', 'dimensionless']],
  assumptions: 'Represents a raised-cosine pulse-shaped linear modulation. At α = 0 the main lobe collapses to R_s, which is idealised (an infinitely long pulse). At α = 1 the spectrum is twice as wide as α = 0 but has a linear phase. Practical receivers use 0.2–0.35 because a matched filter tolerates some timing error. This single convention is used throughout SignalLab; "bandwidth = symbol rate" is only its α = 0 limit.',
  ex: { q: 'QPSK, R_s = 1200 baud, α = 0.35.',
    steps: ['B = 1.35 × 1200 = 1620 Hz'], a: '1620 Hz' },
  tags: ['bandwidth', 'ask', 'psk', 'qam', 'rolloff']
},
{
  id: 'fskbw', m: 4, name: 'FSK occupied bandwidth (Carson's rule for FSK)',
  tex: 'B \\;\\approx\\; 2\\!\\left(\\Delta f + \\frac{R_s}{2}\\right)',
  vars: [['B', 'occupied bandwidth', 'Hz'], ['Δf', 'peak frequency deviation from the centre frequency (half the mark–space separation)', 'Hz'], ['R_s', 'symbol rate', 'baud']],
  assumptions: 'The same engineering approximation used for FM. It is independent of the modulation index in the sense that Δf and R_s together determine the result; the "mark–space separation + R_s" form is an alternative rough rule that ignores the symbol pulse spectrum. A non-zero centre frequency f_c does not appear, because bandwidth depends on the deviation span, not on where in the band the signal sits.',
  ex: { q: 'BFSK with f_c = 1200 Hz, f_1 = 1300 Hz, f_0 = 1100 Hz, R_s = 300 baud.',
    steps: ['Δf = (1300 − 1100)/2 = 100 Hz', 'B = 2(100 + 150) = 500 Hz'], a: '≈ 500 Hz — about 1.67 × the 300 baud symbol rate.' },
  tags: ['fsk', 'bandwidth', 'carson']
},
{
  id: 'ofdmdf', m: 4, name: 'OFDM subcarrier spacing and orthogonality',
  tex: '\\Delta f \\;=\\; \\frac{1}{T_u} \\;\\; , \\;\\; \\int_{0}^{T_u} \\cos(2\\pi k\\Delta f t)\\,\\cos(2\\pi l\\Delta f t)\\,dt = \\begin{cases} T_u/2 & k=l \\\\ 0 & k\\neq l\\end{cases}',
  vars: [['Δf', 'subcarrier spacing', 'Hz'], ['T_u', 'useful symbol duration (excluding the cyclic prefix)', 's'], ['k, l', 'subcarrier indices', '—']],
  assumptions: 'Orthogonality relies on the receiver sampling exactly at the symbol boundaries (or using an FFT, which does the equivalent). The cyclic prefix T_cp ≤ the channel delay spread converts linear convolution into circular convolution so that one FFT per symbol suffices.',
  ex: { q: 'Wi-Fi style: T_u = 3.2 µs.',
    steps: ['Δf = 1 / 3.2e-6 = 312.5 kHz'], a: '312.5 kHz' },
  tags: ['ofdm', 'orthogonality']
},
{
  id: 'pgain', m: 4, name: 'DSSS processing gain',
  tex: 'G_p \\;=\\; \\frac{B_{SS}}{B_{DS}} \\;\\approx\\; \\frac{R_c}{R_b} = N_{chips}',
  vars: [['G_p', 'processing gain (linear)', '— (or dB if 10·log₁₀)'], ['B_SS', 'spread bandwidth', 'Hz'], ['B_DS', 'unspread data bandwidth', 'Hz'], ['N_chips', 'chips per data bit', 'chips/bit']],
  assumptions: 'The gain is only "free" SNR if the interference is reduced to the same proportion. Spreading also transmits the noise power the receiver collects over the wide bandwidth, so the net gain against a *broadband* noise source is much smaller than G_p. Against a narrowband interferer of fixed power the full gain applies.',
  ex: { q: '10 chips per bit, chip rate 10 Mchip/s.',
    steps: ['G_p = 10 Mchip/s / 1 Mbit/s = 10 → 10 dB'], a: '10 (10 dB)' },
  tags: ['dsss', 'processing gain']
},

/* ---------------- MODULE 5 ---------------- */
{
  id: 'ammi', m: 5, name: 'AM modulation index (single tone)',
  tex: 'm \\;=\\; \\frac{V_m}{V_c} \\;\\; , \\;\\; \\% \\mathrm{modulation} = 100\\, m',
  vars: [['m', 'modulation index (0…1 for undistorted AM)', 'dimensionless'], ['V_m', 'peak message voltage', 'V'], ['V_c', 'peak carrier voltage', 'V']],
  assumptions: 'Conventional AM only, with a resistive (envelope-detectable) load so that peak carrier voltage and RMS carrier power can be related by the usual resistance. m > 1 is overmodulation: the envelope crosses zero and the phase is reversed, so a diode detector recovers a distorted message.',
  ex: { q: 'V_m = 0.8 V, V_c = 1.0 V.',
    steps: ['m = 0.8 / 1.0 = 0.8', '% modulation = 80 %'], a: 'm = 0.8 (80 % modulation).' },
  tags: ['am', 'modulation index']
},
{
  id: 'ambw', m: 5, name: 'AM bandwidth',
  tex: 'B_{AM} \\;=\\; 2 f_{m,max}',
  vars: [['B_AM', 'transmitted bandwidth (upper sideband to lower sideband)', 'Hz'], ['f_m,max', 'highest frequency in the message signal', 'Hz']],
  assumptions: 'True for conventional AM with both sidebands transmitted, whatever the modulation index — including m = 0, when the bandwidth is still 2·f_m,max even though no sideband energy exists at all. DSB-SC and SSB halve and quarter this respectively.',
  ex: { q: 'Voice band-limited to 4 kHz.',
    steps: ['B_AM = 2 × 4000 = 8000 Hz'], a: '8 kHz for AM; 4 kHz for DSB-SC; 2 kHz for SSB.' },
  tags: ['am', 'bandwidth', 'sideband']
},
{
  id: 'ampt', m: 5, name: 'Total AM transmit power',
  tex: 'P_T \\;=\\; P_C\\!\\left(1 + \\frac{m^{2}}{2}\\right)',
  vars: [['P_T', 'total transmitted power', 'W'], ['P_C', 'unmodulated carrier power', 'W'], ['m', 'modulation index', 'dimensionless']],
  assumptions: 'A single-tone message, where the total sideband power equals m²·P_C/2. At m = 1 all the extra power is useful, so full carrier AM is at most twice as power-efficient as DSB-SC and far worse than SSB — the price of a simple envelope detector.',
  ex: { q: 'P_C = 500 W at 70 % modulation.',
    steps: ['P_T = 500 × (1 + 0.49/2) = 500 × 1.245 = 622.5 W', 'Sidebands carry 122.5 W, carrier 500 W'],
    a: '622.5 W total (only 19.7 % of it is information).' },
  tags: ['am', 'power']
},
{
  id: 'fmbeta', m: 5, name: 'FM modulation index (deviation ratio)',
  tex: '\\beta \\;=\\; \\frac{\\Delta f}{f_m}',
  vars: [['β', 'FM modulation index / deviation ratio', 'dimensionless'], ['Δf', 'peak frequency deviation', 'Hz'], ['f_m', 'modulating frequency', 'Hz']],
  assumptions: 'A single sinusoidal message. β is only a single meaningful number for one tone; for a composite message each frequency has its own index, which is why a wideband FM index is quoted as the worst-case deviation divided by the highest modulating frequency.',
  ex: { q: 'Δf = 75 kHz, f_m = 1.5 kHz.',
    steps: ['β = 75000 / 1500 = 50'], a: 'β = 50 — a wideband FM signal.' },
  tags: ['fm', 'modulation index']
},
{
  id: 'carson', m: 5, name: "Carson's rule",
  tex: 'B \\;\\approx\\; 2\\,\\left(\\Delta f + f_{m,max}\\right)',
  vars: [['B', 'bandwidth estimated by Carson\'s rule', 'Hz'], ['Δf', 'peak frequency deviation', 'Hz'], ['f_m,max', 'highest modulating frequency', 'Hz']],
  assumptions: 'A design rule of thumb, not an exact result. An FM signal with a sinusoidal message technically has infinitely many sidebands with amplitudes given by Bessel functions; Carson keeps roughly 98 % of the power. As β → ∞ it approaches 2·N·f_m with N significant sideband pairs, as the course notes state.',
  ex: { q: 'Δf = 75 kHz, f_m,max = 15 kHz (broadcast FM).',
    steps: ['B = 2 × (75000 + 15000) = 180 kHz', 'Broadcast FM channels are allocated 200 kHz, which is consistent with this estimate'],
    a: '180 kHz' },
  tags: ['fm', 'carson', 'bandwidth']
},
{
  id: 'c swing', m: 5, name: 'Carrier swing',
  tex: 'CS \\;=\\; f_{max} - f_{min} \\;=\\; 2\\,\\Delta f',
  vars: [['CS', 'total swing between the highest and lowest instantaneous frequency', 'Hz'], ['Δf', 'peak deviation', 'Hz']],
  assumptions: 'A frequency-measuring instrument set to peak-programme deviation reads CS/2. Broadcast practice calls a channel "100 % modulated" when Δf = 75 kHz for the 88–108 MHz band.',
  ex: { q: 'Δf = 75 kHz.', steps: ['CS = 2 × 75 kHz = 150 kHz'], a: '150 kHz' }, tags: ['fm', 'swing']
},
{
  id: 'heterodyne', m: 5, name: 'Frequency conversion in a superheterodyne receiver',
  tex: 'f_{IF} \\;=\\; \\left| f_{LO} - f_{RF} \\right|',
  vars: [['f_IF', 'intermediate frequency (fixed for the receiver)', 'Hz'], ['f_LO', 'local oscillator frequency', 'Hz'], ['f_RF', 'incoming radio frequency being received', 'Hz']],
  assumptions: 'A high-side local oscillator means f_LO = f_RF + f_IF (the oscillator is tuned above the signal). Mixer output also contains a sum term near 2f_LO − f_RF; the tuned IF filter rejects it.',
  ex: { q: 'f_RF = 100 MHz, f_IF = 10.7 MHz, high-side injection.',
    steps: ['f_LO = 100 + 10.7 = 110.7 MHz', '|f_LO − f_RF| = 10.7 MHz ✓'], a: '110.7 MHz' },
  tags: ['superheterodyne', 'if', 'mixer']
},
{
  id: 'image', m: 5, name: 'Image frequency',
  tex: 'f_{image} \\;=\\; f_{RF} + 2 f_{IF} \\quad (\\text{high-side injection})',
  vars: [['f_image', 'unwanted RF that produces the same IF as the desired signal', 'Hz'], ['f_RF', 'desired signal frequency', 'Hz'], ['f_IF', 'intermediate frequency', 'Hz']],
  assumptions: 'High-side injection (f_LO = f_RF + f_IF) means the image lies above the tuned frequency. With low-side injection (f_LO = f_RF − f_IF) the image lies below. The image is not a theoretical curiosity: it is why the RF preselector must reject a band 2·f_IF wide.',
  ex: { q: 'Receiver tuned to 100 MHz, f_IF = 10.7 MHz.',
    steps: ['f_LO = 110.7 MHz', 'f_image = 100 + 2(10.7) = 121.4 MHz', '|121.4 − 110.7| = 10.7 MHz — indistinguishable at the IF filter'],
    a: '121.4 MHz' },
  tags: ['image', 'superheterodyne', 'ifrr']
},

/* ---------------- MODULE 6 ---------------- */
{
  id: 'hd', m: 6, name: 'Error correction and detection capability from Hamming distance',
  tex: 'd_{min} \\;\\Rightarrow\\; \\underbrace{\\lfloor (d_{min}-1)/2 \\rfloor}_{\\mathrm{correct}} \\quad \\mathrm{errors} \\;\\; , \\;\\; d_{min}-1 \\quad \\mathrm{errors\\ detected}',
  vars: [['d_min', 'minimum Hamming distance between any two codewords', 'bits']],
  assumptions: 'Applies to a block code used for random independent errors. It does not protect against bursts: an error burst of length b can masquerade as up to b single-bit errors, which is why burst-oriented codes and interleaving are used together.',
  ex: { q: 'Hamming (7,4) has d_min = 3.',
    steps: ['Corrects ⌊(3−1)/2⌋ = 1 error', 'Detects up to 3 − 1 = 2 errors'], a: 'Corrects 1 bit, detects 2 bits.' },
  tags: ['hamming', 'distance', 'code']
},
{
  id: 'parity', m: 6, name: 'Parity bit (even or odd)',
  tex: 'p \\;=\\; \\left( \\sum_{i} b_i \\right) \\bmod 2 \\quad(\\text{even}) \\qquad \\mathrm{or} \\qquad p = \\left(1 - \\sum_i b_i \\right)\\bmod 2 \\quad(\\text{odd})',
  vars: [['p', 'added parity bit', 'bit'], ['b_i', 'data bits', 'bits']],
  assumptions: 'A single parity bit forces the total number of 1s to be even (or odd). It therefore always detects an odd number of bit errors but misses every even number, including the very common two-bit error. It never identifies which bit is wrong, so it cannot correct anything.',
  ex: { q: 'Data 1011001, even parity.',
    steps: ['Count of 1s = 4', 'p = 4 mod 2 = 0'], a: 'Codeword 10110010' },
  tags: ['parity', 'detection']
},
{
  id: 'crcpoly', m: 6, name: 'CRC codeword construction',
  tex: 'C(x) \\;=\\; x^{r}\\,M(x) + R(x), \\qquad R(x) = \\left(x^{r} M(x)\\right) \\bmod g(x)',
  vars: [['M(x)', 'message polynomial', '—'], ['g(x)', 'generator polynomial of degree r', '—'], ['R(x)', 'remainder, r bits — the frame check sequence', 'bits'], ['C(x)', 'transmitted codeword, message followed by remainder', 'bits']],
  assumptions: 'Arithmetic is over GF(2), so addition and subtraction are both XOR. Detection is good — CRC-32 detects all burst errors up to 32 bits, all odd numbers of bit errors, and all double-bit errors within a word shorter than 2³²−1 — but CRC detects only, it does not correct.',
  ex: { q: 'Message 1101, generator g(x) = x³+x+1 → 1011.',
    steps: ['Append r = 3 zeros: 1101000', '1101000 mod 1011 = 110', 'Codeword = 1101 110'], a: '1101110' },
  tags: ['crc', 'polynomial', 'gf2']
},
{
  id: 'saW', m: 6, name: 'Stop-and-wait ARQ throughput',
  tex: '\\eta_{SAW} = \\frac{1-p}{1+2a} \\quad (\\text{ignore retransmissions}), \\qquad a = \\frac{T_{prop}}{T_{frame}}',
  vars: [['η_SAW', 'normalised throughput', '—'], ['p', 'frame error probability (frame + ACK)', '—'], ['a', 'ratio of one-way propagation delay to frame transmission time', '—']],
  assumptions: 'Ignores the time spent on retransmission, so it is an upper bound. If a retransmission costs the same as a first transmission, η = (1−p)·T_f/(T_f + 2T_prop) instead. Long satellite links (a large) are exactly why windowed protocols exist.',
  ex: { q: 'T_f = 10 ms, T_prop = 60 ms, p = 0.',
    steps: ['a = 60/10 = 6', 'η = 1 / (1 + 12) = 0.077'], a: '7.7 % — the link spends 92 % of the time waiting.' },
  tags: ['arq', 'throughput']
},
{
  id: 'gbn', m: 6, name: 'Go-Back-N throughput',
  tex: '\\eta_{GBN} = \\frac{1-p}{1 + 2a(1-p)} \\quad \\text{(window } W \\geq \\text{errors per RTT)}',
  vars: [['a', 'propagation delay / frame transmission time', '—'], ['p', 'frame error probability', '—']],
  assumptions: 'Requires the window to be at least as large as the number of frames that can be lost in one round trip, otherwise the sender must stop. Every error costs a full window retransmission, which is why GBN degrades sharply on a noisy link with short frames.',
  ex: { q: 'a = 6, p = 0.01.',
    steps: ['η = 0.99 / (1 + 12 × 0.99) = 0.99 / 12.88 = 0.0769'], a: '7.7 % — barely better than stop-and-wait here, because p is small and a is large.' },
  tags: ['arq', 'gbn']
},
{
  id: 'interleave', m: 6, name: 'Burst separation by block interleaving',
  tex: 'd \\;\\geq\\; \\lfloor L / b \\rfloor \\quad , \\qquad P_{no\\ error} = \\left(1-\\frac{n}{N}\\right)^{d}',
  vars: [['d', 'minimum separation between two originally-adjacent symbols after de-interleaving', 'symbols'], ['L', 'interleaver block length', 'symbols'], ['b', 'maximum burst length', 'symbols'], ['n', 'symbols in the burst', 'symbols'], ['N', 'total coded symbols', 'symbols']],
  assumptions: 'A block interleaver of depth L turns any single burst of up to b consecutive channel errors into errors at least ⌊L/b⌋ apart. The code — not the interleaver — then corrects each one individually. Interleaving alone detects nothing and corrects nothing; it only redistributes the damage.',
  ex: { q: 'L = 20, burst of 4 symbols.',
    steps: ['d ≥ ⌊20/4⌋ = 5', 'The four errors land at least 5 symbols apart'],
    a: 'Separation of at least 5 symbols.' },
  tags: ['interleaving', 'burst']
}
];
DATA.formulaMap = {};
DATA.formulas.forEach(function (f) { DATA.formulaMap[f.id] = f; });

/* ------------------------------------------------------ technical glossary */
DATA.glossaryOrder = Object.keys(SL.gloss.list).sort();