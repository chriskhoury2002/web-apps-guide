/* ============================================================
   final-exam.js — "מבחן מסכם": a full 20-question mock exam.
   Reads data/exam-guide.json. Each of the 20 fixed questions
   draws a random answer-version from its `versions` bank, so
   every attempt is a different exam ("בנק בחינות").
   Timer, question navigator, score + per-topic breakdown, review.
   ============================================================ */
(function () {
  'use strict';
  var WAG = window.WAG = window.WAG || {};
  var ROOT = WAG.ROOT || './';
  var DURATION = 30 * 60; // seconds (30 minutes)

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('fe-root');
    if (!mount) return;
    Promise.all([
      fetch(ROOT + 'data/exam-guide.json').then(function (r) { return r.json(); }),
      fetch(ROOT + 'data/topics.json').then(function (r) { return r.json(); })
    ]).then(function (res) {
      var topicsMap = {};
      res[1].topics.forEach(function (t) { topicsMap[t.slug] = t; });
      renderStart(mount, res[0], topicsMap);
    }).catch(function () {
      mount.innerHTML = '<p class="dim" style="text-align:center">לא ניתן לטעון את המבחן. ודא שהאתר רץ דרך שרת מקומי.</p>';
    });
  });

  /* pick one answer-version for a question (fallback: build from facts/traps) */
  function pickVersion(q) {
    if (q.versions && q.versions.length) {
      return WAG.quiz.shuffle(q.versions)[0];
    }
    // fallback (should not happen once the bank is authored)
    var facts = WAG.quiz.shuffle(q.facts || []);
    var traps = WAG.quiz.shuffle(q.traps || []);
    var opts = [facts[0]].concat(traps.slice(0, 3));
    return { options: opts, correctIndex: 0 };
  }

  /* pick the code snippet to show; some questions (e.g. Q2) rotate the element between <> */
  function pickCode(q) {
    if (q.codeVariants && q.codeVariants.length) {
      var c = WAG.quiz.shuffle(q.codeVariants)[0];
      return { code: c.code, lang: c.codeLang || 'markup' };
    }
    return { code: q.code || null, lang: q.codeLang || 'js' };
  }

  function mmss(s) {
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function renderStart(mount, guide, topicsMap) {
    var n = guide.questions.length;
    mount.innerHTML =
      '<div class="fe-start card">' +
        '<div class="fe-start-icon">🎓</div>' +
        '<h2>מבחן מסכם, מועד א\'</h2>' +
        '<p class="lead" style="margin:10px auto 0">' + n + ' שאלות אמריקאיות, בדיוק בסגנון המבחן. כל שאלה נשלפת עם גרסת תשובות אקראית, אז כל מבחן שונה. יש טיימר, אפשר לנווט בין השאלות, ובסוף תקבל ציון ופירוק לפי נושא.</p>' +
        '<ul class="fe-rules">' +
          '<li><b>' + n + '</b> שאלות</li>' +
          '<li><b>' + Math.round(DURATION / 60) + '</b> דקות</li>' +
          '<li>תשובה אחת נכונה לכל שאלה</li>' +
          '<li>כל התשובות באותו אורך</li>' +
        '</ul>' +
        '<label class="fe-toggle"><input type="checkbox" id="fe-instant" checked> הצג את התשובה הנכונה מיד אחרי כל שאלה, עם הסבר</label>' +
        '<button class="btn primary lg fe-begin" type="button">התחל מבחן ›</button>' +
      '</div>';
    mount.querySelector('.fe-begin').addEventListener('click', function () {
      var instant = mount.querySelector('#fe-instant').checked;
      startExam(mount, guide, topicsMap, instant);
    });
  }

  function startExam(mount, guide, topicsMap, instant) {
    if (instant === undefined) instant = true;
    var mode = instant ? 'practice' : 'exam';
    var qs = guide.questions.slice().sort(function (a, b) { return a.n - b.n; });
    var total = qs.length;
    var state = qs.map(function () { return { answered: false, correct: false }; });
    var idx = 0, finished = false, remaining = DURATION, timer = null;

    mount.innerHTML =
      '<div class="fe-exam">' +
        '<div class="fe-bar">' +
          '<span class="fe-count">שאלה <b>1</b> / ' + total + '</span>' +
          '<span class="fe-timer" id="fe-timer">' + mmss(remaining) + '</span>' +
          '<span class="fe-answered"><b id="fe-adone">0</b>/' + total + ' נענו</span>' +
        '</div>' +
        '<div class="fe-progress"><span></span></div>' +
        '<div class="fe-nav" id="fe-nav"></div>' +
        '<div class="fe-stage" id="fe-stage"></div>' +
        '<div class="fe-foot">' +
          '<button class="btn ghost fe-prev" type="button">‹ הקודמת</button>' +
          '<button class="btn ghost fe-next" type="button">הבאה ›</button>' +
          '<button class="btn primary fe-submit" type="button">סיים מבחן</button>' +
        '</div>' +
      '</div>' +
      '<div class="fe-results" id="fe-results" hidden></div>';

    var stage = mount.querySelector('#fe-stage');
    var nav = mount.querySelector('#fe-nav');
    var countB = mount.querySelector('.fe-count b');
    var doneB = mount.querySelector('#fe-adone');
    var progEl = mount.querySelector('.fe-progress > span');
    var timerEl = mount.querySelector('#fe-timer');

    // each question lives in a wrapper: its card + a "another version" button.
    var cards = [], wraps = [];
    function updateDone() { doneB.textContent = state.filter(function (s) { return s.answered; }).length; }

    function mountCard(i) {
      var src = qs[i];
      var v = pickVersion(src);
      var cc = pickCode(src);
      var correct = v.options[v.correctIndex];
      var qobj = {
        question: src.q, code: cc.code, lang: cc.lang,
        options: v.options.slice(), correctIndex: v.correctIndex,
        explanation: 'התשובה הנכונה: ' + correct + (src.explain ? ' — ' + src.explain : '')
      };
      var card = WAG.buildQuestionCard(qobj, {
        index: i, total: total, mode: mode,
        onAnswer: function (ok) {
          state[i].answered = true; state[i].correct = ok;
          updateDone();
          nav.children[i].classList.add('done');
        }
      });
      cards[i] = card;
      var wrap = wraps[i];
      wrap.innerHTML = '';
      wrap.appendChild(card.el);
      var more = document.createElement('button');
      more.type = 'button'; more.className = 'btn ghost sm fe-qmore';
      more.textContent = '🔄 גרסה נוספת של השאלה הזו';
      more.title = 'תשובות אחרות לאותה שאלה, כדי להתאמן עליה שוב';
      more.addEventListener('click', function () {
        state[i] = { answered: false, correct: false };
        nav.children[i].classList.remove('done');
        updateDone();
        mountCard(i);
      });
      wrap.appendChild(more);
    }

    // build wrappers + initial cards
    qs.forEach(function (q, i) {
      var wrap = document.createElement('div');
      wrap.className = 'fe-qwrap'; wrap.style.display = 'none';
      wraps[i] = wrap;
      stage.appendChild(wrap);
      mountCard(i);
    });

    // navigator dots
    qs.forEach(function (q, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'fe-dot'; b.textContent = (i + 1);
      b.addEventListener('click', function () { go(i); });
      nav.appendChild(b);
    });

    function go(i) {
      if (finished) return;
      idx = Math.max(0, Math.min(total - 1, i));
      wraps.forEach(function (w, k) { w.style.display = k === idx ? '' : 'none'; });
      Array.prototype.forEach.call(nav.children, function (d, k) { d.classList.toggle('current', k === idx); });
      countB.textContent = idx + 1;
      progEl.style.width = ((idx + 1) / total * 100) + '%';
      mount.querySelector('.fe-prev').disabled = idx === 0;
      mount.querySelector('.fe-next').disabled = idx === total - 1;
    }

    mount.querySelector('.fe-prev').addEventListener('click', function () { go(idx - 1); });
    mount.querySelector('.fe-next').addEventListener('click', function () { go(idx + 1); });
    mount.querySelector('.fe-submit').addEventListener('click', function () {
      var unanswered = state.filter(function (s) { return !s.answered; }).length;
      if (unanswered > 0 && !window.confirm('נשארו ' + unanswered + ' שאלות בלי תשובה. לסיים בכל זאת?')) return;
      finish();
    });

    timer = setInterval(function () {
      remaining--;
      timerEl.textContent = mmss(remaining);
      if (remaining <= 60) timerEl.classList.add('low');
      if (remaining <= 0) { finish(); }
    }, 1000);

    function finish() {
      if (finished) return;
      finished = true;
      if (timer) clearInterval(timer);
      var correct = state.filter(function (s) { return s.correct; }).length;
      var pct = Math.round(correct / total * 100);
      if (mode === 'exam') cards.forEach(function (c) { if (c) c.reveal(); });
      wraps.forEach(function (w) { w.style.display = 'none'; });

      // per-topic breakdown (by primary topic)
      var byTopic = {};
      qs.forEach(function (q, i) {
        var slug = (q.topics && q.topics[0]) || 'other';
        byTopic[slug] = byTopic[slug] || { correct: 0, total: 0 };
        byTopic[slug].total++;
        if (state[i].correct) byTopic[slug].correct++;
      });
      var topicRows = Object.keys(byTopic).map(function (slug) {
        var t = topicsMap[slug], b = byTopic[slug];
        var p = Math.round(b.correct / b.total * 100);
        var name = t ? (t.icon + ' ' + t.titleHe) : slug;
        return '<div class="fe-trow"><span class="fe-tname">' + WAG.escapeHTML(name) + '</span>' +
          '<span class="fe-tbar"><i style="width:' + p + '%;background:' + (t ? t.accent : 'var(--accent)') + '"></i></span>' +
          '<span class="fe-tscore">' + b.correct + '/' + b.total + '</span></div>';
      }).join('');

      var msg = pct >= 90 ? 'מצוין, שליטה מלאה 🏆' : pct >= 70 ? 'כל הכבוד, עברת 👏' : pct >= 55 ? 'קרוב, שווה עוד סבב 💪' : 'כדאי לחזור על החומר ולנסות שוב 📚';
      if (WAG.progress && WAG.store) {
        var best = WAG.store.get('final-exam-best', 0);
        if (pct > best) WAG.store.set('final-exam-best', pct);
      }

      var results = mount.querySelector('#fe-results');
      results.hidden = false;
      results.innerHTML =
        '<div class="fe-res-card card">' +
          (WAG.ringSVG ? WAG.ringSVG(pct).replace('class="ring"', 'class="ring fe-ring" width="128" height="128"') : '') +
          '<div class="fe-res-score">' + correct + '<span> / ' + total + '</span></div>' +
          '<div class="fe-res-msg">' + msg + '</div>' +
          '<div class="dim">ציון: ' + pct + '% · זמן שנותר: ' + mmss(Math.max(0, remaining)) + '</div>' +
          '<div class="fe-breakdown"><h3>פירוק לפי נושא</h3>' + topicRows + '</div>' +
          '<div class="fe-res-actions">' +
            '<button class="btn primary fe-again" type="button">🔄 מבחן חדש</button>' +
            '<button class="btn ghost fe-review" type="button">📋 סקירת התשובות</button>' +
          '</div>' +
        '</div>';

      // switch exam UI to review: reveal all cards stacked
      mount.querySelector('.fe-foot').style.display = 'none';
      mount.querySelector('.fe-bar').style.display = 'none';
      mount.querySelector('.fe-progress').style.display = 'none';
      nav.style.display = 'none';
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });

      results.querySelector('.fe-again').addEventListener('click', function () {
        startExam(mount, guide, topicsMap, instant);
      });
      var reviewShown = false;
      results.querySelector('.fe-review').addEventListener('click', function () {
        reviewShown = !reviewShown;
        wraps.forEach(function (w) { w.style.display = reviewShown ? '' : 'none'; });
        if (reviewShown) stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    go(0);
  }
})();
