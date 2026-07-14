/* ============================================================
   livedemo.js — read-only "code + result" for a single HTML snippet
   (inline <style>/<script> allowed). "ערוך" upgrades it to a playground.
   Authoring: <div class="livedemo" data-title="..." data-editable="true">
                <script type="text/plain">...html...</script>
              </div>
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  function init(ld) {
    if (ld.dataset.ready) return;
    ld.dataset.ready = '1';
    var src = ld.querySelector('script[type="text/plain"]');
    var raw = src ? src.textContent.replace(/^\n/, '').replace(/\s+$/, '') : '';
    var lang = ld.dataset.lang || 'markup';
    var title = ld.dataset.title || 'דוגמה חיה';
    var editable = ld.dataset.editable !== 'false';
    var sandbox = ld.dataset.sandbox || 'allow-scripts allow-modals';

    var editBtn = editable ?
      '<button class="btn sm ghost ld-edit" type="button">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg> ערוך</button>' : '';

    ld.innerHTML =
      '<div class="ld-bar"><span class="ld-title">▸ ' + WAG.escapeHTML(title) + '</span>' + editBtn + '</div>' +
      '<div class="ld-body">' +
        '<div class="ld-code">' + WAG.buildPre(raw, lang, { numbered: false }) + '</div>' +
        '<div class="ld-result"><iframe title="תוצאה" sandbox="' + sandbox + '"></iframe></div>' +
      '</div>';

    var iframe = ld.querySelector('iframe');
    iframe.srcdoc = doc(raw);

    if (editable) {
      ld.querySelector('.ld-edit').addEventListener('click', function () {
        var pg = document.createElement('div');
        pg.className = 'playground';
        pg.setAttribute('data-tabs', 'html');
        pg.setAttribute('data-sandbox', sandbox);
        pg.setAttribute('data-preview-label', 'תוצאה');
        var s = document.createElement('script');
        s.type = 'text/plain'; s.className = 'pg-html'; s.textContent = '\n' + raw;
        pg.appendChild(s);
        ld.replaceWith(pg);
        WAG.initPlaygrounds(pg.parentNode || document);
      });
    }
  }

  function doc(html) {
    return '<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8">' +
      '<style>*{box-sizing:border-box}body{font-family:system-ui,Segoe UI,Arial,sans-serif;line-height:1.6;margin:14px;color:#15181f}</style>' +
      '</head><body>' + html + '</body></html>';
  }

  WAG.initLiveDemos = function (root) { (root || document).querySelectorAll('.livedemo').forEach(init); };
  document.addEventListener('DOMContentLoaded', function () { WAG.initLiveDemos(document); });
})();
