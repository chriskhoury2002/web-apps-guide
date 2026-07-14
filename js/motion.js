/* ============================================================
   motion.js — scroll reveals, staggered grids, number count-up,
   progress rings. All guarded by prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* count-up helper (exposed for other engines) */
  WAG.countUp = function (el, to, opts) {
    opts = opts || {};
    to = Number(to) || 0;
    var suffix = opts.suffix || '';
    if (reduce || opts.instant) { el.textContent = to + suffix; return; }
    var dur = opts.dur || 900, start = null, from = Number(opts.from) || 0;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  };

  /* draw an SVG progress ring: expects <svg class="ring" data-pct="72" ...> built by caller */
  WAG.drawRing = function (svg, pct) {
    var circle = svg.querySelector('.ring-fg');
    if (!circle) return;
    var r = circle.r.baseVal.value;
    var c = 2 * Math.PI * r;
    circle.style.strokeDasharray = c;
    var offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    if (reduce) { circle.style.strokeDashoffset = offset; return; }
    circle.style.strokeDashoffset = c;
    // force reflow then animate
    void circle.getBoundingClientRect();
    circle.style.transition = 'stroke-dashoffset 1s cubic-bezier(.16,1,.3,1)';
    requestAnimationFrame(function () { circle.style.strokeDashoffset = offset; });
  };

  function initReveals() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in-view');
          // count-up on reveal
          en.target.querySelectorAll('[data-count]').forEach(function (c) {
            if (c.dataset.done) return; c.dataset.done = '1';
            WAG.countUp(c, c.dataset.count, { suffix: c.dataset.suffix || '' });
          });
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
  }

  function initStagger() {
    document.querySelectorAll('[data-stagger]').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, i) {
        child.style.setProperty('--i', i);
        child.classList.add('stagger-item');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initStagger();
    initReveals();
  });
})();
