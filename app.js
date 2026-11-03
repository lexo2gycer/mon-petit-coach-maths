const $ = (id) => document.getElementById(id);
const screens = ["home", "game", "result"];
const COLUMN_COUNT = 7;
const MAX_VALUE = 1000000;
const COLUMN_NAMES = ["millions", "centaines de mille", "dizaines de mille", "unités de mille", "centaines", "dizaines", "unités"];
let kind = "addition";
let current = null;
let stars = 0;
let challenge = 1;

function show(name) {
  screens.forEach(screen => $(screen).classList.toggle("hidden", screen !== name));
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
  const width = exerciseWidth();
  const min = 10 ** (width - 1);
  const max = Math.min(10 ** width - 1, MAX_VALUE - 1);
  let a, b;
  if (kind === "addition") {
    // Le résultat ne dépasse jamais un million.
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

  let out = '<div class="carry-label">' + (kind === "addition" ? "Retenues (si besoin)" : "Emprunts (si besoin)") + '</div>';
  out += '<div class="operation-grid">';
  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < COLUMN_COUNT; col++) {
    out += `<input class="digit carry" inputmode="numeric" maxlength="1" aria-label="Retenue ou emprunt : ${COLUMN_NAMES[col]}" data-carry="${col}" placeholder="·">`;
  }
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
  for (let col = 0; col < COLUMN_COUNT; col++) {
    out += `<input class="digit answer" inputmode="numeric" maxlength="1" aria-label="Résultat : ${COLUMN_NAMES[col]}" data-answer="${col}" placeholder="?">`;
  }
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
  stars++;
  $("stars").textContent = stars;
  $("result-emoji").textContent = "🌟";
  $("result-title").textContent = "Bravo, championne !";
  $("result-text").textContent = "Ton calcul est juste. Tu gagnes une étoile !";
  show("result");
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
document.querySelectorAll(".mission").forEach(button => {
  button.addEventListener("click", () => {
    kind = button.dataset.kind;
    challenge = 1;
    makeExercise();
    show("game");
  });
});
$("back").addEventListener("click", () => show("home"));
$("check").addEventListener("click", check);
$("solution").addEventListener("click", hint);
$("again").addEventListener("click", () => {
  challenge++;
  makeExercise();
  show("game");
});
$("home-button").addEventListener("click", () => show("home"));
