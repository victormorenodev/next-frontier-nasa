/* Pure mission actions. UI and persistence consume snapshots, never DOM state. */
globalThis.Engine = {
  start(random = Math.random, difficulty = 'hard', dailyCostResource = null) {
    if (!['easy','hard'].includes(difficulty)) throw Error('Unknown mission difficulty');
    if (dailyCostResource !== null && (typeof dailyCostResource !== 'string' || !Object.hasOwn(Indicators.QUANTITIES, dailyCostResource))) throw Error('Unknown daily consumption resource');
    const settings=GameData.mission.difficulties?.[difficulty];
    const allowed=settings?.allowedCardDifficulties || (difficulty==='easy'?['easy','medium']:['easy','medium','hard']);
    const schedule = Array.from({length: Mission.TOTAL_SOLS}, () => Mission.eventsForSol(random));
    const state = settings?.initialResourceFraction === undefined
      ? Indicators.createState()
      : Object.fromEntries(Object.entries(Indicators.QUANTITIES).map(([key,q]) => [key, q.max * settings.initialResourceFraction]));
    return {state, mission: {...Mission.createMission(), difficulty}, flows: Flows.createFlows(dailyCostResource),
      deck: Deck.createDeck(CardData.CARDS, schedule.reduce((a,b)=>a+b,0), random, GameData.categories, allowed),
      index: 0, eventIndex: 0, schedule, savedSide: null};
  },
  checkFailure(snapshot) {
    const flows = Flows.limitEffects(snapshot.flows, snapshot.mission.elapsed);
    if (flows !== snapshot.flows) snapshot = {...snapshot, flows};
    if (snapshot.mission.ended) return snapshot;
    const failedResource = Indicators.depleted(snapshot.state);
    return failedResource ? {...snapshot, mission: {...Mission.endMission(snapshot.mission, 'failed'), failedResource}} : snapshot;
  },
  answer(snapshot, side) {
    if (snapshot.mission.ended || snapshot.savedSide !== null) return snapshot;
    if (!['left','right'].includes(side)) throw Error('Unknown answer');
    const answer = snapshot.deck[snapshot.index][side];
    return this.checkFailure({...snapshot, state: Indicators.apply(snapshot.state, answer.effects),
      flows: Flows.addAnswer(snapshot.flows, answer, snapshot.mission.elapsed), savedSide: side});
  },
  next(snapshot) {
    if (snapshot.mission.ended || snapshot.savedSide === null) return {snapshot, newSol:false, happened:[]};
    const next = {...snapshot, index:snapshot.index+1, eventIndex:snapshot.eventIndex+1, savedSide:null};
    if (next.eventIndex < next.schedule[next.mission.sol-1]) return {snapshot:next,newSol:false,happened:[]};
    const passed=Flows.passTime(next.state,next.flows,next.mission.elapsed,Mission.THIRDS_PER_SOL, {stopOnEmpty:true});
    if (passed.failedResource) return {snapshot:{...next,state:passed.state,flows:passed.flows,
      mission:{...Mission.endMission(next.mission,'failed'),elapsed:next.mission.elapsed+passed.thirdsPassed,failedResource:passed.failedResource},eventIndex:0},newSol:true,happened:passed.happened};
    return {snapshot:{...next,state:passed.state,flows:passed.flows,mission:Mission.advance(next.mission),eventIndex:0},newSol:true,happened:passed.happened};
  },
  end(snapshot) { return {...snapshot,mission:Mission.endMission(snapshot.mission,'quit')}; }
};
