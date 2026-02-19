import { PlanInput, GraphState, ComputedNode, ComputedEdge } from './types';
import { LayoutStrategy } from './LayoutStrategy';

export class GraphEngine {
  private plan: PlanInput | null = null;
  private progress: Set<string> = new Set();
  private layoutStrategy: LayoutStrategy;

  // Cache the layout geometry to avoid recalculating on every toggle
  private layoutCache: ComputedNode[] = []; 
  private containerWidth: number | undefined;

  // Cache the height calculated by the layout
  private layoutHeight: number = 0;

  constructor(strategy: LayoutStrategy) {
    this.layoutStrategy = strategy;
  }

  /**
   * Swaps the layout algorithm dynamically (e.g., Grid -> Layered).
   * Invalidates the cache to force a geometry recalculation on next render.
   */
  public setStrategy(strategy: LayoutStrategy): void {
    this.layoutStrategy = strategy;
    this.layoutCache = []; 
  }

  // --- IO API ---

  public loadPlan(plan: PlanInput): void {
    if (!plan.problems || !Array.isArray(plan.problems)) {
      throw new Error("Invalid Plan: Missing 'problems' array.");
    }
    this.plan = plan;
    this.layoutCache = []; // Invalidate cache
  }

  public loadProgress(ids: string[]): void {
    this.progress = new Set(ids);
  }

  public toggle(id: string): void {
    if (this.progress.has(id)) this.progress.delete(id);
    else this.progress.add(id);
  }

  public resetProgress(): void {
    this.progress.clear();
  }

  public getProgress(): string[] {
    return Array.from(this.progress);
  }

  // --- CORE LOGIC ---

  public compute(containerWidth: number): GraphState | null {
    if (!this.plan) return null;

    // 1. Recalculate Geometry ONLY if width changes or cache is empty
    if (this.containerWidth !== containerWidth || this.layoutCache.length === 0) {
      this.containerWidth = containerWidth;
      const result = this.layoutStrategy.calculate(this.plan.problems, containerWidth);
      this.layoutCache = result.nodes;
      this.layoutHeight = result.height;
    }

    // 2. Resolve Status (Fast Pass)
    // We map over the cache and apply current progress state
    const nodes = this.layoutCache.map(node => {
      const status = this.resolveStatus(node.id, node.prereqs);
      return {
        ...node,
        status,
      };
    });

    // 3. Generate Edges (Dependent on Node positions)
    const edges = this.generateEdges(nodes);

    return {
      nodes,
      edges,
      width: containerWidth,
      height: this.layoutHeight,
      stats: {
        total: nodes.length,
        completed: this.progress.size,
        percent: nodes.length ? Math.round((this.progress.size / nodes.length) * 100) : 0
      }
    };
  }

  private resolveStatus(id: string, prereqs: string[] = []): 'locked' | 'available' | 'completed' {
    if (this.progress.has(id)) return 'completed';

    // Prereq Check: Are all *existing* parents done?
    const validParents = prereqs.filter(pid => 
      this.plan?.problems.find(p => p.id === pid)
    );
    
    const allDone = validParents.every(pid => this.progress.has(pid));
    return (allDone || validParents.length === 0) ? 'available' : 'locked';
  }

  private generateEdges(nodes: ComputedNode[]): ComputedEdge[] {
    const edges: ComputedEdge[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    nodes.forEach(child => {
      if (!child.prereqs) return;
      child.prereqs.forEach(pid => {
        const parent = nodeMap.get(pid);
        if (!parent) return;

        // Bezier Curve Logic
        const startX = parent.x + parent.width / 2;
        const startY = parent.y + parent.height;
        const endX = child.x + child.width / 2;
        const endY = child.y;
        
        const midY = (startY + endY) / 2;
        const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

        // Edge status matches the PARENT'S status logic usually,
        // or specifically: Active if parent is done.
        let status: ComputedEdge['status'] = 'locked';
        if (parent.status === 'completed') status = 'completed'; // Path travelled
        else if (parent.status === 'available') status = 'available'; // Path theoretically open

        edges.push({
          id: `${pid}-${child.id}`,
          from: pid,
          to: child.id,
          path,
          status
        });
      });
    });

    return edges;
  }
}
