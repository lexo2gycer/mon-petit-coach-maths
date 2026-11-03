
const $ = id => document.getElementById(id);

const screens = ["home", "operation-menu", "multiplication-menu", "game", "result"];

const COLUMN_COUNT = 7;
const MAX_VALUE = 1000000;
const COLUMN_NAMES = [
  "millions", "centaines de mille", "dizaines de mille",
  "unités de mille", "centaines", "dizaines", "unités"
];

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
  screens.forEach(screen => {
    const element = $(screen);
    if (element) element.classList.toggle("hidden", screen !== name);
  });
  window.scrollTo(0, 0);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitsFor(value) {
  return String(value).padStart(COLUMN_COUNT, "0").split("").map(Number);
}

function setFeedback(message, good) {
  $("feedback").textContent = message;
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

/* ---------------------------------
   MENUS ADDITION ET SOUSTRACTION
---------------------------------- */

function openOperationMenu(operation) {
  kind = operation;
  $("operation-menu-title").textContent =
    operation === "addition" ? "Mission Addition" : "Mission Soustraction";

  $("operation-menu-description").textContent =
    operation === "addition"
      ? "Choisis ton niveau d'addition."
      : "Choisis ton niveau de soustraction.";

  show("operation-menu");
}

function startOperationLevel(level) {
  selectedLevel = Number(level);
  decimalMode = selectedLevel >= 6;
  challenge = 1;
  makeExercise();
  show("game");
}

/* ---------------------------------
   GENERATION DES EXERCICES ENTIERS
---------------------------------- */

function integerWidth(level) {
  if (level === 1) return 2;
  if (level === 2) return 3;
  if (level === 3) return 4;
  if (level === 4) return 5;
  return 6;
}

function makeIntegerExercise() {
  const width = integerWidth(selectedLevel);
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
  const aa = digitsFor(a);
  const bb = digitsFor(b);
  const resultDigits = digitsFor(result);
  const carryByColumn = Array(COLUMN_COUNT).fill(0);

  let carry = 0;

  for (let col = COLUMN_COUNT - 1; col >= 0; col--) {
    if (kind === "addition") {
      const total = aa[col] + bb[col] + carry;
      carry = total >= 10 ? 1 : 0;
    } else {
      const top = aa[col] - carry;
      carry = top < bb[col] ? 1 : 0;
    }
    if (col > 0) carryByColumn[col - 1] = carry;
  }

  current = {
    type: "integer",
    a, b, result, aa, bb, resultDigits,
    width, carryByColumn
  };

  renderIntegerExercise();
}

function renderIntegerExercise() {
  $("mission-label").textContent =
    kind === "addition" ? "MISSION ADDITION" : "MISSION SOUSTRACTION";

  $("game-title").textContent =
    kind === "addition" ? "Pose ton addition !" : "Pose ta soustraction !";

  $("exercise-type").textContent =
    kind === "addition" ? "Addition" : "Soustraction";

  $("level").textContent = selectedLevel;
  $("progress-label").textContent = "Défi " + challenge;

  $("instruction").textContent =
    kind === "addition"
      ? "Commence par les unités. Place les retenues au-dessus des colonnes suivantes."
      : "Commence par les unités. Place les emprunts au-dessus des colonnes concernées.";

  $("method-box").classList.add("hidden");
  $("table-display").classList.add("hidden");
  $("decimal-display").classList.add("hidden");
  $("review-row").classList.add("hidden");
  $("column-heads").classList.remove("hidden");

  $("check").textContent = "Vérifier mon calcul";
  $("solution").textContent = "Voir un indice";

  let out =
    '<div class="carry-label">' +
    (kind === "addition" ? "Retenues (si besoin)" : "Emprunts (si besoin)") +
    "</div>";

  out += '<div class="operation-grid"><div class="sign-cell"></div>';

  for (let col = 0; col < COLUMN_COUNT; col++) {
    out += `<input class="digit carry" inputmode="numeric" maxlength="1"
      aria-label="Retenue ou emprunt : ${COLUMN_NAMES[col]}"
      data-carry="${col}" placeholder="·">`;
  }

  out += '<div class="sign-cell"></div>';

  for (let col = 0; col < COLUMN_COUNT; col++) {
    const digit = current.aa[col];
    out += `<div class="number-cell">${
      digit === 0 && col < COLUMN_COUNT - current.width ? "" : digit
    }</div>`;
  }

  out += `<div class="operator">${kind === "addition" ? "+" : "−"}</div>`;

  for (let col = 0; col < COLUMN_COUNT; col++) {
    const digit = current.bb[col];
    out += `<div class="number-cell">${
      digit === 0 && col < COLUMN_COUNT - current.width ? "" : digit
    }</div>`;
  }

  out += '<div class="rule"></div><div class="sign-cell"></div>';

  for (let col = 0; col < COLUMN_COUNT; col++) {
    out += `<input class="digit answer" inputmode="numeric" maxlength="1"
      aria-label="Résultat : ${COLUMN_NAMES[col]}"
      data-answer="${col}" placeholder="?">`;
  }

  out += "</div>";

  $("work-area").innerHTML = out;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
}

/* ---------------------------------
   NIVEAUX DECIMAUX
---------------------------------- */

function makeDecimalExercise() {
  let a, b, result;
  let decimals = 1;

  if (selectedLevel === 6) {
    decimals = 1;
    a = rand(10, 99) / 10;
    b = rand(10, 49) / 10;
  } else if (selectedLevel === 7) {
    decimals = 2;
    a = rand(100, 999) / 100;
    b = rand(10, 499) / 100;
  } else {
    decimals = 2;
    a = rand(1000, 9999) / 100;
    b = rand(100, 2999) / 100;
  }

  if (kind === "addition") {
    result = a + b;
  } else {
    if (b > a) [a, b] = [b, a];
    result = a - b;
  }

  const factor = 10 ** decimals;
  a = Math.round(a * factor) / factor;
  b = Math.round(b * factor) / factor;
  result = Math.round((kind === "addition" ? a + b : a - b) * factor) / factor;

  current = {
    type: "decimal",
    a, b, result,
    decimals
  };

  renderDecimalExercise();
}

function formatDecimal(value, decimals) {
  return value.toFixed(decimals).replace(".", ",");
}

function renderDecimalExercise() {
  const levelName = selectedLevel - 5;

  $("mission-label").textContent =
    kind === "addition" ? "ADDITION DÉCIMALE" : "SOUSTRACTION DÉCIMALE";

  $("game-title").textContent =
    kind === "addition" ? "Les additions à virgule" : "Les soustractions à virgule";

  $("exercise-type").textContent = "Nombres décimaux";
  $("level").textContent = "Décimal " + levelName;
  $("progress-label").textContent = "Défi " + challenge;

  $("instruction").textContent =
    "Aligne bien les virgules. Les unités, les dixièmes et les centièmes doivent être placés dans les bonnes colonnes.";

  $("column-heads").classList.add("hidden");
  $("method-box").classList.add("hidden");
  $("table-display").classList.add("hidden");
  $("review-row").classList.add("hidden");
  $("decimal-display").classList.remove("hidden");

  $("decimal-display").innerHTML = `
    <div class="decimal-operation">
      <div>${formatDecimal(current.a, current.decimals)}</div>
      <div>${kind === "addition" ? "+" : "−"} ${formatDecimal(current.b, current.decimals)}</div>
      <div class="decimal-line"></div>
      <label for="decimal-answer">Ton résultat :</label>
      <input id="decimal-answer" class="decimal-answer"
        type="text" inputmode="decimal" autocomplete="off"
        placeholder="Écris ton résultat">
    </div>
  `;

  $("work-area").innerHTML = "";
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("check").textContent = "Vérifier mon calcul";
  $("solution").textContent = "Voir un indice";
}

function checkDecimal() {
  const input = $("decimal-answer");
  if (!input || !input.value.trim()) {
    setFeedback("Écris ton résultat avant de vérifier.", false);
    return;
  }

  const entered = Number(input.value.trim().replace(",", "."));
  const tolerance = 0.001;

  if (!Number.isFinite(entered)) {
    setFeedback("Écris un nombre valide, avec une virgule si nécessaire.", false);
    return;
  }

  if (Math.abs(entered - current.result) > tolerance) {
    setFeedback("Pas tout à fait. Vérifie l'alignement des virgules et recommence !", false);
    return;
  }

  winChallenge("Bravo ! Ton calcul décimal est juste.");
}

/* ---------------------------------
   MOTEUR ADDITION / SOUSTRACTION
---------------------------------- */

function makeExercise() {
  if (kind === "multiplication") {
    makeMultiplicationExercise();
    return;
  }

  if (selectedLevel >= 6) {
    makeDecimalExercise();
  } else {
    makeIntegerExercise();
  }
}

function readInputs(selector, attribute) {
  const values = {};
  document.querySelectorAll(selector).forEach(element => {
    values[element.dataset[attribute]] = element.value.trim();
  });
  return values;
}

function checkInteger() {
  const answers = readInputs(".answer", "answer");
  const carries = readInputs(".carry", "carry");
  const { result, carryByColumn } = current;

  const answerValues = Array.from(
    { length: COLUMN_COUNT },
    (_, i) => answers[i] || ""
  );

  if (!answerValues.some(value => value !== "")) {
    setFeedback("Écris ton résultat dans les cases avant de vérifier.", false);
    return;
  }

  if (answerValues.some(value => value !== "" && !/^\d$/.test(value))) {
    setFeedback("Écris un seul chiffre par case.", false);
    return;
  }

  const enteredResult = Number(answerValues.join(""));
  let wrong = enteredResult !== result;

  for (let col = 0; col < COLUMN_COUNT; col++) {
    const expected = carryByColumn[col] || 0;
    const entered = carries[col] || "";

    if (expected === 1 && entered !== "1") wrong = true;
    if (expected === 0 && entered !== "" && entered !== "0") wrong = true;
  }

  if (wrong) {
    setFeedback("Pas tout à fait ! Vérifie le résultat et les retenues ou emprunts.", false);
    return;
  }

  winChallenge("Ton calcul est juste. Tu gagnes une étoile !");
}

function check() {
  if (kind === "multiplication") {
    checkMultiplication();
    return;
  }

  if (current.type === "decimal") {
    checkDecimal();
    return;
  }

  checkInteger();
}

function hint() {
  if (current.type === "decimal") {
    setFeedback(
      "Indice : place les virgules l'une sous l'autre. Vérifie les dixièmes et les centièmes.",
      true
    );
    return;
  }

  const message =
    kind === "addition"
      ? "Indice : commence par les unités. Si le total dépasse 9, reporte 1 à gauche."
      : "Indice : commence par les unités. Si le chiffre du haut est trop petit, emprunte 1 à la colonne de gauche.";

  setFeedback(message, true);
}

/* ---------------------------------
   MODULE MULTIPLICATION
---------------------------------- */

function buildTableButtons() {
  $("table-buttons").innerHTML = Array.from({ length: 10 }, (_, i) =>
    `<button class="table-choice" type="button" data-table="${i + 1}">
      Table de ${i + 1}
    </button>`
  ).join("");

  document.querySelectorAll("[data-table]").forEach(button => {
    button.addEventListener("click", () => startTable(Number(button.dataset.table)));
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

function makeMultiplicationExercise() {
  $("mission-label").textContent = "MISSION MULTIPLICATION";
  $("exercise-type").textContent =
    multiplicationMode === "table" ? "Tables" : "Multiplication posée";

  $("level").textContent =
    multiplicationMode === "table"
      ? (multiplicationMixed ? "Mélangé" : selectedTable)
      : writtenLevel;

  $("progress-label").textContent = "Défi " + multiplicationQuestion;

  $("column-heads").classList.toggle("hidden", multiplicationMode === "table");
  $("method-box").classList.add("hidden");
  $("decimal-display").classList.add("hidden");
  $("table-display").classList.add("hidden");

  $("review-row").classList.toggle(
    "hidden",
    multiplicationMode !== "table" || multiplicationMixed
  );

  $("work-area").innerHTML = "";
  $("feedback").textContent = "";
  $("feedback").className = "feedback";

  $("check").textContent = "Vérifier ma réponse";
  $("solution").textContent = "Voir un indice";

  if (multiplicationMode === "table") {
    const a = multiplicationMixed ? rand(2, 10) : selectedTable;
    const b = rand(1, 10);

    current = { a, b, result: a * b, type: "table" };

    $("game-title").textContent =
      multiplicationMixed ? "Les tables mélangées" : `La table de ${selectedTable}`;

    $("instruction").textContent =
      multiplicationQuestion === 1 && !multiplicationMixed
        ? `Regarde d'abord la table de ${selectedTable}, puis réponds aux questions.`
        : "Calcule le résultat. Prends ton temps !";

    if (multiplicationQuestion === 1 && !multiplicationMixed) {
      $("table-display").innerHTML = `
        <strong>La table de ${selectedTable}</strong>
        <div class="table-list">
          ${Array.from({ length: 10 }, (_, i) =>
            `<span>${selectedTable} × ${i + 1} = <b>${selectedTable * (i + 1)}</b></span>`
          ).join("")}
        </div>
      `;
      $("table-display").classList.remove("hidden");
    }

    $("work-area").innerHTML = `
      <div class="mental-question">
        <span>${a} × ${b} =</span>
        <input id="mental-answer" class="mental-answer"
          inputmode="numeric" type="number" aria-label="Ta réponse">
      </div>
    `;
  } else {
    const a = writtenLevel === 1 ? rand(12, 399) : rand(120, 999);
    const b = writtenLevel === 1 ? rand(2, 5) : rand(6, 9);

    current = { a, b, result: a * b, type: "written" };

    $("game-title").textContent = "Pose ta multiplication !";
    $("instruction").textContent =
      "Multiplie en commençant par les unités. Écris les retenues si nécessaire.";

    $("method-box").innerHTML = `
      <strong>Petit rappel de la méthode</strong>
      <p>Exemple : 234 × 3. Commence par les unités : 4 × 3 = 12.
      Écris 2 et retiens 1. Ensuite 3 × 3 + 1 = 10 :
      écris 0 et retiens 1. Enfin 2 × 3 + 1 = 7.
      Résultat : <b>702</b>.</p>
    `;

    $("method-box").classList.remove("hidden");
    renderWrittenMultiplication(a, b);
  }
}

function renderWrittenMultiplication(a, b) {
  const aa = digitsFor(a);

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

  out += "</div>";
  $("work-area").innerHTML = out;
}

function multiplicationCarries(a, b) {
  const digits = String(a).split("").reverse().map(Number);
  const carries = Array(COLUMN_COUNT).fill(0);
  let carry = 0;

  for (let i = 0; i < digits.length; i++) {
    const total = digits[i] * b + carry;
    carry = Math.floor(total / 10);

    const targetColumn = COLUMN_COUNT - 2 - i;
    if (targetColumn >= 0) carries[targetColumn] = carry;
  }

  return carries;
}

function checkMultiplication() {
  if (current.type === "table") {
    const input = $("mental-answer");

    if (!input || input.value.trim() === "") {
      setFeedback("Écris ta réponse avant de vérifier.", false);
      return;
    }

    if (Number(input.value) !== current.result) {
      setFeedback("Pas tout à fait. Tu peux réessayer !", false);
      return;
    }

    winChallenge("Bonne réponse ! Tu gagnes une étoile.");
    return;
  }

  const answers = readInputs(".answer", "answer");
  const carries = readInputs(".carry", "carry");
  const values = Array.from({ length: COLUMN_COUNT }, (_, i) => answers[i] || "");

  if (!values.some(v => v !== "")) {
    setFeedback("Complète les cases du résultat.", false);
    return;
  }

  if (values.some(v => v !== "" && !/^\d$/.test(v))) {
    setFeedback("Écris un seul chiffre par case.", false);
    return;
  }

  let wrong = Number(values.join("")) !== current.result;
  const expectedCarries = multiplicationCarries(current.a, current.b);

  for (let i = 0; i < COLUMN_COUNT; i++) {
    const entered = carries[i] || "";
    if (expectedCarries[i] > 0 && entered !== String(expectedCarries[i])) wrong = true;
    if (expectedCarries[i] === 0 && entered !== "" && entered !== "0") wrong = true;
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
      `Indice : ${current.a} × ${current.b}, c'est ${current.a} fois ${current.b}.`,
      true
    );
  } else {
    setFeedback(
      "Indice : commence par les unités. Multiplie, écris le chiffre des unités et reporte la retenue.",
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

/* ---------------------------------
   BOUTONS ET NAVIGATION
---------------------------------- */

document.querySelectorAll(".mission").forEach(button => {
  button.addEventListener("click", () => {
    const selected = button.dataset.kind;

    if (selected === "multiplication") {
      kind = "multiplication";
      buildTableButtons();
      show("multiplication-menu");
    } else {
      openOperationMenu(selected);
    }
  });
});

document.querySelectorAll("[data-operation-level]").forEach(button => {
  button.addEventListener("click", () => {
    startOperationLevel(button.dataset.operationLevel);
  });
});

$("back").addEventListener("click", () => {
  if (kind === "multiplication") {
    show("multiplication-menu");
  } else {
    show("operation-menu");
  }
});

$("back-operation-menu").addEventListener("click", () => show("home"));
$("multiplication-back").addEventListener("click", () => show("home"));

$("check").addEventListener("click", check);

$("solution").addEventListener("click", () => {
  if (kind === "multiplication") {
    multiplicationHint();
  } else {
    hint();
  }
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
$("mixed-tables").addEventListener("click", startMixedTables);

document.querySelectorAll("[data-written]").forEach(button => {
  button.addEventListener("click", () => startWritten(Number(button.dataset.written)));
});

$("review-table").addEventListener("click", reviewCurrentTable);

$("back-multiplications").addEventListener("click", () => {
  show("multiplication-menu");
});

