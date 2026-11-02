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
  const resultDigits = String(result).padStart(3, "0").split("").map(Number);

  // Calcul des retenues/emprunts à afficher au-dessus de la colonne qui reçoit
  // le report. Les colonnes sont indexées C=0, D=1, U=2.
  const carryByColumn = [0, 0, 0];
  let carry = 0;
  const offset = 3 - width;

  for (let local = width - 1; local >= 0; local--) {
    const column = offset + local;

    if (kind === "addition") {
      const total = aa[local] + bb[local] + carry;
      const carryOut = total >= 10 ? 1 : 0;
      if (column > 0) carryByColumn[column - 1] = carryOut;
      carry = carryOut;
    } else {
      const topAfterBorrow = aa[local] - carry;
      const borrowOut = topAfterBorrow < bb[local] ? 1 : 0;
      if (column > 0) carryByColumn[column - 1] = borrowOut;
      carry = borrowOut;
    }
  }

  current = { a, b, result, aa, bb, resultDigits, width, offset, carryByColumn };
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

  const { aa, bb, width, offset } = current;
  let out = '<div class="carry-label">' +
    (kind === "addition" ? "Retenues (si besoin)" : "Emprunts (si besoin)") +
    '</div><div class="operation-grid">';

  // Rangée des retenues/emprunts.
  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += local >= 0 && local < width
      ? `<input class="digit carry" inputmode="numeric" maxlength="1" aria-label="Retenue ou emprunt colonne ${col}" data-carry="${col}" placeholder="·">`
      : '<div class="empty-cell"></div>';
  }

  // Premier nombre.
  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += `<div class="number-cell">${local >= 0 && local < width ? aa[local] : ""}</div>`;
  }

  // Signe à gauche du deuxième nombre.
  out += `<div class="operator">${kind === "addition" ? "+" : "−"}</div>`;
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += `<div class="number-cell">${local >= 0 && local < width ? bb[local] : ""}</div>`;
  }

  out += '<div class="rule"></div><div class="sign-cell"></div>';

  // Toujours trois cases de résultat, sans indiquer à l'avance le nombre de chiffres.
  for (let col = 0; col < 3; col++) {
    out += `<input class="digit answer" inputmode="numeric" maxlength="1"
      aria-label="Résultat colonne ${col === 0 ? "centaines" : col === 1 ? "dizaines" : "unités"}"
      data-answer="${col}" placeholder="?">`;
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
  const { result, carryByColumn, offset } = current;

  // Compare la valeur numérique, pas le nombre de zéros placés devant.
  // Ainsi 72, 072 et (case centaines vide + 7 + 2) sont tous acceptés.
  const enteredText = [answers[0] || "", answers[1] || "", answers[2] || ""].join("");
  if (!enteredText.trim()) {
    setFeedback("Écris ton résultat dans les cases avant de vérifier.", false);
    return;
  }

  const enteredResult = Number(enteredText);
  let wrong = !Number.isFinite(enteredResult) || enteredResult !== result;

  // Contrôle indépendant des retenues/emprunts visibles.
  for (let col = offset; col < 3; col++) {
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
