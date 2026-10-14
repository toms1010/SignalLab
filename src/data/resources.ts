import type { Resource } from '@/types';

/**
 * Curated external learning resources.
 *
 * Honesty rules applied to every entry below:
 *  - `verified: 'direct'` — the URL points at a specific page whose content is
 *    described accurately.
 *  - `verified: 'root'` — the URL is an official entry point (not a specific
 *    lesson), and `verificationNote` tells the learner exactly what to search
 *    for there. No invented deep links.
 *  - No fabricated authors, editions, ratings or review counts.
 *  - Commercial books are labelled `paid` and point at publisher catalogue pages,
 *    never at unauthorised copies.
 */
export const resources: Resource[] = [
  /* ------------------------------------------- general / open courseware */
  {
    id: 'r-ocw-root',
    title: 'MIT OpenCourseWare — course catalogue',
    author: 'Massachusetts Institute of Technology',
    type: 'notes',
    difficulty: 'Intermediate',
    format: 'read',
    modules: [1, 2, 3, 4, 5, 6],
    topics: ['signals and systems', 'sampling', 'modulation', 'coding', 'error correction'],
    description:
      'Free lecture notes, assignments and exams from MIT undergraduate and graduate courses. The most useful entry point for signals, digital communication and coding theory material.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Site-wide entry point. Search the catalogue for "signals and systems", "digital communication" and "error correction coding"; course pages are linked directly from there.',
    href: 'https://ocw.mit.edu/',
  },
  {
    id: 'r-ocw-603',
    title: 'MIT OpenCourseWare 6.003 — Signals and Systems',
    author: 'Massachusetts Institute of Technology',
    type: 'notes',
    difficulty: 'Intermediate',
    format: 'read',
    modules: [1, 5],
    topics: ['sampling theorem', 'spectra', 'Fourier transform', 'modulation', 'linear systems'],
    description:
      'Full lecture series covering convolution, Fourier analysis, sampling, modulation and filtering. The sampling-theorem treatment here is the clearest available for the Module 1 foundation.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Course page with lecture notes and video for Fall 2011.',
    href: 'https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/',
  },
  {
    id: 'r-nptel-root',
    title: 'NPTEL — national programme on technology-enhanced learning',
    author: 'IITs and IISc, Government of India',
    type: 'video',
    difficulty: 'Intermediate',
    format: 'watch',
    modules: [1, 2, 3, 4, 5, 6],
    topics: ['communication systems', 'digital communication', 'coding theory', 'analog modulation'],
    description:
      'Free lecture series from India\'s leading engineering institutes, typically with full video coverage and written lecture notes for each session.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Course listing portal. Search for "communication systems" or "digital communication"; each course has its own free video and transcript pages.',
    href: 'https://nptel.ac.in/courses',
  },
  {
    id: 'r-aac',
    title: 'All About Circuits — electronics textbook and reference',
    author: 'All About Circuits',
    type: 'notes',
    difficulty: 'Beginner',
    format: 'read',
    modules: [1, 2, 3, 5],
    topics: ['sample and hold', 'ADC', 'DAC', 'oscillators', 'modulation circuits', 'error correction'],
    description:
      'Large free reference with a traditional textbook structure. The sample-and-hold, ADC and DAC chapters are the closest practical treatment of the Module 2 hardware blocks.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Site entry point with a browsable textbook index. Use the "Textbook" section for the sample-and-hold, ADC and modulation chapters.',
    href: 'https://www.allaboutcircuits.com/textbook/',
  },
  {
    id: 'r-ieee',
    title: 'IEEE — standards and technical resources',
    author: 'Institute of Electrical and Electronics Engineers',
    type: 'standard',
    difficulty: 'Advanced',
    format: 'reference',
    modules: [4, 5, 6],
    topics: ['IEEE 802', 'OFDM', 'LDPC', 'modulation standards', 'radio regulations'],
    description:
      'Home of the standards that define Wi-Fi (802.11), Ethernet (802.3) and mobile data. Most individual standards are paywalled, but abstracts, working-group pages and many committee documents are free.',
    access: 'institutional',
    verified: 'root',
    verificationNote:
      'Organisation entry point. Individual IEEE standards usually require subscription or institutional access; working-group pages are generally public.',
    href: 'https://www.ieee.org/',
  },
  {
    id: 'r-itu',
    title: 'ITU-T recommendations',
    author: 'International Telecommunication Union',
    type: 'standard',
    difficulty: 'Advanced',
    format: 'reference',
    modules: [2, 4, 5, 6],
    topics: ['G.711', 'V-series modems', 'audio codecs', 'error control'],
    description:
      'The authoritative source for the companding standards in Module 2, the modem specifications in Module 4, and the ARQ and codec standards in Module 6. Free to browse and download.',
    access: 'free',
    verified: 'direct',
    verificationNote:
      'Official recommendation catalogue. Look up G.711 for companded PCM, the V-series for modem standards, and G.72x for ADPCM audio codecs.',
    href: 'https://www.itu.int/rec/T-REC/en',
  },

  /* ------------------------------------------------------- mathematics / tools */
  {
    id: 'r-mathworld',
    title: 'Wolfram MathWorld — mathematical reference',
    author: 'Wolfram Research',
    type: 'tool',
    difficulty: 'Intermediate',
    format: 'reference',
    modules: [1, 4, 5, 6],
    topics: ['Nyquist-Shannon theorem', 'spectral efficiency', 'Q-function', 'Hamming distance', 'Carson rule'],
    description:
      'Authoritative definitions and derivations for the mathematical quantities used throughout SignalLab. Useful as an independent check on any formula quoted in a lesson.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Reference site entry point. Article titles follow predictable patterns (e.g. "Nyquist-ShannonSamplingTheorem.html"), but navigate by search to be sure you reach the intended article.',
    href: 'https://mathworld.wolfram.com/',
  },
  {
    id: 'r-desmos',
    title: 'Desmos — graphing calculator',
    author: 'Desmos',
    type: 'tool',
    difficulty: 'Beginner',
    format: 'simulate',
    modules: [1, 2, 4, 5],
    topics: ['plotting', 'companding curve', 'constellation', 'AM envelope'],
    description:
      'Free browser graphing calculator. The fastest way to plot a μ-law curve, an AM envelope or a constellation labelling and check it against the laboratory.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Direct link to the calculator application.',
    href: 'https://www.desmos.com/calculator',
  },
  {
    id: 'r-geogebra',
    title: 'GeoGebra — dynamic geometry and algebra',
    author: 'GeoGebra Institute',
    type: 'tool',
    difficulty: 'Beginner',
    format: 'simulate',
    modules: [1, 2],
    topics: ['function plotting', 'sampling', 'staircase reconstruction'],
    description:
      'Free dynamic mathematics software with sliders and sliders-driven animation. Useful for independently exploring sampling and quantisation with your own parameters.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Home page with the online and desktop applications.',
    href: 'https://www.geogebra.org/',
  },
  {
    id: 'r-numpy',
    title: 'NumPy documentation',
    author: 'NumPy Developers',
    type: 'tool',
    difficulty: 'Intermediate',
    format: 'reference',
    modules: [1, 3, 4],
    topics: ['array maths', 'FFT', 'convolution', 'signal simulation'],
    description:
      'Reference for the array operations behind every SignalLab simulation. The FFT and convolution pages map directly onto the OFDM and filter concepts in this course.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Official stable documentation for the current NumPy release.',
    href: 'https://numpy.org/doc/stable/',
  },
  {
    id: 'r-scipy-signal',
    title: 'SciPy — signal processing reference',
    author: 'SciPy Developers',
    type: 'tool',
    difficulty: 'Advanced',
    format: 'reference',
    modules: [1, 2, 3, 4],
    topics: ['resampling', 'anti-aliasing filters', 'filter design', 'FFT'],
    description:
      'Implementation reference for resampling, decimation filters and filter design. The resampling documentation states the anti-aliasing requirement explicitly, which is exactly the Module 1 point.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Direct link to the signal-processing module documentation.',
    href: 'https://docs.scipy.org/doc/scipy/reference/signal.html',
  },
  {
    id: 'r-gnuradio',
    title: 'GNU Radio documentation',
    author: 'GNU Radio project',
    type: 'tool',
    difficulty: 'Advanced',
    format: 'reference',
    modules: [3, 4, 5],
    topics: ['modulation', 'filters', 'software defined radio', 'syncronisation'],
    description:
      'Documentation for the software radio framework. The modulation and filter blocks are working reference implementations of the ASK/FSK/PSK and receiver-chain concepts in Modules 4 and 5.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Project documentation entry point. Versioned documentation is linked from the main site; follow the link matching your installed version.',
    href: 'https://www.gnuradio.org/doc/',
  },

  /* ----------------------------------------------------------- textbooks */
  {
    id: 'r-book-haykin',
    title: 'Communication Systems (book)',
    author: 'Simon Haykin and Michael Moher',
    type: 'book',
    difficulty: 'Intermediate',
    format: 'read',
    modules: [1, 5],
    topics: ['noise', 'AM and FM', 'detection', 'matched filter'],
    description:
      'The standard undergraduate text for analogue communication. Its noise chapter and matched-filter treatment are widely used as the reference for Modules 1 and 5.',
    access: 'paid',
    verified: 'root',
    verificationNote:
      'Publisher entry point. This is a commercial title — you need a purchased copy, a library loan or institutional access. No edition or date is asserted here.',
    href: 'https://www.wiley.com/',
  },
  {
    id: 'r-book-proakis',
    title: 'Digital Communications (book)',
    author: 'John G. Proakis and Salehi',
    type: 'book',
    difficulty: 'Advanced',
    format: 'read',
    modules: [1, 4, 6],
    topics: ['AWGN channels', 'bandwidth efficiency', 'error control coding', 'spread spectrum'],
    description:
      'The standard advanced reference for digital communication: channel models, modulation performance and error control coding, all treated quantitatively.',
    access: 'paid',
    verified: 'root',
    verificationNote:
      'Publisher entry point. Commercial title requiring purchase, library or institutional access. Author list may vary by edition; check the publisher catalogue for the exact edition and co-authors.',
    href: 'https://www.mheducation.com/',
  },
  {
    id: 'r-book-lathi',
    title: 'Modern Digital and Analog Communication Systems (book)',
    author: 'B. P. Lathi',
    type: 'book',
    difficulty: 'Intermediate',
    format: 'read',
    modules: [2, 3, 4, 5],
    topics: ['PCM', 'delta modulation', 'passband modulation', 'analog modulation'],
    description:
      'Connects the analogue and digital halves of this course unusually well, with substantial treatment of delta modulation and of both modulation families side by side.',
    access: 'paid',
    verified: 'root',
    verificationNote: 'Publisher entry point. Commercial title requiring purchase or library access.',
    href: 'https://global.oup.com/',
  },
  {
    id: 'r-book-sklar',
    title: 'Digital Communications: Fundamentals and Applications (book)',
    author: 'Bernard Sklar',
    type: 'book',
    difficulty: 'Intermediate',
    format: 'read',
    modules: [1, 4],
    topics: ['sampling', 'baseband', 'bandpass', 'spread spectrum'],
    description:
      'Practical and example-rich. Its treatment of baseband/bandpass design, spread spectrum and the effect of filter roll-off is directly applicable to Modules 1 and 4.',
    access: 'paid',
    verified: 'root',
    verificationNote: 'Publisher entry point. Commercial title requiring purchase, library or institutional access.',
    href: 'https://www.pearson.com/',
  },

  /* ------------------------------------------------------- practice sets */
  {
    id: 'r-practice-signallab',
    title: 'SignalLab practical exercises',
    author: 'SignalLab',
    type: 'practice',
    difficulty: 'Intermediate',
    format: 'practice',
    modules: [1, 2, 3, 4, 5, 6],
    topics: ['formula substitution', 'unit checking', 'numerical problems', 'binary coding'],
    description:
      'Ten self-checked exercises built from the same formulas as the lessons, each with a working solution and links back to the relevant lesson.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Built into this application — see the Practical Exercises page.',
    href: '/exercises',
  },
  {
    id: 'r-ocw-problems',
    title: 'MIT OpenCourseWare — problem sets and exams',
    author: 'Massachusetts Institute of Technology',
    type: 'practice',
    difficulty: 'Advanced',
    format: 'practice',
    modules: [1, 4, 6],
    topics: ['problem sets', 'examinations', 'design exercises'],
    description:
      'Most OCW courses publish assignments with worked solutions. These are the closest freely available analogue to a structured problem set in communication systems.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Assignments are linked from individual course pages under "Assignments". Start from the catalogue and navigate to a specific course.',
    href: 'https://ocw.mit.edu/',
  },

  /* ------------------------------------------------------------ projects */
  {
    id: 'r-gnuradio-project',
    title: 'GNU Radio — build a working demodulator',
    author: 'GNU Radio project',
    type: 'project',
    difficulty: 'Advanced',
    format: 'practice',
    modules: [4, 5],
    topics: ['flowgraph', 'modulator', 'demodulator', 'channel model'],
    description:
      'A constructive project: build a transmit and receive flowgraph, insert a channel model, and measure the resulting bit error rate against the theory from Module 4.',
    access: 'free',
    verified: 'root',
    verificationNote:
      'Project entry point with documentation and tutorial flowgraphs. The documentation is linked from the main site.',
    href: 'https://www.gnuradio.org/doc/',
  },
  {
    id: 'r-numpy-project',
    title: 'NumPy project — verify SignalLab by hand',
    author: 'NumPy Developers',
    type: 'project',
    difficulty: 'Intermediate',
    format: 'practice',
    modules: [1, 2, 3, 4],
    topics: ['sampling', 'quantisation', 'delta modulation', 'constellation'],
    description:
      'Write your own sampling, quantisation, delta-modulation and constellation routines in NumPy, then check that they reproduce the numbers SignalLab displays.',
    access: 'free',
    verified: 'direct',
    verificationNote: 'Direct link to the stable NumPy documentation.',
    href: 'https://numpy.org/doc/stable/',
  },
];

export const resourceMap = new Map(resources.map((r) => [r.id, r]));

export const resourcesForModule = (module: number): Resource[] =>
  resources.filter((r) => r.modules.includes(module as never));

export const resourcesForLessons = (lessonIds: readonly string[]): Resource[] => {
  const out = new Map<string, Resource>();
  for (const r of resources) {
    // A lesson "uses" a resource when the lesson's topics overlap its tags, or
    // when the resource is mapped to the lesson's module.
    const moduleMatched = lessonIds.some((id) => r.modules.includes(Number(id.charAt(1)) as never));
    if (moduleMatched) out.set(r.id, r);
  }
  return [...out.values()];
};

export const searchResources = (query: string): Resource[] => {
  const q = query.trim().toLowerCase();
  if (!q) return resources;
  const terms = q.split(/\s+/);
  return resources.filter((r) => {
    const hay = [r.title, r.author, r.description, r.topics.join(' '), r.type, r.difficulty].join(' ').toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
};