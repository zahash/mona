# Mona Monorepo

Welcome to the Mona monorepo. This project contains a suite of interconnected services and tools designed for high-performance and secure applications.

## Project Overview

The repository is organized into several key areas:

### 1. [Fullstack Application](./fullstack)
A complete web application with a Rust backend (using Axum and SQLite) and a SolidJS frontend. It includes authentication, WASM integration, and a modern UI.
- **Backend**: Rust, Axum, SQLx (SQLite)
- **Frontend**: SolidJS, Vite, TypeScript
- **WASM**: Shared logic compiled from Rust to WebAssembly.

### 2. [JSON CodeGen](./jsoncodegen)
A versatile code generation toolset that generates high-quality source code from JSON samples and schemas.
- **CLI (`jcg`)**: A Rust-based CLI that orchestrates the code generation.
- **WASM Generators**: Language-specific generators (Rust, Java) compiled to WASM for portable execution.
- **Test Data**: An extensive [collection of real-world JSON/YAML/XML samples](./jsoncodegen/test-data) used for verification.

### 3. Services & Infrastructure
- **[Gateway](./gateway)**: An API gateway and service registry.
- **[Oblivious](./oblivious)**: A zero-knowledge server implementation.
- **[Shared](./shared)**: Common libraries and utilities used across the monorepo, including caching, email, and middleware.

## Getting Started

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (Edition 2024)
- [Node.js](https://nodejs.org/) (LTS)
- [Wasmtime](https://wasmtime.dev/)

### Rust Workspace

The project uses Rust workspaces. You can build all components using:

```sh
cargo build
```

Specific components can be built using `-p`:

```sh
cargo build -p jsoncodegen-cli
```

### JavaScript Workspace

The project uses npm workspaces for the frontend and polyfills:

```sh
npm install
```

To run a script in a specific package, use the `-w` (workspace) flag:

```sh
# Run the SolidJS auth frontend in development mode
npm run dev -w @zahash/auth

# Run tests for the polyfill
npm test -w @zahash/jsoncodegen.polyfill
```

## Documentation

Detailed instructions for each component can be found in their respective directories:
- [Fullstack Setup](./fullstack/README.md)
- [JSON CodeGen Guide](./jsoncodegen/README.md)

## License

This project is licensed under the Apache License 2.0. See [LICENSE](./LICENSE) for details.
