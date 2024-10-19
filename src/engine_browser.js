import init from './bin/engine.wasm?init';
import { Engine, initImportObject } from './engine';

export async function initEngine() {
  return new Engine(await init(initImportObject()));
}
