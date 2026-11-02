const $ = (id) => document.getElementById(id);
const screens = ["home", "game", "result"];
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

function makeExercise() {
  const width = challenge <= 2 ? 2 : 3;
  let a, b;

  if (kind === "addition") {
    a = rand(width === 2 ? 21 : 121, width === 2 ? 79 : 799);
    b = rand(width === 2 ? 11 : 111, width === 2 ? 89 : 899);
  } else {
    a = rand(width === 2 ? 31 : 131, width === 2 ? 899 : 999);
    b = rand(width === 2 ? 12 : 111, Math.min(a - 1, width === 2 ? 89 : 899));
  }

  const aa = String(a).padStart(width, "0").split("").map(Number);
  const bb = String(b).padStart(width, "0").split("").map(Number);
  const result = kind === "addition" ? a + b : a - b;
  const rr = String(result).padStart(width, "0").split("").map(Number);

  // Retenue/emprunt à inscrire au-dessus de la colonne où il arrive.
  const carryIn = Array(width).fill(0);
  let carry = 0;

  for (let i = width - 1; i >= 0; i--) {
    if (kind === "addition") {
      const total = aa[i] + bb[i] + carry;
      const carryOut = Math.floor(total / 10);
      if (i > 0) carryIn[i - 1] = carryOut;
      carry = carryOut;
    } else {
      const top = aa[i] - carry;
      const borrowOut = top < bb[i] ? 1 : 0;
      if (i > 0) carryIn[i - 1] = borrowOut;
      carry = borrowOut;
    }
  }

  current = { aa, bb, rr, width, carryIn };
  renderExercise();
}

function renderExercise() {
  $("mission-label").textContent = kind === "addition" ? "MISSION ADDITION" : "MISSION SOUSTRACTION";
  $("game-title").textContent = kind === "addition" ? "Pose ton addition !" : "Pose ta soustraction !";
  $("exercise-type").textContent = kind === "addition" ? "Addition" : "Soustraction";
  $("level").textContent = challenge <= 2 ? 1 : 2;
  $("progress-label").textContent = "Défi " + challenge;
  $("instruction").textContent = kind === "addition"
    ? "Commence par les unités. Place la retenue au-dessus de la colonne suivante si nécessaire."
    : "Commence par les unités. Indique au-dessus de la colonne de gauche quand tu dois emprunter.";

  const { aa, bb, width } = current;
  const offset = 3 - width;
  let out = '<div class="carry-label">' +
    (kind === "addition" ? "Retenues (si besoin)" : "Emprunts (si besoin)") +
    '</div><div class="operation-grid">';

  // Ligne des retenues : trois colonnes C, D, U.
  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += local >= 0 && local < width
      ? `<input class="digit carry" inputmode="numeric" maxlength="1" aria-label="Retenue ou emprunt" data-carry="${local}" placeholder="·">`
      : '<div class="empty-cell"></div>';
  }

  // Premier nombre.
  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += `<div class="number-cell">${local >= 0 && local < width ? aa[local] : ""}</div>`;
  }

  // Signe à gauche, puis deuxième nombre.
  out += `<div class="operator">${kind === "addition" ? "+" : "−"}</div>`;
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += `<div class="number-cell">${local >= 0 && local < width ? bb[local] : ""}</div>`;
  }

  out += '<div class="rule"></div><div class="sign-cell"></div>';

  // Résultat aligné sous C, D et U.
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += local >= 0 && local < width
      ? `<input class="digit answer" inputmode="numeric" maxlength="1" aria-label="Chiffre du résultat" data-answer="${local}" placeholder="?">`
      : '<div class="empty-cell"></div>';
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
  const { rr, width, carryIn } = current;
  let missing = false;
  let wrong = false;

  for (let i = 0; i < width; i++) {
    if (!answers[i]) missing = true;
    else if (Number(answers[i]) !== rr[i]) wrong = true;

    const expected = carryIn[i] || 0;
    const entered = carries[i] || "";
    if (expected === 1 && entered !== "1") wrong = true;
    if (expected === 0 && entered !== "" && entered !== "0") wrong = true;
  }

  if (missing) {
    setFeedback("Complète tous les chiffres du résultat avant de vérifier.", false);
    return;
  }
  if (wrong) {
    setFeedback("Pas tout à fait ! Regarde les colonnes et les retenues. Tu peux réessayer. 💪", false);
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
    : "Indice : commence par les unités. Si le chiffre du haut est trop petit, emprunte une dizaine à la colonne de gauche.";
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
