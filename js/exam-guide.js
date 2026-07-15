/* ============================================================
   exam-guide.js — renders the exam guide (מדריך למבחן) from
   data/exam-guide.json: 20 accordion cards, each with facts (✓),
   traps (✗), and exam-style practice: the SAME exam question
   repeated 10 rounds, each round 4 fresh options (1 true fact +
   3 false traps). Plus topic links and a "reviewed" tracker.
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  var ROOT = WAG.ROOT || './';

  function reviewed() { return WAG.store.get('exam-reviewed', {}); }
  function setReviewed(n, val) { var r = reviewed(); if (val) r[n] = true; else delete r[n]; WAG.store.set('exam-reviewed', r); }

  /* --- turn a study statement into a clean quiz option ---
     Strips parenthetical clarifications/corrections e.g. "(בפועל block)"
     so options stay short and never give the answer away. Applied to
     BOTH facts and traps so they look parallel. */
  function optText(s) {
    return String(s == null ? '' : s)
      .replace(/\s*\([^)]*\)/g, '')   // remove ( ... ) groups
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([,.;:])/g, '$1')
      .trim();
  }

  /* Render authored code examples for a card (highlighted, read-only). */
  function renderExamples(list) {
    if (!list || !list.length) return '';
    var blocks = list.map(function (ex) {
      var lang = ex.lang || 'js';
      var head = '<div class="code-head"><span class="dots"><i></i><i></i><i></i></span>' +
        '<span class="lang">' + WAG.escapeHTML(lang) + '</span>' +
        (ex.file ? '<span class="file">' + WAG.escapeHTML(ex.file) + '</span>' : '') + '</div>';
      var pre = WAG.buildPre(ex.code, lang, { numbered: false });
      return '<div class="code-block eg-code" data-hl="1" data-lang="' + WAG.escapeHTML(lang) + '">' + head + pre + '</div>' +
        (ex.caption ? '<p class="eg-cap">' + WAG.mdInline(ex.caption) + '</p>' : '');
    }).join('');
    return '<div class="eg-examples"><h4 class="eg-fh code">📄 קוד לדוגמה</h4>' + blocks + '</div>';
  }

  /* Build 10 exam-style MCQ items for one question.
     - stem is always the exam question (q.q)
     - correct answer rotates through the (shuffled) facts
     - 3 distractors are distinct traps, different from the correct one
     Fresh randomness on every call (works in the browser). */
  function makeExamItems(entry) {
    // Prefer the authored equal-length version bank (same options as the final exam).
    if (entry.versions && entry.versions.length) {
      return WAG.quiz.shuffle(entry.versions).map(function (v) {
        return {
          question: entry.q,
          code: entry.code || null,
          lang: entry.codeLang || 'js',
          options: v.options.slice(),
          correctIndex: v.correctIndex,
          explanation: 'הטענה הנכונה: ' + v.options[v.correctIndex]
        };
      });
    }
    // fallback: generate rounds from facts/traps
    var facts = WAG.quiz.shuffle(entry.facts || []);
    var trapsRaw = (entry.traps || []);
    var items = [];
    var ROUNDS = 10;
    if (!facts.length) return items;
    for (var i = 0; i < ROUNDS; i++) {
      var correct = optText(facts[i % facts.length]);
      // candidate distractors: cleaned traps, non-empty, != correct, unique
      var pool = WAG.quiz.shuffle(trapsRaw).map(optText)
        .filter(function (t) { return t && t !== correct; });
      var distract = [];
      for (var k = 0; k < pool.length && distract.length < 3; k++) {
        if (distract.indexOf(pool[k]) === -1) distract.push(pool[k]);
      }
      var options = [correct].concat(distract);
      items.push({
        question: entry.q,
        options: options,
        correctIndex: 0,           // buildQuestionCard re-shuffles display order
        explanation: 'הטענה הנכונה: ' + correct
      });
    }
    return items;
  }

  /* Self-contained practice runner (reuses the shared quiz CSS + card factory). */
  function runExamPractice(host, entry) {
    var items = makeExamItems(entry);
    var total = items.length;
    var idx = 0, correct = 0, wrong = [];

    host.innerHTML =
      '<div class="quiz-head">' +
        '<span class="qh-title">🎯 אותה שאלה, ' + total + ' סבבים, כל פעם 4 תשובות אחרות</span>' +
        '<span class="qh-stats"><span class="qh-score">ניקוד: <b>0</b>/' + total + '</span></span>' +
      '</div>' +
      '<div class="quiz-progress"><span></span></div>' +
      '<div class="quiz-stage"></div>' +
      '<div class="quiz-foot"><span class="qf-spacer"></span><button class="btn primary qf-next" type="button" disabled>הבאה ›</button></div>';

    var stage = host.querySelector('.quiz-stage');
    var nextBtn = host.querySelector('.qf-next');
    var scoreEl = host.querySelector('.qh-score b');
    var progEl = host.querySelector('.quiz-progress > span');

    function show() {
      var q = items[idx];
      var card = WAG.buildQuestionCard(q, {
        index: idx, total: total, mode: 'practice',
        onAnswer: function (ok) {
          if (ok) { correct++; scoreEl.textContent = correct; }
          else { wrong.push(q); }
          nextBtn.disabled = false;
          nextBtn.textContent = idx >= total - 1 ? 'סיום ›' : 'הבאה ›';
        }
      });
      stage.innerHTML = '';
      stage.appendChild(card.el);
      nextBtn.disabled = true;
      progEl.style.width = (idx / total * 100) + '%';
    }

    nextBtn.addEventListener('click', function () {
      if (idx >= total - 1) { finish(); return; }
      idx++; show();
    });

    function finish() {
      progEl.style.width = '100%';
      var pct = Math.round(correct / total * 100);
      var msg = pct >= 90 ? 'שליטה מלאה 🏆' : pct >= 70 ? 'כל הכבוד, אתה מוכן 👏' : pct >= 50 ? 'עוד קצת חזרה על העובדות 💪' : 'חזור על הטענות הנכונות ונסה שוב 📚';
      stage.innerHTML =
        '<div class="quiz-results">' +
          (WAG.ringSVG ? WAG.ringSVG(pct).replace('class="ring"', 'class="ring qr-ring" width="112" height="112"') : '') +
          '<div class="qr-score">' + correct + '<span class="qr-of"> / ' + total + '</span></div>' +
          '<div class="qr-msg">' + msg + '</div>' +
          '<div class="dim">ציון: ' + pct + '%</div>' +
          '<div style="margin-top:18px"><button class="btn primary qr-again" type="button">🔄 עוד ' + total + ' שאלות (אותה שאלה)</button></div>' +
        '</div>';
      var svg = stage.querySelector('.ring'); if (svg && WAG.drawRing) WAG.drawRing(svg, pct);
      host.querySelector('.quiz-foot').style.display = 'none';
      host.querySelector('.qh-stats').innerHTML = '<span class="qh-score">ניקוד: <b>' + correct + '</b>/' + total + '</span>';
      stage.querySelector('.qr-again').addEventListener('click', function () {
        host.querySelector('.quiz-foot').style.display = '';
        runExamPractice(host, entry);
      });
    }

    show();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('eg-root');
    if (!mount) return;
    Promise.all([
      fetch(ROOT + 'data/exam-guide.json').then(function (r) { return r.json(); }),
      fetch(ROOT + 'data/topics.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      var guide = res[0], topicsMap = {};
      res[1].topics.forEach(function (t) { topicsMap[t.slug] = t; });
      build(mount, guide, topicsMap);
    }).catch(function () {
      mount.innerHTML = '<p class="dim" style="text-align:center">לא ניתן לטעון את מדריך המבחן. ודא שהאתר רץ דרך שרת מקומי.</p>';
    });
  });

  function build(mount, guide, topicsMap) {
    var rev = reviewed();
    var byN = {};
    guide.questions.forEach(function (q) { byN[q.n] = q; });
    var doneCount = guide.questions.filter(function (q) { return rev[q.n]; }).length;

    var controls =
      '<div class="eg-top">' +
        '<div class="eg-progress"><b id="eg-done">' + doneCount + '</b> / ' + guide.questions.length + ' נסקרו</div>' +
        '<div class="eg-search-wrap"><input id="eg-search" type="search" placeholder="חיפוש בשאלות ובחומר..." aria-label="חיפוש"></div>' +
        '<div class="eg-actions"><button class="btn sm ghost" id="eg-expand">פתח הכל</button><button class="btn sm ghost" id="eg-collapse">סגור הכל</button></div>' +
      '</div>';

    var cards = guide.questions.map(function (q) {
      var chips = (q.topics || []).map(function (s) {
        var t = topicsMap[s]; if (!t) return '';
        return '<a class="eg-chip" href="' + ROOT + 'topics/' + s + '.html" style="--accent:' + t.accent + '" title="לנושא המלא">' + t.icon + ' ' + t.titleHe + '</a>';
      }).join('');
      var facts = (q.facts || []).map(function (f) { return '<li>' + WAG.mdInline(f) + '</li>'; }).join('');
      var traps = (q.traps || []).map(function (t) { return '<li>' + WAG.mdInline(t) + '</li>'; }).join('');
      var isRev = !!rev[q.n];
      return '<div class="eg-card" data-n="' + q.n + '" data-q="' + WAG.escapeHTML((q.q + ' ' + (q.facts || []).join(' ') + ' ' + (q.traps || []).join(' ')).toLowerCase()) + '">' +
        '<button class="eg-head" type="button" aria-expanded="false">' +
          '<span class="eg-num' + (isRev ? ' done' : '') + '">' + (isRev ? '✓' : q.n) + '</span>' +
          '<span class="eg-q">' + WAG.escapeHTML(q.q) + '</span>' +
          '<span class="eg-caret" aria-hidden="true">▾</span>' +
        '</button>' +
        '<div class="eg-body"><div class="eg-body-in">' +
          (chips ? '<div class="eg-chips">' + chips + '</div>' : '') +
          renderExamples(q.examples) +
          '<div class="eg-facts"><h4 class="eg-fh ok">✓ כל מה שצריך לדעת (טענות נכונות)</h4><ul class="fact-list">' + facts + '</ul></div>' +
          (traps ? '<div class="eg-traps"><h4 class="eg-fh bad">✗ היזהר מהטענות האלה (שגויות)</h4><ul class="trap-list">' + traps + '</ul></div>' : '') +
          '<div class="eg-practice"><h4 class="eg-fh">🎯 תרגול: אותה שאלה, תשובות מתחלפות</h4><div class="eg-quiz-slot"></div></div>' +
          '<label class="eg-review"><input type="checkbox" ' + (isRev ? 'checked' : '') + '> סימנתי שסקרתי את השאלה הזו</label>' +
        '</div></div>' +
      '</div>';
    }).join('');

    mount.innerHTML = controls + '<div class="eg-list">' + cards + '</div>' + '<p class="eg-empty-msg" id="eg-empty" hidden>לא נמצאו שאלות שמתאימות לחיפוש.</p>';

    // accordion toggle + lazy practice mount
    mount.querySelectorAll('.eg-card').forEach(function (card) {
      var head = card.querySelector('.eg-head');
      head.addEventListener('click', function () {
        var open = card.classList.toggle('open');
        head.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) {
          var slot = card.querySelector('.eg-quiz-slot');
          if (slot && !slot.dataset.mounted) {
            slot.dataset.mounted = '1';
            slot.className = 'quiz eg-quiz';
            var entry = byN[card.dataset.n];
            if (entry) runExamPractice(slot, entry);
          }
        }
      });
      // reviewed checkbox
      var cb = card.querySelector('.eg-review input');
      cb.addEventListener('change', function () {
        var n = card.dataset.n;
        setReviewed(n, cb.checked);
        var num = card.querySelector('.eg-num');
        num.classList.toggle('done', cb.checked);
        num.textContent = cb.checked ? '✓' : n;
        document.getElementById('eg-done').textContent = guide.questions.filter(function (q) { return reviewed()[q.n]; }).length;
      });
    });

    // search
    var search = document.getElementById('eg-search');
    search.addEventListener('input', function () {
      var term = search.value.trim().toLowerCase();
      var shown = 0;
      mount.querySelectorAll('.eg-card').forEach(function (card) {
        var match = !term || card.dataset.q.indexOf(term) > -1;
        card.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      document.getElementById('eg-empty').hidden = shown > 0;
    });

    document.getElementById('eg-expand').addEventListener('click', function () {
      mount.querySelectorAll('.eg-card').forEach(function (c) {
        if (c.style.display === 'none') return;
        if (!c.classList.contains('open')) c.querySelector('.eg-head').click();
      });
    });
    document.getElementById('eg-collapse').addEventListener('click', function () {
      mount.querySelectorAll('.eg-card.open').forEach(function (c) { c.querySelector('.eg-head').click(); });
    });
  }
})();
