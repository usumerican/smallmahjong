export function randomInt(n) {
  return Math.floor(n * Math.random());
}

export function shuffleArray(arr, len) {
  let i = len || arr.length;
  while (i) {
    const j = randomInt(i);
    const t = arr[--i];
    arr[i] = arr[j];
    arr[j] = t;
  }
}

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

  shuffle(arr, len) {
    let i = len || arr.length;
    while (i) {
      const j = this.nextInt(i);
      const t = arr[--i];
      arr[i] = arr[j];
      arr[j] = t;
    }
  }
}

export const SUIT_COUNT = 3;
export const SUITS = [...Array(SUIT_COUNT).keys()].map((i) => i + 1);
export const SUIT_CODES = ['', 'A', 'B', 'C'];

export const RANK_COUNT = 9;
export const RANKS = [...Array(RANK_COUNT).keys()].map((i) => i + 1);
export const RANK_CODES = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function isRankTerminal(rank) {
  return rank === 1 || rank === 9;
}

export const TILES = SUITS.reduce((a, s) => (a.push(...RANKS.map((r) => getTile(s, r))), a), []);
export const TILE_LAST = TILES[TILES.length - 1];

export function getTile(suit, rank) {
  return (RANK_COUNT + 1) * (suit - 1) + rank;
}

export function getTileSuit(tile) {
  return Math.ceil(tile / (RANK_COUNT + 1));
}

export function getTileRank(tile) {
  return tile % (RANK_COUNT + 1);
}

export function isTileTerminal(tile) {
  return isRankTerminal(getTileRank(tile));
}

export function parseTiles(code) {
  const tiles = [];
  let suit = 1;
  for (const ch of code) {
    const r = RANK_CODES.indexOf(ch);
    if (r >= 0) {
      tiles.push(getTile(suit, r));
      continue;
    }
    const s = SUIT_CODES.indexOf(ch);
    if (s >= 0) {
      suit = s;
    }
  }
  return tiles;
}

export function isGroupIdentical(group) {
  if (group.length < 2) {
    return false;
  }
  const first = group[0];
  for (let i = 1; i < group.length; i++) {
    if (group[i] !== first) {
      return false;
    }
  }
  return true;
}

export function isGroupSequential(group) {
  if (group.length < 2) {
    return false;
  }
  const first = group[0];
  for (let i = 1; i < group.length; i++) {
    if (group[i] !== first + i) {
      return false;
    }
  }
  return true;
}

export function isGroupOutside(group) {
  return isTileTerminal(group[0]) || isTileTerminal(group[group.length - 1]);
}

export function getGroupFromWait(wait, tile) {
  if (wait.length == 1 || isGroupIdentical(wait)) {
    return [...wait, tile];
  } else if (isGroupSequential(wait)) {
    return tile < wait[0] ? [tile, ...wait] : [...wait, tile];
  }
  return [wait[0], tile, wait[1]];
}

export function compareGroups(a, b) {
  let cmp = a.length - b.length;
  if (cmp) {
    return cmp;
  }
  for (let i = 0; i < a.length; i++) {
    cmp = a[i] - b[i];
    if (cmp) {
      return cmp;
    }
  }
  return 0;
}

const EMPTY_TILE_COUNTS = Array(TILE_LAST + 1).fill(0);
const FULL_TILE_COUNTS = EMPTY_TILE_COUNTS.map((_, t) => (TILES.includes(t) ? 4 : 0));

export function getTileCounts(tiles) {
  const counts = EMPTY_TILE_COUNTS.slice();
  for (const t of tiles) {
    counts[t]++;
  }
  return counts;
}

