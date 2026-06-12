const fs = require("node:fs/promises");
const path = require("node:path");
const {
  DEFAULT_IGNORE_PATTERNS,
  detectLanguage,
  isConfigFile,
  isProbablySource,
  normalizeFilePath
} = require("./defaults");
const {
  bytesToSize,
  createMatcher,
  escapeHtml,
  parseInteger,
  relativePath,
  stableHash,
  stripExtension,
  stripQueryHash,
  topBy,
  uniquePreserveOrder,
  uniqueSorted
} = require("./utils");

const JS_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".mts", ".cts"];
const CSS_EXTENSIONS = [".css", ".scss", ".sass", ".less"];
const DART_EXTENSIONS = [".dart"];
const IMPORT_LIMIT_PER_FILE = 80;
const EDGE_LIMIT = 900;

async function analyzeProject(rootPath = ".", options = {}) {
  const root = path.resolve(process.cwd(), rootPath || ".");
  const stat = await fs.stat(root).catch((error) => {
    throw new Error(`Cannot read project root "${root}": ${error.message}`);
  });

  if (!stat.isDirectory()) {
    throw new Error(`Project root "${root}" is not a directory.`);
  }

  const maxFiles = Math.max(1, parseInteger(options.maxFiles, 500));
  const ignorePatterns = uniquePreserveOrder([...DEFAULT_IGNORE_PATTERNS, ...(options.ignore || [])]);
  const includePatterns = uniqueSorted(options.include || []);
  const ignore = createMatcher(ignorePatterns);
  const include = includePatterns.length ? createMatcher(includePatterns) : () => true;
  const rootGitignorePatterns = await readGitignoreFile(path.join(root, ".gitignore"), root, ".");
  const gitignorePatterns = [...rootGitignorePatterns, ...await readGitignorePatterns(root)];
  const combinedIgnore = createMatcher([...ignorePatterns, ...gitignorePatterns]);
  const goModulePrefix = await readGoModulePrefix(path.join(root, "go.mod"));

  const scanResult = await scanDirectory(root, combinedIgnore, include);
  const allFiles = scanResult;
  const sourceFiles = allFiles.filter((file) => file.isSource && !file.binary).map((file) => file.relative);
  const selectedFiles = selectFiles(sourceFiles, maxFiles);
  const fileReports = [];
  for (const relative of selectedFiles) {
    try {
      fileReports.push(await readFileReport(root, relative));
    } catch (error) {
      if (error.code === "ENOENT" || error.code === "EACCES") continue;
      throw error;
    }
  }

  const moduleIndex = buildModuleIndex(fileReports);
  const config = await readConfig(root, fileReports.map((report) => report.path));
  const externalDependencies = new Map();
  const edges = [];

  for (const report of fileReports) {
    for (const specifier of report.imports) {
      const resolved = resolveImport(root, report.path, specifier, report.language, moduleIndex, goModulePrefix);
      if (resolved) {
        edges.push({
          source: report.path,
          target: resolved,
          kind: "local",
          specifier
        });
      } else {
        const external = resolveExternalDependency(specifier, report.language, goModulePrefix);
        if (external) {
          const current = externalDependencies.get(external) || {
            id: external,
            name: external,
            language: "External",
            count: 0,
            imports: []
          };
          current.count += 1;
          if (!current.imports.includes(report.path)) current.imports.push(report.path);
          externalDependencies.set(external, current);
        }
      }
    }
  }

  const localEdges = edges.filter((edge) => edge.kind === "local").slice(0, EDGE_LIMIT);
  const externalNodes = [...externalDependencies.values()]
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, 120)
    .map((dependency) => ({
      id: dependency.id,
      path: dependency.id,
      name: dependency.name,
      language: "External",
      lines: dependency.count,
      loc: dependency.count,
      imports: dependency.imports.slice(0, 20),
      exports: [],
      score: dependency.count * 25,
      external: true
    }));

  const externalEdges = [...externalDependencies.entries()]
    .flatMap(([id, dependency]) => dependency.imports.slice(0, 8).map((source) => ({
      source,
      target: id,
      kind: "external",
      specifier: id
    })))
    .slice(0, EDGE_LIMIT);

  const nodes = [...fileReports, ...externalNodes].sort((a, b) => a.path.localeCompare(b.path));
  const languages = summarizeLanguages(fileReports);
  const frameworks = detectFrameworks(config, fileReports);
  const topFiles = topBy(fileReports, (file) => file.score, 12);
  const directoryTree = buildDirectoryTree(fileReports, 160);
  const totalLines = fileReports.reduce((sum, file) => sum + file.lines, 0);
  const totalBytes = fileReports.reduce((sum, file) => sum + file.bytes, 0);
  const sourceFileCount = fileReports.filter((file) => !file.external).length;

  const rootName = path.basename(root) || "StackSketch";

  return {
    name: options.title || rootName,
    root: rootName,
    title: options.title || rootName,
    generatedAt: new Date().toISOString(),
    summary: {
      totalFiles: allFiles.length,
      sourceFiles: sourceFiles.length,
      scannedFiles: selectedFiles.length,
      maxFiles,
      maxFilesReached: sourceFiles.length > maxFiles,
      totalLines,
      totalCodeLines: fileReports.reduce((sum, file) => sum + file.codeLines, 0),
      totalBlankLines: fileReports.reduce((sum, file) => sum + file.blankLines, 0),
      totalCommentLines: fileReports.reduce((sum, file) => sum + file.commentLines, 0),
      totalBytes,
      importEdges: localEdges.length,
      externalDependencies: externalNodes.length,
      languages: languages.length,
      frameworks: frameworks.length
    },
    stack: {
      languages,
      frameworks
    },
    config,
    graph: {
      nodes,
      edges: [...localEdges, ...externalEdges]
    },
    topFiles,
    directoryTree,
    humanSummary: {
      size: bytesToSize(totalBytes),
      lines: fileReports.reduce((sum, file) => sum + file.codeLines, 0).toLocaleString(),
      physicalLines: totalLines.toLocaleString(),
      files: allFiles.length.toLocaleString(),
      sourceFiles: sourceFiles.length.toLocaleString(),
      edges: localEdges.length.toLocaleString(),
      dependencies: externalNodes.length.toLocaleString()
    }
  };
}

