const $=id=>document.getElementById(id);
let state=Mission.createState();
const format=(n,d=1)=>Math.max(0,n).toLocaleString('pt-BR',{maximumFractionDigits:d});
function render(){
  $('life-value').textContent=`${format(state.oxygen)} kg O₂`;
  $('life-detail').textContent=`Água: ${format(state.water)} kg · estoques separados`;
  $('life-meter').value=Math.max(0,Math.min(1,state.oxygen/60,state.water/600));
  const shielding=state.shieldWater/200;
  $('shield-value').textContent=`${format(shielding)} g/cm²`;
  $('shield-meter').value=Math.min(10,shielding);
  $('shield-detail').textContent=`${format(state.shieldWater,0)} kg de água sobre 20 m²`;
  $('energy-value').textContent=`${format(state.energy)} kWh`;$('energy-meter').value=Math.max(0,state.energy);
  $('food-value').textContent=`${format(state.food)} kg`;$('food-meter').value=Math.max(0,state.food);
  $('progress').value=state.completed;
  $('progress-label').textContent=state.done?`${state.completed}/30 sols concluídos`:`Sol ${state.sol} de 30`;
  $('card-count').textContent=state.done?`${state.decisions} decisões`:`Carta ${state.slot+1}/${Mission.cardsInSol(state.sol)}`;
  $('feedback').textContent=state.message||'Bem-vindo, comandante. Sua equipe está pronta.';
  const card=Mission.getCard(state);
  $('speaker').textContent=state.done?'Relatório da missão':card.speaker;
  $('duration').textContent=state.done?'Fim da operação':`Esta etapa: ≈ ${format(Mission.SOL_HOURS/Mission.cardsInSol(state.sol))} h`;
  $('portrait').textContent=state.done?(state.won?'✦':'↺'):card.icon;
  $('category').textContent=state.done?'RESULTADO':card.category;
  $('card-title').textContent=state.done?(state.won?'Você cuidou da equipe!':'Vamos tentar outra estratégia?'):card.title;
  $('card-text').textContent=state.done?(state.won?'Foram 30 sols de escolhas, reservas e trabalho em equipe. Reinicie para experimentar outras decisões.':'Observe os custos das cartas e mantenha reservas para os imprevistos. Você pode reiniciar a missão.'):card.text;
  ['choice-left','choice-right'].forEach((id,i)=>{
    const button=$(id);button.hidden=state.done;button.replaceChildren();
    if(!state.done){const label=document.createElement('strong'),cost=document.createElement('small');label.textContent=card.choices[i].label;cost.textContent=card.choices[i].cost;button.append(label,cost);}
  });
}
['choice-left','choice-right'].forEach((id,i)=>$(id).addEventListener('click',()=>{state=Mission.advance(state,i);render();}));
$('restart').addEventListener('click',()=>{state=Mission.createState();render();});
render();
