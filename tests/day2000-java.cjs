const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const Puzzles = require('../puzzles.js');
const repo = path.join(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-advent-day2000-'));
const javaBin = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin') : '';
const binary = name => javaBin ? path.join(javaBin, name) : name;
function run(command, args) {
  const result = spawnSync(command, args, {encoding:'utf8',maxBuffer:4 * 1024 * 1024});
  assert.equal(result.status, 0, result.error?.message || result.stderr);
  return result.stdout;
}
try {
  run(binary('javac'), ['-d',temp,path.join(repo,'examples/day2000/Main.java'),path.join(repo,'examples/day2000/InputGeneration.java'),path.join(__dirname,'PowerplantVerification.java')]);
  const lines = ['{130:(-5,-6),(-4,-5),(-5,-4),(-6,-4),(-4,-4)}', '{1:(2,-1),(2,0),(2,1)}', '{1:}', '{1:(0,0),(1,1)}'];
  for (const [sx,sy] of [[2,-1],[-12,-12]]) for(let mask=0;mask<512;mask++) {
    const pairs=[];
    for(let bit=0;bit<9;bit++) if(mask & (1<<bit)) pairs.push(`(${sx+bit%3},${sy+Math.floor(bit/3)})`);
    lines.push(`{1:${pairs.join(',')}}`);
  }
  const generated = run(binary('java'), ['-cp',temp,'InputGeneration','2000']);
  assert.equal(Puzzles.validInput('2000',generated),true);
  lines.push(...generated.trim().split(/\r?\n/));
  const input = path.join(temp,'trials.txt');
  fs.writeFileSync(input,lines.join('\n'));
  const results = run(binary('java'),['-cp',temp,'PowerplantVerification',input]).trim().split(/\r?\n/).map(Number);
  assert.equal(results.length,lines.length);
  results.forEach((value,index)=>assert.equal(value,Puzzles.solve('2000',lines[index]),lines[index]));
  assert.equal(Number(run(binary('java'),['-cp',temp,'Main',input]).trim()),results.reduce((a,b)=>a+b,0));
  console.log(`Java powerplant: ${lines.length} trials agree; generator, ages, cap, machine and CLI total verified.`);
} finally {
  const resolved = path.resolve(temp);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('mini-advent-day2000-')) throw Error('Unexpected temporary directory');
  fs.rmSync(resolved,{recursive:true,force:true});
}