async function scanDirectory(root, ignore, include, current = ".") {
  const absolute = path.join(root, current);
  const entries = await fs.readdir(absolute, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = normalizeFilePath(path.join(current, entry.name));
    if (relative === ".") continue;
    if (ignore(relative)) continue;

    if (entry.isDirectory()) {
      if (!ignore(`${relative}/`)) {
        files.push(...await scanDirectory(root, ignore, include, relative));
      }
      continue;
    }

    if (!entry.isFile()) continue;
    if (!include(relative)) continue;

    const preview = await readPreview(path.join(root, relative));
    const isSource = !preview.binary && isProbablySource(relative, preview.content);
    files.push({
      relative,
      isSource,
      binary: preview.binary
    });
  }

  return files;
}

async function readPreview(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    if (buffer.includes(0)) {
      return { content: "", binary: true };
    }
    return {
      content: buffer.toString("utf8").slice(0, 8192),
      binary: false
    };
  } catch {
    return { content: "", binary: true };
  }
}

function selectFiles(files, maxFiles) {
  return files
    .sort((a, b) => scoreRelativePath(b) - scoreRelativePath(a) || a.localeCompare(b))
    .slice(0, maxFiles)
    .sort((a, b) => a.localeCompare(b));
}

function scoreRelativePath(relativePathValue) {
  const normalized = normalizeFilePath(relativePathValue);
  let score = 0;
  if (/^(src|lib|app|pages|components|routes|services|controllers|models|handlers)\//.test(normalized)) score += 50;
  if (/\.(js|jsx|ts|tsx|dart|py|go|rs|java|cs|php|rb)$/.test(normalized)) score += 20;
  if (/^(package\.json|pyproject\.toml|pubspec\.yaml|Cargo\.toml|go\.mod|pom\.xml|build\.gradle)$/.test(normalized)) score += 30;
  if (/test|spec|fixture|mock/i.test(normalized)) score -= 20;
  return score;
}

async function readFileReport(root, relative) {
  const absolute = path.join(root, relative);
  const [buffer, stat] = await Promise.all([
    fs.readFile(absolute),
    fs.stat(absolute)
  ]);
  const content = buffer.toString("utf8");
  const lineMetrics = countLineMetrics(content, detectLanguage(relative, content));
  const language = lineMetrics.language;
  const imports = extractImports(content, language).slice(0, IMPORT_LIMIT_PER_FILE);
  const exports = extractSymbols(content, language);
  const loc = Math.max(0, lineMetrics.codeLines);
  const score = loc * 2 + imports.length * 12 + exports.length * 18 + (isConfigFile(relative) ? 40 : 0);

  return {
    id: relative,
    path: relative,
    name: path.posix.basename(relative),
    language,
    lines: lineMetrics.lines,
    codeLines: lineMetrics.codeLines,
    loc,
    blankLines: lineMetrics.blankLines,
    commentLines: lineMetrics.commentLines,
    bytes: stat.size,
    imports,
    exports,
    score,
    external: false
  };
}

function countLineMetrics(content, language) {
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const physicalLines = normalized.length === 0 ? 0 : normalized.split("\n").length - (normalized.endsWith("\n") ? 1 : 0);
  const lines = physicalLines === 0 ? [] : normalized.slice(0, normalized.endsWith("\n") ? -1 : undefined).split("\n");
  let blankLines = 0;
  let commentLines = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      blankLines += 1;
      continue;
    }
    if (isCommentLine(trimmed, language)) {
      commentLines += 1;
    }
  }

  return {
    lines: physicalLines,
    blankLines,
    commentLines,
    codeLines: Math.max(0, physicalLines - blankLines - commentLines),
    language
  };
}

