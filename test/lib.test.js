import { expect, test } from 'vitest';
import {
  formatTiles,
  generateCombinations,
  getReachableMap,
  getTile,
  parseTiles,
  RANK_COUNT,
  TILE_COUNT,
  REACHED,
  HAND_REACH,
  DOUBLE_REACHED,
  HAND_DOUBLE_REACH,
  TURN_ONESHOT,
  HAND_ONESHOT,
  HAND_WIN_FROM_STOCK,
  HAND_LAST_STOCK,
  HAND_LAST_DISCARD,
  TURN_HEAVEN,
  HAND_BLESSING_OF_HEAVEN,
  TURN_EARTH,
  HAND_BLESSING_OF_EARTH,
  HAND_ALL_MIDDLES,
  HAND_ALL_TERMINALS,
  HAND_FULL_FLUSH,
  HAND_NINE_GATES,
  HAND_SEVEN_TWINS,
  HAND_ALL_SEQUENCES,
  HAND_ALL_OUTSIDE,
  HAND_ALL_TRIPLETS,
  HAND_THREE_CLOSED_TRIPLETS,
  HAND_FOUR_CLOSED_TRIPLETS,
  HAND_PURE_DOUBLE_SEQUENCES,
  HAND_TWO_PURE_DOUBLE_SEQUENCES,
  HAND_MIXED_TRIPLE_SEQUENCES,
  HAND_MIXED_TRIPLE_TRIPLETS,
  HAND_PURE_STRAIGHT,
  getHands,
  Game,
  generateStockTiles,
  Match,
  getDistributionFrequency,
  DISTRIBUTION_FULL,
  addDistributionFrequency,
  findSummaryTile,
  getSummary,
  addSummaryTileFrequency,
} from '../src/lib';
import { randomSeed, XorshiftRandom } from '../src/random';

test('parseTiles', () => {
  expect(parseTiles('A19B19C19')).toEqual([
    getTile(0, 0),
    getTile(0, 8),
    getTile(1, 0),
    getTile(1, 8),
    getTile(2, 0),
    getTile(2, 8),
  ]);
});

test('getDistributionFrequency', () => {
  for (let r = 0; r < RANK_COUNT; r++) {
    expect(getDistributionFrequency(DISTRIBUTION_FULL, r)).toEqual(4);
  }
});

test('addDistributionFrequency', () => {
  let distribution = 0;
  expect(getDistributionFrequency(distribution, 0)).toEqual(0);
  expect(getDistributionFrequency(distribution, 8)).toEqual(0);
  distribution = addDistributionFrequency(distribution, 0, 2);
  expect(getDistributionFrequency(distribution, 0)).toEqual(2);
  expect(getDistributionFrequency(distribution, 8)).toEqual(0);
  distribution = addDistributionFrequency(distribution, 8, 3);
  expect(getDistributionFrequency(distribution, 0)).toEqual(2);
  expect(getDistributionFrequency(distribution, 8)).toEqual(3);
  distribution = addDistributionFrequency(distribution, 8, -1);
  expect(getDistributionFrequency(distribution, 0)).toEqual(2);
  expect(getDistributionFrequency(distribution, 8)).toEqual(2);
});

test('findSummaryTile', () => {
  expect(findSummaryTile([0, 0, 0], (c) => c === 1)).toEqual(TILE_COUNT);
  expect(findSummaryTile([1, 1, 1], (c) => c === 1)).toEqual(getTile(0, 0));
  expect(findSummaryTile([1, 3, 2], (c) => c >= 2)).toEqual(getTile(1, 0));
  expect(findSummaryTile([1, 3, 2], (c) => c >= 2, getTile(1, 1))).toEqual(getTile(2, 0));
});

test('addSummaryTileFrequency', () => {
  const distributions = [3, 3, 3];
  addSummaryTileFrequency(distributions, getTile(1, 0), -2);
  expect(distributions).toEqual([3, 1, 3]);
});

