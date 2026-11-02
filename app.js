const $ = (id) => document.getElementById(id);
const screens = ["home", "multiplication-menu", "game", "result"];
const COLUMN_COUNT = 7;
const MAX_VALUE = 1000000;
const COLUMN_NAMES = ["millions", "centaines de mille", "dizaines de mille", "unités de mille", "centaines", "dizaines", "unités"];
let kind = "addition";
let current = null;
let stars = 0;
let challenge = 1;

// Variables propres au module Multiplication
let multiplicationMode = "";
let selectedTable = 2;
let writtenLevel = 1;
let multiplicationQuestion = 1;
let multiplicationMixed = false;

function show(name) {
  screens.forEach(screen => $(screen).classList.toggle("hidden", screen !== name));
  window.scrollTo(0, 0);
}
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function digitsFor(value) {
  return String(value).padStart(COLUMN_COUNT, "0").split("").map(Number);
}
function exerciseWidth() {
  if (challenge <= 2) return 2;
  if (challenge <= 4) return 3;
  if (challenge <= 6) return 4;
  if (challenge <= 8) return 5;
  return 6;
}
function makeExercise() {
  if (kind === "multiplication") {
    makeMultiplicationExercise();
    return;
  }
  const width = exerciseWidth();
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
      const topAfterBorrow = aa[col] - carry;
      carry = topAfterBorrow < bb[col] ? 1 : 0;
    }
    if (col > 0) carryByColumn[col - 1] = carry;
  }
  current = { a, b, result, aa, bb, resultDigits, width, carryByColumn };
  renderExercise();
}
function renderExercise() {
  $("mission-label").textContent = kind === "addition" ? "MISSION ADDITION" : "MISSION SOUSTRACTION";
  $("game-title").textContent = kind === "addition" ? "Pose ton addition !" : "Pose ta soustraction !";
  $("exercise-type").textContent = kind === "addition" ? "Addition" : "Soustraction";
  $("level").textContent = Math.min(5, Math.ceil(challenge / 2));
  $("progress-label").textContent = "Défi " + challenge;
  $("instruction").textContent = kind === "addition"
    ? "Commence par les unités. Place les retenues au-dessus des colonnes suivantes si nécessaire."
    : "Commence par les unités. Place les emprunts au-dessus des colonnes concernées si nécessaire.";
  $("method-box").classList.add("hidden");
  $("table-display").classList.add("hidden");
  $("review-row").classList.add("hidden");
  $("column-heads").classList.remove("hidden");
  $("check").textContent = "Vérifier mon calcul";
  $("solution").textContent = "Voir un indice";

  let out = '<div class="carry-label">' + (kind === "addition" ? "Retenues (si besoin)" : "Emprunts (si besoin)") + '</div>';
  out += '<div class="operation-grid"><div class="sign-cell"></div>';
  for (let col = 0; col < COLUMN_COUNT; col++) out += `<input class="digit carry" inputmode="numeric" maxlength="1" aria-label="Retenue ou emprunt : ${COLUMN_NAMES[col]}" data-carry="${col}" placeholder="·">`;
  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < COLUMN_COUNT; col++) {
    const digit = current.aa[col];
    out += `<div class="number-cell">${digit === 0 && col < COLUMN_COUNT - current.width ? "" : digit}</div>`;
  }
  out += `<div class="operator">${kind === "addition" ? "+" : "−"}</div>`;
  for (let col = 0; col < COLUMN_COUNT; col++) {
    const digit = current.bb[col];
    out += `<div class="number-cell">${digit === 0 && col < COLUMN_COUNT - current.width ? "" : digit}</div>`;
  }
  out += '<div class="rule"></div><div class="sign-cell"></div>';
  for (let col = 0; col < COLUMN_COUNT; col++) out += `<input class="digit answer" inputmode="numeric" maxlength="1" aria-label="Résultat : ${COLUMN_NAMES[col]}" data-answer="${col}" placeholder="?">`;
  out += '</div>';
  $("work-area").innerHTML = out;
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
}
function readInputs(selector, attribute) {
  const values = {};
  document.querySelectorAll(selector).forEach(element => {
    values[element.dataset[attribute]] = element.value.trim();
  });
  return values;
}
function check() {
  if (kind === "multiplication") {
    checkMultiplication();
    return;
  }
  const answers = readInputs(".answer", "answer");
  const carries = readInputs(".carry", "carry");
  const { a, b, result, carryByColumn } = current;
  if (kind !== "addition" && a < b) {
    setFeedback("Cet exercice est incorrect. Recommence.", false);
    return;
  }
  const answerValues = Array.from({ length: COLUMN_COUNT }, (_, i) => answers[i] || "");
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
    setFeedback("Pas tout à fait ! Vérifie le résultat et les retenues ou les emprunts. Tu peux réessayer. 💪", false);
    return;
  }
  winChallenge("Ton calcul est juste. Tu gagnes une étoile !");
}
function setFeedback(text, good) {
  $("feedback").textContent = text;
  $("feedback").className = "feedback " + (good ? "good" : "bad");
}
function hint() {
  const message = kind === "addition"
    ? "Indice : commence par les unités. Si le total dépasse 9, écris le chiffre des unités et reporte 1 au-dessus de la colonne située à gauche."
    : "Indice : commence par les unités. Si le chiffre du haut est trop petit, emprunte 1 à la colonne de gauche.";
  setFeedback(message, true);
}
function winChallenge(message) {
  stars++;
  $("stars").textContent = stars;
  $("result-emoji").textContent = "🌟";
  $("result-title").textContent = "Bravo, championne !";
  $("result-text").textContent = message;
  show("result");
}

