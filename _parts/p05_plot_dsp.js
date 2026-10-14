/* =========================================================================
   SL.plot — canvas plotting engine
   One engine, reused by every laboratory. Handles DPI scaling, axes, units,
   ticks, grid, legend and per-series styling. Every plot carries a title,
   labelled axes with units, and a legend whenever more than one series exists.
   ========================================================================= */
SL.colors = (function () {
  var c = {
    cyan: '#00F0FF', mag: '#FF00AA', yel: '#FFD700', grn: '#34D399',
    pur: '#A78BFA', org: '#FF8A3D', red: '#FF5C7A', blue: '#4FA8FF',
    grey: '#7C90AC', grid: 'rgba(125,165,225,.13)', axis: 'rgba(180,205,240,.45)',
    txt: '#9DB2D0', txt2: '#6C819F'
  };
  function theme() {
    var light = document.documentElement.getAttribute('data-theme') === 'light';
    c.grid = light ? 'rgba(15,50,100,.13)' : 'rgba(125,165,225,.13)';
    c.axis = light ? 'rgba(15,50,100,.42)' : 'rgba(180,205,240,.45)';
    c.txt = light ? '#3E5673' : '#9DB2D0';
    c.txt2 = light ? '#657A96' : '#6C819F';
    if (light) {
      c.cyan = '#0088A0'; c.mag = '#C40083'; c.yel = '#9A7B00'; c.grn = '#0E9C6C';
      c.pur = '#6B3BD1'; c.org = '#C05A12'; c.red = '#C31130'; c.blue = '#1667C4'; c.grey = '#657A96';
    } else {
      c.cyan = '#00F0FF'; c.mag = '#FF00AA'; c.yel = '#FFD700'; c.grn = '#34D399';
      c.pur = '#A78BFA'; c.org = '#FF8A3D'; c.red = '#FF5C7A'; c.blue = '#4FA8FF'; c.grey = '#7C90AC';
    }
    return c;
  }
  c.theme = theme;
  return c;
})();

