import type { Lesson } from '@/types';

export const module6Lessons: Lesson[] = [
  {
    id: 'm6-errors',
    module: 6,
    index: 1,
    title: 'Transmission Errors and Redundancy',
    sidebarLabel: 'Errors and redundancy',
    minutes: 7,
    summary: 'Single-bit and burst errors behave differently, and Hamming distance tells you exactly what a code can do about it.',
    keywords: ['errors', 'burst', 'redundancy', 'Hamming distance', 'detection', 'correction'],
    objectives: [
      'Distinguish single-bit from burst errors and give an example of each.',
      'Explain probability of error as a function of SNR.',
      'Define redundancy and Hamming distance.',
      'Compute the detection and correction capability of a code from d_min.',
      'Explain why random errors and burst errors need different codes.',
    ],
    sections: [
      {
        heading: 'Two kinds of error',
        bullets: [
          '**Single-bit error** — one bit in a codeword is wrong. Typical of Gaussian noise in a well-shielded channel.',
          '**Burst error** — two or more bits within a short window are wrong. Typical of impulse noise, switching transients and fades, and the dominant error in magnetic media and mobile channels.',
        ],
        paragraphs: [
          'The distinction is not academic. A code designed against random errors handles a burst badly: a burst of length b can present up to b independent bit errors to a decoder that only knows how to fix isolated ones.',
        ],
      },
      {
        heading: 'Error probability and SNR',
        paragraphs: [
          'For coherent BPSK in AWGN the probability of error falls roughly as Q(√(2E_b/N_0)), which drops by about a factor of 10 for each 10 dB of Eb/N_0. So error probability improves exponentially with SNR, while required SNR for a target error rate grows only logarithmically.',
          'That is the fundamental reason systems tolerate some errors and use coding to reduce the rest, rather than trying to eliminate errors by raising power alone.',
        ],
      },
      {
        heading: 'Redundancy and Hamming distance',
        paragraphs: [
          '[[Redundancy]] is extra information added to a message so errors can later be detected or corrected. It costs bandwidth and buys reliability.',
          '[[Hamming distance]] is the number of bit positions where two codewords differ. The minimum over all pairs, d_min, determines capability: a code can correct ⌊(d_min − 1)/2⌋ errors and detect up to d_min − 1.',
          'The reason is a counting argument. To correct one error the received word must be nearer to the right codeword than to any other, so codewords must be at least 3 apart. To detect two errors they must be at least 3 apart too. To detect and correct one, 4 apart is needed.',
        ],
        note: {
          kind: 'limit',
          title: 'Detection is not correction',
          body: 'A code can detect more errors than it can correct. Parity detects any odd number of bit errors — potentially many — but corrects none, because it cannot say which bit is wrong. Correction requires strictly more distance and therefore strictly more redundancy.',
        },
      },
    ],
    keyTerms: ['Hamming distance', 'Redundancy', 'CRC', 'FEC', 'ARQ', 'SNR'],
    formulaIds: ['hamming-distance', 'ber-bpsk', 'ber'],
    worked: {
      title: 'What a code can do, from its distance alone',
      given: ['A code with d_min = 4'],
      steps: [
        'Corrects ⌊(4−1)/2⌋ = 1 error.',
        'Detects up to 4 − 1 = 3 errors.',
        'With a burst of 4 errors it may not even detect the burst.',
        'Compare Hamming(7,4) with d_min = 3: corrects 1, detects 2.',
      ],
      answer: 'd_min = 4 gives single-error correction plus detection of up to three errors — the SECDED profile used by many memory systems.',
    },
    applications: [
      'Choosing a code for a specific channel and error profile.',
      'Sizing the redundancy budget against an available Eb/N0.',
      'Deciding between detection with retransmission and forward correction.',
    ],
    misconceptions: [
      {
        myth: '"More redundancy always means a more reliable link."',
        truth: 'It means better error control *for the errors it was designed for*, at the cost of bandwidth and complexity — and more redundancy also lowers net spectral efficiency.',
      },
      {
        myth: '"A burst error is just several single-bit errors in a row."',
        truth: 'For a code designed against random errors, effectively yes — which is why random-error codes fail on bursts and burst codes or interleaving are needed.',
      },
      {
        myth: '"A code that detects errors can also correct them."',
        truth: 'Correction requires a larger minimum distance than detection. Parity detects unlimited odd errors and corrects none.',
      },
    ],
    conclusion:
      'Hamming distance is the compact statement of what a code can do: correct up to ⌊(d_min − 1)/2⌋ errors, detect up to d_min − 1. Everything in this module — parity, CRC, Hamming codes, interleaving — is a different way of buying distance in the quantity you can afford.',
    related: ['m6-hamming', 'm6-crc', 'm6-interleaving'],
    vizId: 'transmission-errors',
    furtherReading: [
      {
        kind: 'read',
        title: 'MIT OpenCourseWare — error correction coding',
        detail: 'Course material on distance, bounds and code construction.',
        why: 'Formal treatment of everything in this lesson.',
        href: 'https://ocw.mit.edu/search/?q=error%20correction',
      },
      {
        kind: 'simulate',
        title: 'Error model in this lesson',
        detail: 'Compare random and burst error patterns on the same codeword.',
        why: 'Shows why one code cannot serve both error profiles.',
      },
      {
        kind: 'read',
        title: 'NPTEL — coding theory lectures',
        detail: 'Linear codes, Hamming bound and standard constructions.',
        why: 'The constructions used in the remaining lessons of this module.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — Hamming distance',
        detail: 'Formal definitions and bounds.',
        why: 'Reference for the distance properties.',
        href: 'https://mathworld.wolfram.com/HammingDistance.html',
      },
    ],
  },

  {
    id: 'm6-parity',
    module: 6,
    index: 2,
    title: 'Parity and Checksums',
    sidebarLabel: 'Parity and checksums',
    minutes: 7,
    summary: 'The cheapest error detection there is — and the reason it is not enough.',
    keywords: ['parity', 'even parity', 'odd parity', 'checksum', 'detection', 'limitations'],
    objectives: [
      'Generate an even-parity bit and an odd-parity bit for a given word.',
      'State exactly which errors a single parity bit detects.',
      'Explain why two-bit errors pass unnoticed.',
      'Explain how a checksum improves on a single parity bit.',
      'State the limitation of both schemes honestly.',
    ],
    sections: [
      {
        heading: 'Parity',
        paragraphs: [
          'A parity bit forces the total number of 1s in a word to be even (or odd). Even parity: p = (Σb_i) mod 2. Odd parity: p = (1 − Σb_i) mod 2.',
          'At the receiver the same sum is recomputed. If the check fails, an error occurred. If it passes, the word is accepted.',
        ],
      },
      {
        heading: 'What it detects and what it misses',
        paragraphs: [
          'Flipping any single bit changes the number of 1s by ±1, so it flips the parity — always detected.',
          'Flipping any **odd** number of bits also flips parity — detected.',
          'Flipping any **even** number of bits leaves parity unchanged — missed, including the very common two-bit error.',
          'It cannot correct anything, because it never identifies which bit is wrong.',
        ],
        note: {
          kind: 'limit',
          title: 'Parity is not a checksum and neither is strong',
          body: 'A single parity bit over a long block detects odd-numbered errors only. Two-dimensional parity (row and column) narrows the error to a row and a column but still misses paired errors. This is the honest reason CRC replaced parity in real data links: parity is a teaching foundation, not a modern error-detection code.',
        },
      },
      {
        heading: 'Checksums',
        paragraphs: [
          'A checksum sums fixed-width words with end-around carry (the Internet checksum) or simply sums bytes. A single-bit error always changes the sum, so a checksum detects all single-bit errors and most multi-bit errors.',
          'However, a reordering of two bytes leaves the sum unchanged, so checksums miss transpositions — a real weakness in file transfer. They also cannot localise an error or correct anything.',
          'Checksums remain useful where speed matters (IP headers, UDP) because they need one addition per word rather than a division.',
        ],
      },
    ],
    keyTerms: ['Redundancy', 'CRC', 'Hamming distance'],
    formulaIds: ['parity'],
    worked: {
      title: 'Test the detector against specific errors',
      given: ['Codeword 10110010 (even parity)'],
      steps: [
        'Single-bit error, position 3: 10010010 — 1s changed from 4 to 3 → parity fails → detected.',
        'Two-bit error, positions 3 and 6: 10010000 — 1s changed from 4 to 2 → parity passes → MISSED.',
        'Three-bit error: parity fails → detected.',
        'Conclusion: all odd numbers of bit errors are detected; all even numbers are missed.',
      ],
      answer: 'Single-bit errors are always caught; two-bit errors pass undetected. That is the fundamental limitation of one parity bit.',
    },
    applications: [
      'Simple memory and bus error detection.',
      'Serial protocols that need minimal logic.',
      'Quick integrity checks in file formats (as a fast first filter, with CRC as the real check).',
    ],
    misconceptions: [
      {
        myth: '"Parity catches most errors, so it is fine as a checksum."',
        truth: 'It catches only odd numbers of bit errors. Two-bit errors are common and pass straight through.',
      },
      {
        myth: '"A checksum detects errors the same way parity does."',
        truth: 'It detects nearly all single- and multi-bit errors but is blind to transpositions, and it still cannot correct anything.',
      },
      {
        myth: '"Odd parity is better than even parity."',
        truth: 'They detect exactly the same set of error patterns. The choice is about which convention the surrounding protocol uses.',
      },
    ],
    conclusion:
      'Parity is a one-bit lesson in both detection and its limits: it reliably catches single and odd-count errors and reliably misses every even-count error. Checksums broaden the detection at similar cost but remain unable to correct, which is why both are stepping stones to CRC and Hamming codes.',
    related: ['m6-crc', 'm6-hamming', 'm6-errors'],
    vizId: 'parity-lab',
    furtherReading: [
      {
        kind: 'read',
        title: 'All About Circuits — digital fundamentals and error detection',
        detail: 'Parity generation and checking circuits.',
        why: 'Circuit context for parity logic.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'simulate',
        title: 'Parity and checksum laboratory in this lesson',
        detail: 'Inject one, two and three bit errors and watch which are caught.',
        why: 'The odd/even behaviour is immediately obvious when tested.',
      },
      {
        kind: 'read',
        title: 'RFC — Internet checksum',
        detail: 'The standard describing the Internet checksum.',
        why: 'Authoritative definition and rationale.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — error detection codes',
        detail: 'Course material on parity, checksums and CRC.',
        why: 'Places all three on a common theoretical footing.',
        href: 'https://ocw.mit.edu/search/?q=error%20correction',
      },
    ],
  },

  {
    id: 'm6-crc',
    module: 6,
    index: 3,
    title: 'Cyclic Redundancy Check',
    sidebarLabel: 'CRC',
    minutes: 9,
    summary: 'Polynomial division over GF(2), one XOR at a time — the strongest cheap detector in digital systems.',
    keywords: ['CRC', 'polynomial', 'GF(2)', 'XOR', 'remainder', 'generator', 'burst error'],
    objectives: [
      'Perform polynomial division over GF(2) step by step.',
      'Compute a CRC remainder and construct the codeword.',
      'Verify a received codeword by re-dividing.',
      'Inject errors and predict which are detected.',
      'State the detection guarantees of a standard polynomial.',
    ],
    sections: [
      {
        heading: 'Arithmetic over GF(2)',
        paragraphs: [
          'Everything in GF(2) is either 0 or 1, addition and subtraction are both **XOR**, and the "carries" that make binary addition interesting simply do not exist.',
          'Long division is therefore beautifully simple: if the current leading bit of the dividend is 1, XOR the generator into the dividend from that position down; if it is 0, do nothing.',
        ],
      },
      {
        heading: 'Constructing the codeword',
        paragraphs: [
          'Append r zeros to the message, where r = deg(g). Divide and take the remainder R. The transmitted codeword is the message followed by R.',
          'At the receiver, divide the *entire received word* by the same generator. If the remainder is zero, assume no error. The appended zeros make the codeword itself a multiple of g, which is exactly what makes this test work.',
        ],
      },
      {
        heading: 'What it detects',
        bullets: [
          'All errors consisting of a single bit.',
          'All burst errors of length ≤ r (the degree of the generator).',
          'All odd numbers of bit errors.',
          'All double-bit errors, provided no codeword is a multiple of the generator.',
          'Not everything: some multi-bit patterns produce a zero remainder and go undetected.',
        ],
        note: {
          kind: 'limit',
          title: 'CRC detects; it does not correct',
          body: 'A CRC says "this frame is probably bad", not "this is the wrong bit". It is a systematic detection code used to trigger a retransmission or to discard a frame. Combining it with a Hamming code is how some systems get correction as well as detection.',
        },
      },
      {
        heading: 'Standard polynomials',
        bullets: [
          'CRC-8 (0x07, 0x31, 0x9B and others) — one byte of check, for short frames.',
          'CRC-16 (0x1021, 0x800D) — two bytes, common in industrial and embedded protocols.',
          'CRC-32 (0x04C11DB7) — four bytes, used by Ethernet, ZIP and PNG.',
          'The laboratory lets you type any generator polynomial so you can verify the arithmetic yourself.',
        ],
      },
    ],
    keyTerms: ['CRC', 'Redundancy', 'Hamming distance'],
    formulaIds: ['crc', 'hamming-distance'],
    worked: {
      title: 'Compute a CRC-3 by hand',
      given: ['Message M = 1101', 'Generator g = 1011 (x³ + x + 1)'],
      steps: [
        'r = deg(g) = 3, so append three zeros: 1101000.',
        'Dividend: 1 1 0 1 0 0 0; divisor: 1 0 1 1.',
        'Position 0: leading bit 1 → XOR → 0111110; skip position 1 (bit is 0).',
        'Position 2: leading bit 1 → XOR → 0001010; skip position 3 (bit is 0).',
        'Positions 4, 5: leading bits are 1, 0 → XOR at position 4 → 0000001.',
        'Remainder R = the last three bits = 001 (as computed by the sweep).',
        'Codeword = 1101 001 = 1101001.',
      ],
      answer: 'The receiver divides 1101001 by 1011 and gets a zero remainder, confirming no error.',
    },
    applications: [
      'Ethernet frame check sequence (CRC-32).',
      'Storage formats: ZIP, PNG and many others embed a CRC.',
      'Embedded protocols (CAN, Modbus, USB) use CRC-8/CRC-16.',
    ],
    misconceptions: [
      {
        myth: '"CRC can correct errors."',
        truth: 'CRC detects. Correction requires Hamming codes or a convolutional code with an appropriate decoder.',
      },
      {
        myth: '"Polynomial division uses ordinary binary subtraction."',
        truth: 'GF(2) addition and subtraction are both XOR, with no carries. That is what makes CRC hardware cheap.',
      },
      {
        myth: '"A CRC never misses an error."',
        truth: 'Some multi-bit error patterns produce a zero remainder and are missed — which is why the guarantee is stated as a specific list, not as certainty.',
      },
    ],
    conclusion:
      'CRC is the workhorse of error detection because it is fast, cheap in hardware, and its guarantees are precisely understood. The laboratory shows every XOR step so the arithmetic can be checked by hand, which is the fastest way to stop treating it as magic.',
    related: ['m6-parity', 'm6-hamming', 'm6-arq'],
    vizId: 'crc-lab',
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — coding theory lectures',
        detail: 'Cyclic codes and CRC construction.',
        why: 'Explains why the codeword construction guarantees a zero remainder.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'CRC laboratory in this lesson',
        detail: 'Watch the XOR sweep position by position, then inject a two-bit error.',
        why: 'The two-bit miss is worth seeing once.',
      },
      {
        kind: 'read',
        title: 'IEEE — Ethernet standard family',
        detail: 'The most widely deployed CRC-32 in networking.',
        why: 'A concrete, verifiable application.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — error correction coding',
        detail: 'Course material on cyclic codes.',
        why: 'Deeper theoretical background.',
        href: 'https://ocw.mit.edu/search/?q=error%20correction',
      },
    ],
  },

  {
    id: 'm6-hamming',
    module: 6,
    index: 4,
    title: 'Hamming Codes',
    sidebarLabel: 'Hamming codes',
    minutes: 9,
    summary: 'Add three parity bits to four data bits and you can find and fix any single-bit error.',
    keywords: ['Hamming', 'SEC', 'SECDED', 'syndrome', 'parity position', 'd_min'],
    objectives: [
      'Encode four data bits into a Hamming(7,4) codeword using the stated convention.',
      'Compute the syndrome for a received word.',
      'Interpret the syndrome as an error position.',
      'Correct a single-bit error and confirm the result.',
      'Explain why two errors are not correctable by SEC alone.',
    ],
    sections: [
      {
        heading: 'The convention used here',
        paragraphs: [
          'Bit numbering is **1 to 7, most significant first**. Parity bits occupy positions 1, 2 and 4; data bits occupy positions 3, 5, 6 and 7.',
          'Codeword layout: **[p1 p2 d1 p4 d2 d3 d4]**.',
          'Each check covers the positions whose binary index contains its own bit: p1 covers {1, 3, 5, 7}, p2 covers {2, 3, 6, 7}, p4 covers {4, 5, 6, 7}. Each parity bit is chosen so its group contains an even number of 1s.',
        ],
        note: {
          kind: 'info',
          title: 'Other numbering conventions exist',
          body: 'Some texts number bits from the least significant bit upward, or place parity bits at positions 8, 4, 2, 1. The arithmetic is equivalent, but a syndrome read under the wrong convention points at the wrong bit. Always state which convention you are using — that is why this lesson prints it.',
        },
      },
      {
        heading: 'The syndrome',
        paragraphs: [
          'At the receiver, recompute each parity check. The three results s1, s2, s4 are each 0 or 1.',
          'Read them as a binary number with s1 as the least significant bit: position = s1·1 + s2·2 + s4·4.',
          'A zero syndrome means no error detected. A non-zero syndrome of value 1–7 identifies the position of the faulty bit directly — the position number *is* the error location.',
        ],
      },
      {
        heading: 'Why it works',
        bullets: [
          'Hamming(7,4) has d_min = 3, so it can correct ⌊(3−1)/2⌋ = 1 error and detect 2.',
          'The syndrome is exactly a (3, 7) binary index, which is why three check bits can address seven positions plus "no error".',
          'The system is linear, so the syndrome of an error word equals the syndrome of the error itself — one flipped bit gives a non-zero syndrome no matter what the data was.',
        ],
      },
      {
        heading: 'What SEC cannot do',
        paragraphs: [
          'With two errors the syndrome points at the position of a bit that is **correct** — a double fault. Flipping it corrupts the word further. SEC therefore cannot handle two errors.',
          '**SECDED** fixes this by adding an eighth, *overall* parity bit covering all seven. If the overall parity check passes but the syndrome is non-zero, an even number of bits changed: double errors are detected but not corrected. That is the standard choice for ECC memory.',
        ],
      },
    ],
    keyTerms: ['Hamming distance', 'Redundancy', 'FEC'],
    formulaIds: ['hamming-distance', 'parity'],
    worked: {
      title: 'Encode 1010 and correct an error',
      given: ['Data bits d1 d2 d3 d4 = 1 0 1 0', 'Convention: [p1 p2 d1 p4 d2 d3 d4]'],
      steps: [
        'p1 covers {1, 3, 5, 7} = p1, d1, d2, d4 → d1 + d2 + d4 = 1 + 0 + 0 = 1 → p1 = 1.',
        'p2 covers {2, 3, 6, 7} = p2, d1, d3, d4 → d1 + d3 + d4 = 1 + 1 + 0 = 2 → p2 = 0.',
        'p4 covers {4, 5, 6, 7} = p4, d2, d3, d4 → d2 + d3 + d4 = 0 + 1 + 0 = 1 → p4 = 1.',
        'Codeword = [1 0 1 1 0 1 0] = 1011010.',
        'Now flip position 5 (a data bit): received = 1011110.',
        'Syndrome: s1 = bits 1,3,5,7 = 1+1+1+0 = 1; s2 = bits 2,3,6,7 = 0+1+1+0 = 0; s4 = bits 4,5,6,7 = 1+1+1+0 = 1.',
        'Position = s1·1 + s2·2 + s4·4 = 1 + 0 + 4 = 5. Flip position 5 back: 1011010. Correct.',
      ],
      answer: 'Codeword 1011010; the corrupted word 1011110 gives syndrome (1,0,1) → position 5, which is exactly the flipped bit.',
    },
    applications: [
      'ECC memory (as SECDED).',
      'Control systems and industrial buses where correction without retransmission is required.',
      'Embedded systems needing low-latency error correction.',
    ],
    misconceptions: [
      {
        myth: '"Hamming code corrects any number of errors."',
        truth: 'Hamming(7,4) corrects exactly one and detects two. Higher-order Hamming codes extend this but remain limited by their distance.',
      },
      {
        myth: '"The syndrome tells you which bit value was wrong."',
        truth: 'It tells you which bit is wrong. Because the code is not error-correcting in value, you flip it — you do not need to know the original value.',
      },
      {
        myth: '"Two errors will be detected."',
        truth: 'Two errors give a non-zero syndrome, so they look like a single error at the wrong position. SECDED is needed to detect them.',
      },
    ],
    conclusion:
      'Hamming(7,4) is the minimum-distance argument made concrete: three parity bits addressing seven positions give single-error correction for the price of 75 % overhead. The syndrome is simultaneously the error detector and the error locator, which is the elegance of the construction.',
    related: ['m6-errors', 'm6-crc', 'm6-arq'],
    vizId: 'hamming-lab',
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — coding theory lectures',
        detail: 'Hamming code construction and distance properties.',
        why: 'The construction used in this lesson.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Hamming laboratory in this lesson',
        detail: 'Enter data, flip any single bit, and read the syndrome that identifies it.',
        why: 'Watching the syndrome equal the error position makes the idea stick.',
      },
      {
        kind: 'read',
        title: 'All About Circuits — digital error correction',
        detail: 'Implementation of SECDED circuits.',
        why: 'Circuit-level view of the extended code.',
        href: 'https://www.allaboutcircuits.com/textbook/',
      },
      {
        kind: 'advanced',
        title: 'Wolfram MathWorld — Hamming code',
        detail: 'Formal definition and distance properties.',
        why: 'Independent reference for the construction.',
        href: 'https://mathworld.wolfram.com/HammingCode.html',
      },
    ],
  },

  {
    id: 'm6-arq',
    module: 6,
    index: 5,
    title: 'FEC and Automatic Repeat reQuest',
    sidebarLabel: 'ARQ protocols',
    minutes: 11,
    summary: 'Correct with redundancy, or detect and ask for a resend — and understand exactly what each costs.',
    keywords: ['FEC', 'ARQ', 'stop-and-wait', 'Go-Back-N', 'selective repeat', 'acknowledgement', 'timeout', 'throughput'],
    objectives: [
      'Distinguish forward error correction from error control with feedback.',
      'Explain acknowledgements, sequence numbers and timeouts.',
      'Compare Stop-and-Wait, Go-Back-N and Selective Repeat behaviour on loss.',
      'Compute normalised throughput for each protocol.',
      'Choose a protocol for a stated link.',
    ],
    sections: [
      {
        heading: 'Two philosophies',
        paragraphs: [
          '**[[FEC]]** adds redundancy so the receiver corrects errors itself. It needs no return channel and no retransmission, which matters for one-way or high-latency links — but it costs bandwidth and complexity on every receiver.',
          '**[[ARQ]]** adds just enough redundancy to detect errors, discards bad blocks and asks for a resend. It is extremely efficient when the channel is good and the return path is cheap — and impossible when it is not.',
          'Modern systems combine them: FEC for the residual errors that ARQ cannot fix in time, ARQ for the rest.',
        ],
      },
      {
        heading: 'Stop-and-Wait ARQ',
        paragraphs: [
          'Send one numbered block. Wait for an acknowledgement or a timeout. On timeout, retransmit.',
          'Simple and robust, and its weakness is arithmetic rather than conceptual: a one-way propagation delay can be many times the block transmission time, and the link idles for the whole round trip. On a geostationary satellite link a is of order 10, so throughput collapses to under 10 %.',
          'An improvement worth knowing is **piggybacking**: the receiver attaches its acknowledgement for block n to its data for block n+1, halving the number of transmissions when traffic is bidirectional.',
        ],
      },
      {
        heading: 'Go-Back-N ARQ',
        paragraphs: [
          'Maintain a window of W unacknowledged blocks and keep sending. On an error or timeout, retransmit from the errored block onward, discarding everything after it.',
          'This hides the round-trip delay behind the window — throughput approaches 1 as long as W exceeds the number of in-flight blocks. But a single error costs an entire window retransmission, so throughput falls sharply on a noisy link with short blocks.',
        ],
      },
      {
        heading: 'Selective Repeat ARQ',
        bullets: [
          'Buffer correctly received out-of-order blocks and retransmit only the missing ones.',
          'Requires the receiver to reorder, which in practice means it must ask the sender to stop beyond the gap.',
          'Best use of bandwidth of the three, at the cost of more complex buffering and control.',
          'The window must satisfy 1 + 2a ≤ W to avoid ambiguity, the same requirement as Go-Back-N.',
        ],
      },
      {
        heading: 'Choosing',
        bullets: [
          '**Long delay, low error rate** — Go-Back-N; the window handles the delay and errors are rare.',
          '**High error rate** — Selective Repeat; retransmitting only what was lost matters a lot.',
          '**Short frames, unreliable channel** — Stop-and-Wait with an FEC layer underneath.',
          '**No return path** — FEC only; ARQ is structurally impossible.',
        ],
      },
    ],
    keyTerms: ['FEC', 'ARQ', 'Stop-and-wait ARQ', 'Go-Back-N ARQ', 'Selective Repeat ARQ', 'Redundancy'],
    formulaIds: ['stop-and-wait', 'gbn'],
    worked: {
      title: 'Throughput comparison for a satellite link',
      given: ['Block transmission time T_f = 10 ms', 'One-way propagation delay T_prop = 270 ms', 'Block error rate p = 0.02', 'Window W = 64 (Go-Back-N and Selective Repeat)'],
      steps: [
        'a = 270/10 = 27 — a very large ratio.',
        'Stop-and-wait: η = (1−0.02)/(1 + 2×27) = 0.98/55 = 0.018 → 1.8 %.',
        'Go-Back-N: η = (1−0.02)/(1 + 2×27×0.98) = 0.98/53.9 = 0.018 → 1.8 %, because p is small and the cost of a full-window retransmission dominates.',
        'Selective Repeat: usable window = 64 − 54 = 10 → η = (1−p)/(1 + 54/10) = 0.98/6.4 = 0.153 → 15.3 %.',
      ],
      answer: 'Stop-and-Wait and Go-Back-N both reach only 1.8 %; Selective Repeat reaches about 15 % because it retransmits only lost blocks.',
    },
    applications: [
      'HDLC and PPP data-link protocols (Go-Back-N style).',
      'TCP, which is Selective Repeat with a variable window.',
      'Satellite links, where Go-Back-N dominates because errors are rare and delay is large.',
    ],
    misconceptions: [
      {
        myth: '"Go-Back-N is always better than Stop-and-Wait."',
        truth: 'It hides delay behind the window, but on a lossy link it retransmits good blocks too. At high p it can be no better than Stop-and-Wait.',
      },
      {
        myth: '"A bigger window always means more throughput."',
        truth: 'Only until the window exceeds what the channel needs; beyond that, Selective Repeat throughput saturates and Go-Back-N loses efficiency on every retransmission.',
      },
      {
        myth: '"FEC and ARQ are alternatives."',
        truth: 'They are complementary. Hybrid ARQ combines them and is what modern satellite and cellular links use.',
      },
    ],
    conclusion:
      'ARQ converts wasted bandwidth into wasted latency, and the protocol you choose decides which you can afford. The simulator lets you watch the difference directly: Go-Back-N resending a whole window after one error versus Selective Repeat resending one block is the clearest demonstration of the trade in this module.',
    related: ['m6-hamming', 'm6-advanced', 'm6-crc'],
    vizId: 'arq-sim',
    vizInitial: { protocol: 'gbn', loss: 0.2, ackLoss: 0, window: 8 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — data communication lectures',
        detail: 'ARQ protocols, windows and throughput.',
        why: 'Standard treatment of all three protocols.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'ARQ simulator in this lesson',
        detail: 'Animate sender, channel and receiver with adjustable loss and acknowledgement loss.',
        why: 'The retransmission pattern is far clearer when you can watch it.',
      },
      {
        kind: 'read',
        title: 'IEEE 802.3 and ITU-T — data link standards',
        detail: 'Real protocols built on these principles.',
        why: 'Production implementations to compare against.',
        href: 'https://www.itu.int/rec/T-REC/en',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — networking',
        detail: 'Course material on sliding-window protocols.',
        why: 'Adds TCP as the modern example.',
        href: 'https://ocw.mit.edu/search/?q=networking',
      },
    ],
  },

  {
    id: 'm6-advanced',
    module: 6,
    index: 6,
    title: 'Advanced Coding Techniques',
    sidebarLabel: 'Convolutional, RS, Turbo, LDPC',
    minutes: 9,
    summary: 'Four families of codes, what each is good at, and where each one stops working.',
    keywords: ['convolutional', 'Viterbi', 'Reed-Solomon', 'Turbo', 'LDPC', 'interleaving', 'near-Shannon'],
    objectives: [
      'Describe the structure and typical use of each code family.',
      'Compare convolutional codes with block codes.',
      'Explain why Reed–Solomon suits burst errors.',
      'Explain what makes turbo and LDPC codes near-optimal.',
      'State the practical limitation of each family.',
    ],
    sections: [
      {
        heading: 'Convolutional codes',
        paragraphs: [
          'A shift register takes k input bits and produces n output bits continuously — a block-free code. The rate is k/n; a rate 1/2 code with constraint length K = 7 is typical.',
          'Decoding is by the Viterbi algorithm, which tracks the most likely path through a trellis. Complexity grows exponentially in K, which is why K is rarely above 9.',
          'Strengths: excellent performance for its simplicity, natural fit to continuous streams. Limitations: fixed delay equal to about 4–5 K symbols, and performance worse than the best block codes.',
        ],
      },
      {
        heading: 'Reed–Solomon codes',
        paragraphs: [
          'A block code over GF(2^r) — each symbol is r bits — that corrects whole symbols. An RS code with 2t parity symbols corrects up to t erroneous symbols.',
          'Strengths: excellent burst-error correction, since a burst of b bits becomes at most ⌈b/r⌉ symbols. Limitations: weak against random errors, and correction capacity is strongest near the start of the codeword and weakest at the end.',
          'Used in optical disks, magnetic media, QR codes, DVDs and DVB.',
        ],
      },
      {
        heading: 'Turbo codes',
        paragraphs: [
          'Two or more convolutional codes in parallel or serial, linked by an interleaver, with iterative (often soft-input) decoding. The interleaver is essential: without it the two encoders see correlated inputs and the gains vanish.',
          'Strengths: within 0.5 dB of the Shannon limit. Limitations: high latency from many iterations and deep interleaving, high computational cost, and awkward block handling for streaming.',
        ],
      },
      {
        heading: 'LDPC codes',
        paragraphs: [
          'Defined by a sparse parity-check matrix, decoded by belief propagation on its factor graph. Modern designs come close to the Shannon limit at high rates with far less latency than turbo codes.',
          'Strengths: near-Shannon-limit performance with high parallelism, so they map well onto parallel hardware. Limitations: at short block lengths they trail turbo codes, and irregular graphs are hard to analyse.',
          'Used in Wi-Fi 6/7, 5G data channels, DVB-S2, and hard-disk and SSD controllers.',
        ],
      },
      {
        heading: 'Where interleaving fits',
        paragraphs: [
          'A code designed for random errors handles a burst badly. An [[Interleaving|interleaver]] rearranges symbols so that a burst becomes several separated errors after de-interleaving — which the code can then handle one at a time.',
          'The interleaver corrects nothing by itself. It is the code that detects and corrects; the interleaver only redistributes the damage so the code can do its job.',
        ],
      },
    ],
    keyTerms: ['Convolutional code', 'Reed–Solomon code', 'Turbo code', 'LDPC code', 'Interleaving', 'FEC'],
    formulaIds: ['interleave-depth', 'hamming-distance'],
    worked: {
      title: 'Compare the families on a single criterion',
      given: ['Burst of 1000 bits, codeword length 1500 symbols, r = 8 bits per symbol'],
      steps: [
        'An RS code with t = 10 parity symbols corrects up to 80 bits of burst.',
        'A convolutional code has no burst-error capability at all without interleaving.',
        'Interleaving a convolutional code with depth 100 turns the burst into 10 separated errors of 100 bits… still far beyond a rate 1/2 K = 7 code\'s capability.',
        'Conclusion: burst errors need either a burst code (RS) or deep interleaving plus a code whose random-error capability matches the resulting error length.',
      ],
      answer: 'For long bursts, Reed–Solomon directly; for convolutional and LDPC codes, interleaving is mandatory and the depth must match the burst length.',
    },
    applications: [
      'Convolutional: legacy wireless standards, GPS, deep-space links.',
      'Reed–Solomon: optical discs, QR codes, DVB, SSD error correction.',
      'Turbo: 3G/4G data channels, satellite (with CCSDS standards).',
      'LDPC: Wi-Fi 6/7, 5G NR data, DVB-S2, storage controllers.',
    ],
    misconceptions: [
      {
        myth: '"Turbo codes are always the best choice."',
        truth: 'They are near-optimal but carry high latency from iterative decoding, which is why 5G chose LDPC for data and polar codes for control.',
      },
      {
        myth: '"Reed–Solomon corrects random errors as well as bursts."',
        truth: 'It is designed for bursts. Against random errors its capability is poor relative to codes with the same overhead.',
      },
      {
        myth: '"Interleaving corrects errors."',
        truth: 'It redistributes them. If the associated code cannot correct the redistributed pattern, interleaving achieves nothing.',
      },
    ],
    conclusion:
      'There is no best code — there is a best code for a channel and a latency budget. Convolutional codes are simple, Reed–Solomon handles bursts, turbo codes are near-optimal but slow, and LDPC is near-optimal with low latency and high parallelism. Interleaving is the enabler that lets random-error codes face burst channels at all.',
    related: ['m6-interleaving', 'm6-arq', 'm4-modems'],
    vizId: 'advanced-coding',
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — coding theory lectures',
        detail: 'Convolutional, Reed–Solomon, turbo and LDPC constructions.',
        why: 'The standard course treatment of all four families.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Advanced coding panel in this lesson',
        detail: 'Compare capability, block length and latency across the four families.',
        why: 'Puts the trade-offs side by side.',
      },
      {
        kind: 'read',
        title: 'IEEE — communications standards',
        detail: 'Where LDPC and turbo codes appear in published standards.',
        why: 'Production usage to check the claims against.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — error correction coding',
        detail: 'Course material on modern coding approaches.',
        why: 'Deeper treatment of turbo and LDPC.',
        href: 'https://ocw.mit.edu/search/?q=error%20correction',
      },
    ],
  },

  {
    id: 'm6-interleaving',
    module: 6,
    index: 7,
    title: 'Interleaving for Burst Errors',
    sidebarLabel: 'Interleaving',
    minutes: 8,
    summary: 'It fixes nothing by itself. It rearranges the damage so that the code can.',
    keywords: ['interleaving', 'de-interleaving', 'burst error', 'matrix', 'randomisation'],
    objectives: [
      'Perform a block interleaver write and a de-interleave read by hand.',
      'Show a burst becoming separated errors after de-interleaving.',
      'Compute the minimum separation the interleaver guarantees.',
      'Explain precisely what interleaving does and does not do.',
      'Explain why both interleaver depth and code capability must be matched.',
    ],
    sections: [
      {
        heading: 'The mechanism',
        paragraphs: [
          'Write the coded symbols into a matrix row by row, then transmit the matrix **column by column**. At the receiver, reverse the process.',
          'Consecutive channel errors therefore land in a single column, which spreads them across the recovered sequence at intervals equal to the row length.',
        ],
        note: {
          kind: 'limit',
          title: 'Interleaving corrects nothing by itself',
          body: 'After de-interleaving the same number of symbols is still wrong. What has changed is their spacing. If the associated code can correct errors at least d symbols apart, the burst becomes individually correctable. If it cannot, the interleaver achieves nothing at all — it only spends memory and latency.',
        },
      },
      {
        heading: 'Sizing the interleaver',
        paragraphs: [
          'For a block interleaver of depth L that must handle bursts up to length b, the guarantee is a minimum separation d ≥ ⌊L/b⌋ between originally adjacent symbols.',
          'The interleaver must also be at least as deep as the burst: if the burst is longer than L it will corrupt whole columns and the guarantee collapses entirely.',
        ],
      },
      {
        heading: 'Other uses',
        bullets: [
          'Randomising burst-mode memory (DRAM refresh timing) and thereby raising the effective burst length tolerance.',
          'Making an AWGN channel behave more like a random-error channel for a code that cannot handle bursts.',
          'Reducing peak-to-average ratio in OFDM by randomising subcarrier assignment.',
        ],
      },
    ],
    keyTerms: ['Interleaving', 'Hamming distance', 'Reed–Solomon code', 'Convolutional code', 'LDPC code'],
    formulaIds: ['interleave-depth', 'hamming-distance'],
    worked: {
      title: 'Interleave a burst of 4 with depth 20',
      given: ['Interleaver depth L = 20', 'Burst of b = 4 consecutive symbols'],
      steps: [
        'Required separation: d ≥ ⌊20/4⌋ = 5 symbols.',
        'Write 20 symbols row-wise into 4 columns × 5 rows; read them column-wise.',
        'Four consecutive channel positions correspond to symbols at recovered positions 1, 6, 11 and 16.',
        'Separation between them is 5, which meets the requirement.',
      ],
      answer: 'A burst of 4 becomes four errors exactly 5 symbols apart, which a code correcting single errors with separation ≥ 5 can handle.',
    },
    applications: [
      'OFDM: pilot subcarriers break up deep fades that would otherwise wipe a contiguous block.',
      'CD and magnetic storage: interleaving with a Reed–Solomon inner code and a convolutional outer code.',
      'Mobile and satellite links where multipath produces bursts of consecutive errors.',
    ],
    misconceptions: [
      {
        myth: '"Interleaving reduces the number of errors."',
        truth: 'It does not change the count at all. It changes their spacing so a code with limited per-window capability can handle them.',
      },
      {
        myth: '"Deeper interleaving is always better."',
        truth: 'Deeper means more memory and more latency, and once the depth exceeds what the burst requires you gain nothing further.',
      },
      {
        myth: '"Any burst can be interleaved away."',
        truth: 'A burst longer than the interleaver depth will corrupt complete columns and the separation guarantee fails.',
      },
    ],
    conclusion:
      'Interleaving is a rearrangement, not a repair. It converts a burst problem into a random-error problem, and it is worth exactly as much as the code that then fixes the separated errors. The laboratory shows the matrix write and read, and the error positions before and after, so the claim can be checked rather than believed.',
    related: ['m6-advanced', 'm6-errors', 'm4-ofdm'],
    vizId: 'interleaving',
    vizInitial: { depth: 6, burstStart: 4, burstLen: 3 },
    furtherReading: [
      {
        kind: 'read',
        title: 'NPTEL — coding theory lectures',
        detail: 'Interleaver design and burst-error theory.',
        why: 'Standard treatment of block and convolutional interleavers.',
        href: 'https://nptel.ac.in/courses',
      },
      {
        kind: 'simulate',
        title: 'Interleaving laboratory in this lesson',
        detail: 'Watch the matrix fill, the burst land, and the error positions after de-interleaving.',
        why: 'The separation guarantee becomes obvious visually.',
      },
      {
        kind: 'read',
        title: 'IEEE 802.11 and DVB standards',
        detail: 'Real interleavers defined in published standards.',
        why: 'Production designs to compare against.',
        href: 'https://www.ieee.org/',
      },
      {
        kind: 'advanced',
        title: 'MIT OpenCourseWare — information theory and coding',
        detail: 'Deeper treatment of burst channels and interleaving.',
        why: 'The theoretical basis for the separation guarantee.',
        href: 'https://ocw.mit.edu/search/?q=information%20theory',
      },
    ],
  },
];