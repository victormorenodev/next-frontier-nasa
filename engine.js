/* Physical quantities; equipment and event values are illustrative gameplay parameters. */
(function (root) {
  const SOL_HOURS = 24.6597;
  const templates = [
    {speaker:'Lia · Engenharia',icon:'⚙',category:'Manutenção',title:'O gerador precisa de atenção.',text:'Uma peça está vibrando. Podemos fazer a manutenção agora ou usar nossa reserva de oxigênio.',choices:[{label:'Fazer manutenção',cost:'−18 kWh · +3 kg de O₂',effects:{energy:-18,oxygen:3},message:'A manutenção recuperou parte da produção de oxigênio.'},{label:'Usar a reserva',cost:'−2 kg de O₂ adicionais',effects:{oxygen:-2},message:'A reserva cobriu a produção que perdemos.'}]},
    {speaker:'Ravi · Cultivo',icon:'✿',category:'Alimentos',title:'A câmara de alimentos aqueceu.',text:'Podemos resfriar a reserva ou separar os pacotes comprometidos. A comida segura precisa ser preservada.',choices:[{label:'Resfriar a câmara',cost:'−16 kWh',effects:{energy:-16},message:'Os alimentos foram preservados.'},{label:'Separar os pacotes',cost:'−4 kg de alimentos secos',effects:{food:-4},message:'Os pacotes comprometidos foram retirados do estoque.'}]},
    {speaker:'Lia · Engenharia',icon:'ϟ',category:'Energia solar',title:'Poeira nos painéis.',text:'A poeira está reduzindo a geração. Uma limpeza usa energia; esperar deixa menos energia disponível neste sol.',choices:[{label:'Limpar com o robô',cost:'−12 kWh',effects:{energy:-12},message:'O robô limpou os painéis.'},{label:'Esperar até amanhã',cost:'−55 kWh de geração neste sol',effects:{energy:-55},message:'A geração perdida foi descontada do orçamento deste sol.'}]},
    {speaker:'Noa · Segurança',icon:'⬡',category:'Abrigo',title:'Como distribuir nossa água?',text:'Reservatórios ao redor do abrigo ajudam a formar a blindagem. Podemos reforçá-la ou devolver parte dessa água à reserva utilizável.',choices:[{label:'Reforçar o abrigo',cost:'200 kg de água → blindagem · −8 kWh',action:'shield',message:'A água foi redistribuída para a blindagem.'},{label:'Aumentar a reserva de água',cost:'200 kg de blindagem → água · −4 kWh',action:'water',message:'A água da blindagem voltou à reserva utilizável.'}]},
    {speaker:'Ivo · Exploração',icon:'◇',category:'Reserva externa',title:'Suprimentos no depósito externo.',text:'Há uma reserva de comida deixada antes da chegada da equipe. Buscar uma parte exige energia do veículo.',choices:[{label:'Buscar até 5 kg',cost:'−22 kWh · retira comida do depósito',action:'cargo',message:'O veículo trouxe alimentos do depósito externo.'},{label:'Preservar a bateria',cost:'Sem custo extra; consumo normal continua',effects:{},message:'A equipe permaneceu na base e preservou a bateria.'}]},
    {speaker:'Lia · Engenharia',icon:'≈',category:'Tratamento de água',title:'O filtro está obstruído.',text:'Limpar o filtro consome energia. Podemos adiar e descartar a água que não conseguimos tratar neste intervalo.',choices:[{label:'Limpar o filtro',cost:'−14 kWh',effects:{energy:-14},message:'O tratamento de água foi mantido.'},{label:'Adiar a limpeza',cost:'−12 kg de água adicionais',effects:{water:-12},message:'A água sem tratamento foi retirada da reserva utilizável.'}]}
  ];
  function createState(){return {sol:1,slot:0,completed:0,decisions:0,oxygen:60,water:600,shieldWater:1600,energy:240,food:100,cargo:30,done:false,won:false,message:''};}
  function cardsInSol(sol){return sol<=18?1:sol<=27?2:3;}
  function getCard(s){return templates[(s.sol-1+s.slot*2)%templates.length];}
  function advance(state,index){
    if(state.done) return {...state};
    if(index!==0&&index!==1) throw new Error('Invalid choice');
    const s={...state}, choice=getCard(s).choices[index];
    s.message=choice.message;
    if(choice.action==='shield'){
      if(s.water<200){s.message='Água insuficiente para a transferência. Escolha a outra opção.';return s;}
      s.water-=200;s.shieldWater+=200;s.energy-=8;
    }else if(choice.action==='water'){
      if(s.shieldWater<200){s.message='Não há água suficiente na blindagem. Escolha a outra opção.';return s;}
      s.shieldWater-=200;s.water+=200;s.energy-=4;
    }else if(choice.action==='cargo'){
      if(s.cargo<=0){s.message='O depósito está vazio. Escolha preservar a bateria.';return s;}
      const amount=Math.min(5,s.cargo);s.cargo-=amount;s.food+=amount;s.energy-=22;
    }else Object.entries(choice.effects).forEach(([k,v])=>s[k]+=v);
    const fraction=1/cardsInSol(s.sol);
    // Continuous balance per elapsed fraction of a sol, not per card.
    s.oxygen+=(3-4*.84*SOL_HOURS/24)*fraction;
    s.food-=4*.62*SOL_HOURS/24*fraction;
    // Simplified net water loss: 4 kg/sol, including assumed recovery.
    s.water-=4*fraction;
    // Illustrative combined solar/reactor budget minus operating loads.
    s.energy=Math.min(300,s.energy+40*fraction);
    s.decisions++;s.slot++;
    if(s.slot===cardsInSol(s.sol)){s.completed=s.sol;s.sol++;s.slot=0;}
    const failed=['oxygen','water','energy','food'].find(k=>s[k]<=0);
    if(failed){s.done=true;s.message='Um recurso essencial acabou. A operação foi interrompida para proteger a equipe.';}
    else if(s.completed===30){s.done=true;s.won=true;s.message='Missão concluída! Os quatro astronautas estão seguros.';}
    return s;
  }
  const api={createState,cardsInSol,getCard,advance,SOL_HOURS};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.Mission=api;
})(typeof globalThis!=='undefined'?globalThis:this);
