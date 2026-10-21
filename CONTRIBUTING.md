# Contributing

## Puzzle correctness

For each new puzzle, check that its code is correct before integrating it. Do not assume an author's solution is correct merely because it runs.

- Read the complete rules, example inputs, and expected answers. Preserve the intended puzzle and ask about ambiguous or conflicting rules rather than silently changing them to match the code.
- Register an explicit input validator, generator, and solver for that advent. Never fall back to another advent's algorithm.
- Check examples against independently computed expected answers. For generated inputs, compare the supplied solver with a separate reference implementation or a small exhaustive/brute-force check. Cover relevant boundaries, zero/negative results, indexing, ties, and malformed answers.
- Add a submission fixture for the new advent in `tests/puzzles.test.cjs`. The catalog-coverage test must fail if a puzzle lacks a fixture. Correct answers must be accepted for that advent's displayed input; wrong and invalid answers must not award completion.
- Verify the browser's actual submission flow, success feedback, star update, and reload persistence. Use an isolated local port for browser tests so normal preview progress is not pre-completed by tests.
- Run `npm test`. Do not describe an advent as ready while known correctness failures remain. Explain unresolved issues and the evidence needed to resolve them.
