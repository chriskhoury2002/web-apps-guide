/* ============================================================
   stepper.js — data-driven code-execution walkthrough player
   Authoring:
     <div class="stepper" data-title="...">
       <script type="application/json">
       { "lang":"js", "code":"...", "steps":[ {line,vars,stack,queues,output,note}, ... ] }
       </script>
     </div>
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DELAYS = [1700, 1150, 780, 480, 260];

  function fmt(s) {
    s = WAG.escapeHTML(s == null ? '' : String(s));
    s = s.replace(/\*\*(.+?)\*\*/g, '<b class="np">$1</b>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    return s;
  }

  function ic(name) {
    var m = {
      back: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5v14l-9-7z"/><rect x="5" y="5" width="2.4" height="14" rx="1"/></svg>',
      fwd: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l9-7z"/><rect x="16.6" y="5" width="2.4" height="14" rx="1"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
      restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'
    };
    return m[name] || '';
  }

  function init(host) {
    if (host.dataset.ready) return;
    host.dataset.ready = '1';
    var cfg;
    try { cfg = JSON.parse(host.querySelector('script[type="application/json"]').textContent); }
    catch (e) { host.innerHTML = '<div class="st-panel">שגיאה בטעינת ההדגמה</div>'; return; }

    var steps = cfg.steps || [];
    var lang = cfg.lang || 'js';
    var title = cfg.title || 'הרצת קוד צעד-אחר-צעד';
    var hasStack = steps.some(function (s) { return s.stack; });
    var hasQueues = steps.some(function (s) { return s.queues; });

    host.innerHTML =
      '<div class="st-head"><span class="ic">⏯</span><span class="st-title">' + WAG.escapeHTML(title) + '</span></div>' +
      '<div class="st-body">' +
        '<div class="st-code">' + WAG.buildPre(cfg.code || '', lang, { numbered: true }) + '</div>' +
        '<div class="st-panels">' +
          (hasStack ? '<div class="st-panel"><h5>📚 Call Stack</h5><div class="st-stack" data-stack></div></div>' : '') +
          (hasQueues ? '<div class="st-panel"><h5>⏳ תורים</h5><div class="st-queues" data-queues></div></div>' : '') +
          '<div class="st-panel"><h5>🔢 משתנים</h5><div class="st-vars" data-vars></div></div>' +
          '<div class="st-panel"><h5>🖨️ פלט (Console)</h5><div class="st-out" data-out></div></div>' +
          '<div class="st-panel"><h5>💬 מה קורה כאן</h5><div class="st-note" data-note></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="st-controls">' +
        '<button class="btn sm ghost st-b" type="button" title="אחורה" aria-label="צעד אחורה">' + ic('back') + '</button>' +
        '<button class="btn sm primary st-p" type="button" aria-label="נגן">' + ic('play') + '</button>' +
        '<button class="btn sm ghost st-f" type="button" title="קדימה" aria-label="צעד קדימה">' + ic('fwd') + '</button>' +
        '<button class="btn sm ghost st-r" type="button" title="התחל מחדש" aria-label="התחל מחדש">' + ic('restart') + '</button>' +
        '<div class="st-progress"><div class="st-bar"><span></span></div><span class="st-count"></span></div>' +
        '<label class="speed">מהירות <input type="range" min="1" max="5" value="3"></label>' +
      '</div>';

    var lines = host.querySelectorAll('.ln');
    var elVars = host.querySelector('[data-vars]');
    var elOut = host.querySelector('[data-out]');
    var elNote = host.querySelector('[data-note]');
    var elStack = host.querySelector('[data-stack]');
    var elQueues = host.querySelector('[data-queues]');
    var bar = host.querySelector('.st-bar > span');
    var count = host.querySelector('.st-count');
    var btnB = host.querySelector('.st-b'), btnP = host.querySelector('.st-p'),
        btnF = host.querySelector('.st-f'), btnR = host.querySelector('.st-r');
    var speed = host.querySelector('input[type=range]');

    var idx = -1, prevVars = {}, prevOutLen = 0, playing = false, timer = null;

    function render(i, animate) {
      var s = steps[i]; if (!s) return;
      // active line
      lines.forEach(function (ln) { ln.classList.remove('active'); });
      if (s.line && lines[s.line - 1]) {
        lines[s.line - 1].classList.add('active');
        if (!reduce) lines[s.line - 1].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      // vars (diff for flash)
      var vars = s.vars || {};
      var html = '';
      var keys = Object.keys(vars);
      if (!keys.length) html = '<span class="st-empty">אין משתנים עדיין</span>';
      keys.forEach(function (k) {
        var changed = animate && prevVars[k] !== vars[k];
        html += '<div class="st-var' + (changed ? ' changed' : '') + '"><span class="vname">' + WAG.escapeHTML(k) +
          '</span><span class="veq">=</span><span class="vval">' + WAG.escapeHTML(String(vars[k])) + '</span></div>';
      });
      elVars.innerHTML = html;
      prevVars = vars;

      // stack
      if (elStack) {
        var st = s.stack || [];
        if (!st.length) elStack.innerHTML = '<span class="st-empty">ריק</span>';
        else elStack.innerHTML = st.map(function (f, j) {
          return '<div class="frame' + (j === st.length - 1 ? ' top' : '') + (animate && j === st.length - 1 ? ' enter' : '') + '">' + WAG.escapeHTML(f) + '</div>';
        }).join('');
      }
      // queues
      if (elQueues) {
        var q = s.queues || {};
        var out = '';
        var order = [['micro', 'Microtask Queue (promises)', 'micro'], ['callback', 'Callback Queue (setTimeout, events)', ''], ['webapi', 'Web APIs', 'webapi']];
        order.forEach(function (pair) {
          if (!q[pair[0]]) return;
          var items = q[pair[0]];
          out += '<div class="st-queue ' + pair[2] + '"><div class="qname">' + pair[1] + '</div><div class="qitems">' +
            (items.length ? items.map(function (it) { return '<span class="qitem">' + WAG.escapeHTML(it) + '</span>'; }).join('') : '<span class="st-empty" style="font-size:.72rem">ריק</span>') +
            '</div></div>';
        });
        elQueues.innerHTML = out || '<span class="st-empty">ריק</span>';
      }
      // output (append animation for new lines)
      var outArr = s.output || [];
      var oh = outArr.map(function (line, j) {
        var isNew = animate && j >= prevOutLen;
        return '<div class="oline"' + (isNew ? '' : ' style="animation:none"') + '>' + WAG.escapeHTML(line) + '</div>';
      }).join('');
      elOut.innerHTML = oh || '<span class="st-empty">אין פלט עדיין</span>';
      prevOutLen = outArr.length;

      // note
      elNote.innerHTML = fmt(s.note || '');

      // progress
      var pct = ((i + 1) / steps.length) * 100;
      bar.style.width = pct + '%';
      count.textContent = (i + 1) + ' / ' + steps.length;
      btnB.disabled = i <= 0;
      btnF.disabled = i >= steps.length - 1;
    }

    function go(i, animate) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      render(idx, animate !== false);
    }
    function next() {
      if (idx >= steps.length - 1) { stop(); return; }
      go(idx + 1, true);
    }
    function prev() { if (idx > 0) go(idx - 1, false); }
    function play() {
      if (idx >= steps.length - 1) go(0, false);
      playing = true; btnP.innerHTML = ic('pause'); btnP.setAttribute('aria-label', 'השהה');
      tick();
    }
    function tick() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!playing) return;
        if (idx >= steps.length - 1) { stop(); return; }
        go(idx + 1, true); tick();
      }, DELAYS[(speed.value | 0) - 1] || 780);
    }
    function stop() { playing = false; clearTimeout(timer); btnP.innerHTML = ic('play'); btnP.setAttribute('aria-label', 'נגן'); }

    btnF.addEventListener('click', function () { stop(); next(); });
    btnB.addEventListener('click', function () { stop(); prev(); });
    btnP.addEventListener('click', function () { playing ? stop() : play(); });
    btnR.addEventListener('click', function () { stop(); prevVars = {}; prevOutLen = 0; go(0, false); });
    speed.addEventListener('input', function () { if (playing) tick(); });

    go(0, false);
  }

  WAG.initSteppers = function (root) { (root || document).querySelectorAll('.stepper').forEach(init); };
  document.addEventListener('DOMContentLoaded', function () { WAG.initSteppers(document); });
})();
