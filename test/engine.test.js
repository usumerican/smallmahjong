import { expect, test } from 'vitest';
import { initEngine } from '../src/engine_node';

test('Engine', async () => {
  const engine = await initEngine();
  expect(engine.solveWinnableNorm(14, [0o1011, 0o1110000, 0o110110111])).toEqual(3);
});
