const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'mini-advent-java-'));
try {
  const source = path.join(__dirname, '../examples/day777');
  execFileSync('javac', ['-d', scratch, path.join(source, 'InputGen.java'), path.join(source, 'SlotsAnswer.java'), path.join(__dirname, 'SlotsVerification.java')], {stdio:'inherit'});
  execFileSync('java', ['-cp', scratch, 'SlotsVerification'], {stdio:'inherit'});
  const example = path.join(scratch, 'example.txt');
  fs.writeFileSync(example, '12345\n68795\n16275\n');
  const score = execFileSync('java', ['-cp', scratch, 'SlotsAnswer', example], {encoding:'utf8'}).trim();
  if (score !== '86') throw new Error('Java CLI returned an incorrect score');
  console.log('Java file-input CLI example: 86 (passed).');
} finally {
  fs.rmSync(scratch, {recursive:true,force:true});
}
