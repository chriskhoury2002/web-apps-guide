/* ============================================================
   challenge.js — "נסה בעצמך" playground with an auto-checker.
   Authoring:
     <div class="challenge" data-slug="03-css" data-id="ch1"
          data-goal="שנה את צבע הרקע של הכפתור לאדום"
          data-check="style" data-sel="button" data-prop="backgroundColor" data-val="rgb(255, 0, 0)"
          data-hint="הוסף background-color לכפתור">
       <script type="text/plain" class="pg-html">...</script>
       <script type="text/plain" class="pg-css">...</script>
       <script type="text/plain" class="pg-js">...</script>
     </div>
   Custom checks: WAG.registerCheck('id', function(doc, opts){ return true/false })
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  WAG.checks = WAG.checks || {
    exists: function (doc, o) { return !!doc.querySelector(o.sel); },
    count: function (doc, o) { return doc.querySelectorAll(o.sel).length >= (o.min || 1); },
    text: function (doc, o) {
      var e = doc.querySelector(o.sel);
      return !!e && e.textContent.toLowerCase().indexOf((o.text || '').toLowerCase()) > -1;
    },
    style: function (doc, o) {
      var e = doc.querySelector(o.sel); if (!e) return false;
      var cs = doc.defaultView.getComputedStyle(e);
      var v = String(cs[o.prop] || '').toLowerCase();
      return String(o.val || '').toLowerCase().split('|').some(function (x) { return x && v.indexOf(x.trim()) > -1; });
    }
  };
  WAG.registerCheck = function (id, fn) { WAG.checks[id] = fn; };

  function confetti(host) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var colors = ['#f5b64a', '#5ad1e6', '#57d38c', '#ff7a90', '#c98bff'];
    var wrap = host.querySelector('.ch-status');
    for (var i = 0; i < 16; i++) {
      var c = document.createElement('span');
      c.className = 'confetti';
      c.style.left = (10 + Math.random() * 80) + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * .2) + 's';
      wrap.appendChild(c);
      (function (node) { setTimeout(function () { node.remove(); }, 1100); })(c);
    }
  }

  function init(ch) {
    if (ch.dataset.ready) return;
    ch.dataset.ready = '1';

    var goal = ch.dataset.goal || 'השלם את המשימה';
    var checkId = ch.dataset.check || 'exists';
    var slug = ch.dataset.slug || (document.body && document.body.dataset.slug) || '';
    var id = ch.dataset.id || checkId;
    var hint = ch.dataset.hint || '';
    var opts = { sel: ch.dataset.sel, prop: ch.dataset.prop, val: ch.dataset.val, text: ch.dataset.text, min: +ch.dataset.min || 1 };

    // grab the source panes
    var scripts = [];
    ch.querySelectorAll('script[type="text/plain"]').forEach(function (s) { scripts.push(s.cloneNode(true)); });

    ch.innerHTML =
      '<div class="ch-goal"><span class="ch-ic">🎯</span><span class="ch-txt"><strong>נסה בעצמך</strong><span>' + WAG.escapeHTML(goal) + '</span></span></div>' +
      '<div class="ch-pg"></div>' +
      '<div class="ch-status" data-state="idle">✏️ ערוך את הקוד ובדוק אם עמדת במשימה…</div>';

    var pgMount = ch.querySelector('.ch-pg');
    var pg = document.createElement('div');
    pg.className = 'playground';
    pg.setAttribute('data-tabs', ch.dataset.tabs || 'html,css');
    pg.setAttribute('data-sandbox', 'allow-scripts allow-same-origin allow-modals');
    pg.setAttribute('data-preview-label', 'התוצאה שלך');
    if (ch.dataset.activeTab) pg.setAttribute('data-active', ch.dataset.activeTab);
    scripts.forEach(function (s) { pg.appendChild(s); });
    pgMount.appendChild(pg);

    var status = ch.querySelector('.ch-status');
    var won = false;

    pg.addEventListener('pg:render', function (e) {
      var doc;
      try { doc = e.detail.iframe.contentDocument; } catch (err) { return; }
      if (!doc) return;
      var fn = WAG.checks[checkId];
      var ok = false;
      try { ok = fn ? fn(doc, opts) : false; } catch (err) { ok = false; }
      if (ok) {
        status.setAttribute('data-state', 'win');
        status.textContent = '🎉 מעולה! עמדת במשימה.';
        if (!won) {
          won = true;
          confetti(ch);
          if (slug && WAG.progress) WAG.progress.markChallenge(slug, id);
        }
      } else {
        won = false;
        status.setAttribute('data-state', 'fail');
        status.textContent = hint ? '💡 עדיין לא. רמז: ' + hint : '💡 עדיין לא שם, נסה שוב.';
      }
    });

    WAG.initPlaygrounds(pgMount);
  }

  WAG.initChallenges = function (root) { (root || document).querySelectorAll('.challenge').forEach(init); };
  document.addEventListener('DOMContentLoaded', function () { WAG.initChallenges(document); });
})();