// Module Multiplication
function buildTableButtons() {
  $("table-buttons").innerHTML = Array.from({length: 10}, (_, i) =>
    `<button class="table-choice" type="button" data-table="${i + 1}">Table de ${i + 1}</button>`
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
  $("exercise-type").textContent = multiplicationMode === "table" ? "Tables" : "Multiplication posée";
  $("level").textContent = multiplicationMode === "table" ? (multiplicationMixed ? "Mélangé" : selectedTable) : writtenLevel;
  $("progress-label").textContent = "Défi " + multiplicationQuestion;
  $("column-heads").classList.toggle("hidden", multiplicationMode === "table");
  $("method-box").classList.add("hidden");
  $("table-display").classList.add("hidden");
  $("review-row").classList.toggle("hidden", multiplicationMode !== "table" || multiplicationMixed);
  $("work-area").innerHTML = "";
  $("feedback").textContent = "";
  $("feedback").className = "feedback";
  $("check").textContent = "Vérifier ma réponse";
  $("solution").textContent = "Voir un indice";

  if (multiplicationMode === "table") {
    const a = multiplicationMixed ? rand(2, 10) : selectedTable;
    const b = rand(1, 10);
    current = {a, b, result:a*b, type:"table"};
    $("game-title").textContent = multiplicationMixed ? "Les tables mélangées" : `La table de ${selectedTable}`;
    $("instruction").textContent = multiplicationQuestion === 1 && !multiplicationMixed
      ? `Regarde d'abord la table de ${selectedTable}, puis réponds aux questions.`
      : "Calcule le résultat. Prends ton temps !";
    if (multiplicationQuestion === 1 && !multiplicationMixed) {
      $("table-display").innerHTML = `<strong>La table de ${selectedTable}</strong><div class="table-list">${Array.from({length:10},(_,i)=>`<span>${selectedTable} × ${i+1} = <b>${selectedTable*(i+1)}</b></span>`).join("")}</div>`;
      $("table-display").classList.remove("hidden");
    }
    $("work-area").innerHTML = `<div class="mental-question"><span>${a} × ${b} =</span><input id="mental-answer" class="mental-answer" inputmode="numeric" type="number" aria-label="Ta réponse"></div>`;
  } else {
    const a = writtenLevel === 1 ? rand(12, 399) : rand(120, 999);
    const b = writtenLevel === 1 ? rand(2, 5) : rand(6, 9);
    current = {a,b,result:a*b,type:"written"};
    $("game-title").textContent = "Pose ta multiplication !";
    $("instruction").textContent = "Multiplie en commençant par les unités. Écris les retenues si nécessaire, puis le résultat.";
    $("method-box").innerHTML = `<strong>Petit rappel de la méthode</strong><p>Exemple : 234 × 3. Commence par les unités : 4 × 3 = 12. Écris 2 et retiens 1. Ensuite 3 × 3 + 1 = 10 : écris 0 et retiens 1. Enfin 2 × 3 + 1 = 7. Résultat : <b>702</b>.</p>`;
    $("method-box").classList.remove("hidden");
    renderWrittenMultiplication(a,b);
  }
}
function renderWrittenMultiplication(a,b) {
  const aa = digitsFor(a);
  let out = '<div class="carry-label">Retenues (si besoin)</div><div class="operation-grid">';
  out += '<div class="sign-cell"></div>';
  for (let i=0;i<COLUMN_COUNT;i++) out += `<input class="digit carry" inputmode="numeric" maxlength="1" data-carry="${i}" placeholder="·">`;
  out += '<div class="sign-cell"></div>';
  for (let i=0;i<COLUMN_COUNT;i++) out += `<div class="number-cell">${aa[i]===0 && i<COLUMN_COUNT-String(a).length ? "" : aa[i]}</div>`;
  out += '<div class="operator">×</div>';
  // Le multiplicateur est aligné sous les unités.
  for (let i=0;i<COLUMN_COUNT-1;i++) out += '<div class="number-cell"></div>';
  out += `<div class="number-cell">${b}</div>`;
  out += '<div class="rule"></div><div class="sign-cell"></div>';
  for (let i=0;i<COLUMN_COUNT;i++) out += `<input class="digit answer" inputmode="numeric" maxlength="1" data-answer="${i}" placeholder="?">`;
  out += '</div>';
  $("work-area").innerHTML = out;
}
function multiplicationCarries(a,b) {
  const digits = String(a).split("").reverse().map(Number);
  const carries = Array(COLUMN_COUNT).fill(0);
  let carry = 0;
  for (let i=0;i<digits.length;i++) {
    const total = digits[i] * b + carry;
    carry = Math.floor(total / 10);
    // La retenue issue de la colonne courante se place juste au-dessus de la colonne à gauche.
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
      setFeedback("Pas tout à fait. Tu peux réessayer ! 💪", false);
      return;
    }
    winChallenge("Bonne réponse ! Tu gagnes une étoile.");
    return;
  }
  const answers = readInputs(".answer", "answer");
  const carries = readInputs(".carry", "carry");
  const values = Array.from({length:COLUMN_COUNT},(_,i)=>answers[i]||"");
  if (!values.some(v=>v!=="")) {
    setFeedback("Complète les cases du résultat.", false);
    return;
  }
  if (values.some(v=>v!=="" && !/^\d$/.test(v))) {
    setFeedback("Écris un seul chiffre par case.", false);
    return;
  }
  let wrong = Number(values.join("")) !== current.result;
  const expectedCarries = multiplicationCarries(current.a,current.b);
  for (let i=0;i<COLUMN_COUNT;i++) {
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
    setFeedback(`Indice : ${current.a} × ${current.b}, c'est ${current.a} fois ${current.b}. Tu peux compter de ${current.a} en ${current.a}.`, true);
  } else {
    setFeedback("Indice : commence par les unités. Multiplie, écris le chiffre des unités et reporte la retenue dans la colonne de gauche.", true);
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

document.querySelectorAll(".mission").forEach(button => {
  button.addEventListener("click", () => {
    kind = button.dataset.kind;
    challenge = 1;
    if (kind === "multiplication") {
      buildTableButtons();
      show("multiplication-menu");
    } else {
      makeExercise();
      show("game");
    }
  });
});
$("back").addEventListener("click", () => kind === "multiplication" ? show("multiplication-menu") : show("home"));
$("check").addEventListener("click", check);
$("solution").addEventListener("click", () => kind === "multiplication" ? multiplicationHint() : hint());
$("again").addEventListener("click", () => {
  if (kind === "multiplication") nextMultiplication();
  else { challenge++; makeExercise(); show("game"); }
});
$("home-button").addEventListener("click", () => show("home"));
$("multiplication-back").addEventListener("click", () => show("home"));
$("mixed-tables").addEventListener("click", startMixedTables);
document.querySelectorAll("[data-written]").forEach(button => button.addEventListener("click", () => startWritten(Number(button.dataset.written))));
$("review-table").addEventListener("click", reviewCurrentTable);
$("back-multiplications").addEventListener("click", () => show("multiplication-menu"));
