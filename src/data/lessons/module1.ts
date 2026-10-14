import type { Lesson } from '@/types';

export const module1Lessons: Lesson[] = [
  {
    id: 'm1-digital-vs-analog',
    module: 1,
    index: 1,
    title: 'Digital Transmission Fundamentals',
    sidebarLabel: 'Digital transmission fundamentals',
    minutes: 9,
    summary:
      'The difference between an analogue and a digital link is not cosmetic: it is a difference in what noise does to the signal as it travels.',
    keywords: ['analog', 'digital', 'regeneration', 'amplification', 'multiplexing', 'quantisation', 'noise immunity'],
    objectives: [
      'Define analogue and digital transmission in terms of what the receiver does with noise.',
      'Explain why a regenerative repeater can restore a digital signal but an amplifier cannot restore an analogue one.',
      'List the practical advantages: processing, multiplexing, storage, measurement.',
      'List the real disadvantages, including quantisation, synchronisation and legacy incompatibility.',
      'Identify which claim about digital transmission is a myth.',
    ],
    sections: [
      {
        heading: 'What "digital transmission" actually means',
        paragraphs: [
          'A **digital transmission system** carries information as a finite set of discrete symbols. At the receiver each symbol arrives with some noise superimposed, is compared against a **decision threshold**, and is replaced by the nearest clean level. The transmitter symbol is thereby re-created rather than merely amplified.',
          'An **analogue transmission system** carries a continuously varying waveform. The receiver can amplify that waveform, but the noise that was added on the way is part of the waveform now. Every subsequent amplifier adds its own noise as well, so the signal degrades progressively along the link.',
        ],
        bullets: [
          'Digital: noise is removed at every repeater, so quality does not degrade with distance.',
          'Analogue: noise accumulates with each amplifier, so quality degrades with distance.',
          'This is a structural difference, not a matter of implementation quality.',
        ],
      },
      {
        heading: 'Regeneration versus amplification',
        paragraphs: [
          'This is the single most important idea in the module. Consider a [[Digital transmission]] symbol that leaves the transmitter at +1 V but arrives after noise and attenuation at +0.55 V. It is still above the decision threshold of +0.2 V, so the receiver decides "that was a 1" and **regenerates** a clean +1 V to send onward.',
          'An analogue amplifier cannot do this. Given +0.55 V of a wanted waveform plus noise, it produces a scaled copy of the sum. The noise is scaled along with the signal and becomes indistinguishable from signal. Two amplifiers give two noise contributions; twenty amplifiers give twenty.',
        ],
        note: {
          kind: 'note',
          title: 'Why span length differs',
          body: 'Because a [[Regenerative repeater]] resets the noise, digital span length is chosen from an SNR budget rather than from accumulated noise. Analogue span length is limited by how much SNR can be tolerated at the far end, which is exactly the same budget — but the analogue link never recovers the SNR it spends.',
        },
      },
      {
        heading: 'Advantages',
        bullets: [
          '**Noise immunity.** Each repeater re-decides the symbol, so accumulated noise does not propagate.',
          '**Regeneration, not amplification.** Signal levels are restored exactly, so distortion does not accumulate either.',
          '**Easier processing and multiplexing.** After decoding, a digital stream can be compressed, encrypted, filtered and time-division multiplexed with software. Two analogue signals cannot be multiplexed after the fact without first being converted.',
          '**Storage and reproducibility.** Digital data can be stored, copied and re-read bit-for-bit identically. Analogue recordings degrade on every copy.',
          '**Simpler measurement and evaluation.** A bit sequence is objectively testable. A waveform requires a waveform to judge against.',
        ],
      },
      {
        heading: 'Disadvantages — the honest list',
        bullets: [
          '**Quantisation effects.** Converting a continuous amplitude to a finite set of levels introduces a [[Quantisation]] error of up to V_LSB/2. Analogue transmission has no equivalent floor.',
          '**Synchronisation requirements.** The receiver must know where each symbol starts. Timing recovery is a real cost in bandwidth and complexity.',
          '**Conversion complexity.** ADCs and DACs need accurate clocking, references and anti-aliasing filters.',
          '**Incompatibility with existing analogue facilities.** A digital signal cannot be dropped into an analogue network, or vice versa, without converters.',
          '**Bandwidth for a given fidelity.** Passing 3.4 kHz of voice at 64 kbit/s occupies far more spectrum than passing it as analogue FM.',
        ],
      },
    ],
    keyTerms: ['Digital transmission', 'Analog transmission', 'Decision threshold', 'Regenerative repeater', 'SNR', 'Quantisation'],
    formulaIds: ['snr-db', 'repeater-spacing'],
    worked: {
      title: 'Why a digital link tolerates noise that would ruin an analogue link',
      given: ['Analogue span: signal 0.8 V, noise 0.10 V RMS (SNR = 18.06 dB)', 'Digital span: nominal +1 V / 0 V symbols, decision threshold +0.2 V'],
      steps: [
        'Analogue: an amplifier passes signal and noise together. After ten amplifiers the noise is still 0.10 V RMS, so the SNR is still 18.06 dB — it never improves.',
        'Digital: the received +0.55 V (signal 1 V plus noise) is compared with the +0.2 V threshold and decided as a 1.',
        'The repeater re-emits exactly +1 V. All accumulated noise is discarded.',
        'After ten repeaters the SNR is exactly what it was after the first span.',
      ],
      answer:
        'The digital link holds its SNR constant across the whole route because each repeater discards noise; the analogue link never improves and degrades with every amplifier.',
    },
    applications: [
      'All modern telephony: the analogue voice is converted to PCM at the exchange and stays digital to the far end.',
      'Digital audio and video distribution, where the storage and reproducibility advantage is decisive.',
      'Satellite and optical links, where span length is expensive and regeneration directly reduces the number of gateways.',
    ],
    misconceptions: [
      {
        myth: '"Digital transmission is immune to noise."',
        truth: 'Digital transmission is far more noise-tolerant, not immune. Noise still causes decision errors at the threshold; it is simply not allowed to accumulate past the next repeater.',
      },
      {
        myth: '"Digital signals always occupy less bandwidth."',
        truth: 'Bandwidth depends on bit rate and pulse shaping, not on whether the information is analogue or digital. 64 kbit/s PCM voice needs more spectrum than FM voice.',
      },
      {
        myth: '"A digital amplifier restores the signal, so digital is simply better."',
        truth: 'The restoring step is a comparator plus a fixed voltage source — a decision circuit, not a linear amplifier. It works because the message lives in a finite set of levels.',
      },
    ],
    conclusion:
      'Digital transmission wins because of a decision circuit, not because it is "cleaner". The receiver throws away a noisy version of the symbol and re-creates a clean one, which is why noise does not accumulate. The price is quantisation, timing and conversion complexity — and that trade is only worth making when you need noise immunity, processing power or reproducibility.',
    related: ['m1-sampling', 'm1-snr-ber'],
    vizId: 'digital-vs-analog',
    vizInitial: { hops: 3 },
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — search for "digital communication"',
        detail: 'University lecture notes covering noise immunity, repeaters and link budgets.',
        why: 'Gives the formal treatment of the same regeneration-versus-amplification argument.',
        href: 'https://ocw.mit.edu/search/?q=digital%20communication',
      },
      {
        kind: 'read',
        title: 'NPTEL course catalogue',
        detail: 'Free Indian Institute of Technology lectures on digital communication fundamentals.',
        why: 'Worked lectures on decision circuits and threshold selection.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Regeneration laboratory in this lesson',
        detail: 'Push a noisy signal through N amplifier stages, then N repeater stages.',
        why: 'Shows the same noise either persisting or being discarded at every hop.',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — Nyquist–Shannon sampling theorem',
        detail: 'Formal statement and history of the sampling result.',
        why: 'Useful background for the sampling lesson that follows.',
        href: 'https://mathworld.wolfram.com/Nyquist-ShannonSamplingTheorem.html',
      },
    ],
  },

  {
    id: 'm1-sampling',
    module: 1,
    index: 2,
    title: 'The Sampling Theorem',
    sidebarLabel: 'Sampling theorem',
    minutes: 12,
    summary:
      'A band-limited signal can be reconstructed exactly from its samples — provided the sampling frequency is high enough, and the signal genuinely has no content above half that rate.',
    keywords: ['nyquist', 'sampling theorem', 'aliasing', 'reconstruction', 'anti-aliasing', 'sinc', 'band-limited'],
    objectives: [
      'State the Nyquist–Shannon sampling theorem and define every symbol in it.',
      'Distinguish the Nyquist rate from the Nyquist frequency.',
      'Reconstruct a sampled sinusoid and see where reconstruction fails.',
      'Explain why the input must be band-limited and what an anti-aliasing filter does.',
      'Explain why real systems sample above the theoretical minimum.',
    ],
    sections: [
      {
        heading: 'The theorem',
        paragraphs: [
          'The **Nyquist–Shannon sampling theorem** states that a signal x(t) whose spectrum is zero above f_max can be reconstructed exactly from its samples provided the sampling frequency satisfies f_s ≥ 2·f_max.',
          'Two conditions hide inside that sentence. First, the signal must be band-limited: there must be a **band-limiting** filter removing everything above f_max. Second, reconstruction must be exact, which in theory means summing an infinite number of sinc-weighted samples.',
        ],
      },
      {
        heading: 'Nyquist rate versus Nyquist frequency',
        paragraphs: [
          'These two terms are routinely confused, so it is worth being precise. The [[Nyquist rate]] is the *minimum sampling frequency*, f_s ≥ 2·f_max. The [[Nyquist frequency]] is *half the sampling frequency*, f_N = f_s/2 — the highest frequency that survives sampling without folding.',
          'A convenient consequence: if f_max is known and you choose f_s, then f_max must be at or below f_s/2. Telephone voice is band-limited to about 3.4 kHz, so the Nyquist rate is 6.8 kHz — and the standard telephony rate is 8 kHz.',
        ],
        note: {
          kind: 'limit',
          title: 'Why the theoretical minimum is never enough',
          body: 'f_s ≥ 2·f_max assumes an ideal brick-wall anti-aliasing filter and exact sample timing. Real filters have a transition band, so the designer must leave guard margin: the filter must reach −∞ dB by f_s/2, which means rolling off early and pushing f_s above 2·f_max. Exactly-on-Nyquist sampling is not a buildable design.',
        },
      },
      {
        heading: 'Reconstruction',
        paragraphs: [
          'The ideal reconstruction is a weighted sum of sinc functions centred on the sample instants: x̂(t) = Σ x(nT_s)·sinc((t − nT_s)/T_s). The laboratory performs exactly this sum, truncated to the samples on screen.',
          'Watch what happens as the sampling frequency drops toward 2·f_max: the reconstructed curve visibly changes shape. It is not gradually noisier — it is simply wrong in a structured way, because the sinc kernels no longer have enough degrees of freedom to place the frequencies correctly.',
        ],
      },
      {
        heading: 'The anti-aliasing filter is not optional',
        paragraphs: [
          'If any real frequency above f_s/2 is present at the sampler, it does not disappear — it folds down into the audible band. No filter downstream can undo that, because the information has already been merged with legitimate content.',
          'The [[Anti-aliasing filter]] is therefore placed **before** the sampler. Its job is to guarantee the band-limiting condition the theorem requires. In the laboratory, the frequency-domain plot shows exactly what happens to the spectral replicas as the sampling rate changes: at high f_s they sit far apart and can be separated; as f_s falls they slide together until they overlap.',
        ],
      },
    ],
    keyTerms: ['Sampling theorem', 'Nyquist rate', 'Nyquist frequency', 'Band-limiting', 'Anti-aliasing filter', 'Reconstruction filter'],
    formulaIds: ['nyquist', 'nyquist-freq'],
    worked: {
      title: 'Minimum sampling rate for a band-limited signal',
      given: ['A sensor signal contains no frequency above 3.4 kHz', 'You must recover it without any aliasing'],
      steps: [
        'The highest frequency present is f_max = 3400 Hz.',
        'Nyquist rate: f_s ≥ 2 × 3400 = 6800 samples/s.',
        'A real anti-aliasing filter needs a transition band, so 6800 Hz is a lower bound, not a design.',
        'Choose a standard rate above it: 8000 samples/s gives a guard band from 3.4 kHz up to 4.0 kHz for the filter to roll off in.',
      ],
      answer: '6800 samples/s is the theoretical minimum; 8000 samples/s is what telephony actually uses, because the anti-aliasing filter needs the extra 600 Hz of transition band.',
    },
    applications: [
      'Telephony: 8 kHz sampling of a 3.4 kHz voice channel.',
      'Digital audio: CD uses 44.1 kHz for a 20 kHz audio bandwidth; 48 kHz for video.',
      'Any ADC front end: the anti-aliasing filter is what makes the [[Sampling theorem]] applicable at all.',
    ],
    misconceptions: [
      {
        myth: '"Sampling at exactly twice the signal frequency is fine."',
        truth: 'At exactly 2·f_max the signal is a single tone at the Nyquist frequency, where the samples all land on the same phase and carry no amplitude information. Real designs sample comfortably above the limit.',
      },
      {
        myth: '"A higher sampling rate always gives better fidelity."',
        truth: 'Above the Nyquist rate extra samples add nothing to a band-limited signal. Higher rates help only because they leave guard band for a real filter, or because they are used deliberately for oversampling and noise shaping.',
      },
      {
        myth: '"Aliasing can be removed by filtering after sampling."',
        truth: 'Once aliased, the overlapping components are summed irreversibly. The filter must be before the sampler.',
      },
    ],
    conclusion:
      'Sampling is exact, but only under two conditions that are easy to forget: the input must be band-limited, and reconstruction must be ideal. In practice the theorem sets a lower bound that the anti-aliasing filter then pushes upward. The laboratory lets you cross that bound deliberately and watch the reconstruction fail.',
    related: ['m1-aliasing', 'm1-snr-ber', 'm2-chain'],
    vizId: 'sampling',
    vizInitial: { fin: 5, fs: 24 },
    furtherReading: [
      {
        kind: 'read',
        title: 'Wolfram MathWorld — Nyquist–Shannon sampling theorem',
        detail: 'Statement, history and the sinc reconstruction kernel.',
        why: 'Directly supports the reconstruction maths shown in the laboratory.',
        href: 'https://mathworld.wolfram.com/Nyquist-ShannonSamplingTheorem.html',
      },
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — Signals and Systems',
        detail: 'Full lecture series on sampling, spectra and reconstruction.',
        why: 'Treats the frequency-domain view of spectral replicas that the laboratory plots.',
        href: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/',
      },
      {
        kind: 'simulate',
        title: 'Sampling laboratory in this lesson',
        detail: 'Drag the sampling frequency below 2·f_max and observe the reconstruction and the overlapping spectra.',
        why: 'Converts the theorem from a statement into a failure you can watch.',
      },
      {
        kind: 'advanced',
        title: 'SciPy — signal resampling documentation',
        detail: 'Reference implementation notes for band-limited resampling.',
        why: 'Shows how the same constraints appear in production resampling code.',
        href: 'https://docs.scipy.org/doc/scipy/reference/signal.html',
      },
    ],
  },

  {
    id: 'm1-aliasing',
    module: 1,
    index: 3,
    title: 'Aliasing and Sampling Methods',
    sidebarLabel: 'Aliasing, natural vs flat-top',
    minutes: 11,
    summary:
      'What really happens when you sample too slowly, and how a real sample-and-hold circuit behaves differently from an ideal switch.',
    keywords: ['aliasing', 'foldover', 'natural sampling', 'flat-top', 'sample and hold', 'aperture', 'droop', 'acquisition time'],
    objectives: [
      'Describe aliasing in both the time and frequency domains.',
      'Identify the two families of aliasing error: amplitude and phase jitter.',
      'Compare natural sampling with flat-top sampling and state which is practical.',
      'Define aperture time, acquisition time, conversion time, droop and aperture distortion.',
      'Explain why droop and aperture distortion are separate error mechanisms.',
    ],
    sections: [
      {
        heading: 'Aliasing = spectral replicas sliding together',
        paragraphs: [
          'Sampling multiplies the signal spectrum by an impulse train of frequency f_s. In the frequency domain that produces copies of the spectrum every f_s. The [[Reconstruction filter]] then picks out one copy and discards the rest.',
          'If the copies do not overlap, this works perfectly. If f_s < 2·f_max they overlap, and the picked-out copy is a sum of several true components. That sum is the false low-frequency waveform you see on the time-domain plot. This is [[Aliasing]], also called foldover distortion.',
        ],
        bullets: [
          '**Amplitude error (foldover):** the aliased component adds to (or subtracts from) the true one, corrupting its amplitude.',
          '**Phase jitter (fraction-of-a-cycle slip):** the sampling instant drifts relative to the signal period, so the apparent phase wanders — audible as roughness in a sampled musical note.',
          'Neither is removable afterwards. The information is gone at the sampler.',
        ],
      },
      {
        heading: 'Natural versus flat-top sampling',
        paragraphs: [
          '**[[Natural sampling]]** takes each sample at an instant, giving exactly the instantaneous value. It is the idealised model used in the sampling theorem. Physically it would need a switch with zero [[Aperture time]] — infinitely fast — which no circuit has.',
          '**[[Flat-top sampling]]** uses a finite-width switching pulse. The held value is therefore the *average* of the input over the aperture interval, which is a physically real, easily built circuit (the sample-and-hold). The cost is [[Aperture distortion]]: the recorded value is wrong by the amount the signal changed during acquisition.',
        ],
        note: {
          kind: 'limit',
          title: 'Flat-top error is not the same as droop',
          body: 'Aperture distortion is caused by the input changing *during acquisition*. Droop is caused by leakage in the hold circuit *after acquisition*, while the switch is open. Both appear in flat-top sampling but they have different cures: one needs a shorter aperture, the other needs a higher-impedance hold.',
        },
      },
      {
        heading: 'The sample-and-hold timing budget',
        bullets: [
          '**[[Aperture time]] t_a** — the sampling switch is closed and is acquiring the input. Ideally short, because the input changes during it.',
          '**[[Acquisition time]] t_acq** — after the switch closes, the circuit must settle to within the required accuracy. This sets the maximum sample rate, because consecutive acquisitions cannot overlap.',
          '****Hold** — the switch opens and the capacitor holds the value, ideally constant.',
          '**Conversion time** t_conv — the ADC then converts the held voltage to a number.',
          'The full sample period must accommodate t_acq + t_conv, so the achievable sample rate is bounded by the slower of the two.',
        ],
      },
      {
        heading: 'Why flat-top sampling can be corrected',
        paragraphs: [
          'Because aperture error is a deterministic function of input frequency, it can be compensated after the fact. Multiplying each sample by sinc(π f_in t_a) flattens the sinc roll-off that aperture averaging introduces. This is why ADC datasheets quote an [[Aperture time]] and expect you to apply the correction.',
          'The laboratory computes both the natural and flat-top sample trains from the same input so the difference is directly visible, and shows the droop term as an exponential decay you can switch on.',
        ],
      },
    ],
    keyTerms: ['Aliasing', 'Natural sampling', 'Flat-top sampling', 'Sample-and-hold', 'Aperture time', 'Acquisition time', 'Droop', 'Aperture distortion'],
    formulaIds: ['nyquist', 'nyquist-freq'],
    worked: {
      title: 'Quantifying aperture error for a sine input',
      given: ['f_in = 1 kHz sine, amplitude 2 V', 'Aperture time t_a = 10 µs (flat-top sampling)'],
      steps: [
        'During acquisition the input sweeps through Δt = f_in · t_a = 1000 × 10e-6 = 0.01 of a cycle.',
        'The phase swept is 2π × 0.01 = 0.0628 rad ≈ 3.6°.',
        'Average of a sine over a symmetric interval: x̄ ≈ A · sinc(π f_in t_a) = 2 · sinc(0.0314) = 2 × 0.99934.',
        'Peak error ≈ 2 × 0.00066 = 1.3 mV, which grows linearly with input frequency.',
      ],
      answer: 'About 1.3 mV peak at 1 kHz, and it grows proportionally with f_in — which is why aperture distortion is the dominant error for fast, small-amplitude signals.',
    },
    applications: [
      'Every successive-approximation and flash ADC front end contains a sample-and-hold.',
      'Digital oscilloscopes specify aperture time because it sets the highest-frequency amplitude accuracy.',
      'Audio codecs use flat-top sampling with a compensation table.',
    ],
    misconceptions: [
      {
        myth: '"Flat-top sampling causes aliasing."',
        truth: 'It causes a deterministic amplitude error (aperture distortion) that can be corrected in hardware or software. Aliasing is a frequency-domain effect caused by sampling too slowly — a completely separate problem.',
      },
      {
        myth: '"Droop is the same thing as aperture distortion."',
        truth: 'Aperture distortion happens while the switch is closed and is caused by the input moving. Droop happens after the switch opens and is caused by leakage resistance and stray capacitance.',
      },
      {
        myth: '"A shorter acquisition time is always better."',
        truth: 'A shorter aperture reduces aperture error but requires a faster settling amplifier, which usually means more noise. Real designs choose a trade-off, not a minimum.',
      },
    ],
    conclusion:
      'Aliasing is an irreversible frequency-domain loss caused by violating the sampling condition. Aperture distortion and droop are time-domain, deterministic and correctable. Keeping them apart is what lets an engineer choose the right fix: change the filter for aliasing, change the timing or the impedance for aperture error and droop.',
    related: ['m1-sampling', 'm2-quantization'],
    vizId: 'sample-hold',
    vizInitial: { fin: 1, fs: 20, aperture: 40, droop: 12 },
    furtherReading: [
      {
        kind: 'read',
        title: 'All About Circuits — textbook section on sample-and-hold circuits',
        detail: 'Circuit-level treatment of acquisition time, hold droop and buffer design.',
        why: 'Supplies the practical circuit detail the theory section skips.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'simulate',
        title: 'Sample-and-hold laboratory in this lesson',
        detail: 'Compare natural and flat-top sampling, then add droop and watch the held value decay.',
        why: 'Separates the two error mechanisms visually instead of in words.',
      },
      {
        kind: 'watch',
        title: 'MIT OpenCourseWare — Signals and Systems, sampling lectures',
        detail: 'Spectral replica view of the sampling operation.',
        why: 'Explains why the replicas move and overlap as f_s changes.',
        href: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/',
      },
      {
        kind: 'advanced',
        title: 'SciPy signal — decimation and aliasing',
        detail: 'Implementation notes on resampling and the filters that make it correct.',
        why: 'Shows the anti-aliasing filter requirement in working code.',
        href: 'https://docs.scipy.org/doc/scipy/reference/signal.html',
      },
    ],
  },

  {
    id: 'm1-pulse',
    module: 1,
    index: 4,
    title: 'Pulse Modulation Methods',
    sidebarLabel: 'PAM, PWM, PPM, PCM',
    minutes: 9,
    summary:
      'Four ways to put samples on a pulse train — and the one distinction that matters more than all of them: analogue pulse modulation versus digital encoding.',
    keywords: ['PAM', 'PWM', 'PDM', 'PPM', 'PLM', 'PCM', 'pulse modulation', 'analog vs digital'],
    objectives: [
      'Describe how PAM, PWM and PPM each convey a sample value.',
      'Name precisely which parameter carries the information in each scheme.',
      'State the bandwidth consequence of PWM and PPM relative to PAM.',
      'Explain why PCM is categorically different from the other three.',
      'Give a real application for each scheme.',
    ],
    sections: [
      {
        heading: 'The family',
        paragraphs: [
          '**[[PAM]] — pulse amplitude.** The information is in the height of each pulse. This is exactly natural sampling redrawn as a pulse train, so it inherits the same weakness: the pulse train carries a continuous amplitude, so noise on it stays.',
          '**[[PWM]] (pulse width / PDM)** — the information is in the *duration* of each pulse. A constant-amplitude pulse whose width varies is immune to amplitude noise, because the receiver measures time, not height.',
          '**[[PPM]] (pulse position / PLM)** — the information is in the *time position* of a fixed-width pulse within the symbol period. This is PWM with the leading edge discarded.',
        ],
      },
      {
        heading: 'Bandwidth consequence',
        paragraphs: [
          'The pulse train repeats at the sampling rate, so the **minimum** bandwidth is of the order of the sampling rate for all three. The practical difference is spectral shape: PAM with a narrow pulse has a wide sinc-like spectrum, whereas PWM/PPM pulses have fixed width and finite rise/fall, which bounds the highest significant harmonic.',
          'PWM and PPM trade amplitude fidelity for noise immunity. That is exactly why they appear in power electronics and in optical pulse-position links rather than in telephony.',
        ],
      },
      {
        heading: 'PCM is in a different category',
        paragraphs: [
          '**[[PCM]] is not a pulse modulation scheme at all** in this sense. PAM, PWM and PPM are all **analogue pulse modulation**: after modulation the output is still a continuous, noise-sensitive waveform, and every receiver must reproduce an exact amplitude or timing.',
          'PCM applies three further steps after sampling: [[Quantisation]] to a finite set of levels, binary encoding of the level index, and then transmission of the resulting bitstream. The receiver does not reproduce an amplitude — it makes a *decision* about a bit.',
          'This is the same distinction the [[Digital transmission]] lesson draws, applied inside a single transmission: PCM is digital, PAM/PWM/PPM are analogue. PAM is only "analog pulse modulation" until quantisation and encoding are appended.',
        ],
        note: {
          kind: 'info',
          title: 'Where each one turns up',
          body: 'PWM: motor control and LED dimming. PPM: professional show lighting and some optical links. PAM: Ethernet (100BASE-TX uses 3-level PAM-3; 10GBASE-T uses PAM-16 with DSP). PCM: essentially all telephony.',
        },
      },
    ],
    keyTerms: ['PAM', 'PWM', 'PPM', 'PCM', 'Digital transmission', 'Quantisation'],
    formulaIds: [],
    worked: {
      title: 'Reading the same samples three ways',
      given: ['Three normalised sample values: −0.6, +0.2, +0.9'],
      steps: [
        '**PAM:** pulse heights are −0.6, +0.2, +0.9 times the reference.',
        '**PWM:** pulse widths are (x+1)/2 of the slot → 0.20, 0.60, 0.95 of the slot.',
        '**PPM:** pulse positions are (x+1)/2 of the slot → 0.20, 0.60, 0.95 from the slot start.',
        '**PCM (8-bit, ±1 V):** step = 2/256 = 7.81 mV, so the levels are ≈ −0.6016, +0.2031, +0.8984 V, then encoded as 8-bit words.',
      ],
      answer: 'PAM varies height, PWM varies width, PPM varies position — and only PCM ends in a bit sequence where noise causes decision errors rather than continuous corruption.',
    },
    applications: [
      'Ethernet uses PAM with several levels plus DSP equalisation — a good example of PAM alone being noisy and PAM+decoding being robust.',
      'Motor and LED drive uses PWM precisely because timing is immune to supply noise.',
      'All PCM telephony, from 8 kHz voice channels to modern speech codecs.',
    ],
    misconceptions: [
      {
        myth: '"PAM is a form of digital modulation."',
        truth: 'PAM is analogue pulse modulation. It becomes digital only when the amplitudes are quantised and binary encoded — at which point it is PCM.',
      },
      {
        myth: '"PPM and PWM are the same thing."',
        truth: 'They carry identical information (PPM is PWM with the leading edge discarded), but they differ in power, average amplitude and receiver complexity.',
      },
      {
        myth: '"Pulse modulation always reduces bandwidth."',
        truth: 'The pulse rate sets a lower bound on bandwidth for all of them. What changes between PAM, PWM and PPM is the spectral shape and the noise sensitivity, not the fundamental rate.',
      },
    ],
    conclusion:
      'PAM, PWM and PPM all carry a continuous quantity and differ only in which pulse parameter is varied. PCM is the odd one out: it adds quantisation and encoding so the receiver makes bit decisions instead of reproducing amplitudes. That difference is the reason digital systems dominate and analogue pulse modulation survives only where timing measurement is cheap and reliable.',
    related: ['m1-digital-vs-analog', 'm2-chain', 'm2-quantization'],
    vizId: 'pulse-modulation',
    vizInitial: { kind: 'PAM' },
    furtherReading: [
      {
        kind: 'read',
        title: 'All About Circuits — pulse and digital modulation textbook section',
        detail: 'Circuit descriptions of PWM, PPM and DAC interfaces.',
        why: 'Practical hardware context for the timing-based schemes.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'read',
        title: 'ITU-T recommendations (G.711 series)',
        detail: 'The standard that defines μ-law and A-law PCM coding.',
        why: 'The authoritative source for the PCM coding convention used in Module 2.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'simulate',
        title: 'Pulse modulation laboratory in this lesson',
        detail: 'Switch between PAM, PWM and PPM and watch the same samples redraw.',
        why: 'Makes "which parameter carries the information" immediately obvious.',
      },
      {
        kind: 'advanced',
        title: 'NPTEL — communication systems lectures',
        detail: 'Course material covering pulse modulation schemes.',
        why: 'Formal treatment with derivations.',
        href: 'https://nptel.ac.in/courses',
      },
    ],
  },

  {
    id: 'm1-snr-ber',
    module: 1,
    index: 5,
    title: 'Signal-to-Noise Ratio and Bit Error Rate',
    sidebarLabel: 'SNR and BER',
    minutes: 10,
    summary:
      'The two numbers that describe how well a link works, what each one actually measures, and why a short experiment cannot pin down BER as precisely as it appears to.',
    keywords: ['SNR', 'BER', 'dB', 'noise', 'Q function', 'BPSK', 'error probability', 'Wilson interval'],
    objectives: [
      'Compute SNR in dB from signal and noise powers, and avoid the 10·log vs 20·log trap.',
      'Measure an empirical BER from a transmitted and received bit sequence.',
      'Use the Q-function BER expressions for coherent BPSK and BFSK as reference curves.',
      'Explain that the SNR-to-BER relationship depends on modulation, coding and detection.',
      'State why a short run gives a noisy BER estimate and quantify the uncertainty.',
    ],
    sections: [
      {
        heading: 'SNR — a power ratio',
        paragraphs: [
          '[[SNR]] is the ratio of wanted signal power to noise power, normally quoted in decibels as 10·log₁₀(P_s/P_n). The factor of 10 is correct because this is a **power** ratio. If you work with amplitudes or RMS values instead, use 20·log₁₀ — mixing the two is the single most common numerical error in this subject.',
          'Both signal and noise must be measured over the same bandwidth. Quoting a noise figure "over 1 kHz" next to a signal power "over the full band" is meaningless.',
        ],
      },
      {
        heading: 'BER — an empirical count',
        paragraphs: [
          '[[BER]] is simply errors divided by total bits for one specific transmission. It is a measurement, not a law. The laboratory sends a known bit string through a noisy channel, shows which decisions flipped, and counts them.',
          'The important honesty point: with N bits and k errors, the estimate has real statistical uncertainty. The laboratory therefore also reports a 95 % [[SNR]] confidence interval computed from the Wilson score interval, so you can see that 5 errors in 20 000 bits does **not** establish a BER of 2.5 × 10⁻⁴ — it establishes something like 8 × 10⁻⁵ to 7 × 10⁻⁴.',
        ],
        note: {
          kind: 'limit',
          title: 'Why a short run cannot show a small BER',
          body: 'To measure a BER of 10⁻⁶ empirically you must transmit on the order of 10⁸ bits and observe roughly 100 errors. That is why theoretical curves such as Q(√(2E_b/N_0)) are used for design, and empirical BER is used for verification.',
        },
      },
      {
        heading: 'How SNR becomes BER — and why there is no single curve',
        paragraphs: [
          'For coherent BPSK in additive white Gaussian noise, BER = Q(√(2E_b/N_0)). Coherent orthogonal BFSK gives ½Q(√(E_b/N_0)) — a 3 dB advantage at low error rates. Non-coherent FSK and differential schemes are worse still.',
          'These are **reference curves for specific assumptions**: additive white Gaussian noise, ideal synchronisation, antipodal or orthogonal signals, no fading, no coding. Change any of those and the curve moves. There is no "the SNR-to-BER relationship" — there are many, indexed by modulation, detection method, coding and channel model.',
        ],
        bullets: [
          'Higher-order modulation concentrates points closer together, so the same noise causes more crossings.',
          'FEC coding lets the system run at a lower Eb/N0 for a target BER — but adds redundancy and latency.',
          'Fading and interference make real BER worse than any AWGN prediction.',
        ],
      },
    ],
    keyTerms: ['SNR', 'BER', 'Constellation', 'DSSS', 'Redundancy'],
    formulaIds: ['snr-db', 'ber', 'ber-bpsk'],
    worked: {
      title: 'From measured counts to an honest statement',
      given: ['A coherent BPSK link runs at E_b/N_0 = 8 dB', 'The laboratory transmits 20 000 bits'],
      steps: [
        'Theory: Q(√(2 × 10^0.8)) = Q(√(12.6)) = Q(3.55) ≈ 1.9 × 10⁻⁴.',
        'That predicts about 20000 × 1.9e-4 ≈ 3.8 errors.',
        'Suppose 6 errors are observed: empirical BER = 3.0 × 10⁻⁴.',
        'Wilson 95 % interval for 6/20000 is approximately 1.3 × 10⁻⁴ to 6.6 × 10⁻⁴ — which contains the theoretical value, as it should.',
      ],
      answer: 'Report the empirical BER and its interval; treat the theoretical curve as a prediction to check against, not a replacement for measurement.',
    },
    applications: [
      'Link budgets: required Eb/N0 sets the minimum SNR for a target BER.',
      'Acceptance testing: measuring BER against a specified threshold.',
      'Comparing modulation schemes: the same Eb/N0 produces very different BER for BPSK and 16-QAM.',
    ],
    misconceptions: [
      {
        myth: '"SNR and BER are the same thing expressed differently."',
        truth: 'SNR is a ratio of powers at the receiver; BER is a probability of a decision error. They are linked only through a specific system model — modulation, detection, coding and channel.',
      },
      {
        myth: '"A BER of 0 over 10 000 bits means the link is perfect."',
        truth: 'It means no errors occurred in that run. The 95 % upper bound is still around 3 × 10⁻⁴ — the link is only proven good to about that level.',
      },
      {
        myth: '"Use 20·log₁₀ for SNR because it is a voltage ratio."',
        truth: 'Only if you have squared the voltage into power first. Mixing the factor of 10 and 20 is the classic 3 dB-style error in this field.',
      },
    ],
    conclusion:
      'SNR measures link quality and BER measures link correctness; the relationship between them is a family of curves indexed by the system, not a single law. And because BER is measured, every empirical figure carries an interval. Reporting 2.5 × 10⁻⁴ without noting that 20 000 bits were sent overstates what the data supports.',
    related: ['m1-digital-vs-analog', 'm4-qam', 'm6-arq'],
    vizId: 'snr-ber',
    vizInitial: { ebn0: 9, bits: 24, scheme: 'BPSK' },
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — digital communication',
        detail: 'Noise models, error probability derivations and detectors.',
        why: 'Source for the AWGN assumptions behind the BER curves.',
        href: 'https://ocw.mit.edu/search/?q=digital%20communication',
      },
      {
        kind: 'simulate',
        title: 'SNR/BER laboratory in this lesson',
        detail: 'Adjust Eb/N0 and scheme, and watch both the theoretical curve and the measured count.',
        why: 'Shows exactly how far a finite run can be trusted.',
      },
      {
        kind: 'read',
        title: 'GNU Radio documentation',
        detail: 'Reference implementations of BPSK/QPSK transmit and receive chains.',
        why: 'Shows how the model is realised in working software.',
        href: 'https://www.gnuradio.org/doc/',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — Q-function',
        detail: 'Definition and properties of the Gaussian tail probability.',
        why: 'Backs the error-probability expressions used throughout.',
        href: 'https://mathworld.wolfram.com/Erf.html',
      },
    ],
  },
];