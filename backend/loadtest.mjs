// Simple concurrent load tester — no dependencies.
// usage: node loadtest.mjs <url> <concurrency> <seconds>
const url = process.argv[2] || 'http://localhost:8080/api/books?size=20';
const concurrency = Number(process.argv[3] || 100);
const seconds = Number(process.argv[4] || 10);

const lat = [];
let ok = 0, fail = 0, stop = false;

async function worker() {
  while (!stop) {
    const t = performance.now();
    try {
      const r = await fetch(url);
      await r.arrayBuffer();
      (r.ok ? ok++ : fail++);
    } catch { fail++; }
    lat.push(performance.now() - t);
  }
}

const pct = (a, p) => a.length ? a.sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * p))] : 0;

const start = performance.now();
setTimeout(() => { stop = true; }, seconds * 1000);
await Promise.all(Array.from({ length: concurrency }, worker));
const elapsed = (performance.now() - start) / 1000;

console.log(`URL          : ${url}`);
console.log(`concurrency  : ${concurrency} for ${seconds}s`);
console.log(`requests     : ${ok} ok, ${fail} failed`);
console.log(`throughput   : ${(ok / elapsed).toFixed(0)} req/sec`);
console.log(`latency p50  : ${pct(lat, 0.50).toFixed(0)} ms`);
console.log(`latency p95  : ${pct(lat, 0.95).toFixed(0)} ms`);
console.log(`latency p99  : ${pct(lat, 0.99).toFixed(0)} ms`);
console.log(`latency max  : ${Math.max(...lat).toFixed(0)} ms`);
