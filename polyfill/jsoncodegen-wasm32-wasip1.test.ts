// node --test

import assert from "node:assert";
import { test } from "node:test";

import { WasmPlugin } from "./jsoncodegen-wasm32-wasip1.ts";

const wasmServerUrl = "http://localhost:7357/";

const response = await fetch(wasmServerUrl);
const filenames = await response.json();

for (const filename of filenames) {
  const url = new URL(filename, wasmServerUrl);

  test(url.href, async () => {
    const plugin = await WasmPlugin.load(url);
    const output = plugin.run("{}");
    assert.ok(output, "Plugin should return a string");
  });
}