export function* generateCombinations(counts, total = counts.reduce((s, c) => (s += c), 0), stack = []) {
  if (total === 1) {
    const t = counts.indexOf(1);
    if (t > 0) {
      yield [...stack, [t], [t]];
    }
    return;
  } else if (total == 4) {
    const twin1 = counts.findIndex((c) => c >= 2);
    if (twin1 > 0) {
      if (counts[twin1] === 4) {
        return;
      }
      const twin2 = counts.indexOf(2, twin1 + 1);
      if (twin2 > 0) {
        yield [...stack, [twin1, twin1], [twin2, twin2], [twin2]];
        yield [...stack, [twin2, twin2], [twin1, twin1], [twin1]];
        return;
      }
      const rest = counts.slice();
      rest[twin1] -= 2;
      const t1 = rest.indexOf(1);
      if (t1 > 0) {
        const t2 = rest.indexOf(1, t1 + 1);
        if (t2 > 0 && getTileSuit(t2) === getTileSuit(t1)) {
          if (t2 == t1 + 1) {
            const rank = getTileRank(t2);
            if (rank === 2) {
              yield [...stack, [twin1, twin1], [t1, t2], [t2 + 1]];
            } else if (rank === 9) {
              yield [...stack, [twin1, twin1], [t1, t2], [t1 - 1]];
            } else {
              yield [...stack, [twin1, twin1], [t1, t2], [t1 - 1, t2 + 1]];
            }
          } else if (t2 == t1 + 2) {
            yield [...stack, [twin1, twin1], [t1, t2], [t1 + 1]];
          }
        }
      }
    }
  } else if (total === 13) {
    const allTwins = counts.reduce((arr, c, t) => (c === 2 && arr.push([t, t]), arr), []);
    if (allTwins.length === 6) {
      const t = counts.indexOf(1);
      if (t > 0) {
        yield [...allTwins, [t], [t]];
      }
    }
  }
  const curr = stack.length ? stack[stack.length - 1][0] : 0;
  for (const t1 of TILES) {
    if (t1 < curr) {
      continue;
    }
    const c = counts[t1];
    if (c) {
      if (c >= 3) {
        stack.push([t1, t1, t1]);
        const rest = counts.slice();
        rest[t1] -= 3;
        yield* generateCombinations(rest, total - 3, stack);
        stack.pop();
      }
      const t2 = t1 + 1;
      if (counts[t2]) {
        const t3 = t1 + 2;
        if (counts[t3] && getTileSuit(t1) === getTileSuit(t3)) {
          stack.push([t1, t2, t3]);
          const rest = counts.slice();
          rest[t1]--;
          rest[t2]--;
          rest[t3]--;
          yield* generateCombinations(rest, total - 3, stack);
          stack.pop();
        }
      }
    }
  }
}

export function getWinnableSet(concealedCounts) {
  const winnableSet = new Set();
  for (const combi of generateCombinations(concealedCounts)) {
    for (const t of combi[combi.length - 1]) {
      if (concealedCounts[t] < 4) {
        winnableSet.add(t);
      }
    }
  }
  return winnableSet;
}

export function getReachableMap(concealedCounts, discardedCounts) {
  const reachableMap = new Map();
  LOOP: for (const tile of concealedCounts.reduce((arr, c, t) => (c && arr.push(t), arr), [])) {
    const rest = concealedCounts.slice();
    rest[tile]--;
    const winnableSet = new Set();
    for (const combi of generateCombinations(rest)) {
      for (const t of combi[combi.length - 1]) {
        if (discardedCounts[t]) {
          continue LOOP;
        }
        if (concealedCounts[t] < 4) {
          winnableSet.add(t);
        }
      }
    }
    if (winnableSet.size) {
      reachableMap.set(tile, winnableSet);
    }
  }
  return reachableMap;
}

export const TURN_HEAVEN = 1;
export const TURN_EARTH = 2;
export const TURN_ONESHOT = 3;

export const REACHABLE = 1;
export const REACHING = 2;
export const REACHED = 3;
export const DOUBLE_REACHED = 4;

export const HAND_REACH = 1;
export const HAND_DOUBLE_REACH = 2;
export const HAND_ONESHOT = 3;
export const HAND_LAST_STOCK = 4;
export const HAND_LAST_DISCARD = 5;
export const HAND_WIN_FROM_STOCK = 6;
export const HAND_ALL_MIDDLES = 7;
export const HAND_ALL_SEQUENCES = 8;
export const HAND_PURE_DOUBLE_SEQUENCES = 9;
export const HAND_MIXED_TRIPLE_SEQUENCES = 10;
export const HAND_MIXED_TRIPLE_TRIPLETS = 11;
export const HAND_PURE_STRAIGHT = 12;
export const HAND_SEVEN_TWINS = 13;
export const HAND_ALL_TRIPLETS = 14;
export const HAND_THREE_CLOSED_TRIPLETS = 15;
export const HAND_ALL_OUTSIDE = 16;
export const HAND_TWO_PURE_DOUBLE_SEQUENCES = 17;
export const HAND_FULL_FLUSH = 18;
export const HAND_BLESSING_OF_HEAVEN = 19;
export const HAND_BLESSING_OF_EARTH = 20;
export const HAND_ALL_TERMINALS = 21;
export const HAND_FOUR_CLOSED_TRIPLETS = 22;
export const HAND_NINE_GATES = 23;