SL.plot = (function () {
  var registry = [];   // live canvases for theme/DPI re-render

  function sizeCanvas(cv, hCss) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = cv.clientWidth || 320;
    var h = hCss || Math.round(w * 0.5);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    return { w: w, h: h, dpr: dpr };
  }

  function begin(cv, opt) {
    opt = opt || {};
    var C = SL.colors.theme();
    var sz = sizeCanvas(cv, opt.height);
    var ctx = cv.getContext('2d');
    ctx.setTransform(sz.dpr, 0, 0, sz.dpr, 0, 0);
    ctx.clearRect(0, 0, sz.w, sz.h);

    var compact = opt.compact || sz.w < 380;
    var padL = opt.padL != null ? opt.padL : (compact ? 40 : 52);
    var padR = opt.padR != null ? opt.padR : 12;
    var padT = opt.padT != null ? opt.padT : (opt.title ? (compact ? 18 : 22) : 12);
    var padB = opt.padB != null ? opt.padB : (compact ? 30 : 34);
    var x0 = padL, y0 = padT, pw = Math.max(20, sz.w - padL - padR), ph = Math.max(20, sz.h - padT - padB);

    var xd = opt.xDomain || [0, 1], yd = opt.yDomain || [-1, 1];
    var X = function (v) { return x0 + (v - xd[0]) / (xd[1] - xd[0] || 1) * pw; };
    var Y = function (v) { return y0 + ph - (v - yd[0]) / (yd[1] - yd[0] || 1) * ph; };
    var invX = function (p) { return xd[0] + (p - x0) / pw * (xd[1] - xd[0]); };

    var p = {
      ctx: ctx, w: sz.w, h: sz.h, C: C, X: X, Y: Y, invX: invX, xd: xd, yd: yd,
      box: { x: x0, y: y0, w: pw, h: ph }, series: [], cv: cv, opt: opt
    };

    if (opt.bg !== false) {
      var g = ctx.createLinearGradient(0, 0, 0, sz.h);
      g.addColorStop(0, 'rgba(255,255,255,.025)'); g.addColorStop(1, 'rgba(0,0,0,.05)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, sz.w, sz.h);
    }
    if (opt.title) {
      ctx.fillStyle = C.txt; ctx.font = '600 ' + (compact ? 10.5 : 11.5) + 'px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(opt.title, x0, 4);
    }
    return p;
  }

  function niceStep(range, target) {
    var raw = range / Math.max(1, target);
    var mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    var n = raw / mag;
    var step = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
    return step * mag;
  }
  function fmtTick(v, step) {
    var a = Math.abs(v);
    if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(1).replace('e+', 'e').replace('e-', 'e-');
    var dec = step ? Math.max(0, Math.min(5, -Math.floor(Math.log10(step)) + (step < 1 ? 0 : 0))) : 3;
    return v.toFixed(dec);
  }

  p.grid = function (xTicks, yTicks) {
    var ctx = p.ctx, C = p.C;
    var xs = xTicks || niceStep(p.xd[1] - p.xd[0], p.w < 380 ? 4 : 7);
    var ys = yTicks || niceStep(p.yd[1] - p.yd[0], p.h < 200 ? 3 : 5);
    ctx.save();
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.setLineDash([]);
    var v;
    ctx.font = '9.5px "JetBrains Mono", monospace'; ctx.fillStyle = C.txt2;
    for (v = Math.ceil(p.xd[0] / xs) * xs; v <= p.xd[1] + 1e-9; v += xs) {
      var x = Math.round(p.X(v)) + .5;
      ctx.beginPath(); ctx.moveTo(x, p.box.y); ctx.lineTo(x, p.box.y + p.box.h); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(fmtTick(v, xs), x, p.box.y + p.box.h + 5);
    }
    for (v = Math.ceil(p.yd[0] / ys) * ys; v <= p.yd[1] + 1e-9; v += ys) {
      var y = Math.round(p.Y(v)) + .5;
      ctx.beginPath(); ctx.moveTo(p.box.x, y); ctx.lineTo(p.box.x + p.box.w, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(fmtTick(v, ys), p.box.x - 5, y);
    }
    ctx.restore();
    return p;
  }

  p.axes = function () {
    var ctx = p.ctx, C = p.C, o = p.opt;
    ctx.save();
    ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
    // y axis
    ctx.beginPath();
    ctx.moveTo(p.box.x + .5, p.box.y); ctx.lineTo(p.box.x + .5, p.box.y + p.box.h); ctx.stroke();
    // x axis (at y=0 if in range, otherwise at the bottom)
    var zy = p.yd[0] <= 0 && p.yd[1] >= 0 ? Math.round(p.Y(0)) + .5 : p.box.y + p.box.h + .5;
    ctx.beginPath(); ctx.moveTo(p.box.x, zy); ctx.lineTo(p.box.x + p.box.w, zy); ctx.stroke();
    var fs = p.w < 380 ? 9 : 10;
    ctx.fillStyle = C.txt2; ctx.font = fs + 'px Inter, system-ui, sans-serif';
    if (o.xLabel) { ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(o.xLabel, p.box.x + p.box.w, p.h - 2); }
    if (o.yLabel) {
      ctx.save();
      ctx.translate(o.xLabel ? 10 : 9, p.box.y + 2);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(o.yLabel, 0, 0);
      ctx.restore();
    }
    if (o.xZero !== false && p.yd[0] <= 0 && p.yd[1] >= 0) { /* zero line already drawn */ }
    ctx.restore();
    return p;
  };


  p.band = function (p, xa, xb, color, alpha) {
    var ctx = p.ctx; ctx.save();
    ctx.globalAlpha = alpha == null ? .12 : alpha; ctx.fillStyle = color;
    var a = p.X(U.clamp(xa, p.xd[0], p.xd[1])), b = p.X(U.clamp(xb, p.xd[0], p.xd[1]));
    ctx.fillRect(Math.min(a, b), p.box.y, Math.abs(b - a), p.box.h);
    ctx.restore(); return p;
  };

  p.vline = function (p, x, o) {
    o = o || {};
    var ctx = p.ctx, px = Math.round(p.X(x)) + .5;
    ctx.save(); ctx.beginPath(); ctx.rect(p.box.x, p.box.y, p.box.w, p.box.h); ctx.clip();
    ctx.strokeStyle = o.color || p.C.grey; ctx.lineWidth = o.width || 1;
    ctx.setLineDash(o.dash || [3, 3]);
    ctx.beginPath(); ctx.moveTo(px, p.box.y); ctx.lineTo(px, p.box.y + p.box.h); ctx.stroke();
    ctx.restore();
    if (o.label) {
      ctx.save(); ctx.fillStyle = o.color || p.C.grey; ctx.font = (p.w < 380 ? 8.5 : 9.5) + 'px "JetBrains Mono", monospace';
      ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
      var tx = o.align === 'right' ? px - 4 : px + 4;
      ctx.fillText(o.label, tx, p.box.y + (o.labelY || 3));
      ctx.restore();
    }
    return p;
  };
  p.hline = function (p, y, o) {
    o = o || {};
    var ctx = p.ctx, py = Math.round(p.Y(y)) + .5;
    ctx.save(); ctx.beginPath(); ctx.rect(p.box.x, p.box.y, p.box.w, p.box.h); ctx.clip();
    ctx.strokeStyle = o.color || p.C.grey; ctx.lineWidth = o.width || 1;
    ctx.setLineDash(o.dash || [3, 3]);
    ctx.beginPath(); ctx.moveTo(p.box.x, py); ctx.lineTo(p.box.x + p.box.w, py); ctx.stroke();
    ctx.restore();
    if (o.label) {
      ctx.save(); ctx.fillStyle = o.color || p.C.grey; ctx.font = (p.w < 380 ? 8.5 : 9.5) + 'px "JetBrains Mono", monospace';
      ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'bottom';
      ctx.fillText(o.label, p.box.x + (o.labelX == null ? 4 : o.labelX), py - (o.below ? -3 : 3));
      ctx.restore();
    }
    return p;
  };

  p.line = function (p, xs, ys, o) {
    o = o || {};
    var ctx = p.ctx, n = Math.min(xs.length, ys.length), i;
    ctx.save();
    ctx.strokeStyle = o.color || p.C.cyan;
    ctx.lineWidth = o.width || 1.6;
    ctx.setLineDash(o.dash || []);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      var X = p.X(xs[i]), Y = p.Y(ys[i]);
      if (i === 0) ctx.moveTo(X, Y);
      else {
        if (o.clipX && (xs[i] < p.xd[0] - 1e-9 || xs[i] > p.xd[1] + 1e-9)) { ctx.stroke(); ctx.beginPath(); ctx.moveTo(X, Y); }
        else ctx.lineTo(X, Y);
      }
    }
    ctx.stroke();
    ctx.restore();
    if (o.label) p.series.push({ label: o.label, color: o.color || p.C.cyan, dash: o.dash || [], width: o.width || 1.6 });
    return p;
  };

  /* Staircase trace — used for DM reconstruction and sample-and-hold output. */
  p.step = function (p, xs, ys, o) {
    o = o || {};
    var ctx = p.ctx, n = Math.min(xs.length, ys.length), i;
    ctx.save(); ctx.beginPath(); ctx.rect(p.box.x - 1, p.box.y, p.box.w + 2, p.box.h); ctx.clip();
    ctx.strokeStyle = o.color || p.C.yel; ctx.lineWidth = o.width || 1.7;
    ctx.setLineDash(o.dash || []); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
    ctx.beginPath();
    for (i = 0; i < n; i++) {
      var X = p.X(xs[i]), Y = p.Y(ys[i]);
      if (i === 0) ctx.moveTo(X, Y);
      else { ctx.lineTo(X, ys[i - 1] === undefined ? Y : p.Y(ys[i - 1])); ctx.lineTo(X, Y); }
    }
    ctx.stroke(); ctx.restore();
    if (o.label) p.series.push({ label: o.label, color: o.color || p.C.yel, dash: o.dash || [], width: o.width || 1.7 });
    return p;
  };

  p.area = function (p, xs, ys, o) {
    o = o || {};
    var ctx = p.ctx, n = Math.min(xs.length, ys.length), i;
    ctx.save(); ctx.beginPath();
    for (i = 0; i < n; i++) { var X = p.X(xs[i]), Y = p.Y(ys[i]); if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
    ctx.lineTo(p.X(xs[n - 1]), p.Y(o.base != null ? o.base : p.yd[0]));
    ctx.lineTo(p.X(xs[0]), p.Y(o.base != null ? o.base : p.yd[0]));
    ctx.closePath();
    ctx.fillStyle = o.color || p.C.cyan; ctx.globalAlpha = o.alpha == null ? .16 : o.alpha;
    ctx.fill(); ctx.restore(); return p;
  };

  p.points = function (p, xs, ys, o) {
    o = o || {};
    var ctx = p.ctx, i, r = o.size || 3.2, shape = o.shape || 'circle';
    ctx.save();
    ctx.fillStyle = o.color || p.C.yel; ctx.strokeStyle = o.stroke || '#0A0E1A'; ctx.lineWidth = 1;
    for (i = 0; i < Math.min(xs.length, ys.length); i++) {
      var X = p.X(xs[i]), Y = p.Y(ys[i]);
      if (X < p.box.x - 6 || X > p.box.x + p.box.w + 6 || Y < p.box.y - 6 || Y > p.box.y + p.box.h + 6) continue;
      ctx.beginPath();
      if (shape === 'square') ctx.rect(X - r, Y - r, 2 * r, 2 * r);
      else if (shape === 'diamond') { ctx.moveTo(X, Y - r * 1.25); ctx.lineTo(X + r * 1.25, Y); ctx.lineTo(X, Y + r * 1.25); ctx.lineTo(X - r * 1.25, Y); ctx.closePath(); }
      else if (shape === 'cross') { ctx.moveTo(X - r, Y); ctx.lineTo(X + r, Y); ctx.moveTo(X, Y - r); ctx.lineTo(X, Y + r); ctx.strokeStyle = o.color; ctx.lineWidth = o.width || 1.8; ctx.stroke(); continue; }
      else ctx.arc(X, Y, r, 0, 6.2832);
      ctx.fill();
      if (o.stroke !== null && shape !== 'cross') { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1; ctx.stroke(); }
    }
    ctx.restore();
    if (o.label) p.series.push({ label: o.label, color: o.color || p.C.yel, marker: shape });
    return p;
  };

  p.text = function (p, x, y, str, o) {
    o = o || {};
    var ctx = p.ctx;
    ctx.save();
    ctx.fillStyle = o.color || p.C.txt; ctx.font = (o.size || 9.5) + 'px ' + (o.mono ? '"JetBrains Mono", monospace' : 'Inter, system-ui, sans-serif');
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'top';
    if (o.bg) {
      var wpx = ctx.measureText(str).width;
      ctx.fillStyle = o.bg; ctx.globalAlpha = o.bgAlpha == null ? .8 : o.bgAlpha;
      ctx.fillRect(o.align === 'right' ? p.X(x) - wpx - 4 : p.X(x) - 4, p.Y(y) - 9, wpx + 8, 13);
      ctx.globalAlpha = 1; ctx.fillStyle = o.color || p.C.txt;
    }
    ctx.fillText(str, p.X(x), p.Y(y));
    ctx.restore(); return p;
  };

  p.label = function (p, x, y, str, o) {   // pixel-space label (legend entries, notes)
    o = o || {};
    var ctx = p.ctx;
    ctx.save(); ctx.fillStyle = o.color || p.C.txt;
    ctx.font = (o.size || 9) + 'px Inter, system-ui, sans-serif';
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.top === false ? 'bottom' : 'top';
    ctx.fillText(str, x, y); ctx.restore(); return p;
  };

  p.bits = function (p, xs, bits, o) {     // digital ribbon along the bottom of a waveform plot
    o = o || {};
    var ctx = p.ctx, w = p.box.w / xs.length, i;
    var yT = p.box.y + p.box.h, hh = Math.min(13, p.box.h * .22);
    ctx.save();
    for (i = 0; i < bits.length; i++) {
      var X = p.box.x + i * w;
      ctx.fillStyle = bits[i] ? (o.c1 || p.C.cyan) : (o.c0 || p.C.txt2);
      ctx.globalAlpha = bits[i] ? .85 : .4;
      ctx.fillRect(X, yT - hh, w, hh);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.C.txt2; ctx.font = '8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(o.label || 'bits', p.box.x + 2, yT - hh - 10);
    ctx.restore();
    if (o.seriesLabel) p.series.push({ label: o.seriesLabel, color: o.c1 || p.C.cyan });
    return p;
  };

  /* Legend — distinguishes colour AND dash/marker so it stays readable. */
  p.legend = function (p, pos) {
    if (p.series.length < 1) return p;
    var ctx = p.ctx, i, fs = p.w < 380 ? 8.5 : 9.5;
    ctx.save(); ctx.font = fs + 'px Inter, system-ui, sans-serif';
    var maxW = 0;
    for (i = 0; i < p.series.length; i++) maxW = Math.max(maxW, ctx.measureText(p.series[i].label).width);
    var rowH = fs + 8, padX = 8;
    var boxW = maxW + 44, boxH = p.series.length * rowH + 10;
    var bx, by;
    var where = pos || 'tr';
    if (where === 'tl') { bx = p.box.x + 6; by = p.box.y + 6; }
    else if (where === 'bl') { bx = p.box.x + 6; by = p.box.y + p.box.h - boxH - 6; }
    else if (where === 'br') { bx = p.box.x + p.box.w - boxW - 6; by = p.box.y + p.box.h - boxH - 6; }
    else { bx = p.box.x + p.box.w - boxW - 6; by = p.box.y + 6; }
    ctx.globalAlpha = .82; ctx.fillStyle = '#0A0E1A';
    ctx.fillRect(bx, by, boxW, boxH); ctx.globalAlpha = 1;
    ctx.strokeStyle = p.C.grid; ctx.lineWidth = 1; ctx.strokeRect(bx + .5, by + .5, boxW - 1, boxH - 1);
    for (i = 0; i < p.series.length; i++) {
      var s = p.series[i], ly = by + 6 + i * rowH + rowH / 2;
      ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 1.8; ctx.setLineDash(s.dash || []);
      ctx.beginPath(); ctx.moveTo(bx + 7, ly); ctx.lineTo(bx + 21, ly); ctx.stroke(); ctx.setLineDash([]);
      if (s.marker) {
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(bx + 14, ly, 2.6, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = p.C.txt; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(s.label, bx + 26, ly);
    }
    ctx.restore();
    return p;
  };

  p.hit = function (p, px, py) { return px >= p.box.x && px <= p.box.x + p.box.w && py >= p.box.y && py <= p.box.y + p.box.h; };

  p.begin = begin;
  p.register = function (cv, redraw) {
    registry.push({ cv: cv, fn: redraw });
    if (!p._ro) {
      p._ro = true;
      var lastW = 0;
      window.addEventListener('resize', U.debounce(function () { registry.forEach(function (r) { try { r.fn(); } catch (e) { } }); }, 160));
      document.addEventListener('sl-theme', function () { registry.forEach(function (r) { try { r.fn(); } catch (e) { } }); });
    }
  };
  p.unregister = function (cv) { registry = registry.filter(function (r) { return r.cv !== cv; }); };
  p.clearRegistry = function () { registry = []; };
  return p;
})();
var P = SL.plot;

/* =========================================================================
   SL.dsp — deterministic signal-processing primitives
   Every function below is pure: same inputs → same outputs, always.
   ========================================================================= */
var D = SL.dsp = {};
D.TAU = Math.PI * 2;

/* --- basic signals --- */
D.sin = function (f, t) { return Math.sin(D.TAU * f * t); };
D.cw = function (fc, phi) { return Math.cos(D.TAU * fc + (phi || 0)); };

/* --- sampling --- */
D.sampleIndices = function (dur, fs) { var n = Math.floor(dur * fs); var a = []; for (var i = 0; i <= n; i++) a.push(i); return a; };
D.sample = function (sigFn, dur, fs) {
  return D.sampleIndices(dur, fs).map(function (i) { return { t: i / fs, v: sigFn(i / fs) }; });
};
/* Ideal sinc (Whittaker–Shannon) interpolation. Exact only when the signal is
   band-limited to <= fs/2; the lesson states that limitation explicitly. */
D.reconstruct = function (samples, tArr, fs) {
  var T = samples.map(function (s) { return s.v; });
  return tArr.map(function (t) {
    var acc = 0;
    for (var k = 0; k < T.length; k++) {
      var x = (t - k / fs) * fs;
      acc += T[k] * (x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x));
    }
    return acc;
  });
};
D.zeroOrderHold = function (samples, tArr, fs) {
  return tArr.map(function (t) {
    var k = Math.floor(t * fs + 1e-9);
    if (k < 0) k = 0;
    if (k >= samples.length) k = samples.length - 1;
    return samples[k].v;
  });
};
D.linearHold = function (samples, tArr, fs) {
  return tArr.map(function (t) {
    var x = t * fs, k = Math.floor(x + 1e-9), a = x - k;
    k = U.clamp(k, 0, samples.length - 1); var k2 = U.clamp(k + 1, 0, samples.length - 1);
    return samples[k].v * (1 - a) + samples[k2].v * a;
  });
};

/* --- quantisation --- */
/* Uniform quantisation of a bipolar signal over a full-scale range V_FSR.
   Step size:  V_LSB = V_FSR / L,  L = 2^m.   (The "step = range / levels"
   convention: the m bits *address* L levels.)
   midrise : output levels sit at the interval mid-points, vmin + (i+0.5)V_LSB
             -> no output level is exactly zero.
   midtread: output levels sit at vmin + i·V_LSB
             -> one output level is exactly zero (dead zone at the origin).
   Both clip (saturate) outside the representable range.                       */
D.VLSB = function (vfsr, m) { return vfsr / Math.pow(2, m); };
D.quantIndex = function (x, vfsr, m) {
  var L = Math.pow(2, m), q = D.VLSB(vfsr, m), vmin = -vfsr / 2;
  return U.clamp(Math.round((x - vmin) / q - 0.5), 0, L - 1);
};
D.quantValue = function (idx, vfsr, m, kind) {
  var q = D.VLSB(vfsr, m), vmin = -vfsr / 2;
  return kind === 'midtread' ? vmin + idx * q : vmin + (idx + 0.5) * q;
};
D.quantize = function (x, vfsr, m, kind) {
  return D.quantValue(D.quantIndex(x, vfsr, m), vfsr, m, kind);
};
/* Sign-magnitude natural-binary coding (the classic telephony arrangement):
   code = 1 sign bit (1 = negative) followed by (m-1) magnitude bits.
   code 1-magnitude is the "negative zero" slot, so 2^(m-1) magnitudes are
   addressable per polarity.                                                */
D.signMagCode = function (x, vfsr, m, kind) {
  var L = Math.pow(2, m), q = D.VLSB(vfsr, m), vmin = -vfsr / 2, K = L / 2;
  var idx = D.quantIndex(x, vfsr, m);
  var neg = idx < K;
  var mag = neg ? (K - 1 - idx) : (idx - K);         // 0 .. K-1
  return {
    n: idx, neg: neg, mag: mag,
    sign: neg ? 1 : 0,
    bits: (neg ? '1' : '0') + U.toBin(mag, m - 1),
    value: D.quantValue(idx, vfsr, m, kind),
    error: x - D.quantValue(idx, vfsr, m, kind)
  };
};
/* Folded binary (two's-complement style) natural code for comparison. */
D.foldedCode = function (x, vfsr, m) {
  var L = Math.pow(2, m), q = D.VLSB(vfsr, m), vmin = -vfsr / 2;
  var idx = D.quantIndex(x, vfsr, m);
  return { n: idx, bits: U.toBin(idx, m), value: vmin + (idx + 0.5) * q };
};
D.sqnrFullScale = function (m) { return 6.0206 * m + 1.7609; };

/* --- companding --- */
/* μ-law transfer: domain [-1,1] -> [-1,1]. */
D.muLaw = function (x, mu) { var a = Math.abs(U.clamp(x, -1, 1)); return Math.sign(x) * Math.log(1 + mu * a) / Math.log(1 + mu); };
D.muLawInv = function (y, mu) { var s = Math.sign(y), a = Math.abs(U.clamp(y, -1, 1)); return s * ((Math.exp(a * Math.log(1 + mu)) - 1) / mu); };
D.muLawDB = function (a) { return 20 * Math.log10(Math.log(1 + 255 * a) / Math.log(1 + 255)); };
/* A-law: linear region |x| <= 1/16 then log compression, piecewise (G.711). */
D.aLaw = function (x) {
  var s = Math.sign(x), a = Math.abs(U.clamp(x, -1, 1)), A = 87.7;
  if (a < 1 / 16) return s * (A * a);
  return s * (1 + Math.log(A * a)) / (1 + Math.log(A));
};
D.aLawInv = function (y) {
  var s = Math.sign(y), a = Math.abs(U.clamp(y, -1, 1)), A = 87.7;
  if (a <= 1 / 16) return s * (a / A);
  return s * (Math.exp((a * (1 + Math.log(A)) - 1)) / A);
};
D.dB = function (v) { return 20 * Math.log10(Math.max(v, 1e-9)); };

/* --- delta modulation --- */
D.deltaMod = function (sig, fs, dur, step) {
  var n = Math.round(dur * fs), bits = [], recon = [], prev = 0, t = [];
  for (var i = 0; i <= n; i++) {
    var ti = i / fs, x = sig(ti);
    var b = x > prev ? 1 : 0;          // documented tie rule: equal -> 0 (no step up)
    bits.push(b);
    prev = U.clamp(prev + (b ? step : -step), -4, 4);
    t.push(ti); recon.push(prev);
  }
  return { bits: bits, recon: recon, t: t };
};

/* --- first-order sigma-delta --- */
D.sigmaDelta = function (sig, fs, dur, osr) {
  var Fs = fs * osr, n = Math.round(dur * Fs), intg = 0, bits = [], t = [], out = [], quant = 1;
  for (var i = 0; i <= n; i++) {
    var ti = i / Fs;
    intg += sig(ti) - quant;
    quant = intg > 0 ? 1 : -1;          // 1-bit quantiser with sign feedback
    bits.push(quant > 0 ? 1 : 0);
    t.push(ti); out.push(quant);
  }
  return { bits: bits, t: t, out: out, Fs: Fs };
};

/* --- DPCM (toy codec, documented: first-order predictor + uniform quantiser) */
D.dpcmEncode = function (samples, m, vmax) {
  var q = D.VLSB(2 * vmax, m), bits = [], dif = [], recon = [], pred = 0;
  for (var i = 0; i < samples.length; i++) {
    var e = U.clamp(samples[i] - pred, -q * Math.pow(2, m - 1), q * Math.pow(2, m - 1) - 1);
    var code = Math.round((e + q * Math.pow(2, m - 1)) / q);
    var d = code * q - q * Math.pow(2, m - 1);
    bits.push(code); dif.push(d); recon.push(pred + d); pred = pred + d;
  }
  return { code: bits, diff: dif, recon: recon, q: q };
};

/* --- analog modulation ---
   Conventional AM (DSB-FC, full carrier):  s(t) = V_c·(1 + m·sin(2πf_m t))
   with m = V_m / V_c.  m > 1 is overmodulation (envelope inversion).
   FM:  cos(2πf_c t + β·sin(2πf_m t))  with β = Δf/f_m.
   PM:  cos(2πf_c t + m_p·sin(2πf_m t)).                                */
D.fm = function (t, fc, fm, beta) { return Math.cos(D.TAU * fc * t + beta * Math.sin(D.TAU * fm * t)); };
D.pm = function (t, fc, fm, mp) { return Math.cos(D.TAU * fc * t + mp * Math.sin(D.TAU * fm * t)); };
D.amE = function (t, fm, m, Vc) { return (Vc == null ? 1 : Vc) * (1 + m * D.sin(fm, t)); };
/* Exact instantaneous frequency of a cosine, dφ/dt, used to prove that the FM
   waveform really carries β·f_m of peak deviation. */
D.fmInstFreq = function (t, fc, fm, beta) {
  var phi = D.TAU * fc * t + beta * Math.sin(D.TAU * fm * t);
  return fc + (beta * fm) * Math.cos(D.TAU * fm * t);
};
D.fmE = function (t, fc, fm, df) {
  var beta = fm === 0 ? 0 : df / fm;
  return D.fm(t, fc, fm, beta);
};
D.pmE = function (t, fc, fm, mp) { return D.pm(t, fc, fm, mp); };
D.amPower = function (Pc, m) { return Pc * (1 + m * m / 2); };   // carrier power Pc, unity load
D.carson = function (df, fm) { return 2 * (df + fm); };

/* --- digital passband --- */
/* Gray-coded square QAM (cross-QAM), widely used in practice. */
D.gray = function (n, k) { var g = n ^ (n >> 1), o = 0, m = 1 << (k - 1); while (m) { o ^= g & m; m >>= 1; } return o; };
D.ungray = function (g, k) { var b = g, i; for (i = 1; i < k; i++) b ^= g >> i; return b; };
D.mapSquareQAM = function (M) {
  /* returns {points:[{i,q,bits,label}], k, N} — Gray-coded square constellations */
  var sq = Math.round(Math.sqrt(M));
  if (sq * sq !== M || sq < 2) return null;
  var k = Math.log2(M);
  if (Math.abs(k - Math.round(k)) > 1e-9) return null;
  k = Math.round(k);
  var levels = [];
  for (var i = 0; i < sq; i++) {
    var g = D.gray(i, Math.log2(sq));
    levels.push(U.toBin(D.ungray(g, Math.round(Math.log2(sq))), Math.round(Math.log2(sq))));
  }
  var pts = [];
  for (var r = 0; r < sq; r++) for (var c = 0; c < sq; c++) {
    var gi = 2 * c - (sq - 1), gq = 2 * r - (sq - 1);
    var bits = levels[r] + levels[c];
    pts.push({ i: gi, q: gq, bits: bits, norm: { i: gi / ((sq - 1) / 2 || 1), q: gq / ((sq - 1) / 2 || 1) } });
  }
  return { points: pts, k: k, N: sq, type: 'QAM' };
};
D.mapPSK = function (M) {
  var k = Math.round(Math.log2(M));
  if (Math.pow(2, k) !== M) return null;
  var pts = [];
  for (var n = 0; n < M; n++) {
    var th = D.TAU * n / M;
    pts.push({ i: Math.cos(th), q: Math.sin(th), bits: U.toBin(n, k), norm: { i: Math.cos(th), q: Math.sin(th) } });
  }
  return { points: pts, k: k, type: 'PSK' };
};
D.mapASK = function () {
  return { points: [{ i: -1, q: 0, bits: '0', norm: { i: -1, q: 0 } }, { i: 1, q: 0, bits: '1', norm: { i: 1, q: 0 } }], k: 1, type: 'ASK' };
};
D.constellation = function (scheme, order) {
  switch (scheme) {
    case 'ASK': return D.mapASK();
    case 'PSK': return D.mapPSK(order || 2);
    case 'QAM': return D.mapSquareQAM(order || 4);
    default: return D.mapSquareQAM(order || 4);
  }
};

/* Waveform generation from a bit string.
   Each bit occupies exactly 1/R_s seconds. t[]/y[] are sampled uniformly
   across [0, bits.length/R_s). `base[]` is the underlying binary waveform. */
D.modulate = function (scheme, bits, rs, fc, opt) {
  opt = opt || {};
  var dur = bits.length / rs;
  var N = U.clamp(Math.round(dur * Math.max(rs * 120, 600)), 260, 2600);
  var t = [], wave = [], base = [], map = opt.map, mapIdx = null;
  if (map) { mapIdx = {}; map.points.forEach(function (p) { mapIdx[p.bits] = p; }); }
  var f1 = opt.f1, f0 = opt.f0;
  for (var i = 0; i <= N; i++) {
    var tt = i / N * dur;
    var k = Math.min(bits.length - 1, Math.max(0, Math.floor(tt * rs)));
    var bit = bits.charAt(k);
    var v = 0;
    if (scheme === 'ASK' || scheme === 'OOK') v = bit === '1' ? (opt.A1 == null ? 1 : opt.A1) : (opt.A0 == null ? 0 : opt.A0);
    else if (scheme === 'FSK') v = Math.cos(D.TAU * (bit === '1' ? f1 : f0) * tt);
    else if (scheme === 'BPSK') v = Math.cos(D.TAU * fc * tt + (bit === '1' ? 0 : Math.PI));
    else if (scheme === 'PSK' || scheme === 'QAM') {
      var off = k - (k % map.k);
      var grp = bits.substr(off, map.k);
      var p = mapIdx[grp];
      if (!p) {                                   // incomplete / unknown group -> nearest first symbol
        var best = null, bd = 99;
        for (var key in mapIdx) { var d = 0; for (var z = 0; z < grp.length; z++) if (grp.charAt(z) !== key.charAt(z)) d++; if (d < bd) { bd = d; best = mapIdx[key]; } }
        p = best || { norm: { i: 1, q: 0 } };
      }
      v = p.norm.i * Math.cos(D.TAU * fc * tt) - p.norm.q * Math.sin(D.TAU * fc * tt);
    }
    t.push(tt); wave.push(v); base.push(bit === '1' ? 1 : 0);
  }
  return { t: t, y: wave, base: base, dur: dur, rs: rs };
};

/* --- OFDM ---
   N subcarriers at k·Δf with Δf = 1/T_u.  Orthogonality:
   ∫₀^Tu cos(2πkΔf t)·cos(2πlΔf t)dt = Tu/2 if k=l, 0 if k≠l.
   We synthesise the time-domain signal directly from the subcarrier symbols,
   which is mathematically the same as evaluating an inverse DFT.             */
D.orthoIntegral = function (k, l, Tu) { return (k === l) ? Tu / 2 : 0; };
D.ofdmSymbol = function (symbols, N, samplesPerCarrier) {
  var spc = samplesPerCarrier || 18, Tu = 1, pts = Math.min(1400, N * spc);
  var t = [], y = [];
  var sub = symbols.map(function (s) { return { k: s.k, i: s.i, q: s.q, bits: s.bits, ty: [] }; });
  for (var i = 0; i <= pts; i++) {
    var tt = i / pts * Tu, acc = 0;
    for (var j = 0; j < sub.length; j++) {
      var s = sub[j];
      var v = (s.i * Math.cos(D.TAU * s.k * tt) + s.q * Math.sin(D.TAU * s.k * tt)) / Math.sqrt(N / 2);
      acc += v; s.ty.push(v);
    }
    t.push(tt); y.push(acc);
  }
  return { t: t, y: y, sub: sub, N: N, Tu: Tu };
};
D.ofdmFromBits = function (bits, nCarriers, spc) {
  var map = D.mapSquareQAM(16), idx = {};
  map.points.forEach(function (p) { idx[p.bits] = p; });
  var syms = [];
  for (var c = 0; c < nCarriers; c++) {
    var b = bits.substr(c * 4, 4); if (b.length < 4) b = '0000';
    var p = idx[b] || map.points[0];
    syms.push({ k: c + 1, i: p.i / Math.sqrt(2), q: p.q / Math.sqrt(2), bits: b });
  }
  return D.ofdmSymbol(syms, 2 * nCarriers, spc || 16);
};

/* --- Spread spectrum --- */
/* DSSS: multiply each data bit by a much faster PN chip sequence. */
D.dsss = function (bits, chips) {
  var rate = chips.length;                    // chips per second (1 s per data bit here)
  var dur = bits.length, N = U.clamp(Math.round(dur * 900), 400, 2600);
  var t = [], base = [], ch = [], spread = [], ctr = [];
  for (var i = 0; i <= N; i++) {
    var tt = i / N * dur;
    var k = Math.min(bits.length - 1, Math.floor(tt));
    var ci = Math.floor(tt * rate) % chips.length;
    var b = bits.charAt(k) === '1' ? 1 : -1;
    var c = chips.charAt(ci) === '1' ? 1 : -1;
    t.push(tt); base.push(b); ch.push(c); spread.push(b * c); ctr.push(ci / chips.length);
  }
  return { t: t, base: base, chip: ch, spread: spread, rate: rate, chips: chips };
};
/* FHSS: pseudo-random carrier selection, one hop per data-bit interval. */
D.hopSeq = function (i, n) { var seed = 1, k; for (k = 0; k <= i; k++) seed = (1103515245 * seed + 12345) >>> 0; return (seed >>> 9) % n; };
D.fhss = function (bits, nChannels, hopHz, samplesPerBit) {
  var hops = [], i;
  for (i = 0; i < bits.length; i++) hops.push(D.hopSeq(i, nChannels));
  var t = [], y = [], lev = [], base = [];
  var steps = bits.length * (samplesPerBit || 14);
  for (var j = 0; j <= steps; j++) {
    var tt = j / steps * bits.length;
    var h = U.clamp(Math.floor(tt), 0, bits.length - 1);
    var fc = 1200 + hops[h] * hopHz;
    y.push(Math.cos(D.TAU * fc * tt) * (bits.charAt(h) === '1' ? 1 : 0.55));
    t.push(tt); lev.push(hops[h]); base.push(bits.charAt(h) === '1' ? 1 : 0);
  }
  return { t: t, y: y, hops: hops, level: lev, base: base, nChannels: nChannels, hopHz: hopHz };
};


/* --- CRC (GF(2) polynomial division) --- */
D.crcDivide = function (msg, gen) {
  var m = msg + '0'.repeat(gen.length - 1);
  var arr = m.split('').map(Number);
  var genArr = gen.split('').map(Number);
  var steps = [];
  for (var i = 0; i < arr.length - genArr.length + 1; i++) {
    if (arr[i] === 1) {
      var before = arr.slice(i, i + genArr.length).join('');
      for (var j = 0; j < genArr.length; j++) arr[i + j] ^= genArr[j];
      if (steps.length < 24) steps.push({ i: i, op: before + ' XOR ' + gen + ' = ' + arr.slice(i, i + genArr.length).join('') });
    }
  }
  return { rem: arr.slice(-(genArr.length - 1)).join(''), steps: steps, codeword: msg + arr.slice(-(genArr.length - 1)).join('') };
};

/* --- Hamming (7,4) ---
   Bit numbering: position 1..7, MSB first. Parity at positions 1,2,4 (covers
   positions {1,2,4}, {1,3,4}, {2,3,4,5} ... standard Hamming(7,4)). Data bits d1..d4
   occupy positions 3,5,6,7. Codeword = [p1 p2 d1 p4 d2 d3 d4]. */
D.hamming74 = function (data4) {
  var d = data4.split('').map(Number);
  var p1 = (d[0] + d[1] + d[3]) % 2;   // positions 3,5,7
  var p2 = (d[0] + d[2] + d[3]) % 2;   // positions 3,6,7
  var p4 = (d[1] + d[2] + d[3]) % 2;   // positions 5,6,7
  return [p1, p2, d[0], p4, d[1], d[2], d[3]];
};
D.hammingSyndrome = function (cw) {
  var c = cw.split('').map(Number);
  var s1 = (c[0] + c[2] + c[4]) % 2;
  var s2 = (c[1] + c[2] + c[5]) % 2;
  var s4 = (c[3] + c[4] + c[5] + c[6]) % 2;
  return { s1: s1, s2: s2, s4: s4, value: s1 * 1 + s2 * 2 + s4 * 4 };
};
D.hammingFix = function (cw, syndrome) {
  var pos = syndrome.value;   // 1 -> pos1 ... 7 -> pos7
  var c = cw.split('').map(Number);
  if (pos >= 1 && pos <= 7) c[pos - 1] ^= 1;
  return c.join('');
};