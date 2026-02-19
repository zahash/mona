import { createSignal, createEffect, on } from 'solid-js';
import { GraphEngine, GraphState, PlanInput, LayoutStrategy } from "@zahash/leetcode-tracker.core";

export function createLeetGraph(strategy: () => LayoutStrategy, width: () => number) {
  // We use a getter for strategy/width to allow reactivity
  const engine = new GraphEngine(strategy());
  const [state, setState] = createSignal<GraphState | null>(null);

  const refresh = () => setState(engine.compute(width()));

  // React to width or strategy changes
  createEffect(on([strategy, width], ([s, _]) => {
    engine.setStrategy(s);
    refresh();
  }));

  const actions = {
    loadPlan: (p: PlanInput) => { engine.loadPlan(p); refresh(); },
    loadProgress: (ids: string[]) => { engine.loadProgress(ids); refresh(); },
    toggle: (id: string) => { engine.toggle(id); refresh(); },
    reset: () => { engine.resetProgress(); refresh(); }
  };

  return [state, actions] as const;
}
