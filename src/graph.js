/**
 * Pure graph utilities used for structural diagnostics.
 * Currently provides bounded circular-dependency detection via Tarjan SCC.
 */

const MAX_CYCLE_NODES = 1200;

function normalizeNode(value) {
  if (typeof value === "string") return { id: value, external: false };
  return value && typeof value === "object" ? value : null;
}

/**
 * Finds strongly connected components (cycles) in the local dependency graph.
 * External dependency nodes are excluded since they are always sinks.
 * Returns an array of { id, nodes: [ids...] } ordered along the cycle,
 * largest first, capped at `limit`.
 */
function computeCycles(nodes, edges, limit = 8) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return [];
  if (nodes.length > MAX_CYCLE_NODES) return [];

  const localIds = new Set(
    nodes
      .map(normalizeNode)
      .filter((node) => node && node.id && !node.external)
      .map((node) => node.id)
  );
  if (!localIds.size) return [];

  const adjacency = new Map();
  for (const id of localIds) adjacency.set(id, []);
  const selfLoops = [];

  for (const edge of edges) {
    if (!edge || !localIds.has(edge.source) || !localIds.has(edge.target)) continue;
    if (edge.source === edge.target) {
      if (!selfLoops.includes(edge.source)) selfLoops.push(edge.source);
      continue;
    }
    adjacency.get(edge.source).push(edge.target);
  }

  let cursor = 0;
  const stack = [];
  const onStack = new Set();
  const indices = new Map();
  const lowLinks = new Map();
  const components = [];

  function strongconnect(startId) {
    const work = [{ id: startId, neighbors: adjacency.get(startId) || [], index: 0 }];
    indices.set(startId, cursor);
    lowLinks.set(startId, cursor);
    cursor += 1;
    stack.push(startId);
    onStack.add(startId);

    while (work.length) {
      const frame = work[work.length - 1];
      if (frame.index < frame.neighbors.length) {
        const neighbor = frame.neighbors[frame.index++];
        if (!indices.has(neighbor)) {
          indices.set(neighbor, cursor);
          lowLinks.set(neighbor, cursor);
          cursor += 1;
          stack.push(neighbor);
          onStack.add(neighbor);
          work.push({ id: neighbor, neighbors: adjacency.get(neighbor) || [], index: 0 });
        } else if (onStack.has(neighbor)) {
          lowLinks.set(frame.id, Math.min(lowLinks.get(frame.id), indices.get(neighbor)));
        }
      } else {
        if (lowLinks.get(frame.id) === indices.get(frame.id)) {
          const component = [];
          let popped;
          do {
            popped = stack.pop();
            onStack.delete(popped);
            component.push(popped);
          } while (popped !== frame.id);
          if (component.length > 1) components.push(orderCycle(component, adjacency));
        }
        work.pop();
        if (work.length) {
          const parent = work[work.length - 1];
          lowLinks.set(parent.id, Math.min(lowLinks.get(parent.id), lowLinks.get(frame.id)));
        }
      }
    }
  }

  for (const id of localIds) {
    if (!indices.has(id)) strongconnect(id);
  }

  const cycles = components
    .map((component, index) => ({ id: `cycle-${index}`, nodes: component }))
    .concat(selfLoops.map((id, index) => ({ id: `self-${index}`, nodes: [id] })))
    .sort((a, b) => b.nodes.length - a.nodes.length || String(a.nodes[0]).localeCompare(String(b.nodes[0])))
    .slice(0, Math.max(0, limit));

  cycles.forEach((cycle, index) => {
    cycle.id = `cycle-${index}`;
  });
  return cycles;
}

function orderCycle(component, adjacency) {
  const start = [...component].sort()[0];
  const remaining = new Set(component);
  const ordered = [];
  let current = start;

  while (ordered.length < component.length) {
    remaining.delete(current);
    ordered.push(current);
    const next = (adjacency.get(current) || []).find((neighbor) => remaining.has(neighbor));
    if (!next) {
      const leftovers = [...remaining].sort();
      ordered.push(...leftovers);
      break;
    }
    current = next;
  }

  return ordered;
}

module.exports = {
  computeCycles
};
