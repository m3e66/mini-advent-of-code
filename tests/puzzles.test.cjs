const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Puzzles = require('../puzzles.js');
const Progress = require('../progress.js');

// Hand-calculated answers, kept independent of the production solver.
// Add at least one case here whenever a new advent enters the catalog.
const submissionCases = [
  { day: '24', input: fs.readFileSync(path.join(__dirname,'../examples/day24/example1.txt'),'utf8'), answer: 4 },
  { day: '24', input: fs.readFileSync(path.join(__dirname,'../examples/day24/example2.txt'),'utf8'), answer: 2 },
  { day: '25', input: fs.readFileSync(path.join(__dirname,'../examples/day25/example.txt'),'utf8'), answer: 2 },
  { day: '99', input: fs.readFileSync(path.join(__dirname,'../examples/day99/example.txt'),'utf8'), answer: '10' },
  { day: '74', input: '016TURKEY2BREAD3SALAD2HAM3,120SAUSAGE4PIZZA2EGG4DRUMSTICK3', answer: 2175 },
  { day: '2000', input: '{130:(-5,-6),(-4,-5),(-5,-4),(-6,-4),(-4,-4)}', answer: 7200 },
  { day: '68', input: '*\n*o*\n**o*@\n*ooo***\n**@*oo*o@\n@@*o**ooo@*\n*@*o*@ooo*o**\n**o@oo@o***o@oo', answer: 69360 },
  { day: '67', input: '{{[}}~[{}', answer: 65 },
  { day: '2', input: '111222222112222112212121212121\n212212211211212121222121111211', answer: 16 },
  { day: '777', input: '12345\n68795\n16275', answer: 86 },
  { day: '2050', input: '0-0', answer: 0 },
  { day: '-1', input: '123456\n0123456\n654321\n123', answer: 1 },
];

// Independent breadth-first search keeps every distinct full state. It uses
// remaining item lists, without production bitmasks, capacity clipping or dominance.
function waterReference(trip) {
  const queue=[{cash:trip.budget,water:0,capacity:trip.capacity,buckets:trip.buckets.map((_,i)=>i),wells:trip.wells.map((_,i)=>i),limits:trip.exchanges.map(e=>e.limit)}];
  const seen=new Set();
  for(let head=0;head<queue.length;head++) {
    const state=queue[head];
    if(state.water>=trip.goal && state.capacity>=trip.goal) return true;
    const key=JSON.stringify(state);
    if(seen.has(key))continue;
    seen.add(key);
    for(const id of state.buckets) {
      const item=trip.buckets[id];
      if(state.cash>=item.cost) queue.push({...state,cash:state.cash-item.cost,capacity:state.capacity+item.capacity,buckets:state.buckets.filter(i=>i!==id)});
    }
    for(const id of state.wells) {
      const item=trip.wells[id];
      if(state.cash>=item.cost) queue.push({...state,cash:state.cash-item.cost,water:state.water+Math.min(item.water,state.capacity-state.water),wells:state.wells.filter(i=>i!==id)});
    }
    trip.exchanges.forEach((item,id)=>{
      if(state.limits[id]>0&&state.water>=item.water) {
        const limits=[...state.limits];limits[id]--;
        queue.push({...state,cash:state.cash+item.cash,water:state.water-item.water,limits});
      }
    });
  }
  return false;
}
function encodeWaterTrips(trips) {
  const lines=[String(trips.length)];
  trips.forEach((trip,index)=>{
    const villages=Math.max(1,trip.exchanges.length);
    lines.push(`T${index+1}`,`${trip.goal} ${trip.budget} ${villages}`,String(trip.capacity));
    for(let v=0;v<villages;v++) {
      const exchange=trip.exchanges[v];
      lines.push(`V${v+1}`,exchange?`${exchange.cash} ${exchange.water} ${exchange.limit}`:'0',`B${v+1}`);
      if(v===0)trip.buckets.forEach(b=>lines.push(`${b.capacity} ${b.cost}`));
      lines.push(`W${v+1}`);
      if(v===0)trip.wells.forEach(w=>lines.push(`${w.water} ${w.cost}`));
    }
  });
  return lines.join('\n');
}

test('Day 99 exact plans handle greedy counterexamples, order, exchanges and one-use wells', () => {
  const basic={goal:10,budget:5,capacity:10,buckets:[],wells:[],exchanges:[]};
  const cases=[
    [{...basic,wells:[{water:6,cost:5},{water:10,cost:4}]},true],
    [{...basic,capacity:5,buckets:[{capacity:5,cost:5}],wells:[{water:10,cost:0}]},true],
    [{...basic,budget:0,capacity:5,buckets:[{capacity:5,cost:5}],wells:[{water:10,cost:0}],exchanges:[{cash:5,water:5,limit:1}]},false],
    [{...basic,budget:0,capacity:4,buckets:[{capacity:6,cost:5}],wells:[{water:4,cost:0},{water:10,cost:0}],exchanges:[{cash:5,water:4,limit:1}]},true],
    [{...basic,budget:0,capacity:5,buckets:[{capacity:5,cost:2}],wells:[{water:5,cost:0},{water:7,cost:0}],exchanges:[{cash:1,water:1,limit:2}]},true],
    [{...basic,budget:0,capacity:5,buckets:[{capacity:5,cost:2}],wells:[{water:5,cost:0},{water:7,cost:0}],exchanges:[{cash:1,water:1,limit:1}]},false],
    [{...basic,budget:0,wells:[{water:15,cost:0}]},true],
    [{...basic,budget:0,wells:[{water:10,cost:1}],exchanges:[{cash:10,water:1,limit:1}]},false],
    [{...basic,wells:[{water:5,cost:1},{water:5,cost:1}]},true],
    [{...basic,wells:[]},false]
  ];
  for(const [trip,answer] of cases) {
    assert.equal(waterReference(trip),answer);
    assert.equal(Puzzles.waterTrips.canComplete(trip),answer);
    assert.equal(Puzzles.solve('99',encodeWaterTrips([trip])),answer?'1':'0');
  }
  const example=submissionCases.find(item=>item.day==='99');
  assert.equal(Puzzles.solve('99',example.input),'10');
  assert.equal(Puzzles.solve('99',example.input.replaceAll('\n','\r\n')),'10');
});