function isYamlCommentLine(trimmedLine) {
  let quote = null;
  for (let index = 0; index < trimmedLine.length; index += 1) {
    const char = trimmedLine[index];
    const previous = trimmedLine[index - 1];
    if ((char === "'" || char === '"') && previous !== "\\") {
      quote = quote === char ? null : (quote || char);
      continue;
    }
    if (char === "#" && !quote) return true;
  }
  return false;
}

function isCommentLine(trimmedLine, language) {
  if (language === "JavaScript" || language === "TypeScript" || language === "Vue" || language === "Svelte" || language === "Dart") {
    return trimmedLine.startsWith("//") || trimmedLine.startsWith("/*") || trimmedLine.startsWith("*") || trimmedLine.endsWith("*/");
  }
  if (language === "Python" || language === "Ruby" || language === "Shell" || language === "PowerShell" || language === "TOML" || language === "Dockerfile" || language === "Terraform") {
    return trimmedLine.startsWith("#");
  }
  if (language === "YAML") {
    return isYamlCommentLine(trimmedLine);
  }
  if (language === "Go" || language === "Rust" || language === "Java" || language === "C#" || language === "Kotlin" || language === "Scala" || language === "C" || language === "C++" || language === "C/C++ Header" || language === "Swift") {
    return trimmedLine.startsWith("//") || trimmedLine.startsWith("/*") || trimmedLine.startsWith("*") || trimmedLine.endsWith("*/");
  }
  if (language === "PHP") {
    return trimmedLine.startsWith("//") || trimmedLine.startsWith("#") || trimmedLine.startsWith("/*") || trimmedLine.startsWith("*") || trimmedLine.endsWith("*/");
  }
  if (language === "CSS" || language === "SCSS" || language === "Sass" || language === "Less") {
    return trimmedLine.startsWith("/*") || trimmedLine.startsWith("*") || trimmedLine.endsWith("*/");
  }
  if (language === "SQL") {
    return trimmedLine.startsWith("--") || trimmedLine.startsWith("/*") || trimmedLine.startsWith("*") || trimmedLine.endsWith("*/");
  }
  if (language === "HTML" || language === "Markdown") {
    return trimmedLine.startsWith("<!--") || trimmedLine.startsWith("-->") || trimmedLine.includes("<!--") && trimmedLine.includes("-->");
  }
  if (language === "Lua") {
    return trimmedLine.startsWith("--");
  }
  return false;
}

function buildModuleIndex(fileReports) {
  const index = new Map();
  for (const file of fileReports) {
    const normalized = normalizeFilePath(file.path);
    const withoutExtension = stripExtension(normalized);
    index.set(normalized, normalized);
    index.set(withoutExtension, normalized);
    index.set(`${withoutExtension}/index`, normalized);
    index.set(`${withoutExtension}/index.tsx`, normalized);
    index.set(`${withoutExtension}/index.ts`, normalized);
    index.set(`${withoutExtension}/index.js`, normalized);
    index.set(`${withoutExtension}/index.jsx`, normalized);
    if (file.language === "Go") {
      const directory = withoutExtension.includes("/") ? withoutExtension.slice(0, withoutExtension.lastIndexOf("/")) : "";
      if (directory && !index.has(directory)) index.set(directory, normalized);
    }
    for (const ext of DART_EXTENSIONS) index.set(`${withoutExtension}${ext}`, normalized);
  }
  return index;
}

