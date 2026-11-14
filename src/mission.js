/* Whole-sol mission clock. elapsed stays in thirds for the resource-flow engine. */
(function (root) {
  'use strict';
  const FIRST_SOL = 1;
  const TOTAL_SOLS = GameData.mission.totalSols;
  const THIRDS_PER_SOL = 3;
  const EVENT_CHANCES = GameData.mission.eventChances;
  function createMission() {
    return {elapsed: 0, sol: FIRST_SOL, ended: false, reason: null};
  }
  function eventsForSol(random = Math.random) {
    const roll = random();
    return roll < EVENT_CHANCES.one ? 1 : 2;
  }
  function endMission(mission, reason = 'quit') {
    return mission.ended ? mission : {...mission, ended: true, reason};
  }
  function advance(mission) {
    if (mission.ended) return mission;
    const elapsed = mission.elapsed + THIRDS_PER_SOL;
    const done = elapsed >= TOTAL_SOLS * THIRDS_PER_SOL;
    return {...mission, elapsed, sol: Math.min(TOTAL_SOLS, mission.sol + 1),
      ended: done, reason: done ? 'complete' : null};
  }
  const api = {FIRST_SOL, TOTAL_SOLS, THIRDS_PER_SOL, EVENT_CHANCES, createMission, eventsForSol, advance, endMission};
   root.Mission = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
