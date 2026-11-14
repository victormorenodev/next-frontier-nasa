/* Mission state: time passed, current sol (Mars day), part of the day, and whether it is over.
   No DOM here, so it also runs in Node for tests.

   Time is counted in THIRDS of a sol, so 1/3 + 1/3 + 1/3 is exactly one sol (no rounding).
   Each sol has three parts: day → afternoon → night, then the next sol starts with day. */
(function (root) {
  'use strict';

  const FIRST_SOL = 1;
  const THIRDS_PER_SOL = 3;
  const PERIODS = ['day', 'afternoon', 'night'];   // index = thirds already used in this sol

  // Builds the derived fields from the total time passed.
  function at(elapsed, base) {
    return {
      ...base,
      elapsed,                                              // thirds of a sol since the start
      sol: FIRST_SOL + Math.floor(elapsed / THIRDS_PER_SOL), // the sol we are in now
      period: PERIODS[elapsed % THIRDS_PER_SOL]
    };
  }

  function createMission() {
    return at(0, {ended: false, reason: null});
  }

  // Lets time pass: `thirds` = 1 (1/3 sol), 2 (2/3 sol) or 3 (1 sol). Nothing moves after the end.
  function advance(mission, thirds) {
    if (!Number.isInteger(thirds) || thirds < 0) throw new Error(`Time must be whole thirds of a sol, got ${thirds}`);
    if (mission.ended) return mission;
    return at(mission.elapsed + thirds, mission);
  }

  // Ends the mission. `reason`: 'quit' (player pressed End mission) or 'complete' (deck finished).
  // Returns a new mission; ending twice changes nothing.
  function endMission(mission, reason = 'quit') {
    return mission.ended ? mission : {...mission, ended: true, reason};
  }

  const api = {FIRST_SOL, THIRDS_PER_SOL, PERIODS, createMission, advance, endMission};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Mission = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
