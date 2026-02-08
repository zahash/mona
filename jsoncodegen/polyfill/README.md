# JSON CodeGen Polyfill

This directory contains the JavaScript polyfill and test suite for the JSON CodeGen WASM modules.

## Purpose

The polyfill allows for:
1. **Testing**: Running the language-specific WASM generators in a Node.js environment using the built-in test runner.
2. **Integration**: Providing a way to use the generators in JavaScript/TypeScript-based workflows if needed.

## Testing

To run the polyfill tests:

1. Ensure the WASM generators are built:
   ```sh
   cargo build -p jsoncodegen-rust --target wasm32-wasip1 --profile wasm
   ```

2. Run the tests from the root or this directory:
   ```sh
   npm test
   ```

## Development

The polyfill is written in TypeScript and interacts with the WASM modules via a standard WASI interface.
