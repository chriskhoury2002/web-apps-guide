/* ============================================================
   playground.js — live HTML/CSS/JS sandbox with console capture + reset
   Authoring: <div class="playground" data-tabs="html,css,js" data-console="true">
                <script type="text/plain" class="pg-html">...</script>
                <script type="text/plain" class="pg-css">...</script>
                <script type="text/plain" class="pg-js">...</script>
              </div>
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  var registry = []; // {id, consoleEl}
  var pgSeq = 0;
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.__wag_console) return;
    for (var i = 0; i < registry.length; i++) {
      if (registry[i].id === d.id && registry[i].consoleEl) {
        appendConsole(registry[i], d.type, d.text);
        break;
      }
    }
  });

  function appendConsole(entry, type, text) {
    var el = entry.consoleEl;
    var line = document.createElement('div');
    line.className = 'con-line' + (type === 'error' ? ' err' : type === 'warn' ? ' warn' : '');
    var pre = document.createElement('span'); pre.className = 'cprefix'; pre.textContent = '› ';
    line.appendChild(pre);
    line.appendChild(document.createTextNode(text));
    el.appendChild(line);
    el.classList.add('show');
    el.scrollTop = el.scrollHeight;
  }

  var CONSOLE_SHIM = "(function(){var ID=window.__WAG_ID;function fmt(v){try{if(typeof v==='string')return v;if(v&&v.stack&&v.message)return v.name+': '+v.message;if(typeof v==='function')return '\\u0192 '+(v.name||'anonymous');return JSON.stringify(v);}catch(e){return String(v);}}function send(t,a){try{parent.postMessage({__wag_console:1,id:ID,type:t,text:Array.prototype.map.call(a,fmt).join(' ')},'*');}catch(e){}}['log','info','warn','error','debug'].forEach(function(k){var o=console[k]?console[k].bind(console):function(){};console[k]=function(){send(k,arguments);o.apply(console,arguments);};});window.addEventListener('error',function(e){send('error',[(e.message||'Error')]);});window.addEventListener('unhandledrejection',function(e){send('error',['Uncaught (in promise) '+((e.reason&&e.reason.message)||e.reason)]);});})();";

  function readPane(pg, cls) {
    var s = pg.querySelector('script.pg-' + cls);
    return s ? s.textContent.replace(/^\n/, '').replace(/\s+$/, '') : '';
  }

  function buildDoc(src, withConsole, id) {
    return '<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8">' +
      '<style>*{box-sizing:border-box}body{font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6;margin:14px;color:#15181f}' +
      (src.css || '') + '</style></head><body>' + (src.html || '') +
      (withConsole ? '<script>window.__WAG_ID=' + id + ';' + CONSOLE_SHIM + '<\/script>' : '') +
      (src.js ? '<script>' + src.js + '<\/script>' : '') +
      '</body></html>';
  }

  function icon(name) {
    var svg = {
      reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
      run: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
      term: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6l6 6-6 6"/><path d="M12 18h8"/></svg>'
    };
    return svg[name] || '';
  }

  function init(pg) {
    if (pg.dataset.ready) return;
    pg.dataset.ready = '1';

    var tabs = (pg.dataset.tabs || 'html,css,js').split(',').map(function (s) { return s.trim(); });
    var withConsole = pg.dataset.console === 'true' || tabs.indexOf('js') > -1;
    var sandbox = pg.dataset.sandbox || 'allow-scripts allow-modals';
    var previewLabel = pg.dataset.previewLabel || 'תצוגה חיה';

    var orig = { html: readPane(pg, 'html'), css: readPane(pg, 'css'), js: readPane(pg, 'js') };
    var labels = { html: 'HTML', css: 'CSS', js: 'JS' };
    var activeIdx = tabs.indexOf(pg.dataset.active); if (activeIdx < 0) activeIdx = 0;

    var tabsHTML = tabs.map(function (t, i) {
      return '<button class="pg-tab' + (i === activeIdx ? ' active' : '') + '" data-t="' + t + '" type="button">' + labels[t] + '</button>';
    }).join('');
    var editorsHTML = tabs.map(function (t, i) {
      return '<textarea class="pg-editor' + (i === activeIdx ? ' active' : '') + '" data-t="' + t + '" spellcheck="false" wrap="off"></textarea>';
    }).join('');

    pg.innerHTML =
      '<div class="pg-bar">' +
        '<div class="pg-tabs">' + tabsHTML + '</div>' +
        '<div class="pg-actions">' +
          (withConsole ? '<button class="btn sm ghost pg-con-btn" type="button" title="קונסול">' + icon('term') + '</button>' : '') +
          '<button class="btn sm ghost pg-run" type="button">' + icon('run') + ' הרץ</button>' +
          '<button class="btn sm ghost pg-reset" type="button">' + icon('reset') + ' אפס</button>' +
        '</div>' +
      '</div>' +
      '<div class="pg-body">' +
        '<div class="pg-editors">' + editorsHTML + '</div>' +
        '<div class="pg-preview-wrap">' +
          '<span class="pg-preview-label">' + previewLabel + '</span>' +
          '<iframe class="pg-preview" title="תצוגה מקדימה" sandbox="' + sandbox + '"></iframe>' +
        '</div>' +
      '</div>' +
      (withConsole ?
        '<div class="pg-console-head">קונסול <button class="clear" type="button">נקה</button></div>' +
        '<div class="pg-console"></div>' : '');

    var editors = {};
    pg.querySelectorAll('.pg-editor').forEach(function (ta) {
      editors[ta.dataset.t] = ta;
      ta.value = orig[ta.dataset.t] || '';
      ta.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') { e.preventDefault(); insertTab(ta); }
      });
      ta.addEventListener('input', schedule);
    });

    var iframe = pg.querySelector('.pg-preview');
    var consoleEl = pg.querySelector('.pg-console');
    var entry = { id: ++pgSeq, consoleEl: consoleEl };
    registry.push(entry);

    // tabs
    pg.querySelectorAll('.pg-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        pg.querySelectorAll('.pg-tab').forEach(function (b) { b.classList.remove('active'); });
        pg.querySelectorAll('.pg-editor').forEach(function (e) { e.classList.remove('active'); });
        btn.classList.add('active');
        editors[btn.dataset.t].classList.add('active');
        editors[btn.dataset.t].focus();
      });
    });

    // actions
    pg.querySelector('.pg-reset').addEventListener('click', function () {
      tabs.forEach(function (t) { if (editors[t]) editors[t].value = orig[t] || ''; });
      if (consoleEl) consoleEl.innerHTML = '';
      rebuild();
      var b = pg.querySelector('.pg-reset'); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    });
    pg.querySelector('.pg-run').addEventListener('click', function () { if (consoleEl) consoleEl.innerHTML = ''; rebuild(); });
    if (withConsole) {
      pg.querySelector('.pg-con-btn').addEventListener('click', function () { consoleEl.classList.toggle('show'); });
      pg.querySelector('.pg-console-head .clear').addEventListener('click', function () { consoleEl.innerHTML = ''; });
    }

    var timer = null;
    function schedule() { clearTimeout(timer); timer = setTimeout(rebuild, 380); }
    function rebuild() {
      var src = {
        html: editors.html ? editors.html.value : orig.html,
        css: editors.css ? editors.css.value : orig.css,
        js: editors.js ? editors.js.value : orig.js
      };
      iframe.srcdoc = buildDoc(src, withConsole, entry.id);
      iframe.onload = function () {
        pg.dispatchEvent(new CustomEvent('pg:render', { detail: { iframe: iframe } }));
      };
    }
    rebuild();
  }

  function insertTab(ta) {
    var s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(e);
    ta.selectionStart = ta.selectionEnd = s + 2;
    ta.dispatchEvent(new Event('input'));
  }

  WAG.initPlaygrounds = function (root) { (root || document).querySelectorAll('.playground').forEach(init); };
  document.addEventListener('DOMContentLoaded', function () { WAG.initPlaygrounds(document); });
})();
