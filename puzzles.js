(function (root) {
  'use strict';
  const definitions = [
    { day: '24', title: 'A Nightmare Before Christmas', author: 'Ava', kind: 'puzzle' },
    { day: '25', title: 'Delivery Dilemma', author: 'Selina Jiang', kind: 'puzzle' },
    { day: '99', title: 'Jack & Jill - Water Hill Spurge', author: 'Tyson', kind: 'puzzle' },
    { day: '74', title: 'Uncle Bob kindly sponsored this feast', author: 'Ada', kind: 'puzzle' },
    { day: '2000', title: 'Northpole Powerplant', author: 'Yuhao', kind: 'puzzle' },
    { day: '68', title: 'Christmas Tree Delivery', author: 'Jareth', kind: 'puzzle' },
    { day: '67', title: 'The Elves Have 67 Dollars', author: '', kind: 'puzzle' },
    { day: '2', title: 'Lights, Machines and Wattage', author: '', kind: 'puzzle' },
    { day: '777', title: 'Gambling With Slots', author: 'Justin & Muntasir', kind: 'puzzle' },
    { day: '2050', title: 'Time Travel!?', author: 'Leo Xu', kind: 'puzzle' },
    { day: '-1', title: 'Grinch!', author: 'Alston Liu', kind: 'puzzle' },
  ];
  function recaman(steps = 744) {
    const terms = [0];
    const seen = new Set(terms);
    for (let step = 1; step <= steps; step++) {
      const candidate = terms[step - 1] - step;
      const next = candidate >= 0 && !seen.has(candidate) ? candidate : terms[step - 1] + step;
      terms.push(next);
      seen.add(next);
    }
    return terms;
  }
  const eligibleHours = new Set(recaman());
  function solveTimeTravel(input, limit = 744) {
    const [start, end] = input.split('-').map(Number);
    let bestHour = -1;
    let bestVisits = -1;
    for (let hour = start; hour <= end; hour++) {
      if (!eligibleHours.has(hour)) continue;
      let current = hour;
      let step = Math.max(1, hour);
      let visits = 1; // The starting hour counts as one visit.
      while (current + step <= limit) {
        current += step++;
        visits++;
      }
      if (visits > bestVisits) {
        bestVisits = visits;
        bestHour = hour;
      }
    }
    return bestHour;
  }
  function solveGrinch(input) {
    const digits = input.split('\n').map((line, index) => line[index % line.length]);
    return digits.reduce((count, digit, index) => count + (index > 0 && digit === digits[index - 1] ? 1 : 0), 0);
  }
  function solveSlots(input) {
    const grid = input.trim().split(/\r?\n/).map(row => [...row].map(Number));
    let score = grid.flat().reduce((sum, digit) => sum + digit, 0);
    for (const row of grid) if (row.every(digit => digit === row[0])) score += row[0] * 5;
    for (let column = 0; column < 5; column++) {
      if (grid.every(row => row[column] === grid[0][column])) score += grid[0][column] * 3;
    }
    return score;
  }
  function generateSlots(random) {
    const integer = max => Math.floor(random() * max);
    const grid = Array.from({length: 3}, () => Array.from({length: 5}, () => integer(10)));
    const applyPattern = (pattern, value) => {
      if (pattern < 3) grid[pattern].fill(value);
      else for (const row of grid) row[pattern - 3] = value;
    };
    const firstPattern = integer(8);
    const firstValue = integer(10);
    applyPattern(firstPattern, firstValue);
    if (integer(10) >= 5) {
      const secondPattern = integer(8);
      const secondValue = integer(10) < 5 ? firstValue : integer(10);
      applyPattern(secondPattern, secondValue);
    }
    return grid.map(row => row.join('')).join('\n');
  }
  // Powerplant cells store age + 1; zero means dead, so live age-zero cells exist.
  const plantCenter = 12 * 25 + 12;
  const plantNeighbors = Array.from({length:625}, (_, index) => {
    const result = [];
    const x = index % 25, y = Math.floor(index / 25);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dy) || x + dx < 0 || x + dx >= 25 || y + dy < 0 || y + dy >= 25) continue;
      const next = (y + dy) * 25 + x + dx;
      if (next !== plantCenter) result.push(next);
    }
    return result;
  });
  function plantStep(board) {
    const counts = new Uint8Array(625);
    const oldest = new Uint8Array(625);
    for (let index = 0; index < 625; index++) {
      if (!board[index] || index === plantCenter) continue;
      for (const neighbor of plantNeighbors[index]) {
        counts[neighbor]++;
        oldest[neighbor] = Math.max(oldest[neighbor], board[index]);
      }
    }
    const next = new Uint8Array(625);
    for (let index = 0; index < 625; index++) {
      if (index === plantCenter) continue;
      if (board[index] && (counts[index] === 2 || counts[index] === 3)) next[index] = Math.min(101, board[index] + 1);
      else if (!board[index] && counts[index] === 3) next[index] = Math.min(101, oldest[index] + 1);
    }
    return next;
  }
  function plantPattern(board) {
    const live = [];
    for (let index = 0; index < 625; index++) if (board[index]) live.push(index);
    return live.join(',');
  }
  function runPlantTrial(coordinates) {
    let board = new Uint8Array(625);
    for (const [x, y] of coordinates) {
      // The machine and its eight neighbors are cleared before generation one.
      if (Math.abs(x) <= 1 && Math.abs(y) <= 1) continue;
      board[(y + 12) * 25 + x + 12] = 1;
    }
    const first = plantPattern(board);
    if (!first) return {energy:0, steps:0, reason:'extinct'};
    const seen = new Set([first]);
    for (let steps = 1; ; steps++) {
      board = plantStep(board);
      if (plantNeighbors[plantCenter].some(index => board[index] > 0)) {
        const ageSum = plantNeighbors[plantCenter].reduce((sum, index) => sum + (board[index] ? board[index] - 1 : 0), 0);
        return {energy:600 * ageSum, steps, reason:'harvest'};
      }
      const pattern = plantPattern(board);
      if (!pattern) return {energy:0, steps, reason:'extinct'};
      // Future occupancy does not depend on age: a repeated pattern cannot first
      // reach the machine later. No arbitrary generation cutoff is needed.
      if (seen.has(pattern)) return {energy:0, steps, reason:'cycle'};
      seen.add(pattern);
    }
  }
  function parsePlant(input) {
    if (!input.trim()) throw new Error('Empty powerplant input');
    return input.trim().split(/\r?\n/).filter(line => line.trim()).map(line => {
      const record = /^\s*\{\s*\d{1,9}\s*:\s*(.*?)\s*\}\s*$/.exec(line);
      if (!record) throw new Error('Invalid trial');
      const body = record[1];
      if (!body) return [];
      if (!/^\(\s*-?\d{1,2}\s*,\s*-?\d{1,2}\s*\)(?:\s*,\s*\(\s*-?\d{1,2}\s*,\s*-?\d{1,2}\s*\))*$/.test(body)) throw new Error('Invalid coordinates');
      return [...body.matchAll(/\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g)].map(match => {
        const x = Number(match[1]), y = Number(match[2]);
        if (Math.abs(x) > 12 || Math.abs(y) > 12) throw new Error('Coordinates outside powerplant');
        return [x, y];
      });
    });
  }
  // Every catalog entry must explicitly choose its rules. Never default a new day to another solver.
  const feastFoods = ['TURKEY', 'BREAD', 'SALAD', 'HAM', 'SAUSAGE', 'PIZZA', 'EGG', 'DRUMSTICK', 'BEEF', 'LASAGNA'];
  const poisonedFoods = new Set(['PIZZA', 'EGG', 'SALAD', 'HAM']);
  function parseFeast(input) {
    return input.trim().split(',').map(raw => {
      const record = /^([01])(\d{2})((?:[A-Z]+[1-4]){4})$/.exec(raw.trim());
      if (!record) throw new Error('Invalid feast guest');
      const age = Number(record[2]);
      const meals = [...record[3].matchAll(/([A-Z]+)([1-4])/g)].map(match => ({food:match[1], servings:Number(match[2])}));
      if (age < 10 || age > 99 || meals.some(meal => !feastFoods.includes(meal.food)) || new Set(meals.map(meal => meal.food)).size !== 4) {
        throw new Error('Invalid age or food list');
      }
      return {vaccinated:record[1] === '1', age, meals};
    });
  }
  function deliveryGifts(input) {
    const lines = input.trim().split(/\r?\n/);
    if (!input.trim() || lines.length > 10000) throw new Error('Expected 1–10,000 gifts');
    return lines.map(line => {
      if (!/^[1-9]\d{0,4}-[1-9]\d{0,4}$/.test(line)) throw new Error('Expected weight-volume');
      const gift = line.split('-').map(Number);
      if (gift.some(value => value > 10000)) throw new Error('Gift exceeds sleigh capacity');
      return gift;
    });
  }
  const fairyDirections = {
    RIGHT: [1,0,0], LEFT: [-1,0,0], UP: [0,1,0], DOWN: [0,-1,0],
    FORWARD: [0,0,1], BACKWARD: [0,0,-1]
  };
  function fairyInstructions(input) {
    const lines = input.trim().split(/\r?\n/);
    if (!input.trim() || lines.length > 2000) throw new Error('Expected 1–2,000 directions');
    let total = 0;
    return lines.map(line => {
      const match = /^(FORWARD|BACKWARD|LEFT|RIGHT|UP|DOWN) ([1-9]\d{0,3})$/.exec(line);
      if (!match) throw new Error('Expected a direction and positive distance');
      const distance = Number(match[2]);
      total += distance;
      if (distance > 1000 || total > 200000) throw new Error('Path exceeds supported size');
      return {delta:fairyDirections[match[1]], distance};
    });
  }
  const handlers = {
    '24': {
      maxInputLength: 40000,
      validInput(input) { try { fairyInstructions(input); return true; } catch { return false; } },
      generate(random) {
        const directions = Object.keys(fairyDirections);
        return Array.from({length:500}, () => directions[Math.floor(random()*6)] + ' ' + (1+Math.floor(random()*8))).join('\n');
      },
      solve(input) {
        const position = [0,0,0];
        const visits = new Map();
        for (const {delta, distance} of fairyInstructions(input)) {
          for (let step=0; step<distance; step++) {
            for (let axis=0; axis<3; axis++) position[axis] += delta[axis];
            if (position.every(value => value === 0)) continue;
            const house = position.join(',');
            visits.set(house, (visits.get(house) || 0) + 1);
          }
        }
        let maximum = 0, ties = 0;
        for (const count of visits.values()) {
          if (count > maximum) { maximum = count; ties = 1; }
          else if (count === maximum) ties++;
        }
        return maximum * ties;
      }
    },
    '25': {
      maxInputLength: 200000,
      validInput(input) { try { deliveryGifts(input); return true; } catch { return false; } },
      generate(random) {
        return Array.from({length:10000}, () =>
          (20 + Math.floor(random() * 1000)) + '-' + (20 + Math.floor(random() * 1000))
        ).join('\n');
      },
      solve(input) {
        let rounds = 1, weight = 0, volume = 0;
        for (const [giftWeight, giftVolume] of deliveryGifts(input)) {
          if (weight + giftWeight > 10000 || volume + giftVolume > 10000) {
            rounds++;
            weight = 0;
            volume = 0;
          }
          weight += giftWeight;
          volume += giftVolume;
        }
        return rounds;
      }
    },
    '99': {
      answerFormat: 'binary',
      maxInputLength: 100000,
      validInput(input) { try { parseWaterTrips(input); return true; } catch { return false; } },
      generate(random) {
        const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
        const count = integer(15,30);
        const lines = [String(count)];
        for (let trip=1;trip<=count;trip++) {
          lines.push(`T${trip}`,`${integer(15,80)} ${integer(0,60)} 2`,`${integer(5,15)} ${integer(5,15)}`);
          for (let village=1;village<=2;village++) {
            const id=(trip-1)*2+village;
            const exchanges=integer(0,2);
            lines.push(`V${id}`,exchanges ? `${integer(3,25)} ${integer(3,15)} ${exchanges}` : '0',`B${id}`);
            for(let item=0;item<2;item++) lines.push(`${integer(5,30)} ${integer(1,30)}`);
            lines.push(`W${id}`);
            for(let item=0;item<2;item++) lines.push(`${integer(5,40)} ${integer(0,25)}`);
          }
        }
        return lines.join('\n');
      },
      solve: input => parseWaterTrips(input).map(trip => canCompleteWaterTrip(trip) ? '1' : '0').join('')
    },
    '74': {
      validInput(input) { try { parseFeast(input); return true; } catch { return false; } },
      generate(random) {
        return Array.from({length:100}, () => {
          const vaccinated = Math.floor(random() * 2);
          const age = 10 + Math.floor(random() * 90);
          const remaining = [...feastFoods];
          const meals = Array.from({length:4}, () => {
            const food = remaining.splice(Math.floor(random() * remaining.length), 1)[0];
            return food + (1 + Math.floor(random() * 4));
          });
          return String(vaccinated) + age + meals.join('');
        }).join(',');
      },
      solve: input => parseFeast(input).reduce((total, guest) => {
        const poisonedServings = guest.meals.reduce((sum, meal) => sum + (poisonedFoods.has(meal.food) ? meal.servings : 0), 0);
        if (poisonedServings < (guest.vaccinated ? 5 : 3)) return total;
        return total + (guest.age < 18 ? 528 : 1647);
      }, 0)
    },
    '2000': {
      maxInputLength: 100000,
      validInput(input) { try { parsePlant(input); return true; } catch { return false; } },
      generate(random) {
        const trials = [];
        const count = 114 + Math.floor(random() * 10);
        for (let trial = 0; trial < count; trial++) {
          const height = 3 + Math.floor(random() * 5), width = 3 + Math.floor(random() * 5);
          const startX = -12 + Math.floor(random() * (26 - width));
          const startY = -12 + Math.floor(random() * (26 - height));
          const label = 1 + Math.floor(random() * 999);
          const coordinates = [];
          for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
            if (random() >= (coordinates.length > Math.floor(height * width / 3) ? 0.2 : 0.8)) break;
            coordinates.push(`(${startX + x},${startY + y})`);
          }
          trials.push(`{${label}:${coordinates.join(',')}}`);
        }
        return trials.join('\n');
      },
      solve: input => parsePlant(input).reduce((sum, coordinates) => sum + runPlantTrial(coordinates).energy, 0)
    },
    '68': {
      answerFormat: 'money',
      maxInputLength: 100000,
      validInput(input) {
        if (!input.trim() || /[^ *o@\r\n\t]/.test(input)) return false;
        return input.trim().split(/\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*/).every(tree => {
          const rows = tree.split(/\r?\n/).map(row => row.trim());
          return rows[0] === '*' && rows.every((row, index) => /^[*o@]+$/.test(row) && row.length === index * 2 + 1);
        });
      },
      generate(random) {
        const trees = [];
        const count = Math.floor(random() * 151) + 50;
        for (let tree = 0; tree < count; tree++) {
          const widthLimit = Math.floor(random() * 11) + 10;
          const rows = [];
          for (let width = 1; width < widthLimit; width += 2) {
            let row = ' '.repeat(Math.floor((widthLimit - width) / 2));
            for (let position = 0; position < width; position++) {
              row += width === 1 || Math.floor(random() * 2) === 1
                ? '*' : Math.floor(random() * 2) === 1 ? '@' : 'o';
            }
            rows.push(row);
          }
          trees.push(rows.join('\n'));
        }
        return trees.join('\n\n');
      },
      solve(input) {
        return input.trim().split(/\r?\n[ \t]*\r?\n(?:[ \t]*\r?\n)*/).reduce((total, tree) => {
          const height = tree.split(/\r?\n/).length;
          const ornaments = (tree.match(/o/g) || []).length;
          const tinsel = (tree.match(/@/g) || []).length;
          const baseDollars = height * 50 + ornaments * 2 + tinsel * 5 + (tinsel > 10 ? 75 : 0);
          // Dollar costs × 120 give exact marked-up cents, without floating point.
          return total + baseDollars * 120;
        }, 0);
      }
    },
    '67': {
      validInput: input => /^[{}\[~]+(?:\r?\n)?$/.test(input),
      generate: random => Array.from({ length: 5001 }, () => '{}[~'[Math.floor(random() * 4)]).join(''),
      solve(input) {
        let balance = 67;
        let skippedChanges = 0;
        let doubleUntil = [];
        for (const [index, symbol] of [...input.trim()].entries()) {
          doubleUntil = doubleUntil.filter(end => end >= index);
          if (skippedChanges > 0) {
            if (symbol === '{' || symbol === '}') skippedChanges--;
            continue;
          }
          if (symbol === '[') doubleUntil.push(index + 2);
          else if (symbol === '~') skippedChanges = 2;
          else balance += (symbol === '{' ? 1 : -1) * 2 ** doubleUntil.length;
        }
        return balance;
      }
    },
    '2': {
      validInput: input => /^[12]{30}(?:\r?\n[12]{30})*(?:\r?\n)?$/.test(input),
      generate: random => Array.from({ length: 40 }, () => Array.from({ length: 30 }, () => random() < 0.5 ? '1' : '2').join('')).join('\n'),
      solve: input => input.trim().split(/\r?\n/).reduce((total, row) => {
        const watts = [...row].reduce((sum, plug) => sum + (plug === '1' ? 6 : 234), 0);
        return total + Math.ceil(watts / 500);
      }, 0)
    },
    '777': {
      validInput: input => /^\d{5}\r?\n\d{5}\r?\n\d{5}(?:\r?\n)?$/.test(input),
      generate: generateSlots,
      solve: solveSlots
    },
    '2050': {
      validInput(input) {
        if (!/^\d{1,3}-\d{1,3}$/.test(input)) return false;
        const [start, end] = input.split('-').map(Number);
        return start <= end && end <= 744;
      },
      generate(random) {
        const hours = [...eligibleHours].filter(hour => hour <= 744).sort((a, b) => a - b);
        const start = hours[Math.floor(random() * (hours.length - 1))];
        return start + '-' + (start + 1 + Math.floor(random() * (744 - start)));
      },
      solve: solveTimeTravel
    },
    '-1': {
      validInput: input => /^(?:\d{1,40}\n){1,99}\d{1,40}$/.test(input),
      generate: random => Array.from({ length: 30 }, () => Array.from({ length: 3 + Math.floor(random() * 10) }, () => Math.floor(random() * 5)).join('')).join('\n'),
      solve: solveGrinch
    },
  };
  function handlerFor(day) {
    if (!definitions.some(item => item.day === day) || !Object.hasOwn(handlers, day)) {
      throw new Error('No solver registered for puzzle: ' + day);
    }
    return handlers[day];
  }
  function parseWaterTrips(input) {
    const lines=input.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
    let cursor=0;
    const take=()=>{ if(cursor>=lines.length) throw Error('Incomplete trip input'); return lines[cursor++]; };
    const numbers=(line,count)=>{
      if(!/^\d+(?:[ \t]+\d+)*$/.test(line)) throw Error('Expected nonnegative integers');
      const values=line.split(/[ \t]+/).map(Number);
      if((count!==null && values.length!==count) || values.some(value=>!Number.isSafeInteger(value)||value>1000000)) throw Error('Invalid trip numbers');
      return values;
    };
    const count=numbers(take(),1)[0];
    if(count<1||count>30) throw Error('Expected 1–30 trips');
    const trips=[];
    for(let number=1;number<=count;number++) {
      if(take()!==`T${number}`) throw Error('Trip markers must follow input order');
      const [goal,budget,villages]=numbers(take(),3);
      const starting=numbers(take(),null);
      if(goal<1||villages<1||villages>4||starting.some(value=>value<1)) throw Error('Invalid trip configuration');
      const trip={goal,budget,capacity:starting.reduce((a,b)=>a+b,0),buckets:[],wells:[],exchanges:[]};
      const ids=new Set();
      for(let village=0;village<villages;village++) {
        const marker=/^V([1-9]\d{0,5})$/.exec(take());
        if(!marker||ids.has(marker[1])) throw Error('Invalid village marker');
        const id=marker[1]; ids.add(id);
        const exchangeLine=take();
        if(exchangeLine!=='0') {
          const [cash,water,limit]=numbers(exchangeLine,3);
          if(cash<1||water<1||limit<1||limit>4) throw Error('Invalid exchange');
          trip.exchanges.push({cash,water,limit});
        }
        if(take()!==`B${id}`) throw Error('Bucket marker must match village');
        while(cursor<lines.length&&!/^[VBTW]/.test(lines[cursor])) {
          const [capacity,cost]=numbers(take(),2);
          if(capacity<1) throw Error('Invalid bucket');
          trip.buckets.push({capacity,cost});
        }
        if(take()!==`W${id}`) throw Error('Well marker must match village');
        while(cursor<lines.length&&!/^[VBTW]/.test(lines[cursor])) {
          const [water,cost]=numbers(take(),2);
          if(water<1) throw Error('Invalid well');
          trip.wells.push({water,cost});
        }
      }
      if(trip.buckets.length>6||trip.wells.length>6||trip.exchanges.reduce((sum,e)=>sum+e.limit,0)>4) throw Error('Trip exceeds exact-search input limits');
      trips.push(trip);
    }
    if(cursor!==lines.length) throw Error('Unexpected trailing input');
    return trips;
  }
  function canCompleteWaterTrip(trip) {
    const {goal,buckets,wells,exchanges}=trip;
    const bestWater=new Map();
    let combinations=1;
    const strides=exchanges.map(exchange=>{ const stride=combinations; combinations*=exchange.limit+1; return stride; });
    function visit(bucketMask,wellMask,exchangeCode,capacity,cash,water) {
      if(water>=goal) return true;
      let possibleCapacity=capacity, possibleWater=water;
      buckets.forEach((bucket,index)=>{if(!(bucketMask&(1<<index)))possibleCapacity+=bucket.capacity;});
      wells.forEach((well,index)=>{if(!(wellMask&(1<<index)))possibleWater+=well.water;});
      if(possibleCapacity<goal||possibleWater<goal) return false;
      const key=bucketMask | (wellMask<<buckets.length) | (exchangeCode<<(buckets.length+wells.length));
      // For identical used offers, cash and capacity are fixed. More water can
      // only help, including when filling a well or selling fixed quantities.
      if((bestWater.get(key)??-1)>=water) return false;
      bestWater.set(key,water);
      for(let index=0;index<wells.length;index++) {
        const well=wells[index];
        if(!(wellMask&(1<<index))&&cash>=well.cost&&water<capacity &&
          visit(bucketMask,wellMask|(1<<index),exchangeCode,capacity,cash-well.cost,Math.min(capacity,water+well.water))) return true;
      }
      for(let index=0;index<buckets.length;index++) {
        const bucket=buckets[index];
        if(!(bucketMask&(1<<index))&&cash>=bucket.cost&&capacity<goal &&
          visit(bucketMask|(1<<index),wellMask,exchangeCode,Math.min(goal,capacity+bucket.capacity),cash-bucket.cost,water)) return true;
      }
      for(let index=0;index<exchanges.length;index++) {
        const exchange=exchanges[index];
        const used=Math.floor(exchangeCode/strides[index])%(exchange.limit+1);
        if(used<exchange.limit&&water>=exchange.water &&
          visit(bucketMask,wellMask,exchangeCode+strides[index],capacity,cash+exchange.cash,water-exchange.water)) return true;
      }
      return false;
    }
    return visit(0,0,0,Math.min(goal,trip.capacity),trip.budget,0);
  }
  function validInput(day, input) {
    if (typeof input !== 'string') return false;
    try {
      const handler = handlerFor(day);
      return input.length <= (handler.maxInputLength || 10000) && handler.validInput(input);
    } catch { return false; }
  }
  function generate(day, random = Math.random) {
    return handlerFor(day).generate(random);
  }
  function solve(day, input) {
    const handler = handlerFor(day);
    if (!validInput(day, input)) throw new Error('Invalid puzzle input');
    const answer = handler.solve(input);
    if (handler.answerFormat === 'binary') {
      if (typeof answer !== 'string' || !/^[01]+$/.test(answer)) throw new Error('Solver must return trip result digits');
    } else if (!Number.isSafeInteger(answer)) throw new Error('Solver must return a safe integer');
    return answer;
  }
  function checkAnswer(day, input, rawAnswer) {
    // Calculate from this advent's saved/displayed input, never another page's answer.
    const expected = solve(day, input);
    const format = answerFormat(day);
    const submitted = format === 'binary'
      ? (/^[01]+$/.test(rawAnswer.trim()) && rawAnswer.trim().length === expected.length ? rawAnswer.trim() : null)
      : format === 'money' ? parseMoney(rawAnswer) : parseAnswer(rawAnswer);
    if (submitted === null) return { status: 'invalid' };
    if (submitted === expected) return { status: 'correct', answer: submitted };
    return format === 'binary' ? {status:'incorrect'} : { status: 'incorrect', direction: submitted < expected ? 'low' : 'high' };
  }
  function parseAnswer(raw) {
    if (!/^-?\d+$/.test(raw.trim())) return null;
    const number = Number(raw.trim());
    return Number.isSafeInteger(number) ? number : null;
  }
  function parseMoney(raw) {
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(raw.trim());
    if (!match) return null;
    const cents = BigInt(match[1]) * 100n + BigInt((match[2] || '').padEnd(2, '0'));
    return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : null;
  }
  function answerFormat(day) { return handlerFor(day).answerFormat || 'integer'; }
  function formatAnswer(day, answer) {
    return answerFormat(day) === 'money'
      ? Math.floor(answer / 100) + '.' + String(answer % 100).padStart(2, '0')
      : String(answer);
  }
  const api = { definitions, recaman, solveTimeTravel, solveGrinch, validInput, generate, solve, checkAnswer, parseAnswer, parseMoney, answerFormat, formatAnswer, powerplant: {step:plantStep, runTrial:runPlantTrial, parse:parsePlant}, waterTrips: {parse:parseWaterTrips, canComplete:canCompleteWaterTrip} };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Puzzles = api;
})(globalThis);