test.each([
  ['1111', []],
  [
    '1113',
    [
      ['A11', 'A13', 'A2'],
      ['A111', 'A3', 'A3'],
    ],
  ],
  [
    '1234567',
    [
      ['A123', 'A456', 'A7', 'A7'],
      ['A123', 'A567', 'A4', 'A4'],
      ['A234', 'A567', 'A1', 'A1'],
    ],
  ],
  [
    '1122345',
    [
      ['A345', 'A11', 'A22', 'A2'],
      ['A345', 'A22', 'A11', 'A1'],
    ],
  ],
  ['1356799', [['A567', 'A99', 'A13', 'A2']]],
  ['1256799', [['A567', 'A99', 'A12', 'A3']]],
  ['1123489', [['A234', 'A11', 'A89', 'A7']]],
  ['1235699', [['A123', 'A99', 'A56', 'A47']]],
  [
    '3334567',
    [
      ['A333', 'A456', 'A7', 'A7'],
      ['A333', 'A567', 'A4', 'A4'],
      ['A345', 'A33', 'A67', 'A58'],
      ['A567', 'A33', 'A34', 'A25'],
    ],
  ],
  ['1112224588899', [['A111', 'A222', 'A888', 'A99', 'A45', 'A36']]],
  [
    '1122335556799',
    [
      ['A123', 'A123', 'A555', 'A99', 'A67', 'A58'],
      ['A123', 'A123', 'A567', 'A55', 'A99', 'A9'],
      ['A123', 'A123', 'A567', 'A99', 'A55', 'A5'],
    ],
  ],
  [
    '1112223335559',
    [
      ['A111', 'A222', 'A333', 'A555', 'A9', 'A9'],
      ['A123', 'A123', 'A123', 'A555', 'A9', 'A9'],
    ],
  ],
  [
    '1223344888999',
    [
      ['A123', 'A234', 'A888', 'A999', 'A4', 'A4'],
      ['A123', 'A888', 'A999', 'A44', 'A23', 'A14'],
      ['A234', 'A234', 'A888', 'A999', 'A1', 'A1'],
    ],
  ],
  [
    '1112345678999',
    [
      ['A111', 'A234', 'A567', 'A99', 'A89', 'A7'],
      ['A111', 'A234', 'A567', 'A999', 'A8', 'A8'],
      ['A111', 'A234', 'A678', 'A999', 'A5', 'A5'],
      ['A111', 'A234', 'A789', 'A99', 'A56', 'A47'],
      ['A111', 'A345', 'A678', 'A999', 'A2', 'A2'],
      ['A111', 'A456', 'A789', 'A99', 'A23', 'A14'],
      ['A123', 'A456', 'A789', 'A11', 'A99', 'A9'],
      ['A123', 'A456', 'A789', 'A99', 'A11', 'A1'],
      ['A123', 'A456', 'A999', 'A11', 'A78', 'A69'],
      ['A123', 'A678', 'A999', 'A11', 'A45', 'A36'],
      ['A345', 'A678', 'A999', 'A11', 'A12', 'A3'],
    ],
  ],
  ['A112244557788C9', [['A11', 'A22', 'A44', 'A55', 'A77', 'A88', 'C9', 'C9']]],
  [
    'A112233445566C9',
    [
      ['A11', 'A22', 'A33', 'A44', 'A55', 'A66', 'C9', 'C9'],
      ['A123', 'A123', 'A456', 'A456', 'C9', 'C9'],
    ],
  ],
])('generateCombinations(%s)', (code, expected) => {
  const tiles = parseTiles(code);
  expect(
    [...generateCombinations(tiles.length, getSummary(tiles), [])].map((combi) =>
      combi.map((tiles) => formatTiles(tiles)),
    ),
  ).toEqual(expected);
});

test.each([
  [
    'A12345',
    '',
    [
      ['A1', 'A25'],
      ['A2', 'A1'],
      ['A4', 'A5'],
      ['A5', 'A14'],
    ],
  ],
  [
    'A12345',
    'A1',
    [
      ['A1', 'A25'],
      ['A4', 'A5'],
    ],
  ],
  [
    'A12345',
    'A2',
    [
      ['A2', 'A1'],
      ['A4', 'A5'],
      ['A5', 'A14'],
    ],
  ],
  ['A12345', 'A12', [['A4', 'A5']]],
  ['A12345', 'A15', []],
  ['A11112344449', 'A9', []],
])('getReachableMap(%s, %s)', (concealedCode, discardedCode, expected) => {
  const concealedTiles = parseTiles(concealedCode);
  expect(
    getReachableMap(concealedTiles.length, getSummary(concealedTiles), getSummary(parseTiles(discardedCode))),
  ).toEqual(
    new Map(
      expected.map(([discardingCode, winnableCode]) => [
        parseTiles(discardingCode)[0],
        new Set(parseTiles(winnableCode)),
      ]),
    ),
  );
});

