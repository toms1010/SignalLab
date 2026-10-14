import type { Lesson } from '@/types';

export const module5Lessons: Lesson[] = [
  {
    id: 'm5-fundamentals',
    module: 5,
    index: 1,
    title: 'Analog Transmission Fundamentals',
    sidebarLabel: 'Analog transmission fundamentals',
    minutes: 7,
    summary: 'Why modulate at all, and what carrier, message and modulated signal each mean.',
    keywords: ['analog', 'carrier', 'message', 'modulation', 'demodulation', 'analogue signal'],
    objectives: [
      'Define carrier, message and modulated signal.',
      'Distinguish analogue-data-to-analogue-signal from digital-data-to-analogue-signal.',
      'List four reasons for using modulation.',
      'Explain what a demodulator must recover.',
      'Recognise the difference between modulating a signal and encoding it.',
    ],
    sections: [
      {
        heading: 'The vocabulary',
        bullets: [
          '**Message or modulating signal** — the information to be sent, m(t).',
          '**Carrier** — the high-frequency reference, c(t) = A_c cos(2πf_c t).',
          '**Modulated signal** — s(t), the result of varying some parameter of the carrier by m(t).',
          '**Demodulator** — the receiver stage that reverses the process.',
        ],
      },
      {
        heading: 'Two directions',
        paragraphs: [
          '**Analogue data → analogue signal** is classical modulation (AM, FM, PM). The message is continuous and the recovered waveform is continuous.',
          '**Digital data → analogue signal** is digital-to-analogue conversion (ASK, FSK, PSK, QAM). The message is a bit sequence, and the "message" being recovered at the receiver is bits.',
          'The same physical apparatus serves both; what changes is what the receiver decides to recover.',
        ],
      },
      {
        heading: 'Why modulate',
        bullets: [
          '**Efficient transmission.** High-frequency carriers radiate efficiently and couple well into the propagation medium of the target band.',
          '**Size.** A 3 kHz voice signal radiated directly at 3 kHz would need a physically enormous antenna. A 1 MHz carrier with a quarter-wave antenna does the same job.',
          '**Multiplexing.** Many narrowband sources share one wideband channel by being assigned different carrier frequencies.',
          '**Noise immunity.** The receiver can be made selective — narrow filters reject out-of-band noise before detection.',
        ],
      },
      {
        heading: 'Modulation is not coding',
        paragraphs: [
          'Modulation changes how information is represented on the channel. Coding adds redundancy to detect and correct errors. The two are independent: an FSK signal may carry a parity-protected bit stream, and a PCM signal may be sent with no coding at all.',
        ],
      },
    ],
    keyTerms: ['Carrier', 'Modulation index', 'Analog transmission', 'Digital transmission', 'Multiplexing'],
    formulaIds: [],
    worked: {
      title: 'Sizing an antenna by moving the signal up in frequency',
      given: ['A quarter-wave monopole at 1 MHz versus transmitting the 3 kHz voice signal directly'],
      steps: [
        'Quarter-wave monopole: L = c / (4f) = 3e8 / (4 × 1e6) = 75 m.',
        'At 3 kHz: L = 3e8 / (4 × 3e3) = 25 000 m = 25 km.',
        'A 25 km antenna is not a practical solution; 75 m is.',
      ],
      answer: 'Moving the information from 3 kHz to 1 MHz reduces the required antenna from about 25 km to about 75 m.',
    },
    applications: [
      'Broadcast radio and television.',
      'Any radio link, from walkie-talkies to satellite.',
      'Telemetry where a carrier is used to reach the required frequency band.',
    ],
    misconceptions: [
      {
        myth: '"Modulation improves the SNR."',
        truth: 'It does not. Linear modulation keeps the same SNR; angle modulation improves post-detection SNR at the cost of bandwidth, which is a separate mechanism.',
      },
      {
        myth: '"Modulation compresses the data."',
        truth: 'Compression reduces redundancy in the information. Modulation changes the transmission format and usually increases bandwidth.',
      },
      {
        myth: '"Any signal can go direct without a carrier."',
        truth: 'Only if it happens to match the antenna and propagation requirements of the target band — which is rarely the case.',
      },
    ],
    conclusion:
      'Modulation exists to match a signal to a physical channel: the right antenna size, the right propagation band, the ability to share a medium with others, and enough selectivity for the receiver to reject noise. What it does not do is improve SNR or reduce data volume.',
    related: ['m5-am', 'm5-comparison', 'm5-fm'],
    vizId: 'mod-compare',
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — communication systems lectures',
        detail: 'Introduction to modulation and demodulation.',
        why: 'Standard treatment of carrier, message and modulated signal.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Modulation comparison panel in this lesson',
        detail: 'Switch between AM, FM and PM and watch the same message produce three different waveforms.',
        why: 'Establishes the baseline the following three lessons build on.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — modulation textbook section',
        detail: 'Transmitter and demodulator circuits.',
        why: 'Circuit-level context for each modulation type.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — modulation',
        detail: 'Formal definitions of the modulation family.',
        why: 'Reference definitions to check terminology against.',
        href: 'https://mathworld.wolfram.com/Modulation.html',
      },
    ],
  },

  {
    id: 'm5-am',
    module: 5,
    index: 2,
    title: 'Amplitude Modulation',
    sidebarLabel: 'Amplitude modulation (AM)',
    minutes: 12,
    summary: 'The oldest, simplest and least power-efficient modulation — and still everywhere, because the detector is a diode.',
    keywords: ['AM', 'DSB-FC', 'DSB-SC', 'SSB', 'modulation index', 'overmodulation', 'sideband', 'envelope detector'],
    objectives: [
      'Write the conventional AM waveform and identify the envelope.',
      'Compute modulation index and percentage modulation.',
      'Compute AM bandwidth and transmitted power.',
      'Compare DSB-FC, DSB-SC and SSB.',
      'Recognise overmodulation and explain what a detector does with it.',
    ],
    sections: [
      {
        heading: 'Conventional AM (DSB-FC)',
        paragraphs: [
          's(t) = A_c[1 + m_a·m(t)]cos(2πf_c t), with m_a = A_m/A_c for a single tone. The envelope of the waveform is exactly A_c[1 + m_a·m(t)], which is what makes envelope detection possible.',
          'The carrier itself carries no information — yet in DSB-FC most of the power goes into it. That is the fundamental inefficiency of conventional AM.',
        ],
      },
      {
        heading: 'Modulation index and overmodulation',
        paragraphs: [
          'm_a = A_m/A_c. At m_a = 1 the envelope touches zero at the message trough — this is **100 % modulation**, the most that can be sent without distortion.',
          'At m_a > 1 the envelope would cross zero and reappear with reversed phase. A diode envelope detector cannot follow that: it clips at zero, so the recovered message is flattened and phase-reversed in part. This is [[Overmodulation]], and it sounds like a harsh, distorted mess.',
        ],
      },
      {
        heading: 'Spectrum and bandwidth',
        paragraphs: [
          'AM multiplication puts the message spectrum symmetrically around the carrier: lower sideband at f_c − f_m, upper at f_c + f_m, plus the carrier line at f_c itself.',
          'B_AM = 2·f_m,max, regardless of m_a. Note the consequence: at m_a = 0 the bandwidth is still 2·f_m,max even though nothing is being transmitted at all.',
        ],
      },
      {
        heading: 'Power',
        paragraphs: [
          'P_T = P_C(1 + m_a²/2) for a single-tone message. At m_a = 1 the sidebands carry exactly as much power as the carrier, so only half the transmitted power carries information — and the carrier power is pure overhead.',
          'DSB-SC removes the carrier, doubling the efficiency to 100 %. SSB removes one sideband too, doubling it again while halving the bandwidth. Both require a coherent receiver or a costlier single-sideband detector.',
        ],
      },
      {
        heading: 'Transmitter architectures',
        bullets: [
          '**Preamplifier** — brings the microphone signal to a workable level.',
          '**RF carrier oscillator** — generates the stable carrier.',
          '**Buffer amplifier** — isolates the oscillator from the modulated stage, preventing it being pulled by the modulator.',
          '**Modulator** — applies the message to the carrier.',
          '**Intermediate and final power amplifiers** — raise the modulated signal to the transmit power.',
          '**Low-level modulation** — modulation happens at low power and the linear final amplifier provides the power. Higher fidelity, more linear amplifier needed.',
          '**High-level modulation** — modulation happens in the final power stage. Simpler and cheaper, but needs the modulator to handle full power.',
        ],
      },
    ],
    keyTerms: ['Carrier', 'Modulation index', 'Overmodulation', 'Sideband', 'SNR'],
    formulaIds: ['am-index', 'am-bandwidth', 'am-power'],
    worked: {
      title: 'Full AM power and bandwidth budget',
      given: ['P_C = 500 W, m_a = 0.7', 'Voice band-limited to 4 kHz'],
      steps: [
        'P_T = 500 × (1 + 0.49/2) = 500 × 1.245 = 622.5 W.',
        'Sideband power = 622.5 − 500 = 122.5 W (19.7 % of total).',
        'Bandwidth B_AM = 2 × 4 kHz = 8 kHz.',
        'Compare: SSB would need 122.5 W for the same information in 4 kHz — five times more power-efficient.',
      ],
      answer: '622.5 W total for 8 kHz of bandwidth, of which only 122.5 W carries information.',
    },
    applications: [
      'AM broadcast, 530–1700 kHz in North America (allocations vary by country and regulatory plan).',
      'Two-way radio, airband and marine communication.',
      'Citizen-band and walkie-talkie sets, where the envelope detector matters more than efficiency.',
    ],
    misconceptions: [
      {
        myth: '"A bigger modulation index is always better."',
        truth: 'It is better up to m_a = 1, and beyond that it is distortion. 100 % modulation is the correct target.',
      },
      {
        myth: '"The carrier carries the message."',
        truth: 'The carrier is fixed in amplitude and frequency. It carries no information at all — it exists so an envelope detector can work.',
      },
      {
        myth: '"AM bandwidth depends on the modulation index."',
        truth: 'It does not. B_AM = 2f_m,max whatever m_a is, because the sidebands occupy the same positions.',
      },
      {
        myth: '"AM is as good as FM at the same power."',
        truth: 'Post-detection SNR for AM is worse by the modulation improvement factor, roughly m_a²/2 — about 1.6 dB at full modulation. That is why FM dominates high-quality broadcasting.',
      },
    ],
    conclusion:
      'AM trades efficiency for simplicity. Full-carrier AM wastes power on a carrier that carries nothing, needs twice the bandwidth of SSB, and has a post-detection SNR worse than FM. It survives because a single diode and an RC filter recover the message — a simplicity that is still decisive in low-cost and two-way radio.',
    related: ['m5-fm', 'm5-comparison', 'm5-receiver'],
    vizId: 'am-lab',
    vizInitial: { fm: 0.05, ma: 0.6, carrier: 40 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — amplitude modulation lectures',
        detail: 'Derivation of sidebands, power and the modulation index.',
        why: 'Full derivations for every formula in this lesson.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'AM waveform laboratory in this lesson',
        detail: 'Push m_a past 1.0 and watch the envelope invert and the detected message distort.',
        why: 'Overmodulation is far easier to see than to describe.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — AM transmitter sections',
        detail: 'Practical transmitter block diagrams.',
        why: 'Circuit context for the block list.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — amplitude modulation',
        detail: 'Formal definitions and sideband structure.',
        why: 'Reference for DSB-SC and SSB terminology.',
        href: 'https://mathworld.wolfram.com/AmplitudeModulation.html',
      },
    ],
  },

  {
    id: 'm5-fm',
    module: 5,
    index: 3,
    title: 'Frequency Modulation',
    sidebarLabel: 'Frequency modulation (FM)',
    minutes: 11,
    summary: 'Constant amplitude, varying frequency — and a bandwidth penalty paid for a noise advantage.',
    keywords: ['FM', 'frequency deviation', 'modulation index', 'Carson', 'carrier swing', 'narrowband', 'wideband'],
    objectives: [
      'Write the FM waveform and identify instantaneous frequency.',
      'Compute deviation ratio β, carrier swing and Carson bandwidth.',
      'Distinguish narrowband from wideband FM.',
      'Explain the bandwidth-versus-noise trade that defines FM.',
      'Compare FM and PM mathematically.',
    ],
    sections: [
      {
        heading: 'The waveform',
        paragraphs: [
          'FM varies the **instantaneous frequency** of a constant-amplitude carrier: s(t) = A_c cos(2πf_c t + β·sin(2πf_m t)). The instantaneous frequency is f_i(t) = f_c + β·f_m·cos(2πf_m t) = f_c + Δf·cos(2πf_m t).',
          'Because the amplitude never changes, FM is compatible with nonlinear power amplifiers — a property that made it standard for broadcast.',
        ],
      },
      {
        heading: 'Deviation and index',
        bullets: [
          'Δf — peak frequency deviation, in Hz.',
          'β = Δf/f_m — the modulation index, meaningful for a single tone.',
          'Carrier swing CS = 2Δf — what a deviation meter actually reads as full-scale.',
          'β < 1 is narrowband FM (used for voice and two-way radio); β > 1 is wideband FM (broadcast).',
        ],
      },
      {
        heading: 'Bandwidth',
        paragraphs: [
          'FM with a sinusoidal message technically has infinitely many sidebands, with amplitudes given by Bessel functions. For small β, two sidebands dominate — the narrowband case, where the signal is effectively an AM signal with a quadrature term.',
          'For large β the sideband count grows as roughly N ≈ β + 1 on each side, giving B ≈ 2N·f_m.',
          "**[[Carson's rule]]** approximates all of this as B ≈ 2(Δf + f_m,max), keeping roughly 98 % of the power. It is a design rule, not a theorem — which is why every bandwidth figure in this course labels it as an estimate.",
        ],
      },
      {
        heading: 'FM versus PM',
        paragraphs: [
          'PM varies **phase** directly: s(t) = A_c cos(2πf_c t + m_p·sin(2πf_m t)). The distinction is what happens to the deviation when the message frequency changes.',
          'For FM, deviation Δf is independent of f_m, so β = Δf/f_m varies with f_m. For PM, the phase deviation m_p is constant, so the equivalent frequency deviation is m_p·f_m — deviation scales with frequency.',
          'A PM modulator followed by a pre-filter that rolls off at 6 dB/octave is exactly an FM modulator. This equivalence is why "FM with a pre-emphasis network" is a common practical implementation.',
        ],
      },
    ],
    keyTerms: ['Frequency deviation', 'Modulation index', "Carson's rule", 'Carrier', 'Pre-emphasis'],
    formulaIds: ['fm-index', 'carson', 'carrier-swing', 'am-bandwidth'],
    worked: {
      title: 'Broadcast FM channel budget',
      given: ['Δf = 75 kHz', 'Audio band-limited to 15 kHz'],
      steps: [
        'Worst-case index β = 75 000 / 15 000 = 5.',
        'Carrier swing CS = 2 × 75 kHz = 150 kHz.',
        "Carson's rule: B ≈ 2(75 000 + 15 000) = 180 kHz.",
        'Actual broadcast channel spacing is 200 kHz — consistent with the estimate.',
        'Compare AM: the same 15 kHz audio needs 30 kHz of bandwidth, six times narrower, but with far worse noise performance.',
      ],
      answer: 'β = 5, swing 150 kHz, Carson bandwidth 180 kHz against 200 kHz allocated.',
    },
    applications: [
      'FM broadcast, 88–108 MHz in most of the world (a regional allocation; check your local plan).',
      'Two-way radio, where a narrow deviation keeps the channel narrow.',
      'FM audio in tape, broadcast and telephony (the 1200 Hz dev tones in telephony are a narrowband FM-like scheme).',
    ],
    misconceptions: [
      {
        myth: '"FM has a fixed bandwidth regardless of the message."',
        truth: 'Bandwidth scales with deviation. Constant deviation does not mean constant bandwidth, because β = Δf/f_m changes with the message frequency.',
      },
      {
        myth: '"Carson\'s rule gives the exact bandwidth."',
        truth: 'It is an approximation retaining about 98 % of power. It is always quoted here as an estimate.',
      },
      {
        myth: '"FM is completely immune to noise."',
        truth: 'It improves post-detection SNR by the modulation improvement factor, which is finite. Capture, threshold effect and impulse noise all still apply.',
      },
    ],
    conclusion:
      'FM buys noise performance with bandwidth. The carrier amplitude never changes, which makes nonlinear power amplifiers usable, and the deviation moves the signal away from interference. The cost is the bandwidth that Carson\'s rule estimates — and it is an estimate, so treat it that way.',
    related: ['m5-pm', 'm5-comparison', 'm5-noise'],
    vizId: 'fm-lab',
    vizInitial: { fm: 0.03, df: 1.2, fc: 20 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — frequency modulation lectures',
        detail: 'Bessel function derivation and Carson\'s rule.',
        why: 'The sideband-count argument behind every FM bandwidth estimate.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'FM laboratory in this lesson',
        detail: 'Change Δf and f_m and watch the waveform\'s zero crossings spread and bunch.',
        why: 'Instantaneous frequency becomes obvious from the zero crossings.',
      },
      {
        kind: 'read',
        title: 'Wolfram MathWorld — frequency modulation',
        detail: 'Formal definition and sideband structure.',
        why: 'Independent reference for the FM formulas.',
        href: 'https://mathworld.wolfram.com/FrequencyModulation.html',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — communication systems',
        detail: 'Analogue modulation and detection lecture material.',
        why: 'Broader context for FM detection methods.',
        href: 'https://ocw.mit.edu/search/?q=communication%20systems',
      },
    ],
  },

  {
    id: 'm5-pm',
    module: 5,
    index: 4,
    title: 'Phase Modulation',
    sidebarLabel: 'Phase modulation (PM)',
    minutes: 7,
    summary: 'Vary the phase instead of the frequency — and discover the two are not as different as they look.',
    keywords: ['PM', 'phase deviation', 'FM equivalence', 'instantaneous phase', 'angle modulation'],
    objectives: [
      'Write the PM waveform and identify phase deviation.',
      'Compute the instantaneous frequency of a PM signal.',
      'Show the equivalence between PM with pre-filtering and FM.',
      'Compare the deviation behaviour of PM and FM.',
      'Give a practical application for PM.',
    ],
    sections: [
      {
        heading: 'The waveform',
        paragraphs: [
          'PM holds amplitude constant and varies the instantaneous **phase**: s(t) = A_c cos(2πf_c t + φ(t)) with φ(t) = m_p·m(t). For a sinusoidal message, φ(t) = m_p·sin(2πf_m t) and m_p is the peak phase deviation in radians.',
          'The instantaneous frequency of any angle-modulated signal is (1/2π)·dφ/dt. For PM that gives f_i(t) = f_c + (m_p·f_m/2π)·cos(2πf_m t) — so the equivalent frequency deviation is proportional to f_m.',
        ],
      },
      {
        heading: 'PM versus FM',
        bullets: [
          'FM: deviation Δf is **constant**; the index β = Δf/f_m therefore changes with message frequency.',
          'PM: phase deviation is **constant**; the equivalent Δf = m_p·f_m/2π therefore changes with message frequency.',
          'With a message weighted so that its amplitude falls as 1/f, the two become identical in observed effect.',
        ],
        paragraphs: [
          'A PM modulator followed by a filter with a −6 dB/octave response produces exactly the FM waveform. Conversely, FM followed by an integrator produces PM. They are the same modulation viewed at different points in a chain, and this is why "FM transmitters with phase modulators" is not a contradiction.',
        ],
      },
      {
        heading: 'Where PM is used',
        bullets: [
          'As the internal implementation of an FM modulator, preceded by a pre-emphasis filter.',
          'In digital links, where phase and frequency are used together and the distinction stops being useful.',
          'In low-cost synthesiser phase-locked loops, where the VCO is naturally a phase modulator.',
        ],
      },
    ],
    keyTerms: ['Frequency deviation', 'Modulation index', 'Carrier', 'Frequency deviation'],
    formulaIds: ['fm-index', 'carson'],
    worked: {
      title: 'Compare equivalent deviation of FM and PM at two frequencies',
      given: ['PM with m_p = 2 rad', 'FM with Δf = 2 kHz'],
      steps: [
        'PM at f_m = 500 Hz: Δf = 2 × 500 / (2π) = 159 Hz.',
        'PM at f_m = 4 kHz: Δf = 2 × 4000 / (2π) = 1273 Hz.',
        'FM at both frequencies: Δf = 2000 Hz in both cases.',
        'So PM deviation rises with frequency while FM deviation stays flat.',
      ],
      answer: 'PM: 159 Hz then 1273 Hz. FM: 2000 Hz at both. The behaviours differ precisely because one holds phase fixed and the other holds frequency deviation fixed.',
    },
    applications: [
      'FM broadcast transmitters implemented as PM modulators with a pre-emphasis network.',
      'Phase-locked loops and frequency synthesiser VCOs.',
      'Digital modulation schemes that use phase as a primary variable.',
    ],
    misconceptions: [
      {
        myth: '"PM and FM are unrelated."',
        truth: 'They are two views of angle modulation. A −6 dB/octave filter between a PM modulator and the antenna produces an FM signal.',
      },
      {
        myth: '"PM has a fixed bandwidth."',
        truth: 'Its bandwidth depends on its equivalent deviation, which grows with message frequency — so PM bandwidth typically grows with the message\'s high-frequency content.',
      },
      {
        myth: '"PM modulation index is m_p."',
        truth: 'm_p is the phase deviation in radians. The FM-style modulation index would be β = (m_p/2π)·(f_m/f_high).',
      },
    ],
    conclusion:
      'PM and FM are the same family of signals. Fixing phase deviation gives a deviation that rises with frequency; fixing frequency deviation gives one that does not. A single filter between modulator and antenna is all that separates them.',
    related: ['m5-fm', 'm5-comparison', 'm5-noise'],
    vizId: 'fm-lab',
    vizInitial: { mode: 'PM', pm: 1.6, fm: 0.03, fc: 20 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — phase modulation lectures',
        detail: 'PM derivation and the FM/PM equivalence.',
        why: 'Direct source for the relationship described here.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'FM/PM laboratory in this lesson',
        detail: 'Switch between FM and PM and watch the same message produce different waveforms.',
        why: 'The difference is only visible when both are shown on the same time base.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — PLL section',
        detail: 'Phase-locked loops as phase/frequency demodulators.',
        why: 'Shows PM appearing inside a practical device.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — phase modulation',
        detail: 'Formal definitions and instantaneous frequency relation.',
        why: 'Reference for the derivative relationship.',
        href: 'https://mathworld.wolfram.com/PhaseModulation.html',
      },
    ],
  },

  {
    id: 'm5-comparison',
    module: 5,
    index: 5,
    title: 'AM, FM and PM Compared',
    sidebarLabel: 'AM vs FM vs PM',
    minutes: 8,
    summary: 'One table, and the reason the choice is really about bandwidth versus noise.',
    keywords: ['comparison', 'bandwidth', 'noise', 'power', 'application', 'broadcast band'],
    objectives: [
      'Compare the three schemes by information parameter, bandwidth, power and complexity.',
      'Explain the modulation improvement factor.',
      'State the broadcast band allocations and note regional variation.',
      'Match each scheme to a real application and justify it.',
      'Recognise which comparison claims depend on assumptions.',
    ],
    sections: [
      {
        heading: 'The comparison',
        paragraphs: [
          'All three are **angle or amplitude** modulation of a carrier. The differences come down to which parameter is varied, how much bandwidth that costs, and what the receiver must do to undo it.',
          'The panel in this lesson regenerates the table live from the current parameter values, so the bandwidth and power columns always agree with the waveforms above them.',
        ],
      },
      {
        heading: 'Why FM sounds better',
        paragraphs: [
          'In AM, noise amplitude is added to the signal before detection, and a fraction m_a²/2 of that noise survives detection. In FM, the limiter removes amplitude noise before the discriminator, so only phase noise remains — and phase noise translates into a much smaller output disturbance.',
          'The gain is the **modulation improvement factor**, roughly β²/2 + 1 for wideband FM: about 11 dB at β = 5. That is the entire reason FM broadcast exists.',
        ],
      },
      {
        heading: 'Band allocations',
        paragraphs: [
          'AM broadcast occupies roughly **530–1700 kHz** in North America, with 10 kHz channels. FM broadcast occupies **88–108 MHz**, with 200 kHz channels.',
          'Both figures are **regional**. The AM band below 530 kHz and various high-frequency bands are used in other countries, and channel plans differ. Always check the allocation that applies where the system operates.',
        ],
        note: {
          kind: 'limit',
          title: 'Bandwidth numbers depend on the criterion',
          body: 'FM bandwidth has no single exact answer: infinite sidebands, a percentage-power criterion, or Carson\'s rule each give a different number. The table uses Carson\'s rule and says so, and labels it an estimate rather than a fact.',
        },
      },
    ],
    keyTerms: ['Modulation index', "Carson's rule", 'Capture effect', 'Frequency deviation', 'Sideband'],
    formulaIds: ['am-bandwidth', 'carson', 'am-power', 'am-index', 'fm-index'],
    worked: {
      title: 'Same message, three schemes',
      given: ['Message band-limited to 5 kHz', 'AM: m_a = 0.8; FM: Δf = 5 kHz'],
      steps: [
        'AM bandwidth = 2 × 5 kHz = 10 kHz.',
        'FM (Carson) = 2(5 kHz + 5 kHz) = 20 kHz.',
        'AM power at m_a = 0.8: P_T = P_C(1 + 0.32) = 1.32·P_C, of which 24 % is information.',
        'FM improvement factor at β = 1: 1 + 0.5 = 1.5 → 1.76 dB.',
      ],
      answer: 'FM needs twice the bandwidth of AM here and gains 1.76 dB; at broadcast FM deviations the gain reaches about 11 dB, which is what justifies the extra spectrum.',
    },
    applications: [
      'AM broadcast: long range, simple receivers, tolerant of selective fading.',
      'FM broadcast: high fidelity in urban areas, constant power consumption, stereo.',
      'PM: as the implementation technique inside FM transmitters and PLLs.',
    ],
    misconceptions: [
      {
        myth: '"FM is immune to noise, AM is not."',
        truth: 'FM is far more tolerant, not immune. Capture, threshold effect, impulse noise and co-channel interference all still affect FM.',
      },
      {
        myth: '"FM broadcasts on 88–108 MHz everywhere."',
        truth: 'That is the widespread but regionally variable allocation. Check the plan for the region in question.',
      },
      {
        myth: '"AM and FM have the same bandwidth."',
        truth: 'For the same message, FM needs roughly 2(Δf + f_m) against 2f_m for AM — often several times more.',
      },
    ],
    conclusion:
      'AM is efficient in circuit simplicity, FM in delivered quality, and the choice between them is a decision about how much spectrum and power to spend. Any comparison that quotes a single bandwidth for FM without naming its criterion is incomplete.',
    related: ['m5-noise', 'm5-receiver', 'm5-fundamentals'],
    vizId: 'spectrum',
    vizInitial: { scheme: 'FM', fm: 0.04, beta: 3, fc: 40, components: 6 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — analogue modulation lectures',
        detail: 'AM, FM and PM with noise performance comparisons.',
        why: 'Derives the modulation improvement factor.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Modulation comparison panel in this lesson',
        detail: 'Regenerate the comparison table from live parameter values.',
        why: 'A table you can change is harder to memorise wrongly.',
      },
      {
        kind: 'read',
        title: 'IEEE — broadcast and communications resources',
        detail: 'Standards context for band allocations.',
        why: 'Source for the regulatory figures.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'ITU radio regulations reference',
        detail: 'Internationally recognised frequency allocations.',
        why: 'Where band plans are defined rather than guessed.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
    ],
  },

  {
    id: 'm5-noise',
    module: 5,
    index: 6,
    title: 'Noise, FM Demodulation and the Capture Effect',
    sidebarLabel: 'Noise, FM demod, capture effect',
    minutes: 10,
    summary: 'What actually happens when noise meets a modulated signal — and why FM improves rather than abolishes the problem.',
    keywords: ['noise', 'limiter', 'capture effect', 'pre-emphasis', 'de-emphasis', 'Foster-Seeley', 'PLL', 'threshold'],
    objectives: [
      'Explain why a limiter before the FM discriminator removes amplitude noise.',
      'Explain the capture effect under stated conditions.',
      'Describe pre-emphasis and de-emphasis and why they are a matched pair.',
      'Compare the Foster–Seeley discriminator and the PLL as FM detectors.',
      'Explain the FM threshold effect.',
    ],
    sections: [
      {
        heading: 'Where noise enters',
        bullets: [
          '**Before the limiter** — amplitude noise is removed by the limiter, which passes only the peaks.',
          '**After the limiter** — phase/frequency noise cannot be removed and becomes output noise after detection.',
          '**Impulse noise** — short bursts that the limiter cannot suppress, which is why FM is not universally clean.',
        ],
      },
      {
        heading: 'The capture effect',
        paragraphs: [
          'When two FM signals arrive on the same channel with different amplitudes, the limiter passes whichever is stronger. The weaker one is largely suppressed rather than summed.',
          'This happens because the limiter is a nonlinear device: it acts as a soft limiter, and a strong signal drives it into limiting while a weak one does not. The stronger signal "captures" the limiter.',
          'AM behaves completely differently: both signals add, and the interference is an arithmetic sum that varies with relative phase.',
        ],
        note: {
          kind: 'limit',
          title: 'The capture effect is conditional',
          body: 'It depends on the receiver containing a limiter and on the two signals differing in amplitude at the limiter input. If a receiver has no limiter, or the signals arrive with equal strength, the capture behaviour does not appear. It also does not mean FM is immune to interference — two equal-strength signals still interfere, and co-channel capture simply turns a gradual degradation into a sudden switch.',
        },
      },
      {
        heading: 'Pre-emphasis and de-emphasis',
        paragraphs: [
          'FM noise rises with frequency, so the noise is concentrated at the high end of the audio band. [[Pre-emphasis]] boosts the high frequencies at the transmitter; [[De-emphasis]] attenuates them at the receiver, restoring a flat response while reducing high-frequency noise.',
          'Standard broadcast networks use a 75 µs time constant. The transmitter always boosts; only the receiver attenuates, so playback of a properly de-emphasised recording is correct while a tap taken before de-emphasis sounds harsh.',
        ],
      },
      {
        heading: 'Demodulators',
        bullets: [
          '**Foster–Seeley discriminator** — a tuned circuit whose effective inductance changes with input frequency, producing a voltage proportional to deviation. Simple, but frequency-sensitive to component drift.',
          '**PLL demodulator** — locks a voltage-controlled oscillator to the incoming signal and takes the control voltage as the output. Broad capture range, no critical alignment, and easily integrated.',
        ],
      },
      {
        heading: 'The threshold effect',
        paragraphs: [
          'Above a certain input SNR the output SNR improves rapidly, because noise is being suppressed. Below that threshold the output SNR collapses — the classic FM threshold effect. It is why FM needs a stronger signal than AM to sound clean, and why practical receivers include a noise gate below the threshold.',
        ],
      },
    ],
    keyTerms: ['Capture effect', 'Pre-emphasis', 'De-emphasis', 'SNR', "Carson's rule"],
    formulaIds: ['snr-db', 'carson'],
    worked: {
      title: 'Capture versus additive interference',
      given: ['Two FM signals at 100 MHz and 100.02 MHz', 'Received amplitudes 1.0 V and 0.3 V at the limiter'],
      steps: [
        '**FM:** the limiter passes the stronger signal; the weaker is suppressed. Output is essentially the strong signal alone.',
        '**AM:** the two add, giving 1.0 + 0.3·cos(Δωt) — an envelope that fluctuates between 0.7 V and 1.3 V at the 40 kHz beat.',
        'For AM the recovered message is a clean 40 kHz tone; for FM the weaker signal is essentially gone.',
      ],
      answer: 'Capture: the strong FM signal survives and the weak one is suppressed. AM: both survive and their difference frequency appears as interference.',
    },
    applications: [
      'FM broadcast receivers (limiters, discriminators, de-emphasis networks).',
      'Two-way radio, where the capture effect is a familiar operational surprise.',
      'PLL-based demodulators in telemetry, cordless phones and audio equipment.',
    ],
    misconceptions: [
      {
        myth: '"The capture effect means FM rejects interference completely."',
        truth: 'It rejects *weaker* co-channel signals when a limiter is present. Equal-strength signals still interfere, and the effect does not apply to noise.',
      },
      {
        myth: '"FM noise rises with frequency because FM does."',
        truth: 'The noise spectrum rises because of the detection process, which is exactly why pre-emphasis and de-emphasis exist.',
      },
      {
        myth: '"De-emphasis is optional."',
        truth: 'Without the matched de-emphasis, high-frequency noise is heard at full level and the audio sounds harsh.',
      },
    ],
    conclusion:
      'FM improves noise performance by removing amplitude noise before detection — which is why it needs a limiter and why it exhibits the threshold effect below a certain input SNR. The capture effect is a real but conditional bonus of the same limiter, not a general immunity to interference.',
    related: ['m5-comparison', 'm5-receiver', 'm5-fm'],
    vizId: 'noise-lab',
    vizInitial: { noise: 0.2, competing: 0.3 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — FM detection lectures',
        detail: 'Discriminator circuits, PLL demodulators and capture.',
        why: 'Circuit-level detail for both detector types.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Noise comparison laboratory in this lesson',
        detail: 'Add two FM signals of differing strength and watch one capture the limiter.',
        why: 'The capture effect is only convincing when it happens in front of you.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — PLL and FM receiver sections',
        detail: 'Practical demodulator circuits.',
        why: 'Circuit context for the Foster–Seeley and PLL detectors.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — communication systems',
        detail: 'Analogue noise analysis and detection theory.',
        why: 'Rigorous treatment of the threshold effect.',
        href: 'https://ocw.mit.edu/search/?q=communication%20systems',
      },
    ],
  },

  {
    id: 'm5-receiver',
    module: 5,
    index: 7,
    title: 'Radio Receiver Architecture',
    sidebarLabel: 'Radio receivers',
    minutes: 10,
    summary: 'Why every serious radio receiver converts to a fixed intermediate frequency, and what that costs.',
    keywords: ['TRF', 'superheterodyne', 'local oscillator', 'mixer', 'IF', 'AGC', 'image frequency', 'IFRR'],
    objectives: [
      'Explain the selectivity problem that the superheterodyne solves.',
      'Trace a signal through the superheterodyne stages.',
      'Compute the local oscillator and image frequency for a stated convention.',
      'Explain what AGC does and where it is placed.',
      'Calculate image-frequency rejection from RF filter attenuation.',
    ],
    sections: [
      {
        heading: 'TRF receivers',
        paragraphs: [
          'A tuned radio frequency receiver has a resonant input circuit tuned directly to the desired station, followed by amplification and detection. Changing stations means retuning several circuits simultaneously.',
          'Simple and cheap, and it suffers from **drift**: every tuned circuit must track together across the band, and small component variations put them out of alignment at different frequencies. Selectivity is also poor because the single tuned circuit must reject strong adjacent stations without also rejecting the wanted one.',
        ],
      },
      {
        heading: 'Superheterodyne',
        paragraphs: [
          'The superheterodyne receiver converts the incoming signal to a **fixed intermediate frequency**, then does all the filtering, amplification and detection at that one frequency.',
          'Stages: **RF section** (amplifier plus preselector filter) → **local oscillator** → **mixer/converter** → **IF section** (fixed-frequency amplifiers and filters) → **AGC** → **demodulator**.',
          'Because the IF is fixed, the most selective and most critical filters run at a single frequency and can be optimised. Channel selection becomes a matter of tuning only the local oscillator — a single variable capacitor.',
        ],
      },
      {
        heading: 'Frequency conversion',
        paragraphs: [
          'The mixer multiplies the RF and LO signals, producing a sum term and a difference term. Only the difference is passed: f_IF = |f_LO − f_RF|.',
          '**Injection convention used throughout SignalLab: high-side**, meaning f_LO = f_RF + f_IF. The laboratory states this explicitly because the image frequency depends on it.',
        ],
      },
      {
        heading: 'The image frequency',
        paragraphs: [
          'Because the mixer output is a *difference*, two different RF frequencies produce the same IF. An unwanted signal at f_image = f_RF + 2·f_IF (high-side injection) arrives at the IF filter identically to the wanted one, and no filtering downstream can separate them.',
          'Only the RF preselector can reject it. If the preselector attenuates a signal 2·f_IF away by R dB, the image rejection ratio is that attenuation. This is why the RF filter must be selective, and why high-IF receivers choose a large f_IF to push the image far from the wanted signal.',
        ],
      },
      {
        heading: 'AGC',
        paragraphs: [
          'Automatic gain control adjusts the IF (or RF) gain so that a strong station does not swamp a weak one. It is normally driven by the demodulator output, and it is placed before the detector so that the detector always sees a workable level.',
          'Its presence is a double-edged convenience: it protects the front end but destroys the natural strength indication that makes the FM capture effect noticeable.',
        ],
      },
    ],
    keyTerms: ['Superheterodyne', 'Image frequency', 'Intermediate frequency', 'Modulation index'],
    formulaIds: ['superhet', 'image'],
    worked: {
      title: 'Frequency plan for an FM receiver',
      given: ['Tuned to 100 MHz', 'f_IF = 10.7 MHz', 'High-side injection'],
      steps: [
        'f_LO = f_RF + f_IF = 100 + 10.7 = 110.7 MHz.',
        'Mixer difference: |110.7 − 100| = 10.7 MHz ✓.',
        'Image: f_image = 100 + 2(10.7) = 121.4 MHz.',
        'Check: |121.4 − 110.7| = 10.7 MHz — the same IF, so indistinguishable after the mixer.',
        'With a preselector attenuating 121.4 MHz by 35 dB, the IFRR is 35 dB.',
      ],
      answer: 'LO 110.7 MHz, image 121.4 MHz, and the image rejection is exactly whatever the preselector provides.',
    },
    applications: [
      'Every AM/FM broadcast receiver, and every two-way radio.',
      'Satellite, cellular and microwave receivers.',
      'Software-defined radio, where the mixer is performed numerically.',
    ],
    misconceptions: [
      {
        myth: '"The IF filter can reject the image."',
        truth: 'It cannot — the image is at exactly the same IF. Rejection must happen in the RF preselector, before the mixer.',
      },
      {
        myth: '"Higher IF is always better."',
        truth: 'A larger IF improves image rejection but demands more IF amplification, because the mixer conversion gain typically falls as the frequency separation grows.',
      },
      {
        myth: '"TRF receivers are obsolete because they are inaccurate."',
        truth: 'They are used where simplicity dominates — short-range, single-channel and low-cost applications still use tuned RF front ends.',
      },
    ],
    conclusion:
      'The superheterodyne receiver exists to solve a filter-manufacturing problem: it converts every channel to one fixed frequency, so one well-aligned, highly selective filter set serves the whole band. The price is the image frequency, which can only be rejected before the mixer — making the RF preselector the hardest filter in the receiver.',
    related: ['m5-am', 'm5-noise', 'm5-comparison'],
    vizId: 'receiver',
    vizInitial: { rf: 100, ifFreq: 10.7, injection: 'high' },
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — radio frequency electronics',
        detail: 'Course material on receivers, mixers and filters.',
        why: 'Circuit-level treatment of the whole receiver chain.',
        href: 'https://ocw.mit.edu/search/?q=radio%20frequency',
      },
      {
        kind: 'simulate',
        title: 'Superheterodyne laboratory in this lesson',
        detail: 'Tune the RF and watch the LO, the IF and the image frequency all move.',
        why: 'Makes the frequency plan concrete and checkable.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — radio receiver sections',
        detail: 'Practical receiver circuits.',
        why: 'Circuit context for the block diagram.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'GNU Radio documentation',
        detail: 'Software-defined radio receiver chains.',
        why: 'Shows the same architecture implemented in software.',
        href: 'https://www.gnuradio.org/doc/',
      },
    ],
  },
];