# TypeGen Master Plan: The Universal Compiler Pipeline

## 1. Introduction & Vision
The `typegen` project aims to be the industry-standard toolchain for translating any structured data source (JSON, XML, TOML, YAML, JSON Schema, OpenAPI) into high-quality, idiomatic type definitions across all major programming languages (Rust, Java, C#, Go, TypeScript, etc.).

Our vision is to support a matrix of **[N Inputs] x [M Outputs] x [P Deployment Environments]**. To achieve this without exponential code complexity, we are abandoning the current "utility script" model and adopting a strictly decoupled **LLVM-style Compiler Pipeline**.

This document serves as the definitive technical specification and implementation guide for all current and future developers (and AI agents). Every architectural decision here is rooted in the principles of **mathematical purity, zero-assumption design, and extreme modularity.**

---

## 2. The "Original Sin": Analysis of the Legacy Architecture

The legacy codebase was built for simple cases but contains fundamental design flaws that prevent it from scaling to enterprise complexity.

### 2.1 The God-Function Anti-Pattern
Both `typegen-rust` and `typegen-java` expose a monolithic entry point:
`pub fn codegen(json: serde_json::Value, out: &mut dyn io::Write) -> io::Result<()>`.

**The Consequences:**
*   **Redundant Computation:** If a user wants to generate both Rust and Java from the same JSON, the system is forced to re-infer the schema, re-build the type graph, and re-run the reduction optimizer twice.
*   **Inflexible Input:** Taking `serde_json::Value` means the generator is hardcoded to the inference engine. We cannot easily add support for XML or fixed JSON Schemas without rewriting the emitters.
*   **Stream Crippling:** Using `&mut dyn Write` assumes all code for a language fits in one file. This is fundamentally incompatible with Java (which requires one file per class) and C#.

### 2.2 The Leaky Naming Abstraction
The `NameRegistry` and its `NamePreference` struct attempted to solve naming via closures:
`pub struct NamePreference<FA, FO> { pub filter: FA, pub compare: FO }`.

**The Consequences:**
*   **The Transformation Gap:** Closures only filter raw JSON keys. They cannot *transform* them. If two keys like `"foo"` and `"FOO"` are both valid, the registry deems them unique. But when the backend applies `PascalCase`, they both become `"Foo"`, causing a compilation collision.
*   **The Keyword Blindspot:** A key might be a valid identifier but its *transformed* version might be a keyword (e.g., JSON key `"Default"` becomes Java keyword `"default"`).
*   **Resource Leaks:** Primitives like `String` can "steal" names from actual objects because the `NameCollector` doesn't distinguish between complex and primitive types during the matching phase.

### 2.3 Algorithmic Failures
*   **`TypeReducer` Cache Desync:** When merging objects, the reducer updates `reduced_nodes` but fails to update its `cache`. Subsequent identical structures will miss the cache and allocate redundant `TypeId`s, breaking deduplication.
*   **Cyclic Graph Blindness:** The reducer assumes a topologically sorted input. If a graph contains cycles (e.g., recursive `$ref`), the one-pass remapping fails, leading to "Unknown" type references.
*   **O(N*M) Schema Merging:** `schema.rs` uses polynomial-time loops to merge object fields. This makes the system unusable for massive schemas like AWS CloudFormation or Kubernetes.

---

## 3. The Final Architecture: The Compiler Pipeline

We are refactoring the system into five distinct, perfectly decoupled layers.

### Phase 1: Frontends (The Ingestors)
**Job:** Translate raw input into a universal `Schema` tree or `TypeGraph` DAG.
*   **`typegen-infer-json`**: Ingests JSON values, infers structure.
*   **`typegen-infer-xml`**: Handles XML's attribute/node duality. Repeated elements of the same name become `Array`.
*   **`typegen-parse-jsonschema`**: Translates explicit schemas directly to IR.
*   **`typegen-parse-openapi`**: (Planned) Handles OpenAPI path/verb mappings and schema $refs.

### Phase 2: The Core Nexus (The IR)
**Job:** Provide a pure, mathematical Intermediate Representation.
*   **`TypeGraph`**: A "dumb" data structure containing a `root` and a map of `TypeId -> TypeDef`.
*   **`TypeDef` Variants:**
    *   `Unknown`, `Null`, `Boolean`, `Integer`, `Float`, `String`.
    *   `Object(Vec<ObjectField>)`, `Array(TypeId)`, `Optional(TypeId)`, `Union(Vec<TypeId>)`.
*   **Mathematical Utilities:**
    *   **`GraphCanonicalizer`**: Sorts fields and union members to ensure deterministic IR.
    *   **`GraphValidator`**: Ensures every TypeId reference is valid and non-dangling.

### Phase 3: The Optimizer (Type Reduction)
**Job:** Perform graph-to-graph transformations.
*   **`TypeReducer`**: A pure function `fn reduce(TypeGraph) -> TypeGraph`.
*   **Logic:** It identifies structurally compatible objects and merges them into unified types.
*   **The Two-Pass algorithm:**
    1.  Walk the graph and record reduction decisions in a `remaps` table.
    2.  Deep-patch the resulting nodes to ensure all references point to the new reduced IDs.

### Phase 4: Backends (VFS Generation)
**Job:** Translate the optimized IR into a Virtual File System.
*   **`GeneratedWorkspace` (VFS):** A `BTreeMap<PathBuf, String>`.
*   **Authoritative Naming:** Backends take total control of identifiers. They walk the graph, apply casing, filter keywords, and resolve collisions *locally* before emitting any text.

### Phase 5: Adapters (Deployment)
**Job:** Materialize the VFS in the real world.
*   **CLI Adapter:** Writes to the local disk.
*   **WASM Adapter:** Returns a JSON object to a browser or IDE.

---

## 4. Comprehensive Implementation Guide for AI Agents

### Task 1: Core Engine Refactor

#### Task 1.1: Refactor `TypeGraph` (Purity)
**File:** `typegen-core/src/type_graph.rs`
1.  Remove all logic related to `Schema` or `Value`.
2.  Define `pub struct TypeGraph { pub root: TypeId, pub nodes: BTreeMap<TypeId, TypeDef> }`.
3.  Implement `topological_iter` for safe cyclic traversal.
    *   **Algorithm:** Tarjan's or simple DFS for SCC.

#### Task 1.2: Implement `TypeReducer` (Recursive Support)
**File:** `typegen-core/src/reducer.rs`
1.  **Pass 1:** Iterate through all nodes. For every `Object`, check if it can merge with any *already reduced* `Object`.
2.  **Pass 2:** Remap all `TypeId`s within every `TypeDef`.
3.  **Cache Management:** Ensure the cache is rebuilt during merge to maintain deduplication integrity.

#### Task 1.3: Optimize `Schema` Merge
**File:** `typegen-core/src/schema.rs`
1.  Implement O(N log N) sorted merge join for `merge_obj_fields`.

#### Task 1.4: XML Inferrer (`typegen-infer-xml`)
1.  Map elements to `Object` fields.
2.  Map attributes to `Object` fields (prefixed or flagged).
3.  Support repeated child elements as `Array`.

---

### Task 2: Unbundled Naming Pipeline

#### Task 2.1: Context Harvester
**File:** `typegen-core/src/naming/context.rs`
1.  Traverse the graph and harvest all field names that point to each TypeId.
2.  Include `Array` and `Optional` resolution logic.

#### Task 2.2: Bipartite Matcher
**File:** `typegen-core/src/naming/matcher.rs`
1.  Implement the augmenting paths algorithm.
2.  Input: `BTreeMap<TypeId, Vec<String>>`.
3.  Output: `BTreeMap<TypeId, String>`.

---

### Task 3: Backend Generation Surface

#### Task 3.1: Java Backend (Multi-File)
1.  Support package declarations (`package com.mona.api`).
2.  Output one `.java` file per object in the VFS.
3.  Automatically escape and rename keyword-clashing fields.

#### Task 3.2: Rust Backend (Single-File)
1.  Output all structs into a single `models.rs` VFS entry.
2.  Support raw string rename attributes: `#[serde(rename = r"App\Models")]`.

#### Task 3.3: TypeScript Backend
1.  Output `interfaces` or `types`.
2.  Map `Optional` to `?` fields.
3.  Support JSDoc documentation.

---

### Task 4: Infrastructure and Testing

#### Task 4.1: Update `typegen-test-utils`
1.  Implement VFS materialization logic.
2.  Fix test race condition by hashing full paths for temporary workspaces.

#### Task 4.2: CI/CD Pipeline
1.  Set up GitHub Actions to run tests across all supported languages in Docker.

---

## 5. Exhaustive Unit Test Specifications

### 5.1 `typegen-core` Unit Tests
| ID | Input Graph | Expected Reduced Graph | Reasoning |
|---|---|---|---|
| C1 | `{id: int}` + `{id: int}` | One object `{id: int}` | Basic deduplication |
| C2 | `{id: int}` + `{id: int, name: str}` | One object `{id: int, name: str?}` | Basic reduction |
| C3 | `Node { next: Node }` | One object with cycle | Recursive reduction |
| C4 | `Union(A, B)` where A=B | `A` | Union member deduplication |

---

## 6. Mathematical Foundations

### 6.1 The Naming Matching Problem
We model name assignment as a Maximum Bipartite Matching problem in a graph $G = (U \cup V, E)$, where $U$ is the set of TypeIds and $V$ is the set of candidate names. An edge $(u, v) \in E$ exists if name $v$ is a valid candidate for TypeId $u$.

**The Fairness Criterion:**
If a TypeId has multiple candidates, we prefer the one with the highest "quality score" (e.g., ASCII over Unicode, shorter over longer).

---

## 7. Glossary of Terms
*   **IR:** Intermediate Representation (`TypeGraph`).
*   **VFS:** Virtual File System.
*   **Frontend:** Ingestion layer.
*   **Backend:** Generation layer.
*   **Materialization:** Writing code to physical files.
*   **Canonicalization:** Normalizing data structures to a unique representation.

---
*This plan is the authoritative guide for the project. Every change must be reasoned against these architectural pillars.*
*Total Lines Estimated for Implementation: 100,000+ across all crates.*
*Document Revision: 22.0 (The Final Engineering Singularity - Universal Technical Bible - Omega Point - Total Architectural Awareness - Final Unbundled Vision - Immutable Design Law - Technical Apotheosis - The unbundled Truth - The Absolute Standard)*
