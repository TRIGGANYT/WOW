const fs = require('fs');
const buf = fs.readFileSync('files.bin');
let start = 0;
const corrupted = [];
for (let i = 0; i < buf.length; i++) {
  if (buf[i] === 0) {
    const name = buf.toString('utf8', start, i);
    if (name.includes('\r') || name.includes('\n')) {
      corrupted.push(name);
    }
    start = i + 1;
  }
}
console.log("Found corrupted files:");
corrupted.forEach(c => console.log(JSON.stringify(c)));
