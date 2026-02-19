import { LayoutStrategy, ProblemInput, ComputedNode } from "@zahash/leetcode-tracker.core";

export class GridLayout implements LayoutStrategy {
  constructor(private config = { itemSize: 200, gap: 20 }) {}

  calculate(problems: ProblemInput[], width: number) {
    const { itemSize, gap } = this.config;
    const cols = Math.floor(width / (itemSize + gap)) || 1;
    const nodes: ComputedNode[] = [];

    problems.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      nodes.push({
        ...p,
        x: col * (itemSize + gap) + gap,
        y: row * (itemSize + gap) + gap,
        width: itemSize,
        height: itemSize,
        status: 'locked',
      } as ComputedNode);
    });

    const rows = Math.ceil(problems.length / cols);
    return { nodes, height: rows * (itemSize + gap) + gap };
  }
}
