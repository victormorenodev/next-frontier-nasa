/* Pure mission actions. UI and persistence consume snapshots, never DOM state. */
globalThis.Engine = {
  start(random = Math.random) {
    const schedule = Array.from({length: Mission.TOTAL_SOLS}, () => Mission.eventsForSol(random));
    return {state: Indicators.createState(), mission: Mission.createMission(), flows: Flows.createFlows(),
      deck: Deck.createDeck(CardData.CARDS, schedule.reduce((a,b)=>a+b,0), random),
      index: 0, eventIndex: 0, schedule, savedSide: null};
  },
  answer(snapshot, side) {
    if (snapshot.mission.ended || snapshot.savedSide !== null) return snapshot;
    if (!['left','right'].includes(side)) throw Error('Unknown answer');
    const answer = snapshot.deck[snapshot.index][side];
    return {...snapshot, state: Indicators.apply(snapshot.state, answer.effects),
      flows: Flows.addAnswer(snapshot.flows, answer, snapshot.mission.elapsed), savedSide: side};
  },
  next(snapshot) {
    if (snapshot.mission.ended || snapshot.savedSide === null) return {snapshot, newSol:false, happened:[]};
    const next = {...snapshot, index:snapshot.index+1, eventIndex:snapshot.eventIndex+1, savedSide:null};
    if (next.eventIndex < next.schedule[next.mission.sol-1]) return {snapshot:next,newSol:false,happened:[]};
    const passed=Flows.passTime(next.state,next.flows,next.mission.elapsed,Mission.THIRDS_PER_SOL);
    return {snapshot:{...next,state:passed.state,flows:passed.flows,mission:Mission.advance(next.mission),eventIndex:0},newSol:true,happened:passed.happened};
  },
  end(snapshot) { return {...snapshot,mission:Mission.endMission(snapshot.mission,'quit')}; }
};
