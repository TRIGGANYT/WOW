const { execFileSync } = require('child_process');

const zeroSha = '0000000000000000000000000000000000000000';
const payloads = [
  Buffer.from(`0 ${zeroSha}\t\r\0`),
  Buffer.from(`0 ${zeroSha}\t\n\0`)
];

const inputBuffer = Buffer.concat(payloads);

try {
  console.log("Removing via index-info...");
  execFileSync('git', ['update-index', '-z', '--index-info'], { input: inputBuffer });
  console.log("Done.");
} catch (e) {
  console.log("Failed: " + e.message);
}