function resolveImport(root, importer, specifier, language, moduleIndex, goModulePrefix) {
  const clean = stripQueryHash(specifier);
  if (!clean) return null;

  if (language === "JavaScript" || language === "TypeScript" || language === "Vue" || language === "Svelte") {
    if (!clean.startsWith(".")) return null;
    const base = path.resolve(root, path.dirname(importer), clean);
    const candidates = [];
    const extension = path.extname(base);
    if (extension) {
      candidates.push(base);
    } else {
      for (const ext of [...JS_EXTENSIONS, ...CSS_EXTENSIONS]) candidates.push(`${base}${ext}`);
      for (const ext of [...JS_EXTENSIONS, ...CSS_EXTENSIONS]) candidates.push(path.join(base, `index${ext}`));
    }
    for (const candidate of candidates) {
      const relative = normalizeFilePath(path.relative(root, candidate));
      if (moduleIndex.has(relative)) return moduleIndex.get(relative);
      const without = stripExtension(relative);
      if (moduleIndex.has(without)) return moduleIndex.get(without);
    }
    return null;
  }

  if (language === "Dart") {
    if (clean.startsWith(".")) {
      const base = path.resolve(root, path.dirname(importer), clean);
      const candidates = [];
      const extension = path.extname(base);
      if (extension) {
        candidates.push(base);
      } else {
        for (const ext of DART_EXTENSIONS) candidates.push(`${base}${ext}`);
      }
      for (const candidate of candidates) {
        const relative = normalizeFilePath(path.relative(root, candidate));
        if (moduleIndex.has(relative)) return moduleIndex.get(relative);
        const without = stripExtension(relative);
        if (moduleIndex.has(without)) return moduleIndex.get(without);
      }
      return null;
    }

    if (clean.startsWith("package:")) {
      const packagePath = clean.slice("package:".length);
      const [, ...relativeParts] = packagePath.split("/");
      return resolveDartModule(moduleIndex, path.posix.join("lib", ...relativeParts));
    }
    return null;
  }

  if (language === "Python") {
    if (clean.startsWith(".")) {
      const dotCount = clean.match(/^\.+/)[0].length;
      const rest = clean.slice(dotCount).split(".").filter(Boolean);
      let directory = path.posix.dirname(importer);
      for (let index = 1; index < dotCount; index += 1) directory = path.posix.dirname(directory);
      const relative = path.posix.join(directory, ...rest);
      return resolvePythonModule(moduleIndex, relative);
    }
    return resolvePythonModule(moduleIndex, clean.replaceAll(".", "/"));
  }

  if (language === "Rust") {
    if (clean.startsWith("crate::") || clean.startsWith("self::") || clean.startsWith("super::")) {
      const parts = clean.replace(/^(crate|self)::/, "").replace(/^super::/, "").split("::").filter(Boolean);
      const directory = clean.startsWith("super::") ? path.posix.dirname(importer) : (clean.startsWith("crate::") ? "" : path.posix.dirname(importer));
      const relative = directory ? path.posix.join(directory, ...parts) : path.posix.join(...parts);
      return resolveRustModule(moduleIndex, relative);
    }
    return null;
  }

  if (language === "Go") {
    let suffix = "";
    if (clean.startsWith(".")) {
      suffix = clean.replace(/^\.\//, "");
    } else if (goModulePrefix && clean.startsWith(`${goModulePrefix}/`)) {
      suffix = clean.slice(goModulePrefix.length + 1);
    } else {
      return null;
    }
    const normalizedSuffix = suffix.replaceAll(".", "/");
    return moduleIndex.get(normalizeFilePath(normalizedSuffix))
      || moduleIndex.get(`${normalizeFilePath(normalizedSuffix)}.go`)
      || moduleIndex.get(`${normalizeFilePath(normalizedSuffix)}/${path.posix.basename(normalizeFilePath(normalizedSuffix))}.go`)
      || moduleIndex.get(`${normalizeFilePath(normalizedSuffix)}/pkg.go`)
      || null;
  }

  return null;
}

function resolvePythonModule(moduleIndex, relative) {
  const normalized = normalizeFilePath(relative);
  return moduleIndex.get(`${normalized}.py`) || moduleIndex.get(`${normalized}/__init__.py`) || null;
}

function resolveRustModule(moduleIndex, relative) {
  const normalized = normalizeFilePath(relative);
  return moduleIndex.get(`${normalized}.rs`) || moduleIndex.get(`${normalized}/mod.rs`) || null;
}

function resolveDartModule(moduleIndex, relative) {
  const normalized = normalizeFilePath(relative);
  const withExtension = normalized.endsWith(".dart") ? normalized : `${normalized}.dart`;
  return moduleIndex.get(withExtension) || moduleIndex.get(stripExtension(withExtension)) || null;
}

function resolveExternalDependency(specifier, language, goModulePrefix) {
  const clean = stripQueryHash(specifier);
  if (!clean || clean.startsWith(".")) return null;

  if (language === "JavaScript" || language === "TypeScript" || language === "Vue" || language === "Svelte") {
    if (clean.startsWith("@")) {
      const parts = clean.split("/");
      return parts.slice(0, 2).join("/");
    }
    return clean.split("/")[0];
  }

  if (language === "Dart") {
    if (clean.startsWith("package:")) return clean.slice("package:".length).split("/")[0];
    if (clean.startsWith("dart:")) return null;
    return clean.split("/")[0];
  }

  if (language === "Python") return clean.split(".")[0];
  if (language === "Go") {
    if (goModulePrefix && clean.startsWith(`${goModulePrefix}/`)) return null;
    return clean.split("/")[0];
  }
  if (language === "Rust") return clean.split("::")[0];
  if (language === "Java" || language === "Kotlin" || language === "Scala") {
    if (isStandardJvmNamespace(clean)) return null;
    return clean.split(".")[0];
  }
  if (language === "C#") {
    if (isStandardCSharpNamespace(clean)) return null;
    return clean.split(".")[0];
  }
  if (language === "Ruby") return clean.split("/")[0];
  if (language === "PHP") return clean.split("\\")[0];
  return clean.split(/[/:]/)[0];
}

function isStandardJvmNamespace(value) {
  return /^(java\.|javax\.|sun\.|com\.sun\.|org\.w3c\.|org\.xml\.|kotlin\.|scala\.)/.test(value);
}

function isStandardCSharpNamespace(value) {
  return /^(System\.|Microsoft\.|Mono\.|Windows\.|System\.Windows\.)/.test(value);
}

function extractImports(content, language) {
  const specs = new Set();
  const add = (specifier) => {
    const clean = stripQueryHash(specifier).trim();
    if (clean && !clean.startsWith("node:") && !clean.startsWith("builtin:")) specs.add(clean);
  };

  if (language === "JavaScript" || language === "TypeScript" || language === "Vue" || language === "Svelte") {
    const importRegex = /\bimport\s+(?:type\s+)?[\s\S]*?\s+from\s*['"]([^'"]+)['"]/g;
    const sideEffectRegex = /\bimport\s*['"]([^'"]+)['"]/g;
    const dynamicRegex = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
    const requireRegex = /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g;
    const exportRegex = /\bexport\s+[\s\S]*?\s+from\s*['"]([^'"]+)['"]/g;
    for (const regex of [importRegex, sideEffectRegex, dynamicRegex, requireRegex, exportRegex]) {
      let match;
      while ((match = regex.exec(content)) !== null) add(match[1]);
    }
  }

  if (language === "Dart") {
    const regexes = [
      /^\s*import\s+['"]([^'"]+)['"]/gm,
      /^\s*export\s+['"]([^'"]+)['"]/gm,
      /^\s*part\s+['"]([^'"]+)['"]/gm
    ];
    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(content)) !== null) add(match[1]);
    }
  }

  if (language === "Python") {
    const fromRegex = /^\s*from\s+([\w.]+)\s+import\b/gm;
    const importRegex = /^\s*import\s+([\w.\s,]+)(?:\s+as\s+\w+)?/gm;
    let match;
    while ((match = fromRegex.exec(content)) !== null) add(match[1]);
    while ((match = importRegex.exec(content)) !== null) {
      match[1].split(",").map((item) => item.trim().split(/\s+as\s+/i)[0]).forEach(add);
    }
  }

  if (language === "Go") {
    const blockRegex = /import\s*\(([\s\S]*?)\)/g;
    const singleRegex = /import\s+"([^"]+)"/g;
    let match;
    while ((match = blockRegex.exec(content)) !== null) match[1].split(/\n/g).forEach((line) => add(line.replace(/\/\*.*\*\//g, "").trim().replace(/^"|"$/g, "")));
    while ((match = singleRegex.exec(content)) !== null) add(match[1]);
  }

  if (language === "Rust") {
    const useRegex = /\buse\s+([^;]+);/g;
    const modRegex = /\bmod\s+([A-Za-z_]\w*);/g;
    let match;
    while ((match = useRegex.exec(content)) !== null) add(match[1]);
    while ((match = modRegex.exec(content)) !== null) add(`self::${match[1]}`);
  }

  if (language === "Java" || language === "Kotlin" || language === "Scala") {
    const regex = /^\s*import\s+([^;]+);/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  if (language === "C#") {
    const regex = /^\s*using\s+([^;]+);/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  if (language === "PHP") {
    const regex = /^\s*use\s+([^;]+);/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  if (language === "Ruby") {
    const requireRegex = /^\s*require\s+['"]([^'"]+)['"]/gm;
    const relativeRegex = /^\s*require_relative\s+['"]([^'"]+)['"]/gm;
    let match;
    while ((match = requireRegex.exec(content)) !== null) add(match[1]);
    while ((match = relativeRegex.exec(content)) !== null) add(match[1]);
  }

  return [...specs].slice(0, IMPORT_LIMIT_PER_FILE);
}

function extractSymbols(content, language) {
  const symbols = new Set();
  const add = (name) => {
    if (name && /^[A-Za-z_$][\w$.-]*$/.test(name)) symbols.add(name);
  };

  if (language === "JavaScript" || language === "TypeScript" || language === "Vue" || language === "Svelte") {
    const regexes = [
      /\bexport\s+(?:declare\s+)?(?:async\s+)?function\s+([A-Za-z_$]\w*)/g,
      /\bexport\s+(?:declare\s+)?(?:const|let|var|class|interface|enum|type)\s+([A-Za-z_$]\w*)/g,
      /\bexport\s+default\s+(?:async\s+)?function\s+([A-Za-z_$]\w*)/g,
      /\bexport\s+default\s+class\s+([A-Za-z_$]\w*)/g,
      /\bexport\s+default\s+([A-Za-z_$]\w*)/g,
      /\bexport\s*\{([^}]+)\}/g
    ];
    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1] && ["function", "class"].includes(match[1])) continue;
        if (regex.source.includes("export\\s*\\{")) {
          match[1].split(",").forEach((item) => {
            const cleaned = item.trim().replace(/^type\s+/, "");
            const name = cleaned.split(/\s+as\s+/i)[1] || cleaned.split(/\s+/)[0];
            add(name);
          });
        } else {
          add(match[1]);
        }
      }
    }
  }

  if (language === "Dart") {
    const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      const classMatch = trimmed.match(/^\s*(?:abstract\s+)?(?:class|enum|extension|mixin|typedef)\s+([A-Za-z_]\w*)/);
      if (classMatch) {
        add(classMatch[1]);
        continue;
      }
      if (!line.startsWith(" ") && !line.startsWith("\t")) {
        const functionMatch = trimmed.match(/^(?:async\s+)?(?:[\w<>, ?]+\s+)?([A-Za-z_]\w*)\s*\([^;]*\)\s*(?:async|=>|\{)?/);
        if (functionMatch && !["if", "for", "while", "switch", "catch", "return"].includes(functionMatch[1])) {
          add(functionMatch[1]);
        }
      }
    }
  }

  if (language === "Python") {
    const regex = /^\s*(?:async\s+)?(?:def|class)\s+([A-Za-z_]\w*)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  if (language === "Go") {
    const regex = /^\s*(?:func|type)\s+([A-Za-z_]\w*)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  if (language === "Rust") {
    const regex = /^\s*(?:pub\s+)?(?:fn|struct|enum|trait|mod)\s+([A-Za-z_]\w*)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  if (language === "Java" || language === "Kotlin" || language === "Scala" || language === "C#") {
    const regex = /^\s*(?:public\s+|private\s+|protected\s+)?(?:class|interface|enum|record|struct)\s+([A-Za-z_]\w*)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) add(match[1]);
  }

  return [...symbols].sort().slice(0, 80);
}

async function readGitignorePatterns(root) {
  const defaultIgnore = createMatcher(DEFAULT_IGNORE_PATTERNS);
  const patterns = [];

  async function visit(current = ".") {
    const absolute = path.join(root, current);
    let entries;
    try {
      entries = await fs.readdir(absolute, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const relative = normalizeFilePath(path.join(current, entry.name));
      if (relative === "." || defaultIgnore(relative)) continue;

      if (entry.isDirectory()) {
        if (!defaultIgnore(`${relative}/`)) await visit(relative);
        continue;
      }

      if (entry.isFile() && entry.name === ".gitignore") {
        patterns.push(...await readGitignoreFile(path.join(absolute, entry.name), root, current));
      }
    }
  }

  await visit();
  return patterns;
}

async function readGitignoreFile(filePath, root, gitignoreDirectory) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const absoluteGitignoreDirectory = gitignoreDirectory === "." ? root : path.join(root, gitignoreDirectory);
    const baseDirectory = gitignoreDirectory === "." ? "." : normalizeFilePath(path.relative(root, absoluteGitignoreDirectory));
    return content
      .split(/\r?\n/)
      .map((line) => normalizeGitignorePattern(line.trim(), baseDirectory));
  } catch {
    return [];
  }
}

