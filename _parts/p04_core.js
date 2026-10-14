/* =========================================================================
   SignalLab — single-file interactive communication-systems laboratory
   -------------------------------------------------------------------------
   Architecture
     SL.util      pure math / formatting / DOM helpers
     SL.store     localStorage persistence (versioned, defensive)
     SL.gloss     technical glossary + tooltip engine
     SL.plot      canvas plotting engine (axes, grid, legend, series)
     SL.dsp       signal-generation primitives (sine, sample, quantise, …)
     SL.data      MODULES / LESSONS / FORMULAS / RESOURCES / PATHS / EXERCISES
     SL.viz       one scene per interactive laboratory
     SL.quiz      quiz engine
     SL.views     view router + renderers
     SL.boot      wiring + animation scheduler

   All DSP code is deterministic: seeded PRNG only, no Math.random() in any
   measurement path, so a lesson re-opened with the same slider values always
   reproduces exactly the same figure and the same numbers.
   ========================================================================= */
'use strict';
var SL = window.SL = {};

/* ------------------------------------------------------------------ util */
var U = SL.util = (function () {
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function map(v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); }
  function round(v, n) { var p = Math.pow(10, n == null ? 3 : n); return Math.round(v * p) / p; }
  function sig(v, n) {                                   // compact significant figure format
    if (v === 0 || !isFinite(v)) return '0';
    var a = Math.abs(v);
    if (a >= 1e5 || a < 1e-3) return v.toExponential(2).replace('e+', '×10^').replace('e-', '×10^-');
    return String(round(v, n == null ? 4 : n));
  }
  function fmt(v, n, unit) { return sig(v, n) + (unit ? ' ' + unit : ''); }
  function db(x) { return 10 * Math.log10(Math.max(x, 1e-30)); }
  function fromDb(d) { return Math.pow(10, d / 10); }
  function ampDb(x) { return 20 * Math.log10(Math.max(x, 1e-30)); }
  /* Abramowitz & Stegun 26.2.17 — Gaussian tail probability Q(x)=0.5·erfc(x/√2) */
  function Q(x) {
    var t = 1 / (1 + 0.2316419 * Math.abs(x));
    var d = 0.3989422804014327 * Math.exp(-x * x / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return x >= 0 ? p : 1 - p;
  }
  function erf(x) { // Abramowitz & Stegun 7.1.26
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function rms(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / a.length); }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length;
    return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; }
  function stddev(a) { var m = mean(a); return Math.sqrt(mean(a.map(function (v) { return (v - m) * (v - m); }))); }
  /* Deterministic 32-bit PRNG (mulberry32) — reproducible noise. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* Box–Muller: uniform PRNG -> standard normal samples (deterministic). */
  function gauss(rand) {
    var u = Math.max(1e-12, rand()), v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function toBin(n, w) { var s = (n >>> 0).toString(2); while (s.length < w) s = '0' + s; return s; }
  function binToNum(s) { return parseInt(s, 2) >>> 0; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function xorBin(a, b) { var s = '', i; for (i = 0; i < Math.max(a.length, b.length); i++) s += ((+a[i] || 0) ^ (+b[i] || 0)) + ''; return s; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function attr(s) { return esc(s).replace(/'/g, '&#39;'); }
  /* ---- tiny DOM ---- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) e.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); return function () { t.removeEventListener(ev, fn, o); }; }
  function empty(n) { while (n && n.firstChild) n.removeChild(n.firstChild); return n; }
  function debounce(fn, ms) { var h; return function () { var a = arguments, s = this; clearTimeout(h); h = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  return { clamp: clamp, map: map, round: round, sig: sig, fmt: fmt, db: db, fromDb: fromDb, ampDb: ampDb, Q: Q, erf: erf,
    mean: mean, rms: rms, median: median, stddev: stddev, rng: rng, gauss: gauss, toBin: toBin, binToNum: binToNum,
    pad2: pad2, gcd: gcd, lcm: lcm, xorBin: xorBin, esc: esc, attr: attr, $: $, $$: $$, el: el, on: on, empty: empty, debounce: debounce };
})();

var $ = U.$, $$ = U.$$, esc = U.esc;

/* ------------------------------------------------------------ animation */
SL.motion = {
  ok: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  gsap: function (t, o) { if (SL.motion.ok && window.gsap && !SL.store.get().prefs.noGsap) { try { window.gsap.to(t, o); return; } catch (e) { } } },
  from: function (t, o) { if (SL.motion.ok && window.gsap && !SL.store.get().prefs.noGsap) { try { window.gsap.from(t, o); return; } catch (e) { } } },
  /* CSS-only fallback used when GSAP is unavailable */
  fadeIn: function (node) {
    if (!SL.motion.ok || !window.gsap || SL.store.get().prefs.noGsap) { node.style.opacity = 1; return; }
    window.gsap.from(node, { opacity: 0, y: 8, duration: .32, ease: 'power2.out' });
  }
};

/* ---------------------------------------------------------------- store */
SL.store = (function () {
  var KEY = 'signallab.v1';
  var DEFAULTS = {
    v: 1,
    lessons: {},            // lessonId -> {done:true, at:ts}
    quiz: {},               // moduleId -> {best:0..3, attempts:n, answers:[..], at:ts}
    prefs: { theme: 'dark', katex: true, noGsap: false, alwaysAnimate: false, mathFallback: false },
    resources: {},          // resId -> {bm:true, done:true, at:ts}
    exercises: {},          // exId -> {solved:true, attempts:n, at:ts}
    path: null,
    last: { view: 'dashboard', lesson: null },
    viz: {},                // per-lab control values (simulator preferences)
    seen: []                // recent activity log
  };
  function deepMerge(base, over) {
    if (over === null || over === undefined) return base;
    if (typeof base !== 'object' || base === null || Array.isArray(base)) return over;
    if (typeof over !== 'object' || Array.isArray(over)) return over;
    var out = {}, k;
    for (k in base) out[k] = base[k];
    for (k in over) out[k] = k in base ? deepMerge(base[k], over[k]) : over[k];
    return out;
  }
  var mem = null, saveTimer = null;
  function read() {
    if (mem) return mem;
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    var parsed = null;
    if (raw) { try { parsed = JSON.parse(raw); } catch (e) { parsed = null; } }
    mem = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), (parsed && typeof parsed === 'object') ? parsed : null);
    // Defensive repair: everything must be plain objects/strings of the right shape.
    ['lessons', 'quiz', 'resources', 'exercises', 'viz', 'prefs'].forEach(function (k) {
      if (!mem[k] || typeof mem[k] !== 'object' || Array.isArray(mem[k])) mem[k] = {};
    });
    if (!Array.isArray(mem.seen)) mem.seen = [];
    if (typeof mem.path !== 'string') mem.path = null;
    if (!mem.last || typeof mem.last !== 'object') mem.last = { view: 'dashboard', lesson: null };
    if (mem.prefs.theme !== 'light' && mem.prefs.theme !== 'dark') mem.prefs.theme = 'dark';
    return mem;
  }
  function flush() {
    try { localStorage.setItem(KEY, JSON.stringify(mem)); }
    catch (e) { SL.toast('Progress could not be saved — browser storage is unavailable or full.', 'warn'); }
  }
  function save() { if (!mem) read(); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 180); }
  function saveNow() { if (!mem) read(); clearTimeout(saveTimer); flush(); }
  return {
    get: read,
    save: save,
    saveNow: saveNow,
    defaults: DEFAULTS,
    key: KEY,
    setP: function (k, v) { read().prefs[k] = v; save(); },
    markLesson: function (id, done) {
      var s = read(); if (done) s.lessons[id] = { done: true, at: Date.now() }; else delete s.lessons[id];
      log(s, done ? 'Completed lesson' : 'Reopened lesson', lessonTitle(id)); save();
    },
    logActivity: function (what, what2) { var s = read(); log(s, what, what2); save(); },
    resetAll: function () { try { localStorage.removeItem(KEY); } catch (e) { } mem = null; read(); },
    bytes: function () { try { return (localStorage.getItem(KEY) || '').length; } catch (e) { return 0; } }
  };
  function log(s, what, what2) {
    s.seen.unshift({ t: Date.now(), a: what, b: what2 || '' });
    if (s.seen.length > 24) s.seen.length = 24;
  }
  function lessonTitle(id) {
    var L = SL.data.lessonMap[id];
    return L ? L.title : id;
  }
})();

/* ---------------------------------------------------------------- toasts */
SL.toast = function (msg, kind, ms) {
  var box = $('#toasts'); if (!box) return;
  var icons = { ok: '✓', err: '!', info: 'i', warn: '!' };
  var t = U.el('div', { class: 'toast ' + (kind || 'info'), role: 'status' }, [
    U.el('span', { class: 'ic', text: icons[kind] || 'i' }), U.el('span', { text: msg })
  ]);
  box.appendChild(t);
  setTimeout(function () {
    t.classList.add('out');
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
  }, ms || 3200);
};

/* ---------------------------------------------------------------- modal */
SL.modal = function (title, bodyNode, buttons) {
  var scrim = $('#scrim'), m = $('#modal');
  U.empty(m);
  var h = U.el('h3', { id: 'modalTitle', text: title });
  m.appendChild(h); m.appendChild(bodyNode);
  var foot = U.el('div', { class: 'mfoot' });
  (buttons || []).forEach(function (b) {
    foot.appendChild(U.el('button', { class: 'btn ' + (b.cls || ''), text: b.label, onclick: function () { if (b.fn) b.fn(); if (!b.keepOpen) SL.closeModal(); } }));
  });
  m.appendChild(foot);
  scrim.classList.add('open');
  var f = m.querySelector('button'); if (f) f.focus();
};
SL.closeModal = function () { $('#scrim').classList.remove('open'); U.empty($('#modal')); };

/* ------------------------------------------------------------- glossary */
/* Every technical term is defined once here and reused by lesson text ({{term}}),
   the glossary view and the tooltip engine — a single source of truth. */
var G = SL.gloss = {
  list: {
    'Aliasing': ['The appearance of a false low-frequency component when a signal is sampled below the Nyquist rate. Spectral replicas of the sampled signal overlap and fold on top of each other, so the high-frequency information is irrecoverably lost.', 'aliasing, foldover distortion'],
    'Analog transmission': ['Transmission of a continuously varying (non-discrete) signal. Every noise perturbation is permanently baked into the signal, so it can be amplified but never removed.', 'analog signal'],
    'Digital transmission': ['Transmission of information as a finite set of discrete symbols. Because the receiver makes decisions at a threshold and re-emits clean symbols, accumulated noise does not propagate down the link.', 'digital signal'],
    'Decision threshold': ['The amplitude boundary a receiver uses to decide which symbol was transmitted. Noise pushes the sample across the threshold and causes a decision error.', 'threshold'],
    'Regenerative repeater': ['A repeater that re-quantises and re-times a digital signal, restoring it to its clean nominal levels. It removes accumulated noise instead of amplifying it.', 'regeneration'],
    'Multiplexing': ['Sharing one transmission channel between several independent sources by interleaving them in time, frequency or code.', 'TDM, FDM, CDM'],
    'Band-limiting': ['Restricting a signal to a finite highest frequency so that it satisfies the conditions of the sampling theorem.', 'band-limited'],
    'Nyquist rate': ['The theoretical minimum sampling rate, $f_s \\geq 2f_{max}$, equal to twice the highest frequency present in the input.', 'samples/s'],
    'Nyquist frequency': ['One half of the sampling frequency, $f_s/2$. Frequencies above it alias.', 'Hz'],
    'Sampling theorem': ['Nyquist–Shannon theorem: a band-limited signal with highest frequency $f_{max}$ can be reconstructed exactly from samples taken at $f_s \\geq 2f_{max}$.', 'Shannon'],
    'Anti-aliasing filter': ['A low-pass filter placed before the sampler that removes energy above $f_s/2$. It must be ideal in theory and steep in practice.', 'anti-aliasing'],
    'Reconstruction filter': ['The low-pass filter after the DAC that removes the spectral images introduced by the sampling process and returns the signal to baseband.', 'reconstruction LPF'],
    'Natural sampling': ['Sampling where each sample equals the instantaneous value of the input at the sampling instant. Ideal, but requires an infinitely fast switch.', 'natural sampling'],
    'Flat-top sampling': ['Sampling with a finite-width switching pulse so the sample is the average of the input over the aperture interval. Practically achievable; introduces droop and aperture distortion.', 'flat-top, sample-and-hold'],
    'Aperture time': ['The time during which the sampling switch stays closed and the sample is being acquired. The input changing during this time causes aperture distortion.', '$t_a$'],
    'Acquisition time': ['The time a sample-and-hold needs to settle to the required accuracy after the switch closes. It sets the maximum achievable sample rate.', '$t_{acq}$'],
    'Conversion time': ['The time an ADC or DAC needs to complete one conversion.', '$t_{conv}$'],
    'Droop': ['The decay of a held sample caused by leakage resistance and stray capacitance in the hold circuit. In flat-top sampling it produces a systematic error that grows with $f_{in}$.', 'droop distortion'],
    'Aperture distortion': ['The error produced because the input changed during the aperture interval, so the held value is an average rather than the instantaneous value.', 'aperture effect'],
    'PAM': ['Pulse Amplitude Modulation: a carrier train in which the amplitude of each pulse carries the sample. PAM alone is an analog pulse modulation, not a code.', 'pulse amplitude modulation'],
    'PWM': ['Pulse Width Modulation (also called Pulse Duration Modulation): the information is carried by the duration of each pulse.', 'pulse width / PDM'],
    'PPM': ['Pulse Position Modulation (also called Pulse Time Modulation): the information is carried by the time position of each pulse within the symbol period.', 'pulse position / PLM'],
    'PCM': ['Pulse Code Modulation: sampling followed by quantisation and binary encoding, producing a digital bitstream rather than a pulse-amplitude sequence.', 'pulse code modulation'],
    'SNR': ['Signal-to-Noise Ratio: the ratio of wanted signal power to noise power, usually expressed in decibels as $10\\log_{10}(P_s/P_n)$.', 'signal-to-noise ratio'],
    'BER': ['Bit Error Rate: the probability that a transmitted bit is decided incorrectly, measured empirically as errors divided by total bits.', 'bit error rate'],
    'Quantisation': ['Mapping a continuous sample amplitude onto one of $L$ discrete levels. The difference between the sample and its level is the quantisation error.', 'quantisation, quantization'],
    'Quantisation noise': ['The sum of all individual quantisation errors. Usually modelled as additive white noise when many samples contribute.', 'quantisation error'],
    'Resolution': ['The smallest amplitude step the quantiser can represent, $V_{LSB}$. More bits means a smaller step and better resolution.', 'resolution'],
    'Midrise quantiser': ['A uniform quantiser whose transition levels sit at the midpoints between output levels, including one at zero. One output level equals zero exactly.', 'midrise'],
    'Midtread quantiser': ['A uniform quantiser with an output level at zero and no transition there. Dead zone around zero — useful when the signal spends time near zero.', 'midtread'],
    'Saturation': ['A condition where the input exceeds the quantiser range and the output clips to the end levels, producing large, unrecoverable error.', 'overload, clipping'],
    'Companding': ['Compressing the signal with a non-linear law before quantisation and expanding it afterwards, so fine resolution is spent where signal energy is highest.', 'compression / expansion'],
    'μ-law': ['A logarithmic companding law, $F(x)=\\frac{\\ln(1+\\mu|x|)}{\\ln(1+\\mu)}$, normalised so the domain $[-1,1]$ maps onto $[-1,1]$. Used with $\\mu=255$ in ITU-T G.711.', 'mu-law'],
    'A-law': ['The piecewise logarithmic companding law used in ITU-T G.711 A-law, with a leading-segment linear region and log compression beyond it.', 'A-law'],
    'DPCM': ['Differential Pulse Code Modulation: encodes the prediction error between the current sample and a prediction made from previous reconstructed samples.', 'differential PCM'],
    'ADPCM': ['Adaptive DPCM: adapts the predictor and/or step size to the local signal statistics to improve quality at a given bit rate.', 'adaptive DPCM'],
    'Delta modulation': ['One-bit differential encoding where each bit simply says "step up" or "step down". The decoder integrates those steps to build a staircase approximation.', 'DM'],
    'Slope overload': ['Distortion that occurs when the input changes faster than the DM staircase can follow, so the staircase lags behind the signal.', 'slope distortion'],
    'Granular noise': ['The small oscillatory error of a DM staircase when tracking a slow or constant signal. Smaller steps reduce it but risk slope overload.', 'granular noise'],
    'Sigma-delta modulation': ['A feedback system in which the input is integrated before a low-resolution quantiser, so quantisation error is noise-shaped away from the signal band.', 'ΣΔ'],
    'Noise shaping': ['Redistributing quantisation noise in frequency so that less of it falls inside the signal band. Oversampling alone does not achieve this.', 'noise shaping'],
    'Oversampling': ['Sampling far above the Nyquist rate so that the quantisation noise density spreads over a much wider band, and much of it can be filtered away.', 'OSR'],
    'Bit rate': ['Information rate in bits per second. $R_b = R_s\\log_2 M$ for a fixed-length mapping of $M$ symbols.', 'bps'],
    'Baud rate': ['Symbol rate — the number of signal units (symbols) per second, measured in baud. It equals the bit rate only for binary keying.', 'symbol rate'],
    'Bits per symbol': ['$\\log_2 M$, the number of bits conveyed by one symbol in an $M$-ary scheme.', 'bits/symbol'],
    'Constellation': ['The geometric arrangement of the possible symbols on the in-phase / quadrature plane, together with their bit labels.', 'constellation diagram'],
    'QAM': ['Quadrature Amplitude Modulation: combines amplitude and phase on two orthogonal carriers, giving square $M$-ary constellations such as 16- and 64-QAM.', 'quadrature amplitude modulation'],
    'Orthogonality': ['The property that subcarriers are arranged so their spectra overlap but sum to zero over a symbol interval, allowing simultaneous transmission with no mutual interference.', 'orthogonal'],
    'Cyclic prefix': ['A copy of the end of an OFDM symbol pasted to its start, making the channel effectively circular so that a simple FFT receiver removes multipath-induced ISI.', 'CP'],
    'Processing gain': ['The ratio of the spread bandwidth to the unspread data bandwidth — the apparent SNR improvement from spreading, before accounting for the extra noise power received.', 'spreading factor'],
    'DSSS': ['Direct Sequence Spread Spectrum: multiplying the data by a much faster pseudo-random chip sequence, spreading each bit over many chips.', 'direct sequence'],
    'FHSS': ['Frequency Hopping Spread Spectrum: hopping the carrier pseudo-randomly over a set of channels while the data rate stays fixed.', 'frequency hopping'],
    'Carrier': ['A high-frequency reference sinusoid used as the transport medium for a lower-frequency modulating signal.', 'carrier wave'],
    'Modulation index': ['For AM, $m = V_m/V_c$, the ratio of message amplitude to carrier amplitude. For FM, $\\beta = \\Delta f/f_m$, the deviation ratio.', 'modulation index'],
    'Sideband': ['A frequency component created by modulation, shifted from the carrier by $f_m$ for a single tone. AM produces upper and lower sidebands.', 'sideband'],
    'Frequency deviation': ['The peak deviation of instantaneous frequency from the carrier caused by the modulating signal, $\\Delta f$.', 'deviation'],
    'Overmodulation': ['AM operation with $m>1$, where the envelope pinches toward zero and the message phase is partly reversed — distortion.', 'overmodulation'],
    "Carson's rule": ['The engineering rule of thumb $BW \\approx 2(\\Delta f + f_{m,max})$ for the bandwidth of an FM signal.', "Carson's rule"],
    'Capture effect': ['In an FM limiter, when two signals arrive on the same channel the stronger one suppresses the weaker instead of them being summed as they would be in AM.', 'capture'],
    'Pre-emphasis': ['Boosting the high audio frequencies before FM transmission so the receiver can attenuate them, reducing high-frequency noise.', 'pre-emphasis'],
    'De-emphasis': ['Attenuating high audio frequencies in the FM receiver to undo pre-emphasis and reduce the high-frequency noise that was boosted.', 'de-emphasis'],
    'Superheterodyne': ['A receiver that converts the incoming RF signal to a fixed intermediate frequency, then does all the selective filtering at that one frequency.', 'heterodyne'],
    'Image frequency': ['An unwanted RF frequency that, when mixed with the local oscillator, produces the same intermediate frequency as the desired signal.', 'image'],
    'Hamming distance': ['The number of bit positions in which two codewords differ. A code can correct $\\lfloor (d_{min}-1)/2 \\rfloor$ errors and detect $d_{min}-1$.', '$d_{min}$'],
    'Redundancy': ['Extra information added to a message so that errors can later be detected or corrected.', 'redundancy'],
    'CRC': ['Cyclic Redundancy Check: a polynomial division over GF(2) that produces a remainder used as a systematic error-detection code.', 'cyclic redundancy check'],
    'FEC': ['Forward Error Correction: adding controlled redundancy so the receiver corrects errors without asking for retransmission.', 'forward error correction'],
    'ARQ': ['Automatic Repeat reQuest: a feedback protocol where the receiver requests retransmission of blocks it cannot accept.', 'repeat reQuest'],
    'Stop-and-Wait ARQ': ['The simplest ARQ: send one block, then wait for an acknowledgement or timeout before sending the next.', 'stop-and-wait'],
    'Go-Back-N ARQ': ['Sliding-window ARQ that discards the received block on any error and retransmits from the errored block onward.', 'GBN'],
    'Selective Repeat ARQ': ['Sliding-window ARQ that buffers correctly received out-of-order blocks and retransmits only those that were lost.', 'SR'],
    'Interleaving': ['Rearranging transmitted symbols so a burst error is spread into separated single errors after de-interleaving. Interleaving redistributes errors; the code detects or corrects them.', 'interleave'],
    'Convolutional code': ['A memoryless block-free code where a shift register produces $n$ output bits from $k$ input bits; decoded by Viterbi.', 'convolutional'],
    'Reed–Solomon code': ['A block code over GF(2^r) that corrects whole symbol bursts. Strongest near the beginning of the codeword.', 'RS'],
    'Turbo code': ['Two or more convolutional codes in parallel or serial with an interleaver, approaching the Shannon limit at the cost of heavy iterative decoding.', 'turbo'],
    'LDPC code': ['A sparse parity-check code decoded by belief propagation. Near-Shannon-limit performance with high parallelism.', 'low-density parity-check']
  },
  has: function (t) { return Object.prototype.hasOwnProperty.call(G.list, t); },
  def: function (t) { return G.list[t] ? G.list[t][0] : null; },
  unit: function (t) { return G.list[t] ? G.list[t][1] : ''; }
};

/* Rich-text renderer: **bold**, `code`, $inline math$, {{glossary term}}. */
SL.rich = function (str) {
  if (str == null) return '';
  var holds = [];
  var s = String(str);
  s = s.replace(/\$([^$]+)\$/g, function (_, tex) {
    holds.push(tex);
    return '\u0000' + (holds.length - 1) + '\u0000';
  });
  s = esc(s);
  s = s.replace(/\{\{([^{}]+)\}\}/g, function (_, t) {
    var name = t.trim();
    if (!G.has(name)) return esc(name);
    return '<button type="button" class="term" data-term="' + attr(name) + '" aria-label="Definition of ' + attr(name) + '">' + esc(name) + '</button>';
  });
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/\u0000(\d+)\u0000/g, function (_, i) {
    var tex = holds[+i];
    return '<span class="m-inline" data-tex="' + attr(tex) + '">' + esc(SL.mathPlain(tex)) + '</span>';
  });
  return s;
};
/* Rough plain-text maths used as KaTeX fallback and for copy buttons. */
SL.mathPlain = function (tex) {
  return String(tex)
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\log_{10}|\\log10/g, 'log10')
    .replace(/\\ln/g, 'ln')
    .replace(/\\mu/g, 'µ').replace(/\\Delta/g, 'Δ').replace(/\\beta/g, 'β')
    .replace(/\\geq/g, '>=').replace(/\\le\b|\\leq/g, '<=').replace(/\\approx/g, '≈')
    .replace(/\\times/g, '×').replace(/\\pm/g, '±').replace(/\s+/g, ' ');
};
SL.renderMath = function (root) {
  if (!root) return;
  var on$ = SL.store.get().prefs.katex !== false && window.katex;
  if (!on$) return;                                  // plain-text spans already visible
  $$('.m-inline', root).forEach(function (n) {
    if (n.dataset.done === '1') return;
    try { window.katex.render(n.dataset.tex, n, { throwOnError: false, displayMode: false, output: 'html' }); n.dataset.done = '1'; }
    catch (e) { /* keep plain text */ }
  });
  $$('[data-display-tex]', root).forEach(function (n) {
    if (n.dataset.done === '1') return;
    try { window.katex.render(n.dataset.displayTex, n, { throwOnError: false, displayMode: true, output: 'html' }); n.dataset.done = '1'; }
    catch (e) { }
  });
};

/* --------------------------------------------------------- tooltip engine
   Works on hover, keyboard focus and touch (tap). aria-describedby wiring. */
(function () {
  var tipEl = null, cur = null, hideT = null;
  function show(node) {
    var key = node.getAttribute('data-term');
    if (!key || !G.has(key)) return;
    tipEl = tipEl || $('#tip');
    tipEl.innerHTML = '<b>' + esc(key) + '</b>' + G.def(key) + (G.unit(key) ? '<span class="tu">' + esc(G.unit(key)) + '</span>' : '');
    tipEl.setAttribute('aria-hidden', 'false');
    var r = node.getBoundingClientRect();
    tipEl.style.visibility = 'hidden';
    tipEl.classList.add('show');
    var tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
    var left = r.left + r.width / 2 - tw / 2;
    left = U.clamp(left, 10, window.innerWidth - tw - 10);
    var top = r.bottom + 9;
    if (top + th > window.innerHeight - 10) top = Math.max(10, r.top - th - 9);
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
    tipEl.style.visibility = 'visible';
    cur = node;
  }
  function hide() {
    if (tipEl) { tipEl.classList.remove('show'); tipEl.setAttribute('aria-hidden', 'true'); }
    if (cur) cur.removeAttribute('aria-describedby');
    cur = null;
  }
  SL.tip = { show: show, hide: hide };
  document.addEventListener('mouseover', function (e) {
    var n = e.target.closest && e.target.closest('.term, .gloss-item');
    if (!n) { if (cur) hide(); return; }
    clearTimeout(hideT); show(n);
  });
  document.addEventListener('mouseout', function (e) {
    var n = e.target.closest && e.target.closest('.term, .gloss-item');
    if (n) { hideT = setTimeout(hide, 120); }
  });
  document.addEventListener('focusin', function (e) {
    var n = e.target.closest && e.target.closest('.term');
    if (n) show(n); else if (cur) hide();
  });
  document.addEventListener('focusout', function () { hide(); });
  document.addEventListener('click', function (e) {
    var n = e.target.closest && e.target.closest('.term');
    if (n) { e.preventDefault(); show(n); if (!tipEl) tipEl = $('#tip'); clearTimeout(hideT); hideT = setTimeout(hide, 6000); }
  });
  window.addEventListener('scroll', function () { if (cur) hide(); }, true);
  window.addEventListener('resize', hide);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });
})();