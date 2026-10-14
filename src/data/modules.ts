import type { ModuleMeta } from '@/types';

export const modules: ModuleMeta[] = [
  {
    id: 1,
    title: 'Digital Transmission and Sampling',
    shortTitle: 'Digital Transmission & Sampling',
    description:
      'Why digital links behave differently from analogue links, the Nyquist sampling theorem, what aliasing really does, and how sampling, quantisation and SNR/BER measurement fit together.',
    accent: 'var(--color-signal-400)',
    objectives: [
      'Explain what makes digital transmission different in principle, not just in appearance.',
      'Apply the Nyquist–Shannon sampling theorem and identify the Nyquist rate and frequency.',
      'Predict when aliasing will occur and name the filter that prevents it.',
      'Compare natural and flat-top sampling and explain aperture distortion and droop.',
      'Measure SNR in decibels and BER empirically, and explain why a short run cannot pin down BER tightly.',
    ],
  },
  {
    id: 2,
    title: 'Pulse Code Modulation',
    shortTitle: 'Pulse Code Modulation',
    description:
      'The complete analogue-to-digital conversion chain: sampling, uniform quantisation, binary coding, companding, and the differential techniques that trade bits for fidelity.',
    accent: 'var(--color-mag-500)',
    objectives: [
      'Trace a signal through the full PCM block diagram and name every stage.',
      'Calculate step size, level count, maximum quantisation error and SQNR.',
      'Encode a sample in sign-magnitude and folded binary and verify the codeword.',
      'Explain why companding exists and how μ-law and A-law distribute resolution.',
      'Describe how DPCM and ADPCM buy quality with fewer bits, and what limits them.',
    ],
  },
  {
    id: 3,
    title: 'Delta Modulation and Advanced PCM',
    shortTitle: 'Delta Modulation & ΣΔ',
    description:
      'One-bit differential encoding, the two distortions that bound it, adaptive step control, and the feedback architecture behind sigma-delta conversion.',
    accent: 'var(--color-vio-500)',
    objectives: [
      'Trace a delta-modulation encoder/decoder loop and read its bitstream.',
      'Identify slope overload and granular noise, and state the trade-off between them.',
      'Explain how adaptive step sizing resolves the fixed-step conflict.',
      'Describe the first-order sigma-delta loop and where its noise goes.',
      'Separate the contribution of oversampling from the contribution of noise shaping.',
    ],
  },
  {
    id: 4,
    title: 'Digital Passband Modulation',
    shortTitle: 'Digital Passband Modulation',
    description:
      'Moving bits onto carriers: ASK, FSK, PSK and QAM, the constellation picture that ties them together, the modem standards that used them, plus OFDM and spread spectrum.',
    accent: 'var(--color-gold-500)',
    objectives: [
      'Convert between bit rate, symbol rate and bandwidth for a given modulation.',
      'Draw and read a constellation diagram for PSK and square QAM orders.',
      'Explain why higher-order QAM needs a better channel for the same error rate.',
      'Place the historical modem standards by modulation and rate without over-claiming.',
      'Describe how OFDM achieves orthogonality and what the cyclic prefix solves.',
      'Contrast DSSS and FHSS: spreading a signal versus hopping between frequencies.',
    ],
  },
  {
    id: 5,
    title: 'Analog Modulation and Receivers',
    shortTitle: 'Analog Modulation & Receivers',
    description:
      'Amplitude, frequency and phase modulation; bandwidth and power budgets; the noise behaviour that separates them; and the superheterodyne receiver that made radio practical.',
    accent: 'var(--color-grn-500)',
    objectives: [
      'Calculate modulation index, percentage modulation, power and bandwidth for AM.',
      'Calculate FM deviation ratio, carrier swing and Carson bandwidth.',
      'Compare AM, FM and PM by information parameter, noise behaviour, bandwidth and complexity.',
      'Explain capture, pre-emphasis and de-emphasis, and why each exists.',
      'Trace a signal through a superheterodyne receiver and locate the image frequency.',
    ],
  },
  {
    id: 6,
    title: 'Error Detection and Correction',
    shortTitle: 'Error Detection & Correction',
    description:
      'From a single parity bit to CRC, Hamming codes, ARQ protocols, interleaving and modern FEC — and the honest limits of each.',
    accent: 'var(--color-blue-500)',
    objectives: [
      'Distinguish detection from correction, and compute Hamming distance.',
      'Compute a CRC remainder by polynomial division over GF(2) and verify it.',
      'Encode a Hamming(7,4) codeword, compute its syndrome and correct a single-bit error.',
      'Compare Stop-and-Wait, Go-Back-N and Selective Repeat throughput and behaviour.',
      'Explain what interleaving does, and — just as importantly — what it does not do.',
    ],
  },
];

export const moduleMap = new Map(modules.map((m) => [m.id, m]));

/** Accent colours, kept as raw values because canvas cannot resolve var(). */
export const moduleAccentHex: Record<number, string> = {
  1: '#00F0FF',
  2: '#FF00AA',
  3: '#A78BFA',
  4: '#FFD700',
  5: '#34D399',
  6: '#4FA8FF',
};