function normalizeGitignorePattern(line, baseDirectory) {
  if (!line || line.startsWith("#")) return line;
  const negated = line.startsWith("!");
  const pattern = negated ? line.slice(1) : line;
  if (pattern.startsWith("/")) return line;
  if (!pattern.includes("/")) return line;
  const prefix = baseDirectory && baseDirectory !== "." ? `${baseDirectory}/` : "";
  return `${negated ? "!" : ""}${prefix}${pattern}`;
}

async function readGoModulePrefix(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const match = content.match(/^\s*module\s+(.+)$/m);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

async function readConfig(root, relativeFiles) {
  const config = {
    packageJson: null,
    pyproject: null,
    requirements: [],
    pubspec: null,
    cargoToml: null,
    goMod: null,
    gradle: null,
    composer: null,
    gemfile: null,
    files: relativeFiles.filter((file) => isConfigFile(file))
  };

  const packageJsonPath = path.join(root, "package.json");
  try {
    config.packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));
  } catch {
    config.packageJson = null;
  }

  const pyprojectPath = path.join(root, "pyproject.toml");
  try {
    config.pyproject = await fs.readFile(pyprojectPath, "utf8");
  } catch {
    config.pyproject = "";
  }

  const requirementsPath = path.join(root, "requirements.txt");
  try {
    config.requirements = (await fs.readFile(requirementsPath, "utf8"))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && !line.startsWith("-"));
  } catch {
    config.requirements = [];
  }

  const pubspecPath = path.join(root, "pubspec.yaml");
  try {
    config.pubspec = await fs.readFile(pubspecPath, "utf8");
  } catch {
    config.pubspec = "";
  }

  const cargoPath = path.join(root, "Cargo.toml");
  try {
    config.cargoToml = await fs.readFile(cargoPath, "utf8");
  } catch {
    config.cargoToml = "";
  }

  const goPath = path.join(root, "go.mod");
  try {
    config.goMod = await fs.readFile(goPath, "utf8");
  } catch {
    config.goMod = "";
  }

  const gradlePath = path.join(root, "build.gradle");
  try {
    config.gradle = await fs.readFile(gradlePath, "utf8");
  } catch {
    config.gradle = "";
  }

  return config;
}

