const fs = require("node:fs");
const path = require("node:path");
const allowed = new Set([
  "MIT", "MIT-0", "ISC", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0",
  "Python-2.0", "BlueOak-1.0.0", "0BSD", "WTFPL", "WTFPL OR ISC",
  "(MIT OR CC0-1.0)", "(WTFPL OR MIT)",
]);
const locks = process.argv.slice(2);
if (!locks.length) locks.push("package-lock.json");
let failed = false;
for (const file of locks) {
  const lock = JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
  const totals = {};
  let count = 0;
  for (const [name, pkg] of Object.entries(lock.packages || {})) {
    if (!name) continue;
    count++;
    const license = pkg.license || "MISSING";
    totals[license] = (totals[license] || 0) + 1;
    if (!allowed.has(license)) {
      failed = true;
      console.error(`${file}: review ${name}@${pkg.version}: ${license}`);
    }
  }
  console.log(JSON.stringify({ file, packages: count, licenses: totals }));
}
console.log("Scope: npm lockfiles. Containers and external service terms require separate review; see 33docs/DEPENDENCIES.md.");
if (failed) process.exitCode = 1;
