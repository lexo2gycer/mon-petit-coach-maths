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

  const carryByColumn = [0, 0, 0];
  let carry = 0;
  const offset = 3 - width;

  for (let local = width - 1; local >= 0; local--) {
    const column = offset + local;
    if (kind === "addition") {
      const total = aa[local] + bb[local] + carry;
      const carryOut = Math.floor(total / 10);
      if (column > 0) carryByColumn[column - 1] = carryOut;
      carry = carryOut;
    } else {
      const top = aa[local] - carry;
      const borrowOut = top < bb[local] ? 1 : 0;
      if (column > 0) carryByColumn[column - 1] = borrowOut;
      carry = borrowOut;
    }
  }

  current = { aa, bb, result, resultDigits, width, offset, carryByColumn };
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

  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += local >= 0 && local < width
      ? `<input class="digit carry" inputmode="numeric" maxlength="1" aria-label="Retenue ou emprunt" data-carry="${col}" placeholder="·">`
      : '<div class="empty-cell"></div>';
  }

  out += '<div class="sign-cell"></div>';
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += `<div class="number-cell">${local >= 0 && local < width ? aa[local] : ""}</div>`;
  }

  out += `<div class="operator">${kind === "addition" ? "+" : "−"}</div>`;
  for (let col = 0; col < 3; col++) {
    const local = col - offset;
    out += `<div class="number-cell">${local >= 0 && local < width ? bb[local] : ""}</div>`;
  }

  out += '<div class="rule"></div><div class="sign-cell"></div>';
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
  const { resultDigits, carryByColumn, offset } = current;
  let wrong = false;

  // Résultat : la case des centaines peut rester vide si le résultat est inférieur à 100.
  for (let col = 0; col < 3; col++) {
    const entered = answers[col] || "";
    const expected = resultDigits[col];

    if (expected === 0 && col === 0 && entered === "") {
      // Centaine non utilisée : case facultative.
    } else if (entered === "" || Number(entered) !== expected) {
      wrong = true;
    }

    // Ne contrôler une retenue que si la colonne cible possède une case visible.
    // Pour deux chiffres (offset=1), un report des dizaines vers les centaines
    // devient directement le chiffre des centaines du résultat : aucune case
    // de retenue supplémentaire ne doit être demandée.
    const hasVisibleCarryCell = col >= offset;
    if (hasVisibleCarryCell) {
      const expectedCarry = carryByColumn[col] || 0;
      const enteredCarry = carries[col] || "";
      if (expectedCarry === 1 && enteredCarry !== "1") wrong = true;
      if (expectedCarry === 0 && enteredCarry !== "" && enteredCarry !== "0") wrong = true;
    }
  }

  if (wrong) {
    setFeedback("Pas tout à fait ! Vérifie chaque colonne et les retenues. Tu peux réessayer. 💪", false);
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