test('Day 99 preserves leading zeroes, exact result length, independent trips and saved strings', () => {
  const fail={goal:10,budget:0,capacity:10,buckets:[],wells:[{water:9,cost:0}],exchanges:[]};
  const pass={...fail,wells:[{water:10,cost:0}]};
  const input=encodeWaterTrips([fail,pass]);
  assert.equal(Puzzles.solve('99',input),'01');
  assert.deepEqual(Puzzles.checkAnswer('99',input,' 01\n'),{status:'correct',answer:'01'});
  assert.deepEqual(Puzzles.checkAnswer('99',input,'10'),{status:'incorrect'});
  for(const raw of ['1','001','0 1','0b01','01.0','+01','']) assert.equal(Puzzles.checkAnswer('99',input,raw).status,'invalid');
  const longInput=encodeWaterTrips(Array(30).fill(fail));
  assert.equal(Puzzles.solve('99',longInput),'0'.repeat(30));
  assert.equal(Puzzles.checkAnswer('99',longInput,'0'.repeat(30)).status,'correct');
  assert.equal(Puzzles.solve('99',encodeWaterTrips([{...pass,budget:10},{...pass,wells:[{water:10,cost:1}]}])),'10');
  const values=new Map();const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  Progress.write(storage,'99',{version:1,input,answer:'01',solved:true,attempts:1});
  assert.equal(Progress.read(storage,'99').solved,true);
  assert.equal(Puzzles.formatAnswer('99',Progress.read(storage,'99').answer),'01');
  Progress.write(storage,'99',{version:1,input,answer:1,solved:true,attempts:1});
  assert.equal(Progress.read(storage,'99').solved,false);
});

test('Day 99 parser rejects mismatched sections, counts, oversize trips and invalid amounts', () => {
  const valid='1\nT1\n10 5 1\n10\nV1\n0\nB1\nW1\n10 4';
  for(const input of ['',valid.replace('T1','T2'),valid.replace('B1','B2'),valid.replace('W1','W2'),valid.replace('10 5 1','10 -5 1'),valid.replace('10 4','0 4'),valid.replace('10 5 1','10 5 2'),valid+'\n9',valid.replace('B1','B1\n1 1\n1 1\n1 1\n1 1\n1 1\n1 1\n1 1')]) {
    assert.equal(Puzzles.validInput('99',input),false);
    assert.throws(()=>Puzzles.solve('99',input));
  }
});

test('Day 99 exact search matches exhaustive action search on small and generated trips', () => {
  let seed=99;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const integer=(min,max)=>min+Math.floor(random()*(max-min+1));
  for(let trial=0;trial<500;trial++) {
    const trip={goal:integer(1,15),budget:integer(0,8),capacity:integer(1,8),
      buckets:Array.from({length:2},()=>({capacity:integer(1,8),cost:integer(0,6)})),
      wells:Array.from({length:3},()=>({water:integer(1,10),cost:integer(0,6)})),
      exchanges:[{cash:integer(1,6),water:integer(1,5),limit:integer(1,2)}]};
    assert.equal(Puzzles.waterTrips.canComplete(trip),waterReference(trip),JSON.stringify(trip));
  }
  for(let batch=0;batch<10;batch++) {
    const input=Puzzles.generate('99',random);
    const trips=Puzzles.waterTrips.parse(input);
    assert.ok(trips.length>=15&&trips.length<=30);
    assert.equal(Puzzles.solve('99',input),trips.map(trip=>waterReference(trip)?'1':'0').join(''));
  }
});

test('Day 74 supplied example, illness thresholds, age boundaries and one bill per guest', () => {
  const example = submissionCases.find(item => item.day === '74');
  assert.equal(Puzzles.solve('74', example.input), 2175);
  for (const age of [10,17,18,99]) {
    const bill = age < 18 ? 528 : 1647;
    assert.equal(Puzzles.solve('74', `0${age}TURKEY4BREAD4BEEF4HAM2`), 0);
    assert.equal(Puzzles.solve('74', `0${age}TURKEY4BREAD4BEEF4HAM3`), bill);
    assert.equal(Puzzles.solve('74', `1${age}TURKEY4BREAD4BEEF4HAM4`), 0);
    assert.equal(Puzzles.solve('74', `1${age}TURKEY4BREAD4PIZZA2EGG3`), bill);
    assert.equal(Puzzles.solve('74', `0${age}SALAD4HAM4PIZZA4EGG4`), bill);
    assert.equal(Puzzles.solve('74', `0${age}TURKEY4BREAD4BEEF4LASAGNA4`), 0);
  }
  assert.equal(Puzzles.solve('74', example.input + ',' + example.input), 4350);
  assert.equal(Puzzles.solve('74', ' \n' + example.input.replace(',', ',\r\n ') + '\r\n'), 2175);
  for (const input of ['', '216TURKEY2BREAD3SALAD2HAM3', '009TURKEY2BREAD3SALAD2HAM3', '0100TURKEY2BREAD3SALAD2HAM3', '016TURKEY0BREAD3SALAD2HAM3', '016TURKEY5BREAD3SALAD2HAM3', '016TURKEY2TURKEY3SALAD2HAM3', '016TOFU2BREAD3SALAD2HAM3', '016TURKEY2BREAD3SALAD2', '016TURKEY2BREAD3SALAD2HAM3EGG1', example.input + ',']) {
    assert.equal(Puzzles.validInput('74', input), false, input);
    assert.throws(() => Puzzles.solve('74', input));
  }
});

test('Day 74 all four-food choices and serving quantities match independent expected bills', () => {
  const foods = ['TURKEY','BREAD','SALAD','HAM','SAUSAGE','PIZZA','EGG','DRUMSTICK','BEEF','LASAGNA'];
  const poisonedMask = 108; // Indices 2, 3, 5, 6; calculated independently of production metadata.
  for (let a=0;a<7;a++) for(let b=a+1;b<8;b++) for(let c=b+1;c<9;c++) for(let d=c+1;d<10;d++) {
    const choices = [a,b,c,d];
    for(let encoded=0;encoded<256;encoded++) {
      let poisoned = 0;
      let meals = '';
      choices.forEach((food,index) => {
        const quantity = ((encoded >> (index*2)) & 3) + 1;
        meals += foods[food] + quantity;
        if (poisonedMask & (1<<food)) poisoned += quantity;
      });
      assert.equal(Puzzles.solve('74', '017'+meals), poisoned >= 3 ? 528 : 0);
      assert.equal(Puzzles.solve('74', '118'+meals), poisoned >= 5 ? 1647 : 0);
    }
  }
});

