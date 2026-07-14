/* ============================================================
   progress.js — learning progress model + home dashboard render
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  var store = WAG.store;
  var PASS = 70; // % to count a topic as "complete"

  function all() { return store.get('progress', {}); }
  function topic(slug) {
    var p = all();
    return p[slug] || { visited: false, quiz: null, challenges: {} };
  }
  function saveTopic(slug, obj) {
    var p = all(); p[slug] = obj; store.set('progress', p);
  }

  var progress = WAG.progress = {
    PASS: PASS,

    markVisited: function (slug) {
      var t = topic(slug);
      if (!t.visited) { t.visited = true; saveTopic(slug, t); }
    },

    saveQuizScore: function (slug, correct, total) {
      var t = topic(slug);
      var pct = total ? Math.round((correct / total) * 100) : 0;
      if (!t.quiz || pct >= t.quiz.pct) {
        t.quiz = { correct: correct, total: total, pct: pct, at: Date.now() };
      }
      t.visited = true;
      saveTopic(slug, t);
      return t.quiz;
    },

    markChallenge: function (slug, id) {
      var t = topic(slug);
      t.challenges = t.challenges || {};
      if (!t.challenges[id]) { t.challenges[id] = true; saveTopic(slug, t); }
    },

    getTopic: topic,

    status: function (slug) {
      var t = topic(slug);
      if (t.quiz && t.quiz.pct >= PASS) return 'done';
      if (t.visited || (t.quiz)) return 'progress';
      return 'new';
    },

    saveExam: function (result) {
      var h = store.get('exam', []);
      h.unshift(result);
      if (h.length > 30) h = h.slice(0, 30);
      store.set('exam', h);
    },
    examHistory: function () { return store.get('exam', []); },

    /* overall = share of READY topics completed */
    overall: function (topics) {
      var ready = topics.filter(function (t) { return t.status === 'ready'; });
      if (!ready.length) return { pct: 0, done: 0, total: 0 };
      var done = ready.filter(function (t) { return progress.status(t.slug) === 'done'; }).length;
      return { pct: Math.round((done / ready.length) * 100), done: done, total: ready.length };
    },

    reset: function () { store.remove('progress'); store.remove('exam'); }
  };

  /* ---------- dashboard render (used on home) ---------- */
  WAG.renderDashboard = function (mount, topics) {
    var ov = progress.overall(topics);
    var labels = { done: 'הושלם', progress: 'בתהליך', 'new': 'לא התחלת' };

    var chips = topics.filter(function (t) { return t.status === 'ready'; }).map(function (t) {
      var st = progress.status(t.slug);
      var tp = progress.getTopic(t.slug);
      var pct = tp.quiz ? tp.quiz.pct + '%' : '';
      return '<a class="dash-chip st-' + st + '" href="topics/' + t.slug + '.html" style="--accent:' + t.accent + '">' +
        '<span class="dc-ic">' + t.icon + '</span>' +
        '<span class="dc-main"><b>' + t.titleHe + '</b><small>' + labels[st] + (pct ? ' · ' + pct : '') + '</small></span>' +
        (st === 'done' ? '<span class="dc-check">✓</span>' : '') +
      '</a>';
    }).join('');

    mount.innerHTML =
      '<div class="dash">' +
        '<div class="dash-ring">' +
          ringSVG(ov.pct) +
          '<div class="dash-ring-cap"><b data-count="' + ov.pct + '" data-suffix="%">0%</b><small>התקדמות</small></div>' +
        '</div>' +
        '<div class="dash-info">' +
          '<h3>ההתקדמות שלי</h3>' +
          '<p class="dim">השלמת <b class="accent">' + ov.done + '</b> מתוך <b>' + ov.total + '</b> הנושאים הזמינים. נושא נחשב מושלם כשמקבלים לפחות ' + PASS + '% בתרגול.</p>' +
          '<div class="dash-chips">' + chips + '</div>' +
        '</div>' +
      '</div>';

    var svg = mount.querySelector('.ring');
    if (svg) WAG.drawRing(svg, ov.pct);
    var cap = mount.querySelector('[data-count]');
    if (cap) WAG.countUp(cap, ov.pct, { suffix: '%' });
  };

  function ringSVG(pct) {
    return '<svg class="ring" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">' +
      '<circle class="ring-bg" cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="10"/>' +
      '<circle class="ring-fg" cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" stroke-width="10" stroke-linecap="round" transform="rotate(-90 60 60)"/>' +
      '</svg>';
  }
  WAG.ringSVG = ringSVG;
})();
