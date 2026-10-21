# Mini Advent of Code

A community collection of Christmas-themed programming puzzles, inspired by Advent of Code.

Live site: https://m3e66.github.io/mini-advent-of-code/

## Local preview

With Node.js installed, run `npm start` from this directory, then open http://127.0.0.1:4173. No dependency installation or build step is needed. Stop the server with Ctrl+C.

The site is static and works on GitHub Pages. `index.html`, `style.css`, and `app.js` provide the shared interface; puzzle content lives in `days/`. Hash links such as `#day/2050` can be bookmarked and support browser back/forward navigation.

## Features

- Eleven playable puzzles: Day 24 (Ava), Day 25 (selina), Day 99 (tyson), Day 74 (ada), Day 2000 (Yuhao), Day 68 (jareth), Day 67, Day 2, Day 777 (Justin & Muntasir), Day 2050, and Day -1. The former incomplete Day 25 has been replaced by Delivery Dilemma at the owner's request.
- Every puzzle has generated input, answer validation, a hint, clipboard copying, and a text download. Day 68 accepts dollar amounts with up to two decimal places; Day 99 accepts one binary digit per trip, preserving leading zeroes; the other puzzles require whole numbers. Numeric answers receive high/low feedback, while incorrect trip-result strings receive a whole-answer retry message.
- Each solved puzzle earns one star. Inputs, attempts, and completion are stored locally in the browser and restored after navigation or reload. Stars update across tabs on the same origin. There is no account or cloud synchronization; blocked browser storage produces an explicit notice.
- Archive and search use the same puzzle catalog. Search supports title, author, day, empty results, and reset. Hash routes support direct links and browser back/forward navigation; unknown routes show a recovery page.
- The submission links open the project's existing Google Form. They do not post a submission automatically.

Day 2050 uses the Recaman sequence's first 745 terms to determine eligible starts, then follows the forward-jump rules documented on its page. Hour zero starts with a jump of one, landing at 744 counts, and ties choose the smallest eligible hour. The example uses a closing hour of 10 for clarity; generated puzzles use 744.

## Development and tests

Run `npm test` for solver examples, exhaustive starting-hour and range checks against an independent oracle, generator boundaries, numeric validation, persistence, corrupt/blocked storage, and catalog/file consistency. Browser checks additionally cover puzzle submissions, reloads, search, hints, input copying/downloads, and navigation.

`puzzles.js` owns the catalog, input generators, and pure solvers. `progress.js` validates and stores records. `puzzle-runner.js` provides the shared input and answer controls. To add a puzzle, register its metadata and generator/solver in `puzzles.js`, then add a page in `days/` using the existing pages as a template. Displayed catalog counts update automatically.

Each advent must explicitly register its rules; there is no default solver. The shared submission checker evaluates the selected advent and its saved input together. Add independently calculated cases to `submissionCases` in the test suite; the catalog-coverage test rejects untested additions. Follow `CONTRIBUTING.md` when reviewing and testing new puzzles.

The legacy `node site.js` command also works, serving the same static files on port 3000 without Express or cookie dependencies.

## Day 777 code review

The supplied scoring algorithm correctly counts each cell once, with independent bonuses for every uniform row and column. The examples score 86 and 115; an all-9 grid scores 405. The input generator had an out-of-bounds bug in its second-pattern branch: `pat <= 3` treated selector 3 as a fourth row. Both the website port and the corrected Java source use `pat < 3`. A second pattern can overwrite the first; scoring always uses the final grid.

Corrected, readable Java versions are in `examples/day777/`. The solver accepts an input-file path (default `src/data`) and reports missing or malformed input explicitly. Compile and run the Java cross-check with `node tests/day777-java.cjs` when a JDK is available. The normal `npm test` command needs only Node.js.

## Day 2 rule validation

Lights consume 6 W, machines consume 234 W, and panels provide 500 W of capacity. Each row contains 30 components and needs its own minimum whole number of panels; spare capacity cannot be shared. The supplied examples had 29 digits each, and the second row's stated wattage included an extra light. With the owner's permission to resolve the discrepancy, both example rows now end with one additional `1`: 4056 W and 3372 W, needing 9 and 7 panels (16 total). Unused capacity is allowed, matching the intended round-up rule.

No solution code was supplied for Day 2. The website solver is checked against an independent capacity simulation for every possible machine count and 1000 generated inputs, including the separate-row rounding case.

## Day 67 code review and clarified rules

The supplied Java generator selects each of `{`, `}`, `[`, and `~` with equal probability. Its inclusive `i <= 5000` loop emits 5,001 symbols, which the website preserves. `examples/day67/RNG.java` is a compilable version with pasted Markdown formatting removed. No solver was supplied.