test('Day 74 generated rosters contain unique meals and match independent billing', () => {
  let seed = 74;
  const random = () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for (let roster=0;roster<200;roster++) {
    const input = Puzzles.generate('74',random);
    const guests = input.split(',');
    assert.equal(guests.length,100);
    let expected = 0;
    for(const guest of guests) {
      const names = guest.slice(3).match(/[A-Z]+/g);
      assert.equal(new Set(names).size,4);
      const portions = guest.match(/(?:PIZZA|EGG|SALAD|HAM)[1-4]/g) || [];
      const total = portions.reduce((sum,food)=>sum+Number(food.at(-1)),0);
      if (total >= (guest[0] === '1' ? 5 : 3)) expected += Number(guest.slice(1,3)) < 18 ? 528 : 1647;
    }
    assert.equal(Puzzles.validInput('74',input),true);
    assert.equal(Puzzles.solve('74',input),expected);
  }
});

// Dense reference uses actual ages and -1 for dead, unlike the production
// neighbor-accumulation solver's age-plus-one encoding.
function plantReferenceStep(board) {
  return board.map((row, y) => row.map((age, x) => {
    if (x === 12 && y === 12) return -1;
    const neighbors = [];
    for (let ny = Math.max(0, y - 1); ny <= Math.min(24, y + 1); ny++) {
      for (let nx = Math.max(0, x - 1); nx <= Math.min(24, x + 1); nx++) {
        if ((ny !== y || nx !== x) && !(ny === 12 && nx === 12) && board[ny][nx] >= 0) neighbors.push(board[ny][nx]);
      }
    }
    if (age >= 0) return neighbors.length === 2 || neighbors.length === 3 ? Math.min(100, age + 1) : -1;
    return neighbors.length === 3 ? Math.min(100, Math.max(...neighbors) + 1) : -1;
  }));
}
function plantReference(coordinates) {
  let board = Array.from({length:25}, () => Array(25).fill(-1));
  for (const [x, y] of coordinates) if (Math.abs(x) > 1 || Math.abs(y) > 1) board[y + 12][x + 12] = 0;
  const key = () => board.flat().map(age => age < 0 ? '.' : '#').join('');
  let pattern = key();
  if (!pattern.includes('#')) return {energy:0,steps:0,reason:'extinct'};
  const seen = new Set([pattern]);
  for (let steps = 1; ; steps++) {
    board = plantReferenceStep(board);
    const nearby = board.slice(11, 14).flatMap((row, index) => row.slice(11, 14).filter((age, x) => !(index === 1 && x === 1) && age >= 0));
    if (nearby.length) return {energy:nearby.reduce((a,b)=>a+b,0)*600,steps,reason:'harvest'};
    pattern = key();
    if (!pattern.includes('#')) return {energy:0,steps,reason:'extinct'};
    if (seen.has(pattern)) return {energy:0,steps,reason:'cycle'};
    seen.add(pattern);
  }
}

test('Day 2000 written-rule example, first harvest, initial clearing and zero-output cycles', () => {
  const example = submissionCases.find(item => item.day === '2000');
  const trials = Puzzles.powerplant.parse(example.input);
  assert.deepEqual(plantReference(trials[0]), {energy:7200,steps:12,reason:'harvest'});
  assert.equal(Puzzles.solve('2000', example.input), 7200);
  assert.equal(Puzzles.solve('2000', '{1:(2,-1),(2,0),(2,1)}'), 600);
  assert.equal(Puzzles.solve('2000', example.input + '\r\n{999:(2,-1),(2,0),(2,1)}\r\n'), 7800);
  assert.equal(Puzzles.solve('2000', '{999:(2,-1),(2,0),(2,1),(2,1)}'), 600);
  for (const input of ['{1:}', '{2:(0,0),(1,0),(0,1)}', '{3:(-12,-12)}', '{4:(-10,-10),(-9,-10),(-10,-9),(-9,-9)}', '{5:(-8,-9),(-7,-9),(-6,-9)}']) {
    assert.equal(Puzzles.solve('2000', input), 0);
    assert.deepEqual(Puzzles.powerplant.runTrial(Puzzles.powerplant.parse(input)[0]), plantReference(Puzzles.powerplant.parse(input)[0]));
  }
  for (const input of ['', '{1:(13,0)}', '{1:(0,-13)}', '{1:(1,2)(2,3)}', '{1:(1,2),}', '(1,2)', '{x:(1,2)}']) {
    assert.equal(Puzzles.validInput('2000', input), false);
    assert.throws(() => Puzzles.solve('2000', input));
  }
});

test('Day 2000 simultaneous ages, oldest-parent births, cap, walls and blocked machine', () => {
  const boards = [];
  for (const age of [0, 5, 99, 100]) {
    const board = Array.from({length:25}, () => Array(25).fill(-1));
    board[0][0] = age; board[0][1] = age; board[1][0] = age;
    board[10][10] = 1; board[10][11] = age; board[11][10] = 0;
    board[11][12] = age; board[12][11] = age; board[13][12] = age;
    board[24][24] = age;
    boards.push(board);
  }
  for (const board of boards) {
    const encoded = Uint8Array.from(board.flat().map(age => age + 1));
    const original = encoded.slice();
    const next = Puzzles.powerplant.step(encoded);
    assert.deepEqual([...next], plantReferenceStep(board).flat().map(age => age + 1));
    assert.deepEqual(encoded, original, 'simulation must not mutate the current generation');
    assert.equal(next[312], 0, 'machine remains blocked');
    assert.ok(next.every(age => age <= 101));
  }
});

test('Day 2000 matches dense reference for all 3×3 patterns near machine and corner', () => {
  for (const [startX, startY] of [[2,-1], [-12,-12]]) {
    for (let mask = 0; mask < 512; mask++) {
      const coordinates = [];
      for (let bit = 0; bit < 9; bit++) if (mask & (1 << bit)) coordinates.push([startX + bit % 3, startY + Math.floor(bit / 3)]);
      assert.deepEqual(Puzzles.powerplant.runTrial(coordinates), plantReference(coordinates));
    }
  }
});

