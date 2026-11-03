const $ = (id) => document.getElementById(id);

const screens = ["home", "operation-menu", "multiplication-menu", "game", "result"];
const COLUMN_COUNT = 7;
const MAX_VALUE = 1000000;
const COLUMN_NAMES = ["millions", "centaines de mille", "dizaines de mille", "unités de mille", "centaines", "dizaines", "unités"];

let kind = "addition";
let current = null;
let stars = 0;
let challenge = 1;
let selectedLevel = 1;
let decimalMode = false;
let multiplicationMode = "";
let selectedTable = 2;
let writtenLevel = 1;
let multiplicationQuestion = 1;
let multiplicationMixed = false;

function show(name) {
  screens.forEach(s => $(s).classList.toggle("hidden", s !== name));
  window.scrollTo(0, 0);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setFeedback(text, good) {
  $("feedback").textContent = text;
  $("feedback").className = "feedback " + (good ? "good" : "bad");
}

function winChallenge(message) {
  stars++;
  $("stars").textContent = stars;
  $("result-emoji").textContent = "🌟";
  $("result-title").textContent = "Bravo, championne !";
  $("result-text").textContent = message;
  show("result");
}

function integerWidth() {
  return selectedLevel === 1 ? 2 :
    selectedLevel === 2 ? 3 :
    selectedLevel === 3 ? 4 :
    selectedLevel === 4 ? 5 : 6;
}

function buildOperationMenus() {
  const integerLabels = [
    "Niveau 1 — Nombres à 2 chiffres",
    "Niveau 2 — Nombres à 3 chiffres",
    "Niveau 3 — Nombres à 4 chiffres",
    "Niveau 4 — Nombres à 5 chiffres",
    "Niveau 5 — Jusqu'à 1 000 000"
  ];

  $("integer-level-buttons").innerHTML = integerLabels.map((label, i) =>
    `<button class="level-choice" data-int-level="${i + 1}" type="button">
      <b>${label.split(" — ")[0]}</b>
      <span>${label.split(" — ")[1]}</span>
    </button>`
  ).join("");

  const decimalLabels = [
    "Niveau 1 — Découvrir les dixièmes",
    "Niveau 2 — Découvrir les centièmes",
    "Niveau 3 — Calculs plus difficiles"
  ];

  $("decimal-level-buttons").innerHTML = decimalLabels.map((label, i) =>
    `<button class="level-choice" data-dec-level="${i + 1}" type="button">
      <b>${label.split(" — ")[0]}</b>
      <span>${label.split(" — ")[1]}</span>
    </button>`
  ).join("");

  document.querySelectorAll("[data-int-level]").forEach(b =>
    b.addEventListener("click", () =>
      startOperation(Number(b.dataset.intLevel), false))
  );

  document.querySelectorAll("[data-dec-level]").forEach(b =>
    b.addEventListener("click", () =>
      startOperation(Number(b.dataset.decLevel), true))
  );
}

function startOperation(level, isDecimal) {
  selectedLevel = level;
  decimalMode = isDecimal;
  challenge = 1;
  show("game");
  makeExercise();
}

function makeExercise() {
  if (kind === "multiplication") {
    makeMultiplicationExercise();
    return;
  }

  if (decimalMode) makeDecimalExercise();
  else makeIntegerExercise();
}

function makeIntegerExercise() {
  const width = integerWidth();
  const min = 10 ** (width - 1);
  const max = Math.min(10 ** width - 1, MAX_VALUE - 1);
  let a, b;

  if (kind === "addition") {
    a = rand(min, Math.min(max, MAX_VALUE - min));
    b = rand(min, Math.min(max, MAX_VALUE - a));
  } else {
    a = rand(min + 1, max);
    b = rand(min, a - 1);
  }

  const result = kind === "addition" ? a + b : a - b;
  const aa = String(a).padStart(COLUMN_COUNT, "0").split("").map(Number);
  const bb = String(b).padStart(COLUMN_COUNT, "0").split("").map(Number);
  const carryByColumn = Array(COLUMN_COUNT).fill(0);
  let carry = 0;

  for (let col = COLUMN_COUNT - 1; col >= 0; col--) {
    if (kind === "addition") {
      carry = aa[col] + bb[col] + carry >= 10 ? 1 : 0;
    } else {
      carry = aa[col] - carry < bb[col] ? 1 : 0;
    }
    if (col > 0) carryByColumn[col - 1] = carry;
  }

  current = { a, b, result, aa, bb, width, carryByColumn, type: "integer" };
  renderIntegerExercise();
}

function renderIntegerExercise() {
  setupGameHeading(false);

  $("column-heads").innerHTML =
    '<span></span><span>M</span><span>CM</span><span>DM</span><span>UM</span><span>C</span><span>D</span><span>U</span>';

  $("column-heads").classList.remove("hidden");

  let out = '<div class="carry-label">' +
    (kind === "addition" ? "Retenues (si besoin)" : "Emprunts (si besoin)") +
    '</div><div class="operation-grid"><div class="sign-cell"></div>';

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<input class="digit carry" inputmode="numeric" maxlength="1"
      aria-label="Retenue ou emprunt : ${COLUMN_NAMES[i]}"
      data-carry="${i}" placeholder="·">`;
  }

  out += '<div class="sign-cell"></div>';

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<div class="number-cell">${current.aa[i] === 0 &&
      i < COLUMN_COUNT - current.width ? "" : current.aa[i]}</div>`;
  }

  out += `<div class="operator">${kind === "addition" ? "+" : "−"}</div>`;

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<div class="number-cell">${current.bb[i] === 0 &&
      i < COLUMN_COUNT - current.width ? "" : current.bb[i]}</div>`;
  }

  out += '<div class="rule"></div><div class="sign-cell"></div>';

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<input class="digit answer" inputmode="numeric" maxlength="1"
      aria-label="Résultat : ${COLUMN_NAMES[i]}"
      data-answer="${i}" placeholder="?">`;
  }

  out += '</div>';
  $("work-area").innerHTML = out;
  resetFeedback();
}

