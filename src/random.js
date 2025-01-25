import { randomInt } from 'jshuffle';

export function randomSeed() {
  return randomInt(2 ** 32) | 0;
}

export class XorshiftRandom {
  constructor(seed) {
    this.x = 123456789;
    this.y = 362436069;
    this.z = 521288629;
    this.w = seed | 0;
  }

  next() {
    const t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8));
    return this.w;
  }

  nextInt(n = 2 ** 32) {
    return (this.next() >>> 0) % n;
  }
}