test('Day 2000 generated batches match dense reference and retain all coordinate separators', () => {
  let seed = 2000;
  const random = () => ((seed = (Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for (let batch = 0; batch < 10; batch++) {
    const input = Puzzles.generate('2000', random);
    const trials = Puzzles.powerplant.parse(input);
    assert.ok(trials.length >= 114 && trials.length <= 123);
    assert.equal(Puzzles.solve('2000', input), trials.reduce((sum, coords) => sum + plantReference(coords).energy, 0));
  }
  const filled = Puzzles.generate('2000', () => 0);
  assert.equal(Puzzles.powerplant.parse(filled)[0].length, 9);
  assert.ok(filled.includes('(-11,-10),(-10,-10)'));
  // Highest placement still fits and can include the +12 boundary.
  const draws = [.999, .999, .999, .999, .999, 0];
  let draw = 0;
  const edge = Puzzles.generate('2000', () => draws[draw++] ?? 0);
  assert.ok(Puzzles.powerplant.parse(edge)[0].some(([x,y]) => x === 12 && y === 12));
});

function treeReference(input) {
  let total = 0;
  let tinsel = 0;
  for (const line of (input + '\n\n').split(/\r?\n/)) {
    if (!line.trim()) {
      if (tinsel > 10) total += 9000;
      tinsel = 0;
      continue;
    }
    total += 6000; // Each row's $50 cost with markup, in cents.
    for (const symbol of line) {
      if (symbol === 'o') total += 240;
      if (symbol === '@') { total += 600; tinsel++; }
    }
  }
  return total;
}

function decoratedTree(height, ornaments, tinsel) {
  const symbols = 'o'.repeat(ornaments) + '@'.repeat(tinsel) + '*'.repeat(height * height - 1 - ornaments - tinsel);
  let offset = 0;
  return Array.from({length:height}, (_, row) => {
    const line = row === 0 ? '*' : symbols.slice(offset, offset + row * 2 + 1);
    if (row > 0) offset += row * 2 + 1;
    return ' '.repeat(height - row - 1) + line;
  }).join('\n');
}

test('Day 68 example, surcharge boundary, independent orders and whitespace', () => {
  const example = submissionCases.find(item => item.day === '68').input;
  assert.equal(Puzzles.solve('68', example), 69360);
  assert.equal(Puzzles.solve('68', '*'), 6000);
  assert.equal(Puzzles.solve('68', decoratedTree(4, 0, 10)), 30000);
  assert.equal(Puzzles.solve('68', decoratedTree(4, 0, 11)), 39600);
  assert.equal(Puzzles.solve('68', decoratedTree(4, 0, 6) + '\n\n' + decoratedTree(4, 0, 6)), 55200);
  assert.equal(Puzzles.solve('68', example + '\n\n' + example), 138720);
  assert.equal(Puzzles.solve('68', '\n  *\r\n\t \r\n\r\n' + example.replaceAll('\n', '\r\n') + '\r\n\r\n'), 75360);
  for (let height = 1; height <= 10; height++) {
    for (let tinsel = 0; tinsel < height * height; tinsel++) {
      const input = decoratedTree(height, height * height - 1 - tinsel, tinsel);
      assert.equal(Puzzles.solve('68', input), treeReference(input));
    }
  }
  for (const input of ['', '   ', '*\n**', 'o', '*\n*x*', '*\n***\n****', '*\n* *']) {
    assert.equal(Puzzles.validInput('68', input), false);
  }
});

test('Day 68 dollars parse exactly, preserve cents on reload, and do not change integer puzzles', () => {
  const example = submissionCases.find(item => item.day === '68').input;
  for (const raw of ['693.60', '693.6', ' 693.60\n', '00693.60']) {
    assert.deepEqual(Puzzles.checkAnswer('68', example, raw), {status:'correct',answer:69360});
  }
  for (const raw of ['693.59', '693.61', '69360', '693']) assert.equal(Puzzles.checkAnswer('68', example, raw).status, 'incorrect');
  for (const raw of ['', '$693.60', '1,000.00', '693.600', '6e2', '-1', '1+2', 'Infinity', '90071992547409.92']) {
    assert.equal(Puzzles.checkAnswer('68', example, raw).status, 'invalid');
  }
  assert.equal(Puzzles.checkAnswer('24', 'RIGHT 6', '6.00').status, 'invalid');
  assert.equal(Puzzles.parseMoney('0.01'), 1);
  assert.equal(Puzzles.parseMoney('90071992547409.91'), Number.MAX_SAFE_INTEGER);
  assert.equal(Puzzles.formatAnswer('68', 6000), '60.00');
  const values = new Map();
  const storage = {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,value)};
  Progress.write(storage, '68', {version:1,input:example,answer:69360,solved:true,attempts:2});
  assert.equal(Progress.read(storage, '68').solved, true);
  assert.equal(Puzzles.formatAnswer('68', Progress.read(storage, '68').answer), '693.60');
  Progress.write(storage, '68', {version:1,input:example,answer:693.6,solved:true,attempts:2});
  assert.equal(Progress.read(storage, '68').solved, false);
});

test('Day 68 full-size generators preserve Java dimensions and agree with independent pricing', () => {
  let seed = 68;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (const rng of [() => 0, () => .99999999, ...Array(200).fill(random)]) {
    const input = Puzzles.generate('68', rng);
    const trees = input.split('\n\n');
    assert.ok(trees.length >= 50 && trees.length <= 200);
    for (const tree of trees) {
      const rows = tree.split('\n');
      assert.ok(rows.length >= 5 && rows.length <= 10);
      rows.forEach((row, index) => assert.equal(row.trim().length, index * 2 + 1));
    }
    assert.equal(Puzzles.validInput('68', input), true);
    assert.equal(Puzzles.solve('68', input), treeReference(input));
  }
  const largest = Puzzles.generate('68', () => .99999999);
  assert.ok(largest.length > 10000);
  assert.equal(largest.split('\n\n').length, 200);
  assert.equal(Puzzles.solve('68', largest), 12000000);
});

// Independent two-pass oracle: mask ignored symbols, then inspect the previous
// two source positions for live doubling markers at every remaining change.
function bankReference(input) {
  const symbols = [...input.trim()];
  const ignored = new Set();
  for (let index = 0; index < symbols.length; index++) {
    if (ignored.has(index) || symbols[index] !== '~') continue;
    let changes = 0;
    for (let next = index + 1; next < symbols.length && changes < 2; next++) {
      ignored.add(next);
      if ('{}'.includes(symbols[next])) changes++;
    }
  }
  let balance = 67;
  for (let index = 0; index < symbols.length; index++) {
    if (ignored.has(index) || !'{}'.includes(symbols[index])) continue;
    let change = symbols[index] === '{' ? 1 : -1;
    for (let before = Math.max(0, index - 2); before < index; before++) {
      if (!ignored.has(before) && symbols[before] === '[') change *= 2;
    }
    balance += change;
  }
  return balance;
}

test('Day 67 examples, skipped modifiers, expiring windows, negative balances and upgrade boundary', () => {
  const cases = [
    ['[[{}', 69], ['{{[}}~[{}', 65], ['[{}', 67], ['[[[{', 71],
    ['~[{}}', 66], ['~~{{{', 68], ['[~{{{', 68], ['~{', 67],
    ['[', 67], ['~', 67], ['}', 66], ['}'.repeat(67), 0],
    ['}'.repeat(5001), -4934], ['{'.repeat(4933), 5000],
    ['{'.repeat(4934), 5001], ['{'.repeat(5001), 5068],
    ['[[{}\r\n', 69]
  ];
  for (const [input, answer] of cases) {
    assert.equal(Puzzles.solve('67', input), answer, input.slice(0, 30));
    assert.equal(Puzzles.checkAnswer('67', input, String(answer)).status, 'correct');
  }
  for (const input of ['', '[]', 'abc', '{} {}', '{}\n{}', '\\~', '{}\n\n']) {
    assert.equal(Puzzles.validInput('67', input), false);
    assert.throws(() => Puzzles.solve('67', input), /Invalid puzzle input/);
  }
});

test('Day 67 agrees with two-pass oracle for every statement of length 1 through 8', () => {
  for (let length = 1; length <= 8; length++) {
    for (let encoded = 0; encoded < 4 ** length; encoded++) {
      let value = encoded;
      let input = '';
      for (let i = 0; i < length; i++) {
        input += '{}[~'[value % 4];
        value = Math.floor(value / 4);
      }
      assert.equal(Puzzles.solve('67', input), bankReference(input), input);
    }
  }
});

test('Day 67 generator preserves 5,001 symbols and matches the oracle on generated statements', () => {
  for (let symbol = 0; symbol < 4; symbol++) {
    assert.equal(Puzzles.generate('67', () => (symbol + 0.5) / 4), '{}[~'[symbol].repeat(5001));
  }
  let seed = 67;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < 1000; i++) {
    const input = Puzzles.generate('67', random);
    assert.equal(input.length, 5001);
    assert.equal(Puzzles.validInput('67', input), true);
    assert.equal(Puzzles.solve('67', input), bankReference(input));
  }
});

function panelReference(input) {
  return input.trim().split(/\r?\n/).reduce((sum, row) => {
    const machines = row.split('2').length - 1;
    const demand = 180 + machines * 228;
    let panels = 0;
    while (panels * 500 < demand) panels++;
    return sum + panels;
  }, 0);
}

test('Day 2 matches all machine counts, independently rounds rows, and accepts line endings', () => {
  for (let machines = 0; machines <= 30; machines++) {
    const row = '2'.repeat(machines) + '1'.repeat(30 - machines);
    assert.equal(Puzzles.solve('2', row), panelReference(row));
  }
  const lights = '1'.repeat(30);
  assert.equal(Puzzles.solve('2', lights), 1);
  assert.equal(Puzzles.solve('2', '2'.repeat(30)), 15);
  assert.equal(Puzzles.solve('2', lights + '\n' + lights), 2);
  const example = submissionCases.find(item => item.day === '2');
  assert.equal(Puzzles.solve('2', example.input.replaceAll('\n', '\r\n') + '\r\n'), 16);
  const html = fs.readFileSync(path.join(__dirname, '../days/day2.html'), 'utf8');
  assert.ok(html.includes(example.input));
});

test('Day 2 rejects malformed rows and random inputs match independent capacity simulation', () => {
  for (const input of ['', '1'.repeat(29), '1'.repeat(31), '0'.repeat(30), '3'.repeat(30), '1'.repeat(29) + ' ', '1'.repeat(30) + '\n\n' + '2'.repeat(30)]) {
    assert.equal(Puzzles.validInput('2', input), false);
    assert.throws(() => Puzzles.solve('2', input), /Invalid puzzle input/);
  }
  let seed = 2;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < 1000; i++) {
    const input = Puzzles.generate('2', random);
    assert.equal(Puzzles.validInput('2', input), true);
    assert.equal(Puzzles.solve('2', input), panelReference(input));
  }
});

