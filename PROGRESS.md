# TypeGen Refactor Progress

## Tasks

### Phase 1: Core Engine Refactor
- [ ] **Task 1.1: Refactor TypeGraph (Purity)**
  - [ ] Removed `From<Value>` and `From<Schema>` from `TypeGraph`.
  - [ ] Defined `TypeGraph` as a pure data structure with public `nodes`.
  - [ ] Implemented `topological_iter` for safe cyclic traversal.
  - [ ] Added `GraphValidator` via `validate()` method.
  - [ ] Decoupled `NameCollector` from recursive traversal using `topological_iter`.
  - [ ] Updated all backend crates and test utilities to the new purified API.
- [ ] **Task 1.2: Implement TypeReducer (Recursive Support)**
  - Move `TypeReducer` to `reducer.rs`.
  - Implement two-pass reduction algorithm.
  - Handle cyclic graph remapping.
- [ ] **Task 1.3: Optimize Schema Merge**
  - Implement O(N log N) sorted merge join for fields.
- [ ] **Task 1.4: XML Inferrer**

### Phase 2: Unbundled Naming Pipeline
- [ ] Task 2.1: Context Harvester.
- [ ] Task 2.2: Bipartite Matcher implementation.

### Phase 3: Backend Generation Surface
- [ ] Task 3.1: Java Backend (Multi-File / VFS).
- [ ] Task 3.2: Rust Backend (Single-File / VFS).
- [ ] Task 3.3: TypeScript Backend.

## Test Status (Post-Phase 1.1)

| Crate | Passed | Failed | Notes |
| :--- | :--- | :--- | :--- |
| `typegen-core` | All | 0 | Internal unit tests and doctests passing. |
| `typegen-rust` | 119 | 6 | Remaining failures in cyclic/complex schemas (AWS, etc.) and naming. |
| `typegen-java` | TBD | TBD | Likely similar to Rust. |

## Notes for Resumption
- The `TypeGraph` building logic currently lives in `schema.rs` as an interim measure.
- Task 1.2 is critical for resolving the `aws-cloudformation.json` failure, which is currently hitting depth limits or structural mismatches.
- The `case-clash.json` failure is expected until Phase 2 is implemented.
