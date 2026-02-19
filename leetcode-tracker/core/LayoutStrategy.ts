import { ProblemInput, ComputedNode } from "./types";

/**
 * Strategy Interface.
 * Users can implement this to create Radial, Force-Directed, or Tree layouts.
 */
export interface LayoutStrategy {
  calculate(problems: ProblemInput[], containerWidth: number): {
    nodes: ComputedNode[];
    height: number;
  };
}
