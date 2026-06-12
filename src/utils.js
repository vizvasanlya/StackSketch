const path = require("node:path");

function normalizePath(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

function relativePath(root, filePath) {
  return normalizePath(path.relative(root, filePath));
}

function stripQueryHash(specifier) {
  return String(specifier || "").split("?")[0].split("#")[0];
}

function stripExtension(filePath) {
  const normalized = normalizePath(filePath);
  const ext = path.posix.extname(normalized);
  return ext ? normalized.slice(0, -ext.length) : normalized;
}

function bytesToSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < String(value).length; index += 1) {
    hash ^= String(value).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function patternToRegExp(pattern) {
  let normalized = normalizePath(pattern.trim());
  if (!normalized) return null;

  const anchored = normalized.startsWith("/") || normalized.startsWith("**/");
  const directoryOnly = normalized.endsWith("/");
  normalized = normalized.replace(/^\.\/+/, "").replace(/^\/+/, "").replace(/\/+$/g, "");
  if (!normalized) return null;

  const escaped = normalized
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, "[^/]");

  const body = anchored ? `^${escaped}(/.*)?$` : `(^|/)${escaped}(/.*)?$`;
  return new RegExp(directoryOnly ? `^${escaped}(/.*)?$` : body, "i");
}

function createMatcher(patterns = []) {
  const regexes = patterns
    .map(patternToRegExp)
    .filter(Boolean);

  return function matches(relativePath) {
    const normalized = normalizePath(relativePath || "");
    return regexes.some((regex) => regex.test(normalized));
  };
}

function topBy(items, getter, limit = 10) {
  return [...items]
    .sort((a, b) => getter(b) - getter(a) || String(a.path).localeCompare(String(b.path)))
    .slice(0, limit);
}

module.exports = {
  bytesToSize,
  createMatcher,
  escapeAttr,
  escapeHtml,
  parseInteger,
  patternToRegExp,
  pluralize,
  relativePath,
  stableHash,
  stripExtension,
  stripQueryHash,
  topBy,
  uniqueSorted
};