function decimalParts(cents) {
  return {
    whole: Math.floor(cents / 100),
    fraction: cents % 100
  };
}

function makeDecimalExercise() {
  const maxWhole = selectedLevel === 1 ? 9 :
    selectedLevel === 2 ? 19 : 99;

  let a, b, result;

  if (kind === "addition") {
    a = rand(1, maxWhole * 100) +
      (selectedLevel === 1 ? rand(0, 9) * 10 : rand(0, 99));

    b = rand(1, maxWhole * 100) +
      (selectedLevel === 1 ? rand(0, 9) * 10 : rand(0, 99));

    result = a + b;
  } else {
    a = rand(2, maxWhole * 100 + 99);
    b = rand(1, a - 1);

    if (selectedLevel === 1) {
      a = Math.floor(a / 10) * 10;
      b = Math.min(Math.floor(b / 10) * 10, a - 10);
    }

    result = a - b;
  }

  if (selectedLevel === 1) {
    a = Math.floor(a / 10) * 10;
    b = Math.floor(b / 10) * 10;

    if (kind === "subtraction" && b >= a) {
      b = Math.max(0, a - 10);
    }

    result = kind === "addition" ? a + b : a - b;
  }

  current = { a, b, result, type: "decimal", level: selectedLevel };
  renderDecimalExercise();
}

function renderDecimalExercise() {
  setupGameHeading(true);
  $("column-heads").classList.add("hidden");

  const makeRow = (value, sign = "") => {
    const p = decimalParts(value);
    const whole = String(p.whole).padStart(6, " ");
    const fraction = String(p.fraction).padStart(2, "0");

    return `<div class="decimal-row">
      <span class="decimal-sign">${sign}</span>
      ${whole.split("").map(ch =>
        `<span class="decimal-digit">${ch.trim()}</span>`).join("")}
      <span class="decimal-comma">,</span>
      <span class="decimal-digit">${fraction[0]}</span>
      <span class="decimal-digit">${fraction[1]}</span>
    </div>`;
  };

  const carries = `<div class="decimal-row decimal-carries">
    <span class="decimal-sign"></span>
    ${Array.from({ length: 6 }, () => '<span></span>').join("")}
    <span></span><span></span><span></span>
  </div>`;

  const answer = `<div class="decimal-row decimal-answer">
    <span class="decimal-sign"></span>
    ${Array.from({ length: 6 }, (_, i) =>
      `<input class="digit decimal-input answer" inputmode="numeric"
        maxlength="1" data-dec-answer="${i}">`).join("")}
    <span class="decimal-comma">,</span>
    <input class="digit decimal-input answer" inputmode="numeric"
      maxlength="1" data-dec-answer="6">
    <input class="digit decimal-input answer" inputmode="numeric"
      maxlength="1" data-dec-answer="7">
  </div>`;

  $("work-area").innerHTML = `<div class="decimal-work">
    <div class="carry-label">Pose ton calcul en alignant les virgules</div>
    ${carries}
    ${makeRow(current.a)}
    ${makeRow(current.b, kind === "addition" ? "+" : "−")}
    <div class="decimal-rule"></div>
    ${answer}
  </div>`;

  $("instruction").textContent = selectedLevel === 1
    ? "Aligne les virgules. Ici, on travaille avec les dixièmes."
    : selectedLevel === 2
      ? "Aligne bien les virgules : les dixièmes et les centièmes doivent rester dans leur colonne."
      : "Aligne les virgules et pense aux retenues ou aux échanges entre les colonnes.";

  resetFeedback();
}

