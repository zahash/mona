# JSON CodeGen

JSON CodeGen is a powerful, WASM-powered code generation engine that transforms JSON samples, schemas, and other data formats into type-safe source code (Rust, Java, etc.).

## Components

### [CLI (`cli`)](./cli)
The `jcg` tool is the main entry point. It is written in Rust and uses `wasmtime` to execute language-specific generator modules compiled to WebAssembly. This allows for a portable and secure generation environment.

### Language Generators
Generators are implemented as separate Rust crates that are compiled to the `wasm32-wasip1` target:
- **[Rust Generator](./rust)**: Generates idiomatic Rust structs and Serde implementations.
- **[Java Generator](./java)**: Generates Java classes with Jackson annotations.

### [Polyfill](./polyfill)
A JavaScript-based test runner and polyfill for testing generators in a Node.js environment.

### [Test Data](./test-data)
A comprehensive collection of real-world data samples categorized by domain (Cloud, Fintech, IoT, etc.) used to ensure the robustness of the generators.

## Usage

### Building Generators

To build a generator to WASM:

```sh
cargo build -p jsoncodegen-rust --target wasm32-wasip1 --profile wasm
```

### Running the CLI

You can run the CLI using `cargo`:

```sh
cargo run -p jsoncodegen-cli -- --help
```

### Running JS Tests

The JS tests require the WASM generators to be served. First, build the generators and start the file server:

```sh
# Build a generator
cargo build -p jsoncodegen-rust --target wasm32-wasip1 --profile wasm

# Start the file server (in a separate terminal)
cargo run --bin file-serve target/wasm32-wasip1/wasm/*.wasm --port 7357

# Run the tests
npm test -w @jsoncodegen/polyfill
```

## Architecture

1. **Input**: A JSON sample or schema.
2. **Execution**: The CLI loads the requested WASM generator.
3. **Generation**: The WASM module processes the input and returns the generated source code.
4. **Output**: The source code is written to the specified directory.

This architecture ensures that new languages can be added easily by implementing a new WASM module without modifying the core CLI.