const HAND_DATA = new Map([
  [HAND_REACH, { name: 'Reach', score: 1 }],
  [HAND_DOUBLE_REACH, { name: 'Double Reach', score: 2 }],
  [HAND_ONESHOT, { name: 'One Shot', score: 1 }],
  [HAND_LAST_STOCK, { name: 'Last Stock', score: 1 }],
  [HAND_LAST_DISCARD, { name: 'Last Discard', score: 1 }],
  [HAND_WIN_FROM_STOCK, { name: 'Win from Stock', score: 1 }],
  [HAND_ALL_MIDDLES, { name: 'All Middles', score: 1 }],
  [HAND_ALL_SEQUENCES, { name: 'All Sequences', score: 1 }],
  [HAND_PURE_DOUBLE_SEQUENCES, { name: 'Pure Double Sequences', score: 1 }],
  [HAND_MIXED_TRIPLE_SEQUENCES, { name: 'Mixed Triple Sequences', score: 2 }],
  [HAND_MIXED_TRIPLE_TRIPLETS, { name: 'Mixed Triple Triplets', score: 2 }],
  [HAND_PURE_STRAIGHT, { name: 'Pure Straight', score: 2 }],
  [HAND_SEVEN_TWINS, { name: 'Seven twins', score: 2 }],
  [HAND_ALL_TRIPLETS, { name: 'All Triplets', score: 2 }],
  [HAND_THREE_CLOSED_TRIPLETS, { name: 'Three Closed Triplets', score: 2 }],
  [HAND_ALL_OUTSIDE, { name: 'All Outside', score: 3 }],
  [HAND_TWO_PURE_DOUBLE_SEQUENCES, { name: 'Two Pure Double Sequences', score: 3 }],
  [HAND_FULL_FLUSH, { name: 'Full Flush', score: 6 }],
  [HAND_BLESSING_OF_HEAVEN, { name: 'Blessing of Heaven', score: 16 }],
  [HAND_BLESSING_OF_EARTH, { name: 'Blessing of Earth', score: 16 }],
  [HAND_ALL_TERMINALS, { name: 'All Terminals', score: 16 }],
  [HAND_FOUR_CLOSED_TRIPLETS, { name: 'Four Closed Triplets', score: 16 }],
  [HAND_NINE_GATES, { name: 'Nine Gates', score: 16 }],
]);

export function getHandName(hand) {
  return HAND_DATA.get(hand).name;
}

export function getHandScore(hand, dealCount) {
  switch (hand) {
    case HAND_FULL_FLUSH:
      return 2 + Math.floor(dealCount / 3);
    default:
      return HAND_DATA.get(hand).score;
  }
}

