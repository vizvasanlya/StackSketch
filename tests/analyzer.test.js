const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { analyzeProject, countLineMetrics, extractImports, extractSymbols, resolveExternalDependency, resolveImport } = require("../src/analyzer");

test("extracts JavaScript imports and exports", () => {
  const content = `
    import React from 'react';
    import type { User } from './types';
    import './style.css';
    export const hello = () => 'world';
    export async function load() {}
    export { helper, main as run, type User as UserModel };
    export default function App() {}
    class PrivateComponent {}
  `;
  assert.deepEqual(extractImports(content, "JavaScript"), ["react", "./types", "./style.css"]);
  assert.deepEqual(extractSymbols(content, "JavaScript"), ["App", "UserModel", "hello", "helper", "load", "run"]);
});

test("does not treat JVM and C# standard namespaces as external dependencies", () => {
  assert.equal(resolveExternalDependency("java.util.List", "Java", ""), null);
  assert.equal(resolveExternalDependency("kotlin.collections.List", "Kotlin", ""), null);
  assert.equal(resolveExternalDependency("scala.collection.Seq", "Scala", ""), null);
  assert.equal(resolveExternalDependency("System.Collections.Generic", "C#", ""), null);
});

test("counts code, blank, and comment lines without counting final newlines twice", () => {
  const metrics = countLineMetrics("const a = 1;\n// comment\n\nfunction run() {\n}\n", "JavaScript");
  assert.equal(metrics.lines, 5);
  assert.equal(metrics.codeLines, 3);
  assert.equal(metrics.blankLines, 1);
  assert.equal(metrics.commentLines, 1);
});

test("extracts Dart imports and exports", () => {
  const content = `
    import 'package:flutter/material.dart';
    import 'package:my_app/src/counter.dart';
    import './local_widget.dart';
    export './exports.dart';

    class CounterCubit extends Cubit<int> {}
void increment() {}
  `;
  assert.deepEqual(extractImports(content, "Dart"), [
    "package:flutter/material.dart",
    "package:my_app/src/counter.dart",
    "./local_widget.dart",
    "./exports.dart"
  ]);
  assert.ok(extractSymbols(content, "Dart").includes("CounterCubit"));
  assert.ok(extractSymbols(content, "Dart").includes("increment"));
});

test("resolves Dart package imports to lib files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-dart-"));
  await fs.mkdir(path.join(root, "lib", "src"), { recursive: true });
  await fs.writeFile(path.join(root, "lib", "src", "counter.dart"), "class CounterCubit {}");
  const moduleIndex = new Map([["lib/src/counter.dart", "lib/src/counter.dart"]]);
  assert.equal(
    resolveImport(root, "lib/main.dart", "package:my_app/src/counter.dart", "Dart", moduleIndex, ""),
    "lib/src/counter.dart"
  );
});
test("resolves local TypeScript imports to indexed files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-test-"));
  await fs.mkdir(path.join(root, "src", "components", "button"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "components", "button", "index.ts"), "export const Button = () => null;");
  const moduleIndex = new Map([["src/components/button/index.ts", "src/components/button/index.ts"]]);
  assert.equal(
    resolveImport(root, "src/app.tsx", "./components/button", "TypeScript", moduleIndex, ""),
    "src/components/button/index.ts"
  );
});

test("resolves Go module imports to package files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-go-"));
  await fs.mkdir(path.join(root, "pkg"), { recursive: true });
  await fs.writeFile(path.join(root, "go.mod"), "module example.com/app\n");
  await fs.writeFile(path.join(root, "pkg", "foo.go"), "package pkg\n");
  await fs.writeFile(path.join(root, "main.go"), "package main\nimport \"example.com/app/pkg\"\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "main.go" && edge.target === "pkg/foo.go"));
});

test("resolves Rust crate imports from the crate root", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-rust-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "foo.rs"), "pub fn foo() {}\n");
  await fs.writeFile(path.join(root, "src", "main.rs"), "fn main() {}\n");
  const report = await analyzeProject(root, { maxFiles: 20 });
  const moduleIndex = new Map(report.graph.nodes.filter((node) => !node.external).map((node) => [node.path, node.path]));
  assert.equal(
    resolveImport(root, "src/main.rs", "crate::foo", "Rust", moduleIndex, ""),
    "foo.rs"
  );
});

test("honors gitignore negation patterns", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-gitignore-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, ".gitignore"), "src/*\n!src/keep.js\n");
  await fs.writeFile(path.join(root, "src", "keep.js"), "const keep = true;\n");
  await fs.writeFile(path.join(root, "src", "skip.js"), "const skip = true;\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.equal(report.summary.scannedFiles, 1);
  assert.equal(report.graph.nodes[0].path, "src/keep.js");
});