function summarizeLanguages(fileReports) {
  const summary = new Map();
  for (const file of fileReports) {
    const current = summary.get(file.language) || {
      name: file.language,
      files: 0,
      lines: 0,
      physicalLines: 0,
      bytes: 0
    };
    current.files += 1;
    current.lines += file.codeLines;
    current.physicalLines += file.lines;
    current.bytes += file.bytes;
    summary.set(file.language, current);
  }
  return [...summary.values()]
    .sort((a, b) => b.files - a.files || b.lines - a.lines)
    .map((language) => ({
      ...language,
      percent: Math.round((language.files / Math.max(1, fileReports.length)) * 100)
    }));
}

function detectFrameworks(config, fileReports) {
  const frameworks = new Set();
  const relativeFiles = fileReports.map((file) => normalizeFilePath(file.path));
  const packageNames = new Set();
  const requirements = new Set(config.requirements.map((item) => item.toLowerCase()));

  for (const section of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    if (config.packageJson && config.packageJson[section]) {
      for (const name of Object.keys(config.packageJson[section])) packageNames.add(name);
    }
  }

  const checks = [
    (name) => packageNames.has("react") && "React",
    (name) => packageNames.has("next") && "Next.js",
    (name) => packageNames.has("vite") && "Vite",
    (name) => packageNames.has("nuxt") && "Nuxt",
    (name) => packageNames.has("svelte") && "Svelte",
    (name) => packageNames.has("vue") && "Vue",
    (name) => packageNames.has("express") && "Express",
    (name) => packageNames.has("@nestjs/core") && "NestJS",
    (name) => packageNames.has("fastify") && "Fastify",
    (name) => (config.pyproject.includes("django") || requirements.has("django")) && "Django",
    (name) => (config.pyproject.includes("flask") || requirements.has("flask")) && "Flask",
    (name) => (config.pyproject.includes("fastapi") || requirements.has("fastapi")) && "FastAPI",
    (name) => config.pubspec.includes("flutter:") && "Flutter",
    (name) => config.pubspec.includes("sdk: flutter") && "Flutter",
    (name) => relativeFiles.some((file) => file === "pubspec.yaml") && config.pubspec.includes("flutter") && "Flutter",
    (name) => relativeFiles.some((file) => /next\.config\.(js|mjs|ts)$/.test(file)) && "Next.js",
    (name) => relativeFiles.some((file) => /vite\.config\.(js|ts|mjs|mts)$/.test(file)) && "Vite",
    (name) => relativeFiles.some((file) => /tailwind\.config\.(js|ts)$/.test(file)) && "Tailwind CSS",
    (name) => config.cargoToml.includes("actix-web") && "Actix Web",
    (name) => config.cargoToml.includes("rocket") && "Rocket",
    (name) => config.goMod.includes("gin-gonic") && "Gin",
    (name) => config.goMod.includes("labstack/echo") && "Echo",
    (name) => config.gradle.includes("org.springframework.boot") && "Spring Boot"
  ];

  for (const check of checks) {
    const framework = check();
    if (framework) frameworks.add(framework);
  }

  return [...frameworks].sort();
}

