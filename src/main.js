/* globals process */

import { Match, THINKS, XorshiftRandom } from './lib.js';

function simulateGame(game, playerThinks) {
  GAME: while (game.restCount) {
    const drawingTile = game.pickTile();
    game.drawTile(drawingTile);
    const currentBase = game.getCurrentBase();
    if (currentBase.canWin()) {
      game.winGame(game.currentPlayerIndex, -1, 0);
      break;
    }
    const [discardingTile, reaching] = playerThinks[game.currentPlayerIndex](game);
    currentBase.setStateReaching(reaching);
    game.discardTile(discardingTile);
    for (let i = 1; i < game.playerCount; i++) {
      const playerIndex = (game.currentPlayerIndex + i) % game.playerCount;
      const base = game.bases[playerIndex];
      if (base.isStateReached() && base.isTileWinnable(discardingTile)) {
        game.winGame(playerIndex, game.currentPlayerIndex, discardingTile);
        break GAME;
      }
    }
  }
  if (game.winnerIndex < 0) {
    game.drawGame();
  }
}

class Data {
  constructor() {
    this.winCount = 0;
    this.loseCount = 0;
    this.placeSum = 0;
  }
}

(() => {
  const yourLevel = process.argv[2] || 1;
  console.log('yourLevel: ' + yourLevel);
  const opponentLevel = process.argv[3] || 0;
  console.log('opponentLevel: ' + opponentLevel);
  const matchCount = process.argv[4] || 100;
  console.log('matchCount: ' + matchCount);
  const playerCount = 4;
  const dealCount = 13;
  const roundCount = 4;
  const playerData = [new Data(), new Data(), new Data(), new Data()];
  const playerThinks = [THINKS[yourLevel], THINKS[opponentLevel], THINKS[opponentLevel], THINKS[opponentLevel]];
  const random = new XorshiftRandom();
  for (let m = 0; m < matchCount; m++) {
    const seed = random.nextInt();
    const match = new Match(playerCount, dealCount, roundCount, seed);
    match.startGame();
    for (;;) {
      const game = match.getCurrentGame();
      simulateGame(game, playerThinks);
      if (game.winnerIndex >= 0) {
        playerData[game.winnerIndex].winCount++;
      }
      if (game.loserIndex >= 0) {
        playerData[game.loserIndex].loseCount++;
      }
      if (match.isLastGame()) {
        break;
      }
      match.nextGame();
    }
    const lastGame = match.getCurrentGame();
    for (let p = 0; p < playerCount; p++) {
      playerData[p].placeSum += lastGame.bases[p].place;
    }
  }
  console.log(playerData);
})();