test("honors nested gitignore patterns", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-nested-gitignore-"));
  await fs.mkdir(path.join(root, "packages", "web", "src"), { recursive: true });
  await fs.writeFile(path.join(root, "packages", "web", ".gitignore"), "src/*\n!src/app.js\n");
  await fs.writeFile(path.join(root, "packages", "web", "src", "app.js"), "const app = true;\n");
  await fs.writeFile(path.join(root, "packages", "web", "src", "skip.js"), "const skip = true;\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.equal(report.summary.scannedFiles, 1);
  assert.equal(report.graph.nodes[0].path, "packages/web/src/app.js");
});

test("resolves local CSS imports", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-css-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "app.js"), "import './style.css';\n");
  await fs.writeFile(path.join(root, "src", "style.css"), ".app { color: red; }\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "src/app.js" && edge.target === "src/style.css"));
});

test("analyzes a small multi-language project", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-project-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: { react: "19.0.0", express: "5.0.0" } }));
  await fs.writeFile(path.join(root, "src", "app.tsx"), "import React from 'react';\nimport { helper } from './helper';\nexport const App = () => <helper />;\n");
  await fs.writeFile(path.join(root, "src", "helper.ts"), "export function helper() { return 1; }\n");
  await fs.writeFile(path.join(root, "src", "worker.py"), "from src.helper import helper\n\ndef run():\n    return helper()\n");
  await fs.mkdir(path.join(root, "node_modules"), { recursive: true });
  await fs.writeFile(path.join(root, "node_modules", "skip.js"), "export const skipped = true;\n");

  const report = await analyzeProject(root, { title: "Demo", maxFiles: 20 });

  assert.equal(report.title, "Demo");
  assert.equal(report.summary.totalFiles, 4);
  assert.equal(report.summary.sourceFiles, 4);
  assert.equal(report.summary.scannedFiles, 4);
  assert.equal(report.summary.totalCodeLines, 8);
  assert.ok(report.stack.frameworks.includes("React"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "src/app.tsx" && edge.target === "src/helper.ts"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "src/app.tsx" && edge.target === "react"));
  assert.ok(!report.graph.nodes.some((node) => node.path === "node_modules/skip.js"));
});

test("analyzes a Flutter project with Dart lib files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-flutter-"));
  await fs.mkdir(path.join(root, "lib", "src"), { recursive: true });
  await fs.writeFile(path.join(root, "pubspec.yaml"), "name: my_app\nenvironment:\n  sdk: ^3.0.0\ndependencies:\n  flutter:\n    sdk: flutter\n");
  await fs.writeFile(path.join(root, "lib", "main.dart"), "import 'package:flutter/material.dart';\nimport 'package:my_app/src/counter.dart';\nvoid main() {}\n");
  await fs.writeFile(path.join(root, "lib", "src", "counter.dart"), "class CounterCubit {}\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.equal(report.summary.sourceFiles, 3);
  assert.ok(report.stack.languages.some((language) => language.name === "Dart"));
  assert.ok(report.stack.frameworks.includes("Flutter"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "lib/main.dart" && edge.target === "lib/src/counter.dart"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "lib/main.dart" && edge.target === "flutter"));
});

test("detects Python frameworks from requirements.txt", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-python-"));
  await fs.writeFile(path.join(root, "requirements.txt"), "fastapi\nuvicorn\n");
  await fs.writeFile(path.join(root, "main.py"), "from fastapi import FastAPI\napp = FastAPI()\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.stack.frameworks.includes("FastAPI"));
});

test("reports truncation when max files is lower than source files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-maxfiles-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await Promise.all([1, 2, 3].map((index) => fs.writeFile(path.join(root, "src", `file${index}.js`), `export const value${index} = ${index};\n`)));

  const report = await analyzeProject(root, { maxFiles: 2 });

  assert.equal(report.summary.totalFiles, 3);
  assert.equal(report.summary.sourceFiles, 3);
  assert.equal(report.summary.scannedFiles, 2);
  assert.equal(report.summary.maxFilesReached, true);
});

test("resolves tsconfig path aliases to local files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-alias-"));
  await fs.mkdir(path.join(root, "src", "lib"), { recursive: true });
  await fs.writeFile(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: { baseUrl: "src", paths: { "@/*": ["./*"] } }
  }));
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ name: "demo" }));
  await fs.writeFile(path.join(root, "src", "app.tsx"), "import { helper } from '@/lib/helper';\nexport const App = () => helper();\n");
  await fs.writeFile(path.join(root, "src", "lib", "helper.ts"), "export function helper() { return 1; }\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "src/app.tsx" && edge.target === "src/lib/helper.ts"));
  assert.ok(!report.graph.nodes.some((node) => node.id === "@/lib"), "alias must not become a fake external dependency");
});

