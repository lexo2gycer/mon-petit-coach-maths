const $ = (id) => document.getElementById(id);
const screens = ["home","game","result"];
let kind = "addition", current = null, stars = 0, challenge = 1, hintShown = false;

function show(name){screens.forEach(s=>$(s).classList.toggle("hidden",s!==name));}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function makeExercise(){
  const digits = challenge <= 2 ? 2 : 3;
  let a,b;
  if(kind==="addition"){
    a=rand(digits===2?21:121,digits===2?79:799);
    b=rand(digits===2?11:111,digits===2?89:899);
  } else {
    a=rand(digits===2?31:131,digits===2?899:999);
    b=rand(digits===2?12:111,Math.min(a-1,digits===2?89:899));
  }
  const width=digits;
  const aa=String(a).padStart(width,"0").split("").map(Number);
  const bb=String(b).padStart(width,"0").split("").map(Number);
  const result=kind==="addition"?a+b:a-b;
  const rr=String(result).padStart(width,"0").split("").map(Number);
  const carries=[];
  let carry=0;
  for(let i=width-1;i>=0;i--){
    if(kind==="addition"){
      const total=aa[i]+bb[i]+carry;
      carries[i]=Math.floor(total/10);
      carry=carries[i];
    } else {
      const top=aa[i]-(carry?1:0);
      carries[i]=(top<bb[i])?1:0;
      carry=carries[i];
    }
  }
  current={a,b,aa,bb,result,rr,width,carries};
  renderExercise();
}
function renderExercise(){
  $("mission-label").textContent=kind==="addition"?"MISSION ADDITION":"MISSION SOUSTRACTION";
  $("game-title").textContent=kind==="addition"?"Pose ton addition !":"Pose ta soustraction !";
  $("exercise-type").textContent=kind==="addition"?"Addition":"Soustraction";
  $("level").textContent=challenge<=2?1:2;
  $("progress-label").textContent="Défi "+challenge;
  $("instruction").textContent=kind==="addition"
    ?"Complète les petites retenues si nécessaire, puis écris le résultat chiffre par chiffre."
    :"Quand tu dois emprunter, indique 1 dans la case au-dessus de la colonne concernée, puis écris le résultat.";
  const {aa,bb,width,carries}=current;
  let out="";
  out+='<div class="carry-label">'+(kind==="addition"?"Retenues (si besoin)":"Emprunts (si besoin)")+'</div>';
  for(let i=0;i<3-width;i++) out+='<div></div>';
  for(let i=0;i<width;i++) out+=`<input class="digit carry" inputmode="numeric" maxlength="1" aria-label="Retenue colonne ${i+1}" data-carry="${i}" placeholder="·">`;
  for(let i=0;i<3-width;i++) out+='<div></div>';
  out+='<div class="number-cell"></div><div class="number-cell"></div><div class="number-cell"></div>';
  for(let i=0;i<3-width;i++) out+='<div></div>';
  out+=`<div class="number-cell">${aa.length===3?aa[0]:""}</div><div class="number-cell">${aa.length>=2?aa[aa.length-2]:""}</div><div class="number-cell">${aa[aa.length-1]}</div>`;
  out+=`<div class="operator">${kind==="addition"?"+":"−"}</div>`;
  out+=`<div class="number-cell">${bb.length===3?bb[0]:""}</div><div class="number-cell">${bb.length>=2?bb[bb.length-2]:""}</div><div class="number-cell">${bb[bb.length-1]}</div>`;
  out+='<div class="rule"></div>';
  for(let i=0;i<3-width;i++) out+='<div></div>';
  for(let i=0;i<width;i++) out+=`<input class="digit answer" inputmode="numeric" maxlength="1" aria-label="Résultat colonne ${i+1}" data-answer="${i}" placeholder="?">`;
  $("work-area").innerHTML=out;
  $("feedback").textContent="";$("feedback").className="feedback";hintShown=false;
}
function readInputs(selector,attr){
  const vals={};document.querySelectorAll(selector).forEach(el=>vals[el.dataset[attr]]=el.value.trim());return vals;
}
function check(){
  const answers=readInputs(".answer","answer"), carries=readInputs(".carry","carry");
  const {rr,width,carries:expected}=current;
  let missing=false, wrong=false;
  for(let i=0;i<width;i++){
    const key=String(i);
    if(!answers[key]) missing=true;
    else if(Number(answers[key])!==rr[i+(3-width)]) wrong=true;
  }
  // Retenues/emprunts : seules les cases nécessaires doivent contenir 1.
  for(let i=0;i<width;i++){
    const expectedCarry=expected[i+(3-width)]||0;
    const entered=carries[String(i)];
    if(expectedCarry===1 && entered!=="1") wrong=true;
    if(expectedCarry===0 && entered!=="" && entered!=="0") wrong=true;
  }
  if(missing){setFeedback("Complète tous les chiffres du résultat avant de vérifier.",false);return;}
  if(wrong){setFeedback("Pas tout à fait ! Regarde les colonnes et les retenues. Tu peux réessayer. 💪",false);return;}
  stars++;$("stars").textContent=stars;
  $("result-emoji").textContent="🌟";$("result-title").textContent="Bravo, championne !";
  $("result-text").textContent="Ton calcul est juste. Tu gagnes une étoile !";
  show("result");
}
function setFeedback(text,good){$("feedback").textContent=text;$("feedback").className="feedback "+(good?"good":"bad");}
function hint(){
  if(!current)return;
  const msg=kind==="addition"
    ?"Indice : commence toujours par les unités. Additionne les chiffres de la colonne, puis garde la dizaine en retenue si le total dépasse 9."
    :"Indice : commence par les unités. Si le chiffre du haut est trop petit, emprunte une dizaine à la colonne de gauche.";
  setFeedback(msg,true);
}
document.querySelectorAll(".mission").forEach(btn=>btn.addEventListener("click",()=>{kind=btn.dataset.kind;challenge=1;makeExercise();show("game");}));
$("back").addEventListener("click",()=>show("home"));
$("check").addEventListener("click",check);
$("solution").addEventListener("click",hint);
$("again").addEventListener("click",()=>{challenge++;makeExercise();show("game");});
$("home-button").addEventListener("click",()=>show("home"));
