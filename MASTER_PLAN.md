# TypeGen Master Plan: Compiler Pipeline Architecture

## 1. Vision & Grand Strategy
The goal of `typegen` is to become a universal, high-performance compiler toolchain for generating idiomatic types from any structured data source (JSON, XML, TOML, JSON Schema, etc.). 

To support an ever-growing matrix of `[N Inputs] x [M Outputs] x [P Environments]`, we are transitioning from a coupled utility to a decoupled **LLVM-style Compiler Pipeline**. This ensures that the core logic remains pure and mathematically sound, while the frontends and backends can adapt to the specific idiosyncrasies of their respective domains.

---

## 2. The Architectural Blueprint

### Phase 1: Frontends (The Ingestors)
Frontends are responsible for translating domain-specific inputs into the universal `Schema` or `TypeGraph` IR.
*   **Decoupled Ingestion:** By separating inference from generation, we can support multi-format generation (e.g., JSON and XML simultaneously) without recomputing the type graph.
*   **Frontends:** 
    *   `typegen-infer-json`: Structural inference for arbitrary JSON.
    *   `typegen-infer-xml`: Handles XML specificities like attributes vs. child nodes.
    *   `typegen-parse-openapi`: Direct translation of schema definitions to the IR.

### Phase 2: The Core Nexus (`typegen-core`)
The universal Intermediate Representation (IR) is the `TypeGraph`.
*   **Pure Data Representation:** `TypeGraph` is a pure data structure (root + nodes).
*   **Mathematical Utilities:** Decoupled algorithms that operate on the graph:
    *   **`TypeReducer` (The Optimizer):** Merges compatible object structures (e.g., `{id: int}` and `{id: int, name: str}` -> `{id: int, name: str?}`). 
        *   *Fix:* Must fix the cache desynchronization bug by rebuilding the cache during reduction.
        *   *Fix:* Support cyclic types by using a two-pass remapping strategy.
    *   **`BipartiteMatcher`:** A pure CS utility that solves the assignment problem without knowing about language-specific casing or keywords.

### Phase 3: Backends (The Virtual File System)
Backends translate the `TypeGraph` into a **Virtual File System (VFS)**.
*   **The VFS Model:** Instead of `&mut dyn Write`, backends return a `BTreeMap<PathBuf, String>`.
    *   *Reasoning:* Java/C# require multi-file directory structures (one file per class). VFS allows the backend to define exactly where every piece of code lives, making it compatible with CLI, Web (WASM), and IDE extensions.
*   **Authoritative Naming:** 
    *   Backends are the absolute authority on naming. They apply casing (`PascalCase`, `camelCase`), check for reserved keywords (e.g., `default` in Java), and prioritize ASCII names over Unicode.
    *   Naming happens *before* generation, ensuring that the backend can resolve collisions (e.g., `foo` vs `FOO`) locally before committing to a final identifier.

### Phase 4: Adapters (The Deployers)
Adapters consume the VFS and materialize it in the host environment.
*   **CLI Adapter:** Writes the VFS to the physical disk.
*   **Web/WASM Adapter:** Returns the VFS as a JSON object (e.g., `{"files": {"User.java": "..."}}`).
*   **IDE Extension:** Applies the VFS to virtual editor buffers.

---

## 3. Telemetry & Continuous Improvement
*   **Opt-in failure reporting:** If the user consents, failing inputs are sent to a central server.
*   **Mitigation:** To save space, we only retain the files that caused a failure.
*   **Regression Suite:** These failing inputs are automatically converted into new `test-data` fixtures, making the compiler increasingly resilient over time.

---

## 4. Testing Strategy: "Zero-Touch Roundtrip"
We will preserve the highly scalable, "Zero-Code" testing workflow:
1.  **Drop-a-file:** Add a new JSON/XML file to `test-data/`. No code changes required.
2.  **Roundtrip Execution:**
    *   `Inference -> Graph -> VFS`.
    *   **Materialization:** The test harness writes the VFS to a unique hashed directory (preventing race conditions).
    *   **Compilation:** The harness invokes the target language's compiler (Rust, Maven, etc.) inside a container to prove the code is valid.
    *   **Behavioral Verification:** `deserialize(input) -> serialize() -> compare`. If the data remains semantically equivalent, the test passes.

---

## 5. Critical Fixes & Implementation Nuances

### Core Engine Fixes
*   **Reducer Cache:** Ensure that when objects are merged, the cache is updated to reflect the new merged structure. This prevents deduplication breakage.
*   **Cyclic Graph Support:** Refactor `TypeReducer` to handle cycles correctly by remapping TypeIds in a way that supports forward-references during the reduction pass.
*   **Name Stealing:** Update `NameCollector` to only harvest context for complex types (`Object`/`Union`), preventing primitives from "stealing" valuable names.

### Naming & Casing
*   **Case-Aware Deduplication:** `NameRegistry` must deduplicate *after* casing is applied. If `"foo"` and `"FOO"` both become `"Foo"`, the system must treat them as a collision and apply a fallback (e.g., `"Foo2"`).
*   **Keyword Safety:** Keywords must be checked *after* transformation. `"Default"` (valid key) becomes `"default"` (invalid Java keyword) and must be escaped/renamed.

---

## 6. Implementation Roadmap

### Step 1: Infrastructure & Test Runner
- [ ] **Unique Workspace Hashing:** Use sanitized full paths for workspace directories in `typegen-test-utils` to fix concurrency race conditions.
- [ ] **VFS Materialization:** Update the test harness to handle multi-file outputs from the VFS.

### Step 2: Core Refinement
- [ ] **Pure `TypeGraph` & `TypeReducer`**: Refactor to fix cache/cycle bugs.
- [ ] **O(N log N) Schema Merging**: Refactor `schema.rs` to use `BTreeMap` for field merging, ensuring performance on massive schemas.

### Step 3: Unbundled Naming
- [ ] **`NameContextCollector`**: Extract raw context strings.
- [ ] **`BipartiteMatcher`**: Pure utility for collision-free assignment.

### Step 4: VFS Backends
- [ ] **Rust Backend**: Move naming logic inside and output a VFS.
- [ ] **Java Backend**: Implement multi-file class generation and package structures.

### Step 5: Telemetry
- [ ] **Failure Reporting**: Implement the opt-in telemetry subsystem.

---

## 7. Verification Standards
*   **Zero Regressions:** All 250+ existing tests must pass.
*   **Structural Integrity:** Java tests must verify correct directory structure and class separation.
*   **Performance:** Reduction phase must scale linearly/logarithmically with schema size.
