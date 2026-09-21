const { analyzeProject, formatMarkdown, extractImports } = require("./analyzer");
const { renderHtml } = require("./renderers");
const { SAMPLE_PROJECTS } = require("./samples");
const { LANGUAGE_COLORS, DEFAULT_IGNORE_PATTERNS } = require("./defaults");
const { version } = require("../package.json");

module.exports = {
  version,
  analyzeProject,
  formatMarkdown,
  extractImports,
  renderHtml,
  SAMPLE_PROJECTS,
  LANGUAGE_COLORS,
  DEFAULT_IGNORE_PATTERNS
};
