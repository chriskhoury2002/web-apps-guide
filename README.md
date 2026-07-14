# web-apps-guide

מדריך לימוד אינטראקטיבי בעברית (RTL) לקורס **פיתוח יישומי אינטרנט**.
אתר סטטי, וניל בלבד (HTML/CSS/JS), בלי שלב build, מוכן ל-GitHub Pages.

## איך מריצים מקומית

האתר טוען קבצי JSON דרך `fetch`, ולכן צריך להריץ אותו דרך שרת (לא `file://`):

```bash
# מתוך תיקיית הפרויקט
npx serve .
# או כל שרת סטטי אחר, למשל התוסף Live Server ב-VS Code
```

ואז לפתוח את הכתובת שהשרת נותן (למשל `http://localhost:3000`).

## מבנה

```
index.html            עמוד הבית + לוח התקדמות
exam.html             מבחן מסכם (בבנייה)
topics/NN-*.html      עמוד לכל נושא
css/                  theme, base, code, components, widgets, anim, motion, home
js/                   site, motion, storage, progress, highlight, playground,
                      livedemo, stepper, challenge, animations, quiz-engine, quiz-ui
data/topics.json      רשימת הנושאים (סדר, כותרות, סטטוס)
data/quizzes/*.json   מאגרי שאלות לכל נושא
```

## מנועים (רכיבים אינטראקטיביים)

- **playground** – עורך HTML/CSS/JS חי עם תצוגה בזמן אמת, קונסול וכפתור איפוס.
- **livedemo** – קוד לצד תוצאה, עם מעבר לעריכה מלאה.
- **stepper** – הרצת קוד צעד-אחר-צעד: הדגשת שורה, משתנים, call stack, תורים ופלט.
- **animations** – המחשות מושגים: request/response, event loop, box model, בניית DOM,
  התאמת selector, חוסם מול לא חוסם.
- **challenge** – "נסה בעצמך" עם בדיקה אוטומטית של הצלחה.
- **quiz** – תרגול אמריקאי לכל נושא עם משוב מיידי; מעקב התקדמות ב-localStorage.

## איך מוסיפים תוכן

- **בלוק קוד:** `<div class="code-block" data-lang="js"><script type="text/plain">...</script></div>`
- **playground:** `<div class="playground" data-tabs="html,css,js"><script type="text/plain" class="pg-html">...</script>...</div>`
- **stepper:** `<div class="stepper"><script type="application/json">{ "lang":"js","code":"...","steps":[...] }</script></div>`
- **אנימציה:** `<div class="anim" data-anim="event-loop" data-title="..."></div>`
- **quiz:** `<div class="quiz" data-quiz="02-html"></div>` + קובץ `data/quizzes/02-html.quiz.json`

## סטטוס

- **מוכן:** תשתית מלאה + עמוד בית + נושאים 02 (HTML), 03 (CSS), 10 (אסינכרוניות/Fetch/JSON).
- **בבנייה:** 11 הנושאים הנותרים + המבחן המסכם.
