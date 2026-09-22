const test = require("node:test");
const assert = require("node:assert/strict");
const { computeCycles } = require("../src/graph");

const local = (id) => ({ id, path: id, external: false });

test("detects a simple two-node cycle and orders it", () => {
  const nodes = [local("a"), local("b"), local("c")];
  const edges = [
    { source: "a", target: "b" },
    { source: "b", target: "a" },
    { source: "c", target: "a" }
  ];
  const cycles = computeCycles(nodes, edges);
  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0].nodes, ["a", "b"]);
});

test("detects a longer cycle and starts from the smallest id", () => {
  const nodes = [local("a"), local("b"), local("c"), local("d")];
  const edges = [
    { source: "a", target: "c" },
    { source: "c", target: "b" },
    { source: "b", target: "d" },
    { source: "d", target: "a" }
  ];
  const cycles = computeCycles(nodes, edges);
  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0].nodes, ["a", "c", "b", "d"]);
});

test("detects self loops", () => {
  const nodes = [local("a"), local("b")];
  const edges = [{ source: "a", target: "b" }, { source: "b", target: "b" }];
  const cycles = computeCycles(nodes, edges);
  assert.equal(cycles.length, 1);
  assert.deepEqual(cycles[0].nodes, ["b"]);
});

test("reports no cycles for a directed acyclic graph", () => {
  const nodes = [local("a"), local("b"), local("c")];
  const edges = [{ source: "a", target: "b" }, { source: "b", target: "c" }];
  assert.deepEqual(computeCycles(nodes, edges), []);
});

test("excludes external dependency nodes from cycle detection", () => {
  const nodes = [local("a"), local("b"), { id: "leftpad", external: true }];
  const edges = [
    { source: "a", target: "b" },
    { source: "b", target: "a" },
    { source: "a", target: "leftpad", kind: "external" }
  ];
  const cycles = computeCycles(nodes, edges);
  assert.equal(cycles.length, 1);
  assert.ok(!cycles[0].nodes.includes("leftpad"));
});

test("respects the limit and returns the largest cycles first", () => {
  const nodes = ["a", "b", "c", "d", "e", "f"].map(local);
  const edges = [
    { source: "a", target: "b" },
    { source: "b", target: "a" },
    { source: "c", target: "d" },
    { source: "d", target: "e" },
    { source: "e", target: "c" }
  ];
  const cycles = computeCycles(nodes, edges, 1);
  assert.equal(cycles.length, 1);
  assert.equal(cycles[0].nodes.length, 3);
});

test("handles string node ids and malformed input", () => {
  assert.deepEqual(computeCycles(["a", "b"], [{ source: "a", target: "b" }]), []);
  assert.deepEqual(computeCycles(null, []), []);
  assert.deepEqual(computeCycles([], null), []);
});
