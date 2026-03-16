const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === '.git') continue;
    
    if (file.includes('\r') || file.includes('\n') || file.includes('\b')) {
       console.log("BAD FILE:", JSON.stringify(file), "in", dir);
    }
    
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
       walkDir(fullPath);
    }
  }
}

walkDir('.');
console.log("Done checking files on disk.");
