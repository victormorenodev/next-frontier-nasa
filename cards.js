/* Card data. Plain JS (not JSON) so it loads by opening index.html directly — no fetch, no server.

   Card format:
     id           unique text; two cards with the same id never come one after the other
     mock         true = test card: numbers are NOT real data
     difficulty   'easy' | 'medium' | 'hard'
     time         how long answering takes: '1/3', '2/3' or '1' sol.
                  Each third moves the day on: day → afternoon → night → next sol.
     description  what is happening (short, simple English for ages 7–12)
     image        path to a picture, relative to index.html
     imageAlt     what the picture shows, for screen readers
     source       {institution, url}: where the card's information comes from.
                  The back of the card shows only the institution; it links to the url.
     left, right  the two answers: {label, effects, ongoing, later}
                  effects  = changes right now, in each quantity's unit:
                             oxygen kg · water L · shield g/cm² · energy kWh · food kg
                  ongoing  = changes to what the base uses or makes EVERY SOL (see flows.js):
                             [{rates: {energy: -30}, after: 0, for: 3, note: 'Dusty panels'}]
                             rates per sol · after = sols to wait (default 0) · for = sols it lasts
                             (no `for` = forever)
                  later    = a one-off change some sols from now:
                             [{after: 2, effects: {food: 6}, note: 'Bigger lettuce'}]

   Shield: water around the shelter, 20 m². 100 L of water = 100 kg → 5 kg/m² = 0.5 g/cm².
   Cards that move water between the reserve and the shield keep the total mass.

   ALL CARDS BELOW ARE MOCKUPS FOR TESTING. The sources point to real pages on the topic,
   but the effect values were invented for the prototype. */
