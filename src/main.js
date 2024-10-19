/* globals process */

import { initEngine } from './engine_node.js';
import { getThink, Match } from './lib.js';
import { XorshiftRandom } from './random.js';

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

(async () => {
  const yourLevel = parseInt(process.argv[2]) || 0;
  console.log('yourLevel: ' + yourLevel);
  const opponentLevel = parseInt(process.argv[3]) || 0;
  console.log('opponentLevel: ' + opponentLevel);
  const matchCount = parseInt(process.argv[4]) || 100;
  console.log('matchCount: ' + matchCount);
  const playerCount = 4;
  const dealCount = 13;
  const roundCount = 4;
  const engine = await initEngine();
  const opponentThink = getThink(engine, opponentLevel);
  const playerThinks = [getThink(engine, yourLevel), opponentThink, opponentThink, opponentThink];
  const playerData = [new Data(), new Data(), new Data(), new Data()];
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
