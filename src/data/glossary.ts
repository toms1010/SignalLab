import type { GlossaryEntry } from '@/types';

/**
 * Single source of truth for every technical term in SignalLab.
 *
 * The lesson renderer turns `[[Term Name]]` markup into a keyboard-focusable
 * `<Term>` component that reads from this list, so a term is defined exactly
 * once for the whole application.
 */
const RAW: [string, string, string, GlossaryEntry['module']][] = [
  ['Aliasing', 'The appearance of a false low-frequency component when a signal is sampled below its Nyquist rate. Spectral replicas of the sampled signal overlap and fold onto each other, so the high-frequency information is destroyed, not merely degraded.', 'foldover distortion', 1],
  ['Analog transmission', 'Transmission of a continuously varying, non-discrete signal. Every noise perturbation becomes part of the signal permanently, so noise can only be amplified along with it.', 'analogue signal', 1],
  ['Digital transmission', 'Transmission of information as a finite set of discrete symbols. Because the receiver makes decisions at a threshold and re-emits clean symbols, accumulated noise does not propagate down the link.', 'digital signal', 1],
  ['Decision threshold', 'The amplitude boundary a receiver uses to decide which symbol was transmitted. Noise that pushes a sample across the threshold produces a decision error.', 'threshold', 1],
  ['Regenerative repeater', 'A repeater that re-decides and re-times a digital signal, restoring it to clean nominal levels. It removes accumulated noise instead of amplifying it.', 'regeneration', 1],
  ['Multiplexing', 'Sharing one transmission channel between several independent sources by interleaving them in time, frequency or code.', 'TDM, FDM, CDM', 1],
  ['Band-limiting', 'Restricting a signal to a finite highest frequency, which is the condition that makes the sampling theorem applicable.', 'band-limited', 1],
  ['Nyquist rate', 'The theoretical minimum sampling rate f_s ≥ 2·f_max, equal to twice the highest frequency present in the input.', 'samples/s', 1],
  ['Nyquist frequency', 'Half the sampling frequency, f_s/2. Any input component above it folds down into the baseband.', 'Hz', 1],
  ['Sampling theorem', 'The Nyquist–Shannon theorem: a band-limited signal with highest frequency f_max can be reconstructed exactly from samples taken at f_s ≥ 2·f_max.', 'Shannon', 1],
  ['Anti-aliasing filter', 'A low-pass filter placed before the sampler that removes energy above f_s/2. It must be ideal in theory and steep in practice.', 'anti-aliasing', 1],
  ['Reconstruction filter', 'The low-pass filter after the DAC that removes the spectral images introduced by sampling and returns the signal to baseband.', 'reconstruction LPF', 1],
  ['Natural sampling', 'Sampling in which each sample equals the instantaneous input value at the sampling instant. Ideal, but it requires an infinitely fast switch.', 'natural sampling', 1],
  ['Sample-and-hold', 'A circuit that switches onto the input for a short acquisition interval and then holds that voltage on a capacitor while the converter reads it. Without it an ADC would see a moving voltage during conversion.', 'S/H', 1],
  ['Flat-top sampling', 'Sampling with a finite-width switching pulse, so the sample is the average of the input over the aperture interval. Practically achievable; it introduces droop and aperture distortion.', 'flat-top, sample-and-hold', 1],
  ['Aperture time', 'The time during which the sampling switch stays closed and the sample is being acquired. The input changing during this time causes aperture distortion.', 't_a', 1],
  ['Acquisition time', 'The time a sample-and-hold circuit needs to settle to the required accuracy after the switch closes. It sets the maximum achievable sample rate.', 't_acq', 1],
  ['Conversion time', 'The time an ADC or DAC needs to complete one conversion.', 't_conv', 1],
  ['Droop', 'Decay of a held sample caused by leakage resistance and stray capacitance in the hold circuit. In flat-top sampling it produces a systematic error that grows with input frequency.', 'droop distortion', 1],
  ['Aperture distortion', 'The error produced because the input changed during the aperture interval, so the held value is an average rather than the instantaneous value.', 'aperture effect', 1],
  ['PAM', 'Pulse Amplitude Modulation: a carrier train whose pulse amplitudes carry the samples. PAM on its own is analog pulse modulation, not a code.', 'pulse amplitude modulation', 1],
  ['PWM', 'Pulse Width Modulation, also called Pulse Duration Modulation: the information is carried by the duration of each pulse.', 'pulse width, PDM', 1],
  ['PPM', 'Pulse Position Modulation, also called Pulse Time Modulation: the information is carried by the time position of each pulse inside the symbol period.', 'pulse position, PLM', 1],
  ['PCM', 'Pulse Code Modulation: sampling followed by quantisation and binary encoding, producing a digital bitstream rather than a sequence of pulse amplitudes.', 'pulse code modulation', 1],
  ['SNR', 'Signal-to-Noise Ratio: the ratio of wanted signal power to noise power, usually expressed in decibels as 10·log₁₀(P_s/P_n).', 'signal-to-noise ratio', 1],
  ['BER', 'Bit Error Rate: the probability that a transmitted bit is decided incorrectly, measured empirically as errors divided by total bits.', 'bit error rate', 1],
  ['Aliasing spectrum', 'The repeating spectral images of a sampled signal, centred on integer multiples of the sampling frequency. When the images overlap, they cannot be separated.', 'replicas, images', 1],

  ['Quantisation', 'Mapping a continuous sample amplitude onto one of L discrete levels. The difference between the sample and its level is the quantisation error.', 'quantisation, quantization', 2],
  ['Quantisation noise', 'The sum of all individual quantisation errors. Usually modelled as additive white noise once many samples contribute.', 'quantisation error', 2],
  ['Resolution', 'The smallest amplitude step the quantiser can represent, V_LSB. More bits means a smaller step and better resolution.', 'resolution', 2],
  ['Midrise quantiser', 'A uniform quantiser whose output levels sit at the interval mid-points, including one that would be zero in a midtread design. One output level represents the zero amplitude.', 'midrise', 2],
  ['Midtread quantiser', 'A uniform quantiser with an output level exactly at zero, giving a small dead zone around the origin. Useful when the signal spends time near zero.', 'midtread', 2],
  ['Saturation', 'A condition in which the input exceeds the representable range and the output clips to the end levels, producing large, unrecoverable error.', 'overload, clipping', 2],
  ['Companding', 'Compressing a signal with a non-linear law before quantisation and expanding it afterwards, so fine resolution is spent where signal energy is highest.', 'compression and expansion', 2],
  ['μ-law', 'A logarithmic companding law, F(x) = ln(1 + μ|x|) / ln(1 + μ), normalised so the domain [−1, 1] maps onto [−1, 1]. Used with μ = 255 in ITU-T G.711.', 'mu-law', 2],
  ['A-law', 'The piecewise logarithmic companding law used in ITU-T G.711 A-law, with a leading linear segment and log compression beyond it.', 'A-law', 2],
  ['DPCM', 'Differential Pulse Code Modulation: encodes the prediction error between the current sample and a prediction made from previous reconstructed samples.', 'differential PCM', 2],
  ['ADPCM', 'Adaptive DPCM: adapts the predictor and/or the step size to local signal statistics, improving quality at a given bit rate.', 'adaptive DPCM', 2],
  ['Dynamic range', 'The ratio of the largest amplitude a system can represent to the smallest amplitude change it can resolve — about 6.02 dB per bit for a uniform quantiser.', 'DR', 2],
  ['Idle-channel noise', 'The residual quantisation noise present on the channel when there is no signal — audible as hiss on a quiet telephone line.', 'idle channel noise', 2],
  ['Coding efficiency', 'The ratio of the information content of the codewords to the number of bits actually transmitted.', 'coding efficiency', 2],

  ['Delta modulation', 'One-bit differential encoding in which each bit simply says "step up" or "step down". The decoder integrates those steps to build a staircase approximation.', 'DM', 3],
  ['Slope overload', 'Distortion that occurs when the input changes faster than the DM staircase can follow, so the staircase lags systematically behind the signal.', 'slope distortion', 3],
  ['Granular noise', 'The small oscillatory error of a DM staircase when tracking a slow or constant signal. Smaller steps reduce it but raise slope-overload risk.', 'granular noise', 3],
  ['Adaptive delta modulation', 'Delta modulation whose step size grows when the input is changing quickly and shrinks when it is slow, so slope overload and granular noise no longer compete for one fixed step.', 'ADM', 3],
  ['Sigma-delta modulation', 'A feedback system in which the input is integrated before a low-resolution quantiser, so quantisation error is noise-shaped away from the signal band.', 'ΣΔ', 3],
  ['Noise shaping', 'Redistributing quantisation noise in frequency so that less of it falls inside the signal band. Oversampling alone does not achieve this.', 'noise shaping', 3],
  ['Oversampling', 'Sampling far above the Nyquist rate so that quantiser noise density spreads over a wider band and much of it can be filtered away.', 'OSR', 3],

  ['Bandwidth efficiency', 'Useful information rate per hertz of spectrum (bit/s/Hz). It rises with M-ary modulation and with tighter code rates, and is the reason the same data fits in less spectrum.', 'η', 4],
  ['Bit rate', 'Information rate in bits per second. R_b = R_s·log₂M for a fixed-length mapping of M symbols.', 'bps', 4],
  ['Baud rate', 'Symbol rate — the number of signal units per second, measured in baud. It equals the bit rate only for binary keying.', 'symbol rate', 4],
  ['Bits per symbol', 'log₂M, the number of bits conveyed by one symbol in an M-ary scheme.', 'bits per symbol', 4],
  ['Constellation', 'The geometric arrangement of the possible symbols on the in-phase / quadrature plane, together with their bit labels.', 'constellation diagram', 4],
  ['QAM', 'Quadrature Amplitude Modulation: combining amplitude and phase on two orthogonal carriers, giving square M-ary constellations such as 16- and 64-QAM.', 'quadrature amplitude modulation', 4],
  ['Orthogonality', 'The property that subcarriers are arranged so their spectra overlap yet sum to zero over a symbol interval, allowing simultaneous transmission with no mutual interference.', 'orthogonal', 4],
  ['Cyclic prefix', 'A copy of the end of an OFDM symbol pasted to its beginning, making the channel effectively circular so a simple FFT receiver removes multipath-induced ISI.', 'CP', 4],
  ['Processing gain', 'The ratio of spread bandwidth to unspread data bandwidth — the apparent SNR improvement from spreading, before accounting for the extra noise power a wideband receiver collects.', 'spreading factor', 4],
  ['DSSS', 'Direct Sequence Spread Spectrum: multiplying the data by a much faster pseudo-random chip sequence, spreading each bit over many chips.', 'direct sequence', 4],
  ['FHSS', 'Frequency Hopping Spread Spectrum: hopping the carrier pseudo-randomly over a set of channels while the data rate stays fixed.', 'frequency hopping', 4],
  ['Grey coding', 'Labelling a constellation so that neighbouring points differ by only one bit, so the commonest errors cost a single bit.', 'Gray mapping', 4],

  ['Carrier', 'A high-frequency reference sinusoid used as the transport medium for a lower-frequency modulating signal.', 'carrier wave', 5],
  ['Modulation index', 'For AM, m = V_m/V_c, the ratio of message amplitude to carrier amplitude. For FM, β = Δf/f_m, the deviation ratio.', 'modulation index', 5],
  ['Sideband', 'A frequency component created by modulation, shifted from the carrier by f_m for a single tone. AM produces an upper and a lower sideband.', 'sideband', 5],
  ['Frequency deviation', 'The peak deviation of instantaneous frequency from the carrier caused by the modulating signal.', 'Δf', 5],
  ['Overmodulation', 'AM operation with m > 1, where the envelope pinches toward zero and the message phase is partly reversed, producing distortion.', 'overmodulation', 5],
  ["Carson's rule", 'The engineering rule of thumb BW ≈ 2(Δf + f_m,max) for the bandwidth of an FM signal.', 'Carson rule', 5],
  ['Capture effect', 'In an FM limiter, when two signals arrive on the same channel the stronger one suppresses the weaker, instead of the two being summed as they would be in AM.', 'capture', 5],
  ['Pre-emphasis', 'Boosting high audio frequencies before FM transmission so the receiver can attenuate them, reducing high-frequency noise.', 'pre-emphasis', 5],
  ['De-emphasis', 'Attenuating high audio frequencies in the FM receiver to undo pre-emphasis and reduce the noise that was boosted.', 'de-emphasis', 5],
  ['Superheterodyne', 'A receiver that converts the incoming RF signal to a fixed intermediate frequency, then performs all selective filtering at that one frequency.', 'heterodyne', 5],
  ['Image frequency', 'An unwanted RF frequency that, when mixed with the local oscillator, produces the same intermediate frequency as the desired signal.', 'image', 5],
  ['Intermediate frequency', 'The fixed frequency to which a superheterodyne receiver converts every incoming channel, so one set of filters serves the whole band.', 'IF', 5],

  ['Hamming distance', 'The number of bit positions in which two codewords differ. A code can correct ⌊(d_min − 1)/2⌋ errors and detect d_min − 1.', 'd_min', 6],
  ['Redundancy', 'Extra information added to a message so that errors can later be detected or corrected.', 'redundancy', 6],
  ['CRC', 'Cyclic Redundancy Check: a polynomial division over GF(2) that produces a remainder used as a systematic error-detection code.', 'cyclic redundancy check', 6],
  ['FEC', 'Forward Error Correction: adding controlled redundancy so the receiver can correct errors without asking for retransmission.', 'forward error correction', 6],
  ['ARQ', 'Automatic Repeat reQuest: a feedback protocol in which the receiver requests retransmission of blocks it cannot accept.', 'repeat reQuest', 6],
  ['Stop-and-wait ARQ', 'The simplest ARQ: send one block, then wait for an acknowledgement or a timeout before sending the next.', 'stop-and-wait', 6],
  ['Go-Back-N ARQ', 'Sliding-window ARQ that discards the received block on any error and retransmits from the errored block onward.', 'GBN', 6],
  ['Selective Repeat ARQ', 'Sliding-window ARQ that buffers correctly received out-of-order blocks and retransmits only those that were lost.', 'SR', 6],
  ['Interleaving', 'Rearranging transmitted symbols so a burst error becomes several separated single errors after de-interleaving. Interleaving redistributes errors; the code detects or corrects them.', 'interleave', 6],
  ['Convolutional code', 'A continuous code in which a shift register produces n output bits from k input bits, usually decoded by the Viterbi algorithm.', 'convolutional', 6],
  ['Reed–Solomon code', 'A block code over GF(2^r) that corrects whole symbol bursts, with its strength concentrated near the start of the codeword.', 'RS', 6],
  ['Turbo code', 'Two or more convolutional codes combined with an interleaver and iterative decoding, approaching the Shannon limit at the cost of heavy computation.', 'turbo', 6],
  ['LDPC code', 'A sparse parity-check code decoded by belief propagation, giving near-Shannon-limit performance with high parallelism.', 'low-density parity-check', 6],
];

export const glossary: GlossaryEntry[] = RAW.map(([term, definition, synonyms, module]) => ({
  term,
  definition,
  synonyms,
  module,
}));

const glossaryMap = new Map(glossary.map((g) => [g.term, g]));

export const getGlossaryEntry = (term: string): GlossaryEntry | undefined => glossaryMap.get(term);

export const hasGlossaryEntry = (term: string): boolean => glossaryMap.has(term);