import type { Lesson } from '@/types';

export const module3Lessons: Lesson[] = [
  {
    id: 'm3-dm',
    module: 3,
    index: 1,
    title: 'Delta Modulation Fundamentals',
    sidebarLabel: 'Delta modulation fundamentals',
    minutes: 10,
    summary: 'One bit per sample: does the input exceed the current estimate, or not? Everything else follows from that.',
    keywords: ['delta modulation', 'one bit', 'comparator', 'integrator', 'staircase', 'accumulator'],
    objectives: [
      'State the DM decision rule and the tie-breaking convention.',
      'Describe every block in a DM encoder and decoder.',
      'Explain how the decoder reconstructs the staircase from the bitstream.',
      'Compute the maximum slope a staircase of a given step can follow.',
      'Compute the bit rate and compare it with PCM at equivalent quality.',
    ],
    sections: [
      {
        heading: 'The decision rule',
        paragraphs: [
          '[[Delta modulation]] compares each input sample with the encoder\'s current approximation x̂.',
          '**If x(nT_s) > x̂: output 1, and add one step δ.**',
          '**Otherwise: output 0, and subtract one step δ.**',
          'Tie convention used throughout SignalLab: when x exactly equals x̂ the rule resolves to 0 (no step up). This keeps the loop deterministic and free of ambiguity at the decision boundary.',
        ],
        note: {
          kind: 'limit',
          title: 'One bit is not automatically efficient',
          body: 'A bit that only says "up" or "down" forces the staircase to move at a rate fixed by δ and f_s. If the input moves faster than that, the bitstream cannot express it and the error grows without bound — slope overload. If the input moves slower, the same fixed step produces visible oscillation — granular noise. A single fixed step cannot serve both cases well.',
        },
      },
      {
        heading: 'The blocks',
        bullets: [
          '**Sample-and-hold** — captures the input at the sampling instant.',
          '**Comparator (differencing circuit)** — compares the held input with the staircase value.',
          '**1-bit encoder** — emits 1 or 0 from the comparator output.',
          '**Staircase generator / accumulator + DAC** — adds or subtracts δ and produces the staircase estimate.',
          '**Decoder** — a copy of the accumulator, driven only by the received bits. It needs no knowledge of the input at all.',
        ],
        paragraphs: [
          'The decoder is the important structural insight: it is a simple integrator that steps up on a 1 and down on a 0. Because both ends run the identical algorithm on the identical bit sequence, they cannot diverge.',
        ],
      },
      {
        heading: 'Maximum trackable slope',
        paragraphs: [
          'A one-bit quantiser changes its output by exactly δ per sample, so the steepest slope it can follow is δ/T_s = δ·f_s. For a sine of amplitude A and frequency f_m that gives the design rule δ ≥ 2π·A·f_m/f_s.',
        ],
      },
    ],
    keyTerms: ['Delta modulation', 'Slope overload', 'Granular noise', 'Sample-and-hold'],
    formulaIds: ['dm-slope', 'dm-sine'],
    worked: {
      title: 'Trackability and bit rate for a 1 kHz sine',
      given: ['A = 1 V, f_m = 1 kHz', 'f_s = 8 kHz'],
      steps: [
        'Required step: δ ≥ 2π × 1 × 1000 / 8000 = 0.785 V.',
        'Choose δ = 0.8 V (just above the limit).',
        'Bit rate = f_s = 8000 bit/s — one bit per sample, no matter what.',
        'Compare: 8-bit PCM at 8 kHz needs 64 000 bit/s for far better absolute accuracy.',
        'DM wins only at δ > 1 and low amplitude, where 1 bit per sample beats 8.',
      ],
      answer: '8000 bit/s with δ ≈ 0.8 V; at these settings PCM would need 64 000 bit/s for a result no better than the staircase.',
    },
    applications: [
      'Low-cost voice and telemetry links at 8–32 kbit/s.',
      'Oversampled sigma-delta converters, which are DM with a second-order integrator.',
      'Any application where bandwidth is scarce and amplitude accuracy is not critical.',
    ],
    misconceptions: [
      {
        myth: '"One bit per sample means one bit of information per sample."',
        truth: 'A DM bit is highly redundant — it usually repeats. The information content per bit is far below one bit, which is exactly why the scheme can be so cheap.',
      },
      {
        myth: '"DM is simpler than PCM because it uses fewer bits."',
        truth: 'The bitstream is simpler; the error performance is far worse, and the staircase is visibly wrong whenever the slope limit is exceeded.',
      },
      {
        myth: '"The decoder needs to know the input signal."',
        truth: 'It never does. It is a pure integrator driven by the received bits — which is exactly why it can never drift out of step.',
      },
    ],
    conclusion:
      'DM reduces the whole quantiser to a single comparison and a fixed step. That simplicity is bought with a hard slope limit and a visible quantisation ripple. The laboratory lets you drive both effects deliberately so the trade-off is measurable rather than asserted.',
    related: ['m3-distortion', 'm3-architecture', 'm3-adaptive'],
    vizId: 'delta-modulation',
    vizInitial: { fin: 0.5, amp: 1, fs: 40, step: 0.2 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — communication systems lectures',
        detail: 'Delta modulation derivation and distortion analysis.',
        why: 'Formal treatment of the slope-overload and granular-noise trade-off.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Delta modulation laboratory in this lesson',
        detail: 'Watch the comparator decision and staircase update sample by sample.',
        why: 'The loop is far easier to understand when you see it run.',
      },
      {
        kind: 'watch',
        title: 'MIT OpenCourseWare — search "delta modulation"',
        detail: 'Lecture material on one-bit quantisation.',
        why: 'Places DM in the wider quantiser theory.',
        href: 'https://ocw.mit.edu/search/?q=delta%20modulation',
      },
      {
        kind: 'advanced',
        title: 'All About Circuits — ADC architectures',
        detail: 'Where delta-sigma converters sit among ADC types.',
        why: 'Connects this lesson to the ADC found in real hardware.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
    ],
  },

  {
    id: 'm3-architecture',
    module: 3,
    index: 2,
    title: 'Delta Modulation System Architecture',
    sidebarLabel: 'DM architecture',
    minutes: 7,
    summary: 'Encoder and decoder are the same circuit, and that is the whole design idea.',
    keywords: ['block diagram', 'comparator', 'DAC', 'feedback', 'decoder', 'integrator'],
    objectives: [
      'Draw the encoder with its closed feedback loop and label every signal.',
      'Explain why the decoder is a strict subset of the encoder.',
      'Identify where noise enters and how it is prevented from accumulating.',
      'State the bit rate in terms of sampling rate.',
      'Compare DM hardware complexity with PCM.',
    ],
    sections: [
      {
        heading: 'Encoder loop',
        paragraphs: [
          'The input is sampled, compared against the staircase estimate, and the comparison result becomes a single bit. That bit drives an up/down accumulator that produces the staircase estimate, which is fed back to the comparator.',
          'The loop is closed at the *encoder* precisely so that the staircase tracks the input. Without feedback, the estimator would drift away immediately.',
        ],
      },
      {
        heading: 'Decoder',
        paragraphs: [
          'The decoder contains only the up/down accumulator and its DAC. It receives the bitstream, performs the identical ±δ update, and produces the staircase. It has no comparator and no input sample, because it does not need them.',
          'This is why a DM receiver is trivial: two inverters and a capacitor, or a small microcontroller.',
        ],
      },
      {
        heading: 'Where the noise goes',
        paragraphs: [
          'Channel errors hit the bitstream. Because the decoder integrates the bits, a wrong bit does not shift the whole waveform permanently — it produces a ±2δ local excursion that the following correct bits correct. The reconstruction is therefore robust in a way an open-loop integrator would not be.',
        ],
        bullets: [
          'Bit rate = f_s exactly: one bit per sample, with no framing overhead in the ideal case.',
          'Hardware: a comparator, a two-bit up/down counter and a DAC. Far simpler than an ADC/encoder chain.',
          'Output: a staircase. A reconstruction low-pass filter is usually needed for audio.',
        ],
      },
    ],
    keyTerms: ['Delta modulation', 'Conversion time', 'Decision threshold', 'Digital transmission'],
    formulaIds: ['dm-slope'],
    worked: {
      title: 'Bit rate comparison for voice',
      given: ['Voice band-limited to 3.4 kHz', 'Sampled at 8 kHz'],
      steps: [
        'DM: one bit per sample → 8000 bit/s.',
        '8-bit PCM at the same rate → 64 000 bit/s.',
        '8-bit G.711 companded PCM → 64 000 bit/s (same rate, better perceived quality than 8-bit linear).',
        'ADPCM at 4 bits/sample → 32 000 bit/s.',
      ],
      answer: 'DM gives 8000 bit/s but with a staircase error of order δ; PCM gives 64 000 bit/s with absolute accuracy of order V_LSB/2.',
    },
    applications: [
      'Sigma-delta converters (DM plus an integrator) in audio and measurement ADCs.',
      'Telemetry and industrial sensor links where absolute accuracy is unimportant.',
      'Any wideband application where the extra precision of PCM would be wasted.',
    ],
    misconceptions: [
      {
        myth: '"A simpler circuit must give worse results, so DM is obsolete."',
        truth: 'DM\'s simplicity is exactly what makes it cheap. The staircase output is unsuitable for high-fidelity audio but excellent for many measurement and control signals.',
      },
      {
        myth: '"The decoder needs the same sample-and-hold as the encoder."',
        truth: 'It needs neither a sample-and-hold nor a comparator — only an accumulator driven by the bits.',
      },
      {
        myth: '"A single bit error in DM corrupts everything after it."',
        truth: 'Because the decoder integrates, a wrong bit causes a local ±2δ error that subsequent correct bits correct. The error does not accumulate.',
      },
    ],
    conclusion:
      'The DM architecture is a closed feedback loop whose receiver is a strict subset of its transmitter. Understanding that symmetry removes most of the apparent mystery of the scheme: the receiver does not need to know the signal, only to follow the bits.',
    related: ['m3-dm', 'm3-distortion', 'm3-sigma-delta'],
    vizId: 'delta-modulation',
    vizInitial: { blocks: true, fin: 0.5, fs: 40, step: 0.2 },
    furtherReading: [
      {
        kind: 'read',
        title: 'All About Circuits — DAC architectures',
        detail: 'Accumulator and DAC implementations used in the decoder.',
        why: 'Circuit-level view of the staircase generator.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'simulate',
        title: 'Delta modulation laboratory, block view enabled',
        detail: 'Highlight each block in turn as a sample passes through it.',
        why: 'Ties the diagram to the running simulation.',
      },
      {
        kind: 'read',
        title: 'GNU Radio documentation',
        detail: 'Working modulator/demodulator implementations.',
        why: 'Shows the loop realised in software.',
        href: 'https://www.gnuradio.org/doc/',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — mixed signal processing',
        detail: 'Course material on delta-sigma converters.',
        why: 'Generalises this loop into modern ADC design.',
        href: 'https://ocw.mit.edu/search/?q=analog%20circuits',
      },
    ],
  },

  {
    id: 'm3-distortion',
    module: 3,
    index: 3,
    title: 'Slope Overload and Granular Noise',
    sidebarLabel: 'Slope overload & granular noise',
    minutes: 10,
    summary:
      'Two opposite failure modes, one fixed step size, and no setting that avoids both.',
    keywords: ['slope overload', 'granular noise', 'step size', 'tracking error', 'trade-off'],
    objectives: [
      'Define slope overload and identify its cause and signature.',
      'Define granular noise and identify its cause and signature.',
      'Compute the step size required to avoid slope overload for a sine.',
      'Explain why reducing the step makes granular noise worse.',
      'Recognise each distortion in the laboratory waveforms.',
    ],
    sections: [
      {
        heading: 'Slope overload',
        paragraphs: [
          '[[Slope overload]] occurs when the input changes faster than the staircase can follow. The encoder then emits a run of 1s (or 0s), the staircase lags further and further behind, and the error grows without bound.',
          'Signature: the error ramps steadily in one direction across a run of identical bits. Increasing f_s or δ both reduce it, at the cost of more bits or more granular noise.',
        ],
      },
      {
        heading: 'Granular noise',
        paragraphs: [
          '[[Granular noise]] is the opposite failure. When the input is constant or slow, the staircase keeps stepping ±δ around it and never settles.',
          'Signature: rapid alternation of 1 and 0 with the error bounded by ±δ. It is amplitude-limited, not power-limited, so its severity scales with δ.',
        ],
        note: {
          kind: 'limit',
          title: 'There is no good fixed step size',
          body: 'The requirement to avoid slope overload is δ ≥ 2π·A·f_m/f_s, which grows with amplitude and frequency. The desire to minimise granular noise is δ as small as possible. For a signal with a large amplitude range these pull in opposite directions — which is exactly why practical systems use adaptive step control.',
        },
      },
      {
        heading: 'Quantifying each',
        bullets: [
          'Slope overload: peak error grows roughly as the area between the input and the achievable staircase slope.',
          'Granular noise: peak error ≤ δ regardless of how slow the input is.',
          'Halving δ halves granular noise but halves the trackable slope — slope overload risk rises correspondingly.',
        ],
      },
    ],
    keyTerms: ['Delta modulation', 'Slope overload', 'Granular noise', 'Adaptive delta modulation'],
    formulaIds: ['dm-slope', 'dm-sine', 'granular'],
    worked: {
      title: 'Find the step that keeps a 1 kHz, 2 V sine error below one step',
      given: ['A = 2 V, f_m = 1 kHz', 'f_s = 8 kHz'],
      steps: [
        'Required δ ≥ 2π × 2 × 1000 / 8000 = 1.571 V.',
        'Choose δ = 1.6 V: slope overload just avoided.',
        'Granular noise on a constant input is then ±1.6 V — enormous compared with the signal.',
        'Now drop f_m to 100 Hz at the same δ: required δ drops to 0.157 V, so δ = 0.2 V gives both low slope error and acceptable granular noise.',
      ],
      answer: 'At 1 kHz a step of about 1.6 V is required; at 100 Hz about 0.2 V suffices — a factor of 8 that no single fixed step can satisfy across both.',
    },
    applications: [
      'Choosing δ for a bandwidth-limited input with a known amplitude range.',
      'Evaluating whether ADM is needed for a given signal.',
      'Interpreting the staircase you see on a scope trace of a DM output.',
    ],
    misconceptions: [
      {
        myth: '"Increasing the step size fixes delta modulation."',
        truth: 'It fixes slope overload and worsens granular noise. There is no step size that is right for every signal amplitude.',
      },
      {
        myth: '"Granular noise is a high-frequency artefact that a filter can remove."',
        truth: 'It sits inside the signal band and is therefore not separable by filtering. It must be reduced at the quantiser.',
      },
      {
        myth: '"Slope overload can be fixed with a higher sampling rate alone."',
        truth: 'It can, but it costs bits: raising f_s by 8 raises the bit rate by 8 and, equivalently, allows δ to be cut by 8 — which is the same trade reached a different way.',
      },
    ],
    conclusion:
      'Slope overload and granular noise are the two walls of delta modulation, and a fixed step size can only choose which one you hit. Every practical improvement — adaptive stepping, higher rates, multi-bit quantisers — is a way of escaping that single-parameter conflict.',
    related: ['m3-adaptive', 'm3-dm', 'm3-sigma-delta'],
    vizId: 'delta-modulation',
    vizInitial: { fin: 1.6, amp: 2, fs: 8, step: 0.2, highlight: true },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — delta modulation lectures',
        detail: 'Slope overload and granular noise analysis.',
        why: 'Standard derivation of the step-size requirements.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Slope-overload experiment in this lesson',
        detail: 'Raise the input frequency until the staircase can no longer follow.',
        why: 'The failure is unmistakable once you have triggered it.',
      },
      {
        kind: 'simulate',
        title: 'Granular-noise experiment in this lesson',
        detail: 'Shrink the step on a slow input and watch the staircase oscillate.',
        why: 'Shows the error is bounded by exactly one step.',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — mixed-signal processing',
        detail: 'Advanced treatment of one-bit quantiser dynamics.',
        why: 'Deeper analysis of the same trade-off.',
        href: 'https://ocw.mit.edu/search/?q=analog%20circuits',
      },
    ],
  },

  {
    id: 'm3-adaptive',
    module: 3,
    index: 4,
    title: 'Adaptive Delta Modulation',
    sidebarLabel: 'Adaptive delta modulation',
    minutes: 8,
    summary: 'Let the step size follow the signal, and the two distortions stop competing.',
    keywords: ['ADM', 'adaptive step size', 'up-down counter', 'tracking', 'granular noise'],
    objectives: [
      'Describe an up/down counter step-size control.',
      'Explain how ADM improves both distortion measures at once.',
      'State the cost of adaptation.',
      'Compare ADM and fixed-step DM on the same input.',
      'Describe the relationship between ADM and sigma-delta.',
    ],
    sections: [
      {
        heading: 'The idea',
        paragraphs: [
          'Fixed-step DM fails because it tries to serve two incompatible signals at once: loud fast passages and quiet slow ones. Adaptive delta modulation lets δ change with the local signal.',
          'A simple mechanism is an up/down counter: when the encoder emits a run of identical bits, the step grows; when it alternates, the step shrinks. Large steps appear only where the signal is moving quickly, and small steps — low granular noise — where it is not.',
        ],
        bullets: [
          '**Tracking a rapid change:** a long run of 1s raises δ so the staircase can keep up.',
          '**Tracking a slow change:** alternating bits lower δ, so the staircase ripple shrinks.',
          '**Cost:** the step sequence must be identical at both ends. It is either transmitted as side information or derived identically from the bit history at the decoder.',
        ],
      },
      {
        heading: 'What it actually buys',
        paragraphs: [
          'Because the step size now tracks the signal, the *relative* error stays roughly constant across a very large amplitude range. A single adaptive loop can serve a signal whose peak amplitude varies by two orders of magnitude, where fixed-step DM would need a compromise step that is simultaneously too coarse and too fine.',
        ],
      },
      {
        heading: 'Where ADM ends and ΣΔ begins',
        paragraphs: [
          'Replacing the single-bit quantiser with a quantiser whose step is set by a first-order low-pass state produces the first-order [[Sigma-delta modulation]] loop. ADM and ΣΔ are the same idea viewed as time-domain step adaptation and frequency-domain noise shaping respectively.',
        ],
      },
    ],
    keyTerms: ['Adaptive delta modulation', 'Slope overload', 'Granular noise', 'Sigma-delta modulation'],
    formulaIds: ['dm-sine', 'granular'],
    worked: {
      title: 'Step-size sequence for a rising-then-falling input',
      given: ['Input rises rapidly for 8 samples then settles'],
      steps: [
        'Rising: the input exceeds the staircase each sample, producing runs of 1s; the up/down counter increases δ each sample.',
        'After 8 samples δ has grown 8× the initial value, enough to track the ramp.',
        'Settling: the input is now constant, so bits alternate; each alternation decrements δ.',
        'δ decays back down until the ripple is again of order δ — but δ is now small, so the ripple is small too.',
      ],
      answer: 'Adaptive stepping grows δ to track the ramp and then shrinks it to keep the residual ripple small — both distortions reduced simultaneously.',
    },
    applications: [
      'Adaptive delta modulation in early speech codecs.',
      'The step-control loop of first-order sigma-delta ADCs.',
      'Any wide-dynamic-range one-bit conversion.',
    ],
    misconceptions: [
      {
        myth: '"Adaptation lets you use an arbitrarily small step."',
        truth: 'It lets you use a small step *when the signal is small*. During rapid changes δ must still grow, or slope overload returns.',
      },
      {
        myth: '"The decoder needs the step sequence sent to it separately."',
        truth: 'Usually not. Deriving the same sequence from the received bit history at both ends keeps them in step at zero bit cost, which is why almost every real implementation does that.',
      },
      {
        myth: '"ADM is just DM with a bigger step."',
        truth: 'A bigger fixed step trades one distortion for the other. Adaptation tracks the signal, improving both at once.',
      },
    ],
    conclusion:
      'Adaptive step control resolves the conflict that makes fixed-step delta modulation unusable for real signals. The mechanism is simple — count consecutive identical bits — and the payoff is that slope overload and granular noise stop competing for the same parameter.',
    related: ['m3-sigma-delta', 'm3-distortion', 'm3-dm'],
    vizId: 'delta-modulation',
    vizInitial: { adaptive: true, fin: 1, amp: 1.5, fs: 30, step: 0.12 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — adaptive delta modulation lectures',
        detail: 'Step-size control loops and their stability.',
        why: 'Standard treatment of the up/down counter mechanism.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Delta modulation laboratory, adaptive mode',
        detail: 'Watch the step size grow and shrink with the signal.',
        why: 'Shows adaptation doing the work the fixed step cannot.',
      },
      {
        kind: 'read',
        title: 'ITU-T recommendations — audio codecs',
        detail: 'Production codecs that use adaptive prediction and step control.',
        why: 'Shows the idea in a standardised form.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'advanced',
        title: 'All About Circuits — delta-sigma ADC section',
        detail: 'Where the adaptive step loop appears in hardware.',
        why: 'Bridges this lesson to converter design.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
    ],
  },

  {
    id: 'm3-sigma-delta',
    module: 3,
    index: 5,
    title: 'Sigma-Delta Modulation',
    sidebarLabel: 'Sigma-delta modulation',
    minutes: 11,
    summary:
      'A feedback loop that shapes quantisation noise out of the signal band — and why oversampling alone is not the whole story.',
    keywords: ['sigma delta', 'oversampling', 'noise shaping', 'integrator', 'decimation', 'NTF'],
    objectives: [
      'Describe the first-order ΣΔ loop block by block.',
      'Explain what the integrator and the feedback DAC are for.',
      'State the noise transfer function and the resulting noise spectrum shape.',
      'Separate the contribution of oversampling from the contribution of shaping.',
      'Explain decimation and where the digital filter must go.',
    ],
    sections: [
      {
        heading: 'The loop',
        paragraphs: [
          'First-order sigma-delta: **input → integrator → 1-bit quantiser → feedback DAC**, with the DAC output subtracted at the summing node before the integrator.',
          'The integrator accumulates (input − feedback). Because the quantiser only ever outputs +1 or −1, the loop continuously pushes the integrator state toward zero-mean error. The quantiser error is therefore not simply added to the signal — it is fed back and re-processed, which is what changes its spectrum.',
        ],
      },
      {
        heading: 'Noise shaping',
        paragraphs: [
          'A first-order loop has noise transfer function NTF = (1 − z⁻¹), so the quantisation noise spectrum rises as f². Near DC — where the wanted signal lives — noise is suppressed; at high frequencies, close to F_s, it is concentrated.',
          'A simple low-pass filter after the decimator therefore removes most of the noise, because the loop deliberately put it there.',
        ],
        note: {
          kind: 'limit',
          title: 'Oversampling and shaping contribute different amounts',
          body: 'A plain high-rate uniform quantiser improves SNR by 3·log₁₀(OSR) ≈ 3 dB each time the oversampling ratio doubles. Adding first-order noise shaping contributes 6·log₁₀(OSR) ≈ 6 dB per doubling. Together that is the familiar 9 dB per doubling for a first-order loop. Quoting the 9 dB without the split overstates what oversampling alone achieves.',
        },
      },
      {
        heading: 'Oversampling, decimation and filtering',
        paragraphs: [
          '**[[Oversampling]]** at rate F_s ≫ 2f_max spreads the quantiser\'s noise density across a much wider band, so the density at any given frequency falls.',
          '**Decimation** reduces F_s back towards the signal bandwidth. This must be preceded by a proper anti-aliasing (decimation) filter, because decimating by an integer factor without filtering would alias the very noise the loop worked to move out of band.',
          'In a real converter the loop runs at megahertz and the final decimation filter does most of the filtering, often in several stages.',
        ],
      },
      {
        heading: 'Relation to DM',
        paragraphs: [
          'Delta modulation is a zero-order (no integrator) ΣΔ loop, and adaptive delta modulation approximates a first-order one. Understanding DM is therefore not a detour from ΣΔ — it is its degenerate case.',
        ],
      },
    ],
    keyTerms: ['Sigma-delta modulation', 'Noise shaping', 'Oversampling', 'Quantisation noise', 'Delta modulation'],
    formulaIds: ['sdm-noise'],
    worked: {
      title: 'Predict the SNR improvement from doubling the oversampling ratio',
      given: ['First-order loop', 'OSR increases from 4 to 8'],
      steps: [
        'Oversampling alone: 3·log₁₀(8/4) = 3·log₁₀(2) = 3.0 dB.',
        'Noise shaping: 6·log₁₀(2) = 6.0 dB.',
        'Total: ≈ 9.0 dB.',
        'For a second-order loop the shaping term would be 9·log₁₀(2) = 9 dB, giving 12 dB per doubling — at the cost of a much harder loop-stability problem.',
      ],
      answer: '≈ 9 dB improvement per doubling of OSR for a first-order loop, split 3 dB / 6 dB between oversampling and shaping.',
    },
    applications: [
      'Audio and measurement ADCs (24-bit audio DACs commonly use second- or third-order loops).',
      'Fractional-N and PLL frequency synthesiser dividers, which use the same noise-shaping principle.',
      'Low-power sensor front ends where oversampling is cheaper than a fast high-resolution converter.',
    ],
    misconceptions: [
      {
        myth: '"Sigma-delta is just oversampling."',
        truth: 'Oversampling alone gives 3 dB per doubling. The shaping is what gives the remaining 6 dB for a first-order loop, and shaping is what moves noise out of the band in the first place.',
      },
      {
        myth: '"The 1-bit quantiser throws away precision, so the result is poor."',
        truth: 'The bitstream is 1 bit but heavily oversampled. Averaging (the decimation filter) recovers many more bits of resolution — that is the entire point of the architecture.',
      },
      {
        myth: '"Decimation is just throwing samples away."',
        truth: 'Decimating without a preceding anti-aliasing filter folds the out-of-band noise back into the signal band, destroying the benefit the loop created.',
      },
    ],
    conclusion:
      'Sigma-delta works by using a feedback loop to redistribute quantisation noise towards high frequencies, then filtering it away. Oversampling lowers the noise density; shaping moves it. Both are required, they contribute different amounts, and the decimation filter must be there to collect the result.',
    related: ['m3-adaptive', 'm3-architecture', 'm2-quantization'],
    vizId: 'sigma-delta',
    vizInitial: { osr: 32, fin: 1, spectrum: true },
    furtherReading: [
      {
        kind: 'read',
        title: 'All About Circuits — delta-sigma ADC architecture',
        detail: 'Block diagram, noise shaping and decimation filtering.',
        why: 'Circuit-level explanation of exactly the loop in this lesson.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'simulate',
        title: 'Sigma-delta laboratory in this lesson',
        detail: 'Raise the oversampling ratio and watch the in-band noise fall while the bitstream densifies.',
        why: 'Separates the two contributions empirically.',
      },
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — mixed-signal processing',
        detail: 'Advanced loop dynamics and stability of higher-order ΣΔ.',
        why: 'Extends the first-order case to production converters.',
        href: 'https://ocw.mit.edu/search/?q=analog%20circuits',
      },
      {
        kind: 'advanced',
        title: 'SciPy signal — resampling and filters',
        detail: 'Reference implementation of the decimation filter.',
        why: 'Shows the filter that makes decimation safe.',
        href: 'https://docs.scipy.org/doc/scipy/reference/signal.html',
      },
    ],
  },
];