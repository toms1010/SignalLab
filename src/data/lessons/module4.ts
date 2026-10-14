import type { Lesson } from '@/types';

export const module4Lessons: Lesson[] = [
  {
    id: 'm4-dac',
    module: 4,
    index: 1,
    title: 'Digital-to-Analogue Conversion Fundamentals',
    sidebarLabel: 'Digital-to-analogue conversion',
    minutes: 9,
    summary: 'Bit rate, symbol rate and the difference between them — the arithmetic every modulation choice starts with.',
    keywords: ['bit rate', 'baud rate', 'bandwidth efficiency', 'symbols per second', 'framing'],
    objectives: [
      'Define bit rate and symbol rate with units.',
      'Compute R_b = R_s·log₂M and invert it.',
      'Explain why bit rate exceeds symbol rate for M > 2.',
      'Explain why framing and coding reduce payload throughput below R_b.',
      'Compute spectral efficiency for a stated bandwidth.',
    ],
    sections: [
      {
        heading: 'Two rates',
        paragraphs: [
          'The **[[Baud rate]]** R_s is the number of signal units (symbols) per second. The **[[Bit rate]]** R_b is the information rate in bits per second. They are related by R_b = R_s·log₂M, where M is the number of distinct symbols in the constellation.',
          'The units are the giveaway: baud counts symbols, bit/s counts bits. They are numerically equal only for binary keying, where M = 2.',
        ],
      },
      {
        heading: 'Reading the relationship both ways',
        bullets: [
          '16-QAM at 2400 baud → 2400 × 4 = 9600 bit/s.',
          '9600 bit/s using BPSK → 9600 baud.',
          'Same 9600 bit/s using 64-QAM → 2400 baud, so the narrowest possible bandwidth.',
          'That last point is the whole motivation for higher-order modulation: more bits per hertz, at the price of tighter noise margins.',
        ],
        note: {
          kind: 'limit',
          title: 'Real throughput is lower than R_b',
          body: 'R_b counts coded bits. Physical-layer framing, synchronisation, coding redundancy and higher-layer headers all consume part of it. A link carrying coded data at R_b delivers less user payload, and if symbols are not equally likely (Huffman, constrained codes) the information rate is R_s·H rather than R_s·log₂M.',
        },
      },
      {
        heading: 'Bandwidth efficiency',
        paragraphs: [
          'Spectral efficiency η = R_b/B, in bit/s/Hz. The theoretical ceiling for an M-ary scheme is log₂M, reached only with ideal Nyquist pulse shaping. Any roll-off reduces it, and coding trades net efficiency for a lower required Eb/N0.',
        ],
      },
    ],
    keyTerms: ['Bit rate', 'Baud rate', 'Bits per symbol', 'Constellation', 'Redundancy'],
    formulaIds: ['bit-baud', 'spectral-efficiency', 'linear-bw'],
    worked: {
      title: 'Three links, same bit rate',
      given: ['Target R_b = 9600 bit/s'],
      steps: [
        'BPSK: M = 2 → R_s = 9600 / 1 = 9600 baud.',
        'QPSK: M = 4 → R_s = 9600 / 2 = 4800 baud.',
        '16-QAM: M = 16 → R_s = 9600 / 4 = 2400 baud.',
        'With raised-cosine roll-off α = 0.35: B = 1.35·R_s → 12 960 Hz, 6480 Hz and 3240 Hz respectively.',
      ],
      answer: 'BPSK 9600 baud / 12.96 kHz; QPSK 4800 baud / 6.48 kHz; 16-QAM 2400 baud / 3.24 kHz — one eighth of the BPSK bandwidth for the same bit rate.',
    },
    applications: [
      'Modem and radio link design: the bandwidth plan starts from R_b and the required η.',
      'Choosing modulation order given a spectral mask.',
      'Capacity planning where the bandwidth is fixed and the rate is the objective.',
    ],
    misconceptions: [
      {
        myth: '"Baud is a unit of bit rate."',
        truth: 'Baud is a unit of symbol rate. A 2400-baud 16-QAM link carries 9600 bit/s.',
      },
      {
        myth: '"The bit rate tells you how much bandwidth you need."',
        truth: 'You need R_s, and R_s depends on the modulation order. Bit rate alone is not enough.',
      },
      {
        myth: '"Higher-order modulation always gives higher throughput."',
        truth: 'It gives higher spectral efficiency at the same BER, which requires a better channel. At a fixed SNR, using a higher order reduces the achievable throughput instead.',
      },
    ],
    conclusion:
      'R_b = R_s·log₂M is the pivot on which every bandwidth decision turns. It is a strictly arithmetic relationship, and it says nothing on its own about noise tolerance, which is where the cost of higher-order modulation actually appears.',
    related: ['m4-rate', 'm4-qam', 'm4-psk'],
    vizId: 'bit-comparison',
    vizInitial: { rb: 9600, m: 16, alpha: 0.35 },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T recommendations (V-series data modems)',
        detail: 'The standards that fixed real baud and bit rate combinations.',
        why: 'Historical confirmation of the numbers in the modem lesson.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'read',
        title: 'NPTEL — digital communication lectures',
        detail: 'Bit rate, symbol rate and spectral efficiency derivations.',
        why: 'Formal treatment of the relationship.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Bit / baud comparison panel in this lesson',
        detail: 'Change R_b and M and watch symbol rate, bandwidth and η update together.',
        why: 'Shows all three quantities responding to one control.',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — spectral efficiency',
        detail: 'Definitions and bounds.',
        why: 'Independent check on the log₂M ceiling.',
        href: 'https://mathworld.wolfram.com/SpectralEfficiency.html',
      },
    ],
  },

  {
    id: 'm4-ask',
    module: 4,
    index: 2,
    title: 'Amplitude Shift Keying',
    sidebarLabel: 'ASK (amplitude shift keying)',
    minutes: 7,
    summary: 'The simplest passband scheme, and the reason it rarely appears on its own in real systems.',
    keywords: ['ASK', 'OOK', 'amplitude', 'envelope detection', 'coherent detection', 'bandwidth'],
    objectives: [
      'Write the ASK waveform for a given bit string.',
      'Distinguish two-level ASK from on-off keying.',
      'Compare coherent and non-coherent detection.',
      'Explain why ASK is the most noise-sensitive binary scheme.',
      'Compute ASK bandwidth using the stated convention.',
    ],
    sections: [
      {
        heading: 'The waveform',
        paragraphs: [
          'ASK changes the carrier **amplitude** between two values to represent 0 and 1. With A₀ = 0 the scheme becomes on-off keying; with A₀ ≠ 0 it is two-level amplitude keying.',
          's(t) = A_i·cos(2πf_c t) for bit i. The two amplitudes must be chosen for a chosen detection threshold T_d; the threshold placement is what sets the error probability.',
        ],
      },
      {
        heading: 'Detection',
        bullets: [
          '**Coherent detection** — multiply by a synchronised carrier and integrate over the bit interval. Requires phase synchronisation, but gives the best performance.',
          '**Non-coherent (envelope) detection** — rectify and low-pass filter. Simple, but envelope detection is a square-law device and loses the linear relationship that coherent detection exploits.',
        ],
      },
      {
        heading: 'Why it is noise-sensitive',
        paragraphs: [
          'Amplitude is the parameter a receiver reads most directly, so additive noise translates one-for-one into a decision error. Coherent BPSK puts its two states 180° apart, doubling the distance the noise has to cross; two-level ASK with A₀ = 0 and A₁ = 1 has half that distance for the same power.',
          'ASK survives in real systems mainly as OOK in infrared remote controls and optical links, where the receiver is a photodiode and amplitude is the only thing it can measure at all.',
        ],
      },
      {
        heading: 'Bandwidth',
        paragraphs: [
          'Using the raised-cosine convention used throughout this course, B = (1 + α)·R_s. For binary keying R_s = R_b, so B = (1 + α)·R_b. The frequently quoted "bandwidth = N·baud" is the α = 0 limit of the same expression.',
        ],
      },
    ],
    keyTerms: ['Baud rate', 'Constellation', 'SNR', 'BER'],
    formulaIds: ['bit-baud', 'linear-bw'],
    worked: {
      title: 'Ask bandwidth and power efficiency',
      given: ['R_b = 1200 bit/s', 'α = 0.35'],
      steps: [
        'Binary keying: R_s = R_b = 1200 baud.',
        'B = (1 + 0.35) × 1200 = 1620 Hz.',
        'Compare coherent BPSK at the same bit rate: same 1620 Hz, but with a coherent detection gain of about 3 dB at low BER.',
      ],
      answer: '1620 Hz occupied bandwidth for both, with ASK needing roughly 3 dB more Eb/N0 than coherent BPSK for the same error rate.',
    },
    applications: [
      'Infrared remote controls and optocouplers (on-off keying).',
      'RFID backscatter, where amplitude or phase is switched by the tag.',
      'Low-cost ASK radio links and legacy modems.',
    ],
    misconceptions: [
      {
        myth: '"ASK is more bandwidth-efficient than PSK."',
        truth: 'For the same symbol rate they occupy the same bandwidth. ASK is less power-efficient, not less bandwidth-efficient.',
      },
      {
        myth: '"ASK does not need synchronisation."',
        truth: 'Only non-coherent (envelope) detection avoids carrier phase synchronisation, and it pays for it in performance. Coherent ASK needs the same lock as any linear modulation.',
      },
      {
        myth: '"More amplitude levels make ASK efficient."',
        truth: 'Multi-level amplitude keying exists, but it has a worse average power for the same minimum distance than using phase as well — which is why QAM uses both.',
      },
    ],
    conclusion:
      'ASK is the base case: change amplitude, everything else follows. It is cheap to generate and to detect non-coherently, and it is the most noise-sensitive of the simple schemes because amplitude is exactly the parameter noise attacks. Real systems that keep it usually have no choice — optical and inductive coupling measure amplitude whether they like it or not.',
    related: ['m4-fsk', 'm4-psk', 'm4-dac'],
    vizId: 'mod-waveforms',
    vizInitial: { scheme: 'ASK', bits: '10110100', rs: 4, fc: 22 },
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — digital communication',
        detail: 'ASK modulation and detection with noise analysis.',
        why: 'Derivation of the coherent and non-coherent error probabilities.',
        href: 'https://ocw.mit.edu/search/?q=digital%20communication',
      },
      {
        kind: 'simulate',
        title: 'Waveform generator in this lesson',
        detail: 'Type a bit string and watch the amplitude change in step with it.',
        why: 'The mapping between bits and amplitude is clearest as a waveform.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — modulation sections',
        detail: 'Practical transmitter and detector circuits.',
        why: 'Circuit context for the ideal waveform.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — amplitude-shift keying',
        detail: 'Formal definition and spectrum.',
        why: 'Independent reference for the modulation definition.',
        href: 'https://mathworld.wolfram.com/AmplitudeShiftKeying.html',
      },
    ],
  },

  {
    id: 'm4-fsk',
    module: 4,
    index: 3,
    title: 'Frequency Shift Keying',
    sidebarLabel: 'FSK (frequency shift keying)',
    minutes: 8,
    summary: 'Changing frequency instead of amplitude buys noise immunity and costs bandwidth.',
    keywords: ['FSK', 'mark and space', 'frequency deviation', 'coherent', 'non-coherent', 'bandwidth'],
    objectives: [
      'Write the FSK waveform and identify mark and space frequencies.',
      'Define the frequency separation and relate it to the modulation index.',
      'Compare coherent and non-coherent FSK detection.',
      'Explain the noise advantage of FSK over ASK.',
      'Compute FSK bandwidth from deviation and symbol rate.',
    ],
    sections: [
      {
        heading: 'The waveform',
        paragraphs: [
          'FSK switches the carrier between two frequencies, f₁ for mark (usually 1) and f₀ for space (usually 0). s(t) = cos(2πf_i t) during bit i.',
          'A key design choice is the separation. Define the centre frequency f_c = (f₁ + f₀)/2 and the deviation Δf = (f₁ − f₀)/2. The modulation index of the equivalent FM tone is then β = Δf/R_s, and it — not f_c — determines the bandwidth.',
        ],
      },
      {
        heading: 'Detection',
        bullets: [
          '**Coherent:** multiply by both recovered tones and compare the two correlator outputs. Gives about 3 dB better performance than non-coherent detection at low BER.',
          '**Non-coherent:** compare the energy in two bandpass filters. Simpler, needs no phase reference, and costs roughly 1–3 dB.',
        ],
      },
      {
        heading: 'Noise behaviour and bandwidth',
        paragraphs: [
          'FSK is markedly more noise-tolerant than ASK: a frequency discriminator output is a frequency, and noise perturbation of frequency is small compared with the deliberate shift. The price is bandwidth, because two carriers plus their modulation sidebands occupy more spectrum than one.',
          'Bandwidth is usually estimated with the same engineering approximation used for FM: B ≈ 2(Δf + R_s/2). The cruder textbook rule "frequency separation + R_s" ignores the symbol pulse spectrum and is not used here.',
        ],
      },
    ],
    keyTerms: ['Baud rate', 'Frequency deviation', 'Modulation index', "Carson's rule", 'SNR'],
    formulaIds: ['fsk-bw', 'bit-baud'],
    worked: {
      title: 'Separation, index and bandwidth',
      given: ['f₁ = 1300 Hz, f₀ = 1100 Hz, R_s = 300 baud'],
      steps: [
        'Centre frequency f_c = 1200 Hz.',
        'Deviation Δf = (1300 − 1100)/2 = 100 Hz.',
        'Modulation index β = 100 / 300 = 0.33 — narrowband FSK.',
        'Bandwidth by the Carson-type approximation: B ≈ 2(100 + 150) = 500 Hz.',
      ],
      answer: 'β = 0.33, B ≈ 500 Hz — about 1.67 times the symbol rate.',
    },
    applications: [
      'Low-speed telemetry and radio-control links.',
      'Bluetooth uses GFSK; LoRa uses chirp FSK with very narrow bandwidth.',
      'Legacy telephone modems (Bell 103 was FSK) and pager systems.',
    ],
    misconceptions: [
      {
        myth: '"FSK is narrowband, so it is always narrowband."',
        truth: 'Bandwidth depends on the deviation relative to the symbol rate, not on the scheme name. Binary FSK with a wide separation behaves like wideband FM.',
      },
      {
        myth: '"FSK is immune to noise."',
        truth: 'It is more tolerant than ASK because frequency is a robust parameter — not immune. At the same Eb/N0, non-coherent FSK still has a finite BER.',
      },
      {
        myth: '"Bandwidth = (f₁ − f₀) + R_s."',
        truth: 'That is a rough rule. This course uses B ≈ 2(Δf + R_s/2), which accounts for the symbol pulse spectrum.',
      },
    ],
    conclusion:
      'FSK trades spectrum for noise tolerance by moving the information into a more robust parameter. Its bandwidth is set by the deviation relative to the symbol rate, and its detection can be made coherent or non-coherent depending on whether phase synchronisation is affordable.',
    related: ['m4-ask', 'm4-psk', 'm4-rate'],
    vizId: 'mod-waveforms',
    vizInitial: { scheme: 'FSK', bits: '11001011', rs: 5, fc: 20, sep: 0.14 },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T V.21 and V.22 recommendations',
        detail: 'FSK-based modem standards with stated rates.',
        why: 'Historical FSK implementations with published parameters.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'Waveform generator in this lesson',
        detail: 'Watch the carrier frequency step between the two tones.',
        why: 'The mark/space mapping is obvious in the waveform and invisible in a constellation.',
      },
      {
        kind: 'read',
        title: 'NPTEL — digital communication lectures',
        detail: 'FSK modulation index, bandwidth and detection.',
        why: 'Formal treatment of β and the bandwidth estimate.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'advanced',
        title: 'GNU Radio documentation',
        detail: 'Reference FSK modulator and demodulator implementations.',
        why: 'Shows coherent and non-coherent detection in code.',
        href: 'https://www.gnuradio.org/doc/',
      },
    ],
  },

  {
    id: 'm4-psk',
    module: 4,
    index: 4,
    title: 'Phase Shift Keying',
    sidebarLabel: 'PSK, QPSK, 8-PSK',
    minutes: 9,
    summary: 'Constant amplitude, changing phase — and the constellation diagram that makes the comparison between schemes obvious.',
    keywords: ['BPSK', 'QPSK', '8-PSK', 'constellation', 'Gray coding', 'phase', 'nearest neighbour'],
    objectives: [
      'Write the PSK waveform for a given symbol sequence.',
      'Draw and read constellations for BPSK, QPSK and 8-PSK.',
      'Explain why QPSK has the same BER as BPSK at the same Eb/N0.',
      'Explain Gray labelling and what it buys.',
      'Compute minimum point distance for an M-PSK constellation.',
    ],
    sections: [
      {
        heading: 'The waveform',
        paragraphs: [
          'PSK holds the amplitude constant and varies the phase: s(t) = A·cos(2πf_c t + θ_n) for symbol n. BPSK is two phases, 0 and π.',
          '**QPSK** uses four phases 90° apart, carrying 2 bits per symbol — four amplitude states. Because all four points lie on a circle of the same radius, the average energy per symbol equals that of BPSK, so QPSK achieves the same BER as BPSK at the same Eb/N0 while carrying twice the data in the same bandwidth.',
          '**8-PSK** uses eight phases spaced 45° apart, carrying 3 bits per symbol. The angular spacing is now half that of QPSK, so the same noise causes more decision errors.',
        ],
      },
      {
        heading: 'Reading a constellation',
        bullets: [
          'The **[[Constellation]]** is the set of possible (I, Q) points with their bit labels.',
          'Minimum distance d_min between any two points is the noise margin a decision device must overcome.',
          'For M-PSK with unit amplitude, d_min = 2·sin(π/M), so it shrinks quickly: 2.00 (BPSK), 1.41 (QPSK), 0.765 (8-PSK), 0.765 (16-PSK).',
          'QPSK matching BPSK follows from its d_min being √2 with twice the energy — the two effects cancel exactly.',
        ],
      },
      {
        heading: 'Gray coding',
        paragraphs: [
          '[[Grey coding]] labels neighbouring points so that adjacent labels differ in only one bit. The point is that the most probable errors — those between nearest neighbours — then cost exactly one bit instead of several.',
          'For 8-PSK Gray labelling, a single nearest-neighbour error costs 1 bit, while an error two steps away costs 2 bits and four steps away costs 3.',
          'The laboratory builds constellations with Gray labelling by default; turn it off to see the bit-error cost jump.',
        ],
      },
      {
        heading: 'Implementation note',
        paragraphs: [
          'Practical QPSK is usually generated as two independent BPSK signals on the in-phase and quadrature carriers. That is what the laboratory plots as the I and Q axes — the "quadrature" in QPSK is not a description, it is the structure of the modulator.',
        ],
      },
    ],
    keyTerms: ['Constellation', 'QAM', 'Bits per symbol', 'Grey coding', 'SNR'],
    formulaIds: ['bit-baud', 'linear-bw', 'spectral-efficiency'],
    worked: {
      title: 'Minimum distance for M-PSK',
      given: ['Unit-amplitude M-PSK'],
      steps: [
        'BPSK (M=2): d_min = 2·sin(90°) = 2.000',
        'QPSK (M=4): d_min = 2·sin(45°) = 1.414',
        '8-PSK (M=8): d_min = 2·sin(22.5°) = 0.765',
        '16-PSK (M=16): d_min = 2·sin(11.25°) = 0.390',
      ],
      answer: 'The minimum distance falls by roughly a factor of 4 per bit for high M, which is why higher-order PSK demands a proportionally better Eb/N0.',
    },
    applications: [
      'Satellite and space links (QPSK) where a low-power nonlinear amplifier makes amplitude linearisation hard.',
      'GSM uses GMSK, a Gaussian-filtered FSK; LTE and 5G use QPSK for coverage-limited links.',
      'Legacy modems V.22bis through V.34.',
    ],
    misconceptions: [
      {
        myth: '"QPSK performs better than BPSK because it carries more bits."',
        truth: 'At the same Eb/N0 the symbol error rate is identical. QPSK simply delivers twice the data in the same bandwidth.',
      },
      {
        myth: '"8-PSK is only slightly worse than QPSK."',
        truth: 'Its minimum distance is about 54 % of QPSK\'s, so it needs roughly 3 dB more Eb/N0 for the same BER.',
      },
      {
        myth: '"Constellation points must be a circle for PSK."',
        truth: 'Only for phase modulation. Non-circular arrangements belong to QAM, where amplitude carries information too.',
      },
    ],
    conclusion:
      'PSK keeps amplitude constant and spends the whole energy budget on phase. The constellation makes the cost of raising M immediately visible: the points get closer together, and the noise margin shrinks. QPSK is the sweet spot where that cost is still zero.',
    related: ['m4-qam', 'm4-fsk', 'm4-dac'],
    vizId: 'bit-constellation',
    vizInitial: { scheme: 'PSK', order: 8, bits: '11001011', gray: true },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T V.32 recommendation',
        detail: 'A published PSK/QAM modem specification with its constellation.',
        why: 'A real standard you can compare against the laboratory constellation.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'Constellation builder in this lesson',
        detail: 'Type bits, switch Gray labelling off, and count the bit cost of a neighbour error.',
        why: 'Makes Gray coding a measurable property rather than a convention.',
      },
      {
        kind: 'read',
        title: 'NPTEL — digital communication',
        detail: 'PSK modulation, constellations and detection.',
        why: 'Derivation of d_min and its relation to BER.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — phase-shift keying',
        detail: 'Formal definitions of the PSK family.',
        why: 'Reference for signal definitions.',
        href: 'https://mathworld.wolfram.com/PhaseShiftKeying.html',
      },
    ],
  },

  {
    id: 'm4-qam',
    module: 4,
    index: 5,
    title: 'Quadrature Amplitude Modulation',
    sidebarLabel: 'QAM and the I/Q plane',
    minutes: 10,
    summary: 'Amplitude and phase together: more bits per hertz, bought with a proportionally tighter noise margin.',
    keywords: ['QAM', '16-QAM', '64-QAM', 'I/Q', 'constellation', 'EVM', 'spectral efficiency'],
    objectives: [
      'Explain how I and Q components combine into one transmitted symbol.',
      'Read bit groupings from a QAM constellation.',
      'Compute minimum distance for square QAM orders.',
      'Explain why higher-order QAM needs better SNR for the same BER.',
      'Interpret EVM on a measured constellation.',
    ],
    sections: [
      {
        heading: 'Two carriers, one symbol',
        bullets: [
          '**In-phase (I)** — cos(2πf_c t) · I_n',
          '**Quadrature (Q)** — sin(2πf_c t) · Q_n, which is the same carrier delayed by 90°.',
          's(t) = I_n·cos(2πf_c t) − Q_n·sin(2πf_c t).',
        ],
        paragraphs: [
          'Every point on the I/Q plane is one possible (I, Q) pair, hence one possible symbol. Because the two carriers are **[[Orthogonality|orthogonal]]**, they can be transmitted simultaneously without interference, so the pair carries one complex symbol rather than two independent real ones.',
        ],
      },
      {
        heading: 'Which orders are square',
        paragraphs: [
          'Square QAM grids are 4, 16, 64 and 256-QAM (and 2). Orders 8, 32 and 128 are **cross-QAM** — a rectangle with unequal numbers of points on each axis — and are genuinely different mappings, not a 4×2 grid.',
          'This laboratory draws square QAM only, and states plainly when an order is unsupported rather than drawing a 4×2 arrangement and calling it "8-QAM". The reason is that cross-QAM requires its own bit-labelling convention, and a wrong label is worse than an honest omission.',
        ],
      },
      {
        heading: 'Minimum distance and the noise trade',
        paragraphs: [
          'For square M-QAM with unit average power the minimum distance scales as roughly √(6/(M−1)) normalised energy, so quadrupling the order shrinks the minimum distance by about half. To hold the same BER the system needs roughly 6 dB more Eb/N0 for each doubling of the order.',
          'Equivalently: at fixed SNR, moving to a higher order *reduces* achievable throughput, because the link can no longer close the link at the target BER.',
        ],
      },
      {
        heading: 'Bit groupings and Gray labelling',
        paragraphs: [
          'For 16-QAM the first two bits label the row (Q) and the last two the column (I), each axis Gray-coded over 4 levels. A single nearest-neighbour error flips exactly one bit.',
          'For 64-QAM each axis carries 3 bits over 8 levels, for 6 bits per symbol.',
        ],
      },
      {
        heading: 'EVM',
        paragraphs: [
          '**Error vector magnitude** is the RMS distance of the received points from their ideal positions, normalised to the outermost reference: EVM = (RMS error) / (peak-to-average reference). It is the standard single-number health metric for a QAM link.',
          'A constellation with visible radial scatter has poor EVM; a constellation with rotation or a gain error shows a different pattern entirely — which is why EVM alone does not distinguish all impairments.',
        ],
      },
    ],
    keyTerms: ['Constellation', 'QAM', 'Bits per symbol', 'Orthogonality', 'Grey coding'],
    formulaIds: ['bit-baud', 'spectral-efficiency', 'linear-bw'],
    worked: {
      title: 'Minimum distance of square M-QAM at unit average energy',
      given: ['Normalised so average E_s = 1'],
      steps: [
        '16-QAM (±1, ±3 grid): minimum distance d = 2/√10 = 0.632.',
        '64-QAM (±1, ±3, ±5, ±7 grid): minimum distance d = 2/√42 = 0.309.',
        '256-QAM: minimum distance d = 2/√170 = 0.153.',
        'Each doubling of the order halves d_min and needs roughly 6 dB more Eb/N0.',
      ],
      answer: '16-QAM 0.632, 64-QAM 0.309, 256-QAM 0.153 — halving per doubling of the order.',
    },
    applications: [
      'Cable and DSL: 256-QAM and 1024-QAM downlinks at high SNR.',
      'Wi-Fi: 64-QAM at 5 GHz, 256-QAM at 6 GHz with careful front-end design.',
      'Telephone modems V.32 onward, where 16-QAM and TCM pushed rates up at a fixed 2400 baud.',
    ],
    misconceptions: [
      {
        myth: '"8-QAM is 4×2 points on a rectangle."',
        truth: '8-QAM is specifically a cross-shaped 8-point constellation with its own labelling convention. Drawing 4×2 and calling it 8-QAM is wrong.',
      },
      {
        myth: '"Higher-order QAM always gives a faster link."',
        truth: 'Only when the channel is good enough. At fixed SNR a higher order closes no link, so throughput drops.',
      },
      {
        myth: '"A good EVM means the constellation is healthy."',
        truth: 'EVM captures radial error only. Carrier rotation, gain error and phase imbalance each need their own measurement.',
      },
    ],
    conclusion:
      'QAM uses both amplitude and phase on two orthogonal carriers, which is why it beats PSK on spectral efficiency. The price is visible in the constellation: the points crowd together as the order rises, and each doubling of the order halves the distance the receiver has to overcome.',
    related: ['m4-psk', 'm4-rate', 'm5-comparison'],
    vizId: 'qam',
    vizInitial: { order: 16, noise: 0.06 },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T V.32 / V.32bis recommendations',
        detail: 'Modem standards with published QAM mappings.',
        why: 'Historical QAM constellations you can compare against.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'QAM laboratory in this lesson',
        detail: 'Add noise and watch decision regions turn into symbol errors.',
        why: 'EVM and symbol error rate are visible at once.',
      },
      {
        kind: 'read',
        title: 'NPTEL — digital communication',
        detail: 'QAM signal space, detection and error probabilities.',
        why: 'Derives the probability of symbol error in a square constellation.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — QAM',
        detail: 'Formal signal-space description.',
        why: 'Independent definition and diagrams.',
        href: 'https://mathworld.wolfram.com/QuadratureAmplitudeModulation.html',
      },
    ],
  },

  {
    id: 'm4-rate',
    module: 4,
    index: 6,
    title: 'Bit Rate, Baud Rate and Bandwidth',
    sidebarLabel: 'Bit rate, baud, bandwidth',
    minutes: 9,
    summary: 'A worked comparison table, and the difference between the theoretical and practical occupied bandwidth.',
    keywords: ['bit rate', 'baud', 'bandwidth', 'roll-off', 'raised cosine', 'Nyquist', 'spectral efficiency'],
    objectives: [
      'Fill in a comparison table across six modulations from R_b alone.',
      'Compute occupied bandwidth using the raised-cosine convention.',
      'Explain what the roll-off factor α controls and why it is not zero in practice.',
      'Distinguish theoretical from practical bandwidth figures.',
      'Explain why "bandwidth = symbol rate" is only a limiting case.',
    ],
    sections: [
      {
        heading: 'The convention used here',
        paragraphs: [
          'For raised-cosine pulse-shaped linear modulations (ASK, PSK, QAM), B = (1 + α)·R_s. For FSK the deviation-based estimate B ≈ 2(Δf + R_s/2) is used instead.',
          'Both are conventions, and both are stated wherever they appear. "Bandwidth = N·baud" is the α = 0 limit of the first — a useful shorthand, but only a limit.',
        ],
      },
      {
        heading: 'Why α is not zero',
        bullets: [
          'α = 0 requires an infinitely long pulse — physically impossible.',
          'Larger α gives a smoother spectrum and linear phase, which tolerates timing error.',
          'α between 0.2 and 0.35 is typical: enough margin for filter and clock mismatch without wasting much spectrum.',
          'α = 1 doubles the bandwidth relative to α = 0.',
        ],
      },
      {
        heading: 'The table',
        paragraphs: [
          'The panel builds the same table live. Every row uses one bit rate and one roll-off factor, so the comparison between schemes is like-for-like: the difference you see is the modulation order, nothing else.',
        ],
      },
    ],
    keyTerms: ['Bit rate', 'Baud rate', 'Bits per symbol', 'Bandwidth efficiency'],
    formulaIds: ['bit-baud', 'linear-bw', 'fsk-bw', 'spectral-efficiency'],
    worked: {
      title: 'Same bit rate, six schemes',
      given: ['R_b = 9600 bit/s', 'α = 0.35 (linear schemes)'],
      steps: [
        'BPSK: R_s = 9600 → B = 1.35 × 9600 = 12 960 Hz, η = 0.74',
        'QPSK: R_s = 4800 → B = 6480 Hz, η = 1.48',
        '8-PSK: R_s = 3200 → B = 4320 Hz, η = 2.22',
        '16-QAM: R_s = 2400 → B = 3240 Hz, η = 2.96',
        '64-QAM: R_s = 1600 → B = 2160 Hz, η = 4.44',
        '64-QAM theoretical ceiling is 6 bit/s/Hz; we achieve 4.44 because α > 0.',
      ],
      answer: 'Bandwidth falls by a factor of 6 from BPSK to 64-QAM for the same bit rate, with efficiency rising from 0.74 to 4.44 bit/s/Hz.',
    },
    applications: [
      'Modem and radio specification sheets.',
      'Frequency planning and spectrum allocation.',
      'Choosing modulation order against a spectral mask.',
    ],
    misconceptions: [
      {
        myth: '"Bandwidth = symbol rate."',
        truth: 'Only at α = 0. Every real pulse has α > 0, so the true bandwidth is wider. Both numbers are stated wherever a bandwidth is quoted here.',
      },
      {
        myth: '"Spectral efficiency of 16-QAM is 4 bit/s/Hz."',
        truth: '4 bit/s/Hz is the noiseless ceiling. Real links achieve less because of roll-off, coding redundancy and filtering.',
      },
      {
        myth: '"Narrower bandwidth means a faster link."',
        truth: 'Only at a fixed bit rate. At a fixed SNR, demanding less bandwidth means higher-order modulation, which reduces the achievable BER.',
      },
    ],
    conclusion:
      'R_b = R_s·log₂M plus B = (1+α)R_s is the whole of the rate/bandwidth story for linear modulations. Everything else in this module — the modem standards, the spectral masks, the choice of order — is an application of those two lines, given a target SNR.',
    related: ['m4-dac', 'm4-qam', 'm4-modems'],
    vizId: 'bit-comparison',
    vizInitial: { rb: 9600, alpha: 0.35 },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T V-series recommendations',
        detail: 'Published baud rates and bandwidths for real modems.',
        why: 'Historical confirmation of the numbers in the comparison table.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'read',
        title: 'NPTEL — digital communication lectures',
        detail: 'Pulse shaping, roll-off and bandwidth efficiency.',
        why: 'Derives the raised-cosine spectrum.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Bit / baud comparison panel in this lesson',
        detail: 'Build the full six-row table from one bit rate.',
        why: 'The pattern is obvious once the table is generated from live values.',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — Nyquist rate',
        detail: 'The noiseless channel bound behind the log₂M ceiling.',
        why: 'Where the theoretical efficiency limit comes from.',
        href: 'https://mathworld.wolfram.com/NyquistRate.html',
      },
    ],
  },

  {
    id: 'm4-modems',
    module: 4,
    index: 7,
    title: 'Telephone Modem Standards',
    sidebarLabel: 'Telephone modems',
    minutes: 8,
    summary:
      'How a 300-baud line reached 33.6 kbit/s — a historical reference, presented with the caveat it deserves.',
    keywords: ['modem', 'V.22bis', 'V.32', 'V.32bis', 'V.34', 'V.90', '56k', 'QAM', 'trellis coding'],
    objectives: [
      'Place the Bell and ITU-T modem families in rate order.',
      'Associate each generation with its principal modulation change.',
      'Explain why V.90/V.92 changed the modem itself.',
      'State which figures are historical references rather than specifications.',
      'Explain trellis-coded modulation and its motivation.',
    ],
    sections: [
      {
        heading: 'A caution about these numbers',
        paragraphs: [
          'The table below gives the **commonly published** data rates and principal modulation families for the historical modem standards. They are provided as an engineering reference and a way to see the progression.',
          'They are not a substitute for the ITU-T recommendations themselves. Anything you rely on — a design, an exam answer about exact parameters — should be checked against the actual recommendation text or a reputable secondary source.',
        ],
      },
      {
        heading: 'Bell series (1960s–70s)',
        bullets: [
          '**Bell 103** — 300 bit/s, FSK, the first commercial Bell telephone data modem.',
          '**Bell 202** — 1200 bit/s, PSK.',
          '**Bell 212** — 1200 bit/s, QPSK-style modulation.',
          '**Bell 201 / 208** — 2400 bit/s.',
          '**Bell 209** — 4800 bit/s, early QAM.',
        ],
      },
      {
        heading: 'ITU-T V-series (1980s–90s)',
        bullets: [
          '**V.22bis** — 2400 bit/s, typically 600 baud with 4 bits per symbol (QPSK).',
          '**V.32** — 9600 bit/s, 2400 baud, 32-QAM. The step that made high-speed dial-up practical.',
          '**V.32bis** — 14 400 bit/s at the same 2400 baud, using 16-QAM with trellis coding.',
          '**V.32terbo** — 19 200 bit/s at 2400 baud, trellis-coded 256-QAM.',
          '**V.33** — 14 400 bit/s, 2400 baud, 4-dimensional QAM.',
          '**V.34** — 28 800 bit/s at 3360 baud, 512-QAM with trellis coding and echo cancellation.',
        ],
      },
      {
        heading: 'The 56 k modem change',
        paragraphs: [
          '**V.90** (and later **V.92**) broke the pattern in an important way. The bottleneck above was not the line but the *local loop*: the analogue-to-digital conversion in the telephone exchange was quantised to 8 bits at 8 kHz, capping the achievable rate at about 56 kbit/s.',
          'V.90 therefore kept the existing 33.6 kbit/s *upstream* modem but used the exchange\'s own PCM encoding downstream, "borrowing" 8 kHz samples straight out of the digital network. The result was asymmetric — fast down, slow up — which is exactly how it performed.',
        ],
      },
      {
        heading: 'Trellis-coded modulation',
        paragraphs: [
          'From V.32bis onward the gains came from **trellis-coded modulation**: a convolutional code with a small rate (typically 2/3) plus a subset of the constellation points chosen by the convolutional encoder. The redundancy buys about 3.5 dB of coding gain at the cost of added complexity and a small loss of spectral efficiency.',
        ],
      },
    ],
    keyTerms: ['Constellation', 'QAM', 'Bits per symbol', 'FEC', 'Redundancy'],
    formulaIds: ['bit-baud', 'spectral-efficiency'],
    worked: {
      title: 'Check the V.32 arithmetic',
      given: ['V.32: 9600 bit/s at 2400 baud'],
      steps: [
        'Bits per symbol = 9600 / 2400 = 4.',
        'log₂M = 4 → M = 16.',
        'The published description of V.32 uses 32-QAM with trellis-coded modulation, which is why the naive M = 16 estimate does not match exactly.',
        'Conclusion: the bit-rate/baud arithmetic and the constellation description are separate claims, and both must be read from the standard.',
      ],
      answer: '9600/2400 = 4 bits per symbol; the simple M = 16 estimate understates the actual 32-point trellis-coded scheme, which is why the standard must be consulted.',
    },
    applications: [
      'Understanding why spectral efficiency rose faster than baud rate.',
      'Reading historical data-communication equipment specifications.',
      'Motivating trellis coding and, later, turbo and LDPC codes.',
    ],
    misconceptions: [
      {
        myth: '"Higher modem rates meant higher baud rates."',
        truth: 'From V.32 onward the rate rose mainly by adding bits per symbol at a fixed 2400 baud. The line could not carry more baud.',
      },
      {
        myth: '"56k modems used a faster modulation."',
        truth: 'V.90/V.92 used the telephone network\'s existing 8-bit PCM coding downstream rather than a faster modem modulation. The upgrade was on the network side.',
      },
      {
        myth: '"The figures in this lesson are specifications."',
        truth: 'They are commonly published historical references. Verify anything you depend on against the ITU-T recommendation.',
      },
    ],
    conclusion:
      'The modem progression is a clean illustration of one idea: once the symbol rate is capped by the channel, the only remaining lever is bits per symbol. That lever is exactly what the Shannon bound limits, and reaching 33.6 kbit/s required the best coding of the era.',
    related: ['m4-qam', 'm4-rate', 'm6-advanced'],
    vizId: 'modems',
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T V-series recommendations',
        detail: 'The authoritative modem specifications.',
        why: 'The correct source for any figure you intend to rely on.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'Modem reference panel in this lesson',
        detail: 'Select a standard and see its rate, baud and constellation order.',
        why: 'Shows the arithmetic you can check yourself.',
      },
      {
        kind: 'read',
        title: 'IEEE — communication standards resources',
        detail: 'Broader standards context.',
        why: 'Places the ITU-T series among other standards bodies.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'NPTEL — data communication lectures',
        detail: 'Modem and modem-adjacent transmission techniques.',
        why: 'Modern treatment of the same efficiency limits.',
        href: 'https://nptel.ac.in/courses',
      },
    ],
  },

  {
    id: 'm4-ofdm',
    module: 4,
    index: 8,
    title: 'Orthogonal Frequency Division Multiplexing',
    sidebarLabel: 'OFDM',
    minutes: 10,
    summary: 'Many slow subcarriers in parallel, made non-interfering by spacing them so their spectra overlap exactly.',
    keywords: ['OFDM', 'subcarriers', 'orthogonality', 'IFFT', 'cyclic prefix', 'multipath', 'ISI', 'Wi-Fi'],
    objectives: [
      'State the orthogonality condition and derive Δf = 1/T_u.',
      'Explain how an IFFT generates the subcarriers from one symbol.',
      'Explain what a cyclic prefix does for multipath.',
      'Compute the symbol duration and CP overhead for a given configuration.',
      'State the trade-offs OFDM makes.',
    ],
    sections: [
      {
        heading: 'Orthogonality',
        paragraphs: [
          'Subcarrier k sits at k·Δf. Choosing Δf = 1/T_u makes them **[[Orthogonality|orthogonal]]**: over one useful symbol, ∫cos(2πkΔf t)·cos(2πlΔf t)dt is T_u/2 when k = l and exactly 0 otherwise.',
          'Their spectra therefore overlap heavily and can be transmitted simultaneously, yet a receiver sampling at symbol boundaries can separate them. That is the whole trick of OFDM.',
        ],
      },
      {
        heading: 'Generation and reception',
        paragraphs: [
          'Putting a symbol on every subcarrier is exactly an inverse DFT. So OFDM is, mathematically, one IFFT at the transmitter and one FFT at the receiver — which is why it maps so cleanly onto hardware.',
          'The laboratory synthesises the time-domain waveform by summing the subcarriers directly, which is the same operation evaluated term by term.',
        ],
      },
      {
        heading: 'The cyclic prefix',
        paragraphs: [
          'Multipath makes the channel a convolution, and convolution with a linear channel turns a rectangular symbol into one smeared across symbol boundaries — [[Redundancy|inter-symbol interference]].',
          'A **[[Cyclic prefix]]** copies the last part of each symbol to its front. This makes the channel effectively circular, so a single FFT per symbol removes all the ISI, provided the prefix is at least as long as the channel delay spread.',
          'The cost is pure overhead: a prefix of length T_cp adds that fraction of bandwidth and time with no information. Long prefixes are robust but wasteful; short ones are efficient but sensitive to long delay spreads.',
        ],
      },
      {
        heading: 'Trade-offs',
        bullets: [
          '**For:** excellent handling of multipath, simple equalisation, high spectral efficiency with a cyclic prefix.',
          'Against:** high peak-to-average power ratio, which forces power amplifiers to back off, and strict frequency synchronisation between transmitter and receiver.',
          'Sensitive to frequency offset: a carrier offset rotates the constellation uniformly, which is why OFDM carries a pilot for correction.',
        ],
      },
    ],
    keyTerms: ['Orthogonality', 'Cyclic prefix', 'QAM', 'Constellation', 'Redundancy', 'Interleaving'],
    formulaIds: ['ofdm-spacing', 'spectral-efficiency'],
    worked: {
      title: 'A Wi-Fi-style OFDM configuration',
      given: ['T_u = 3.2 µs useful symbol', 'T_cp = 0.8 µs', '48 data subcarriers, 16-QAM'],
      steps: [
        'Subcarrier spacing Δf = 1/3.2 µs = 312.5 kHz.',
        'Total symbol duration = 3.2 + 0.8 = 4.0 µs.',
        'Overhead fraction = 0.8 / 4.0 = 20 %.',
        'Raw bits per symbol = 48 × 4 = 192 bits.',
        'Net rate = 192 / 4.0 µs = 48 Mbit/s before coding and framing.',
      ],
      answer: '312.5 kHz spacing, 20 % CP overhead, 48 Mbit/s raw with 48×16-QAM subcarriers.',
    },
    applications: [
      'Wi-Fi (802.11a/g/n/ac/ax), LTE, 5G NR and DVB-T.',
      'Digital broadcasting, where multipath is severe in mobile reception.',
      'Power-line and any channel with a long impulse response.',
    ],
    misconceptions: [
      {
        myth: '"OFDM subcarriers do not overlap."',
        truth: 'They overlap almost completely. Overlap is what makes OFDM bandwidth-efficient; orthogonality is what keeps them separable.',
      },
      {
        myth: '"The cyclic prefix carries data."',
        truth: 'It carries nothing. It is pure overhead, and its length is chosen from the channel delay spread.',
      },
      {
        myth: '"OFDM is always more efficient than single-carrier."',
        truth: 'It trades that efficiency for a high peak-to-average power ratio, which costs amplifier efficiency, and for sensitivity to frequency offset.',
      },
    ],
    conclusion:
      'OFDM works because a very specific choice of spacing — Δf = 1/T_u — makes overlapping subcarriers mathematically separable. Everything else follows: the IFFT/FFT implementation, the cyclic prefix for multipath, and the price paid in overhead and PAPR.',
    related: ['m4-spread', 'm4-qam', 'm6-interleaving'],
    vizId: 'ofdm',
    vizInitial: { carriers: 8, cp: 0.25, bits: '1101001011110001' },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — wireless communication lectures',
        detail: 'OFDM derivation, cyclic prefix and PAPR.',
        why: 'Full derivation of the orthogonality condition.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'OFDM laboratory in this lesson',
        detail: 'See individual subcarriers, their sum, and the cyclic prefix prepended.',
        why: 'The orthogonality claim is only convincing once you have watched the sum.',
      },
      {
        kind: 'read',
        title: 'IEEE 802.11 working group',
        detail: 'The standard defining Wi-Fi, including OFDM parameters.',
        why: 'Source for the configuration in the worked example.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'NumPy — FFT documentation',
        detail: 'Reference implementation of the transform pair.',
        why: 'Lets you verify the synthesis numerically.',
        href: 'https://numpy.org/doc/stable/',
      },
    ],
  },

  {
    id: 'm4-spread',
    module: 4,
    index: 9,
    title: 'Spread Spectrum Communications',
    sidebarLabel: 'DSSS and FHSS',
    minutes: 9,
    summary: 'Two different answers to interference: spread one signal wide, or hop rapidly among frequencies.',
    keywords: ['DSSS', 'FHSS', 'spreading code', 'processing gain', 'interference', 'PN sequence'],
    objectives: [
      'Describe how DSSS multiplies data by a chip sequence.',
      'Compute processing gain from the chip rate.',
      'Describe FHSS and explain how the hop sequence is agreed.',
      'Compare the bandwidth cost of both approaches.',
      'State the limits of the processing-gain argument.',
    ],
    sections: [
      {
        heading: 'DSSS',
        paragraphs: [
          'Direct sequence multiplies the data signal by a pseudo-random chip sequence many times faster than the data rate. Each bit becomes N_chips chips.',
          'The receiver multiplies by the same sequence again, which collapses the chip pattern back into the data. To an interferer that does not know the code, the energy now looks like noise spread across N times the bandwidth.',
        ],
      },
      {
        heading: 'FHSS',
        paragraphs: [
          'Frequency hopping keeps the data rate fixed and moves the whole narrowband signal rapidly among a set of channels according to a pseudo-random sequence both ends already share.',
          'An interferer must either follow the hop or hit the right channel at the right time, so the probability of interference falls with the hop rate.',
        ],
        note: {
          kind: 'limit',
          title: 'Processing gain is conditional',
          body: 'G_p = B_SS/B_DS is the apparent SNR improvement against an interferer whose received power is reduced proportionally. Against broadband thermal noise the wideband receiver also collects more noise, so the net gain is far below G_p. The laboratory shows the spreading, and the caption states this limit rather than implying a free 10 dB.',
        },
      },
      {
        heading: 'Why the two are different',
        bullets: [
          '**DSSS** multiplies one band by many. Processing gain applies continuously and coherently.',
          '**FHSS** moves one narrowband channel around. No single channel is interfered with for long, so it behaves more like frequency diversity.',
          '**Bandwidth:** DSSS needs the full spread bandwidth continuously; FHSS needs only as much bandwidth as a narrow channel but uses it at different times.',
          '**Interference behaviour:** DSSS suppresses a narrowband interferer while spreading it; FHSS mostly avoids the interferer.',
        ],
      },
    ],
    keyTerms: ['DSSS', 'FHSS', 'Processing gain', 'Multiplexing'],
    formulaIds: ['processing-gain', 'bit-baud'],
    worked: {
      title: 'Processing gain for a 10-chip DSSS system',
      given: ['Chip rate 10 Mchip/s', 'Data rate 1 Mbit/s'],
      steps: [
        'Chips per bit = 10 Mchip/s / 1 Mbit/s = 10.',
        'Processing gain G_p = 10 → 10 dB.',
        'Against a narrowband interferer of fixed power, the interference is suppressed by about 10 dB after despreading.',
        'Against broadband thermal noise the receiver also integrates 10× the bandwidth, so the net gain is close to zero.',
      ],
      answer: '10 (10 dB) processing gain against narrowband interference; essentially no gain against broadband noise.',
    },
    applications: [
      'GPS and GNSS, which use direct-sequence spread spectrum with precise code correlation.',
      'Bluetooth (FHSS) and Wi-Fi 802.11b (DSSS).',
      'Wi-Fi 802.11c and legacy wireless LAN standards, plus many industrial telemetry links.',
    ],
    misconceptions: [
      {
        myth: '"Spread spectrum gives free SNR."',
        truth: 'It gives interference rejection, not SNR. A wideband receiver collects proportionally more thermal noise.',
      },
      {
        myth: '"FHSS and DSSS are two names for the same thing."',
        truth: 'DSSS spreads one signal across a wide band; FHSS moves a narrowband signal between channels. Different mechanisms, different failure modes.',
      },
      {
        myth: '"The spreading code is secret, so spread spectrum is encryption."',
        truth: 'The code is normally public and reproducible. It provides processing gain, not confidentiality.',
      },
    ],
    conclusion:
      'Spread spectrum is two ideas with one goal: making narrowband interference manageable. DSSS achieves it by widening the signal and despreading it at the receiver; FHSS by not being on the offending frequency most of the time. Both pay in bandwidth, and both deliver interference rejection rather than free SNR.',
    related: ['m4-ofdm', 'm6-advanced', 'm5-noise'],
    vizId: 'spread-spectrum',
    vizInitial: { chips: '1101001011010010', mode: 'DSSS' },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — spread spectrum lectures',
        detail: 'DSSS, FHSS and processing gain derivations.',
        why: 'Formal treatment of the gain calculation and its limits.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Spread-spectrum laboratory in this lesson',
        detail: 'Watch each bit multiply into chips, then watch the hop sequence step across channels.',
        why: 'Shows the two mechanisms side by side rather than separately.',
      },
      {
        kind: 'read',
        title: 'IEEE 802.11 and IEEE 802.15 working groups',
        detail: 'The standards defining DSSS (802.11b) and FHSS (Bluetooth / 802.11).',
        why: 'Real deployments of both techniques.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — spread spectrum topics',
        detail: 'Search the catalogue for code-based spreading.',
        why: 'Advanced treatment of correlation and code design.',
        href: 'https://ocw.mit.edu/search/?q=spread%20spectrum',
      },
    ],
  },
];