/* ============================================================
   animations-extra.js — additional concept animations
   (loaded on topics 05, 08, 12, 13, 14). Depends on animations.js.
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  function seg(label, prop, opts, cur) {
    return '<div class="seg"><span class="seg-label">' + label + '</span><div class="seg-btns">' +
      opts.map(function (o) { return '<button class="seg-btn' + (o === cur ? ' active' : '') + '" type="button" data-prop="' + prop + '" data-val="' + o + '">' + o + '</button>'; }).join('') +
      '</div></div>';
  }

  /* ---------- Flexbox (interactive) ---------- */
  WAG.registerAnim('flexbox', function (stage, ctrls) {
    var st = { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'stretch', flexWrap: 'nowrap' };
    stage.innerHTML =
      '<div class="fx-container" id="fxc">' +
        '<div class="fx-item">1</div><div class="fx-item">2</div><div class="fx-item">3</div>' +
      '</div>' +
      '<div class="seg-wrap">' +
        seg('flex-direction', 'flexDirection', ['row', 'row-reverse', 'column'], 'row') +
        seg('justify-content', 'justifyContent', ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'], 'flex-start') +
        seg('align-items', 'alignItems', ['stretch', 'flex-start', 'center', 'flex-end'], 'stretch') +
        seg('flex-wrap', 'flexWrap', ['nowrap', 'wrap'], 'nowrap') +
      '</div>' +
      '<div class="an-css"></div>';
    var c = stage.querySelector('#fxc'), css = stage.querySelector('.an-css');
    function apply() {
      Object.keys(st).forEach(function (k) { c.style[k] = st[k]; });
      css.innerHTML = WAG.buildPre('.container {\n  display: flex;\n  flex-direction: ' + st.flexDirection + ';\n  justify-content: ' + st.justifyContent + ';\n  align-items: ' + st.alignItems + ';\n  flex-wrap: ' + st.flexWrap + ';\n}', 'css', { numbered: false });
    }
    stage.querySelectorAll('.seg-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        st[b.dataset.prop] = b.dataset.val;
        b.parentNode.querySelectorAll('.seg-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active'); apply();
      });
    });
    apply(); ctrls.remove();
  });

  /* ---------- Grid (interactive) ---------- */
  WAG.registerAnim('grid', function (stage, ctrls) {
    var st = { cols: '3', gap: '10' };
    stage.innerHTML =
      '<div class="gr-container" id="grc">' +
        [1, 2, 3, 4, 5, 6].map(function (n) { return '<div class="gr-item">' + n + '</div>'; }).join('') +
      '</div>' +
      '<div class="seg-wrap">' +
        seg('מספר עמודות', 'cols', ['2', '3', '4', '6'], '3') +
        seg('gap', 'gap', ['0', '10', '20'], '10') +
      '</div>' +
      '<div class="an-css"></div>';
    var c = stage.querySelector('#grc'), css = stage.querySelector('.an-css');
    function apply() {
      c.style.gridTemplateColumns = 'repeat(' + st.cols + ', 1fr)';
      c.style.gap = st.gap + 'px';
      css.innerHTML = WAG.buildPre('.container {\n  display: grid;\n  grid-template-columns: repeat(' + st.cols + ', 1fr);\n  gap: ' + st.gap + 'px;\n}', 'css', { numbered: false });
    }
    stage.querySelectorAll('.seg-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        st[b.dataset.prop] = b.dataset.val;
        b.parentNode.querySelectorAll('.seg-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active'); apply();
      });
    });
    apply(); ctrls.remove();
  });

  /* ---------- Cookie mechanism (6 steps) ---------- */
  WAG.registerAnim('cookie-flow', function (stage, ctrls) {
    stage.innerHTML =
      '<div class="rr">' +
        '<div class="a-node server"><span class="a-node-ic">🖥️</span>שרת<div class="store" data-srv></div></div>' +
        '<div class="a-node client"><span class="a-node-ic">🌐</span>דפדפן<div class="store" data-cli></div></div>' +
        '<div class="a-wire"></div>' +
        '<div class="a-packet cookie rr-packet"></div>' +
      '</div>' +
      '<div class="a-caption"></div>';
    var pk = stage.querySelector('.rr-packet'), cap = stage.querySelector('.a-caption');
    var srv = stage.querySelector('[data-srv]'), cli = stage.querySelector('[data-cli]');
    var S = [
      { p: false, pos: 'server', t: '', srv: '', cli: '', pulse: 'server', c: 'הלקוח מבקש דף. השרת יוצר מידע (עוגייה) שהוא רוצה שהלקוח יזכור.' },
      { p: true, pos: 'server', t: 'Set-Cookie: id=42', srv: '🍪', cli: '', pulse: 'server', c: 'השרת שולח את העוגייה בכותרת התגובה "Set-Cookie".' },
      { p: true, pos: 'client', t: 'Set-Cookie: id=42', srv: '', cli: '', pulse: 'client', c: 'העוגייה נוסעת ללקוח.' },
      { p: false, pos: 'client', t: '', srv: '', cli: '🍪', pulse: 'client', c: 'הלקוח שומר את העוגייה אצלו.' },
      { p: true, pos: 'client', t: 'Cookie: id=42', srv: '', cli: '🍪', pulse: 'client', c: 'בכל בקשה הבאה, הלקוח בודק אם יש עוגייה מתאימה ושולח אותה חזרה בכותרת "Cookie".' },
      { p: true, pos: 'server', t: 'Cookie: id=42', srv: '🍪', cli: '🍪', pulse: 'server', c: 'השרת מקבל את העוגייה מהבקשה ומשתמש בה כדי "לזכור" את הלקוח.' }
    ];
    WAG.stepPlayer(ctrls, S.length, function (i, anim) {
      var s = S[i];
      pk.textContent = s.t; pk.style.opacity = s.p ? '1' : '0';
      pk.style.left = s.pos === 'client' ? '66%' : '10%';
      srv.textContent = s.srv; cli.textContent = s.cli;
      cap.textContent = s.c;
      stage.querySelector('.server').classList.toggle('pulse', anim && s.pulse === 'server');
      stage.querySelector('.client').classList.toggle('pulse', anim && s.pulse === 'client');
    }, { delay: 1800 });
  });

  /* ---------- Session mechanism (4 steps) ---------- */
  WAG.registerAnim('session-flow', function (stage, ctrls) {
    stage.innerHTML =
      '<div class="rr">' +
        '<div class="a-node server"><span class="a-node-ic">🖥️</span>שרת<div class="store" data-srv></div></div>' +
        '<div class="a-node client"><span class="a-node-ic">🌐</span>דפדפן<div class="store" data-cli></div></div>' +
        '<div class="a-wire"></div>' +
        '<div class="a-packet rr-packet"></div>' +
      '</div>' +
      '<div class="a-caption"></div>';
    var pk = stage.querySelector('.rr-packet'), cap = stage.querySelector('.a-caption');
    var srv = stage.querySelector('[data-srv]'), cli = stage.querySelector('[data-cli]');
    var S = [
      { p: true, pos: 'client', t: 'בקשה ראשונה', srv: '', cli: '', pulse: 'server', c: 'הלקוח שולח בקשה ראשונה לשרת.' },
      { p: false, pos: 'server', t: '', srv: '🗄️ id:B5F3', cli: '', pulse: 'server', c: 'השרת יוצר session חדש ומקצה לו מזהה ייחודי (session ID), ושומר אצלו את המידע.' },
      { p: true, pos: 'client', t: 'session id: B5F3', srv: '🗄️ id:B5F3', cli: '', pulse: 'client', c: 'ה-ID מועבר ללקוח (בדרך כלל בעוגייה), והלקוח יחזיר אותו בכל בקשה.' },
      { p: true, pos: 'server', t: 'session id: B5F3', srv: '🗄️ id:B5F3 👤', cli: '🔑 B5F3', pulse: 'server', c: 'בכל בקשה הבאה השרת מזהה את הלקוח לפי ה-ID ומשייך אליו את המידע השמור (למשל: מחובר, שם משתמש, עגלת קניות).' }
    ];
    WAG.stepPlayer(ctrls, S.length, function (i, anim) {
      var s = S[i];
      pk.textContent = s.t; pk.style.opacity = s.p ? '1' : '0';
      pk.style.left = s.pos === 'client' ? '66%' : '10%';
      srv.textContent = s.srv; cli.textContent = s.cli;
      cap.textContent = s.c;
      stage.querySelector('.server').classList.toggle('pulse', anim && s.pulse === 'server');
      stage.querySelector('.client').classList.toggle('pulse', anim && s.pulse === 'client');
    }, { delay: 1900 });
  });

  /* ---------- REST + CRUD (interactive) ---------- */
  WAG.registerAnim('rest-crud', function (stage, ctrls) {
    var map = {
      GET: { crud: 'Read (קריאה)', sql: 'SELECT * FROM users', c: 'GET מבקש לקרוא נתונים מהשרת.' },
      POST: { crud: 'Create (יצירה)', sql: 'INSERT INTO users ...', c: 'POST יוצר רשומה חדשה.' },
      PUT: { crud: 'Update (עדכון)', sql: 'UPDATE users SET ...', c: 'PUT מעדכן רשומה קיימת.' },
      DELETE: { crud: 'Delete (מחיקה)', sql: 'DELETE FROM users ...', c: 'DELETE מוחק רשומה.' }
    };
    stage.innerHTML =
      '<div class="rc-methods">' +
        Object.keys(map).map(function (m, i) { return '<button class="rc-btn ' + m + (i === 0 ? ' active' : '') + '" type="button" data-m="' + m + '">' + m + '</button>'; }).join('') +
      '</div>' +
      '<div class="rc-flow">' +
        '<div class="a-node db"><span class="a-node-ic">🗄️</span>DB</div>' +
        '<div class="a-node server"><span class="a-node-ic">🖥️</span>שרת (API)</div>' +
        '<div class="a-node client"><span class="a-node-ic">📱</span>לקוח</div>' +
      '</div>' +
      '<div class="rc-info"></div>' +
      '<div class="an-css"></div>' +
      '<div class="a-caption"></div>';
    var info = stage.querySelector('.rc-info'), css = stage.querySelector('.an-css'), cap = stage.querySelector('.a-caption');
    function show(m) {
      var d = map[m];
      info.innerHTML = '<b class="rc-m ' + m + '">' + m + '</b> ⇐⇒ <b>' + d.crud + '</b>';
      css.innerHTML = WAG.buildPre(d.sql, 'js', { numbered: false });
      cap.textContent = d.c;
      stage.querySelectorAll('.rc-flow .a-node').forEach(function (n) { n.classList.remove('pulse'); void n.offsetWidth; n.classList.add('pulse'); });
    }
    stage.querySelectorAll('.rc-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        stage.querySelectorAll('.rc-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active'); show(b.dataset.m);
      });
    });
    show('GET'); ctrls.remove();
  });

  /* ---------- Emmet expander (interactive) ---------- */
  var VOID = { br: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1 };
  function expandEmmet(abbr) {
    var pos = 0;
    function atom() {
      var m = /^([a-zA-Z][\w-]*)?((?:[.#][\w$-]+)*)/.exec(abbr.slice(pos));
      pos += m[0].length;
      var tag = m[1] || 'div', classes = [], id = null;
      (m[2].match(/[.#][\w$-]+/g) || []).forEach(function (s) { if (s[0] === '.') classes.push(s.slice(1)); else id = s.slice(1); });
      return { tag: tag, classes: classes, id: id, children: [] };
    }
    function clone(node, k) {
      var sub = function (s) { return s.replace(/\$/g, k); };
      return { tag: sub(node.tag), classes: node.classes.map(sub), id: node.id ? sub(node.id) : null, children: node.children.map(function (c) { return clone(c, k); }) };
    }
    function item() {
      var a = atom(), count = 1;
      if (abbr[pos] === '*') { pos++; var n = /^\d+/.exec(abbr.slice(pos)); count = +n[0]; pos += n[0].length; }
      var childT = null;
      if (abbr[pos] === '>') { pos++; childT = expr(); }
      var out = [];
      for (var k = 1; k <= count; k++) {
        var node = clone(a, k);
        if (childT) node.children = childT.map(function (c) { return clone(c, k); });
        out.push(node);
      }
      return out;
    }
    function expr() {
      var nodes = item();
      while (abbr[pos] === '+') { pos++; nodes = nodes.concat(item()); }
      return nodes;
    }
    function ser(nodes, ind) {
      return nodes.map(function (n) {
        var attrs = (n.id ? ' id="' + n.id + '"' : '') + (n.classes.length ? ' class="' + n.classes.join(' ') + '"' : '');
        if (VOID[n.tag]) return ind + '<' + n.tag + attrs + '>';
        if (!n.children.length) return ind + '<' + n.tag + attrs + '></' + n.tag + '>';
        return ind + '<' + n.tag + attrs + '>\n' + ser(n.children, ind + '  ') + '\n' + ind + '</' + n.tag + '>';
      }).join('\n');
    }
    try { return ser(expr(), ''); } catch (e) { return '(אבּרוויאציה לא נתמכת)'; }
  }
  WAG.registerAnim('emmet', function (stage, ctrls) {
    var presets = ['ul>li*3', 'table>tr*2>td*3', 'div#app.box', 'div>input+button', 'nav>ul>li*4>a'];
    stage.innerHTML =
      '<div class="em-in-row"><input class="em-input" value="ul>li*3" spellcheck="false" dir="ltr" aria-label="קיצור Emmet"><span class="em-arrow">⇓</span></div>' +
      '<div class="em-presets">' + presets.map(function (p) { return '<button class="em-chip" type="button" data-p="' + WAG.escapeHTML(p) + '">' + WAG.escapeHTML(p) + '</button>'; }).join('') + '</div>' +
      '<div class="an-css em-out"></div>';
    var input = stage.querySelector('.em-input'), out = stage.querySelector('.em-out');
    function run() { out.innerHTML = WAG.buildPre(expandEmmet(input.value.trim() || 'div'), 'markup', { numbered: false }); }
    input.addEventListener('input', run);
    stage.querySelectorAll('.em-chip').forEach(function (b) { b.addEventListener('click', function () { input.value = b.dataset.p; run(); }); });
    run(); ctrls.remove();
  });

  /* ---------- EJS live renderer (interactive) ---------- */
  var ejsSeq = 0;
  var ejsListenerAdded = false;
  var ejsPanes = {};
  function ensureEjsListener() {
    if (ejsListenerAdded) return; ejsListenerAdded = true;
    window.addEventListener('message', function (e) {
      var d = e.data; if (!d || !d.__ejs) return;
      var pane = ejsPanes[d.__ejs]; if (!pane) return;
      pane.innerHTML = WAG.buildPre(d.html || '', 'markup', { numbered: false });
    });
  }
  WAG.registerAnim('ejs-render', function (stage, ctrls) {
    ensureEjsListener();
    var token = ++ejsSeq;
    var tmpl = '<ul>\n  <% users.forEach(function(u){ %>\n    <li><%= u.name %> (<%= u.age %>)</li>\n  <% }); %>\n</ul>';
    var data = '{\n  "users": [\n    { "name": "דנה", "age": 24 },\n    { "name": "יוסי", "age": 30 }\n  ]\n}';
    stage.innerHTML =
      '<div class="ejs-grid">' +
        '<div class="ejs-editors">' +
          '<label class="ejs-l">תבנית EJS</label><textarea class="ejs-tmpl" spellcheck="false" dir="ltr"></textarea>' +
          '<label class="ejs-l">נתונים (JSON)</label><textarea class="ejs-data" spellcheck="false" dir="ltr"></textarea>' +
        '</div>' +
        '<div class="ejs-right">' +
          '<label class="ejs-l">תוצאה (מה שנשלח לדפדפן)</label><iframe class="ejs-preview" title="תוצאת EJS" sandbox="allow-scripts"></iframe>' +
          '<label class="ejs-l">ה-HTML שנוצר</label><div class="an-css ejs-out"></div>' +
        '</div>' +
      '</div>';
    var ta = stage.querySelector('.ejs-tmpl'), da = stage.querySelector('.ejs-data');
    var frame = stage.querySelector('.ejs-preview'), outPane = stage.querySelector('.ejs-out');
    ejsPanes[token] = outPane;
    ta.value = tmpl; da.value = data;

    var INTERP = "function render(t,d){var c=\"var __o='';\\n\";var re=/<%([=\\-]?)([\\s\\S]*?)%>/g,last=0,m;while(m=re.exec(t)){c+='__o+='+JSON.stringify(t.slice(last,m.index))+';\\n';var op=m[1],ex=m[2];if(op==='='||op==='-')c+='__o+=('+ex+');\\n';else c+=ex+'\\n';last=m.index+m[0].length;}c+='__o+='+JSON.stringify(t.slice(last))+';\\nreturn __o;';var k=Object.keys(d),v=k.map(function(x){return d[x];});return new Function(k.join(','),c).apply(null,v);}";

    function esc(s) { return String(s).replace(/<\//g, '<\\/'); }
    function render() {
      var t = ta.value, dobj = {};
      try { dobj = JSON.parse(da.value || '{}'); } catch (e) { outPane.innerHTML = WAG.buildPre('שגיאה ב-JSON: ' + e.message, 'markup', { numbered: false }); frame.srcdoc = '<p style="color:#c00;font-family:sans-serif">שגיאה ב-JSON</p>'; return; }
      var doc = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><style>body{font-family:system-ui,Arial,sans-serif;margin:10px}</style></head><body><script>' +
        'var TMPL=' + JSON.stringify(esc(t)) + ';var DATA=' + JSON.stringify(dobj) + ';' + INTERP +
        'try{var o=render(TMPL,DATA);document.body.innerHTML=o;parent.postMessage({__ejs:' + token + ',html:o},"*");}' +
        'catch(err){document.body.innerHTML="<pre style=\\"color:#c00\\">"+err+"</pre>";parent.postMessage({__ejs:' + token + ',html:String(err)},"*");}' +
        '<\/script></body></html>';
      frame.srcdoc = doc;
    }
    var timer = null;
    function sched() { clearTimeout(timer); timer = setTimeout(render, 380); }
    ta.addEventListener('input', sched); da.addEventListener('input', sched);
    render(); ctrls.remove();
  });

  document.addEventListener('DOMContentLoaded', function () { if (WAG.initAnims) WAG.initAnims(document); });
})();
