(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dialogs = $$('dialog:not(.pp-dialog)');
  var menuDlg = dialogs[0];
  var contactDlgs = dialogs.slice(1);


  // ---- light / dark mode ----
  var root = document.documentElement;
  function curMode() { return root.getAttribute('data-mode') === 'dark' ? 'dark' : 'light'; }
  function paintMode() {
    var dark = curMode() === 'dark';
    $$('[data-mode-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', dark);
      if (b.classList.contains('nv__mode')) b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      var l = b.querySelector('.menu-mode-label, .ft-mode-label'); if (l) l.textContent = dark ? 'Light mode' : 'Dark mode';
    });
  }
  function setMode(m, save) {
    root.setAttribute('data-mode', m);
    if (save) { try { localStorage.setItem('nova-mode', m); } catch (e) {} }
    paintMode(); window.dispatchEvent(new Event('nova-mode')); window.dispatchEvent(new Event('scroll'));
  }
  $$('[data-mode-toggle]').forEach(function (b) { b.addEventListener('click', function () { setMode(curMode() === 'dark' ? 'light' : 'dark', true); }); });
  paintMode();

  // ---- privacy policy dialog + cookie notice ----
  var pp = document.getElementById('privacy-dialog'), ck = document.getElementById('cookie-notice');
  function openPP(trigger) {
    if (!pp || pp.open) return; pp._t = trigger || document.activeElement; pp.showModal(); root.style.overflow = 'hidden';
    var body = pp.querySelector('.pp-body'); if (body) body.scrollTop = 0;
  }
  if (pp) {
    pp.addEventListener('close', function () { root.style.overflow = ''; if (pp._t && pp._t.focus) pp._t.focus(); });
    pp.addEventListener('click', function (e) { if (e.target === pp) pp.close(); });
    var pc = pp.querySelector('.pp-close'); if (pc) pc.addEventListener('click', function () { pp.close(); });
  }
  $$('[data-open-privacy]').forEach(function (b) { b.addEventListener('click', function () { openPP(b); }); });
  function ackSeen() { try { return localStorage.getItem('nova-cookie') === '1'; } catch (e) { return false; } }
  if (ck) {
    if (!ackSeen()) ck.hidden = false;
    var ok = ck.querySelector('.ck-ok');
    if (ok) ok.addEventListener('click', function () { try { localStorage.setItem('nova-cookie', '1'); } catch (e) {} ck.hidden = true; });
  }
  $$('[data-open-cookies]').forEach(function (b) { b.addEventListener('click', function () { if (ck) { ck.hidden = false; var o = ck.querySelector('.ck-ok'); if (o) o.focus(); } }); });

  function open(d, trigger) {
    if (!d || d.open) return;
    d._trigger = trigger || document.activeElement;
    d.showModal();
    if (d === menuDlg) { var pn = d.querySelector('[style*="height"]'); if (pn) { pn.style.height = 'auto'; } }
    $$('[data-reveal],[style*="opacity:0"],[style*="opacity: 0"]', d).forEach(function (el) { el.style.opacity = ''; el.style.filter = ''; el.style.clipPath = ''; el.style.translate = ''; el.style.scale = ''; el.style.backdropFilter = ''; el.setAttribute('data-reveal-state', 'done'); }); document.documentElement.style.overflow = 'hidden';
  }
  function close(d) { if (d && d.open) d.close(); }
  dialogs.forEach(function (d) {
    d.addEventListener('close', function () {
      if (!dialogs.some(function (x) { return x.open; })) document.documentElement.style.overflow = '';
      if (d._trigger && d._trigger.focus) d._trigger.focus();
    });
    d.addEventListener('click', function (e) { if (e.target === d) close(d); });
    $$('button[aria-label^="Close"]', d).forEach(function (b) { b.addEventListener('click', function () { close(d); }); });
    // links inside the menu close it and scroll
    $$('a[href^="#"]', d).forEach(function (a) { a.addEventListener('click', function () { close(d); }); });
  });

  // mobile menu button (rendered hidden until scripts run)
  $$('button[aria-controls]').forEach(function (b) {
    b.hidden = false; b.removeAttribute('hidden');
    b.addEventListener('click', function () { open(menuDlg, b); });
  });

  // appointment buttons open the contact dialog
  $$('button[aria-haspopup="dialog"]').forEach(function (b) {
    if (b.hasAttribute('aria-controls')) return;
    var idx = $$('button[aria-haspopup="dialog"]:not([aria-controls])').indexOf(b);
    b.addEventListener('click', function () {
      close(menuDlg);
      open(contactDlgs[Math.min(idx, contactDlgs.length - 1)] || contactDlgs[0], b);
    });
  });

  // header "Make an appointment" link and home links
  $$('a[href="#contact"], a[href="/#contact"]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(contactDlgs[0], a); }); });
  $$('a[href="/"]').forEach(function (a) { a.setAttribute('href', './'); });

  // smooth in-page anchors
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.defaultPrevented) return; var id = a.getAttribute('href').slice(1); var t = id && document.getElementById(id);
      if (!t) return; e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + id);
    });
  });

  // reveal anything still waiting on the original framework's animation state
  var held = $$('[data-reveal], [data-reveal-token], [style*="opacity:0"], [style*="opacity: 0"]');
  function show(el) { el.style.opacity = ''; el.style.filter = ''; el.style.clipPath = ''; el.style.translate = ''; el.style.scale = ''; el.style.transform = ''; el.style.backdropFilter = ''; el.setAttribute('data-reveal-state', 'done'); }
  if (reduce || !('IntersectionObserver' in window)) { held.forEach(show); }
  else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { var el = x.target; el.style.transition = 'opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1), filter .8s, clip-path .8s'; show(el); io.unobserve(el); } });
    }, { threshold: .05 });
    held.forEach(function (el) { io.observe(el); });
  }

  // horizontal reviews scroller: arrow keys
  $$('[class*="overflow-x-auto"], [class*="snap-x"]').forEach(function (s) {
    if (!s.hasAttribute('tabindex')) s.setAttribute('tabindex', '0');
    s.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); s.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * s.clientWidth * .6, behavior: reduce ? 'auto' : 'smooth' }); }
    });
  });

  // hero video: autoplay muted loop; stay still for reduced motion
  $$('video').forEach(function (v) { v.muted = true; if (reduce) { v.removeAttribute('autoplay'); v.pause(); } else { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });

  // glass folders
  var folders = $$('.gfold');
  function setFolder(f, on) {
    var hit = f.querySelector('.gfold-hit'), files = f.querySelector('.gfold-files');
    f.toggleAttribute('data-open', on); hit.setAttribute('aria-expanded', on);
    files.toggleAttribute('inert', !on);
  }
  folders.forEach(function (f) {
    setFolder(f, false);
    f.querySelector('.gfold-hit').addEventListener('click', function () { var on = !f.hasAttribute('data-open'); folders.forEach(function (o) { setFolder(o, o === f && on); }); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') folders.forEach(function (f) { if (f.hasAttribute('data-open')) { setFolder(f, false); f.querySelector('.gfold-hit').focus(); } }); });
  document.addEventListener('pointerdown', function (e) { folders.forEach(function (f) { if (f.hasAttribute('data-open') && !f.contains(e.target)) setFolder(f, false); }); });

  // footer: tabs + dot-matrix wordmark
  $$('.ft-tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.ft-tabs button').forEach(function (o) { o.setAttribute('aria-selected', o === b); });
      $$('.ft-list').forEach(function (l) { l.hidden = l.getAttribute('data-ft-list') !== b.getAttribute('data-ft'); });
    });
  });
  (function () {
    var box = document.querySelector('.ft-word'), cv = box && box.querySelector('canvas'); if (!cv) return;
    var dotCol = '120,120,116', ringCol = '#111', ctx = cv.getContext('2d'), dots = [], W = 0, H = 0, dpr = 1, mx = -999, my = -999, over = false, raf = 0, visible = false;
    function readCols() { var cs = getComputedStyle(box); dotCol = (cs.getPropertyValue('--ft-dot') || '120,120,116').trim(); ringCol = (cs.getPropertyValue('--ft-ring') || '#111').trim(); }
    function build() {
      readCols(); W = box.clientWidth; dpr = Math.min(2, window.devicePixelRatio || 1);
      var step = W < 600 ? 6 : 9, word = 'N\u00d8VA';
      var font = '900 100px "Arial Black", Arial, Helvetica, sans-serif', m = document.createElement('canvas').getContext('2d');
      m.font = font; if ('letterSpacing' in m) m.letterSpacing = '8px';
      var tw = m.measureText(word).width, size = 100 * (W * 0.98) / tw; H = Math.round(size * 0.82);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
      var off = document.createElement('canvas'); off.width = W; off.height = H;
      var o = off.getContext('2d'); o.font = font.replace('100px', size + 'px'); if ('letterSpacing' in o) o.letterSpacing = (8 * size / 100) + 'px';
      o.textBaseline = 'alphabetic'; o.fillStyle = '#000'; o.fillText(word, W * 0.01, size * 0.78);
      var d = o.getImageData(0, 0, W, H).data; dots = [];
      for (var y = step / 2; y < H; y += step) for (var x = step / 2; x < W; x += step) {
        if (d[((y | 0) * W + (x | 0)) * 4 + 3] > 128) dots.push({ x: x, y: y, ox: x, oy: y, vx: 0, vy: 0 });
      }
      draw(true);
    }
    function draw(still) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var R = 110, moving = false, r = W < 600 ? 1.5 : 2.2;
      ctx.fillStyle = 'rgba(' + dotCol + ',.55)';
      for (var i = 0; i < dots.length; i++) {
        var p = dots[i];
        if (!still) {
          var dx = p.x - mx, dy = p.y - my, dd = dx * dx + dy * dy;
          if (over && dd < R * R) { var f = (1 - Math.sqrt(dd) / R) * 5.5, a = Math.atan2(dy, dx); p.vx += Math.cos(a) * f; p.vy += Math.sin(a) * f; }
          p.vx += (p.ox - p.x) * 0.06; p.vy += (p.oy - p.y) * 0.06; p.vx *= 0.82; p.vy *= 0.82; p.x += p.vx; p.y += p.vy;
          if (Math.abs(p.vx) + Math.abs(p.vy) > 0.05 || Math.abs(p.x - p.ox) > 0.2) moving = true;
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
      }
      if (over && !still) { ctx.strokeStyle = ringCol; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, 36, 0, 6.2832); ctx.stroke(); ctx.fillStyle = ringCol; ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, 6.2832); ctx.fill(); }
      raf = 0; if (!still && visible && (moving || over)) raf = requestAnimationFrame(function () { draw(false); });
    }
    function kick() { if (!raf && !reduce) raf = requestAnimationFrame(function () { draw(false); }); }
    box.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; over = true; kick(); });
    box.addEventListener('pointerleave', function () { over = false; kick(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }).observe(box); else visible = true;
    window.addEventListener('nova-mode', function () { readCols(); draw(true); kick(); });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 150); });
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  })();

  // principles carousel buttons
  (function () {
    var sc = document.querySelector('#reviews [class*="overflow-x-auto"]'); if (!sc) return;
    var head = document.querySelector('#reviews > div'); if (!head) return;
    var w = document.createElement('div'); w.className = 'rv-btns';
    w.innerHTML = '<button type="button" aria-label="Previous principles">\u2190</button><button type="button" aria-label="Next principles">\u2192</button>';
    head.appendChild(w);
    var b = w.querySelectorAll('button');
    function step(d) { sc.scrollBy({ left: d * sc.clientWidth * .5, behavior: reduce ? 'auto' : 'smooth' }); }
    b[0].addEventListener('click', function () { step(-1); }); b[1].addEventListener('click', function () { step(1); });
    function st() { b[0].disabled = sc.scrollLeft < 4; b[1].disabled = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 4; }
    sc.addEventListener('scroll', st, { passive: true }); window.addEventListener('resize', st); st();
  })();

  // section rail (desktop)
  var secs = ['top', 'care', 'team', 'reviews', 'first-visit', 'pricing', 'faq'].map(function (id) { return id === 'top' ? document.querySelector('main section') || document.body : document.getElementById(id); }).filter(Boolean);
  var names = ['Introduction', 'Services', 'Work', 'Principles', 'Process', 'Engagements', 'Questions'];
  var rail = document.createElement('nav'); rail.className = 'rail'; rail.setAttribute('aria-label', 'Sections');
  secs.forEach(function (sec, i) {
    var a = document.createElement('a'); a.href = '#'; a.setAttribute('aria-label', names[i]); a.title = names[i];
    a.addEventListener('click', function (e) { e.preventDefault(); sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    rail.appendChild(a);
  });
  document.body.appendChild(rail);
  var panel = document.querySelector('header [data-theme]');
  function darkAt(x, y) {
    var els = document.elementsFromPoint(x, y);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el === rail || rail.contains(el) || (panel && (el.closest('header') || el === document.documentElement))) continue;
      var c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
      if (c && (c[3] === undefined || +c[3] > .5) && !(c.length > 3 && +c[3] === 0)) return (+c[0] + +c[1] + +c[2]) / 3 < 90;
    }
    return false;
  }
  function railUpdate() {
    var mid = window.innerHeight / 2, cur = 0;
    secs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) cur = i; });
    $$('a', rail).forEach(function (a, i) { a.setAttribute('aria-current', i === cur); });
    rail.classList.toggle('on-dark', darkAt(10, mid));
    if (panel) { var hy = panel.getBoundingClientRect(); panel.setAttribute('data-theme', darkAt(hy.left + hy.width / 2, hy.top + hy.height / 2) ? 'dark' : 'light'); }
  }
  window.addEventListener('scroll', railUpdate, { passive: true }); window.addEventListener('resize', railUpdate); railUpdate();
  // floating navbar
  var nv = document.querySelector('.nv'), pill = nv && nv.querySelector('.nv__pill');
  if (nv) {
    var navLinks = $$('.nv__links a'), lastY = window.scrollY;
    var navTick = false;
    function nvUpdate() {
      var y = window.scrollY;
      nv.classList.toggle('is-scrolled', y > 24);
      nv.classList.toggle('is-hidden', y > 240 && y > lastY + 4 && !nv.contains(document.activeElement));
      if (y < lastY - 4 || y <= 240) nv.classList.remove('is-hidden');
      lastY = y;
      var cur = -1;
      navLinks.forEach(function (a, i) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t && t.getBoundingClientRect().top <= 140) cur = i; });
      navLinks.forEach(function (a, i) { a.setAttribute('aria-current', i === cur); });
      var r = pill.getBoundingClientRect();
      pill.setAttribute('data-nv-theme', darkAt(r.left + r.width / 2, r.top + r.height / 2) ? 'dark' : 'light');
    }
    window.addEventListener('scroll', function () { if (navTick) return; navTick = true; requestAnimationFrame(function () { nvUpdate(); navTick = false; }); }, { passive: true });
    window.addEventListener('resize', nvUpdate); nv.addEventListener('focusin', function () { nv.classList.remove('is-hidden'); }); nvUpdate();
  }
})();


