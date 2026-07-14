/* ============================================================
   highlight.js — dependency-free syntax highlighter (js/markup/css/json/bash)
   Emits per-line, per-token spans so the stepper can address lines.
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  function esc(s) {
    return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
  }

  /* sticky-regex pattern sets, tried in order at each cursor position */
  var GRAMMAR = {
    js: [
      ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ['string', /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/y],
      ['number', /\b0[xX][\da-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
      ['boolean', /\b(?:true|false|null|undefined|NaN)\b/y],
      ['keyword', /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|super|this|typeof|instanceof|in|of|await|async|yield|throw|try|catch|finally|delete|void|import|export|from|as|default)\b/y],
      ['function', /[A-Za-z_$][\w$]*(?=\s*\()/y],
      ['operator', /=>|===|!==|==|!=|<=|>=|&&|\|\||\+\+|--|[-+*/%=<>!&|^~?]/y],
      ['punct', /[{}()[\];,.:]/y],
      [null, /[A-Za-z_$][\w$]*/y],
      [null, /\s+|[\s\S]/y]
    ],
    markup: [
      ['comment', /<!--[\s\S]*?-->/y],
      ['doctype', /<!DOCTYPE[^>]*>/iy],
      ['tag', /<\/?[a-zA-Z][\w-]*/y],
      ['string', /"[^"]*"|'[^']*'/y],
      ['attr', /[a-zA-Z_:][\w:.-]*(?=\s*=)/y],
      ['number', /&[a-zA-Z#][\w]*;/y],
      ['punct', /\/?>/y],
      [null, /\s+|[^<]+|[\s\S]/y]
    ],
    css: [
      ['comment', /\/\*[\s\S]*?\*\//y],
      ['string', /"[^"]*"|'[^']*'/y],
      ['keyword', /@[\w-]+|::?[\w-]+/y],
      ['number', /#[0-9a-fA-F]{3,8}\b|\b-?\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|fr|deg|pt)?\b/y],
      ['attr', /[.#][\w-]+/y],
      ['property', /[a-zA-Z-]+(?=\s*:)/y],
      ['punct', /[{}();:,>+~*]/y],
      [null, /\s+|[\s\S]/y]
    ],
    json: [
      ['comment', /\/\/[^\n]*/y],
      ['property', /"(?:\\.|[^"\\])*"(?=\s*:)/y],
      ['string', /"(?:\\.|[^"\\])*"/y],
      ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
      ['boolean', /\b(?:true|false|null)\b/y],
      ['punct', /[{}[\]:,]/y],
      [null, /\s+|[\s\S]/y]
    ],
    bash: [
      ['comment', /#[^\n]*/y],
      ['string', /"[^"]*"|'[^']*'/y],
      ['keyword', /\b(?:npm|npx|node|nodemon|git|cd|mkdir|install|run|start|init|serve|sudo)\b/y],
      ['attr', /--?[\w-]+/y],
      ['number', /\b\d+\b/y],
      ['punct', /[|&;><]/y],
      [null, /\s+|[\s\S]/y]
    ]
  };

  function langKey(lang) {
    lang = (lang || '').toLowerCase();
    if (lang === 'html' || lang === 'xml' || lang === 'ejs') return 'markup';
    if (lang === 'javascript' || lang === 'jsx' || lang === 'node') return 'js';
    if (lang === 'sh' || lang === 'shell' || lang === 'console') return 'bash';
    if (GRAMMAR[lang]) return lang;
    return 'js';
  }

  /* -> array of {type, text} */
  function tokenize(code, lang) {
    var patterns = GRAMMAR[langKey(lang)];
    var toks = [], i = 0, n = code.length, guard = 0;
    while (i < n && guard++ < 200000) {
      var hit = null;
      for (var p = 0; p < patterns.length; p++) {
        var re = patterns[p][1]; re.lastIndex = i;
        var m = re.exec(code);
        if (m && m.index === i && m[0].length > 0) { hit = { type: patterns[p][0], text: m[0] }; break; }
      }
      if (!hit) { hit = { type: null, text: code[i] }; }
      toks.push(hit); i += hit.text.length;
    }
    return toks;
  }

  function tokenSpan(t) {
    return t.type ? '<span class="tok-' + t.type + '">' + esc(t.text) + '</span>' : esc(t.text);
  }

  /* -> array of line HTML strings (multi-line tokens split correctly) */
  function codeToLines(code, lang) {
    var toks = tokenize(code, lang);
    var lines = [''];
    toks.forEach(function (tok) {
      var parts = tok.text.split('\n');
      parts.forEach(function (part, idx) {
        if (idx > 0) lines.push('');
        if (part) lines[lines.length - 1] += tokenSpan({ type: tok.type, text: part });
      });
    });
    return lines;
  }
  WAG.codeToLines = codeToLines;

  /* build a full <pre class="hl"> markup string */
  WAG.buildPre = function (code, lang, opts) {
    opts = opts || {};
    var lines = codeToLines(code, lang);
    var body = lines.map(function (l, i) {
      var cls = 'ln';
      if (opts.active != null && (i + 1) === opts.active) cls += ' active';
      return '<span class="' + cls + '" data-line="' + (i + 1) + '">' + (l || ' ') + '</span>';
    }).join('');
    var cls = 'hl' + (opts.numbered !== false ? ' numbered' : '');
    return '<pre class="' + cls + '"><code>' + body + '</code></pre>';
  };

  /* header (traffic dots + lang + optional file + copy) */
  function headHTML(lang, file) {
    return '<div class="code-head">' +
      '<span class="dots"><i></i><i></i><i></i></span>' +
      '<span class="lang">' + esc(lang || '') + '</span>' +
      (file ? '<span class="file">' + esc(file) + '</span>' : '') +
      '<button class="copy-btn" type="button" aria-label="העתק קוד">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>' +
        '<span class="ct">העתק</span>' +
      '</button>' +
    '</div>';
  }

  function attachCopy(block, raw) {
    var btn = block.querySelector('.copy-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var done = function () {
        btn.classList.add('done');
        btn.querySelector('.ct').textContent = 'הועתק!';
        setTimeout(function () { btn.classList.remove('done'); btn.querySelector('.ct').textContent = 'העתק'; }, 1400);
      };
      if (navigator.clipboard) { navigator.clipboard.writeText(raw).then(done, function () {}); }
      else {
        var ta = document.createElement('textarea'); ta.value = raw; document.body.appendChild(ta);
        ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} document.body.removeChild(ta);
      }
    });
  }

  /* process a .code-block: reads <script type="text/plain"> raw source */
  function processBlock(block) {
    if (block.dataset.hl) return;
    block.dataset.hl = '1';
    var src = block.querySelector('script[type="text/plain"]');
    var raw = src ? src.textContent.replace(/^\n/, '').replace(/\s+$/, '') : block.textContent;
    var lang = block.dataset.lang || 'js';
    var file = block.dataset.file || '';
    var numbered = block.dataset.numbered !== 'false';
    block.innerHTML = headHTML(lang, file) + WAG.buildPre(raw, lang, { numbered: numbered });
    attachCopy(block, raw);
  }
  WAG.processCodeBlocks = function (root) {
    (root || document).querySelectorAll('.code-block').forEach(processBlock);
  };

  document.addEventListener('DOMContentLoaded', function () { WAG.processCodeBlocks(document); });
})();
