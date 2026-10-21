(function (root) {
  'use strict';
  const puzzles = typeof module !== 'undefined' && module.exports ? require('./puzzles.js') : root.Puzzles;
  const prefix = 'mini-advent:v1:';
  function read(storage, day) {
    try {
      const record = JSON.parse(storage.getItem(prefix + day));
      if (!record || record.version !== 1 || !puzzles.validInput(day, record.input)) return null;
      return {
        version: 1,
        input: record.input,
        solved: record.solved === true && record.answer === puzzles.solve(day, record.input),
        answer: record.answer,
        attempts: Number.isSafeInteger(record.attempts) && record.attempts >= 0 ? record.attempts : 0
      };
    } catch { return null; }
  }
  function write(storage, day, record) {
    try {
      storage.setItem(prefix + day, JSON.stringify(record));
      return true;
    } catch { return false; }
  }
  function create(input) { return { version: 1, input, solved: false, answer: null, attempts: 0 }; }
  const api = { read, write, create, prefix };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Progress = api;
})(globalThis);
