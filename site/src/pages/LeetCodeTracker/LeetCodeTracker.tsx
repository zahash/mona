import { Component, createSignal, onMount, onCleanup, Show, For, createEffect } from "solid-js";
import { createLeetGraph } from "@zahash/leetcode-tracker.adapter.solid";
import { GridLayout } from "@zahash/leetcode-tracker.layout.grid";
import { LayeredLayout } from "@zahash/leetcode-tracker.layout.layered";

// Import Themes
import "@zahash/leetcode-tracker.themes/dark";
import "@zahash/leetcode-tracker.themes/light";

// Import Module Styles
import styles from "./LeetCodeTracker.module.css";

const STORAGE_KEY_PLAN = "leetcode-tracker--plan";
const STORAGE_KEY_PROG = "leetcode-tracker--progress";
const STORAGE_KEY_THEME = "leetcode-tracker--theme";

const LeetCodeTracker: Component = () => {
  // --- STATE ---
  let containerRef: HTMLDivElement | undefined;
  let fileInputPlan: HTMLInputElement | undefined;
  let fileInputProgress: HTMLInputElement | undefined;

  // Signals
  const [width, setWidth] = createSignal(1000);
  const [theme, setTheme] = createSignal<'dark' | 'light'>('dark');
  const [layoutName, setLayoutName] = createSignal<'layered' | 'grid'>('layered');
  const [planTitle, setPlanTitle] = createSignal("No Plan Loaded");
  const [isHydrated, setIsHydrated] = createSignal(false);

  // Strategy Factory
  const currentStrategy = () => {
    return layoutName() === 'layered' 
      ? new LayeredLayout({ gapY: 100, nodeWidth: 240 }) // Increased gap for multiline support
      : new GridLayout({ itemSize: 200, gap: 20 });
  };

  // --- ENGINE ---
  const [graphState, actions] = createLeetGraph(currentStrategy, width);

  // --- LIFECYCLE ---
  onMount(() => {
    if (!containerRef) return;
    const observer = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    observer.observe(containerRef);

    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    if (savedTheme) setTheme(savedTheme as 'dark' | 'light');

    const savedPlan = localStorage.getItem(STORAGE_KEY_PLAN);
    if (savedPlan) {
      try {
        const json = JSON.parse(savedPlan);
        actions.loadPlan(json);
        setPlanTitle(json.title || "Untitled");
      } catch (e) { console.error("Failed to load plan", e); }
    }

    const savedProgress = localStorage.getItem(STORAGE_KEY_PROG);
    if (savedProgress) {
      try {
        actions.loadProgress(JSON.parse(savedProgress));
      } catch (e) { console.error("Failed to load progress", e); }
    }

    setIsHydrated(true);
    onCleanup(() => observer.disconnect());
  });

  // Effect: Auto-save Progress
  createEffect(() => {
    const state = graphState();
    if (!isHydrated() || !state) return;
    const progressList = state.nodes
      .filter(n => n.status === 'completed')
      .map(n => n.id);
    localStorage.setItem(STORAGE_KEY_PROG, JSON.stringify(progressList));
  });

  // Effect: Auto-save Theme
  createEffect(() => {
    localStorage.setItem(STORAGE_KEY_THEME, theme());
  });

  // --- HANDLERS ---
  const handlePlanUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if(!file) return;

    const r = new FileReader();
    r.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        actions.loadPlan(json);
        setPlanTitle(json.title || "Untitled Plan");
        localStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(json));
      } catch(err) { console.error(err); alert("Invalid JSON"); }
    };
    r.readAsText(file);
    target.value = ''; // Reset input
  };

  const handleProgressUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if(!file) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        actions.loadProgress(json);
      } catch(err) { console.error(err); alert("Invalid JSON"); }
    };
    r.readAsText(file);
    target.value = ''; // Reset input
  };

  const resetAll = () => {
    if(!confirm("Are you sure you want to reset everything?")) return;
    actions.reset();
    localStorage.removeItem(STORAGE_KEY_PROG);
    localStorage.removeItem(STORAGE_KEY_PLAN); 
    actions.loadPlan({ title: "", problems: [] });
    setPlanTitle("No Plan Loaded");
  };

  return (
    <div class={`lt-container ${styles.Container}`} data-theme={theme()}>
      
      {/* 1. HEADER BAR */}
      <header class={styles.Header}>
        {/* Brand */}
        <div class={styles.Brand}>
          <h1 class={styles.BrandTitle}>
            <span style={{color: "var(--lt-color-accent)"}}>⚡</span> LeetTrack
          </h1>
          <span class={styles.BrandSubtitle}>{planTitle()}</span>
        </div>

        {/* Toolbar */}
        <div class={styles.Toolbar}>
          
          {/* Group: Plan */}
          <div class={styles.ToolGroup}>
            <span class={styles.Label}>Plan</span>
            <button class={styles.Button} onClick={() => fileInputPlan?.click()}>📂 Upload</button>
            <input 
              type="file" 
              ref={fileInputPlan} 
              accept=".json" 
              style={{display:"none"}} 
              onChange={handlePlanUpload}
            />
          </div>

          <div class={styles.Separator}></div>

          {/* Group: Progress */}
          <div class={styles.ToolGroup}>
            <span class={styles.Label}>Progress</span>
            
            <div class={styles.StatsBadge}>
              <Show when={graphState()} fallback="0 / 0">
                {s => `${s().stats.completed} / ${s().stats.total}`}
              </Show>
            </div>

            <button 
              class={`${styles.Button} ${styles.ButtonPrimary}`} 
              onClick={() => fileInputProgress?.click()} 
              disabled={!graphState()}
            >
              ⬆ Load
            </button>
            
            <button 
              class={styles.Button} 
              onClick={() => alert("Save not impl")} 
              disabled={!graphState()}
            >
              ⬇ Save
            </button>
            
            <button 
              class={`${styles.Button} ${styles.ButtonDanger}`} 
              onClick={resetAll} 
              disabled={!graphState()}
            >
              Clear
            </button>
            
            <input 
              type="file" 
              ref={fileInputProgress} 
              accept=".json" 
              style={{display:"none"}} 
              onChange={handleProgressUpload} 
            />
          </div>
          
          <div class={styles.Separator}></div>

          {/* Group: View Settings */}
           <div class={styles.ToolGroup}>
            <button class={styles.Button} onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
               {theme() === 'dark' ? '🌙' : '☀️'}
            </button>
             <button class={styles.Button} onClick={() => setLayoutName(l => l === 'layered' ? 'grid' : 'layered')}>
               {layoutName() === 'layered' ? '🌲' : '▦'}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CANVAS */}
      <div 
        ref={containerRef} 
        class={`lt-viewport ${styles.Viewport}`}
      >
        <Show 
          when={graphState()} 
          fallback={
            <div class={styles.EmptyState}>
              <div class={styles.EmptyIcon}>🗺️</div>
              <h2 class={styles.EmptyTitle}>No Plan Loaded</h2>
              <p>Upload a JSON plan to start tracking.</p>
              <button 
                class={`${styles.Button} ${styles.ButtonPrimary} ${styles.UploadHeroButton}`} 
                onClick={() => fileInputPlan?.click()}
              >
                Upload Plan
              </button>
            </div>
          }
        >
          {(state) => (
            <div 
              class={styles.GraphSurface} 
              style={{ height: `${state().height}px` }}
            >
              {/* SVG Edges */}
              <svg class="lt-layer-edges">
                <For each={state().edges}>
                  {(edge) => <path d={edge.path} class={`lt-edge ${edge.status}`} />}
                </For>
              </svg>

              {/* DOM Nodes */}
              <For each={state().nodes}>
                {(node) => (
                  <div
                    class={`lt-node ${node.status}`}
                    style={{
                      left: `${node.x}px`, 
                      top: `${node.y}px`,
                      width: `${node.width}px`, 
                      "min-height": `${node.height}px`,
                      // Height must remain inline for the layout engine logic
                      // but we use min-height for content expansion
                    }}
                    onClick={() => actions.toggle(node.id)}
                  >
                    <div class="lt-node-header">
                      <span class={`lt-badge ${node.diff}`}>{node.diff}</span>
                      <div class="lt-check"></div>
                    </div>
                    
                    <a 
                      href={`https://leetcode.com/problems/${node.id}/`} 
                      target="_blank" 
                      class="lt-node-title"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {node.title || node.id}
                    </a>
                    
                    <div class="lt-node-meta">
                      <span>{(node.prereqs || []).length} Prereqs</span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
};

export default LeetCodeTracker;