export function getHands(readyCounts, winningTile, turnState, reachState, fromStock, restCount) {
  const specialHands = [];
  let maxHands = [];
  let maxScore = 0;
  for (const combi of generateCombinations(readyCounts)) {
    const winnableTiles = combi[combi.length - 1];
    if (!winnableTiles.includes(winningTile)) {
      continue;
    }
    const hands = [];
    let score = 0;
    const readyGroups = combi.slice(0, combi.length - 2);
    if (readyGroups.length === 6) {
      hands.push(HAND_SEVEN_TWINS);
      score += getHandScore(HAND_SEVEN_TWINS);
    } else {
      const wait = combi[combi.length - 2];
      if (
        isGroupSequential(wait) &&
        !isGroupOutside(wait) &&
        readyGroups.slice(0, readyGroups.length - 1).every((g) => isGroupSequential(g))
      ) {
        hands.push(HAND_ALL_SEQUENCES);
        score += getHandScore(HAND_ALL_SEQUENCES);
      }
      const winningGroups = [getGroupFromWait(wait, winningTile), ...readyGroups];
      winningGroups.sort(compareGroups);
      if (winningGroups.every((g) => isGroupOutside(g))) {
        hands.push(HAND_ALL_OUTSIDE);
        score += getHandScore(HAND_ALL_OUTSIDE);
      }
      if (winningGroups.every((g) => isGroupIdentical(g))) {
        hands.push(HAND_ALL_TRIPLETS);
        score += getHandScore(HAND_ALL_TRIPLETS);
      }
      const tripletsCount =
        readyGroups.reduce((c, g) => c + (g.length >= 3 && isGroupIdentical(g) ? 1 : 0), 0) +
        (fromStock && wait.length === 2 && isGroupIdentical(wait) ? 1 : 0);
      if (tripletsCount === 3) {
        hands.push(HAND_THREE_CLOSED_TRIPLETS);
        score += getHandScore(HAND_THREE_CLOSED_TRIPLETS);
      } else if (tripletsCount === 4) {
        specialHands.push(HAND_FOUR_CLOSED_TRIPLETS);
      }
      PDS: for (let i = 1; i < winningGroups.length - 1; i++) {
        if (!compareGroups(winningGroups[i], winningGroups[i + 1])) {
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            if (!compareGroups(winningGroups[j], winningGroups[j + 1])) {
              hands.push(HAND_TWO_PURE_DOUBLE_SEQUENCES);
              score += getHandScore(HAND_TWO_PURE_DOUBLE_SEQUENCES);
              break PDS;
            }
          }
          hands.push(HAND_PURE_DOUBLE_SEQUENCES);
          score += getHandScore(HAND_PURE_DOUBLE_SEQUENCES);
          break;
        }
      }
      PS: for (let i = 1; i < winningGroups.length - 2; i++) {
        const g1 = winningGroups[i];
        if (isGroupSequential(g1) && getTileRank(g1[0]) === 1) {
          const s1 = getTileSuit(g1[0]);
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            const g2 = winningGroups[j];
            if (isGroupSequential(g2) && getTileRank(g2[0]) === 4 && getTileSuit(g2[0]) === s1) {
              for (let k = j + 1; k < winningGroups.length; k++) {
                const g3 = winningGroups[k];
                if (isGroupSequential(g3) && getTileRank(g3[0]) === 7 && getTileSuit(g3[0]) === s1) {
                  hands.push(HAND_PURE_STRAIGHT);
                  score += getHandScore(HAND_PURE_STRAIGHT);
                  break PS;
                }
              }
            }
          }
        }
      }
      MTS: for (let i = 1; i < winningGroups.length - 2; i++) {
        const g1 = winningGroups[i];
        if (isGroupSequential(g1) && getTileSuit(g1[0]) === 1) {
          const r1 = getTileRank(g1[0]);
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            const g2 = winningGroups[j];
            if (isGroupSequential(g2) && getTileSuit(g2[0]) === 2 && getTileRank(g2[0]) === r1) {
              for (let k = j + 1; k < winningGroups.length; k++) {
                const g3 = winningGroups[k];
                if (isGroupSequential(g3) && getTileSuit(g3[0]) === 3 && getTileRank(g3[0]) === r1) {
                  hands.push(HAND_MIXED_TRIPLE_SEQUENCES);
                  score += getHandScore(HAND_MIXED_TRIPLE_SEQUENCES);
                  break MTS;
                }
              }
            }
          }
        }
      }
      MTT: for (let i = 1; i < winningGroups.length - 2; i++) {
        const g1 = winningGroups[i];
        if (isGroupIdentical(g1) && getTileSuit(g1[0]) === 1) {
          const r1 = getTileRank(g1[0]);
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            const g2 = winningGroups[j];
            if (isGroupIdentical(g2) && getTileSuit(g2[0]) === 2 && getTileRank(g2[0]) === r1) {
              for (let k = j + 1; k < winningGroups.length; k++) {
                const g3 = winningGroups[k];
                if (isGroupIdentical(g3) && getTileSuit(g3[0]) === 3 && getTileRank(g3[0]) === r1) {
                  hands.push(HAND_MIXED_TRIPLE_TRIPLETS);
                  score += getHandScore(HAND_MIXED_TRIPLE_TRIPLETS);
                  break MTT;
                }
              }
            }
          }
        }
      }
    }
    if (score > maxScore) {
      maxHands = hands;
      maxScore = score;
    }
  }
  if (reachState) {
    if (reachState === REACHED) {
      maxHands.push(HAND_REACH);
    } else if (reachState === DOUBLE_REACHED) {
      maxHands.push(HAND_DOUBLE_REACH);
    }
    if (turnState === TURN_ONESHOT) {
      maxHands.push(HAND_ONESHOT);
    }
  }
  if (fromStock) {
    if (turnState === TURN_HEAVEN) {
      specialHands.push(HAND_BLESSING_OF_HEAVEN);
    } else if (turnState === TURN_EARTH) {
      specialHands.push(HAND_BLESSING_OF_EARTH);
    } else {
      if (!restCount) {
        maxHands.push(HAND_LAST_STOCK);
      }
      maxHands.push(HAND_WIN_FROM_STOCK);
    }
  } else {
    if (!restCount) {
      maxHands.push(HAND_LAST_DISCARD);
    }
  }
  const winningCounts = readyCounts.slice();
  winningCounts[winningTile]++;
  if (winningCounts.every((c, t) => !c || !isTileTerminal(t))) {
    maxHands.push(HAND_ALL_MIDDLES);
  } else if (winningCounts.every((c, t) => !c || isTileTerminal(t))) {
    specialHands.push(HAND_ALL_TERMINALS);
  }
  const suit = getTileSuit(winningTile);
  if (readyCounts.every((c, t) => !c || getTileSuit(t) === suit)) {
    if (RANKS.every((rank) => winningCounts[getTile(suit, rank)] >= [3, 1, 1, 1, 1, 1, 1, 1, 3][rank - 1])) {
      specialHands.push(HAND_NINE_GATES);
    } else {
      maxHands.push(HAND_FULL_FLUSH);
    }
  }
  if (specialHands.length) {
    maxHands = specialHands;
  }
  return maxHands.sort((a, b) => a - b);
}

