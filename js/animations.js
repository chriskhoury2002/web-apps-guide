/* ============================================================
   animations.js — concept-animation framework + step-player + builders
   Authoring: <div class="anim" data-anim="event-loop" data-title="..."></div>
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  WAG.anims = WAG.anims || {};
  WAG.registerAnim = function (n, fn) { WAG.anims[n] = fn; };

  var SVG = {
    back: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M16 5v14l-9-7z"/><rect x="5" y="5" width="2.4" height="14" rx="1"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l9-7z"/><rect x="16.6" y="5" width="2.4" height="14" rx="1"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
    restart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>'
  };

  /* shared step player mounted into a ctrls bar */
  WAG.stepPlayer = function (ctrls, count, apply, opts) {
    opts = opts || {};
    var delay = opts.delay || 1500;
    ctrls.innerHTML =
      '<button class="btn sm ghost sp-b" type="button" aria-label="אחורה">' + SVG.back + '</button>' +
      '<button class="btn sm primary sp-p" type="button" aria-label="נגן">' + SVG.play + '</button>' +
      '<button class="btn sm ghost sp-f" type="button" aria-label="קדימה">' + SVG.fwd + '</button>' +
      '<button class="btn sm ghost sp-r" type="button" aria-label="התחל מחדש">' + SVG.restart + '</button>' +
      '<span class="an-step-label"></span>';
    var i = -1, playing = false, timer = null;
    var b = ctrls.querySelector('.sp-b'), p = ctrls.querySelector('.sp-p'),
        f = ctrls.querySelector('.sp-f'), r = ctrls.querySelector('.sp-r'), label = ctrls.querySelector('.an-step-label');
    function go(n, anim) { i = Math.max(0, Math.min(count - 1, n)); apply(i, anim !== false); label.innerHTML = 'צעד <b>' + (i + 1) + '</b> / ' + count; b.disabled = i <= 0; f.disabled = i >= count - 1; }
    function stop() { playing = false; clearTimeout(timer); p.innerHTML = SVG.play; }
    function play() { if (i >= count - 1) go(0, false); playing = true; p.innerHTML = SVG.pause; tick(); }
    function tick() { clearTimeout(timer); timer = setTimeout(function () { if (!playing) return; if (i >= count - 1) { stop(); return; } go(i + 1, true); tick(); }, delay); }
    f.onclick = function () { stop(); go(i + 1, true); }; b.onclick = function () { stop(); go(i - 1, false); };
    p.onclick = function () { playing ? stop() : play(); }; r.onclick = function () { stop(); go(0, false); };
    go(0, false);
    return { go: go };
  };

  function chips(arr, cls) {
    if (!arr || !arr.length) return '<span class="el-empty">ריק</span>';
    return arr.map(function (x) { return '<span class="el-item ' + (cls || '') + '">' + WAG.escapeHTML(x) + '</span>'; }).join('');
  }

  /* ---------- 1. request / response ---------- */
  WAG.registerAnim('request-response', function (stage, ctrls) {
    stage.innerHTML =
      '<div class="rr">' +
        '<div class="a-node server"><span class="a-node-ic">🖥️</span>שרת</div>' +
        '<div class="a-node client"><span class="a-node-ic">🌐</span>דפדפן</div>' +
        '<div class="a-wire"></div>' +
        '<div class="a-packet rr-packet"></div>' +
      '</div>' +
      '<div class="a-caption"></div>';
    var packet = stage.querySelector('.rr-packet');
    var cap = stage.querySelector('.a-caption');
    var srv = stage.querySelector('.server'), cli = stage.querySelector('.client');
    var steps = [
      { pos: 'client', show: false, cls: '', text: 'GET /index.html', pulse: '', cap: 'הדפדפן רוצה לפתוח דף. הוא מתחיל בבקשת HTTP אל השרת.' },
      { pos: 'client', show: true, cls: '', text: 'GET /index.html', pulse: '', cap: 'נוצרת בקשה: "תן לי את הקובץ index.html".' },
      { pos: 'server', show: true, cls: '', text: 'GET /index.html', pulse: 'server', cap: 'הבקשה מגיעה לשרת. השרת מעבד אותה ומכין את התשובה.' },
      { pos: 'server', show: true, cls: 'res', text: '200 OK · HTML', pulse: 'server', cap: 'השרת בונה תשובה: קוד 200 (הצלחה) יחד עם ה-HTML.' },
      { pos: 'client', show: true, cls: 'res', text: '200 OK · HTML', pulse: 'client', cap: 'התשובה חוזרת לדפדפן דרך אותו חיבור.' },
      { pos: 'client', show: false, cls: 'res', text: '', pulse: 'client', cap: 'הדפדפן מקבל את ה-HTML, בונה את הדף (DOM) ומציג אותו. סיימנו!' }
    ];
    WAG.stepPlayer(ctrls, steps.length, function (i, anim) {
      var s = steps[i];
      packet.className = 'a-packet rr-packet ' + s.cls;
      packet.textContent = s.text;
      packet.style.opacity = s.show ? '1' : '0';
      packet.style.left = s.pos === 'client' ? '68%' : '10%';
      cap.textContent = s.cap;
      srv.classList.toggle('pulse', anim && s.pulse === 'server');
      cli.classList.toggle('pulse', anim && s.pulse === 'client');
    }, { delay: 1700 });
  });

  /* ---------- 2. event loop ---------- */
  WAG.registerAnim('event-loop', function (stage, ctrls) {
    stage.innerHTML =
      '<div class="el-code"></div>' +
      '<div class="el">' +
        col('stack', '📚 Call Stack') + col('webapi', '🌐 Web APIs') + col('micro', '⚡ Microtask Q') + col('cbq', '⏰ Callback Q') +
      '</div>' +
      '<div class="el-outrow"><span class="el-outlabel">🖨️ פלט:</span><div class="el-out"></div></div>' +
      '<div class="a-caption"></div>';
    function col(k, t) { return '<div class="el-col" data-col="' + k + '"><div class="el-h">' + t + '</div><div class="el-items"></div></div>'; }
    stage.querySelector('.el-code').innerHTML = WAG.buildPre(
      "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C'));\nconsole.log('D');", 'js', { numbered: true });
    var lines = stage.querySelectorAll('.el-code .ln');
    var cols = { stack: stage.querySelector('[data-col=stack] .el-items'), webapi: stage.querySelector('[data-col=webapi] .el-items'), micro: stage.querySelector('[data-col=micro] .el-items'), cbq: stage.querySelector('[data-col=cbq] .el-items') };
    var out = stage.querySelector('.el-out'), cap = stage.querySelector('.a-caption');

    var S = [
      { line: 1, stack: ['main()'], cap: 'התוכנית מתחילה. main נכנס למחסנית (Call Stack).' },
      { line: 1, stack: ['main()', "console.log('A')"], glow: 'stack', cap: "console.log('A') נכנס למחסנית ורץ." },
      { line: 1, stack: ['main()'], out: ['A'], cap: "מדפיס A ויוצא מהמחסנית." },
      { line: 2, stack: ['main()', 'setTimeout(...)'], webapi: ['timer: ()=>log(B)'], glow: 'webapi', cap: 'setTimeout לא מחכה. הוא מוסר את ה-callback ל-Web API (טיימר) וחוזר מיד.' },
      { line: 2, stack: ['main()'], webapi: ['timer: ()=>log(B)'], out: ['A'], cap: 'המחסנית ממשיכה. הטיימר סופר ברקע (גם עם 0ms).' },
      { line: 3, stack: ['main()', 'Promise.then(...)'], webapi: [], cbq: ['()=>log(B)'], micro: ['()=>log(C)'], glow: 'micro', cap: 'הטיימר הסתיים, ה-callback שלו עבר ל-Callback Queue. ה-then של ה-Promise נכנס ל-Microtask Queue.' },
      { line: 4, stack: ['main()', "console.log('D')"], cbq: ['()=>log(B)'], micro: ['()=>log(C)'], glow: 'stack', cap: "console.log('D') רץ." },
      { line: 4, stack: ['main()'], out: ['A', 'D'], cbq: ['()=>log(B)'], micro: ['()=>log(C)'], cap: 'מדפיס D.' },
      { line: null, stack: [], out: ['A', 'D'], cbq: ['()=>log(B)'], micro: ['()=>log(C)'], cap: 'main הסתיים, המחסנית ריקה. עכשיו ה-Event Loop נכנס לפעולה.' },
      { line: null, stack: ['()=>log(C)'], out: ['A', 'D'], cbq: ['()=>log(B)'], micro: [], glow: 'micro', cap: 'חוק הזהב: קודם מרוקנים את כל ה-Microtask Queue. ה-then נכנס למחסנית.' },
      { line: null, stack: [], out: ['A', 'D', 'C'], cbq: ['()=>log(B)'], micro: [], cap: 'מדפיס C. ה-Microtask Queue התרוקן.' },
      { line: null, stack: ['()=>log(B)'], out: ['A', 'D', 'C'], cbq: [], glow: 'cbq', cap: 'רק עכשיו ניגשים ל-Callback Queue. ה-callback של setTimeout נכנס למחסנית.' },
      { line: null, stack: [], out: ['A', 'D', 'C', 'B'], cap: 'מדפיס B. הסדר הסופי: A, D, C, B. שים לב ש-C (Promise) הקדים את B (setTimeout)!' }
    ];
    WAG.stepPlayer(ctrls, S.length, function (i, anim) {
      var s = S[i];
      lines.forEach(function (ln) { ln.classList.remove('active'); });
      if (s.line && lines[s.line - 1]) lines[s.line - 1].classList.add('active');
      cols.stack.innerHTML = chips(s.stack);
      cols.webapi.innerHTML = chips(s.webapi || []);
      cols.micro.innerHTML = chips(s.micro || [], 'micro');
      cols.cbq.innerHTML = chips(s.cbq || []);
      out.innerHTML = (s.out || []).map(function (o) { return '<span class="el-o">' + WAG.escapeHTML(o) + '</span>'; }).join('') || '<span class="el-empty">—</span>';
      cap.textContent = s.cap;
      ['stack', 'webapi', 'micro', 'cbq'].forEach(function (k) {
        stage.querySelector('[data-col=' + k + ']').classList.toggle('active', anim && s.glow === k);
      });
    }, { delay: 1900 });
  });

  /* ---------- 3. blocking vs non-blocking ---------- */
  WAG.registerAnim('blocking-nonblocking', function (stage, ctrls) {
    var sync = ['📖 קריאת קובץ', '⏳ ממתין... (חסום)', '⏳ ממתין... (חסום)', '🖨️ הצגת הנתונים', '✅ משימות אחרות'];
    var async = ['📖 שולח בקשת קריאה', '✅ משימות אחרות (רצות!)', '✅ עוד משימות', '🖨️ callback: הצגת נתונים', '🏁 סיום'];
    stage.innerHTML =
      '<div class="bl">' +
        lane('סינכרוני (חוסם)', 'bad', sync) +
        lane('אסינכרוני (לא חוסם)', 'good', async) +
      '</div>' +
      '<div class="a-caption"></div>';
    function lane(t, cls, arr) {
      return '<div class="bl-lane ' + cls + '"><div class="bl-h">' + t + '</div>' +
        arr.map(function (x, i) { return '<div class="bl-cell" data-i="' + i + '">' + WAG.escapeHTML(x) + '</div>'; }).join('') + '</div>';
    }
    var caps = [
      'שני המודלים מתחילים לקרוא קובץ מהדיסק.',
      'הבדל מרכזי: בסינכרוני ה-thread חסום וממתין לדיסק. באסינכרוני ה-thread ממשיך לעבוד על משימות אחרות.',
      'הזמן חולף. הסינכרוני עדיין תקוע. האסינכרוני כבר ביצע כמה משימות.',
      'הקובץ מוכן. הסינכרוני סוף-סוף מציג. באסינכרוני ה-callback רץ עכשיו כשהנתונים חזרו.',
      'האסינכרוני ניצל את זמן ההמתנה וסיים מוקדם יותר. זה הרעיון של Node.js!'
    ];
    var cells = stage.querySelectorAll('.bl-cell');
    var cap = stage.querySelector('.a-caption');
    WAG.stepPlayer(ctrls, 5, function (i) {
      cells.forEach(function (c) { c.classList.remove('active', 'past'); if (+c.dataset.i < i) c.classList.add('past'); });
      stage.querySelectorAll('[data-i="' + i + '"]').forEach(function (c) { c.classList.add('active'); });
      cap.textContent = caps[i];
    }, { delay: 1700 });
  });

  /* ---------- 4. DOM build ---------- */
  WAG.registerAnim('dom-build', function (stage, ctrls) {
    stage.innerHTML =
      '<div class="db-split"><div class="db-code"></div>' +
      '<div class="db-tree">' +
        '<div class="dn" data-n="0">📄 document' +
          '<div class="dn" data-n="1">&lt;html&gt;' +
            '<div class="dn" data-n="2">&lt;head&gt;<div class="dn" data-n="3">&lt;title&gt; "אתר"</div></div>' +
            '<div class="dn" data-n="4">&lt;body&gt;' +
              '<div class="dn" data-n="5">&lt;h1&gt; "שלום"</div>' +
              '<div class="dn" data-n="6">&lt;p&gt; "טקסט"</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div></div>' +
      '<div class="a-caption"></div>';
    stage.querySelector('.db-code').innerHTML = WAG.buildPre(
      '<html>\n  <head>\n    <title>אתר</title>\n  </head>\n  <body>\n    <h1>שלום</h1>\n    <p>טקסט</p>\n  </body>\n</html>', 'markup', { numbered: true });
    var lines = stage.querySelectorAll('.db-code .ln');
    var nodes = stage.querySelectorAll('.dn');
    var cap = stage.querySelector('.a-caption');
    var steps = [
      { reveal: 0, line: null, cap: 'הדפדפן מקבל טקסט HTML וקורא אותו מלמעלה למטה. הוא בונה עץ אובייקטים בזיכרון, ה-DOM. השורש הוא document.' },
      { reveal: 1, line: 1, cap: 'תגית <html> היא השורש של המסמך. נוצר עבורה node.' },
      { reveal: 2, line: 2, cap: 'בתוך <html> יש <head> שמכיל מידע על הדף.' },
      { reveal: 3, line: 3, cap: '<title> נכנס כ-node בן של <head>, עם טקסט "אתר".' },
      { reveal: 4, line: 5, cap: '<body> הוא האזור שמוצג למשתמש. נוצר node נוסף מתחת ל-<html>.' },
      { reveal: 5, line: 6, cap: 'הכותרת <h1> נכנסת כ-node בן של <body>, עם הטקסט "שלום".' },
      { reveal: 6, line: 7, cap: 'הפסקה <p> נכנסת כ-node אחרון. העץ מוכן, והדפדפן מצייר אותו על המסך.' }
    ];
    WAG.stepPlayer(ctrls, steps.length, function (i) {
      var s = steps[i];
      nodes.forEach(function (n) { n.classList.toggle('show', +n.dataset.n <= s.reveal); n.classList.toggle('just', +n.dataset.n === s.reveal); });
      lines.forEach(function (ln) { ln.classList.remove('active'); });
      if (s.line && lines[s.line - 1]) lines[s.line - 1].classList.add('active');
      cap.textContent = s.cap;
    }, { delay: 1700 });
  });

  /* ---------- 5. box model (interactive) ---------- */
  WAG.registerAnim('box-model', function (stage, ctrls) {
    stage.innerHTML =
      '<div class="bm-wrap">' +
        '<div class="bm-visual">' +
          '<div class="bm-margin"><span class="bm-tag">margin</span>' +
            '<div class="bm-border"><span class="bm-tag">border</span>' +
              '<div class="bm-padding"><span class="bm-tag">padding</span>' +
                '<div class="bm-content">content<br><span class="bm-size"></span></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="bm-controls">' +
          slider('width', 'רוחב התוכן', 40, 240, 120, 'px') +
          slider('padding', 'padding', 0, 40, 16, 'px') +
          slider('border', 'border', 0, 20, 6, 'px') +
          slider('margin', 'margin', 0, 40, 18, 'px') +
          '<div class="bm-total"></div>' +
        '</div>' +
      '</div>';
    function slider(id, label, min, max, val, unit) {
      return '<label class="bm-slider"><span>' + label + ' <b data-v="' + id + '">' + val + unit + '</b></span>' +
        '<input type="range" data-s="' + id + '" min="' + min + '" max="' + max + '" value="' + val + '"></label>';
    }
    var v = { width: 120, padding: 16, border: 6, margin: 18 };
    var content = stage.querySelector('.bm-content'), pad = stage.querySelector('.bm-padding'),
        bord = stage.querySelector('.bm-border'), marg = stage.querySelector('.bm-margin');
    var sizeEl = stage.querySelector('.bm-size'), totalEl = stage.querySelector('.bm-total');
    function apply() {
      content.style.width = v.width + 'px';
      pad.style.padding = v.padding + 'px';
      bord.style.borderWidth = v.border + 'px';
      marg.style.padding = v.margin + 'px';
      var box = v.width + 2 * v.padding + 2 * v.border;
      var total = box + 2 * v.margin;
      sizeEl.textContent = v.width + '×' + v.width + 'px';
      totalEl.innerHTML = 'רוחב הקופסה (בלי margin) = <b>' + box + 'px</b> · שטח כולל = <b>' + total + 'px</b>';
      stage.querySelectorAll('[data-v]').forEach(function (b) { b.textContent = v[b.dataset.v] + 'px'; });
    }
    stage.querySelectorAll('input[data-s]').forEach(function (inp) {
      inp.addEventListener('input', function () { v[inp.dataset.s] = +inp.value; apply(); });
    });
    apply();
    ctrls.remove();
  });

  /* ---------- 6. selector match (interactive, real querySelectorAll) ---------- */
  WAG.registerAnim('selector-match', function (stage, ctrls) {
    var sampleHTML =
      '<div id="main" class="box">' +
        '<h2>כותרת</h2>' +
        '<p class="lead">פסקה ראשונה</p>' +
        '<p>פסקה שנייה</p>' +
        '<ul>' +
          '<li>פריט 1</li><li class="hot">פריט 2</li><li>פריט 3</li>' +
        '</ul>' +
        '<a href="#">קישור</a>' +
      '</div>';
    var selectors = ['p', '.lead', '#main', 'ul li', 'li.hot', 'li:first-child', 'p, a'];
    stage.innerHTML =
      '<div class="sm-row">' +
        '<div class="sm-selectors">' +
          '<div class="sm-label">בחר selector:</div>' +
          selectors.map(function (s, i) { return '<button class="sm-chip' + (i === 0 ? ' active' : '') + '" type="button" data-sel="' + WAG.escapeHTML(s) + '">' + WAG.escapeHTML(s) + '</button>'; }).join('') +
        '</div>' +
        '<div class="sm-sample-wrap"><div class="sm-count"></div><div class="sm-sample">' + sampleHTML + '</div></div>' +
      '</div>';
    var sample = stage.querySelector('.sm-sample');
    var countEl = stage.querySelector('.sm-count');
    function run(sel) {
      sample.querySelectorAll('.sm-hit').forEach(function (e) { e.classList.remove('sm-hit'); });
      var hits = [];
      try { hits = sample.querySelectorAll(sel); } catch (e) { countEl.textContent = 'selector לא תקין'; return; }
      hits.forEach(function (e) { e.classList.add('sm-hit'); });
      countEl.innerHTML = 'ה-selector <code>' + WAG.escapeHTML(sel) + '</code> תפס <b>' + hits.length + '</b> אלמנטים (המודגשים).';
    }
    stage.querySelectorAll('.sm-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        stage.querySelectorAll('.sm-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        run(btn.dataset.sel);
      });
    });
    run(selectors[0]);
    ctrls.remove();
  });

  function initAnim(el) {
    if (el.dataset.ready) return; el.dataset.ready = '1';
    el.classList.add('anim-wrap');
    var name = el.dataset.anim, title = el.dataset.title || '';
    el.innerHTML = (title ? '<div class="anim-head"><span class="an-title">' + WAG.escapeHTML(title) + '</span></div>' : '') +
      '<div class="anim-stage"></div><div class="anim-ctrls"></div>';
    var stage = el.querySelector('.anim-stage'), ctrls = el.querySelector('.anim-ctrls');
    var fn = WAG.anims[name];
    if (fn) fn(stage, ctrls, el.dataset); else stage.textContent = 'animation: ' + name;
  }
  WAG.initAnims = function (root) { (root || document).querySelectorAll('.anim[data-anim]').forEach(initAnim); };
  document.addEventListener('DOMContentLoaded', function () { WAG.initAnims(document); });
})();