function setupGameHeading(isDecimal) {
  const label = kind === "addition" ? "ADDITION" :
    kind === "subtraction" ? "SOUSTRACTION" : "MULTIPLICATION";

  $("mission-label").textContent = `MISSION ${label}`;

  $("game-title").textContent = kind === "addition"
    ? "Pose ton addition !"
    : kind === "subtraction"
      ? "Pose ta soustraction !"
      : "À toi de jouer !";

  $("exercise-type").textContent = kind === "addition"
    ? "Addition"
    : "Soustraction";

  $("level").textContent = isDecimal
    ? `Décimal ${selectedLevel}`
    : selectedLevel;

  $("progress-label").textContent = "Défi " + challenge;
  $("method-box").classList.add("hidden");
  $("table-display").classList.add("hidden");
  $("review-row").classList.add("hidden");
  $("check").textContent = "Vérifier mon calcul";
  $("solution").textContent = "Voir un indice";
}

function resetFeedback() {
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
}

function readInputs(selector, attribute) {
  const values = {};

  document.querySelectorAll(selector).forEach(e => {
    values[e.dataset[attribute]] = e.value.trim();
  });

  return values;
}

function check() {
  if (kind === "multiplication") {
    checkMultiplication();
    return;
  }

  if (decimalMode) {
    checkDecimal();
    return;
  }

  checkInteger();
}

function checkInteger() {
  const answers = readInputs(".answer", "answer");
  const carries = readInputs(".carry", "carry");

  const values = Array.from(
    { length: COLUMN_COUNT },
    (_, i) => answers[i] || ""
  );

  if (!values.some(v => v !== "")) {
    setFeedback("Écris ton résultat dans les cases avant de vérifier.", false);
    return;
  }

  if (values.some(v => v !== "" && !/^\d$/.test(v))) {
    setFeedback("Écris un seul chiffre par case.", false);
    return;
  }

  let wrong = Number(values.join("")) !== current.result;

  for (let i = 0; i < COLUMN_COUNT; i++) {
    const expected = current.carryByColumn[i] || 0;
    const entered = carries[i] || "";

    if (expected === 1 && entered !== "1") wrong = true;
    if (expected === 0 && entered !== "" && entered !== "0") wrong = true;
  }

  if (wrong) {
    setFeedback(
      "Pas tout à fait ! Vérifie le résultat et les retenues ou les emprunts. Tu peux réessayer. 💪",
      false
    );
    return;
  }

  winChallenge("Ton calcul est juste. Tu gagnes une étoile !");
}

function checkDecimal() {
  const fields = [...document.querySelectorAll("[data-dec-answer]")];
  const chars = fields.map(e => e.value.trim());

  if (chars.every(x => x === "")) {
    setFeedback("Complète les cases du résultat avant de vérifier.", false);
    return;
  }

  if (chars.some(x => x !== "" && !/^\d$/.test(x))) {
    setFeedback("Écris un seul chiffre par case.", false);
    return;
  }

  const entered =
    Number(chars.slice(0, 6).join("") || 0) * 100 +
    Number((chars[6] || "0") + (chars[7] || "0"));

  if (entered !== current.result) {
    setFeedback(
      "Pas tout à fait ! Vérifie les colonnes et la virgule. Tu peux réessayer. 💪",
      false
    );
    return;
  }

  winChallenge("Bravo ! Tu as bien aligné les virgules et trouvé le résultat.");
}