test('Every advent has an independently calculated submission fixture', () => {
  assert.deepEqual([...new Set(submissionCases.map(item => item.day))].sort(), Puzzles.definitions.map(item => item.day).sort());
});

test('Each advent accepts its correct answer and rejects answers from other fixtures', () => {
  for (const fixture of submissionCases) {
    assert.deepEqual(Puzzles.checkAnswer(fixture.day, fixture.input, ` ${Puzzles.formatAnswer(fixture.day, fixture.answer)}\n`), {status:'correct', answer:fixture.answer});
    for (const other of submissionCases.filter(item => item.answer !== fixture.answer)) {
      const candidate=Puzzles.formatAnswer(fixture.day, other.answer);
      if(candidate!==Puzzles.formatAnswer(fixture.day, fixture.answer)) assert.notEqual(Puzzles.checkAnswer(fixture.day, fixture.input, candidate).status, 'correct');
    }
    assert.equal(Puzzles.checkAnswer(fixture.day, fixture.input, '').status, 'invalid');
    assert.equal(Puzzles.checkAnswer(fixture.day, fixture.input, 'abc').status, 'invalid');
  }
});

test('Checking uses the selected input, preserves zero and negative answers, and does not mix progress', () => {
  assert.equal(Puzzles.checkAnswer('24', 'RIGHT 6', '6').status, 'correct');
  assert.equal(Puzzles.checkAnswer('24', 'RIGHT 8', '6').status, 'incorrect');
  assert.equal(Puzzles.checkAnswer('-1', '1\n2', '0').status, 'correct');
  const missing = Array.from({length:745}, (_, i) => i).find(i => !Puzzles.recaman().includes(i));
  assert.equal(Puzzles.checkAnswer('2050', `${missing}-${missing}`, '-1').status, 'correct');
  const values = new Map();
  const storage = {getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value)};
  Progress.write(storage, '24', {version:1,input:'RIGHT 6',answer:6,solved:true,attempts:1});
  Progress.write(storage, '25', Progress.create('20-20'));
  assert.equal(Progress.read(storage, '24').solved, true);
  assert.equal(Progress.read(storage, '25').solved, false);
});

