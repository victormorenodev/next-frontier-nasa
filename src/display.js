/* Rounding is presentation only. Fractional physical stocks stay in the engine/save. */
globalThis.ResourceDisplay = {
  mode: 'hard',
  indicators() {
    const life = globalThis.CurrentGameData?.resources.easyLifeSupport || globalThis.GameData?.resources.easyLifeSupport;
    if (this.mode !== 'easy' || !life) return Indicators.INDICATORS;
    return [life, ...Indicators.INDICATORS.filter(ind => !ind.parts.some(q => life.parts.includes(q)))];
  },
  level(ind, state) {
    return Math.min(...ind.parts.map(q => state[q] / Indicators.QUANTITIES[q].max));
  },
  indicatorChange(ind, before, after) {
    if (this.mode === 'easy') return this.round(this.level(ind, after) * 100) - this.round(this.level(ind, before) * 100);
    return ind.parts.reduce((sum, q) => sum + after[q] - before[q], 0);
  },
  round(value) { return Math.sign(value) * Math.round(Math.abs(value)); },
  read(key, value) {
    const q = Indicators.QUANTITIES[key];
    return this.mode === 'easy'
      ? {value: this.round(value / q.max * 100), max: 100, unit: '', unitName: ''}
      : {value, max: q.max, unit: q.unit, unitName: q.unitName};
  },
  change(key, before, after) {
    return {...this.read(key, after), value: this.read(key, after).value - this.read(key, before).value};
  },
  effect(key, amount, before) {
    if (this.mode !== 'easy' || !Number.isFinite(before)) return this.read(key, amount);
    const after = Math.max(0, Math.min(Indicators.QUANTITIES[key].max, before + amount));
    return this.change(key, before, after);
  }
};
