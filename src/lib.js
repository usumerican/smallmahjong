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
  return (1 + randomInt(2 ** 32 - 2)) | 0;
}

export class XorshiftRandom {
  constructor(seed, skipCount = 0) {
    this.x = 123456789;
    this.y = 362436069;
    this.z = 521288629;
    this.w = seed | 0 || randomSeed();
    for (let i = 0; i < skipCount; i++) {
      this.next();
    }
  }

  next() {
    const t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8));
    return this.w;
  }

  nextInt(n) {
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

export function getTileCounts(tiles) {
  const counts = Array(TILE_LAST + 1).fill(0);
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

export function getHands(readyCounts, winningTile, turnState, reachState, fromStock, stockCount) {
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
      if (!stockCount) {
        maxHands.push(HAND_LAST_STOCK);
      }
      maxHands.push(HAND_WIN_FROM_STOCK);
    }
  } else {
    if (!stockCount) {
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
    this.discardedTiles = [];
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

  isReachable() {
    return this.reachState === REACHABLE;
  }

  isReaching() {
    return this.reachState === REACHING;
  }

  setReaching(reaching) {
    this.reachState = reaching ? REACHING : REACHABLE;
  }

  isReached() {
    return this.reachState >= REACHED;
  }

  isTileReachable(tile) {
    return this.reachableMap.has(tile);
  }

  isTileWinnable(tile) {
    return this.winnableSet.has(tile);
  }

  canWin() {
    return (
      this.concealedTiles.length % 3 === 2 && this.isTileWinnable(this.concealedTiles[this.concealedTiles.length - 1])
    );
  }

  updateReachable() {
    if (!this.isReached() && !this.canWin()) {
      this.reachableMap = getReachableMap(getTileCounts(this.concealedTiles), getTileCounts(this.discardedTiles));
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
    if (this.isReaching()) {
      this.reachState = this.turnState ? DOUBLE_REACHED : REACHED;
      this.reachedDiscardedIndex = this.discardedTiles.length - 1;
      this.turnState = TURN_ONESHOT;
    } else {
      this.turnState = 0;
    }
  }

  updateWinnableSet() {
    this.winnableSet = getWinnableSet(getTileCounts(this.concealedTiles));
  }

  sortTiles() {
    this.concealedTiles.sort((a, b) => a - b);
  }
}

export class Game {
  constructor() {
    this.seed = 0;
    this.random = null;
    this.stockTiles = [];
    this.bases = [];
    this.dealerIndex = 0;
    this.currentBaseIndex = -1;
    this.winnerBaseIndex = -1;
    this.loserBaseIndex = -1;
    this.readyTiles = null;
    this.winningTile = 0;
    this.winningHands = null;
    this.handsScore = 0;
  }

  getCurrentBase() {
    return this.bases[this.currentBaseIndex];
  }

  dealTiles(dealCount) {
    this.random = new XorshiftRandom(this.seed > 0 ? this.seed : randomSeed(), 100);
    this.stockTiles.push(...TILES, ...TILES, ...TILES, ...TILES);
    this.random.shuffle(this.stockTiles);
    for (const base of this.bases) {
      base.concealedTiles.push(...this.stockTiles.splice(0, dealCount));
      base.updateWinnableSet();
      base.sortTiles();
    }
    this.stockTiles = this.stockTiles.slice(0, 14 * this.bases.length);
  }

  pickTile() {
    return this.stockTiles.pop();
  }

  drawTile(tile) {
    this.currentBaseIndex =
      this.currentBaseIndex >= 0 ? (this.currentBaseIndex + 1) % this.bases.length : this.dealerIndex;
    const currentBase = this.getCurrentBase();
    currentBase.concealedTiles.push(tile);
    if (this.stockTiles.length) {
      currentBase.updateReachable();
    }
  }

  discardTile(tile) {
    const currentBase = this.getCurrentBase();
    currentBase.discardedTiles.push(
      ...currentBase.concealedTiles.splice(currentBase.concealedTiles.lastIndexOf(tile), 1),
    );
    currentBase.updateReached();
    currentBase.updateWinnableSet();
    currentBase.sortTiles();
  }

  think() {
    const base = this.getCurrentBase();
    const counts = getTileCounts(base.concealedTiles);
    const scores = Array(TILE_LAST + 1).fill(0);
    const rankScores = [0, 1, 2, 3, 4, 4, 4, 3, 2, 1];
    for (const tile of TILES) {
      const rank = getTileRank(tile);
      let score = counts[tile] * 5 + rankScores[rank];
      if (rank >= 2) {
        if (counts[tile - 1]) {
          score += 10;
        }
        if (rank >= 3 && counts[tile - 2]) {
          score += 5;
        }
      }
      if (rank <= 8) {
        if (counts[tile + 1]) {
          score += 10;
        }
        if (rank <= 7 && counts[tile + 2]) {
          score += 5;
        }
      }
      scores[tile] = score;
    }
    let minScore = Number.MAX_SAFE_INTEGER;
    let minTiles = [];
    for (const tile of TILES) {
      if (!counts[tile]) {
        continue;
      }
      const score = scores[tile];
      if (score <= minScore) {
        if (score < minScore) {
          minScore = score;
          minTiles = [tile];
        } else if (score === minScore) {
          minTiles.push(tile);
        }
      }
    }
    const tile = minTiles[randomInt(minTiles.length)];
    return [tile, base.isTileReachable(tile)];
  }
}

const PLAYER_NAMES = ['You', 'Alice', 'Bob', 'Carol'];

export class Player {
  constructor(name) {
    this.name = name;
  }
}

export class Match {
  constructor() {
    this.playerCount = 0;
    this.dealCount = 0;
    this.roundCount = 0;
    this.players = null;
    this.games = null;
  }

  getCurrentGame() {
    return this.games[this.games.length - 1];
  }

  startGame() {
    this.manualPlayerIndex = randomInt(this.playerCount);
    let playerNames = PLAYER_NAMES.slice(1);
    shuffleArray(playerNames);
    playerNames = playerNames.slice(0, this.playerCount - 1);
    playerNames.splice(this.manualPlayerIndex, 0, PLAYER_NAMES[0]);
    this.players = [];
    this.games = [];
    const game = new Game();
    for (let i = 0; i < this.playerCount; i++) {
      const player = new Player(playerNames[i]);
      this.players.push(player);
      const base = new Base();
      base.turnState = i === 0 ? TURN_HEAVEN : TURN_EARTH;
      base.place = base.nextPlace = i + 1;
      game.bases.push(base);
    }
    game.dealTiles(this.dealCount);
    this.games.push(game);
  }

  isLastGame() {
    return this.games.length >= this.playerCount * this.roundCount;
  }

  nextGame() {
    const lastGame = this.getCurrentGame();
    const nextGame = new Game();
    nextGame.dealerIndex = (lastGame.dealerIndex + 1) % this.playerCount;
    for (let i = 0; i < this.playerCount; i++) {
      const lastBase = lastGame.bases[i];
      const nextBase = new Base();
      nextBase.turnState = i === 0 ? TURN_HEAVEN : TURN_EARTH;
      nextBase.score = lastBase.nextScore;
      nextBase.place = lastBase.nextPlace;
      nextGame.bases.push(nextBase);
    }
    nextGame.dealTiles(this.dealCount);
    this.games.push(nextGame);
  }

  drawGame() {
    const placeBases = this.getCurrentGame()
      .bases.slice()
      .sort((a, b) => {
        return b.nextScore - a.nextScore;
      });
    for (let i = 0; i < placeBases.length; i++) {
      placeBases[i].nextPlace = i + 1;
    }
  }

  winGame(winnerBaseIndex, loserBaseIndex, winningTile) {
    const currentGame = this.getCurrentGame();
    currentGame.winnerBaseIndex = winnerBaseIndex;
    const winnerBase = currentGame.bases[winnerBaseIndex];
    const fromStock = loserBaseIndex < 0;
    if (fromStock) {
      currentGame.readyTiles = winnerBase.concealedTiles.slice();
      currentGame.winningTile = currentGame.readyTiles.pop();
    } else {
      currentGame.readyTiles = winnerBase.concealedTiles;
      currentGame.winningTile = winningTile;
    }
    currentGame.winningHands = getHands(
      getTileCounts(currentGame.readyTiles),
      currentGame.winningTile,
      winnerBase.turnState,
      winnerBase.reachState,
      fromStock,
      currentGame.stockTiles.length,
    );
    currentGame.handsScore = currentGame.winningHands.reduce(
      (sc, h) => ((sc += getHandScore(h, this.dealCount)), sc),
      0,
    );
    console.log(
      currentGame.readyTiles,
      currentGame.winningTile,
      winnerBase.turnState,
      winnerBase.reachState,
      fromStock,
      currentGame.stockTiles.length,
      currentGame.winningHands,
      currentGame.handsScore,
    );
    const winnerScore = currentGame.handsScore * Math.max(this.playerCount - 1, 1);
    winnerBase.gameScore = winnerScore;
    if (fromStock) {
      for (let i = 1; i < this.playerCount; i++) {
        const base = currentGame.bases[(winnerBaseIndex + i) % this.playerCount];
        base.gameScore = -currentGame.handsScore;
      }
    } else {
      currentGame.loserBaseIndex = loserBaseIndex;
      const loserBase = currentGame.bases[loserBaseIndex];
      loserBase.gameScore = -winnerScore;
    }
    this.drawGame();
  }
}
