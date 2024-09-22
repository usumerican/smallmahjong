import { expect, test } from 'vitest';
import {
  DOUBLE_REACHED,
  generateCombinations,
  getHands,
  getReachableMap,
  getTileCounts,
  getWinnableSet,
  HAND_ALL_MIDDLES,
  HAND_ALL_OUTSIDE,
  HAND_ALL_SEQUENCES,
  HAND_ALL_TERMINALS,
  HAND_ALL_TRIPLETS,
  HAND_BLESSING_OF_EARTH,
  HAND_BLESSING_OF_HEAVEN,
  HAND_DOUBLE_REACH,
  HAND_FOUR_CLOSED_TRIPLETS,
  HAND_FULL_FLUSH,
  HAND_LAST_DISCARD,
  HAND_LAST_STOCK,
  HAND_MIXED_TRIPLE_SEQUENCES,
  HAND_MIXED_TRIPLE_TRIPLETS,
  HAND_NINE_GATES,
  HAND_ONESHOT,
  HAND_PURE_DOUBLE_SEQUENCES,
  HAND_PURE_STRAIGHT,
  HAND_REACH,
  HAND_SEVEN_TWINS,
  HAND_THREE_CLOSED_TRIPLETS,
  HAND_TWO_PURE_DOUBLE_SEQUENCES,
  HAND_WIN_FROM_STOCK,
  Match,
  parseTiles,
  REACHED,
  TURN_EARTH,
  TURN_HEAVEN,
  TURN_ONESHOT,
} from '../src/lib';

test('parseTiles', () => {
  expect(parseTiles('A19B19C19')).toEqual([1, 9, 11, 19, 21, 29]);
});

test('getTileCounts', () => {
  const counts = getTileCounts([1, 1, 1, 9, 9, 29]);
  expect(counts[0]).toEqual(0);
  expect(counts[1]).toEqual(3);
  expect(counts[9]).toEqual(2);
  expect(counts[11]).toEqual(0);
  expect(counts[29]).toEqual(1);
});