function buildDirectoryTree(fileReports, limit) {
  const tree = { name: ".", type: "directory", children: new Map() };

  const getNode = (node, name, type) => {
    if (!node.children.has(name)) node.children.set(name, { name, type, children: new Map(), path: null, score: 0 });
    return node.children.get(name);
  };

  for (const file of fileReports) {
    const parts = normalizeFilePath(file.path).split("/");
    let node = tree;
    for (const part of parts) {
      const isFile = part === parts[parts.length - 1];
      node = getNode(node, part, isFile ? "file" : "directory");
      if (isFile) {
        node.path = file.path;
        node.score = file.score;
        node.language = file.language;
      } else {
        node.score += file.score;
      }
    }
  }

  const serialize = (node) => {
    const children = [...node.children.values()]
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1))
      .slice(0, 24)
      .map(serialize);
    return {
      name: node.name,
      type: node.type,
      path: node.path || null,
      language: node.language || null,
      score: node.score,
      children
    };
  };

  const serialized = serialize(tree);
  return trimTree(serialized, limit);
}

function trimTree(node, remaining) {
  if (remaining <= 0) return null;
  const children = (node.children || [])
    .map((child) => trimTree(child, remaining - 1))
    .filter(Boolean);
  return {
    ...node,
    children
  };
}