test.each([
  ['A234C9', 'C9', 0, REACHED, false, 1, [HAND_REACH]],
  ['A234C9', 'C9', 0, DOUBLE_REACHED, false, 1, [HAND_DOUBLE_REACH]],
  ['A234C9', 'C9', TURN_ONESHOT, REACHED, false, 1, [HAND_REACH, HAND_ONESHOT]],
  ['A234C9', 'C9', TURN_ONESHOT, DOUBLE_REACHED, false, 1, [HAND_DOUBLE_REACH, HAND_ONESHOT]],
  ['A234C9', 'C9', 0, 0, true, 1, [HAND_WIN_FROM_STOCK]],
  ['A234C9', 'C9', 0, 0, true, 0, [HAND_LAST_STOCK, HAND_WIN_FROM_STOCK]],
  ['A234C9', 'C9', 0, 0, false, 0, [HAND_LAST_DISCARD]],
  ['A234C9', 'C9', TURN_HEAVEN, 0, true, 1, [HAND_BLESSING_OF_HEAVEN]],
  ['A234C9', 'C9', TURN_EARTH, 0, true, 1, [HAND_BLESSING_OF_EARTH]],
  ['A234C8', 'C8', 0, 0, false, 1, [HAND_ALL_MIDDLES]],
  ['A111C9', 'C9', 0, 0, false, 1, [HAND_ALL_TERMINALS]],
  ['A2349', 'A9', 0, 0, false, 1, [HAND_FULL_FLUSH]],
  ['A1112345678999', 'A8', 0, 0, false, 1, [HAND_NINE_GATES]],
  ['A1133557799C119', 'C9', 0, 0, false, 1, [HAND_SEVEN_TWINS]],
  ['A23C99', 'A4', 0, 0, false, 1, [HAND_ALL_SEQUENCES]],
  ['A123C9', 'C9', 0, 0, false, 1, [HAND_ALL_OUTSIDE]],
  ['A222C9', 'C9', 0, 0, false, 1, [HAND_ALL_TRIPLETS]],
  ['A111333555789C9', 'C9', 0, 0, false, 1, [HAND_THREE_CLOSED_TRIPLETS]],
  ['A11133355577C99', 'C9', 0, 0, false, 1, [HAND_ALL_TRIPLETS, HAND_THREE_CLOSED_TRIPLETS]],
  ['A11133355577C99', 'C9', 0, 0, true, 1, [HAND_FOUR_CLOSED_TRIPLETS]],
  ['A111333555777C9', 'C9', 0, 0, false, 1, [HAND_FOUR_CLOSED_TRIPLETS]],
  ['A223344C9', 'C9', 0, 0, false, 1, [HAND_PURE_DOUBLE_SEQUENCES]],
  ['A223344667788C9', 'C9', 0, 0, false, 1, [HAND_TWO_PURE_DOUBLE_SEQUENCES]],
  ['A222233334444C9', 'C9', 0, 0, false, 1, [HAND_TWO_PURE_DOUBLE_SEQUENCES]],
  ['A234B234C2349', 'C9', 0, 0, false, 1, [HAND_MIXED_TRIPLE_SEQUENCES]],
  ['A222B222C2245699', 'C2', 0, 0, false, 1, [HAND_MIXED_TRIPLE_TRIPLETS]],
  ['A123456789C9', 'C9', 0, 0, false, 1, [HAND_PURE_STRAIGHT]],
  [
    'A1112222333399',
    'A1',
    TURN_ONESHOT,
    REACHED,
    true,
    0,
    [
      HAND_REACH,
      HAND_ONESHOT,
      HAND_LAST_STOCK,
      HAND_WIN_FROM_STOCK,
      HAND_ALL_SEQUENCES,
      HAND_ALL_OUTSIDE,
      HAND_TWO_PURE_DOUBLE_SEQUENCES,
      HAND_FULL_FLUSH,
    ],
  ],
  [
    'A111999B111999C9',
    'C9',
    TURN_HEAVEN,
    false,
    true,
    1,
    [HAND_BLESSING_OF_HEAVEN, HAND_ALL_TERMINALS, HAND_FOUR_CLOSED_TRIPLETS],
  ],
])('getHands(%s)', (concealedCode, winningCode, turnState, reachState, fromStock, stockCount, expected) => {
  const concealedTiles = parseTiles(concealedCode);
  expect(
    getHands(
      concealedTiles.length,
      getSummary(concealedTiles),
      parseTiles(winningCode)[0],
      turnState,
      reachState,
      fromStock,
      stockCount,
    ),
  ).toEqual(expected);
});

test('Game', () => {
  const game = new Game(4, 13, 3, generateStockTiles(new XorshiftRandom(1)));
  game.dealTiles();
  expect(game.restCount).toEqual(56);
  expect(game.currentPlayerIndex).toEqual(-1);
  expect(game.bases.length).toEqual(4);
  const base = game.bases[game.dealerIndex];
  expect(base.concealedTiles.length).toEqual(13);
  expect(base.place).toEqual(1);
  expect(base.turnState).toEqual(TURN_HEAVEN);
  const tile1 = game.pickTile();
  expect(game.restCount).toEqual(55);
  game.drawTile(tile1);
  expect(game.currentPlayerIndex).toEqual(3);
  expect(base.canWin()).toEqual(false);
  expect(base.isStateReachable()).toEqual(false);
  game.discardTile(tile1);
  for (let i = 1; i < game.playerCount; i++) {
    expect(game.bases[(game.dealerIndex + i) % game.playerCount].isTileWinnable(tile1)).toEqual(false);
  }
  const tile2 = game.pickTile();
  expect(game.restCount).toEqual(54);
  game.drawTile(tile2);
  expect(game.currentPlayerIndex).toEqual(0);
  game.discardTile(tile2);
});

test('Match', () => {
  const match = new Match(4, 13, 4, randomSeed());
  match.startGame();
  expect(match.getCurrentGame().bases.length).toEqual(4);
  expect(match.getCurrentGame().bases[0].concealedTiles.length).toEqual(13);
});