export class Base {
  constructor() {
    this.concealedTiles = [];
    this.concealedCounts = EMPTY_TILE_COUNTS.slice();
    this.discardedTiles = [];
    this.discardedCounts = EMPTY_TILE_COUNTS.slice();
    this.invisibleCounts = FULL_TILE_COUNTS.slice();
    this.safeCounts = EMPTY_TILE_COUNTS.slice();
    this.turnState = 0;
    this.reachState = 0;
    this.reachableMap = new Map();
    this.reachedDiscardedIndex = -1;
    this.winnableSet = new Set();
    this.score = 0;
    this.place = 0;
    this.gameScore = 0;
    this.nextPlace = 0;
  }

  get nextScore() {
    return this.score + this.gameScore;
  }

  isStateReachable() {
    return this.reachState === REACHABLE;
  }

  isStateReaching() {
    return this.reachState === REACHING;
  }

  setStateReaching(reaching) {
    this.reachState = reaching ? REACHING : REACHABLE;
  }

  isStateReached() {
    return this.reachState >= REACHED;
  }

  isTileReachable(tile) {
    return this.reachableMap.has(tile);
  }

  isTileWinnable(tile) {
    return this.winnableSet.has(tile);
  }

  isDrawn() {
    return this.concealedTiles.length % 3 === 2;
  }

  canWin() {
    return this.isDrawn() && this.isTileWinnable(this.concealedTiles[this.concealedTiles.length - 1]);
  }

  updateReachable() {
    if (!this.isStateReached() && !this.canWin()) {
      this.reachableMap = getReachableMap(this.concealedCounts, this.discardedCounts);
      this.reachState = this.reachableMap.size ? REACHABLE : 0;
    }
  }

  updateReached() {
    if (this.reachableMap.size) {
      this.reachableMap.clear();
      if (this.reachState === REACHABLE) {
        this.reachState = 0;
      }
    }
    if (this.isStateReaching()) {
      this.reachState = this.turnState ? DOUBLE_REACHED : REACHED;
      this.reachedDiscardedIndex = this.discardedTiles.length - 1;
      this.turnState = TURN_ONESHOT;
      this.safeCounts = this.discardedCounts.slice();
    } else {
      this.turnState = 0;
    }
  }

  updateWinnableSet() {
    this.winnableSet = getWinnableSet(this.concealedCounts);
  }

  sortTiles() {
    this.concealedTiles.sort((a, b) => a - b);
  }

  deal(tiles) {
    this.concealedTiles = tiles;
    this.concealedCounts = getTileCounts(this.concealedTiles);
    for (const t of TILES) {
      this.invisibleCounts[t] -= this.concealedCounts[t];
    }
    this.updateWinnableSet();
    this.sortTiles();
  }

  draw(tile) {
    this.concealedTiles.push(tile);
    this.concealedCounts[tile]++;
    this.invisibleCounts[tile]--;
  }