The owner delegated ambiguous rule choices. To preserve both examples, `[` doubles money changes within the next two **symbol positions**, while `~` ignores everything through the next two **money changes**. Ignored modifiers have no effect; doubling never changes a modifier's duration or strength. Windows continue to expire by source position during skips. Incomplete windows at the end are discarded. Starting from 67, `[[{}` ends at 69 and `{{[}}~[{}` ends at 65.

Players submit the final balance. Correct feedback also reports whether it exceeds 5,000; equality does not qualify. An independent two-pass oracle checks all 87,380 statements of lengths 1–8 and 1,000 generated full-length statements. Boundary cases cover ignored modifiers, unfinished windows, negative balances, and balances exactly at and above the upgrade threshold.

## Day 68 code review and money answers

Christmas Tree Delivery is credited to jareth. The priced example really has 8 rows, 24 ornaments, and 11 rolls of tinsel: $578 cost and $115.60 markup, totaling $693.60. The supplied `$580 × 20%` expression was a typo and is corrected to `$578 × 20%`.

The Java generator produces 50–200 trees. Despite its name, `treeHeight` is a width limit of 10–20; the odd-width loop actually prints 5–10 rows. This behavior is preserved in the website and in `examples/day68/Tree.java`, with Markdown artifacts removed. Stars occur with probability 1/2 and each decoration with probability 1/4 outside the fixed star tip. Blank lines separate orders.

The solver stores exact integer cents: multiply each tree's dollar cost by 120 to apply 20% markup. The surcharge applies independently to each tree, only above 10 rolls, and is itself marked up. Day 68's parser converts decimal dollars to cents without floating-point multiplication. Saved answers also use cents and render as dollars after reload. Other puzzles retain their integer-answer format. Day 68 permits up to 100,000 input characters to accommodate full batches; other puzzles retain their 10,000-character limit.

Tests cover the supplied example, 10/11-roll boundary, separate-order surcharges, currency precision, saved progress, input shape, generator limits, and independent item-by-item pricing of 200 generated batches.

## Day 2000 code review

Northpole Powerplant is credited to Yuhao. The owner delegated conflicting rule choices; the implementation follows the written rules: live cells start at age zero, all changes use the previous generation, ages cap at 100, the machine square is blocked, and the first harvest yields 600 times the sum of ages in its eight neighbors. Initial cells in the central 3×3 square are removed without harvesting. Empty and repeating occupancy patterns that have not reached the machine yield zero. Occupancy does not depend on ages, so this termination rule does not need an arbitrary simulation limit.

The supplied Java solution had several correctness bugs: `flattered` aliases and mutates the active board, destroying ages and stored history; initial live cells use age 1; age 100 is not enforced; the center can hold cells; the final sum is not multiplied by 600 or printed as a clean final result. The unused `reachedCenter` helper also contains negative indices. The replacement in `examples/day2000/Main.java` uses separate age/dead representation, immutable occupancy snapshots, synchronous updates, the blocked center, and a final energy total. It accepts an input path, defaulting to `src/data`, and reports malformed or missing input instead of silently continuing.

The source's coordinate example reaches (−1,−1) after 12 generations, at age 12, producing 7,200 energy. Its `13 × 60` description contradicts both age-zero initialization and the written 600 multiplier; the page now shows the independently verified result. Labels before colons are ignored. Duplicate coordinates represent one cell.

The corrected generator always inserts commas between coordinates, including the final pair; chooses the 114–123 trial count once; and permits placements reaching the +12 boundary. It preserves the source's 3–7 rectangle dimensions and row-breaking probabilities. Empty initial lists are valid. Day 2000 accepts up to 100,000 characters for complete batches.

`npm test` checks a separate dense simulator against all 1,024 three-by-three layouts near the machine and at a corner, plus 10 generated batches. It covers first harvest, cycles, extinction, initial clearing, ages, cap, edges, and parsing. Run `node tests/day2000-java.cjs` with a JDK on PATH or `JAVA_HOME` set to compile both Java files, compare individual trial results, and verify the CLI total. Generated test files are kept in a fresh temporary directory and removed afterward.

## Day 74 validation

Uncle Bob kindly sponsored this feast is credited to ada. No generator or solution code was supplied. The provided example correctly totals $2,175. The page explicitly treats ages 10–17 as minors and ages 18–99 as adults. Four distinct foods are required per person, with 1–4 servings each; different guests can share foods. Poisoned servings are summed across PIZZA, EGG, SALAD, and HAM. At least 5 servings make a vaccinated guest sick, and at least 3 make an unvaccinated guest sick, according to this puzzle's rules. Each sick guest incurs exactly one bill.

