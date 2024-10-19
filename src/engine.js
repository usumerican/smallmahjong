export function initImportObject() {
  return { env: { memory: new WebAssembly.Memory({ initial: 128 }) } };
}

export class Engine {
  constructor(instance) {
    this.instance = instance;
  }

  solveWinnableNorm(winnableCount, concealedDistributions) {
    return this.instance.exports.solveWinnableNorm(
      winnableCount,
      concealedDistributions[0],
      concealedDistributions[1],
      concealedDistributions[2],
    );
  }
}