test('A newly listed advent without an explicit solver cannot inherit another puzzle’s behavior', () => {
  Puzzles.definitions.push({day:'Unimplemented',title:'Unimplemented',author:'Test',kind:'puzzle'});
  try {
    assert.throws(() => Puzzles.generate('Unimplemented'), /No solver registered/);
    assert.throws(() => Puzzles.checkAnswer('Unimplemented', '5', '6'), /No solver registered/);
  } finally { Puzzles.definitions.pop(); }
});

test('Grinch example, wraparound, all equal and no equal neighbors', () => {
  assert.equal(Puzzles.solve('-1', '123456\n0123456\n654321\n123'), 1);
  assert.equal(Puzzles.solve('-1', '1\n12\n341\n1234\n1'), 0);
  assert.equal(Puzzles.solve('-1', '7\n7\n7\n7'), 3);
  assert.equal(Puzzles.solve('-1', '9\n09\n009\n9'), 3);
  assert.equal(Puzzles.solve('-1', '12\n34'), 0);
});

test('Recaman sequence matches established first terms, including repeated additions', () => {
  assert.deepEqual(Puzzles.recaman(25), [0,1,3,6,2,7,13,20,12,21,11,22,10,23,9,24,8,25,43,62,42,63,41,18,42,17]);
});

test('Time Travel example, ties, last hour, zero and ineligible hour', () => {
  assert.equal(Puzzles.solveTimeTravel('1-3', 10), 1);
  assert.equal(Puzzles.solveTimeTravel('2-3', 10), 2);
  assert.equal(Puzzles.solve('2050', '0-0'), 0);
  assert.equal(Puzzles.solve('2050', '744-744'), new Set(Puzzles.recaman()).has(744) ? 744 : -1);
  const missing = Array.from({length:745}, (_, i) => i).find(i => !Puzzles.recaman().includes(i));
  assert.equal(Puzzles.solve('2050', `${missing}-${missing}`), -1);
});

test('Time Travel agrees with independent arithmetic-series oracle across all hours and ranges', () => {
  const sequence = [0];
  for (let n = 1; n <= 744; n++) {
    const sub = sequence[n - 1] - n;
    sequence.push(sub >= 0 && !sequence.includes(sub) ? sub : sequence[n - 1] + n);
  }
  const visits = hour => {
    const first = Math.max(1, hour);
    let hops = 0;
    while (hour + (hops + 1) * (2 * first + hops) / 2 <= 744) hops++;
    return hops + 1;
  };
  const oracle = (start, end) => [...new Set(sequence)]
    .filter(hour => hour >= start && hour <= end)
    .sort((a, b) => visits(b) - visits(a) || a - b)[0] ?? -1;
  for (let hour = 0; hour <= 744; hour++) {
    assert.equal(Puzzles.solve('2050', `${hour}-${hour}`), oracle(hour, hour));
    const end = Math.min(744, hour + 33);
    assert.equal(Puzzles.solve('2050', `${hour}-${end}`), oracle(hour, end));
  }
});

test('Every generator returns valid, solvable inputs, including random boundaries', () => {
  let seed = 12345;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32);
  for (const puzzle of Puzzles.definitions) {
    for (const rng of [() => 0, () => .99999999, ...Array(100).fill(random)]) {
      const input = Puzzles.generate(puzzle.day, rng);
      assert.equal(Puzzles.validInput(puzzle.day, input), true);
      const result=Puzzles.solve(puzzle.day,input);
      if(Puzzles.answerFormat(puzzle.day)==='binary') assert.match(result,/^[01]+$/);
      else assert.equal(Number.isSafeInteger(result), true);
      if (puzzle.day === '2050') assert.notEqual(Puzzles.solve(puzzle.day, input), -1);
    }
  }
});

test('Removed practice days have no catalog entries, files, solver or counted completion', () => {
  for (const day of ['Test','Test2','Test3']) {
    assert.equal(Puzzles.definitions.some(item => item.day === day), false);
    assert.equal(fs.existsSync(path.join(__dirname, '../days/day' + day + '.html')), false);
    assert.throws(() => Puzzles.generate(day), /No solver registered/);
    const storage={getItem:()=>JSON.stringify({version:1,input:'5',answer:6,solved:true,attempts:1})};
    assert.equal(Progress.read(storage,day),null);
  }
});

test('Answers require complete safe integers; malformed input is rejected', () => {
  for (const raw of ['', '  ', 'Infinity', 'NaN', '1.2', '0x10', '1e2', '1+1', '1 2', '9007199254740992']) {
    assert.equal(Puzzles.parseAnswer(raw), null, raw);
  }
  assert.equal(Puzzles.parseAnswer(' 0 '), 0);
  assert.equal(Puzzles.parseAnswer('-1'), -1);
  for (const [day, input] of [['-1',''], ['-1','1\n\n2'], ['2050','8-2'], ['2050','0-745'], ['24','x'], ['25','5']]) {
    assert.equal(Puzzles.validInput(day, input), false);
    assert.throws(() => Puzzles.solve(day, input));
  }
});

test('Progress survives reload, validates stars, and tolerates corrupt or blocked storage', () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const record = Progress.create('RIGHT 6');
  assert.equal(Progress.write(storage, '24', record), true);
  assert.deepEqual(Progress.read(storage, '24'), record);
  record.solved = true;
  record.answer = 6;
  record.attempts = 2;
  Progress.write(storage, '24', record);
  assert.equal(Progress.read(storage, '24').solved, true);
  record.answer = 7;
  Progress.write(storage, '24', record);
  assert.equal(Progress.read(storage, '24').solved, false);
  values.set(Progress.prefix + '24', '{broken');
  assert.equal(Progress.read(storage, '24'), null);
  assert.equal(Progress.read(null, '24'), null);
  assert.equal(Progress.write(null, '24', record), false);
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('quota'); } };
  assert.equal(Progress.read(blocked, '24'), null);
  assert.equal(Progress.write(blocked, '24', record), false);
});

