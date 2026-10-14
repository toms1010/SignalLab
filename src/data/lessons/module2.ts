import type { Lesson } from '@/types';

export const module2Lessons: Lesson[] = [
  {
    id: 'm2-chain',
    module: 2,
    index: 1,
    title: 'PCM System Architecture',
    sidebarLabel: 'PCM system architecture',
    minutes: 9,
    summary: 'Every stage between an analogue voltage and a bitstream, and what each one is actually for.',
    keywords: ['PCM', 'block diagram', 'ADC', 'DAC', 'codec', 'sample and hold', 'reconstruction filter'],
    objectives: [
      'Draw the full PCM transmit and receive chain and name every block.',
      'Explain what the anti-aliasing filter and the reconstruction filter each remove.',
      'State the timing budget that limits the achievable sample rate.',
      'Explain what a codec is and why it changes the architecture.',
      'Identify which blocks are linear and which are decision-making.',
    ],
    sections: [
      {
        heading: 'The chain',
        paragraphs: [
          'Transmit side: **analogue input → anti-aliasing filter → sample-and-hold → ADC (quantiser) → binary encoder → digital channel**.',
          'Receive side: **decoder → DAC → reconstruction (anti-imaging) filter → hold → analogue output**.',
          'The [[Band-limiting]] filter at the front is what makes the sampling theorem applicable. The reconstruction filter at the back removes the spectral images the DAC inevitably creates.',
        ],
        note: {
          kind: 'limit',
          title: 'The exact arrangement depends on the signal',
          body: 'A baseband voice signal needs a low-pass anti-aliasing filter. A bandpass signal (as in a radio receiver) uses a band-pass filter ahead of the sampler, and a band-pass filter for reconstruction. Some architectures fold the sample-and-hold into the ADC, and codecs combine ADC and DAC on one die. The signal and the budget decide — there is no single universal diagram.',
        },
      },
      {
        heading: 'What each block contributes',
        bullets: [
          '**Anti-aliasing filter** — a low-pass (or band-pass) filter guaranteeing the input contains nothing above f_s/2.',
          '**[[Sample-and-hold]]** — holds the instantaneous value while the ADC converts. Without it the ADC would see a moving voltage.',
          '**ADC / quantiser** — maps the continuous voltage onto one of 2^n levels. This is the only stage that introduces an irreversible floor error.',
          '**Encoder** — converts the level index into an n-bit word. Usually part of the same chip as the ADC.',
          '**Digital channel** — may be copper, fibre, radio or storage.',
          '**Decoder** — turns the received words back into level indices.',
          '**DAC** — generates a staircase voltage from the indices.',
          '**Reconstruction filter** — smooths the staircase and removes images above f_s/2.',
        ],
      },
      {
        heading: 'Timing',
        paragraphs: [
          'Within one sample period T_s = 1/f_s the circuit must complete the hold acquisition and the conversion. So the achievable sample rate is bounded by 1/(t_acq + t_conv). This is why fast ADCs specify both numbers together — the conversion time is only half the story.',
        ],
      },
      {
        heading: 'Codecs',
        paragraphs: [
          'A **codec** is a single device containing both an ADC/DAC pair (coder and decoder) plus sometimes filters and interfaces. Splitting ADC and DAC across the link, as the diagram shows, is the conceptual model; in practice a telephone line uses a codec at each end and the digital path between them.',
        ],
      },
    ],
    keyTerms: ['PCM', 'Band-limiting', 'Sample-and-hold', 'Quantisation', 'Reconstruction filter', 'Conversion time', 'Acquisition time'],
    formulaIds: ['vlsb', 'levels', 'nyquist'],
    worked: {
      title: 'Timing budget for an 8 kHz voice channel',
      given: ['Target sample rate f_s = 8000 samples/s', 'ADC conversion time t_conv = 60 µs', 'Sample-and-hold acquisition time t_acq = 40 µs'],
      steps: [
        'Sample period: T_s = 1/8000 = 125 µs.',
        'Time available for hold + convert: 125 µs.',
        'Time required: 40 + 60 = 100 µs.',
        'Margin: 125 − 100 = 25 µs per sample, so 8 kHz is achievable with 20 % margin.',
      ],
      answer: '8 kHz is feasible: the hold and converter together need 100 µs of the 125 µs available.',
    },
    applications: [
      'Telephony: 8 kHz sampling of a 3.4 kHz voice channel.',
      'Digital audio recording: 44.1/48 kHz with a steep reconstruction filter.',
      'Any ADC/DAC datasheet — the block diagram is always there in the first page.',
    ],
    misconceptions: [
      {
        myth: '"The reconstruction filter is the same as the anti-aliasing filter."',
        truth: 'They look similar but sit at opposite ends for opposite reasons. The anti-aliasing filter removes unwanted high frequencies before sampling; the reconstruction filter removes sampling images after conversion.',
      },
      {
        myth: '"The encoder does the quantising."',
        truth: 'The quantiser decides the level (an analogue-domain decision about voltage). The encoder merely expresses that level index as a binary word.',
      },
      {
        myth: '"A DAC alone can produce a smooth analogue signal."',
        truth: 'A DAC output is a staircase. Smoothing it is the reconstruction filter\'s job, and it always removes some of the staircase\'s very own harmonics.',
      },
    ],
    conclusion:
      'PCM is a pipeline in which exactly one stage — the quantiser — introduces an irreversible error. Everything else is filtering, timing or encoding. Recognising which stage does what is what lets you diagnose a real system: filter problems look like bandwidth errors, timing problems look like droop, and only the quantiser sets the fidelity floor.',
    related: ['m2-quantization', 'm2-coding', 'm1-sampling'],
    vizId: 'pcm-chain',
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — signals, systems and information for engineers',
        detail: 'Course material on sampling, quantisation and reconstruction.',
        why: 'Formal treatment of each block in the chain.',
        href: 'https://ocw.mit.edu/search/?q=signals%20and%20systems',
      },
      {
        kind: 'read',
        title: 'ITU-T G.711 — PCM for telephony',
        detail: 'The standard specifying the conversion chain for voice.',
        why: 'Defines the real-world implementation this lesson diagrams.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'PCM chain laboratory in this lesson',
        detail: 'Animate a single sample moving through every block of the diagram.',
        why: 'Shows the waveform transform at each stage, not just the block names.',
      },
      {
        kind: 'advanced',
        title: 'SciPy signal processing reference',
        detail: 'Implementation notes for sampling, filtering and conversion.',
        why: 'Maps each block to working code.',
        href: 'https://docs.scipy.org/doc/scipy/reference/signal.html',
      },
    ],
  },

  {
    id: 'm2-quantization',
    module: 2,
    index: 2,
    title: 'Quantisation and Resolution',
    sidebarLabel: 'Quantisation & resolution',
    minutes: 12,
    summary:
      'Every extra bit halves the quantisation error and adds 6 dB of dynamic range — and the formulas behind that are only valid under stated conditions.',
    keywords: ['quantisation', 'levels', 'step size', 'resolution', 'SQNR', 'midrise', 'midtread', 'saturation'],
    objectives: [
      'Compute level count, step size and maximum quantisation error.',
      'Explain the difference between midrise and midtread quantisers and when each is used.',
      'Apply the 6.02n + 1.76 dB SQNR rule and state its assumptions precisely.',
      'Distinguish the 6.02n dB dynamic-range rule from the sine-wave SQNR rule.',
      'Recognise saturation and explain why its error is not bounded by V_LSB/2.',
    ],
    sections: [
      {
        heading: 'Uniform quantisation',
        paragraphs: [
          'A uniform quantiser divides a range V_FSR into L = 2^n equal intervals of width V_LSB = V_FSR / 2^n. Each input sample is replaced by the level nearest to it, and the difference is the [[Quantisation]] error e_q = x − x̂.',
          'Rounding to the nearest level bounds that error at |e_q| ≤ V_LSB/2. Truncating to the next lower level gives a bound of V_LSB instead — half the accuracy for the same bit count.',
        ],
        note: {
          kind: 'limit',
          title: 'Endpoint conventions vary — say which you use',
          body: 'This course uses the "step = range / number of levels" convention, so V_LSB = V_FSR/2^n and L = 2^n levels address the range. Some textbooks use V_FSR/(2^n − 1). The two differ by about 0.03 % at 12 bits, but a datasheet and a textbook using different conventions will not match digit for digit, so state it.',
        },
      },
      {
        heading: 'Midrise versus midtread',
        paragraphs: [
          '**[[Midrise quantiser]]** — output levels sit at the interval mid-points, v_min + (i + ½)V_LSB. No level is exactly zero, so a zero input is split between two levels.',
          '**[[Midtread quantiser]]** — output levels sit at v_min + i·V_LSB, which places one level exactly at zero and leaves a small dead zone around it.',
          'Midtread is preferred when the signal spends meaningful time near zero, because it gives a genuine zero rather than a ±V_LSB/4 pair of small values. Midrise is preferred when the quantiser is used as the nonlinearity of a uniform quantiser theory treatment and when a hard zero must be impossible.',
        ],
      },
      {
        heading: 'Resolution and dynamic range',
        paragraphs: [
          '[[Resolution]] is V_LSB: the smallest amplitude change the quantiser can represent. Doubling the bit count halves it. Expressed as a ratio, L = 2^n levels is 20·log₁₀(L) = 6.02·n dB of **dynamic range**.',
          'This is a range ratio — the span between the largest representable magnitude and the smallest step. It is not a signal-to-noise ratio.',
        ],
      },
      {
        heading: 'SQNR, with its assumptions attached',
        paragraphs: [
          'For an ideal uniform quantiser fed with a **full-scale sinusoid** (peak = V_FSR/2), SQNR ≈ 6.02·n + 1.76 dB. The "+1.76" exists because of the specific RMS relationship for a sine; the bare 6.02·n is the dynamic-range rule.',
          'Two consequences students often miss. First, halving the input peak costs 6 dB of SQNR — so "digital is 6 dB better per bit" is a statement about a full-scale sine, not about a quiet signal. Second, real ADCs are worse: clock jitter, missing codes and INL/DNL each remove part of the theoretical figure.',
        ],
        bullets: [
          'Each extra bit: step size halves, SQNR rises by ≈ 6 dB, rate rises by 1 bit per sample.',
          'Half-scale input: SQNR falls by ≈ 6 dB.',
          'Third-full-scale input: SQNR falls by ≈ 9.5 dB.',
        ],
      },
      {
        heading: 'Saturation',
        paragraphs: [
          'When the input leaves the representable range the output clips to an end level and the error grows without bound. This [[Saturation]] is why the quantiser must be sized for the largest expected input, and why an overload indicator on an ADC is worth reading.',
        ],
      },
    ],
    keyTerms: ['Quantisation', 'Quantisation noise', 'Resolution', 'Midrise quantiser', 'Midtread quantiser', 'Saturation'],
    formulaIds: ['levels', 'vlsb', 'quant-error', 'sqnr', 'dynamic-range'],
    worked: {
      title: 'Step size, error bound and SQNR for a 12-bit ±5 V converter',
      given: ['V_FSR = 10 V (±5 V)', 'n = 12 bits', 'Full-scale sine input'],
      steps: [
        'Levels: L = 2^12 = 4096.',
        'Step: V_LSB = 10 / 4096 = 2.441 mV.',
        'Maximum quantisation error: 2.441 / 2 = 1.221 mV.',
        'SQNR = 6.02 × 12 + 1.76 = 72.24 + 1.76 = 74.0 dB.',
        'Dynamic range from level count alone: 6.02 × 12 = 72.2 dB.',
      ],
      answer: '4096 levels, 2.44 mV step, 1.22 mV peak error, 74.0 dB SQNR for a full-scale sine.',
    },
    applications: [
      'ADC resolution selection: 16 bits over a 2 V range gives 30.5 µV steps.',
      'Audio codecs: CD audio is 16-bit/44.1 kHz precisely because 16 bits clears the ear\'s noise floor.',
      'Choosing a measurement converter: SNR of the analogue front end must be matched to the converter resolution or the extra bits are wasted.',
    ],
    misconceptions: [
      {
        myth: '"More bits always improves the result."',
        truth: 'Only while the analogue front-end noise is below the quantisation noise. Beyond that point extra bits measure noise, and a 24-bit converter on a noisy front end is no better than a 16-bit one.',
      },
      {
        myth: '"6.02n + 1.76 is the dynamic range."',
        truth: '6.02n is the dynamic-range rule (20·log₁₀ 2^n). The +1.76 dB term belongs only to the SQNR of a full-scale sinusoid through an ideal uniform quantiser.',
      },
      {
        myth: '"Quantisation error is always at most V_LSB/2."',
        truth: 'That bound holds only inside the representable range with rounding. Under saturation the error is unbounded — which is why overload indicators exist.',
      },
    ],
    conclusion:
      'Quantisation is the one stage of PCM that sets an error floor. Everything about it follows from three numbers — range, bit count and rounding rule — and the SQNR formulas are shortcuts that only hold for specific input conditions. The laboratory measures the real error rather than quoting the rule, so you can see both.',
    related: ['m2-nonlinear', 'm2-coding', 'm2-dpcm'],
    vizId: 'quantizer',
    vizInitial: { bits: 4, vfsr: 2, amp: 0.85, kind: 'midrise' },
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — signals, systems and information',
        detail: 'Lecture treatment of quantisation error and SQNR derivation.',
        why: 'Shows where the +1.76 dB term actually comes from.',
        href: 'https://ocw.mit.edu/search/?q=signals%20and%20systems',
      },
      {
        kind: 'simulate',
        title: 'Quantiser laboratory in this lesson',
        detail: 'Move a sample point across the staircase and read the error changing sign.',
        why: 'Shows the ±V_LSB/2 bound directly rather than as a statement.',
      },
      {
        kind: 'practice',
        title: 'All About Circuits — analog-to-digital conversion section',
        detail: 'ADC types, resolution and error sources.',
        why: 'Adds the non-ideal effects (INL, DNL, jitter) the ideal formulas omit.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'NumPy documentation — arrays and ufuncs',
        detail: 'Reference for vectorised quantisation maths.',
        why: 'Lets you verify the laboratory results with your own code.',
        href: 'https://numpy.org/doc/stable/',
      },
    ],
  },

  {
    id: 'm2-coding',
    module: 2,
    index: 3,
    title: 'Binary Coding of Quantised Samples',
    sidebarLabel: 'Binary coding',
    minutes: 9,
    summary:
      'Turning a level index into bits — and why the code you choose decides how a missing code behaves.',
    keywords: ['binary coding', 'sign-magnitude', 'folded binary', 'two\'s complement', 'missing codes', 'coding efficiency'],
    objectives: [
      'Encode a sample in sign-magnitude and in folded binary.',
      'Explain why sign-magnitude wastes one codeword.',
      'Describe how a missing code appears at the analogue input.',
      'Calculate percent error for a given sample and step size.',
      'Discuss coding efficiency when symbols are not equally likely.',
    ],
    sections: [
      {
        heading: 'Two standard arrangements',
        paragraphs: [
          '**Sign-magnitude** (used historically in telephony): one bit for the sign, then n − 1 bits for the magnitude within that half of the range. Because each polarity has L/2 levels and only L/2 − 1 distinct magnitudes, one codeword is left over — the "negative zero".',
          '**[[Folded binary]]** (natural binary, as in a two\'s-complement converter): all n bits address the level index directly, ordered from the most negative to the most positive level. Negative values are therefore not simply "the sign bit set".',
        ],
        bullets: [
          'Sign-magnitude is easy to reason about and easy to encode in hardware; its cost is one wasted codeword and a non-monotone code around zero.',
          'Folded binary is monotone and has no wasted code, but needs offset binary or two\'s complement at the interface to a signed digital word.',
          'A two\'s-complement ADC additionally produces the "negative full scale" code at exactly one analogue input (for a midrise quantiser, −V_FSR/2 + V_LSB/2).',
        ],
      },
      {
        heading: 'Reading a codeword',
        paragraphs: [
          'Work from the code back to the voltage by following the same definition in reverse: index → level → x̂ = v_min + (i + ½)·V_LSB for a midrise quantiser. Then compute the error e_q = x − x̂ and the percent error.',
          'The percent error is largest for small |x|, because the absolute error bound is fixed while the reference shrinks. That is a structural argument for companding, which is the subject of the next two lessons.',
        ],
      },
      {
        heading: 'Coding efficiency',
        paragraphs: [
          'When every level is equally likely, all n bits are information-bearing and efficiency is 100 %. Efficiency falls only for non-uniform code assignments — Huffman, or constrained codes that avoid long runs of identical symbols to help the channel. Efficiency is then R/H, where H is the entropy in bits per symbol.',
        ],
      },
    ],
    keyTerms: ['Quantisation', 'Resolution', 'Redundancy'],
    formulaIds: ['levels', 'vlsb', 'coding-efficiency'],
    worked: {
      title: 'Encode a sample in both code schemes',
      given: ['x = +0.37 V', 'V_FSR = 2 V (−1 … +1 V)', 'n = 4 bits, midrise quantiser'],
      steps: [
        'Step size: V_LSB = 2/16 = 0.125 V.',
        'Level index: round((0.37 + 1)/0.125 − 0.5) = round(10.46) = 10.',
        'Reconstructed level: x̂ = −1 + 10.5 × 0.125 = +0.3125 V.',
        'Sign-magnitude: index 10 ≥ 8, so sign = 0 (positive), magnitude = 10 − 8 = 2 → **0010** (sign bit + 3 magnitude bits).',
        'Folded binary: index 10 → **1010**.',
        'Error = 0.37 − 0.3125 = +0.0575 V; percent error = 15.5 %.',
      ],
      answer: 'Sign-magnitude 0010, folded binary 1010, both decoding to +0.3125 V with a +15.5 % error.',
    },
    applications: [
      'Every ADC output format: parallel binary, offset binary or two\'s complement.',
      'Missing-code analysis on successive-approximation converters.',
      'Huffman and constrained coding in source and channel coding.',
    ],
    misconceptions: [
      {
        myth: '"In two\'s complement, a negative number just has the top bit set."',
        truth: 'That is sign-magnitude. In folded binary and two\'s complement the bit pattern is the level index; −1 and 0 are adjacent codes, not 1000 and 0000.',
      },
      {
        myth: '"A wasted codeword means the ADC has a broken input voltage."',
        truth: 'For midrise quantisers all voltages are representable. It is two\'s-complement converters that have one analogue input with no valid code — the negative-full-scale input.',
      },
      {
        myth: '"Percent error should be roughly constant."',
        truth: 'The absolute error is bounded at V_LSB/2, so percent error blows up as the sample approaches zero. This is the observation companding exists to fix.',
      },
    ],
    conclusion:
      'Coding is a labelling problem, but the label is not arbitrary: it decides which input voltages are representable, whether the code is monotone, and how many bits carry real information. Sign-magnitude is readable and wastes a code; folded binary is monotone and wastes none. Percent error growing as the signal shrinks is the clue that leads directly to companding.',
    related: ['m2-quantization', 'm2-nonlinear', 'm6-hamming'],
    vizId: 'quantizer',
    vizInitial: { bits: 4, vfsr: 2, amp: 0.7, kind: 'midtread', code: true, probe: 0.37 },
    furtherReading: [
      {
        kind: 'read',
        title: 'All About Circuits — ADC architectures',
        detail: 'How converters physically produce codewords.',
        why: 'Explains why real converters produce two\'s-complement output.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'simulate',
        title: 'Quantiser laboratory, code view enabled',
        detail: 'Drag the probe sample and read both codewords update live.',
        why: 'Directly answers "which code represents this voltage".',
      },
      {
        kind: 'practice',
        title: 'Exercises — Binary coding',
        detail: 'Self-checked numerical problems with worked solutions.',
        why: 'Turns the worked example into practice you can verify.',
      },
      {
        kind: 'advanced',
        title: 'IEEE — digital signal processing resources',
        detail: 'Standards and educational material on converter interfaces.',
        why: 'Authoritative definitions of folded binary and two\'s complement output.',
        href: 'https://www.ieee.org/',
      },
    ],
  },

  {
    id: 'm2-nonlinear',
    module: 2,
    index: 4,
    title: 'Linear and Nonlinear PCM',
    sidebarLabel: 'Linear vs nonlinear PCM',
    minutes: 11,
    summary:
      'Uniform quantisation wastes resolution where the signal is quiet. Companding moves it where the signal lives.',
    keywords: ['companding', 'mu-law', 'A-law', 'dynamic range', 'idle channel noise', 'nonlinear quantisation', 'G.711'],
    objectives: [
      'Explain why uniform resolution produces audible idle-channel noise.',
      'State the difference between analogue and digital companding.',
      'Compute the μ-law transfer function and its small-signal gain.',
      'Describe the piecewise A-law characteristic and why it overshoots slightly.',
      'Compare μ = 255 and A-law in terms of approximation accuracy.',
    ],
    sections: [
      {
        heading: 'The problem with uniform resolution',
        paragraphs: [
          'Uniform quantisation spends the same step size everywhere. A full-scale voice signal therefore uses the whole range well — but a quiet signal, or the pauses between words, uses almost none of it. The residual error during those quiet passages is quantisation noise at full step size with no signal to mask it, which is heard as hiss. This is [[Idle-channel noise]].',
          'The energy of a typical speech signal is concentrated at low amplitudes. A quantiser that put more levels near zero would match the signal\'s statistics and improve the perceptually important parts.',
        ],
      },
      {
        heading: 'Companding',
        paragraphs: [
          '**[[Companding]]** is compression followed by expansion: a non-linear law is applied before quantisation, and its inverse after reconstruction. The two laws cancel for an ideal quantiser, so the only lasting effect is that the level distribution is non-uniform.',
          '**[[Analog companding]]** uses physical nonlinear elements — diodes, resistors — in the signal path. It is continuous, but it drifts with temperature and component ageing. **Digital companding** applies the law arithmetically in the encoder and decoder, so it is exact and drift-free.',
        ],
        bullets: [
          'ITU-T **G.711** defines both μ-law (μ = 255, used in North America and Japan) and A-law (A = 87.7, used in most of Europe and Africa).',
          'Both reduce 13-bit linear PCM (which in telephony covers a 12-bit range) to **8 bits** per sample — a 1.5:1 saving in the sense of bits, or a 48 kbit/s channel from a 64 kbit/s one.',
          'The quoted "2:1" or "4:1" compression ratios elsewhere refer to bit-rate comparisons, not to a property of the law itself.',
        ],
      },
      {
        heading: 'The μ-law characteristic',
        paragraphs: [
          'F_μ(x) = ln(1 + μ|x|) / ln(1 + μ), normalised so the domain [−1, 1] maps onto [−1, 1]. It is continuous, monotone and symmetric, and its endpoints are exact — so compressor and expander are exact inverses.',
          'μ = 255 gives about **+15.4 dB of gain at x = 0.1**, which is how many small-signal quantisation errors are avoided. The price is coarser steps near full scale, where a speech signal is loud enough to mask them.',
        ],
      },
      {
        heading: 'The A-law characteristic',
        paragraphs: [
          'A-law is piecewise: **linear within |x| < 1/A** (≈ 0.0114 for A = 87.7), then logarithmic out to ±1. The linear core guarantees good *absolute* resolution near zero, which matters for a signal that spends real time there.',
          'A-law deliberately allows slight overshoot at the maximum (to about 1.14 of the peak) so that G.711\'s 13-bit segment range fully covers the 12-bit linear input range without losing the top codes.',
          'μ = 255 approximates a pure logarithmic law; A-law approximates it only outside a small linear core. Their difference in distortion on real speech is small — a few tenths of a dB — which is why both survived in the field.',
        ],
      },
    ],
    keyTerms: ['Companding', 'μ-law', 'A-law', 'Idle-channel noise', 'Dynamic range'],
    formulaIds: ['mulaw', 'alaw', 'sqnr', 'dynamic-range'],
    worked: {
      title: 'μ-law gain at a small amplitude',
      given: ['μ = 255', 'x = 0.1'],
      steps: [
        'ln(1 + 255 × 0.1) = ln(26.5) = 3.277',
        'ln(1 + 255) = ln(256) = 5.545',
        'F(0.1) = 3.277 / 5.545 = 0.591',
        'Gain in dB = 20·log₁₀(0.591 / 0.1) = 15.4 dB',
      ],
      answer: 'F(0.1) = 0.591, corresponding to about +15.4 dB of gain for small signals — the mechanism by which idle-channel hiss is reduced.',
    },
    applications: [
      'Every analogue telephone call: 8 kHz sampling, 8 bits μ-law or A-law, 64 kbit/s.',
      'Digital audio recording with companding, historically on magnetic tape.',
      'Any companding used before a fixed-word-length codec, including video quantisers.',
    ],
    misconceptions: [
      {
        myth: '"Companding makes the quantiser better, so SQNR improves everywhere."',
        truth: 'Companding redistributes resolution. SQNR improves at low amplitudes and degrades at high ones. Overall distortion for speech improves because speech energy is concentrated at low amplitudes.',
      },
      {
        myth: '"μ-law and A-law give 2:1 and 4:1 compression."',
        truth: 'G.711 maps a 13-bit linear representation onto 8 bits. Compression ratios quoted elsewhere are bit-rate comparisons, not properties of the laws.',
      },
      {
        myth: '"Analog companding is better because it is continuous."',
        truth: 'It is continuous but drifts with temperature and component tolerance. Digital companding is exact and repeatable, which is why it won.',
      },
    ],
    conclusion:
      'Uniform quantisation is simple and wrong for speech: it spends most of its levels where there is no signal. Companding matches level density to signal density, cutting idle-channel noise at the cost of coarser steps at high levels where the ear is less sensitive. μ-law and A-law are the two standardised laws behind almost every telephone call ever made.',
    related: ['m2-companding-impl', 'm2-quantization', 'm2-chain'],
    vizId: 'companding',
    vizInitial: { mu: 255, law: 'mu', showDb: false },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T recommendation G.711',
        detail: 'The standard defining μ-law and A-law PCM coding for telephony.',
        why: 'The authoritative definition behind this lesson.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'Companding laboratory in this lesson',
        detail: 'Sweep μ from 1 (linear) to 255 and watch the resolution move toward zero.',
        why: 'Makes "redistributing resolution" a thing you watch happen.',
      },
      {
        kind: 'watch',
        title: 'NPTEL — communication systems',
        detail: 'Lectures on companding and PCM telephone systems.',
        why: 'Derives the distortion comparison between μ-law and A-law.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — companding',
        detail: 'Reference definitions and comparison of companding laws.',
        why: 'Independent definitions to check the transfer functions against.',
        href: 'https://mathworld.wolfram.com/Companding.html',
      },
    ],
  },

  {
    id: 'm2-companding-impl',
    module: 2,
    index: 5,
    title: 'Companding Implementation: 12 Bits to 8',
    sidebarLabel: 'Companding implementation',
    minutes: 10,
    summary:
      'A documented, explicit 12-bit → 8-bit companded code — and a clear statement of what it is and is not.',
    keywords: ['segment', 'sign bit', 'quantisation interval', 'companded code', 'G.711', 'bit compression'],
    objectives: [
      'Describe an explicit 8-bit companded code: 1 sign bit, 3 segment bits, 4 interval bits.',
      'Trace a 12-bit linear codeword through the segment/interval mapping by hand.',
      'Reconstruct the value from the 8-bit code and compute the resulting quantisation difference.',
      'Explain why "2:1" style compression ratios are bit-rate comparisons, not properties of the law.',
      'State clearly that arbitrary 12-bit inputs have no universal 8-bit telephony equivalent.',
    ],
    sections: [
      {
        heading: 'What is being demonstrated, and what is not',
        paragraphs: [
          'This lesson uses an **explicit, documented segmentation scheme** that follows the same shape as G.711: an 8-bit code consisting of 1 sign bit, 3 segment-identifier bits and 4 within-segment interval bits.',
          'It is **not** a claim that any arbitrary 12-bit input converts into "the" 8-bit telephony code. Real G.711 conversion uses specific segment boundaries, a defined treatment of the negative end and clipping conventions. This laboratory uses its own stated segment table so that every step is checkable by hand, and the table is printed below.',
        ],
        note: {
          kind: 'limit',
          title: 'Segment table used in this laboratory',
          body: 'Each segment spans a range that doubles: segment 0 covers the innermost 1/16 of full scale with step V_FSR/1024, segment 1 covers the next 1/16 with step V_FSR/512, and so on to segment 7 covering the outermost 1/8 with step V_FSR/8. The four interval bits give 16 levels inside whichever segment the sample falls in. This is a pedagogic model of segmented companding, in the style of G.711 but not identical to it.',
        },
      },
      {
        heading: 'The five stages',
        paragraphs: [
          '**1. Extract the sign** of the linear sample.',
          '**2. Find the segment** — the octave of full-scale range containing |x|, encoded in 3 bits.',
          '**3. Find the quantisation interval** inside that segment — one of 16, encoded in 4 bits.',
          '**4. Reconstruct** the value from the segment and interval, then expand it through the companding law.',
          '**5. Compare** with the original 12-bit value and report the difference.',
        ],
      },
      {
        heading: 'On compression ratios',
        paragraphs: [
          'A 12-bit linear code carries 12 bits per sample; the 8-bit companded code carries 8. That is a **1.5:1 bit reduction per sample**, and for telephony it is what turns 96 kbit/s linear PCM into a 64 kbit/s channel.',
          'Figures such as "2:1" or "4:1" appear in textbooks for other contexts — linear PCM against a companded format of the same quality, for example. They are comparisons between two systems, not a constant belonging to μ-law or A-law, and this lesson does not quote them as if they were.',
        ],
      },
    ],
    keyTerms: ['Companding', 'μ-law', 'A-law', 'Quantisation', 'Resolution'],
    formulaIds: ['mulaw', 'levels', 'vlsb'],
    worked: {
      title: 'Convert a 12-bit linear code to an 8-bit companded code',
      given: ['12-bit linear code for x = +0.62 V over V_FSR = 2 V', 'Segment table: segment s spans |x| in [s/16·V_FSR/2, (s+1)/16·V_FSR/2) up to s = 6; s = 7 covers the outer half'],
      steps: [
        'Sign = 0 (positive).',
        'Segment: |x| = 0.62; V_FSR/2 = 1.0; so 0.62 lies in [0.5, 1.0) → segment 6.',
        'Segment 6 spans 0.5 of full-scale half-range in 16 steps → step = 0.5/16 = 0.03125 V.',
        'Interval index = round((0.62 − 0.5)/0.03125) = round(3.84) = 4 → interval code 0100.',
        '8-bit companded code = sign(0) ‖ segment(110) ‖ interval(0100) = **0110 0100**.',
        'Reconstruction: x̂ = 0.5 + 4 × 0.03125 = 0.625 V. Difference = +0.005 V.',
      ],
      answer: '8-bit code 01100100, reconstructed value 0.625 V, difference 5 mV — about one segment step.',
    },
    applications: [
      'Digital telephony: 64 kbit/s voice channels carrying 12-bit linear quality.',
      'Low-bit-rate codecs that keep the G.711 segmentation idea but add prediction.',
      'Any design where a fixed word length must cover a wide dynamic range.',
    ],
    misconceptions: [
      {
        myth: '"Companding gives 4:1 compression."',
        truth: 'G.711 is 12 bits of linear input represented in 8 bits. The 1.5:1 figure is arithmetic; 2:1 and 4:1 are cross-system comparisons.',
      },
      {
        myth: '"Any 12-bit value has an exact 8-bit companded equivalent."',
        truth: 'Only within the stated segment table. Outside it, values clip, and inside a segment the 16 interval levels discard sub-step information.',
      },
      {
        myth: '"Companding is lossless because the compressor and expander cancel."',
        truth: 'The pair cancels for the *waveform*, but quantisation happens between them. The information loss is in the 16 intervals per segment.',
      },
    ],
    conclusion:
      'Segmented companding is a concrete, checkable algorithm: sign, octave, interval, reconstruct. Following one sample through it by hand is the fastest way to understand why companding works — and to see exactly where the remaining error lives, which is always inside a segment.',
    related: ['m2-nonlinear', 'm2-quantization', 'm2-dpcm'],
    vizId: 'pcm-codec',
    vizInitial: { linear: 0.62, stage: 4 },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T recommendation G.711',
        detail: 'The real segment tables, clip conventions and segment numbering.',
        why: 'Compare the production standard against this lesson\'s stated model.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'PCM codec laboratory in this lesson',
        detail: 'Step through sampling, quantisation and encoding for one chosen sample.',
        why: 'Shows the code appearing bit by bit.',
      },
      {
        kind: 'practice',
        title: 'Exercises — PCM and companding',
        detail: 'Convert linear codes to companded codes by hand and check them.',
        why: 'The segment table is only memorable once you have used it.',
      },
      {
        kind: 'advanced',
        title: 'NPTEL — digital communication lectures',
        detail: 'Course material on companded PCM and speech coding.',
        why: 'Places the 8-bit companded code in a wider coding context.',
        href: 'https://nptel.ac.in/courses',
      },
    ],
  },

  {
    id: 'm2-dpcm',
    module: 2,
    index: 6,
    title: 'Differential PCM',
    sidebarLabel: 'DPCM and ADPCM',
    minutes: 10,
    summary: 'Encode the change, not the value — and keep the decoder in step so the two never drift apart.',
    keywords: ['DPCM', 'ADPCM', 'prediction', 'difference encoding', 'adaptive quantisation', 'drift'],
    objectives: [
      'Explain what a DPCM predictor sends instead of an amplitude.',
      'Trace the closed loop and explain why it prevents drift.',
      'Implement the documented toy DPCM codec used in the laboratory.',
      'Explain how ADPCM adapts step size and/or predictor.',
      'State honestly what the toy codec does and does not save.',
    ],
    sections: [
      {
        heading: 'The idea',
        paragraphs: [
          'Conventional PCM sends an absolute amplitude every sample. [[DPCM]] instead sends the **difference** between the current sample and a prediction made from previously *reconstructed* samples.',
          'Natural signals change slowly compared with their amplitude, so those differences occupy a far smaller range than the samples themselves. A fixed number of bits therefore describes them with much finer resolution — which is where the quality gain comes from.',
        ],
      },
      {
        heading: 'The closed loop, and why it matters',
        paragraphs: [
          'The encoder sends e_n = x_n − x̂_n, quantises it to ẽ_n, and reconstructs x̂_n = x̂_{n−1} + ẽ_n. The decoder receives ẽ_n and performs **the same update**.',
          'Because both sides run from reconstructed history rather than from the true samples, they stay in step permanently. If the decoder instead integrated the true differences, any single lost bit would permanently offset everything that followed. That failure mode is called drift, and the closed-loop construction is exactly what prevents it.',
        ],
        note: {
          kind: 'limit',
          title: 'The laboratory codec is explicitly a toy',
          body: 'The simulator uses a first-order (previous-sample) predictor with a uniform error quantiser. That is a complete, working codec with a stated bit allocation, but it is not adaptive, it is not optimised, and it does not predict across a window. Real ADPCM uses higher-order predictors and adapts the step size to local signal statistics. No bit-rate saving is claimed here without the bit allocation being shown alongside it.',
        },
      },
      {
        heading: 'ADPCM',
        paragraphs: ['[[ADPCM]] adapts one or both of the two parameters that matter:'],
        bullets: [
          '**Adaptive step size** — large steps during rapid changes (when precision is less critical), small steps during quiet passages.',
          '**Adaptive prediction** — higher-order or adaptive-coefficient predictors that follow the signal\'s recent shape better than a fixed first-order rule.',
          'The trade-off is that adaptation needs side information, which is either signalled or derived from the received data so both ends stay in step.',
        ],
      },
    ],
    keyTerms: ['DPCM', 'ADPCM', 'Quantisation', 'Redundancy', 'SNR'],
    formulaIds: ['dpcm', 'coding-efficiency'],
    worked: {
      title: 'Trace three samples through the toy DPCM codec',
      given: ['Samples: 1.00, 1.10, 0.95 V', '3-bit uniform error quantiser, |x| ≤ 1.5 V → V_LSB = 3/8 = 0.375 V, range ±1.5 V around the predictor'],
      steps: [
        'n=1: x = 1.00, predictor 0 → error 1.00, clamped to the range → transmitted code 4 (maximum), error +1.50 → reconstruct 1.50.',
        'n=2: x = 1.10, predictor 1.50 → error −0.40 → code 3 → transmitted error −0.375 → reconstruct 1.125.',
        'n=3: x = 0.95, predictor 1.125 → error −0.175 → code 4 → transmitted error −0.375 → reconstruct 0.750.',
        'Decoder performs exactly the same three updates from the same codes, so its output matches the encoder exactly.',
      ],
      answer: 'Three samples cost 9 bits and the decoder reproduces the encoder state exactly — the closed loop is what makes that possible.',
    },
    applications: [
      'ADPCM in ITU-T G.721/G.726 and the historic G.711 derivative codecs.',
      'PCM audio in digital telephony and VoIP at rates between 32 and 80 kbit/s.',
      'Any system where adjacent samples are strongly correlated.',
    ],
    misconceptions: [
      {
        myth: '"DPCM reduces the bit rate because it needs fewer bits."',
        truth: 'DPCM reduces the bit rate for a given quality because the error needs fewer bits — the bit allocation must still be shown. Reducing the words per sample without showing the reconstruction is not a valid saving.',
      },
      {
        myth: '"A better predictor always means better compression."',
        truth: 'Higher-order predictors can become poorly conditioned and amplify quantisation noise. Prediction filters must be designed, not chosen by intuition.',
      },
      {
        myth: '"One lost bit ruins DPCM."',
        truth: 'Only open-loop schemes. The closed-loop design used here keeps encoder and decoder in step and corrects on the next sample.',
      },
    ],
    conclusion:
      'DPCM spends its bits on change rather than value, and its closed-loop construction is what keeps the two ends of the link from ever disagreeing. The laboratory shows the full chain — prediction, quantisation, transmitted code, reconstruction — so the bit allocation and the reconstruction quality can be judged together rather than taken on faith.',
    related: ['m2-quantization', 'm3-dm', 'm2-companding-impl'],
    vizId: 'dpcm',
    vizInitial: { bits: 4, vmax: 1.2 },
    furtherReading: [
      {
        kind: 'read',
        title: 'ITU-T recommendations (G.72x audio codecs)',
        detail: 'The ADPCM standards referenced in this lesson.',
        why: 'The production implementation of the toy codec shown here.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'DPCM laboratory in this lesson',
        detail: 'Compare PCM and DPCM at the same bit count and watch the prediction error collapse.',
        why: 'Makes "predictors change slowly" a measured claim.',
      },
      {
        kind: 'practice',
        title: 'Exercises — DPCM',
        detail: 'Encode short sequences by hand and check the closed loop.',
        why: 'Traces the recursion, which is the part that is easy to get wrong.',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — source coding',
        detail: 'Predictive coding, entropy and rate-distortion context.',
        why: 'Places DPCM inside the wider predictive-coding family.',
        href: 'https://ocw.mit.edu/search/?q=information%20theory',
      },
    ],
  },
];