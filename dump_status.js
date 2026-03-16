const fs = require('fs');
const buf = fs.readFileSync('out_status.bin');
let text = buf.toString('utf8');
console.log(text.replace(/\r/g, '\\r').replace(/\n/g, '\\n\n'));