function hint() {
  if (decimalMode) {
    setFeedback(
      "Indice : place les unités sous les unités, les dixièmes sous les dixièmes et les centièmes sous les centièmes. La virgule reste toujours alignée.",
      true
    );
    return;
  }

  setFeedback(
    kind === "addition"
      ? "Indice : commence par les unités. Si le total dépasse 9, écris le chiffre des unités et reporte 1 à gauche."
      : "Indice : commence par les unités. Si le chiffre du haut est trop petit, échange une dizaine contre 10 unités.",
    true
  );
}

// ------------------------------------
// MODULE MULTIPLICATION
// ------------------------------------

function buildTableButtons() {
  $("table-buttons").innerHTML = Array.from(
    { length: 10 },
    (_, i) => `<button class="table-choice" type="button" data-table="${i + 1}">Table de ${i + 1}</button>`
  ).join("");

  document.querySelectorAll("[data-table]").forEach(b => {
    b.addEventListener("click", () => startTable(Number(b.dataset.table)));
  });
}

function startTable(table) {
  kind = "multiplication";
  multiplicationMode = "table";
  selectedTable = table;
  multiplicationMixed = false;
  multiplicationQuestion = 1;
  challenge = 1;

  show("game");
  makeExercise();
}

function startMixedTables() {
  kind = "multiplication";
  multiplicationMode = "table";
  multiplicationMixed = true;
  multiplicationQuestion = 1;
  challenge = 1;

  show("game");
  makeExercise();
}

function startWritten(level) {
  kind = "multiplication";
  multiplicationMode = "written";
  writtenLevel = level;
  multiplicationQuestion = 1;
  challenge = 1;

  show("game");
  makeExercise();
}

function startDecimalMultiplication(level) {
  kind = "multiplication";
  multiplicationMode = "decimal";
  writtenLevel = level;
  multiplicationQuestion = 1;
  challenge = 1;

  show("game");
  makeExercise();
}

