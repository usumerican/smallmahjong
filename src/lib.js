import { XorshiftRandom } from './random.js';

export const SA = 0;
export const SB = 1;
export const SC = 2;
export const SUIT_COUNT = 3;
export const SUIT_CODES = ['A', 'B', 'C'];

export const R1 = 0;
export const R2 = 1;
export const R3 = 2;
export const R4 = 3;
export const R5 = 4;
export const R6 = 5;
export const R7 = 6;
export const R8 = 7;
export const R9 = 8;
export const RANK_COUNT = 9;
export const RANK_CODES = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function isRankTerminal(rank) {
  return rank === R1 || rank === R9;
}

export const TILE_COUNT = SUIT_COUNT * RANK_COUNT;

export function getTile(suit, rank) {
  return RANK_COUNT * suit + rank;
}

export function getTileSuit(tile) {
  return Math.floor(tile / RANK_COUNT);
}

export function getTileRank(tile) {
  return tile % RANK_COUNT;
}

export function isTileTerminal(tile) {
  return isRankTerminal(getTileRank(tile));
}

export function formatTiles(tiles) {
  let code = '';
  let suit;
  for (const t of tiles) {
    const s = getTileSuit(t);
    if (s != suit) {
      code += SUIT_CODES[s];
      suit = s;
    }
    code += RANK_CODES[getTileRank(t)];
  }
  return code;
}