test('Every advertised puzzle exists and loads the shared runner', () => {
  for (const {day} of Puzzles.definitions) {
    const html = fs.readFileSync(path.join(__dirname, `../days/day${day}.html`), 'utf8');
    assert.ok(html.includes(`data-day="${day}"`));
    assert.ok(html.includes('../puzzle-runner.js'));
    assert.ok(html.includes('id="puzzleControls"'));
  }
  assert.equal(Puzzles.definitions.find(day => day.day === '25').title, 'Delivery Dilemma');
});


function slotReference(input) {
  const grid = input.trim().split(/\r?\n/).map(row => [...row].map(Number));
  let score = 0;
  for (let row = 0; row < 3; row++) for (let column = 0; column < 5; column++) {
    let weight = 1;
    if (new Set(grid[row]).size === 1) weight++;
    if (new Set(grid.map(line => line[column])).size === 1) weight++;
    score += grid[row][column] * weight;
  }
  return score;
}

test('Slots examples, overlapping bonuses, zeros, maximum score, and line endings', () => {
  for (const [input, answer] of [
    ['12345\n68795\n16275', 86],
    ['12345\n68795\n55555', 115],
    ['12345\n67890\n24680', 65],
    ['77777\n12345\n67890', 115],
    ['00000\n00000\n00000', 0],
    ['99999\n99999\n99999', 405],
    ['12345\r\n68795\r\n16275\r\n', 86]
  ]) {
    assert.equal(Puzzles.solve('777',input), answer);
    assert.equal(Puzzles.checkAnswer('777',input,String(answer)).status,'correct');
  }
  for (const invalid of ['', '12345\n12345', '12345\n12345\n12345\n12345', '1 234\n12345\n12345', '1234x\n12345\n12345']) {
    assert.equal(Puzzles.validInput('777',invalid),false);
  }
});

test('Slots solver matches independent cell-weight oracle on all 32,768 binary grids', () => {
  for (let mask=0;mask<32768;mask++) {
    const rows = Array.from({length:3},(_,row)=>Array.from({length:5},(_,column)=>(mask>>(row*5+column))&1).join(''));
    const input=rows.join('\n');
    assert.equal(Puzzles.solve('777',input),slotReference(input));
  }
});

test('Slots generator handles all first/second patterns and both value branches', () => {
  for(let first=0;first<8;first++) for(let second=0;second<8;second++) for(const reuse of [true,false]) {
    const draws=Array.from({length:15},(_,i)=>((i%10)+.1)/10);
    draws.push((first+.1)/8,.7,.9,(second+.1)/8,reuse?.1:.9);
    if(!reuse) draws.push(.4);
    let index=0;
    const input=Puzzles.generate('777',()=>{ assert.ok(index<draws.length); return draws[index++]; });
    assert.equal(index,draws.length);
    assert.equal(Puzzles.validInput('777',input),true);
    const rows=input.split('\n');
    const digits=second<3 ? [...rows[second]] : rows.map(row=>row[second-3]);
    assert.ok(digits.every(value=>value===(reuse?'7':'4')));
    assert.equal(Puzzles.solve('777',input),slotReference(input));
  }
});

test('Slots random inputs retain a pattern and match the independent oracle', () => {
  let seed=777;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let count=0;count<1000;count++) {
    const input=Puzzles.generate('777',random);
    const rows=input.split('\n');
    const matchingRow=rows.some(row=>new Set(row).size===1);
    const matchingColumn=Array.from({length:5},(_,column)=>new Set(rows.map(row=>row[column])).size===1).some(Boolean);
    assert.ok(matchingRow||matchingColumn);
    assert.equal(Puzzles.solve('777',input),slotReference(input));
  }
});

// Independent optimal contiguous-partition DP explores every feasible previous split.
function deliveryReference(gifts) {
  const best = [0];
  for (let end = 1; end <= gifts.length; end++) {
    best[end] = Infinity;
    let weight = 0, volume = 0;
    for (let start = end - 1; start >= 0; start--) {
      weight += gifts[start][0]; volume += gifts[start][1];
      if (weight > 10000 || volume > 10000) break;
      best[end] = Math.min(best[end], best[start] + 1);
    }
  }
  return best[gifts.length];
}
test('Day 25 handles exact fits, each capacity, input order and final partial rounds', () => {
  for (const [input, answer] of [
    ['10000-10000',1], ['5000-5000\n5000-5000',1],
    ['5000-5000\n5000-5000\n1-1',2],
    ['10000-1\n1-1',2], ['1-10000\n1-1',2],
    ['6000-1\n6000-1\n4000-1\n4000-1',3],
    ['20-20',1], ['1-1\r\n9999-9999\r\n',1]
  ]) assert.equal(Puzzles.solve('25',input),answer);
  const example=submissionCases.find(item=>item.day==='25').input.trim().split('\n').map(line=>line.split('-').map(Number));
  assert.deepEqual(example.slice(0,16).reduce((sum,gift)=>sum.map((value,i)=>value+gift[i]),[0,0]),[9724,8726]);
  assert.equal(deliveryReference(example),2);
  for (const input of ['', '0-1','1-0','10001-1','1-10001','-1-1','1.5-1','1-1-1','1-1\n\n2-2','abc',Array(10001).fill('1-1').join('\n')]) {
    assert.equal(Puzzles.validInput('25',input),false);
    assert.throws(()=>Puzzles.solve('25',input));
  }
});
test('Day 25 matches independent partition search and full generator extremes', () => {
  let seed=25;
  const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let trial=0;trial<1000;trial++) {
    const gifts=Array.from({length:1+Math.floor(random()*25)},()=>[1+Math.floor(random()*10000),1+Math.floor(random()*10000)]);
    assert.equal(Puzzles.solve('25',gifts.map(gift=>gift.join('-')).join('\n')),deliveryReference(gifts));
  }
  for(const [randomValue,answer,value] of [[0,20,20],[0.99999999,1112,1019]]) {
    const input=Puzzles.generate('25',()=>randomValue);
    assert.equal(input.split('\n').length,10000);
    assert.ok(input.split('\n').every(line=>line===value+'-'+value));
    assert.equal(Puzzles.solve('25',input.replaceAll('\n','\r\n')+'\r\n'),answer);
  }
  for(let trial=0;trial<10;trial++) {
    const input=Puzzles.generate('25',random);
    const gifts=input.split('\n').map(line=>line.split('-').map(Number));
    assert.ok(gifts.flat().every(value=>value>=20&&value<=1019));
    assert.equal(Puzzles.solve('25',input),deliveryReference(gifts));
  }
});
test('Day 25 validates full-input answers and reloads completion without reviving old input', () => {
  const input=Puzzles.generate('25',()=>0);
  assert.equal(Puzzles.checkAnswer('25',input,'20').status,'correct');
  assert.equal(Puzzles.checkAnswer('25',input,'21').status,'incorrect');
  for(const answer of ['','2.0','2e1','twenty']) assert.equal(Puzzles.checkAnswer('25',input,answer).status,'invalid');
  const values=new Map();const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  Progress.write(storage,'25',{version:1,input,answer:20,solved:true,attempts:1});
  assert.equal(Progress.read(storage,'25').solved,true);
  Progress.write(storage,'25',{version:1,input:'5',answer:6,solved:true,attempts:1});
  assert.equal(Progress.read(storage,'25'),null);
});

