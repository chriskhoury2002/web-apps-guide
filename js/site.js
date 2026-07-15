/* ============================================================
   site.js — shared shell: header, theme toggle, mobile menu,
   scroll-spy TOC, topics dropdown, prev/next nav.
   Classic deferred script. Exposes window.WAG.
   ============================================================ */
(function () {
  'use strict';

  var inTopics = /\/topics\//.test(location.pathname);
  var ROOT = inTopics ? '../' : './';
  var CUR_SLUG = (document.body && document.body.dataset.slug) || '';

  var WAG = window.WAG = window.WAG || {};
  WAG.ROOT = ROOT;
  WAG.escapeHTML = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- THEME ---------- */
  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.8 4.8l1.7 1.7M17.5 17.5l1.7 1.7M19.2 4.8l-1.7 1.7M6.5 17.5l-1.7 1.7"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z"/></svg>';

  function currentTheme() { return document.documentElement.getAttribute('data-theme') || 'dark'; }
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = t === 'dark' ? MOON : SUN;
      btn.setAttribute('aria-label', t === 'dark' ? 'עבור למצב בהיר' : 'עבור למצב כהה');
      btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');
    }
  }
  function initTheme() {
    var saved;
    try { saved = localStorage.getItem('wag:theme'); } catch (e) {}
    document.documentElement.setAttribute('data-theme', saved || 'dark');
  }
  function toggleTheme() {
    var t = currentTheme() === 'dark' ? 'light' : 'dark';
    var doIt = function () { applyTheme(t); try { localStorage.setItem('wag:theme', t); } catch (e) {} };
    if (document.startViewTransition) { document.startViewTransition(doIt); } else { doIt(); }
  }
  WAG.toggleTheme = toggleTheme;

  /* set theme ASAP to avoid flash */
  initTheme();

  /* ---------- HEADER ---------- */
  function buildHeader() {
    var mount = document.querySelector('[data-header]');
    if (!mount) return;
    mount.className = 'site-header';
    mount.innerHTML =
      '<div class="wrap"><nav class="nav" aria-label="ניווט ראשי">' +
        '<a class="brand" href="' + ROOT + 'index.html">' +
          '<img src="' + ROOT + 'assets/favicon.svg" alt="" width="30" height="30">' +
          '<span>web<span class="accent">·</span>apps <span class="brand-sub">מדריך אינטראקטיבי</span></span>' +
        '</a>' +
        '<button class="icon-btn menu-toggle" id="menu-toggle" aria-label="תפריט" aria-expanded="false">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
        '</button>' +
        '<div class="nav-links" id="nav-links">' +
          '<a href="' + ROOT + 'index.html"' + (CUR_SLUG === 'home' ? ' class="active"' : '') + '>בית</a>' +
          '<a href="' + ROOT + 'index.html#topics">כל הנושאים</a>' +
          '<a class="nav-exam' + (CUR_SLUG === 'exam' ? ' active' : '') + '" href="' + ROOT + 'exam.html">🎓 מדריך למבחן</a>' +
          '<a class="nav-exam' + (CUR_SLUG === 'final-exam' ? ' active' : '') + '" href="' + ROOT + 'final-exam.html">📝 מבחן מסכם</a>' +
          '<button class="icon-btn" id="theme-toggle" type="button" aria-label="החלף ערכת נושא"></button>' +
        '</div>' +
      '</nav></div>';

    applyTheme(currentTheme());
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    var mt = document.getElementById('menu-toggle');
    var links = document.getElementById('nav-links');
    mt.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      mt.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { links.classList.remove('open'); mt.setAttribute('aria-expanded', 'false'); }
    });

    // scrolled shadow
    var onScroll = function () { mount.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---------- TOC (auto build + scroll-spy) ---------- */
  function buildTOC() {
    var toc = document.getElementById('toc');
    var content = document.getElementById('content');
    if (!toc || !content) return;
    var heads = content.querySelectorAll('h2[id]');
    if (!heads.length) { toc.style.display = 'none'; return; }
    var html = '<div class="toc-title">בעמוד הזה</div><ul>';
    heads.forEach(function (h) {
      html += '<li><a href="#' + h.id + '">' + h.textContent.trim() + '</a></li>';
    });
    html += '</ul>';
    toc.innerHTML = html;

    var links = {};
    toc.querySelectorAll('a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
          var a = links[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    heads.forEach(function (h) { spy.observe(h); });
  }

  /* ---------- prev / next topic nav ---------- */
  function buildTopicNav() {
    var mount = document.querySelector('[data-topic-nav]');
    if (!mount || !CUR_SLUG) return;
    fetch(ROOT + 'data/topics.json').then(function (r) { return r.json(); }).then(function (data) {
      var list = data.topics;
      var idx = list.findIndex(function (t) { return t.slug === CUR_SLUG; });
      if (idx < 0) return;
      var prev = list[idx - 1], next = list[idx + 1];
      var out = '';
      if (prev) out += '<a class="prev" href="' + prev.slug + '.html"><span class="tn-label">‹ הקודם</span><span class="tn-title">' + prev.icon + ' ' + prev.titleHe + '</span></a>';
      else out += '<span></span>';
      if (next) out += '<a class="next" href="' + next.slug + '.html"><span class="tn-label">הבא ›</span><span class="tn-title">' + next.icon + ' ' + next.titleHe + '</span></a>';
      mount.innerHTML = out;
    }).catch(function () {});
  }

  document.addEventListener('DOMContentLoaded', function () {
    buildHeader();
    buildTOC();
    buildTopicNav();
    // mark topic visited
    if (CUR_SLUG && CUR_SLUG !== 'home' && CUR_SLUG !== 'exam' && WAG.progress) {
      WAG.progress.markVisited(CUR_SLUG);
    }
  });
})();