function makeMultiplicationExercise() {
  $("mission-label").textContent = "MISSION MULTIPLICATION";

  $("exercise-type").textContent =
    multiplicationMode === "table"
      ? "Tables"
      : multiplicationMode === "decimal"
        ? "Multiplication décimale"
        : "Multiplication posée";

  $("level").textContent =
    multiplicationMode === "table"
      ? (multiplicationMixed ? "Mélangé" : selectedTable)
      : writtenLevel;

  $("progress-label").textContent = "Défi " + multiplicationQuestion;

  $("column-heads").classList.toggle(
    "hidden",
    multiplicationMode !== "written"
  );

  $("method-box").classList.add("hidden");
  $("table-display").classList.add("hidden");

  $("review-row").classList.toggle(
    "hidden",
    multiplicationMode !== "table" || multiplicationMixed
  );

  $("work-area").innerHTML = "";
  resetFeedback();

  $("check").textContent = "Vérifier ma réponse";
  $("solution").textContent = "Voir un indice";

  if (multiplicationMode === "table") {
    const a = multiplicationMixed ? rand(2, 10) : selectedTable;
    const b = rand(1, 10);

    current = {
      a,
      b,
      result: a * b,
      type: "table"
    };

    $("game-title").textContent = multiplicationMixed
      ? "Les tables mélangées"
      : `La table de ${selectedTable}`;

    $("instruction").textContent =
      multiplicationQuestion === 1 && !multiplicationMixed
        ? `Regarde d'abord la table de ${selectedTable}, puis réponds aux questions.`
        : "Calcule le résultat. Prends ton temps !";

    if (multiplicationQuestion === 1 && !multiplicationMixed) {
      $("table-display").innerHTML =
        `<strong>La table de ${selectedTable}</strong>
        <div class="table-list">
        ${Array.from(
          { length: 10 },
          (_, i) => `<span>${selectedTable} × ${i + 1} = <b>${selectedTable * (i + 1)}</b></span>`
        ).join("")}
        </div>`;

      $("table-display").classList.remove("hidden");
    }

    $("work-area").innerHTML =
      `<div class="mental-question">
        <span>${a} × ${b} =</span>
        <input id="mental-answer" class="mental-answer"
          inputmode="numeric" type="number" aria-label="Ta réponse">
      </div>`;

  } else if (multiplicationMode === "written") {
    const a = writtenLevel === 1 ? rand(12, 399) : rand(120, 999);
    const b = writtenLevel === 1 ? rand(2, 5) : rand(6, 9);

    current = {
      a,
      b,
      result: a * b,
      type: "written"
    };

    $("game-title").textContent = "Pose ta multiplication !";

    $("instruction").textContent =
      "Multiplie en commençant par les unités. Écris les retenues si nécessaire, puis le résultat.";

    $("method-box").innerHTML =
      "<strong>Petit rappel de la méthode</strong>" +
      "<p>Exemple : 234 × 3. Commence par les unités : 4 × 3 = 12. Écris 2 et retiens 1. Ensuite 3 × 3 + 1 = 10 : écris 0 et retiens 1. Enfin 2 × 3 + 1 = 7. Résultat : <b>702</b>.</p>";

    $("method-box").classList.remove("hidden");

    renderWrittenMultiplication(a, b);

  } else {
    const level = writtenLevel;
    let a, b, answer;

    if (level === 1) {
      a = rand(12, 49) / 10;
      b = rand(2, 4);
      answer = a * b;
    } else if (level === 2) {
      a = rand(105, 399) / 100;
      b = rand(2, 5);
      answer = a * b;
    } else {
      a = rand(12, 35) / 10;
      b = rand(12, 25) / 10;
      answer = Number((a * b).toFixed(2));
    }

    current = {
      a,
      b,
      result: answer,
      type: "decimal-mult"
    };

    $("game-title").textContent = "Multiplie les nombres décimaux";

    $("instruction").textContent =
      level === 1
        ? "Multiplie les dixièmes par un nombre entier."
        : level === 2
          ? "Attention aux centièmes : pense à la virgule dans le résultat."
          : "Deux nombres ont une virgule. Estime le résultat, puis calcule.";

    $("method-box").innerHTML =
      "<strong>Petit rappel</strong>" +
      "<p>Tu peux d'abord calculer sans les virgules, puis replacer la virgule dans le résultat. Vérifie que ton résultat est raisonnable.</p>";

    $("method-box").classList.remove("hidden");

    $("work-area").innerHTML =
      `<div class="mental-question">
        <span>${String(a).replace(".", ",")} × ${String(b).replace(".", ",")} =</span>
        <input id="mental-answer" class="mental-answer"
          inputmode="decimal" type="text" placeholder="Ta réponse"
          aria-label="Ta réponse">
      </div>`;
  }
}

function renderWrittenMultiplication(a, b) {
  const aa = String(a).padStart(COLUMN_COUNT, "0").split("").map(Number);

  let out =
    '<div class="carry-label">Retenues (si besoin)</div>' +
    '<div class="operation-grid"><div class="sign-cell"></div>';

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<input class="digit carry" inputmode="numeric"
      maxlength="1" data-carry="${i}" placeholder="·">`;
  }

  out += '<div class="sign-cell"></div>';

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<div class="number-cell">${
      aa[i] === 0 && i < COLUMN_COUNT - String(a).length ? "" : aa[i]
    }</div>`;
  }

  out += '<div class="operator">×</div>';

  for (let i = 0; i < COLUMN_COUNT - 1; i++) {
    out += '<div class="number-cell"></div>';
  }

  out += `<div class="number-cell">${b}</div>`;
  out += '<div class="rule"></div><div class="sign-cell"></div>';

  for (let i = 0; i < COLUMN_COUNT; i++) {
    out += `<input class="digit answer" inputmode="numeric"
      maxlength="1" data-answer="${i}" placeholder="?">`;
  }

  out += '</div>';
  $("work-area").innerHTML = out;
}

function multiplicationCarries(a, b) {
  const digits = String(a).split("").reverse().map(Number);
  const c = Array(COLUMN_COUNT).fill(0);
  let carry = 0;

  for (let i = 0; i < digits.length; i++) {
    carry = Math.floor((digits[i] * b + carry) / 10);
    const target = COLUMN_COUNT - 2 - i;

    if (target >= 0) c[target] = carry;
  }

  return c;
}