// Independent geometric oracle: build line segments, then count which directed
// segments contain each house (open start, closed finish), without a visit map.
function fairyReference(input) {
  let current=[0,0,0]; const segments=[],houses=new Set();
  for(const line of input.trim().split(/\r?\n/)) {
    const [direction,amount]=line.split(' '), distance=Number(amount);
    const axis=['LEFT','RIGHT'].includes(direction)?0:['UP','DOWN'].includes(direction)?1:2;
    const sign=['RIGHT','UP','FORWARD'].includes(direction)?1:-1;
    const finish=[...current];finish[axis]+=sign*distance;
    segments.push({start:current,finish,axis,sign});
    for(let value=Math.min(current[axis],finish[axis]);value<=Math.max(current[axis],finish[axis]);value++) {
      const point=[...current];point[axis]=value;houses.add(point.join(','));
    }
    current=finish;
  }
  houses.delete('0,0,0');
  const counts=[...houses].map(key=>{
    const point=key.split(',').map(Number);
    return segments.filter(({start,finish,axis,sign})=>point.every((value,i)=>i===axis||value===start[i])&&(point[axis]-start[axis])*sign>0&&(finish[axis]-point[axis])*sign>=0).length;
  });
  const most=Math.max(...counts);
  return counts.filter(count=>count===most).reduce((total,count)=>total+count,0);
}
test('Day 24 examples, intermediate houses, three axes, entrance exclusion and ties',()=>{
  for(const fixture of submissionCases.filter(item=>item.day==='24')) {
    assert.equal(Puzzles.solve('24',fixture.input),fixture.answer);
    assert.equal(fairyReference(fixture.input),fixture.answer);
  }
  for(const [input,answer] of [
    ['RIGHT 3',3],['LEFT 2\nRIGHT 2',2],['UP 2\nDOWN 4\nUP 2',4],
    ['FORWARD 1\nBACKWARD 1\nFORWARD 1\nBACKWARD 1\nUP 1\nDOWN 1',2],
    ['RIGHT 1\nUP 1\nFORWARD 1',3],['BACKWARD 3\nFORWARD 3',4],
    ['RIGHT 1\nLEFT 1\nUP 1\nDOWN 1',2],['UP 1\r\nDOWN 1\r\n',1]
  ]) {assert.equal(fairyReference(input),answer);assert.equal(Puzzles.solve('24',input),answer);}
});
test('Day 24 rejects malformed directions and bounds total path work',()=>{
  for(const input of ['', 'NORTH 1','UP 0','UP -1','UP 1.5','up 1','UP 1001','UP 01','UP 1 extra','UP 1\n\nDOWN 1',Array(2001).fill('UP 1').join('\n'),Array(201).fill('UP 1000').join('\n')]) {
    assert.equal(Puzzles.validInput('24',input),false);assert.throws(()=>Puzzles.solve('24',input));
  }
  assert.equal(Puzzles.solve('24',Array(200).fill('UP 1000').join('\n')),200000);
  assert.equal(Puzzles.solve('24',Array(2000).fill('UP 1').join('\n')),2000);
});
test('Day 24 agrees with geometric segment counting on small and generated paths',()=>{
  const directions=['LEFT','RIGHT','UP','DOWN','FORWARD','BACKWARD'];
  for(let encoded=0;encoded<6**4;encoded++) {
    let value=encoded;const lines=[];
    for(let i=0;i<4;i++){lines.push(directions[value%6]+' '+(i%2+1));value=Math.floor(value/6);}
    const input=lines.join('\n');assert.equal(Puzzles.solve('24',input),fairyReference(input));
  }
  let seed=24;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  for(let trial=0;trial<10;trial++) {
    const input=Puzzles.generate('24',random);
    assert.equal(input.split('\n').length,500);
    assert.equal(Puzzles.solve('24',input),fairyReference(input));
  }
  assert.equal(Puzzles.solve('24',Puzzles.generate('24',()=>0)),500);
  assert.equal(Puzzles.solve('24',Puzzles.generate('24',()=>0.99999999)),4000);
});
test('Day 24 checks answers against its own path and persists completion',()=>{
  const input='LEFT 2\nRIGHT 2';
  assert.equal(Puzzles.checkAnswer('24',input,'2').status,'correct');
  assert.equal(Puzzles.checkAnswer('24',input,'4').status,'incorrect');
  for(const raw of ['','2.0','2e0','2 houses'])assert.equal(Puzzles.checkAnswer('24',input,raw).status,'invalid');
  const values=new Map(),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  Progress.write(storage,'24',{version:1,input,answer:2,solved:true,attempts:2});
  assert.equal(Progress.read(storage,'24').solved,true);
  Progress.write(storage,'24',{version:1,input,answer:4,solved:true,attempts:2});
  assert.equal(Progress.read(storage,'24').solved,false);
});
