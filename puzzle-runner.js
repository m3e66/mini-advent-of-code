(() => {
  'use strict';
  const day = document.body.dataset.day;
  const moneyAnswer = Puzzles.answerFormat(day) === 'money';
  const binaryAnswer = Puzzles.answerFormat(day) === 'binary';
  let storage;
  try { storage = window.localStorage; } catch { storage = null; }
  let record = Progress.read(storage, day) || Progress.create(Puzzles.generate(day));
  const panel = document.getElementById('puzzleControls');
  panel.innerHTML = `
    <h2>--- Your puzzle input ---</h2>
    <p class="muted">Your input and progress are saved in this browser.</p>
    <pre id="puzzleInput" class="puzzle-input" tabindex="0" aria-label="Puzzle input"></pre>
    <p class="input-actions"><button type="button" class="text-button" id="copyInput">[Copy input]</button> <a id="downloadInput">[Download input]</a></p>
    <form id="answerForm" novalidate>
      <label for="answer">Your answer</label>
      <input id="answer" name="answer" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="Enter a whole number" aria-describedby="answerFeedback">
      <button type="submit" class="text-button" id="submitAnswer">[Submit]</button>
    </form>
    <p id="answerFeedback" role="status" aria-live="polite"></p>
    <p id="inputFeedback" role="status" class="muted"></p>
    <p id="storageNotice" class="storage-notice" hidden>Browser storage is unavailable. You can still solve this puzzle, but progress will not survive a reload.</p>
    <details class="puzzle-hint"><summary>[Need a hint?]</summary><p id="hintText"></p></details>`;
  const input = document.getElementById('answer');
  if (moneyAnswer) {
    panel.querySelector('label[for="answer"]').textContent = 'Your answer (dollars)';
    input.inputMode = 'decimal';
    input.placeholder = 'Example: 693.60';
  }
  if (binaryAnswer) {
    panel.querySelector('label[for="answer"]').textContent = 'Your answer (trip results)';
    input.placeholder = 'One 0 or 1 per trip; keep leading zeroes';
  }
  const feedback = document.getElementById('answerFeedback');
  const save = () => {
    document.getElementById('storageNotice').hidden = Progress.write(storage, day, record);
    // The parent rereads storage rather than trusting a supplied score.
    if (window.parent !== window) window.parent.postMessage({ type: 'mini-advent-progress', day }, location.origin);
  };
  const draw = () => {
    document.getElementById('puzzleInput').textContent = record.input;
    input.disabled = record.solved;
    document.getElementById('submitAnswer').disabled = record.solved;
    if (record.solved) {
      input.value = Puzzles.formatAnswer(day, record.answer);
      feedback.textContent = 'Correct! You earned a star. *';
      if (day === '67') feedback.textContent += record.answer > 5000
        ? ' The elves can afford the supercharger upgrade.'
        : ' The elves cannot afford the supercharger upgrade; they need more than $5,000.';
      feedback.className = 'gold';
    }
  };
  const download = document.getElementById('downloadInput');
  const inputUrl = URL.createObjectURL(new Blob([record.input + '\n'], { type: 'text/plain;charset=utf-8' }));
  download.href = inputUrl;
  download.download = `mini-advent-day-${day}.txt`;
  // Keep this URL valid during back/forward-cache restores; the browser releases it when the document is discarded.
  document.getElementById('hintText').textContent = moneyAnswer
    ? 'Split trees at blank lines. Count rows, o symbols, and @ symbols per tree. Add the surcharge only above 10 rolls, then apply 20% markup to the entire cost. Use cents to avoid rounding errors.'
    : binaryAnswer
    ? 'Search possible action orders while tracking cash, water, capacity, used buckets and wells, and remaining exchanges. A cheap-looking purchase may block a better plan. Keep leading zeroes in the final trip-results string.'
    : day === '24'
    ? 'Track x, y, and z from (0,0,0), moving one house at a time. Count every arrival except the entrance, including houses between instruction endpoints. Multiply the largest visit count by the number of houses tied at that count.'
    : day === '25'
    ? 'Keep running weight and volume totals in input order. If the next gift would exceed either 10,000 limit, start a new round before loading that gift. An exact fit is allowed.'
    : day === '74'
    ? 'Read vaccination status and the two-digit age first. Sum servings of PIZZA, EGG, SALAD, and HAM. Compare with that guest’s threshold, then charge one bill if sick: $528 below age 18, otherwise $1647.'
    : day === '2000'
    ? 'Keep alive/dead state separate from age zero. Update the whole grid simultaneously, then check the eight machine neighbors. A repeated occupancy pattern that never reached the machine contributes zero.'
    : day === '67'
    ? 'Track symbol positions for doubling windows. When skipping, ignore modifiers and count only { and } until two changes have been skipped. Start your balance at 67.'
    : day === '2'
    ? 'For each row, add 6 W per light and 234 W per machine. Divide by 500 and round up, then add the row results. Rows cannot share spare capacity.'
    : day === '777'
    ? 'Sum the grid once, then independently add each uniform row and each uniform column. An intersection receives both bonuses.'
    : day === '-1'
    ? 'Use the row index modulo that row’s length. Compare each chosen digit with the previous chosen digit.'
    : day === '2050'
      ? 'Build the eligible set first. For each candidate hour, simulate forward jumps until the next arrival exceeds 744. Keep the smallest hour when scores tie.'
      : 'Follow the rules and examples above for this puzzle.';
  document.getElementById('copyInput').addEventListener('click', async () => {
    const status = document.getElementById('inputFeedback');
    try {
      await navigator.clipboard.writeText(record.input);
      status.textContent = 'Input copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById('puzzleInput'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = 'Clipboard access is unavailable. Input selected; use Ctrl+C / ⌘C, or Download input.';
    }
  });
  document.getElementById('answerForm').addEventListener('submit', event => {
    event.preventDefault();
    if (record.solved) return;
    feedback.className = '';
    let result;
    try {
      result = Puzzles.checkAnswer(day, record.input, input.value);
    } catch {
      feedback.textContent = 'This puzzle could not check your answer. Your attempt was not recorded. Please reload and try again.';
      return;
    }
    if (result.status === 'invalid') {
      feedback.textContent = binaryAnswer
        ? `Enter exactly ${record.input.trim().split(/\r?\n/)[0]} digits (0 or 1), one per trip. Keep leading zeroes and do not include spaces.`
        : moneyAnswer
        ? 'Enter dollars with at most two decimal places, such as 693.60. Do not include a dollar sign, commas, or an expression.'
        : 'Please enter a whole number, such as 0 or -1. Blank answers, decimals, and expressions are not accepted.';
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.removeAttribute('aria-invalid');
    record.attempts++;
    if (result.status === 'correct') {
      record.solved = true;
      record.answer = result.answer;
    } else feedback.textContent = binaryAnswer
      ? 'Not quite — one or more trip results are incorrect. Keep the original trip order and try again.'
      : `Not quite — your answer is too ${result.direction}. Try again.`;
    save();
    draw();
  });
  window.addEventListener('storage', event => {
    if (event.key !== Progress.prefix + day && event.key !== null) return;
    const updated = Progress.read(storage, day);
    if (updated && updated.input === record.input) {
      record = updated;
      draw();
    }
  });
  draw();
  save();
})();
