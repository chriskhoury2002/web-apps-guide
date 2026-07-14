/* ============================================================
   quiz-engine.js — shared helpers + question-card factory
   (used by per-topic quiz-ui.js and the final exam.js)
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  WAG.mdInline = function (s) {
    s = WAG.escapeHTML(s == null ? '' : String(s));
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    return s;
  };

  var TYPE_LABEL = {
    knowledge: 'ידע', output: 'מה הפלט?', error: 'איפה השגיאה?', predict: 'מה יקרה?', concept: 'הבנה'
  };

  var Q = WAG.quiz = {
    shuffle: function (a) {
      a = a.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    },
    sample: function (a, n) { return Q.shuffle(a).slice(0, Math.min(n, a.length)); }
  };

  var KEYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

  /* build a question card.
     opts: { index, total, mode:'practice'|'exam', onAnswer(correct, chosen) }
     returns { el, reveal(), answered() } */
  WAG.buildQuestionCard = function (q, opts) {
    opts = opts || {};
    var mode = opts.mode || 'practice';
    var el = document.createElement('div');
    el.className = 'q-body q-card';

    var tag = q.type && TYPE_LABEL[q.type] ? '<span class="q-type-tag">' + TYPE_LABEL[q.type] + '</span>' : '';
    var num = opts.total ? '<div class="q-num">שאלה ' + (opts.index + 1) + ' מתוך ' + opts.total + '</div>' : '';
    var codeHTML = q.code ? '<div class="q-code">' + '<div class="code-block" data-lang="' + (q.lang || 'js') + '" data-numbered="false"></div>' + '</div>' : '';

    el.innerHTML = num +
      '<div class="q-text">' + WAG.mdInline(q.question) + tag + '</div>' +
      codeHTML +
      '<div class="q-options" role="listbox"></div>' +
      '<div class="q-explain" hidden></div>';

    // fill code block (buildPre so we control content, not innerHTML of raw)
    if (q.code) {
      var cb = el.querySelector('.code-block');
      cb.dataset.hl = '1';
      cb.innerHTML = WAG.buildPre(q.code, q.lang || 'js', { numbered: false });
    }

    // shuffle options, track correct display position
    var order = Q.shuffle(q.options.map(function (_, i) { return i; }));
    var correctPos = order.indexOf(q.correctIndex);
    var optWrap = el.querySelector('.q-options');
    var explain = el.querySelector('.q-explain');
    var chosenPos = -1, answered = false;

    order.forEach(function (origIdx, pos) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-option';
      b.setAttribute('role', 'option');
      b.innerHTML = '<span class="opt-key">' + KEYS[pos] + '</span><span class="opt-txt">' + WAG.mdInline(q.options[origIdx]) + '</span>';
      b.addEventListener('click', function () { pick(pos, b); });
      optWrap.appendChild(b);
    });

    function pick(pos, btn) {
      if (answered && mode === 'practice') return;
      chosenPos = pos;
      var buttons = optWrap.querySelectorAll('.q-option');
      if (mode === 'exam') {
        buttons.forEach(function (x) { x.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        btn.style.borderColor = 'var(--accent)';
        buttons.forEach(function (x) { if (x !== btn) x.style.borderColor = ''; });
        if (opts.onAnswer) opts.onAnswer(pos === correctPos, pos);
        return;
      }
      // practice: lock + reveal
      answered = true;
      var ok = pos === correctPos;
      buttons.forEach(function (x, i) {
        x.disabled = true;
        if (i === correctPos) x.classList.add('is-correct');
      });
      if (!ok) { btn.classList.add('is-incorrect', 'picked-wrong'); }
      else { btn.classList.add('picked-correct'); }
      showExplain(ok);
      if (opts.onAnswer) opts.onAnswer(ok, pos);
    }

    function showExplain(ok) {
      explain.hidden = false;
      explain.setAttribute('data-ok', ok ? 'yes' : 'no');
      explain.innerHTML =
        '<div class="qe-verdict">' + (ok ? '✓ תשובה נכונה' : '✗ תשובה שגויה') + '</div>' +
        '<div class="qe-text">' + WAG.mdInline(q.explanation || '') + '</div>' +
        (q.source ? '<div class="qe-src src-tag">מקור: ' + WAG.escapeHTML(q.source) + '</div>' : '');
      explain.style.animation = 'none'; void explain.offsetWidth; explain.style.animation = 'fadeUp .4s var(--ease-out)';
    }

    return {
      el: el,
      answered: function () { return chosenPos > -1; },
      isCorrect: function () { return chosenPos === correctPos; },
      reveal: function () { // for exam mode at the end
        var buttons = optWrap.querySelectorAll('.q-option');
        buttons.forEach(function (x, i) {
          x.disabled = true;
          if (i === correctPos) x.classList.add('is-correct');
          if (i === chosenPos && chosenPos !== correctPos) x.classList.add('is-incorrect');
        });
        showExplain(chosenPos === correctPos);
      }
    };
  };
})();
