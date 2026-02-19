import { LayoutStrategy, ProblemInput, ComputedNode } from "@zahash/leetcode-tracker.core";

interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  gapX: number;
  gapY: number;
}

/**
 * A robust Layered Graph Drawing Algorithm (Sugiyama-style simplified).
 * Places nodes in vertical levels based on dependency depth.
 */
export class LayeredLayout implements LayoutStrategy {
  private config: LayoutConfig;

  constructor(partialConfig: Partial<LayoutConfig> = {}) {
    const defaults: LayoutConfig = {
      nodeWidth: 240,
      nodeHeight: 100,
      gapX: 30,
      gapY: 80,
    };
    this.config = { ...defaults, ...partialConfig };
  }

  calculate(problems: ProblemInput[], width: number) {
    const { nodeWidth, gapX, gapY } = this.config;

    // 1. Grid Calculation
    let cols = Math.floor((width - 40) / (nodeWidth + gapX));
    if (cols < 1) cols = 1;

    // 2. Build Dependency Map & Calculate Depth
    const depthMap = new Map<string, number>();
    const getDepth = (id: string, visited = new Set<string>()): number => {
      if (depthMap.has(id)) return depthMap.get(id)!;
      if (visited.has(id)) return 0; // Cycle breaking
      visited.add(id);

      const prob = problems.find(p => p.id === id);
      if (!prob || !prob.prereqs?.length) {
        depthMap.set(id, 0);
        return 0;
      }

      let max = -1;
      prob.prereqs.forEach(pid => {
        // Only consider prereqs that exist in this plan
        if (problems.find(p => p.id === pid)) {
          max = Math.max(max, getDepth(pid, visited));
        }
      });

      const depth = max + 1;
      depthMap.set(id, depth);
      return depth;
    };

    problems.forEach(p => getDepth(p.id));

    // 3. Group by Level
    const levels: ProblemInput[][] = [];
    problems.forEach(p => {
      const d = depthMap.get(p.id) || 0;
      if (!levels[d]) levels[d] = [];
      levels[d].push(p);
    });

    // 4. Assign Coordinates
    const computedNodes: ComputedNode[] = [];
    let currentY = 0;

    levels.forEach(levelNodes => {
      if (!levelNodes) return;

      // Wrap logic
      const rows: ProblemInput[][] = [];
      let currentRow: ProblemInput[] = [];

      levelNodes.forEach((node, i) => {
        currentRow.push(node);
        if (currentRow.length >= cols || i === levelNodes.length - 1) {
          rows.push(currentRow);
          currentRow = [];
        }
      });

      rows.forEach(row => {
        const rowWidth = (row.length * nodeWidth) + ((row.length - 1) * gapX);
        const startX = (width - rowWidth) / 2;

        row.forEach((p, idx) => {
          // Cast to ComputedNode (incomplete status for now)
          computedNodes.push({
            ...p,
            x: startX + idx * (nodeWidth + gapX),
            y: currentY,
            width: nodeWidth,
            height: this.config.nodeHeight,
            status: 'locked', // Default
          });
        });
        currentY += this.config.nodeHeight + gapY;
      });
    });

    return { nodes: computedNodes, height: currentY };
  }
}