  discard(tile) {
    this.discardedTiles.push(this.concealedTiles.splice(this.concealedTiles.lastIndexOf(tile), 1)[0]);
    this.concealedCounts[tile]--;
    this.discardedCounts[tile]++;
    this.updateReached();
    this.updateWinnableSet();
    this.sortTiles();
  }
}

export function generateStockTiles(random) {
  const stockTiles = [...TILES, ...TILES, ...TILES, ...TILES];
  random.shuffle(stockTiles);
  return stockTiles;
}

export class Game {
  constructor(playerCount, dealCount, dealerIndex, stockTiles) {
    this.playerCount = playerCount;
    this.dealCount = dealCount;
    this.dealerIndex = dealerIndex;
    this.stockTiles = stockTiles;
    this.stockIndex = 0;
    this.restCount = 14 * this.playerCount;
    this.bases = [];
    for (let i = 0; i < this.playerCount; i++) {
      const base = new Base();
      base.turnState = i === this.dealerIndex ? TURN_HEAVEN : TURN_EARTH;
      base.place = base.nextPlace = ((i - this.dealerIndex + this.playerCount) % this.playerCount) + 1;
      this.bases.push(base);
    }
    this.currentPlayerIndex = -1;
    this.winnerIndex = -1;
    this.loserIndex = -1;
    this.readyTiles = null;
    this.winningTile = 0;
    this.winningHands = null;
    this.handsScore = 0;
  }

  getCurrentBase() {
    return this.bases[this.currentPlayerIndex];
  }

  dealTiles() {
    for (const base of this.bases) {
      const nextStockIndex = this.stockIndex + this.dealCount;
      base.deal(this.stockTiles.slice(this.stockIndex, nextStockIndex));
      this.stockIndex = nextStockIndex;
    }
  }

  pickTile() {
    this.restCount--;
    return this.stockTiles[this.stockIndex++];
  }

  isRestReachable() {
    return this.restCount > 0;
  }

  drawTile(tile) {
    this.currentPlayerIndex =
      this.currentPlayerIndex >= 0 ? (this.currentPlayerIndex + 1) % this.bases.length : this.dealerIndex;
    const base = this.getCurrentBase();
    base.draw(tile);
    if (this.isRestReachable()) {
      base.updateReachable();
    }
  }

  discardTile(tile) {
    for (let p = 0; p < this.playerCount; p++) {
      const base = this.bases[p];
      if (p === this.currentPlayerIndex) {
        base.discard(tile);
      } else {
        base.invisibleCounts[tile]--;
        if (base.isStateReached()) {
          base.safeCounts[tile]++;
        }
      }
    }
  }

  drawGame() {
    const placeBases = this.bases.slice().sort((a, b) => {
      return b.nextScore - a.nextScore;
    });
    for (let i = 0; i < placeBases.length; i++) {
      placeBases[i].nextPlace = i + 1;
    }
  }

  winGame(winnerIndex, loserIndex, winningTile) {
    this.winnerIndex = winnerIndex;
    const winnerBase = this.bases[winnerIndex];
    const fromStock = loserIndex < 0;
    if (fromStock) {
      this.readyTiles = winnerBase.concealedTiles.slice();
      this.winningTile = this.readyTiles.pop();
    } else {
      this.readyTiles = winnerBase.concealedTiles;
      this.winningTile = winningTile;
    }
    this.winningHands = getHands(
      getTileCounts(this.readyTiles),
      this.winningTile,
      winnerBase.turnState,
      winnerBase.reachState,
      fromStock,
      this.restCount,
    );
    this.handsScore = this.winningHands.reduce((sc, h) => ((sc += getHandScore(h, this.dealCount)), sc), 0);
    const winnerScore = this.handsScore * Math.max(this.playerCount - 1, 1);
    winnerBase.gameScore = winnerScore;
    if (fromStock) {
      for (let i = 1; i < this.playerCount; i++) {
        const base = this.bases[(winnerIndex + i) % this.playerCount];
        base.gameScore = -this.handsScore;
      }
    } else {
      this.loserIndex = loserIndex;
      const loserBase = this.bases[loserIndex];
      loserBase.gameScore = -winnerScore;
    }
    this.drawGame();
  }
}

function think0(game) {
  const base = game.getCurrentBase();
  const tile = base.concealedCounts.findIndex((c) => c);
  return [tile, game.isRestReachable() && base.isTileReachable(tile)];
}