test("resolves Node subpath imports from package.json", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-subpath-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({
    imports: { "#utils": "./src/utils.js" }
  }));
  await fs.writeFile(path.join(root, "src", "main.js"), "import { x } from '#utils';\n");
  await fs.writeFile(path.join(root, "src", "utils.js"), "export const x = 1;\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "src/main.js" && edge.target === "src/utils.js"));
  assert.ok(!report.graph.nodes.some((node) => node.id === "#utils"));
});

test("extracts and resolves CSS and SCSS imports including Sass partials", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-css2-"));
  await fs.mkdir(path.join(root, "styles"), { recursive: true });
  await fs.writeFile(path.join(root, "styles", "main.scss"), "@use './theme';\n@import './reset.css';\n");
  await fs.writeFile(path.join(root, "styles", "_theme.scss"), "$color: red;\n");
  await fs.writeFile(path.join(root, "styles", "reset.css"), "body { margin: 0; }\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.deepEqual(extractImports(await fs.readFile(path.join(root, "styles", "main.scss"), "utf8"), "SCSS"), ["./theme", "./reset.css"]);
  assert.ok(report.graph.edges.some((edge) => edge.source === "styles/main.scss" && edge.target === "styles/_theme.scss"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "styles/main.scss" && edge.target === "styles/reset.css"));
});

test("resolves Java package imports to source files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-java-"));
  await fs.mkdir(path.join(root, "com", "foo"), { recursive: true });
  await fs.writeFile(path.join(root, "com", "foo", "Bar.java"), "package com.foo;\npublic class Bar {}\n");
  await fs.writeFile(path.join(root, "Main.java"), "import com.foo.Bar;\npublic class Main {}\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "Main.java" && edge.target === "com/foo/Bar.java"));
});

test("resolves C and C++ quoted includes and tracks system includes", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-cpp-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "main.cpp"), '#include "utils.h"\n#include <vector>\n');
  await fs.writeFile(path.join(root, "src", "utils.h"), "void helper();\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.deepEqual(extractImports(await fs.readFile(path.join(root, "src", "main.cpp"), "utf8"), "C++"), ["utils.h", "vector"]);
  assert.ok(report.graph.edges.some((edge) => edge.source === "src/main.cpp" && edge.target === "src/utils.h"));
  assert.ok(report.graph.nodes.some((node) => node.id === "vector" && node.external));
});

test("resolves Ruby require_relative to local files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-ruby-"));
  await fs.mkdir(path.join(root, "lib"), { recursive: true });
  await fs.writeFile(path.join(root, "lib", "app.rb"), "require_relative 'user'\nrequire 'json'\n");
  await fs.writeFile(path.join(root, "lib", "user.rb"), "class User; end\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "lib/app.rb" && edge.target === "lib/user.rb"));
  assert.ok(report.graph.nodes.some((node) => node.id === "json" && node.external));
});

test("resolves PHP namespace use statements and relative requires", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-php-"));
  await fs.mkdir(path.join(root, "app", "Models"), { recursive: true });
  await fs.writeFile(path.join(root, "index.php"), "use App\\Models\\User;\nrequire 'config.php';\n");
  await fs.writeFile(path.join(root, "app", "Models", "User.php"), "<?php class User {}\n");
  await fs.writeFile(path.join(root, "config.php"), "<?php return [];\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "index.php" && edge.target === "app/Models/User.php"));
  assert.ok(report.graph.edges.some((edge) => edge.source === "index.php" && edge.target === "config.php"));
});

test("resolves Lua require targets", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-lua-"));
  await fs.mkdir(path.join(root, "utils"), { recursive: true });
  await fs.writeFile(path.join(root, "main.lua"), "local helper = require('utils.helper')\n");
  await fs.writeFile(path.join(root, "utils", "helper.lua"), "return {}\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "main.lua" && edge.target === "utils/helper.lua"));
});

test("resolves Python src-layout package imports", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-src-"));
  await fs.mkdir(path.join(root, "src", "myapp"), { recursive: true });
  await fs.writeFile(path.join(root, "pyproject.toml"), "[project]\nname = \"myapp\"\n");
  await fs.writeFile(path.join(root, "src", "myapp", "__init__.py"), "");
  await fs.writeFile(path.join(root, "src", "myapp", "core.py"), "def run():\n    pass\n");
  await fs.writeFile(path.join(root, "src", "myapp", "main.py"), "from myapp.core import run\n\nrun()\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "src/myapp/main.py" && edge.target === "src/myapp/core.py"));
  assert.ok(!report.graph.nodes.some((node) => node.id === "myapp" && node.external), "package import must not become a fake external dependency");
});