function formatMarkdown(report) {
  const lines = [];
  lines.push(`# ${escapeHtml(report.title)} Architecture Map`);
  lines.push("");
  lines.push(`Generated ${new Date(report.generatedAt).toLocaleString()}.`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Files: ${report.humanSummary.files}`);
  lines.push(`- Source files scanned: ${report.humanSummary.sourceFiles}`);
  lines.push(`- Code lines: ${report.humanSummary.lines}`);
  lines.push(`- Physical lines: ${report.humanSummary.physicalLines}`);
  lines.push(`- Blank lines: ${report.summary.totalBlankLines.toLocaleString()}`);
  lines.push(`- Comment lines: ${report.summary.totalCommentLines.toLocaleString()}`);
  lines.push(`- Size: ${report.humanSummary.size}`);
  lines.push(`- Local edges: ${report.humanSummary.edges}`);
  lines.push(`- External dependencies: ${report.humanSummary.dependencies}`);
  lines.push("");
  lines.push("## Stack");
  lines.push("");
  if (report.stack.frameworks.length) {
    lines.push(`Frameworks: ${report.stack.frameworks.join(", ")}`);
  } else {
    lines.push("Frameworks: not detected");
  }
  lines.push("");
  lines.push("| Language | Files | Lines | Share |");
  lines.push("| --- | ---: | ---: | ---: |");
  for (const language of report.stack.languages) {
    lines.push(`| ${escapeHtml(language.name)} | ${language.files} | ${language.lines.toLocaleString()} | ${language.percent}% |`);
  }
  lines.push("");
  lines.push("## Top Files");
  lines.push("");
  lines.push("| File | Language | LOC | Exports |");
  lines.push("| --- | --- | ---: | ---: |");
  for (const file of report.topFiles) {
    lines.push(`| ${escapeHtml(file.path)} | ${escapeHtml(file.language)} | ${file.loc} | ${file.exports.length} |`);
  }
  lines.push("");
  lines.push("## Dependency Graph");
  lines.push("");
  lines.push("```mermaid");
  lines.push("graph TD");
  const edges = report.graph.edges.slice(0, 120);
  const ids = new Map();
  let id = 0;
  const mermaidId = (value) => {
    if (!ids.has(value)) ids.set(value, `N${id += 1}`);
    return ids.get(value);
  };
  for (const edge of edges) {
    lines.push(`  ${mermaidId(edge.source)}[${escapeMermaid(edge.source)}] --> ${mermaidId(edge.target)}[${escapeMermaid(edge.target)}]`);
  }
  lines.push("```");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function escapeMermaid(value) {
  return String(value).replace(/[\[\]\(\)]/g, "_");
}

module.exports = {
  analyzeProject,
  buildDirectoryTree,
  countLineMetrics,
  detectFrameworks,
  extractImports,
  extractSymbols,
  formatMarkdown,
  resolveExternalDependency,
  resolveImport,
  summarizeLanguages
};
