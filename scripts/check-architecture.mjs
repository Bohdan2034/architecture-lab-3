
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const srcRoot = path.join(root, "src");
const errors = [];

function getTypeScriptFiles(directory) {
  if (!fs.existsSync(directory)) return [];

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) return getTypeScriptFiles(fullPath);

    return entry.isFile() && entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

const files = getTypeScriptFiles(srcRoot);
const fileSet = new Set(files);
const graph = new Map();

function moduleName(file) {
  return path.relative(srcRoot, file).split(path.sep)[0];
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".")) return null;

  const base = path.resolve(path.dirname(fromFile), specifier);
  const candidates = [base, `${base}.ts`, path.join(base, "index.ts")];

  return candidates.find((candidate) => fileSet.has(candidate)) ?? null;
}

for (const file of files) {
  const relativeFile = path.relative(root, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");
  const dependencies = [];

  const importPattern =
    /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g;

  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    const target = resolveImport(file, specifier);

    if (target) {
      dependencies.push(target);

      const targetRelative = path.relative(srcRoot, target).replaceAll("\\", "/");
      const targetModule = moduleName(target);

      if (
        targetRelative.includes("/internal/") &&
        moduleName(file) !== targetModule
      ) {
        errors.push(
          `${relativeFile}: imports another module's internal code (${specifier})`,
        );
      }
    }
  }

  graph.set(file, dependencies);

  const isStockRepository =
    relativeFile === "src/inventory/StockRepository.ts";
  const isDatabase = relativeFile === "src/database.ts";
  const isDemo = relativeFile === "src/demo.ts";

  if (
    !isStockRepository &&
    !isDatabase &&
    !isDemo &&
    /\bdatabase\.stock\s*\.\s*(?:set|delete|clear)\s*\(/.test(source)
  ) {
    errors.push(
      `${relativeFile}: modify stock through StockRepository, not database.stock directly`,
    );
  }
}

const visiting = new Set();
const visited = new Set();
const stack = [];
const reportedCycles = new Set();

function visit(file) {
  if (visiting.has(file)) {
    const start = stack.indexOf(file);
    const cycle = [...stack.slice(start), file]
      .map((item) => path.relative(root, item).replaceAll("\\", "/"));
    const key = cycle.join(" -> ");

    if (!reportedCycles.has(key)) {
      reportedCycles.add(key);
      errors.push(`Circular dependency: ${key}`);
    }
    return;
  }

  if (visited.has(file)) return;

  visiting.add(file);
  stack.push(file);

  for (const dependency of graph.get(file) ?? []) {
    visit(dependency);
  }

  stack.pop();
  visiting.delete(file);
  visited.add(file);
}

for (const file of files) visit(file);

if (errors.length > 0) {
  console.error("Architecture check failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Architecture check passed: ${files.length} TypeScript files checked.`,
  );
}
