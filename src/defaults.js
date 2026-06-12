const LANGUAGE_EXTENSIONS = {
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".mts": "TypeScript",
  ".cts": "TypeScript",
  ".py": "Python",
  ".dart": "Dart",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".cs": "C#",
  ".php": "PHP",
  ".rb": "Ruby",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".scala": "Scala",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".c": "C",
  ".h": "C/C++ Header",
  ".hpp": "C/C++ Header",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".html": "HTML",
  ".json": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".md": "Markdown",
  ".sql": "SQL",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".ps1": "PowerShell",
  ".dockerfile": "Dockerfile",
  ".tf": "Terraform",
  ".lua": "Lua"
};

const CONFIG_FILES = new Set([
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
  "vite.config.js",
  "vite.config.ts",
  "webpack.config.js",
  "rollup.config.js",
  "next.config.js",
  "next.config.mjs",
  "nuxt.config.js",
  "nuxt.config.ts",
  "svelte.config.js",
  "astro.config.mjs",
  "tailwind.config.js",
  "tailwind.config.ts",
  "pyproject.toml",
  "requirements.txt",
  "Pipfile",
  "poetry.lock",
  "pubspec.yaml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "Gemfile",
  "composer.json",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  ".env.example",
  "README.md"
]);

const DEFAULT_IGNORE_PATTERNS = [
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".astro",
  ".turbo",
  ".vite",
  "target",
  "vendor",
  ".venv",
  "venv",
  ".dart_tool",
  ".fvm",
  "__pycache__",
  ".pytest_cache",
  ".mypy_cache",
  ".ruff_cache",
  ".DS_Store",
  "Thumbs.db",
  "*.min.js",
  "*.map",
  "package-lock.json",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  "pnpm-debug.log*",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "uv.lock",
  "poetry.lock",
  "Cargo.lock",
  "composer.lock",
  "Gemfile.lock",
  "stacksketch.html",
  "stacksketch.md",
  "stacksketch.json"
];

const LANGUAGE_COLORS = {
  JavaScript: "#f7df1e",
  TypeScript: "#3178c6",
  Dart: "#00B4AB",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Scala: "#C22D40",
  C: "#555555",
  "C++": "#f34b7d",
  "C/C++ Header": "#555555",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Sass: "#c6538c",
  Less: "#1d365d",
  HTML: "#e34c26",
  JSON: "#cb3837",
  YAML: "#cb171e",
  TOML: "#9c4221",
  Markdown: "#083fa1",
  SQL: "#e38c00",
  Shell: "#89e051",
  PowerShell: "#012456",
  Dockerfile: "#384d54",
  Terraform: "#7b42bb",
  Lua: "#000080",
  Unknown: "#94a3b8"
};

function detectLanguage(filePath, content = "") {
  const normalized = normalizeFilePath(filePath);
  const base = normalized.split("/").pop();
  if (base === "Dockerfile") return "Dockerfile";
  const extension = normalized.includes(".") ? `.${normalized.split(".").pop()}`.toLowerCase() : "";
  if (LANGUAGE_EXTENSIONS[extension]) return LANGUAGE_EXTENSIONS[extension];
  if (/^\s*#!/.test(content) && /\.(js|ts|py|rb|sh|bash|zsh)$/i.test(extension)) {
    return extension === ".py" ? "Python" : "Shell";
  }
  return "Unknown";
}

function isConfigFile(filePath) {
  const normalized = normalizeFilePath(filePath);
  const base = normalized.split("/").pop();
  return CONFIG_FILES.has(base);
}

function isProbablySource(filePath, content = "") {
  return detectLanguage(filePath, content) !== "Unknown" || isConfigFile(filePath);
}

function normalizeFilePath(filePath) {
  return String(filePath).replace(/\\/g, "/");
}

module.exports = {
  CONFIG_FILES,
  DEFAULT_IGNORE_PATTERNS,
  LANGUAGE_COLORS,
  LANGUAGE_EXTENSIONS,
  detectLanguage,
  isConfigFile,
  isProbablySource,
  normalizeFilePath
};