(function (root) {
  'use strict';

  const MOCK_IMAGE = 'images/mock-card.svg';

  const CARDS = [
    {
      id: 'mock-dusty-panels', mock: true, difficulty: 'easy', time: '1/3',
      description: 'Dust is covering the solar panels. Less sunlight means less power.',
      image: MOCK_IMAGE, imageAlt: 'Solar panels on a dusty Mars base',
      source: {institution: 'NASA JPL', url: 'https://www.jpl.nasa.gov/images/pia25284-insights-power-generation-after-landing-and-spring-2022/'},
      left:  {label: 'Wait for wind', effects: {},
              ongoing: [{rates: {energy: -30}, for: 3, note: 'Dusty panels'}]},
      right: {label: 'Clean them',    effects: {energy: -8, oxygen: -2}}
    },
    {
      id: 'mock-oxygen-repair', mock: true, difficulty: 'medium', time: '2/3',
      description: 'The oxygen machine is making a strange noise. It needs a repair.',
      image: MOCK_IMAGE, imageAlt: 'A machine that makes oxygen',
      source: {institution: 'NASA', url: 'https://www.nasa.gov/solar-system/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/'},
      left:  {label: 'Repair later', effects: {},
              ongoing: [{rates: {oxygen: -1.5}, for: 4, note: 'Weaker machine'}]},
      right: {label: 'Repair now',   effects: {energy: -10},
              ongoing: [{rates: {oxygen: -3}, for: 1, note: 'Machine off for repair'}]}
    },
    {
      id: 'mock-solar-storm', mock: true, difficulty: 'hard', time: '1',
      description: 'A solar storm is coming! Thicker walls of water can make the shelter safer.',
      image: MOCK_IMAGE, imageAlt: 'The Sun throwing out a big storm',
      source: {institution: 'NASA', url: 'https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm/'},
      left:  {label: 'Keep it as is',      effects: {}},
      right: {label: 'Add water to walls', effects: {water: -100, shield: 0.5, energy: -6}}
    },
    {
      id: 'mock-lettuce', mock: true, difficulty: 'easy', time: '1/3',
      description: 'The lettuce in the greenhouse is growing. Pick it now or let it grow more?',
      image: MOCK_IMAGE, imageAlt: 'Lettuce growing under lights',
      source: {institution: 'NASA', url: 'https://www.nasa.gov/wp-content/uploads/2019/04/veggie_fact_sheet_508.pdf'},
      left:  {label: 'Pick it now', effects: {food: 3}},
      right: {label: 'Let it grow', effects: {},
              ongoing: [{rates: {energy: -3}, for: 2, note: 'Grow lights'}],
              later: [{after: 2, effects: {food: 6}, note: 'Bigger lettuce'}]}
    },
    {
      id: 'mock-water-filter', mock: true, difficulty: 'medium', time: '1/3',
      description: 'The water filter is clogged. Cleaning it uses power.',
      image: MOCK_IMAGE, imageAlt: 'A water filter',
      source: {institution: 'NASA', url: 'https://ntrs.nasa.gov/api/citations/20210024855/downloads/BVAD_2.15.22-final.pdf'},
      left:  {label: 'Skip it',          effects: {},
              ongoing: [{rates: {water: -6}, for: 3, note: 'Dirty filter'}]},
      right: {label: 'Clean the filter', effects: {energy: -14}}
    },
    {
      id: 'mock-supply-depot', mock: true, difficulty: 'medium', time: '1',
      description: 'There is food stored far from the base. The rover can bring some back.',
      image: MOCK_IMAGE, imageAlt: 'A rover driving on Mars',
      source: {institution: 'NASA', url: 'https://trek.nasa.gov/mars/'},
      left:  {label: 'Stay home',      effects: {}},
      right: {label: 'Drive the rover', effects: {energy: -22, food: 5}}
    },
    {
      id: 'mock-hot-battery', mock: true, difficulty: 'hard', time: '2/3',
      description: 'The battery is getting too hot. We must cool it or use less power.',
      image: MOCK_IMAGE, imageAlt: 'A big battery with a warning light',
      source: {institution: 'NASA', url: 'https://science.nasa.gov/blogs/insight/'},
      left:  {label: 'Cool it down',   effects: {energy: -25, water: -10}},
      right: {label: 'Lights off', effects: {},
              ongoing: [{rates: {energy: 10, food: -0.5}, for: 2, note: 'Lights off'}]}
    },
    {
      id: 'mock-spoiled-food', mock: true, difficulty: 'easy', time: '1/3',
      description: 'Some food packs look damaged. Is the food inside still safe?',
      image: MOCK_IMAGE, imageAlt: 'Food packs in a storage box',
      source: {institution: 'Canadian Space Agency', url: 'https://www.asc-csa.gc.ca/eng/sciences/food-production/'},
      left:  {label: 'Throw them out', effects: {food: -4}},
      right: {label: 'Check each one', effects: {energy: -6, food: -1}}
    },
    {
      id: 'mock-thirsty-crew', mock: true, difficulty: 'hard', time: '2/3',
      description: 'The crew needs more water. We could take some from the shelter walls.',
      image: MOCK_IMAGE, imageAlt: 'Water tanks around a shelter',
      source: {institution: 'NASA', url: 'https://www.nasa.gov/reference/4-0-human-performance/'},
      left:  {label: 'Use wall water', effects: {shield: -0.5, water: 100}},
      right: {label: 'Save water',     effects: {},
              ongoing: [{rates: {water: 2}, for: 3, note: 'Saving water'}]}
    },
    {
      id: 'mock-plant-seeds', mock: true, difficulty: 'medium', time: '2/3',
      description: 'We have new seeds. Plants take many sols to grow, but they give food later.',
      image: MOCK_IMAGE, imageAlt: 'Seeds and small plants in pots',
      source: {institution: 'Canadian Space Agency', url: 'https://www.asc-csa.gc.ca/eng/youth-educators/activities/fitness-and-nutrition/interplanetary-farming.asp'},
      left:  {label: 'Keep the seeds', effects: {}},
      right: {label: 'Plant them',     effects: {water: -20, energy: -10},
              ongoing: [
                {rates: {energy: -3}, for: 13, note: 'Grow lights'},
                {rates: {food: 1.5}, after: 3, for: 10, note: 'New plants'}
              ]}
    }
  ];

  const api = {CARDS};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CardData = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
