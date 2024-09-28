# Small Mahjong

A simplified [Japanese mahjong](https://en.wikipedia.org/wiki/Japanese_mahjong) without melding and honor tiles

## Playables in browser

- [English](https://smallmahjong.pages.dev/en/)

- [Japanese](https://smallmahjong.pages.dev/ja/)

## Rules

Ref: https://en.wikipedia.org/wiki/Japanese_mahjong

### Overview

This application is played with 4 or less players, you and AI opponents.

It uses 108 tiles of 27 different types.

Each tile type has a suit and a rank.

- Suits: ▲ (red Angle), ■ (green Box), ◉ (blue Circle)
- Ranks: 1, 2, 3, 4, 5, 6, 7, 8, 9

Tile groups are

- Twins: 2 tiles of the same suit and the same rank
- Triplets: 3 tiles of the same suit and the same rank
- Sequence: 3 tiles of the same suit and consecutive ranks
- Meld: Triplets or Sequence

The number of stock tiles is 14 per player.

The number of dealt tiles can be selected from 4, 7, 10 and 13.

The winning hand consists of

- 4 dealt tiles: 1 twins and 1 meld
- 7 dealt tiles: 1 twins and 2 melds
- 10 dealt tiles: 1 twins and 3 melds
- 13 dealt tiles: 1 twins and 4 melds, or 7 twins

### Playing Game

After all the players have been dealt their tiles, the players take turns drawing one tile from the stock and discarding one of the tiles they do not need in order to win.

When the remaining one tile is enough to win, the player can declare Reach.

If the player declares Reach, the hand cannot be changed, but the player can declare Ron on the tile discarded by the opponent and win.

Even if you do not declare Reach, you can still declare Tsumo and win if the tiles you have drawn are in winning hand.

When a player wins, the winner gets the total points of the winning conditions per opponent player.

In case of win by Ron, the player who discards the winning tile loses the winner's score alone.

In case of win by Tsumo, all players except the winner lose the total points of the winning conditions.

In case of no more tiles in the stock, the game is drawn.

### Differences from japanese mahjong

- Cannnot open meld
- Cannnot declare Ron without Reach
- No honor tiles
- no dora tiles
- Simple scoring
- No repeating game by dealer
- No abortive draws

## Winning Conditions

Ref: https://en.wikipedia.org/wiki/Japanese_mahjong_yaku

- 1 point
  - Reach
  - One Shot
  - Last Stock
  - Last Discard
  - Win from Stock
  - All Middles
  - All Sequences
  - Pure Double Sequences
- 2 points
  - Double Reach
  - Mixed Triple Sequences
  - Mixed Triple Triplets
  - Pure Straight
  - Seven twins
  - All Triplets
  - Three Closed Triplets
- 3 points
  - All Outside
  - Two Pure Double Sequences
- 3, 4, 5, 6 points (according to dealt tiles)
  - Full Flush
- 16 points (special conditions)
  - Blessing of Heaven
  - Blessing of Earth
  - All Terminals
  - Four Closed Triplets
  - Nine Gates
