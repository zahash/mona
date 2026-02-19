/**
 * Represents the raw data uploaded by the user.
 */
export interface ProblemInput {
  id: string;
  title?: string;
  diff?: 'Easy' | 'Medium' | 'Hard';
  prereqs?: string[];
  // Allow for extensibility (links, tags, etc.)
  [key: string]: any;
}

export interface PlanInput {
  title: string;
  problems: ProblemInput[];
}

/**
 * Represents a Node calculated by the Engine, ready for rendering.
 */
export interface ComputedNode extends ProblemInput {
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'locked' | 'available' | 'completed';
}

/**
 * Represents a connection line between nodes.
 */
export interface ComputedEdge {
  id: string;
  from: string;
  to: string;
  path: string; // The SVG 'd' attribute
  status: 'locked' | 'available' | 'completed';
}

/**
 * The complete state object emitted to the View Layer.
 */
export interface GraphState {
  nodes: ComputedNode[];
  edges: ComputedEdge[];
  width: number;
  height: number;
  stats: {
    total: number;
    completed: number;
    percent: number;
  };
}