test.each([
  ['1111', []],
  [
    '1113',
    [
      [[1, 1], [1, 3], [2]],
      [[1, 1, 1], [3], [3]],
    ],
  ],
  [
    '1234567',
    [
      [[1, 2, 3], [4, 5, 6], [7], [7]],
      [[1, 2, 3], [5, 6, 7], [4], [4]],
      [[2, 3, 4], [5, 6, 7], [1], [1]],
    ],
  ],
  [
    '1122345',
    [
      [[3, 4, 5], [1, 1], [2, 2], [2]],
      [[3, 4, 5], [2, 2], [1, 1], [1]],
    ],
  ],
  ['1356799', [[[5, 6, 7], [9, 9], [1, 3], [2]]]],
  ['1256799', [[[5, 6, 7], [9, 9], [1, 2], [3]]]],
  ['1123489', [[[2, 3, 4], [1, 1], [8, 9], [7]]]],
  [
    '1235699',
    [
      [
        [1, 2, 3],
        [9, 9],
        [5, 6],
        [4, 7],
      ],
    ],
  ],
  [
    '3334567',
    [
      [[3, 3, 3], [4, 5, 6], [7], [7]],
      [[3, 3, 3], [5, 6, 7], [4], [4]],
      [
        [3, 4, 5],
        [3, 3],
        [6, 7],
        [5, 8],
      ],
      [
        [5, 6, 7],
        [3, 3],
        [3, 4],
        [2, 5],
      ],
    ],
  ],
  [
    '1112224588899',
    [
      [
        [1, 1, 1],
        [2, 2, 2],
        [8, 8, 8],
        [9, 9],
        [4, 5],
        [3, 6],
      ],
    ],
  ],
  [
    '1122335556799',
    [
      [
        [1, 2, 3],
        [1, 2, 3],
        [5, 5, 5],
        [9, 9],
        [6, 7],
        [5, 8],
      ],
      [[1, 2, 3], [1, 2, 3], [5, 6, 7], [5, 5], [9, 9], [9]],
      [[1, 2, 3], [1, 2, 3], [5, 6, 7], [9, 9], [5, 5], [5]],
    ],
  ],
  [
    '1112223335559',
    [
      [[1, 1, 1], [2, 2, 2], [3, 3, 3], [5, 5, 5], [9], [9]],
      [[1, 2, 3], [1, 2, 3], [1, 2, 3], [5, 5, 5], [9], [9]],
    ],
  ],
  [
    '1223344888999',
    [
      [[1, 2, 3], [2, 3, 4], [8, 8, 8], [9, 9, 9], [4], [4]],
      [
        [1, 2, 3],
        [8, 8, 8],
        [9, 9, 9],
        [4, 4],
        [2, 3],
        [1, 4],
      ],
      [[2, 3, 4], [2, 3, 4], [8, 8, 8], [9, 9, 9], [1], [1]],
    ],
  ],
  [
    '1112345678999',
    [
      [[1, 1, 1], [2, 3, 4], [5, 6, 7], [9, 9], [8, 9], [7]],
      [[1, 1, 1], [2, 3, 4], [5, 6, 7], [9, 9, 9], [8], [8]],
      [[1, 1, 1], [2, 3, 4], [6, 7, 8], [9, 9, 9], [5], [5]],
      [
        [1, 1, 1],
        [2, 3, 4],
        [7, 8, 9],
        [9, 9],
        [5, 6],
        [4, 7],
      ],
      [[1, 1, 1], [3, 4, 5], [6, 7, 8], [9, 9, 9], [2], [2]],
      [
        [1, 1, 1],
        [4, 5, 6],
        [7, 8, 9],
        [9, 9],
        [2, 3],
        [1, 4],
      ],
      [[1, 2, 3], [4, 5, 6], [7, 8, 9], [1, 1], [9, 9], [9]],
      [[1, 2, 3], [4, 5, 6], [7, 8, 9], [9, 9], [1, 1], [1]],
      [
        [1, 2, 3],
        [4, 5, 6],
        [9, 9, 9],
        [1, 1],
        [7, 8],
        [6, 9],
      ],
      [
        [1, 2, 3],
        [6, 7, 8],
        [9, 9, 9],
        [1, 1],
        [4, 5],
        [3, 6],
      ],
      [[3, 4, 5], [6, 7, 8], [9, 9, 9], [1, 1], [1, 2], [3]],
    ],
  ],
  ['A112244557788C9', [[[1, 1], [2, 2], [4, 4], [5, 5], [7, 7], [8, 8], [29], [29]]]],
  [
    'A112233445566C9',
    [
      [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6], [29], [29]],
      [[1, 2, 3], [1, 2, 3], [4, 5, 6], [4, 5, 6], [29], [29]],
    ],
  ],
])('generateCombinations(%s)', (code, expected) => {
  expect([...generateCombinations(getTileCounts(parseTiles(code)))]).toEqual(expected);
});

test.each([
  ['1234', new Set([1, 4])],
  ['1111234444', new Set()],
])('getWinnableSet(%s)', (concealedCode, expected) => {
  expect(getWinnableSet(getTileCounts(parseTiles(concealedCode)))).toEqual(expected);
});

test.each([
  [
    '12345',
    '',
    new Map([
      [1, new Set([2, 5])],
      [2, new Set([1])],
      [4, new Set([5])],
      [5, new Set([1, 4])],
    ]),
  ],
  [
    '12345',
    '1',
    new Map([
      [1, new Set([2, 5])],
      [4, new Set([5])],
    ]),
  ],
  [
    '12345',
    '2',
    new Map([
      [2, new Set([1])],
      [4, new Set([5])],
      [5, new Set([1, 4])],
    ]),
  ],
  ['12345', '12', new Map([[4, new Set([5])]])],
  ['12345', '15', new Map()],
  ['11112344449', '9', new Map()],
])('getReachableMap(%s, %s)', (concealedCode, discardedCode, expected) => {
  expect(getReachableMap(getTileCounts(parseTiles(concealedCode)), getTileCounts(parseTiles(discardedCode)))).toEqual(
    expected,
  );
});

