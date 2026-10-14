import type { ModuleQuiz } from '@/types';

/**
 * Three checkpoint questions per module, each with four options.
 *
 * `skill` labels whether the question tests a definition, a calculation or a
 * conceptual point, which lets the review page report on question types rather
 * than only on which modules were missed.
 */
export const quizzes: ModuleQuiz[] = [
  {
    module: 1,
    questions: [
      {
        id: 'm1q1',
        skill: 'concept',
        prompt:
          'A digital signal passes through three repeaters, each adding noise before the regeneration decision. Why is the SNR at the far end no worse than after the first span?',
        options: [
          { id: 'a', text: 'Because each repeater re-decides the symbol and re-emits a clean level, discarding accumulated noise' },
          { id: 'b', text: 'Because the channel is band-limited, so noise cannot accumulate' },
          { id: 'c', text: 'Because repeaters amplify noise as well as signal but the extra gain compensates' },
          { id: 'd', text: 'Because digital signals use a higher carrier frequency than analogue signals' },
        ],
        correctOptionId: 'a',
        explanation:
          'Regeneration is the defining advantage of digital transmission. The repeater compares the noisy sample against the decision threshold, decides which symbol it was, and re-emits that symbol at a clean nominal level. Everything that accumulated — noise, distortion, timing jitter — is discarded at that step, so the SNR after a repeater is set only by that single span.',
        misconception:
          'Option (c) describes an analogue amplifier, where noise is scaled along with the signal and therefore does accumulate. Option (b) confuses band-limiting of the channel with noise accumulation in the receiver chain.',
      },
      {
        id: 'm1q2',
        skill: 'calculation',
        prompt:
          'A signal is band-limited to 3.4 kHz. What is the theoretical minimum sampling frequency, and why do real systems sample higher than that?',
        options: [
          { id: 'a', text: '3400 Hz, because sampling faster reduces aliasing to zero' },
          { id: 'b', text: '6800 Hz, because real anti-aliasing filters need a transition band above the highest signal frequency' },
          { id: 'c', text: '13.6 kHz, because each sample needs two cycles to be captured accurately' },
          { id: 'd', text: 'There is no minimum, provided an ideal reconstruction filter is used' },
        ],
        correctOptionId: 'b',
        explanation:
          'The Nyquist rate is 2 × f_max = 2 × 3400 = 6800 samples/s. But f_s ≥ 2f_max assumes an ideal brick-wall anti-aliasing filter. Real filters roll off gradually, so the designer must push f_s above 6800 to leave a transition band — which is exactly why telephony uses 8000 samples/s.',
        misconception:
          'Option (c) confuses the sampling rate with the signal frequency. The rule is "at least twice the highest frequency present", not a fixed multiple.',
      },
      {
        id: 'm1q3',
        skill: 'definition',
        prompt:
          'Signal power is 2 mW and noise power measured over the same bandwidth is 20 µW. What is the SNR in decibels?',
        options: [
          { id: 'a', text: '−10 dB' },
          { id: 'b', text: '10 dB' },
          { id: 'c', text: '20 dB' },
          { id: 'd', text: '100 dB' },
        ],
        correctOptionId: 'c',
        explanation:
          'This is a power ratio, so the factor is 10: SNR_dB = 10·log₁₀(2e-3 / 20e-6) = 10·log₁₀(100) = 20 dB. The ratio itself is 100, but the decibel value is 20 dB, not 100.',
        misconception:
          'Using 20·log₁₀ here (which is correct only for amplitude or RMS ratios) would give 40 dB, and confusing the linear ratio with the decibel value gives 100 — the most common SNR arithmetic error in this field.',
      },
    ],
  },

  {
    module: 2,
    questions: [
      {
        id: 'm2q1',
        skill: 'calculation',
        prompt:
          'A bipolar ADC has an input range of −5 V to +5 V and uses 12 bits. What is its step size, using $V_{LSB} = V_{FSR}/2^n$?',
        options: [
          { id: 'a', text: '0.98 mV' },
          { id: 'b', text: '1.22 mV' },
          { id: 'c', text: '2.44 mV' },
          { id: 'd', text: '4.88 mV' },
        ],
        correctOptionId: 'c',
        explanation:
          'V_FSR = +5 − (−5) = 10 V. Then V_LSB = 10 / 2^12 = 10/4096 = 2.441 mV. Note that 2.44 mV is also the maximum error bound divided by two gives 1.22 mV — which is option (b), the peak error, not the step.',
        misconception:
          'Option (b) is V_LSB/2, the maximum quantisation error rather than the step size. Confusing the two is a frequent slip.',
      },
      {
        id: 'm2q2',
        skill: 'concept',
        prompt: 'Why does companding reduce idle-channel noise on a telephone line?',
        options: [
          { id: 'a', text: 'Because it compresses the noise itself before it reaches the quantiser' },
          { id: 'b', text: 'Because it concentrates quantisation levels where the signal energy is highest, reducing the step size at low amplitudes' },
          { id: 'c', text: 'Because it removes the quantiser entirely and replaces it with a nonlinear amplifier' },
          { id: 'd', text: 'Because it increases the number of levels to an equivalent of 12 bits' },
        ],
        correctOptionId: 'b',
        explanation:
          'Companding redistributes the levels so that small amplitudes — where speech energy lives, and where the ear is most sensitive — get many closely spaced levels. During quiet passages the quantiser error is therefore much smaller than it would be with uniform steps, so the residual hiss is quieter. The cost is coarser steps at large amplitudes.',
        misconception:
          'Companding does not add levels (option (d)) — it redistributes the existing ones. The step size at low amplitudes gets smaller, not the total count larger.',
      },
      {
        id: 'm2q3',
        skill: 'definition',
        prompt: 'For an ideal uniform quantiser with a full-scale sinusoidal input, SQNR ≈ 6.02n + 1.76 dB. What happens if the input peak is halved but n is unchanged?',
        options: [
          { id: 'a', text: 'SQNR is unchanged, because it depends only on bit depth' },
          { id: 'b', text: 'SQNR falls by about 6 dB' },
          { id: 'c', text: 'SQNR falls by about 1.76 dB' },
          { id: 'd', text: 'SQNR doubles' },
        ],
        correctOptionId: 'b',
        explanation:
          'Signal power is proportional to amplitude squared, so halving the amplitude cuts signal power by a factor of 4 — that is 6.02 dB. Quantisation noise power is set by the step size and is unchanged, so SQNR falls by about 6 dB. The formula is a full-scale result.',
        misconception:
          'The 6.02n dB figure is a dynamic-range statement about the level count; the +1.76 dB term applies only to the full-scale sine-wave SQNR. Neither implies independence of input level.',
      },
    ],
  },

  {
    module: 3,
    questions: [
      {
        id: 'm3q1',
        skill: 'concept',
        prompt:
          'A delta-modulation link tracks a constant-amplitude input with a visibly oscillating staircase. Which distortion is this, and what reduces it?',
        options: [
          { id: 'a', text: 'Slope overload; it is reduced by increasing the step size' },
          { id: 'b', text: 'Granular noise; it is reduced by decreasing the step size' },
          { id: 'c', text: 'Slope overload; it is reduced by decreasing the sampling rate' },
          { id: 'd', text: 'Granular noise; it is reduced by increasing the sampling rate' },
        ],
        correctOptionId: 'b',
        explanation:
          'Oscillating around a slow or constant signal is granular noise. Its amplitude is bounded by the step size δ, so a smaller step directly reduces it. The trade-off is that a smaller δ also lowers the maximum trackable slope δ·f_s, raising the risk of slope overload.',
        misconception:
          'Slope overload looks completely different: a sustained run of identical bits with the error growing steadily in one direction, not a bounded oscillation.',
      },
      {
        id: 'm3q2',
        skill: 'calculation',
        prompt:
          'A 500 Hz sine of amplitude 1 V is sampled at 4000 samples/s. Using δ ≥ 2π·A·f_m/f_s, what is the minimum step size that avoids slope overload?',
        options: [
          { id: 'a', text: '0.196 V' },
          { id: 'b', text: '0.392 V' },
          { id: 'c', text: '0.785 V' },
          { id: 'd', text: '3.14 V' },
        ],
        correctOptionId: 'c',
        explanation:
          'δ ≥ 2π × 1 × 500 / 4000 = 2π/8 = 0.785 V. This is also the same result as the maximum-slope rule: the peak input slope is 2π·A·f_m = 3142 V/s, and the staircase can move δ·f_s = δ·4000 per second, so δ ≥ 3142/4000.',
        misconception:
          'Options (a) and (b) correspond to dropping the 2π — that is, using radians where degrees, or forgetting that the slope of A·sin(2πft) peaks at 2πAf.',
      },
      {
        id: 'm3q3',
        skill: 'concept',
        prompt:
          'A first-order sigma-delta converter is improved by doubling its oversampling ratio. Which statement best describes the improvement?',
        options: [
          { id: 'a', text: 'About 9 dB, split roughly 3 dB from oversampling and 6 dB from noise shaping' },
          { id: 'b', text: 'About 3 dB, entirely from oversampling' },
          { id: 'c', text: 'About 6 dB, entirely from noise shaping' },
          { id: 'd', text: 'About 12 dB, split evenly between oversampling and noise shaping' },
        ],
        correctOptionId: 'a',
        explanation:
          'Plain oversampling widens the noise band and gives 3·log₁₀(OSR) ≈ 3 dB per doubling. Noise shaping adds 6·log₁₀(OSR) ≈ 6 dB per doubling. Together that is the familiar 9 dB per doubling for a first-order loop — and separating the two contributions is the point of the question.',
        misconception:
          'Oversampling alone is only 3 dB per doubling, so option (b) understates the achievement; option (d) is what a second-order loop gives and requires far more loop stability.',
      },
    ],
  },

  {
    module: 4,
    questions: [
      {
        id: 'm4q1',
        skill: 'calculation',
        prompt: 'A link transmits at 2400 baud using 16-QAM. What is the bit rate?',
        options: [
          { id: 'a', text: '2400 bit/s' },
          { id: 'b', text: '4800 bit/s' },
          { id: 'c', text: '9600 bit/s' },
          { id: 'd', text: '38 400 bit/s' },
        ],
        correctOptionId: 'c',
        explanation:
          '16-QAM has log₂16 = 4 bits per symbol, so R_b = R_s·log₂M = 2400 × 4 = 9600 bit/s. This is the arithmetic behind the historical V.32 modem: 2400 baud carrying 9600 bit/s.',
        misconception:
          'Baud and bit/s are the same only for binary keying. Option (a) assumes M = 2 regardless of the constellation actually in use.',
      },
      {
        id: 'm4q2',
        skill: 'concept',
        prompt: 'Why does 64-QAM generally require a better channel than QPSK to achieve the same error rate?',
        options: [
          { id: 'a', text: 'Because 64-QAM symbols carry more bits, so each bit gets proportionally less energy' },
          { id: 'b', text: 'Because 64-QAM occupies more bandwidth than QPSK at the same symbol rate' },
          { id: 'c', text: 'Because 64-QAM uses a lower carrier frequency' },
          { id: 'd', text: 'Because QPSK can be detected non-coherently while 64-QAM cannot' },
        ],
        correctOptionId: 'a',
        explanation:
          'At a fixed bit rate, higher-order modulation lowers the symbol rate, so each symbol carries more bits at the same average energy. The constellation points therefore crowd closer together, the minimum distance between them shrinks, and the receiver has less noise margin for the same Eb/N0.',
        misconception:
          'Bandwidth (option (b)) is not the cause — at a fixed bit rate, 64-QAM actually needs *less* bandwidth. The cause is purely the reduced distance between constellation points.',
      },
      {
        id: 'm4q3',
        skill: 'definition',
        prompt: 'What does a cyclic prefix achieve in OFDM?',
        options: [
          { id: 'a', text: 'It makes the subcarriers orthogonal to one another' },
          { id: 'b', text: 'It converts the linear channel into a circular one, so a single FFT per symbol removes multipath-induced ISI' },
          { id: 'c', text: 'It reduces the peak-to-average power ratio of the transmitted waveform' },
          { id: 'd', text: 'It corrects channel errors without any retransmission' },
        ],
        correctOptionId: 'b',
        explanation:
          'Orthogonality comes from choosing Δf = 1/T_u, not from the cyclic prefix. The cyclic prefix copies the end of each symbol to its front, making the channel effectively circular so that one FFT per symbol removes all inter-symbol interference, provided the prefix is at least as long as the channel delay spread.',
        misconception:
          'The cyclic prefix carries no information — it is pure overhead. Its purpose is ISI mitigation, not orthogonality, and it costs bandwidth rather than saving it.',
      },
    ],
  },

  {
    module: 5,
    questions: [
      {
        id: 'm5q1',
        skill: 'calculation',
        prompt: 'An AM transmitter has a carrier power of 400 W and is modulated to 80 %. What is the total transmitted power?',
        options: [
          { id: 'a', text: '400 W' },
          { id: 'b', text: '480 W' },
          { id: 'c', text: '528 W' },
          { id: 'd', text: '640 W' },
        ],
        correctOptionId: 'c',
        explanation:
          'P_T = P_C(1 + m²/2) = 400 × (1 + 0.64/2) = 400 × 1.32 = 528 W. The sidebands together carry 128 W, so only about 24 % of the transmitted power actually carries information — which is the fundamental inefficiency of full-carrier AM.',
        misconception:
          'Ignoring the sidebands entirely (option (a)) is the classic mistake. At m = 0.8 the sidebands carry 26 % of the power, not nothing.',
      },
      {
        id: 'm5q2',
        skill: 'concept',
        prompt: 'Which statement about the FM capture effect is correct?',
        options: [
          { id: 'a', text: 'FM receivers are immune to co-channel interference because of the capture effect' },
          { id: 'b', text: 'When two FM signals differ in amplitude at a limiter, the stronger one suppresses the weaker' },
          { id: 'c', text: 'The capture effect arises from the RF preselector rejecting the image frequency' },
          { id: 'd', text: 'The capture effect means FM needs no threshold effect above a certain SNR' },
        ],
        correctOptionId: 'b',
        explanation:
          'The limiter is a nonlinear device: a stronger signal drives it into limiting while a weaker one does not, so the stronger signal is passed and the weaker is largely suppressed. AM behaves differently — both signals add arithmetically.',
        misconception:
          'Capture is conditional, not immunity: it requires a limiter in the receiver and a difference in signal strength. Two equal-strength signals still interfere.',
      },
      {
        id: 'm5q3',
        skill: 'definition',
        prompt:
          'A superheterodyne receiver uses high-side injection, is tuned to 100 MHz, and has f_IF = 10.7 MHz. What is the image frequency?',
        options: [
          { id: 'a', text: '78.6 MHz' },
          { id: 'b', text: '89.3 MHz' },
          { id: 'c', text: '110.7 MHz' },
          { id: 'd', text: '121.4 MHz' },
        ],
        correctOptionId: 'd',
        explanation:
          'With high-side injection f_LO = f_RF + f_IF = 110.7 MHz. The image is f_RF + 2f_IF = 100 + 21.4 = 121.4 MHz. Checking: |121.4 − 110.7| = 10.7 MHz, exactly the same IF — so no filter after the mixer can separate them, and rejection must come from the RF preselector.',
        misconception:
          '110.7 MHz is the local oscillator frequency, not the image. With low-side injection the image would instead be 78.6 MHz, which is why the injection convention must always be stated.',
      },
    ],
  },

  {
    module: 6,
    questions: [
      {
        id: 'm6q1',
        skill: 'definition',
        prompt: 'A code has minimum Hamming distance d_min = 3. What can it do?',
        options: [
          { id: 'a', text: 'Correct 1 bit error and detect up to 2 bit errors' },
          { id: 'b', text: 'Correct 3 bit errors and detect 1 bit error' },
          { id: 'c', text: 'Correct 2 bit errors and detect 3 bit errors' },
          { id: 'd', text: 'Detect any number of errors, but correct none' },
        ],
        correctOptionId: 'a',
        explanation:
          'A code corrects ⌊(d_min − 1)/2⌋ = ⌊2/2⌋ = 1 error, and detects d_min − 1 = 2 errors. This is exactly the SEC capability of a Hamming(7,4) code, which also has d_min = 3.',
        misconception:
          'Correction and detection capability are not the same quantity. Correction requires strictly more distance, which is why the correctable count is always about half the detectable count.',
      },
      {
        id: 'm6q2',
        skill: 'calculation',
        prompt:
          'A message 1101 is protected with the generator polynomial g(x) = x³ + x + 1, which is 1011 in binary. What is the resulting codeword?',
        options: [
          { id: 'a', text: '1101 011' },
          { id: 'b', text: '1101 110' },
          { id: 'c', text: '1101 001' },
          { id: 'd', text: '1101 111' },
        ],
        correctOptionId: 'b',
        explanation:
          'The generator has degree r = 3, so append three zeros to get 1101000 and divide by 1011 over GF(2) using XOR. The remainder is 001, and the codeword is the message followed by the remainder: 1101 001 — which divides evenly by 1011, as it must.',
        misconception:
          'The remainder must be computed by XOR, not by ordinary binary subtraction with borrows — that is the whole point of doing the division in GF(2).',
      },
      {
        id: 'm6q3',
        skill: 'concept',
        prompt: 'What does a block interleaver achieve for a code that corrects only single-bit errors?',
        options: [
          { id: 'a', text: 'It reduces the total number of bit errors in the burst' },
          { id: 'b', text: 'It spreads a contiguous burst into errors separated enough for the code to correct them individually' },
          { id: 'c', text: 'It computes the parity bits needed to locate each error' },
          { id: 'd', text: 'It converts burst errors into random errors without needing any code' },
        ],
        correctOptionId: 'b',
        explanation:
          'Interleaving writes symbols row-wise and transmits them column-wise, so a contiguous burst lands in a single column and, after de-interleaving, becomes several errors separated by the row length. If that separation exceeds what the code can handle, the code corrects each one independently. The number of errors is unchanged.',
        misconception:
          'Interleaving corrects nothing by itself — it only redistributes the damage. Without a code able to correct the redistributed pattern, it achieves nothing.',
      },
    ],
  },
];

export const quizMap = new Map<number, ModuleQuiz>(quizzes.map((q) => [q.module, q]));