The website generates 100 valid guest records. Tests independently check all 210 selections of four foods, all 256 serving combinations, and both vaccination thresholds (107,520 cases), plus 200 generated rosters. Other checks cover exact thresholds, ages 10/17/18/99, healthy guests, duplicate records as distinct guests, and malformed input. Answers are whole dollars, with the existing saved-star flow.

## Day 99 code review and exact search

Jack & Jill - Water Hill Spurge is credited to tyson. The owner delegated rule and scale choices. All offers within a trip are available in any order; buckets start empty and can be purchased once, then reused as storage. Each well can be tapped once, taking as much water as fits and discarding the rest. Each whole exchange sells stored water for cash up to its limit. No debt is allowed and nothing carries between trips. A trip succeeds if any action order reaches its goal. The `B` and `W` suffixes identify the village, matching the supplied generator; they are not item counts.

The attached C++ source is preserved in `examples/day99/submitted-solver.cpp` for review, not used as the answer checker. It is not an exact planner: greedy purchases can miss solutions. For example, with capacity 10, goal 10, and $5, it chooses a 6-gallon/$5 well before a 10-gallon/$4 well and fails, despite a valid plan. `getFreeWater` resets stored water before calculating leftover water, retaining the original well amount after overflow and making water reusable. In the capacity-building loop, `waterPurchase` is not deducted from the allowance. Mutable recursive purchases do not provide complete backtracking. No C++ compiler was available for executing the submitted program; these findings come from source review and regression cases validated against an independent exhaustive planner.

The replacement solver searches all available actions with memoization. For fixed purchased buckets, used wells, and exchange counts, capacity and cash are fixed; only the greatest stored water must be retained. This dominance rule avoids redundant states without discarding successful plans. It does not use a timeout to guess failure. The generator intentionally reduces the original hundreds of offers to four buckets, four wells, two villages, and at most four exchange uses per trip, while retaining 15–30 trips per input. The parser supports up to six buckets, six wells, four villages, and four total exchange uses per trip. Larger source-generator instances require a separate scaling design and are not supported by this website checker.

The supplied prompt omitted the actual two-trip input. `examples/day99/example.txt` reconstructs the narrated 90-gallon/$98 plan and adds an explicit impossible second trip, yielding `10`. Buying buckets costs $86 and wells cost $7, leaving $5. Leading zeroes are significant: `01` is stored and checked as a string, never converted to a number.

Tests compare the solver against a separate full-state breadth-first search for 500 small trips and ten generated batches. Cases include greedy failures, well-use order, water sales financing buckets, exchange limits, capacity overflow, forbidden well reuse, independent trips, malformed input, and saved binary answers.

## Day 25 code review

Delivery Dilemma is credited to selina. Gifts stay in input order; start a new round before either running total would exceed 10,000. Exact fits are allowed, both totals reset, and the final partial load counts. The example's answer remains 2, but its claimed split after gift 15 was an arithmetic error: gifts 1–16 total 9,724 weight and 8,726 volume; gift 17 exceeds weight capacity. Gifts 17–20 form the second round. The page calls the space measurement volume units because the original used a length unit for volume.

The Java generator correctly emits 10,000 pairs, with each value from 20 through 1019 inclusive. A compilable copy with Markdown artifacts removed is in examples/day25/input.java. No solver was supplied. The website has a dedicated linear solver and a 200,000-character allowance for complete input files, including CRLF. The validator accepts 1–10,000 gifts with positive integer dimensions up to 10,000, rejecting gifts that cannot fit individually.

Tests compare the solver with an independent dynamic program over all feasible contiguous partitions: 1,000 small cases and ten full generated inputs. Boundaries cover both limits, exact fits, input order, final partial rounds, generator extremes, malformed data/answers, and saved completion. Legacy invalid Day 25 input is discarded on load.

## Day 24 validation

A Nightmare Before Christmas is credited to Ava. Start at the entrance (0,0,0) and use fixed axes, moving one unit at a time. Every intermediate house counts, but the entrance never does, including on revisits. The answer is the greatest house visit count multiplied by the number of houses tied at that count. The supplied examples yield 4 and 2; missing words/numbers in the pasted explanations have been restored on the page.

No generator or solver code was supplied. The website generates 500 instructions, choosing among six directions and distances 1–8. Its validator supports 1–2,000 instructions, distances 1–1,000, and at most 200,000 total unit steps. The solver stores three-dimensional house visit counts. An independent geometric segment-membership oracle verifies all 1,296 four-instruction direction combinations with alternating distances and ten full generated paths. Tests also cover all axes, negative coordinates, ties, intermediate houses, entrance revisits, input limits, malformed answers, and saved progress.