test.each([
  ['A234C9', 29, 0, REACHED, false, 1, [HAND_REACH]],
  ['A234C9', 29, 0, DOUBLE_REACHED, false, 1, [HAND_DOUBLE_REACH]],
  ['A234C9', 29, TURN_ONESHOT, REACHED, false, 1, [HAND_REACH, HAND_ONESHOT]],
  ['A234C9', 29, TURN_ONESHOT, DOUBLE_REACHED, false, 1, [HAND_DOUBLE_REACH, HAND_ONESHOT]],
  ['A234C9', 29, 0, 0, true, 1, [HAND_WIN_FROM_STOCK]],
  ['A234C9', 29, 0, 0, true, 0, [HAND_LAST_STOCK, HAND_WIN_FROM_STOCK]],
  ['A234C9', 29, 0, 0, false, 0, [HAND_LAST_DISCARD]],
  ['A234C9', 29, TURN_HEAVEN, 0, true, 1, [HAND_BLESSING_OF_HEAVEN]],
  ['A234C9', 29, TURN_EARTH, 0, true, 1, [HAND_BLESSING_OF_EARTH]],
  ['A234C8', 28, 0, 0, false, 1, [HAND_ALL_MIDDLES]],
  ['A111C9', 29, 0, 0, false, 1, [HAND_ALL_TERMINALS]],
  ['A2349', 9, 0, 0, false, 1, [HAND_FULL_FLUSH]],
  ['A1112345678999', 8, 0, 0, false, 1, [HAND_NINE_GATES]],
  ['A1133557799C119', 29, 0, 0, false, 1, [HAND_SEVEN_TWINS]],
  ['A23C99', 4, 0, 0, false, 1, [HAND_ALL_SEQUENCES]],
  ['A123C9', 29, 0, 0, false, 1, [HAND_ALL_OUTSIDE]],
  ['A222C9', 29, 0, 0, false, 1, [HAND_ALL_TRIPLETS]],
  ['A111333555789C9', 29, 0, 0, false, 1, [HAND_THREE_CLOSED_TRIPLETS]],
  ['A11133355577C99', 29, 0, 0, false, 1, [HAND_ALL_TRIPLETS, HAND_THREE_CLOSED_TRIPLETS]],
  ['A11133355577C99', 29, 0, 0, true, 1, [HAND_FOUR_CLOSED_TRIPLETS]],
  ['A111333555777C9', 29, 0, 0, false, 1, [HAND_FOUR_CLOSED_TRIPLETS]],
  ['A223344C9', 29, 0, 0, false, 1, [HAND_PURE_DOUBLE_SEQUENCES]],
  ['A223344667788C9', 29, 0, 0, false, 1, [HAND_TWO_PURE_DOUBLE_SEQUENCES]],
  ['A222233334444C9', 29, 0, 0, false, 1, [HAND_TWO_PURE_DOUBLE_SEQUENCES]],
  ['A234B234C2349', 29, 0, 0, false, 1, [HAND_MIXED_TRIPLE_SEQUENCES]],
  ['A222B222C2245699', 22, 0, 0, false, 1, [HAND_MIXED_TRIPLE_TRIPLETS]],
  ['A123456789C9', 29, 0, 0, false, 1, [HAND_PURE_STRAIGHT]],
  [
    'A1112222333399',
    1,
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
    29,
    TURN_HEAVEN,
    false,
    true,
    1,
    [HAND_BLESSING_OF_HEAVEN, HAND_ALL_TERMINALS, HAND_FOUR_CLOSED_TRIPLETS],
  ],
])('getHands(%s)', (concealedCode, winningTile, turnState, reachState, fromStock, stockCount, expected) => {
  expect(
    getHands(getTileCounts(parseTiles(concealedCode)), winningTile, turnState, reachState, fromStock, stockCount),
  ).toEqual(expected);
});

test('startGame', () => {
  const match = new Match();
  match.playerCount = 4;
  match.dealCount = 13;
  match.roundCount = 4;
  match.startGame();
  expect(match.players.length).toEqual(4);
  expect(match.getCurrentGame().bases.length).toEqual(4);
  expect(match.getCurrentGame().bases[0].concealedTiles.length).toEqual(13);
});