function think1(game) {
  const base = game.getCurrentBase();
  if (game.isRestReachable() && base.isStateReachable()) {
    let maxCount = 0;
    let maxTile = 0;
    for (const [tile, winnableSet] of base.reachableMap) {
      if (winnableSet.size > maxCount) {
        maxCount = winnableSet.size;
        maxTile = tile;
      }
    }
    return [maxTile, true];
  }
  let minScore = Number.MAX_SAFE_INTEGER;
  let minTile = 0;
  const rankScores = [0, 1, 2, 3, 4, 4, 4, 3, 2, 1];
  for (const tile of TILES) {
    if (!base.concealedCounts[tile]) {
      continue;
    }
    const rank = getTileRank(tile);
    let score = base.concealedCounts[tile] * 10 + rankScores[rank];
    if (rank >= 2) {
      if (base.concealedCounts[tile - 1]) {
        score += 10;
      }
      if (rank >= 3 && base.concealedCounts[tile - 2]) {
        score += 5;
      }
    }
    if (rank <= 8) {
      if (base.concealedCounts[tile + 1]) {
        score += 10;
      }
      if (rank <= 7 && base.concealedCounts[tile + 2]) {
        score += 5;
      }
    }
    if (score < minScore) {
      minScore = score;
      minTile = tile;
    }
  }
  return [minTile, false];
}

function think2(game) {
  const base = game.getCurrentBase();
  if (game.isRestReachable() && base.isStateReachable()) {
    let maxScore = 0;
    let maxTile = 0;
    for (const [tile, winnableSet] of base.reachableMap) {
      let score = 0;
      for (const t of winnableSet) {
        if (base.invisibleCounts[t]) {
          score += 10 + base.invisibleCounts[t];
        }
      }
      if (score > maxScore) {
        maxScore = score;
        maxTile = tile;
      }
    }
    if (maxTile) {
      return [maxTile, true];
    }
  }
  let minScore = Number.MAX_SAFE_INTEGER;
  let minTile = 0;
  const rankScores = [0, 1, 2, 3, 4, 4, 4, 3, 2, 1];
  for (const tile of TILES) {
    if (!base.concealedCounts[tile]) {
      continue;
    }
    const rank = getTileRank(tile);
    let score = base.concealedCounts[tile] * 10 + rankScores[rank];
    for (let i = 1; i < game.playerCount; i++) {
      if (game.bases[(game.currentPlayerIndex + i) % game.playerCount].safeCounts[tile]) {
        score -= 20;
      }
    }
    if (rank >= 2) {
      if (base.concealedCounts[tile - 1]) {
        score += 10;
      }
      if (rank >= 3 && base.concealedCounts[tile - 2]) {
        score += 5;
      }
    }
    if (rank <= 8) {
      if (base.concealedCounts[tile + 1]) {
        score += 10;
      }
      if (rank <= 7 && base.concealedCounts[tile + 2]) {
        score += 5;
      }
    }
    if (score < minScore) {
      minScore = score;
      minTile = tile;
    }
  }
  return [minTile, false];
}

export const THINKS = [think0, think1, think2];

export class Match {
  constructor(playerCount, dealCount, roundCount, seed) {
    this.playerCount = playerCount;
    this.dealCount = dealCount;
    this.roundCount = roundCount;
    this.seed = seed;
    this.random = new XorshiftRandom(this.seed);
    this.games = [];
  }

  getCurrentGame() {
    return this.games[this.games.length - 1];
  }

  startGame() {
    const game = new Game(this.playerCount, this.dealCount, 0, generateStockTiles(this.random));
    game.dealTiles();
    this.games.push(game);
  }

  isLastGame() {
    return this.games.length >= this.playerCount * this.roundCount;
  }

  nextGame() {
    const lastGame = this.getCurrentGame();
    const nextGame = new Game(
      this.playerCount,
      this.dealCount,
      (lastGame.dealerIndex + 1) % this.playerCount,
      generateStockTiles(this.random),
    );
    for (let i = 0; i < this.playerCount; i++) {
      const lastBase = lastGame.bases[i];
      const nextBase = nextGame.bases[i];
      nextBase.score = lastBase.nextScore;
      nextBase.place = lastBase.nextPlace;
    }
    nextGame.dealTiles();
    this.games.push(nextGame);
  }
}