test("resolves Python src-layout imports in nested monorepo packages", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-nested-src-"));
  await fs.mkdir(path.join(root, "packages", "api", "src", "myapp"), { recursive: true });
  await fs.writeFile(path.join(root, "packages", "api", "src", "myapp", "__init__.py"), "");
  await fs.writeFile(path.join(root, "packages", "api", "src", "myapp", "core.py"), "def run():\n    pass\n");
  await fs.writeFile(path.join(root, "packages", "api", "src", "myapp", "main.py"), "from myapp.core import run\n\nrun()\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "packages/api/src/myapp/main.py" && edge.target === "packages/api/src/myapp/core.py"));
});

test("detects Prisma, SQLAlchemy, and Celery frameworks", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-fw-"));
  await fs.mkdir(path.join(root, "prisma"), { recursive: true });
  await fs.writeFile(path.join(root, "package.json"), JSON.stringify({ dependencies: { "@prisma/client": "^5.0.0" } }));
  await fs.writeFile(path.join(root, "prisma", "schema.prisma"), "datasource db { provider = \"postgres\" }\n");
  await fs.writeFile(path.join(root, "requirements.txt"), "sqlalchemy\ncelery\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.stack.frameworks.includes("Prisma"));
  assert.ok(report.stack.frameworks.includes("SQLAlchemy"));
  assert.ok(report.stack.frameworks.includes("Celery"));
});

test("reports circular dependencies in the insights field", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-cycles-"));
  await fs.writeFile(path.join(root, "a.js"), "const b = require('./b');\n");
  await fs.writeFile(path.join(root, "b.js"), "const a = require('./a');\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.equal(report.insights.cycles.length, 1);
  assert.deepEqual(report.insights.cycles[0].nodes.sort(), ["a.js", "b.js"]);
});

test("resolves C# namespace usings to files declaring the namespace", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-csharp-"));
  await fs.mkdir(path.join(root, "Services"), { recursive: true });
  await fs.writeFile(path.join(root, "Program.cs"), "using App.Services;\nusing System;\nnamespace App;\nclass Program {}\n");
  await fs.writeFile(path.join(root, "Services", "UserService.cs"),
    "namespace App.Services;\n\npublic class UserService\n{\n    public string Name { get; set; }\n    public string Email { get; set; }\n    public bool IsActive { get; set; }\n}\n");
  await fs.writeFile(path.join(root, "Services", "OrderService.cs"), "namespace App.Services;\npublic class OrderService {}\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.deepEqual(extractImports(await fs.readFile(path.join(root, "Program.cs"), "utf8"), "C#"), ["App.Services", "System"]);
  assert.ok(report.graph.edges.some((edge) => edge.source === "Program.cs" && edge.target === "Services/UserService.cs"),
    "namespace using should resolve to the primary file declaring the namespace");
  assert.ok(!report.graph.nodes.some((node) => node.id === "System" && node.external), "System must not become an external dependency");
});

test("resolves C# using static to type files", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-csharp-static-"));
  await fs.mkdir(path.join(root, "App", "Utils"), { recursive: true });
  await fs.writeFile(path.join(root, "Program.cs"), "using static App.Utils.Helper;\nnamespace App;\nclass Program {}\n");
  await fs.writeFile(path.join(root, "App", "Utils", "Helper.cs"), "namespace App.Utils;\npublic static class Helper {}\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.ok(report.graph.edges.some((edge) => edge.source === "Program.cs" && edge.target === "App/Utils/Helper.cs"));
});

test("resolves Swift module imports and skips Apple SDK modules", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "stacksketch-swift-"));
  await fs.mkdir(path.join(root, "Sources", "Analytics"), { recursive: true });
  await fs.writeFile(path.join(root, "Sources", "App.swift"), "import Foundation\nimport Analytics\n@testable import Models\nstruct App {}\n");
  await fs.writeFile(path.join(root, "Sources", "Analytics", "Tracker.swift"), "public struct Tracker {}\n");
  await fs.mkdir(path.join(root, "Sources", "Models"), { recursive: true });
  await fs.writeFile(path.join(root, "Sources", "Models", "Models.swift"), "public struct Model {}\n");

  const report = await analyzeProject(root, { maxFiles: 20 });

  assert.deepEqual(extractImports(await fs.readFile(path.join(root, "Sources", "App.swift"), "utf8"), "Swift").sort(), ["Analytics", "Foundation", "Models"]);
  assert.ok(report.graph.edges.some((edge) => edge.source === "Sources/App.swift" && edge.target === "Sources/Analytics/Tracker.swift"),
    "module import should resolve to the primary file in the module directory");
  assert.ok(report.graph.edges.some((edge) => edge.source === "Sources/App.swift" && edge.target === "Sources/Models/Models.swift"),
    "module import should resolve to the module-named file when present");
  assert.ok(!report.graph.nodes.some((node) => node.id === "Foundation" && node.external), "Foundation must not become an external dependency");
});