/* liquid-glass refraction filter */
(function(){try{var ns='http://www.w3.org/2000/svg',s=document.createElementNS(ns,'svg');s.setAttribute('width','0');s.setAttribute('height','0');s.setAttribute('aria-hidden','true');s.style.cssText='position:absolute;width:0;height:0';
s.innerHTML='<defs><filter id="nova-glass" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="92" result="noise"/><feGaussianBlur in="noise" stdDeviation="3" result="blur"/><feDisplacementMap in="SourceGraphic" in2="blur" scale="6" xChannelSelector="R" yChannelSelector="G"/></filter></defs>';
document.body.appendChild(s)}catch(e){}})();

/* ---- WebGL: liquid hero + contour-line backdrops (own shaders, no libraries) ---- */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  function mk(canvas, fs) {
    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; }
    var vs = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, fs); if (!vs || !f) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; return { gl: gl, u: function (n) { return U[n] || (U[n] = gl.getUniformLocation(pr, n)); } };
  }
  function fit(c) {
    var d = Math.min(window.devicePixelRatio || 1, window.innerWidth < 1024 ? 1 : 1.75), w = Math.max(1, Math.round(c.clientWidth * d)), h = Math.max(1, Math.round(c.clientHeight * d));
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return [w, h];
  }
  function loop(el, draw) {
    var vis = false, raf = 0, t0 = performance.now();
    function tick(now) { raf = 0; if (!vis) return; draw((now - t0) / 1000); raf = requestAnimationFrame(tick); }
    new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis && !raf && !document.hidden) raf = requestAnimationFrame(tick); }, { threshold: 0.05 }).observe(el);
    document.addEventListener('visibilitychange', function () { if (!document.hidden && vis && !raf) raf = requestAnimationFrame(tick); });
  }

  /* 1. hero: pixel-resolve intro + liquid lens that follows the cursor */
  var img = document.querySelector('.hero-nova img.hero-drift');
  if (img && !reduce) {
    var box = img.parentElement, cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;border-radius:inherit;opacity:0;transition:opacity .5s';
    var FS = 'precision mediump float;varying vec2 v;uniform sampler2D t;uniform vec2 res,img,m;uniform float time,k,prog;' +
      'void main(){vec2 uv=v;uv.y=1.-uv.y;' +
      'float ra=res.x/res.y,ia=img.x/img.y;vec2 s=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);vec2 c=(uv-.5)*s+.5;' +
      'float cells=mix(18.,900.,prog*prog*(3.-2.*prog));if(prog<.999)c=(floor(c*cells)+.5)/cells;' +
      'vec2 d=uv-m;d.x*=ra;float r=length(d);float f=exp(-r*r*9.)*k;' +
      'vec2 off=-d*vec2(1./ra,1.)*f*.22+vec2(sin(uv.y*7.+time*.5),cos(uv.x*6.+time*.4))*.0015;' +
      'float R=texture2D(t,c+off).r,G=texture2D(t,c+off).g,B=texture2D(t,c+off).b;' +
      'gl_FragColor=vec4(R,G,B,1.);}';
    var g = mk(cv, FS);
    if (g) {
      box.appendChild(cv);
      var gl = g.gl, tex = gl.createTexture(), im = new Image(), ready = false, mx = .5, my = .5, tx = .5, ty = .5, k = 0, tk = 0, born = 0;
      im.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        ready = true; born = performance.now();
      };
      im.src = img.currentSrc || img.src;
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width, ny = 1 - (e.clientY - r.top) / r.height;
        tk = Math.min(1, tk + Math.hypot(nx - tx, ny - ty) * 6); tx = nx; ty = ny;
      });
      box.addEventListener('pointerleave', function () { tk = 0; });
      loop(box, function (time) {
        if (!ready) return;
        var sz = fit(cv); gl.viewport(0, 0, sz[0], sz[1]);
        mx += (tx - mx) * .12; my += (ty - my) * .12; tk *= .965; k += (Math.max(tk, .12) - k) * .08;
        var prog = Math.min(1, (performance.now() - born) / 1500);
        gl.uniform2f(g.u('res'), sz[0], sz[1]); gl.uniform2f(g.u('img'), im.naturalWidth, im.naturalHeight);
        gl.uniform2f(g.u('m'), mx, my); gl.uniform1f(g.u('time'), time); gl.uniform1f(g.u('k'), k); gl.uniform1f(g.u('prog'), prog);
        gl.uniform1i(g.u('t'), 0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (cv.style.opacity !== '1') { cv.style.opacity = '1'; setTimeout(function () { img.style.visibility = 'hidden'; }, 550); }
      });
    }
  }

  /* 2. dark sections: slow topographic contour lines that bend toward the cursor */
  var FS2 = 'precision mediump float;varying vec2 v;uniform vec2 res,m;uniform float time;' +
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
    'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.03+7.1;a*=.5;}return s;}' +
    'void main(){vec2 uv=v;float ra=res.x/res.y;vec2 p=vec2(uv.x*ra,uv.y)*1.6;' +
    'vec2 d=uv-m;d.x*=ra;float pull=exp(-dot(d,d)*6.)*.35;' +
    'float f=fbm(p+vec2(time*.02,-time*.015))+pull;' +
    'float l=abs(fract(f*9.)-.5);float line=1.-smoothstep(.0,.035,l);' +
    'float fade=smoothstep(0.,.25,uv.y)*smoothstep(1.,.7,uv.y);' +
    'float a=line*.16*(.5+.5*fade);gl_FragColor=vec4(vec3(1.)*a,a);}';
  if (!reduce) ['reviews', 'first-visit'].forEach(function (id) {
    var sec = document.getElementById(id); if (!sec) return;
    var cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;top:0;bottom:0;left:50%;transform:translateX(-50%);width:100vw;height:100%;pointer-events:none;z-index:-1;display:block';
    var g = mk(cv, FS2); if (!g) return;
    sec.insertBefore(cv, sec.firstChild);
    var gl = g.gl, mx = .5, my = .5, tx = .5, ty = .5;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    sec.addEventListener('pointermove', function (e) { var r = sec.getBoundingClientRect(); tx = e.clientX / innerWidth; ty = 1 - (e.clientY - r.top) / r.height; });
    loop(sec, function (time) {
      var sz = fit(cv); gl.viewport(0, 0, sz[0], sz[1]); mx += (tx - mx) * .06; my += (ty - my) * .06;
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(g.u('res'), sz[0], sz[1]); gl.uniform2f(g.u('m'), mx, my); gl.uniform1f(g.u('time'), time);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  });
})();

