/* Deck: checks card data, shuffles and builds a shuffled deck sized to the mission event schedule.
   No DOM here, so it also runs in Node for tests. */
(function (root) {
  'use strict';

  const Indicators = root.Indicators;

  const DECK_SIZE = GameData.mission.totalSols;
  const DIFFICULTIES = {easy: GameData.interface?.easy || 'Easy', medium: GameData.interface?.medium || 'Medium', hard: GameData.interface?.hard || 'Hard'};
  const SIDES = ['left', 'right'];

  // Returns a list of problems with a card (empty list = card is fine).
  function validateCard(card) {
    const problems = [];
    const need = (ok, msg) => { if (!ok) problems.push(`${card && card.id}: ${msg}`); };
    need(card && typeof card.id === 'string' && card.id, 'missing id');
    need(card.difficulty in DIFFICULTIES, `difficulty must be one of ${Object.keys(DIFFICULTIES).join(', ')}`);
    need(typeof card.description === 'string' && card.description, 'missing description');
    need(typeof card.image === 'string' && card.image, 'missing image');
    need(card.source && card.source.institution && /^https?:\/\//.test(card.source.url || ''), 'source needs institution and http(s) url');
    SIDES.forEach(side => {
      const answer = card[side];
      need(answer && answer.label, `${side} answer needs a label`);
      const known = (obj, what) => Object.keys(obj || {}).forEach(key =>
        need(key in Indicators.QUANTITIES, `${side} ${what} on unknown quantity "${key}"`));
      const wholeSols = (n, ok0) => n == null || (Number.isInteger(n) && (ok0 ? n >= 0 : n > 0));
      known(answer && answer.effects, 'effect');
      ((answer && answer.ongoing) || []).forEach((o, i) => {
        need(o.rates && Object.keys(o.rates).length, `${side} ongoing[${i}] needs rates`);
        known(o.rates, `ongoing[${i}]`);
        need(wholeSols(o.after, true) && wholeSols(o.for, false), `${side} ongoing[${i}] after/for must be whole sols (for > 0)`);
      });
      ((answer && answer.later) || []).forEach((l, i) => {
        need(Number.isInteger(l.after) && l.after > 0, `${side} later[${i}] needs after ≥ 1 sol`);
        need(l.effects && Object.keys(l.effects).length, `${side} later[${i}] needs effects`);
        known(l.effects, `later[${i}]`);
      });
    });
    return problems;
  }

  // Fisher–Yates shuffle. `random` returns 0 ≤ n < 1 (tests pass a seeded one).
  function shuffle(list, random = Math.random) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Builds a mission deck of `size` cards. Cards repeat when there are fewer than `size`:
  // the deck is made of shuffled rounds of all cards, so every card appears a similar
  // number of times. Inside a round no card repeats; between rounds, if a round would start
  // with the card that ended the previous one, its first two cards swap places.
  // Result: two equal cards never come one after the other.
  function createDeck(cards, size = DECK_SIZE, random = Math.random) {
    const problems = cards.flatMap(validateCard);
    if (problems.length) throw new Error(`Invalid cards:\n${problems.join('\n')}`);
    if (cards.length < 2 && size > 1) throw new Error('Need at least 2 different cards to avoid repeats');

    const deck = [];
    while (deck.length < size) {
      const round = shuffle(cards, random);
      const last = deck[deck.length - 1];
      if (GameData.mission.avoidConsecutive && last && round[0].id === last.id) [round[0], round[1]] = [round[1], round[0]];
      deck.push(...round.slice(0, size - deck.length));
    }
    return deck;
  }

  const api = {DECK_SIZE, DIFFICULTIES, validateCard, shuffle, createDeck};
   root.Deck = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