export function parseTiles(code) {
  const tiles = [];
  let suit = 0;
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

export function getGroup(tiles, tile) {
  if (tiles.length == 1 || isGroupIdentical(tiles)) {
    return [...tiles, tile];
  } else if (isGroupSequential(tiles)) {
    return tile < tiles[0] ? [tile, ...tiles] : [...tiles, tile];
  }
  return [tiles[0], tile, tiles[1]];
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

export const DEAL_COUNTS = [4, 7, 10, 13];
export const DISTRIBUTION_FULL = 0o444444444;

export function getDistributionFrequency(distribution, rank) {
  return (distribution >> (rank * 3)) & 0o7;
}

export function addDistributionFrequency(distribution, rank, frequency) {
  return distribution + (frequency << (rank * 3));
}

export function getDistributionNorm(from, to) {
  let n = 0;
  for (let r = 0; r < RANK_COUNT; r++) {
    n += Math.max(getDistributionFrequency(to, r) - getDistributionFrequency(from, r), 0);
  }
  return n;
}

export function* iterateSummary(summary, startTile = 0) {
  if (startTile < TILE_COUNT) {
    let r = getTileRank(startTile);
    for (let s = getTileSuit(startTile); s < SUIT_COUNT; s++) {
      const d = summary[s];
      for (; r < RANK_COUNT; r++) {
        const f = getDistributionFrequency(d, r);
        if (f) {
          yield [s, r, f];
        }
      }
      r = 0;
    }
  }
}

export function findSummaryTile(summary, callback, startTile = 0) {
  for (const [s, r, f] of iterateSummary(summary, startTile)) {
    if (callback(f)) {
      return getTile(s, r);
    }
  }
  return TILE_COUNT;
}

export function getSummaryTileFrequency(summary, tile) {
  return getDistributionFrequency(summary[getTileSuit(tile)], getTileRank(tile));
}

export function addSummaryTileFrequency(summary, tile, frequency) {
  const s = getTileSuit(tile);
  summary[s] = addDistributionFrequency(summary[s], getTileRank(tile), frequency);
}

export function getSummary(tiles) {
  const summary = Array(SUIT_COUNT).fill(0);
  for (const t of tiles) {
    addSummaryTileFrequency(summary, t, 1);
  }
  return summary;
}

export function* generateCombinations(tileCount, summary, stack) {
  if (tileCount === 1) {
    const t = findSummaryTile(summary, (c) => c === 1);
    if (t < TILE_COUNT) {
      yield [...stack, [t], [t]];
    }
    return;
  } else if (tileCount == 4) {
    const twin1 = findSummaryTile(summary, (c) => c >= 2);
    if (twin1 < TILE_COUNT) {
      if (getSummaryTileFrequency(summary, twin1) === 4) {
        return;
      }
      const twin2 = findSummaryTile(summary, (c) => c === 2, twin1 + 1);
      if (twin2 < TILE_COUNT) {
        yield [...stack, [twin1, twin1], [twin2, twin2], [twin2]];
        yield [...stack, [twin2, twin2], [twin1, twin1], [twin1]];
        return;
      }
      const rest = summary.slice();
      addSummaryTileFrequency(rest, twin1, -2);
      const t1 = findSummaryTile(rest, (c) => c === 1);
      if (t1 < TILE_COUNT) {
        const t2 = findSummaryTile(rest, (c) => c === 1, t1 + 1);
        if (t2 < TILE_COUNT && getTileSuit(t2) === getTileSuit(t1)) {
          if (t2 == t1 + 1) {
            const rank = getTileRank(t2);
            if (rank === R2) {
              yield [...stack, [twin1, twin1], [t1, t2], [t2 + 1]];
            } else if (rank === R9) {
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
  } else if (tileCount === 13) {
    const allTwins = [];
    for (let t = 0; (t = findSummaryTile(summary, (c) => c === 2, t)) < TILE_COUNT; t++) {
      allTwins.push([t, t]);
    }
    if (allTwins.length === 6) {
      const t = findSummaryTile(summary, (c) => c === 1);
      if (t < TILE_COUNT) {
        yield [...allTwins, [t], [t]];
      }
    }
  }
  for (let t1 = stack.length ? stack[stack.length - 1][0] : 0; t1 < TILE_COUNT; t1++) {
    const f = getSummaryTileFrequency(summary, t1);
    if (f) {
      if (f >= 3) {
        stack.push([t1, t1, t1]);
        const rest = summary.slice();
        addSummaryTileFrequency(rest, t1, -3);
        yield* generateCombinations(tileCount - 3, rest, stack);
        stack.pop();
      }
      const t2 = t1 + 1;
      if (getSummaryTileFrequency(summary, t2)) {
        const t3 = t1 + 2;
        if (getSummaryTileFrequency(summary, t3) && getTileSuit(t1) === getTileSuit(t3)) {
          stack.push([t1, t2, t3]);
          const rest = summary.slice();
          addSummaryTileFrequency(rest, t1, -1);
          addSummaryTileFrequency(rest, t2, -1);
          addSummaryTileFrequency(rest, t3, -1);
          yield* generateCombinations(tileCount - 3, rest, stack);
          stack.pop();
        }
      }
    }
  }
}

export function getReachableMap(concealedTileCount, concealedSummary, discardedSummary) {
  const reachableMap = new Map();
  LOOP: for (const [s, r] of iterateSummary(concealedSummary)) {
    const rest = concealedSummary.slice();
    rest[s] = addDistributionFrequency(rest[s], r, -1);
    const winnableSet = new Set();
    for (const combi of generateCombinations(concealedTileCount - 1, rest, [])) {
      for (const t of combi[combi.length - 1]) {
        if (getSummaryTileFrequency(discardedSummary, t)) {
          continue LOOP;
        }
        if (getSummaryTileFrequency(concealedSummary, t) < 4) {
          winnableSet.add(t);
        }
      }
    }
    if (winnableSet.size) {
      reachableMap.set(getTile(s, r), winnableSet);
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

export const HAND_DATA = new Map([
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

export function getHands(readyTileCount, readySummary, winningTile, turnState, reachState, fromStock, restCount) {
  const specialHands = [];
  let maxHands = [];
  let maxScore = 0;
  for (const combi of generateCombinations(readyTileCount, readySummary, [])) {
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
      const waitingTiles = combi[combi.length - 2];
      if (
        isGroupSequential(waitingTiles) &&
        !isGroupOutside(waitingTiles) &&
        readyGroups.slice(0, readyGroups.length - 1).every((g) => isGroupSequential(g))
      ) {
        hands.push(HAND_ALL_SEQUENCES);
        score += getHandScore(HAND_ALL_SEQUENCES);
      }
      const winningGroups = [getGroup(waitingTiles, winningTile), ...readyGroups];
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
        (fromStock && waitingTiles.length === 2 && isGroupIdentical(waitingTiles) ? 1 : 0);
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
        if (isGroupSequential(g1) && getTileRank(g1[0]) === R1) {
          const s1 = getTileSuit(g1[0]);
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            const g2 = winningGroups[j];
            if (isGroupSequential(g2) && getTileRank(g2[0]) === R4 && getTileSuit(g2[0]) === s1) {
              for (let k = j + 1; k < winningGroups.length; k++) {
                const g3 = winningGroups[k];
                if (isGroupSequential(g3) && getTileRank(g3[0]) === R7 && getTileSuit(g3[0]) === s1) {
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
        if (isGroupSequential(g1) && getTileSuit(g1[0]) === SA) {
          const r1 = getTileRank(g1[0]);
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            const g2 = winningGroups[j];
            if (isGroupSequential(g2) && getTileSuit(g2[0]) === SB && getTileRank(g2[0]) === r1) {
              for (let k = j + 1; k < winningGroups.length; k++) {
                const g3 = winningGroups[k];
                if (isGroupSequential(g3) && getTileSuit(g3[0]) === SC && getTileRank(g3[0]) === r1) {
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
        if (isGroupIdentical(g1) && getTileSuit(g1[0]) === SA) {
          const r1 = getTileRank(g1[0]);
          for (let j = i + 1; j < winningGroups.length - 1; j++) {
            const g2 = winningGroups[j];
            if (isGroupIdentical(g2) && getTileSuit(g2[0]) === SB && getTileRank(g2[0]) === r1) {
              for (let k = j + 1; k < winningGroups.length; k++) {
                const g3 = winningGroups[k];
                if (isGroupIdentical(g3) && getTileSuit(g3[0]) === SC && getTileRank(g3[0]) === r1) {
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
  const winningSummary = readySummary.slice();
  addSummaryTileFrequency(winningSummary, winningTile, 1);
  const winningSuitRanks = [...iterateSummary(winningSummary)];
  if (winningSuitRanks.every(([, r]) => !isRankTerminal(r))) {
    maxHands.push(HAND_ALL_MIDDLES);
  } else if (winningSuitRanks.every(([, r]) => isRankTerminal(r))) {
    specialHands.push(HAND_ALL_TERMINALS);
  }
  const suit = getTileSuit(winningTile);
  if (winningSuitRanks.every(([s]) => s === suit)) {
    const d = winningSummary[suit];
    let nineGates = true;
    for (let r = 0; r < RANK_COUNT; r++) {
      if (getDistributionFrequency(d, r) < [3, 1, 1, 1, 1, 1, 1, 1, 3][r]) {
        nineGates = false;
        break;
      }
    }
    if (nineGates) {
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
    this.concealedSummary = [0, 0, 0];
    this.discardedTiles = [];
    this.discardedSummary = [0, 0, 0];
    this.invisibleSummary = [DISTRIBUTION_FULL, DISTRIBUTION_FULL, DISTRIBUTION_FULL];
    this.safeSummary = [0, 0, 0];
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
      this.reachableMap = getReachableMap(this.concealedTiles.length, this.concealedSummary, this.discardedSummary);
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
      this.safeSummary = this.discardedSummary.slice();
    } else {
      this.turnState = 0;
    }
  }

  updateWinnableSet() {
    this.winnableSet = new Set();
    for (const combi of generateCombinations(this.concealedTiles.length, this.concealedSummary, [])) {
      for (const t of combi[combi.length - 1]) {
        if (getSummaryTileFrequency(this.concealedSummary, t) < 4) {
          this.winnableSet.add(t);
        }
      }
    }
  }

  sortTiles() {
    this.concealedTiles.sort((a, b) => a - b);
  }

  deal(tiles) {
    this.concealedTiles = tiles;
    this.concealedSummary = getSummary(this.concealedTiles);
    for (const [s, r, f] of iterateSummary(this.concealedSummary)) {
      addSummaryTileFrequency(this.invisibleSummary, getTile(s, r), f);
    }
    this.updateWinnableSet();
    this.sortTiles();
  }

  draw(tile) {
    this.concealedTiles.push(tile);
    addSummaryTileFrequency(this.concealedSummary, tile, 1);
    addSummaryTileFrequency(this.invisibleSummary, tile, -1);
  }

  discard(tile) {
    this.discardedTiles.push(this.concealedTiles.splice(this.concealedTiles.lastIndexOf(tile), 1)[0]);
    addSummaryTileFrequency(this.concealedSummary, tile, -1);
    addSummaryTileFrequency(this.discardedSummary, tile, 1);
    this.updateReached();
    this.updateWinnableSet();
    this.sortTiles();
  }
}

const TILES_ALL = [...Array(TILE_COUNT).keys()];

export function generateStockTiles(random) {
  const stockTiles = [...TILES_ALL, ...TILES_ALL, ...TILES_ALL, ...TILES_ALL];
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
    this.winningTile = TILE_COUNT;
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
        addSummaryTileFrequency(base.invisibleSummary, tile, -1);
        if (base.isStateReached()) {
          addSummaryTileFrequency(base.safeSummary, tile, 1);
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
      this.readyTiles.length,
      getSummary(this.readyTiles),
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

function think1(game) {
  const base = game.getCurrentBase();
  const tile = findSummaryTile(base.concealedSummary, (c) => c);
  return [tile, game.isRestReachable() && base.isTileReachable(tile)];
}

const RANK_SCORES = [1, 2, 3, 4, 4, 4, 3, 2, 1];

function think2(game) {
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
  for (const [s, r, f] of iterateSummary(base.concealedSummary)) {
    const t = getTile(s, r);
    let score = f * 10 + RANK_SCORES[r];
    if (r >= R2) {
      if (getSummaryTileFrequency(base.concealedSummary, t - 1)) {
        score += 10;
      }
      if (r >= R3 && getSummaryTileFrequency(base.concealedSummary, t - 2)) {
        score += 5;
      }
    }
    if (r <= R8) {
      if (getSummaryTileFrequency(base.concealedSummary, t + 1)) {
        score += 10;
      }
      if (r <= R7 && getSummaryTileFrequency(base.concealedSummary, t + 2)) {
        score += 5;
      }
    }
    if (score < minScore) {
      minScore = score;
      minTile = t;
    }
  }
  return [minTile, false];
}

function think3(game) {
  const base = game.getCurrentBase();
  if (game.isRestReachable() && base.isStateReachable()) {
    let maxScore = 0;
    let maxTile = 0;
    for (const [tile, winnableSet] of base.reachableMap) {
      let score = 0;
      for (const t of winnableSet) {
        const count = getSummaryTileFrequency(base.invisibleSummary, t);
        if (count) {
          score += 10 + count;
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
  for (const [s, r, f] of iterateSummary(base.concealedSummary)) {
    const t = getTile(s, r);
    let score = f * 10 + RANK_SCORES[r];
    for (let i = 1; i < game.playerCount; i++) {
      if (getSummaryTileFrequency(game.bases[(game.currentPlayerIndex + i) % game.playerCount].safeSummary, t)) {
        score -= 20;
      }
    }
    if (r >= R2) {
      if (getSummaryTileFrequency(base.concealedSummary, t - 1)) {
        score += 10;
      }
      if (r >= R3 && getSummaryTileFrequency(base.concealedSummary, t - 2)) {
        score += 5;
      }
    }
    if (r <= R8) {
      if (getSummaryTileFrequency(base.concealedSummary, t + 1)) {
        score += 10;
      }
      if (r <= R7 && getSummaryTileFrequency(base.concealedSummary, t + 2)) {
        score += 5;
      }
    }
    if (score < minScore) {
      minScore = score;
      minTile = t;
    }
  }
  return [minTile, false];
}

function getThink4(engine) {
  return (game) => {
    const base = game.getCurrentBase();
    if (game.isRestReachable() && base.isStateReachable()) {
      let maxScore = 0;
      let maxTile = 0;
      for (const [tile, winnableSet] of base.reachableMap) {
        let score = 0;
        for (const t of winnableSet) {
          const count = getSummaryTileFrequency(base.invisibleSummary, t);
          if (count) {
            score += 10 + count;
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
    const targetCount = base.concealedTiles.length;
    for (const [s, r, f] of iterateSummary(base.concealedSummary)) {
      const t = getTile(s, r);
      const targetDistribution = base.concealedSummary.slice();
      addSummaryTileFrequency(targetDistribution, t, -1);
      const norm = engine.solveWinnableNorm(targetCount, targetDistribution);
      let score = 100 * norm + 10 * f + RANK_SCORES[r];
      const dscore = norm > 2 ? 120 : 80;
      for (let i = 1; i < game.playerCount; i++) {
        if (getSummaryTileFrequency(game.bases[(game.currentPlayerIndex + i) % game.playerCount].safeSummary, t)) {
          score -= dscore;
        }
      }
      if (r >= R2) {
        if (getSummaryTileFrequency(targetDistribution, t - 1)) {
          score += 10;
        }
        if (r >= R3 && getSummaryTileFrequency(targetDistribution, t - 2)) {
          score += 5;
        }
      }
      if (r <= R8) {
        if (getSummaryTileFrequency(targetDistribution, t + 1)) {
          score += 10;
        }
        if (r <= R7 && getSummaryTileFrequency(targetDistribution, t + 2)) {
          score += 5;
        }
      }
      if (score < minScore) {
        minScore = score;
        minTile = t;
      }
    }
    return [minTile, false];
  };
}

export function getThink(engine, level) {
  switch (level) {
    case 1:
      return think1;
    case 2:
      return think2;
    case 3:
      return think3;
    default:
      return getThink4(engine);
  }
}

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
