const fs = require('fs');
const buf = fs.readFileSync('head_files.bin');
let start = 0;
const corrupted = [];
for (let i = 0; i < buf.length; i++) {
  if (buf[i] === 0) {
    const entry = buf.toString('utf8', start, i);
    // git ls-tree -z format: <mode> SP <type> SP <sha1> TAB <path>
    const tabIndex = entry.indexOf('\t');
    if (tabIndex !== -1) {
      const name = entry.substring(tabIndex + 1);
      if (name.includes('\r') || name.includes('\n')) {
        corrupted.push(name);
      }
    }
    start = i + 1;
  }
}
console.log("Found in HEAD:", corrupted);
