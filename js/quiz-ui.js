/* ============================================================
   quiz-ui.js — per-topic practice quiz widget
   Authoring: <div class="quiz" data-quiz="02-html"></div>
   Loads data/quizzes/<slug>.quiz.json, runs practice mode, saves best.
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};

  function init(host) {
    if (host.dataset.ready) return;
    host.dataset.ready = '1';
    var slug = host.dataset.quiz;
    var url = WAG.ROOT + 'data/quizzes/' + slug + '.quiz.json';
    host.innerHTML = '<div class="q-body" style="text-align:center;color:var(--text-mute)">טוען שאלות…</div>';
    fetch(url).then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (bank) { start(host, slug, bank); })
      .catch(function () {
        host.innerHTML = '<div class="q-body" style="text-align:center;color:var(--text-mute)">לא ניתן לטעון את התרגול. ודא שהאתר רץ דרך שרת מקומי (לא file://).</div>';
      });
  }

  function start(host, slug, bank) {
    var questions = WAG.quiz.shuffle(bank.questions);
    var total = questions.length;
    var idx = 0, correct = 0, wrong = [];
    var best = WAG.progress ? WAG.progress.getTopic(slug).quiz : null;

    host.innerHTML =
      '<div class="quiz-head">' +
        '<span class="qh-title">🧠 ' + WAG.escapeHTML(bank.title || 'תרגול') + '</span>' +
        '<span class="qh-stats">' +
          (best ? '<span class="qh-best">שיא: <b>' + best.pct + '%</b></span>' : '') +
          '<span class="qh-score">ניקוד: <b>0</b>/' + total + '</span>' +
        '</span>' +
      '</div>' +
      '<div class="quiz-progress"><span></span></div>' +
      '<div class="quiz-stage"></div>' +
      '<div class="quiz-foot"><span class="qf-spacer"></span><button class="btn primary qf-next" type="button" disabled>הבאה ›</button></div>';

    var stage = host.querySelector('.quiz-stage');
    var nextBtn = host.querySelector('.qf-next');
    var scoreEl = host.querySelector('.qh-score b');
    var progEl = host.querySelector('.quiz-progress > span');

    function show() {
      var q = questions[idx];
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
      progEl.style.width = ((idx) / total * 100) + '%';
    }

    nextBtn.addEventListener('click', function () {
      if (idx >= total - 1) { finish(); return; }
      idx++; show();
    });

    function finish() {
      progEl.style.width = '100%';
      var pct = Math.round(correct / total * 100);
      if (WAG.progress) WAG.progress.saveQuizScore(slug, correct, total);
      var msg = pct >= 90 ? 'מצוין! שליטה מלאה 🏆' : pct >= 70 ? 'כל הכבוד, עברת! 👏' : pct >= 50 ? 'לא רע, שווה לחזור על החומר 💪' : 'כדאי לחזור לנושא ולנסות שוב 📚';
      var reviewHTML = wrong.length ? buildReview(wrong) : '<p class="dim" style="margin-top:14px">ענית נכון על כל השאלות! 🎯</p>';

      stage.innerHTML =
        '<div class="quiz-results">' +
          WAG.ringSVG(pct).replace('class="ring"', 'class="ring qr-ring" width="112" height="112"') +
          '<div class="qr-score">' + correct + '<span class="qr-of"> / ' + total + '</span></div>' +
          '<div class="qr-msg">' + msg + '</div>' +
          '<div class="dim">ציון: ' + pct + '%</div>' +
          '<div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">' +
            '<button class="btn primary qr-again" type="button">🔄 שאלות חדשות</button>' +
            (wrong.length ? '<button class="btn ghost qr-review" type="button">📋 סקירת טעויות (' + wrong.length + ')</button>' : '') +
          '</div>' +
          '<div class="qr-review-box" hidden>' + reviewHTML + '</div>' +
        '</div>';

      var svg = stage.querySelector('.ring'); if (svg) WAG.drawRing(svg, pct);
      host.querySelector('.quiz-foot').style.display = 'none';
      var head = host.querySelector('.qh-stats');
      head.innerHTML = '<span class="qh-score">ניקוד: <b>' + correct + '</b>/' + total + '</span>';

      stage.querySelector('.qr-again').addEventListener('click', function () {
        host.dataset.ready = ''; host.querySelector('.quiz-foot').style.display = '';
        start(host, slug, bank);
      });
      var rev = stage.querySelector('.qr-review');
      if (rev) rev.addEventListener('click', function () {
        var box = stage.querySelector('.qr-review-box');
        box.hidden = !box.hidden;
        WAG.processCodeBlocks(box);
      });
    }

    show();
  }

  function buildReview(wrong) {
    return '<div class="review-list" style="text-align:start;margin-top:16px;display:flex;flex-direction:column;gap:10px">' +
      wrong.map(function (q) {
        return '<div class="card" style="padding:14px">' +
          '<div style="font-weight:700;margin-bottom:6px">' + WAG.mdInline(q.question) + '</div>' +
          (q.code ? '<div class="code-block" data-hl="1">' + WAG.buildPre(q.code, q.lang || 'js', { numbered: false }) + '</div>' : '') +
          '<div style="color:var(--success);font-weight:700;margin:6px 0 4px">התשובה הנכונה: ' + WAG.mdInline(q.options[q.correctIndex]) + '</div>' +
          '<div class="dim" style="font-size:.92rem">' + WAG.mdInline(q.explanation || '') + '</div>' +
        '</div>';
      }).join('') + '</div>';
  }

  WAG.initQuizzes = function (root) { (root || document).querySelectorAll('.quiz[data-quiz]').forEach(init); };
  document.addEventListener('DOMContentLoaded', function () { WAG.initQuizzes(document); });
})();