function checkMultiplication() {
  if (current.type === "table") {
    const v = $("mental-answer")?.value.trim();

    if (!v) {
      setFeedback("Écris ta réponse avant de vérifier.", false);
      return;
    }

    if (Number(v) !== current.result) {
      setFeedback("Pas tout à fait. Tu peux réessayer ! 💪", false);
      return;
    }

    winChallenge("Bonne réponse ! Tu gagnes une étoile.");
    return;
  }

  if (current.type === "decimal-mult") {
    const v = $("mental-answer")?.value.trim().replace(",", ".");

    if (!v) {
      setFeedback("Écris ta réponse avant de vérifier.", false);
      return;
    }

    const n = Number(v);

    if (!Number.isFinite(n) || Math.abs(n - current.result) > 0.011) {
      setFeedback("Pas tout à fait. Vérifie ton calcul et la place de la virgule !", false);
      return;
    }

    winChallenge("Bravo ! Tu as réussi cette multiplication décimale.");
    return;
  }

  const ans = readInputs(".answer", "answer");
  const carries = readInputs(".carry", "carry");

  const vals = Array.from(
    { length: COLUMN_COUNT },
    (_, i) => ans[i] || ""
  );

  if (!vals.some(v => v !== "")) {
    setFeedback("Complète les cases du résultat.", false);
    return;
  }

  let wrong = Number(vals.join("")) !== current.result;
  const expected = multiplicationCarries(current.a, current.b);

  for (let i = 0; i < COLUMN_COUNT; i++) {
    const e = carries[i] || "";

    if (expected[i] > 0 && e !== String(expected[i])) wrong = true;
    if (expected[i] === 0 && e !== "" && e !== "0") wrong = true;
  }

  if (wrong) {
    setFeedback("Vérifie ton résultat et les retenues. Tu peux réessayer !", false);
    return;
  }

  winChallenge("Ta multiplication est juste. Tu gagnes une étoile !");
}

function multiplicationHint() {
  if (current.type === "table") {
    setFeedback(
      `Indice : ${current.a} × ${current.b}, c'est ${current.a} fois ${current.b}. Tu peux compter de ${current.a} en ${current.a}.`,
      true
    );
  } else if (current.type === "decimal-mult") {
    setFeedback(
      "Indice : calcule d'abord comme si les virgules n'existaient pas, puis replace la virgule en tenant compte du nombre de chiffres après les virgules.",
      true
    );
  } else {
    setFeedback(
      "Indice : commence par les unités. Multiplie, écris le chiffre des unités et reporte la retenue dans la colonne de gauche.",
      true
    );
  }
}

function reviewCurrentTable() {
  if (multiplicationMode === "table" && !multiplicationMixed) {
    multiplicationQuestion = 1;
    makeExercise();
    show("game");
  }
}

function nextMultiplication() {
  multiplicationQuestion++;
  challenge++;
  makeExercise();
  show("game");
}

// ------------------------------------
// ÉVÉNEMENTS ET NAVIGATION
// ------------------------------------

document.querySelectorAll(".mission").forEach(button => {
  button.addEventListener("click", () => {
    kind = button.dataset.kind;
    challenge = 1;

    if (kind === "multiplication") {
      buildTableButtons();
      show("multiplication-menu");
    } else {
      buildOperationMenus();

      $("operation-menu-label").textContent =
        kind === "addition" ? "MISSION ADDITION" : "MISSION SOUSTRACTION";

      show("operation-menu");
    }
  });
});

$("operation-back").addEventListener("click", () => show("home"));

$("back").addEventListener("click", () => {
  if (kind === "multiplication") {
    show("multiplication-menu");
  } else {
    show("operation-menu");
  }
});

$("check").addEventListener("click", check);

$("solution").addEventListener("click", () => {
  if (kind === "multiplication") multiplicationHint();
  else hint();
});

$("again").addEventListener("click", () => {
  if (kind === "multiplication") {
    nextMultiplication();
  } else {
    challenge++;
    makeExercise();
    show("game");
  }
});

$("home-button").addEventListener("click", () => show("home"));

$("multiplication-back").addEventListener("click", () => show("home"));

$("mixed-tables").addEventListener("click", startMixedTables);

document.querySelectorAll("[data-written]").forEach(b => {
  b.addEventListener("click", () => startWritten(Number(b.dataset.written)));
});

document.querySelectorAll("[data-decimal-mult]").forEach(b => {
  b.addEventListener("click", () => startDecimalMultiplication(Number(b.dataset.decimalMult)));
});

$("review-table").addEventListener("click", reviewCurrentTable);

$("back-multiplications").addEventListener("click", () => show("multiplication-menu"));