/* showcase laptop: tabs, auto-cycle, pointer tilt */
(function () {
  var sec = document.getElementById('showcase'); if (!sec) return;
  var mac = sec.querySelector('.sc-mac'), A = sec.querySelector('.sc-a'), B = sec.querySelector('.sc-b'),
    tabs = [].slice.call(sec.querySelectorAll('.sc-tab')), link = sec.querySelector('.sc-link'), kind = sec.querySelector('.sc-kind'),
    cur = -1, on = 'a', timer = 0, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/1999/xlink';
  function put(el, src) { el.setAttribute('href', src); el.setAttributeNS(NS, 'xlink:href', src); }
  function go(i) {
    if (i === cur) return; cur = i; var t = tabs[i], src = 'images/hx-' + t.dataset.slug + '.webp';
    var next = on === 'a' ? B : A; put(next, src);
    var im = new Image(); im.onload = function () { on = on === 'a' ? 'b' : 'a'; mac.setAttribute('data-on', on); }; im.src = src;
    tabs.forEach(function (x, k) { x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    link.href = 'https://horizonx.so/explore/' + t.dataset.slug; kind.textContent = t.dataset.kind + ' \u00b7 ' + t.dataset.name;
  }
  function auto() { clearInterval(timer); if (!reduce) timer = setInterval(function () { go((cur + 1) % tabs.length); }, 4500); }
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); auto(); }); });
  put(A, 'images/hx-' + tabs[0].dataset.slug + '.webp'); on = 'a'; cur = -1; go(0);
  if (!reduce) {
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) auto(); else clearInterval(timer); }, { threshold: .3 }).observe(sec);
  }
})();

/* Vercel Web Analytics (cookie-free). Only on a real deployment; harmless 404 elsewhere is avoided. */
(function () {
  try {
    var h = location.hostname;
    if (!h || h === 'localhost' || /^127\.|^192\.168\.|\.local$/.test(h) || /claude|anthropic/i.test(h)) return;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script'); s.defer = true; s.src = '/_vercel/insights/script.js'; document.head.appendChild(s);
  } catch (e) {}
})();
