import { expect, test } from 'vitest';
import { XorshiftRandom } from '../src/random';

test('XorshiftRandom', () => {
  const random = new XorshiftRandom(88675123);
  expect(random.next() >>> 0).toEqual(3701687786);
  expect(random.next() >>> 0).toEqual(458299110);
  expect(random.next() >>> 0).toEqual(2500872618);
  expect(random.next() >>> 0).toEqual(3633119408);
  expect(random.next() >>> 0).toEqual(516391518);
});
