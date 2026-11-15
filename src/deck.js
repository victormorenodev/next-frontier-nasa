/* Deck: validates category/card probabilities and builds independent weighted draws.
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
    need(card.imageCaption===undefined||typeof card.imageCaption==='string','imageCaption must be a string');
    need(card.source && card.source.institution && /^https?:\/\//.test(card.source.url || ''), 'source needs institution and http(s) url');
    SIDES.forEach(side => {
      const answer = card[side];
      need(answer && answer.label, `${side} answer needs a label`);
      need(!answer || answer.description === undefined || typeof answer.description === 'string', `${side} description must be a string`);
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

  // Independent draws with replacement: category first, then a card in that category.
  function weightedPick(items, random) {
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw Error('Random must be in [0, 1)');
    let cumulative = 0;
    for (const item of items) {
      cumulative += item.probability;
      if (roll < cumulative) return item;
    }
    // Only floating-point summation may leave a tiny gap below 1.
    return items.filter(item => item.probability > 0).at(-1);
  }

  function validateCategories(cards, categories) {
    const errors = [];
    const validProbability = n => Number.isFinite(n) && n >= 0 && n <= 1;
    const sumsToOne = items => Math.abs(items.reduce((sum, item) => sum + item.probability, 0) - 1) < 1e-9;
    if (!Array.isArray(categories) || !categories.length) return ['Missing categories'];
    const ids = new Set();
    for (const category of categories) {
      if (!category || typeof category.id !== 'string' || !category.id || ids.has(category.id) || typeof category.name !== 'string' || !category.name.trim() || !validProbability(category.probability)) {
        errors.push('Invalid or duplicate category'); continue;
      }
      ids.add(category.id);
      const group = cards.filter(card => card.category === category.id);
      if (!group.length || !group.every(card => validProbability(card.probability)) || !sumsToOne(group)) errors.push(`Invalid card probabilities in ${category.id}`);
    }
    if (!categories.every(c => c && validProbability(c.probability)) || !sumsToOne(categories)) errors.push('Category probabilities must sum to 1');
    const cardIds = new Set();
    for (const card of cards) {
      if (!ids.has(card.category)) errors.push(`${card.id}: unknown category`);
      if (cardIds.has(card.id)) errors.push(`${card.id}: duplicate card`);
      cardIds.add(card.id);
    }
    return errors;
  }

  function createDeck(cards, size = DECK_SIZE, random = Math.random, categories = GameData.categories) {
    if (!Number.isInteger(size) || size < 0) throw Error('Deck size must be a nonnegative integer');
    const problems = [...cards.flatMap(validateCard), ...validateCategories(cards, categories)];
    if (problems.length) throw new Error(`Invalid deck: ${problems.join('; ')}`);
    const groups = new Map(categories.map(category => [category.id, cards.filter(card => card.category === category.id)]));
    return Array.from({length: size}, () => {
      const category = weightedPick(categories, random);
      return weightedPick(groups.get(category.id), random);
    });
  }

  const api = {DECK_SIZE, DIFFICULTIES, validateCard, validateCategories, weightedPick, createDeck};
   root.Deck = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
