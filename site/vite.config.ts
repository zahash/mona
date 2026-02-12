import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    solidPlugin(),
    {
      /**
       * DEV-ONLY WASM MIDDLEWARE
       * 
       * This plugin intercepts requests for WASM plugins during local development.
       * It allows the frontend to use "production-style" URLs while fetching the
       * actual binaries directly from the Rust workspace's target directory.
       * 
       * Why? 
       * 1. Eliminates manual copying of .wasm files into the 'public' folder.
       * 2. Ensures you are always testing against the latest 'cargo build'.
       */
      name: 'serve-wasm-from-target',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Check if the request is for one of our jsoncodegen WASM plugins
          if (req.url && req.url.includes('jsoncodegen-') && req.url.endsWith('.wasm')) {
            /**
             * URL TRANSFORMATION:
             * Production URL: /jsoncodegen-java-wasm32-wasip1.wasm
             * Local File:     ../../target/wasm32-wasip1/wasm/jsoncodegen-java.wasm
             * 
             * We strip the '-wasm32-wasip1' architecture suffix because the Rust
             * compiler (cargo) outputs the filename as 'jsoncodegen-<lang>.wasm' 
             * inside the architecture-specific target folder.
             */
            const fileName = path.basename(req.url).replace('-wasm32-wasip1', '');
            const wasmPath = path.resolve(__dirname, `../target/wasm32-wasip1/wasm/${fileName}`);
            
            if (fs.existsSync(wasmPath)) {
              res.setHeader('Content-Type', 'application/wasm');
              res.writeHead(200);
              res.end(fs.readFileSync(wasmPath));
              return;
            }
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      "@": __dirname,
    }
  }
});
