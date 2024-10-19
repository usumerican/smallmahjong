import fs from 'fs';
import { Engine, initImportObject } from './engine.js';

export async function initEngine() {
  return new Engine(
    (await WebAssembly.instantiate(fs.readFileSync('src/bin/engine.wasm'), initImportObject())).instance,
  );
}
