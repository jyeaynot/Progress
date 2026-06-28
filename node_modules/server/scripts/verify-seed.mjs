import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const baseSeedPath = path.join(root, "server", "src", "db", "seed.sql");
const stressSeedPath = path.join(root, "server", "src", "db", "seed-stress.sql");
const listSamplePath = path.join(root, "server", "src", "db", "sample-api-farmers-list-response.json");
const exportSamplePath = path.join(root, "server", "src", "db", "sample-api-farmers-export.csv");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function countFarmers(sql) {
  return (sql.match(/ST_SetSRID\(ST_MakePoint/g) ?? []).length;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const baseSeed = read(baseSeedPath);
const stressSeed = read(stressSeedPath);
const listSample = JSON.parse(read(listSamplePath));
const exportSample = read(exportSamplePath).trim().split(/\r?\n/);

const baseCount = countFarmers(baseSeed);
const stressCount = countFarmers(stressSeed);
const sampleListCount = Array.isArray(listSample.data) ? listSample.data.length : 0;
const exportRowCount = Math.max(0, exportSample.length - 1);

if (baseCount !== 10) {
  fail(`Expected 10 base seed farmers, found ${baseCount}.`);
}

if (stressCount !== 20) {
  fail(`Expected 20 stress seed farmers, found ${stressCount}.`);
}

if (sampleListCount !== 10) {
  fail(`Expected 10 sample list records, found ${sampleListCount}.`);
}

if (exportRowCount !== 10) {
  fail(`Expected 10 sample export rows, found ${exportRowCount}.`);
}

const seedIds = new Set([
  ...Array.from(baseSeed.matchAll(/'([0-9a-f-]{36})',\s*'RSBSA-2026-\d{4}'/gi), (match) => match[1]),
  ...Array.from(stressSeed.matchAll(/'([0-9a-f-]{36})',\s*'RSBSA-2026-\d{4}'/gi), (match) => match[1]),
]);

for (const row of listSample.data ?? []) {
  if (!seedIds.has(row.id)) {
    fail(`Sample list id ${row.id} was not found in the seed files.`);
  }
}

console.log("Seed verification passed.");

