/* globals __APP_VERSION__, T */

import { getHandName, getHandScore, getTileRank, getTileSuit, Match } from './lib';

function on(target, type, listner) {
  target.addEventListener(type, (ev) => {
    if (ev.cancelable) {
      ev.preventDefault();
    }
    ev.stopPropagation();
    listner(ev);
  });
}

function getRectCenterX([rx, , rw]) {
  return rx + rw / 2;
}

function getRectCenterY([, ry, , rh]) {
  return ry + rh / 2;
}

function isRectContains([rx, ry, rw, rh], [px, py]) {
  return px >= rx && px < rx + rw && py >= ry && py < ry + rh;
}

on(window, 'DOMContentLoaded', async () => {
  const settingsKey = 'smallmahjong';
  const settings = JSON.parse(localStorage.getItem(settingsKey)) || {};

  const playerCounts = [1, 2, 3, 4];
  const dealCounts = [4, 7, 10, 13];
  const roundCounts = [0, 1, 2, 4];

  if (!playerCounts.includes(settings.playerCount)) {
    settings.playerCount = playerCounts[1];
  }
  if (!dealCounts.includes(settings.dealCount)) {
    settings.dealCount = dealCounts[1];
  }
  if (!roundCounts.includes(settings.roundCount)) {
    settings.roundCount = roundCounts[1];
  }

  const canvas = document.querySelector('canvas');
  const matrix = [1, 0, 0, 1, 0, 0];
  const stageR = 360;
  let stageX, stageY, stageW, stageH;
  let lastFrameTime;

  const lineH = stageR / 10;
  const normalFont = Math.floor(lineH * 0.8) + 'px Arial, sans-serif';
  const selectedColor = '#9ff';
  const winningColor = '#ff0';
  const disabledColor = '#ccc';
  const textColor = '#fff';

  const TITLE = 0;
  const PLAYING = 1;
  const FINISHED = 2;
  const HANDS = 3;
  const RESULTS = 4;
  let scene;

  const thinkTime = 200;
  let match;
  let playerPositions;
  let selectedTileIndex;

  const discardedCol = 7;
  let tableTileW, tableTileH;
  let tableX, tableY, tableW, tableH, tableCy;
  let rackTileW, rackTileH;
  let rackX, rackY, rackW, rackH;
  let tableButtonRect;
  let rackButtonRect;

  const messageResolveSet = new Set();
  let messageText;
  let messagePosition;
  let messagePoints;

  function formatRoundGame() {
    return match.isLastGame()
      ? T('Last')
      : `${Math.ceil(match.games.length / match.playerCount)} - ${((match.games.length - 1) % match.playerCount) + 1}`;
  }

  function fillDoubleText(context, text1, text2, cx, cy, w) {
    context.save();
    try {
      context.textBaseline = 'bottom';
      context.fillText(text1, cx, cy, w);
      context.textBaseline = 'top';
      context.fillText(text2, cx, cy, w);
    } finally {
      context.restore();
    }
  }

  function renderTile(context, tile, cx, cy, w, h, angle, tileColor) {
    context.save();
    try {
      context.translate(cx, cy);
      if (angle) {
        context.rotate(angle);
      }
      context.fillStyle = tile ? tileColor || '#fff' : '#fd0';
      context.fillRect(-w / 2, -h / 2, w, h);
      context.strokeStyle = '#000';
      context.strokeRect(-w / 2, -h / 2, w, h);
      if (tile) {
        const suit = getTileSuit(tile);
        context.fillStyle = ['#f00', '#090', '#00f'][suit - 1];
        context.font = Math.floor(0.5 * w) + 'px Verdana, sans-serif';
        context.fillText(getTileRank(tile), 0, 0.2 * h);
        if (suit === 1) {
          context.beginPath();
          context.moveTo(0, -0.35 * h);
          context.lineTo(0.15 * h, -0.05 * h);
          context.lineTo(-0.15 * h, -0.05 * h);
          context.closePath();
          context.fill();
        } else if (suit === 2) {
          context.fillRect(-0.15 * h, -0.35 * h, 0.3 * h, 0.3 * h);
        } else if (suit === 3) {
          context.beginPath();
          context.arc(0, -0.2 * h, 0.1 * h, 0, 2 * Math.PI);
          context.closePath();
          context.fill();
          context.strokeStyle = context.fillStyle;
          context.lineWidth = 0.03 * h;
          context.beginPath();
          context.arc(0, -0.2 * h, 0.15 * h, 0, 2 * Math.PI);
          context.closePath();
          context.stroke();
        }
      }
    } finally {
      context.restore();
    }
  }

  function strokeHorizon(context, y) {
    context.beginPath();
    context.moveTo(-9 * lineH, y);
    context.lineTo(9 * lineH, y);
    context.stroke();
  }

  function renderResults(context) {
    const gameCount = match.games.length;
    const lastGame = match.games[match.games.length - 1];
    const topPlayerIndex = lastGame.bases.find((base) => base.nextPlace === 1).playerIndex;
    const playerColors = Array(match.playerCount).fill(textColor);
    playerColors[match.manualPlayerIndex] = selectedColor;
    playerColors[topPlayerIndex] = winningColor;
    const h = (4 + gameCount) * lineH;
    let y = -0.5 * h + 0.5 * lineH;
    context.fillText(
      T(
        match.manualPlayerIndex === topPlayerIndex && match.playerCount >= 4 && match.roundCount >= 4
          ? 'Winner! Winner! Dinner!'
          : 'Results',
      ),
      0,
      y,
    );
    context.textAlign = 'right';
    const cellW = 4 * lineH;
    const x = -0.5 * (cellW * (0.5 + match.playerCount)) + 0.5 * cellW;
    y += lineH;
    for (let i = 0; i < match.playerCount; i++) {
      context.fillStyle = playerColors[i];
      context.fillText(T(match.players[i].name), x + cellW * (1 + i), y);
    }
    y += lineH;
    for (let i = 0; i < gameCount; i++) {
      context.fillStyle = textColor;
      context.fillText(i + 1, x, y);
      for (const base of match.games[i].bases) {
        context.fillStyle = playerColors[base.playerIndex];
        context.fillText(base.gameScore, x + cellW * (1 + base.playerIndex), y);
      }
      y += lineH;
    }
    context.fillStyle = textColor;
    context.fillText(T('Total'), x, y);
    strokeHorizon(context, y - 0.5 * lineH);
    for (const base of lastGame.bases) {
      const tx = x + cellW * (1 + base.playerIndex);
      context.fillStyle = playerColors[base.playerIndex];
      context.fillText(base.nextScore, tx, y);
      context.fillText('#' + base.nextPlace, tx, y + lineH);
    }
  }

  function renderHands(context) {
    const currentGame = match.getCurrentGame();
    const handCount = currentGame.winningHands.length;
    const h = rackTileH + (8 + handCount) * lineH;
    let y = -0.5 * h + 0.5 * lineH;
    context.fillStyle = 'white';
    context.fillText(formatRoundGame(), 0, y);

    y += lineH + 0.5 * rackTileH;
    for (let i = 0; i < currentGame.readyTiles.length; i++) {
      renderTile(context, currentGame.readyTiles[i], rackX + rackTileW * (0.5 + i), y, rackTileW, rackTileH);
    }
    renderTile(context, currentGame.winningTile, rackX + rackTileW * (0.7 + match.dealCount), y, rackTileW, rackTileH);

    y += 0.5 * rackTileH + lineH;
    context.textAlign = 'right';
    for (let i = 0; i < handCount; i++) {
      const hand = currentGame.winningHands[i];
      context.fillText(T(getHandName(hand)), lineH, y);
      context.fillText(getHandScore(hand, match.dealCount), 3 * lineH, y);
      y += lineH;
    }
    context.fillStyle = winningColor;
    context.fillText(T('Total'), lineH, y);
    context.fillText(currentGame.handsScore, 3 * lineH, y);
    strokeHorizon(context, y - 0.5 * lineH);

    context.textAlign = 'right';
    const cellW = 4 * lineH;
    const x = -0.5 * cellW * match.playerCount + cellW;
    y += 1.5 * lineH;
    for (let i = 0; i < match.playerCount; i++) {
      const base = currentGame.bases[i];
      const px = x + cellW * base.playerIndex;
      context.fillStyle = base.gameScore > 0 ? winningColor : base.gameScore < 0 ? selectedColor : textColor;
      context.fillText(T(match.players[base.playerIndex].name), px, y);
      context.fillText(base.score, px, y + lineH);
      context.fillText((base.gameScore > 0 ? '+' : '') + base.gameScore, px, y + 2 * lineH);
      context.fillText(base.nextScore, px, y + 3 * lineH);
      context.fillText('#' + base.nextPlace, px, y + 4 * lineH);
    }
    strokeHorizon(context, y + 2.5 * lineH);
  }

  const playerSelectRect = [0, -4 * lineH, 8 * lineH, 2 * lineH];
  const playerOptionW = playerSelectRect[2] / playerCounts.length;
  const dealSelectRect = [0, -1 * lineH, 8 * lineH, 2 * lineH];
  const dealOptionW = dealSelectRect[2] / dealCounts.length;
  const roundSelectRect = [0, 2 * lineH, 8 * lineH, 2 * lineH];
  const roundOptionW = roundSelectRect[2] / roundCounts.length;
  const startButtonRect = [-0.5 * stageR, 5 * lineH, stageR, 3 * lineH];
  const homeButtonRect = [-stageR + 0.5 * lineH, 5 * lineH, 0.5 * stageR - lineH, 3 * lineH];
  const reloadButtonRect = [0.5 * stageR + 0.5 * lineH, 5 * lineH, 0.5 * stageR - lineH, 3 * lineH];

  function renderTitle(context) {
    const labelX = -4 * lineH;
    const playerCy = getRectCenterY(playerSelectRect);
    context.fillText(T('AI oppoents'), labelX, playerCy);
    for (let i = 0; i < playerCounts.length; i++) {
      const value = playerCounts[i];
      const optionX = playerSelectRect[0] + playerOptionW * i;
      if (value === settings.playerCount) {
        context.strokeRect(optionX, playerCy - playerSelectRect[3] / 2, playerOptionW, playerSelectRect[3]);
      }
      context.fillText(value - 1, optionX + playerOptionW / 2, playerCy);
    }

    const dealCy = getRectCenterY(dealSelectRect);
    context.fillText(T('Dealt tiles'), labelX, dealCy);
    for (let i = 0; i < dealCounts.length; i++) {
      const value = dealCounts[i];
      const optionX = dealSelectRect[0] + dealOptionW * i;
      if (value === settings.dealCount) {
        context.strokeRect(optionX, dealCy - dealSelectRect[3] / 2, dealOptionW, dealSelectRect[3]);
      }
      context.fillText(value, optionX + dealOptionW / 2, dealCy);
    }

    const roundCy = getRectCenterY(roundSelectRect);
    context.fillText(T('Rounds'), labelX, roundCy);
    for (let i = 0; i < roundCounts.length; i++) {
      const value = roundCounts[i];
      const optionX = roundSelectRect[0] + roundOptionW * i;
      if (value === settings.roundCount) {
        context.strokeRect(optionX, roundCy - roundSelectRect[3] / 2, roundOptionW, roundSelectRect[3]);
      }
      context.fillText(value, optionX + roundOptionW / 2, roundCy);
    }

    context.strokeRect(...startButtonRect);
    context.fillText(T('Start'), getRectCenterX(startButtonRect), getRectCenterY(startButtonRect));
    context.strokeRect(...homeButtonRect);
    context.fillText(T('Home'), getRectCenterX(homeButtonRect), getRectCenterY(homeButtonRect));
    context.strokeRect(...reloadButtonRect);
    context.fillText(T('Reload'), getRectCenterX(reloadButtonRect), getRectCenterY(reloadButtonRect));

    context.fillText(__APP_VERSION__, 0, -5 * lineH);
    context.font = Math.floor(lineH * 1.8) + 'px Arial, sans-serif';
    context.fillText(T('Small Mahjong'), 0, -7 * lineH);
  }

  function renderCanvas(context) {
    context.clearRect(stageX, stageY, stageW, stageH);
    context.font = normalFont;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = textColor;
    context.strokeStyle = '#fff';

    if (scene === TITLE) {
      renderTitle(context);
      return;
    }
    if (scene === HANDS) {
      renderHands(context);
      return;
    }
    if (scene === RESULTS) {
      renderResults(context);
      return;
    }

    const currentGame = match.getCurrentGame();
    context.font = Math.floor(0.5 * tableTileH) + 'px Arial, sans-serif';
    fillDoubleText(context, formatRoundGame(), currentGame.stockTiles.length, 0, tableCy, tableButtonRect[2]);
    context.strokeRect(...tableButtonRect);
    for (let baseIndex = 0; baseIndex < currentGame.bases.length; baseIndex++) {
      const base = currentGame.bases[baseIndex];
      const player = match.players[base.playerIndex];
      const [x, y] = [
        [0, tableCy + 2.25 * tableTileW],
        [2.25 * tableTileW, tableCy],
        [0, tableCy - 2.25 * tableTileW],
        [-2.25 * tableTileW, tableCy],
      ][playerPositions[base.playerIndex]];
      context.fillStyle = baseIndex === currentGame.currentBaseIndex ? selectedColor : textColor;
      fillDoubleText(
        context,
        T(player.name) + (baseIndex === 0 ? T('(D)') : ''),
        '#' + base.place + ': ' + base.score,
        x,
        y,
        2.5 * tableTileW,
      );
    }

    for (let baseIndex = 0; baseIndex < currentGame.bases.length; baseIndex++) {
      const base = currentGame.bases[baseIndex];
      const position = playerPositions[base.playerIndex];
      if (!position) {
        for (let concealedIndex = 0; concealedIndex < base.concealedTiles.length; concealedIndex++) {
          const tile = base.concealedTiles[concealedIndex];
          const cx = rackX + rackTileW * ((concealedIndex < match.dealCount ? 0.5 : 0.7) + concealedIndex);
          const cy = rackY + 0.5 * rackTileH;
          renderTile(
            context,
            tile,
            cx,
            cy,
            rackTileW,
            rackTileH,
            0,
            baseIndex === currentGame.winnerBaseIndex
              ? winningColor
              : base.isReaching() && !base.isTileReachable(tile)
                ? disabledColor
                : concealedIndex === selectedTileIndex
                  ? selectedColor
                  : null,
          );
        }
      }
      context.save();
      try {
        context.translate(0, tableCy);
        if (position) {
          context.rotate([0, 1.5 * Math.PI, Math.PI, 0.5 * Math.PI][position]);
          const x = -0.5 * tableTileW * (1.2 + match.dealCount);
          const cy = 0.5 * (tableH - tableTileH);
          for (let concealedIndex = 0; concealedIndex < base.concealedTiles.length; concealedIndex++) {
            renderTile(
              context,
              scene === FINISHED ? base.concealedTiles[concealedIndex] : 0,
              x + tableTileW * ((concealedIndex < match.dealCount ? 0.5 : 0.7) + concealedIndex),
              cy,
              tableTileW,
              tableTileH,
              0,
              baseIndex === currentGame.winnerBaseIndex ? winningColor : null,
            );
          }
        }
        for (let discardedIndex = 0; discardedIndex < base.discardedTiles.length; discardedIndex++) {
          let cx = tableTileW * (-3 + (discardedIndex % discardedCol));
          if (
            base.isReached() &&
            discardedIndex >= base.reachedDiscardedIndex &&
            Math.floor(discardedIndex / discardedCol) === Math.floor(base.reachedDiscardedIndex / discardedCol)
          ) {
            cx += (discardedIndex > base.reachedDiscardedIndex ? 1 : 0.5) * (tableTileH - tableTileW);
          }
          const cy = tableTileW * 3.5 + tableTileH * (0.5 + Math.floor(discardedIndex / discardedCol));
          renderTile(
            context,
            base.discardedTiles[discardedIndex],
            cx,
            cy,
            tableTileW,
            tableTileH,
            discardedIndex === base.reachedDiscardedIndex ? -0.5 * Math.PI : 0,
            baseIndex === currentGame.loserBaseIndex && discardedIndex === base.discardedTiles.length - 1
              ? winningColor
              : null,
          );
        }
      } finally {
        context.restore();
      }
    }

    if (messageText) {
      context.font = Math.floor(1.2 * lineH) + 'px Arial, sans-serif';
      const messageW = context.measureText(messageText).width + lineH * 2;
      const messageH = lineH * 3;
      const [cx, cy] = messagePoints[messagePosition];
      const messageX =
        cx - messageW / 2 < tableX
          ? tableX
          : cx + messageW / 2 > tableX + tableW
            ? tableX + tableW - messageW
            : cx - messageW / 2;
      const messageY =
        cy - messageH / 2 < tableY
          ? tableY
          : cy + messageH / 2 > tableY + tableH
            ? tableY + tableH - messageH
            : cy - messageH / 2;
      context.fillStyle = '#fff';
      context.fillRect(messageX, messageY, messageW, messageH);
      context.fillStyle = '#000';
      context.fillText(messageText, messageX + messageW / 2, messageY + messageH / 2);
    } else if (scene === PLAYING) {
      const currentBase = currentGame.getCurrentBase();
      if (currentBase && currentBase.playerIndex === match.manualPlayerIndex) {
        if (currentBase.canWin()) {
          context.fillStyle = winningColor;
          context.fillRect(...rackButtonRect);
          context.fillStyle = '#000';
          context.fillText(T('Tsumo?'), getRectCenterX(rackButtonRect), getRectCenterY(rackButtonRect));
        } else if ((currentBase.isReachable() || currentBase.isReaching()) && !currentBase.isReached()) {
          context.fillStyle = currentBase.isReaching() ? disabledColor : selectedColor;
          context.fillRect(...rackButtonRect);
          context.fillStyle = '#000';
          context.fillText(
            currentBase.isReachable() ? T('Reach?') : T('Cancel?'),
            getRectCenterX(rackButtonRect),
            getRectCenterY(rackButtonRect),
          );
        }
      }
    }
  }

  function updateCanvas() {
    requestAnimationFrame((frameTime) => {
      if (frameTime === lastFrameTime) {
        return;
      }
      const context = canvas.getContext('2d');
      context.save();
      try {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(...matrix);
        renderCanvas(context);
      } finally {
        context.restore();
      }
    });
  }

  function doResize() {
    const canvasRect = canvas.getBoundingClientRect();
    canvas.width = canvasRect.width * devicePixelRatio;
    canvas.height = canvasRect.height * devicePixelRatio;
    const scale = (matrix[0] = matrix[3] = Math.min(canvas.width, canvas.height) / (2 * stageR));
    matrix[4] = canvas.width / 2;
    matrix[5] = canvas.height / 2;
    stageW = canvas.width / scale;
    stageH = canvas.height / scale;
    stageX = -stageW / 2;
    stageY = -stageH / 2;

    if (match) {
      rackTileW = stageW / 14.6;
      tableW = Math.min(stageW, stageH - 2 * rackTileW);
      tableH = tableW;
      tableTileW = tableW / 16.6;
      tableTileH = 1.2 * tableTileW;
      rackTileW = Math.min(stageW / (1.6 + match.dealCount), 0.5 * (stageH - tableH));
      rackTileH = 1.2 * rackTileW;
      rackW = rackTileW * (1.2 + match.dealCount);
      rackH = 1.5 * rackTileH;
      rackX = -0.5 * rackW;
      rackY = 0.5 * (tableH - rackH);
      tableX = -0.5 * tableW;
      tableY = rackY - tableH;
      tableCy = tableY + 0.5 * tableH;
      messagePoints = [
        [0, tableCy + 0.5 * tableH],
        [0.5 * tableW, tableCy],
        [0, tableCy - 0.5 * tableH],
        [-0.5 * tableW, tableCy],
        [0, tableCy],
      ];
      tableButtonRect = [-tableTileW, tableCy - tableTileW, 2 * tableTileW, 2 * tableTileW];
      rackButtonRect = [rackX + rackW - 4 * lineH, rackY - 2 * lineH, 4 * lineH, 2 * lineH];
    }
  }

  new ResizeObserver(() => {
    doResize();
    updateCanvas();
  }).observe(canvas);
  doResize();

  on(canvas, 'mousedown', doPointerDown);
  on(canvas, 'mousemove', doPointerMove);
  on(canvas, 'mouseup', doPointerUp);
  on(canvas, 'touchstart', doPointerDown);
  on(canvas, 'touchmove', doPointerMove);
  on(canvas, 'touchend', doPointerUp);

  function showMessage(playerIndex, text) {
    return new Promise((resolve) => {
      messageResolveSet.add(resolve);
      const player = match.players[playerIndex];
      if (player) {
        messageText = T(player.name) + ': ' + text;
        messagePosition = playerPositions[playerIndex];
      } else {
        messageText = text;
        messagePosition = 4;
      }
      updateCanvas();
      setTimeout(() => {
        if (messageResolveSet.delete(resolve)) {
          messageText = '';
          messagePosition = -1;
          updateCanvas();
          resolve();
        }
      }, 1500);
    });
  }

  function doNext() {
    if (match.isLastGame()) {
      scene = RESULTS;
      updateCanvas();
    } else {
      match.nextGame();
      doStarting();
    }
  }

  async function doWinFromStock() {
    const currentGame = match.getCurrentGame();
    match.winGame(currentGame.currentBaseIndex, -1, 0);
    await showMessage(currentGame.getCurrentBase().playerIndex, T('Tsumo!'));
    scene = FINISHED;
    updateCanvas();
  }

  async function doDiscard(tile) {
    const currentGame = match.getCurrentGame();
    const currentBase = currentGame.getCurrentBase();
    const reaching = currentBase.isReaching();
    currentGame.discardTile(tile);
    if (reaching) {
      await showMessage(currentGame.getCurrentBase().playerIndex, T('Reach!'));
    }
    for (let i = 1; i < match.playerCount; i++) {
      const baseIndex = (currentGame.currentBaseIndex + i) % match.playerCount;
      const base = currentGame.bases[baseIndex];
      if (base.isReached() && base.isTileWinnable(tile)) {
        match.winGame(baseIndex, currentGame.currentBaseIndex, tile);
        await showMessage(base.playerIndex, T('Ron!'));
        scene = FINISHED;
        updateCanvas();
        return;
      }
    }
    if (!currentGame.stockTiles.length) {
      match.drawGame();
      await showMessage(-1, T('Draw the game'));
      scene = FINISHED;
      updateCanvas();
      return;
    }
    updateCanvas();
    setTimeout(() => {
      doDraw();
    }, thinkTime);
  }

  function doDraw() {
    const currentGame = match.getCurrentGame();
    const tile = currentGame.pickTile();
    currentGame.drawTile(tile);
    updateCanvas();
    const currentBase = currentGame.getCurrentBase();
    const winnable = currentBase.isTileWinnable(tile);
    if (currentBase.isReached()) {
      if (winnable) {
        doWinFromStock();
      } else {
        setTimeout(() => {
          doDiscard(tile);
        }, thinkTime);
      }
      return;
    }
    if (currentBase.playerIndex !== match.manualPlayerIndex) {
      if (winnable) {
        doWinFromStock();
      } else {
        setTimeout(() => {
          const [t, reaching] = currentGame.think();
          currentBase.setReaching(reaching);
          doDiscard(t);
        }, thinkTime);
      }
      return;
    }
  }

  async function doStarting() {
    selectedTileIndex = -1;
    scene = PLAYING;
    await showMessage(-1, formatRoundGame());
    doDraw();
  }

  function doStart() {
    match = new Match();
    match.playerCount = settings.playerCount;
    match.dealCount = settings.dealCount;
    match.roundCount = settings.roundCount;
    match.startGame();
    playerPositions = Array(match.playerCount);
    for (let i = 0; i < match.playerCount; i++) {
      playerPositions[(match.manualPlayerIndex + i) % match.playerCount] =
        match.playerCount === 2 ? i * 2 : match.playerCount === 3 ? Math.floor(i * 1.5) : i;
    }
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    doResize();
    doStarting();
  }

  function doTitle() {
    scene = TITLE;
    updateCanvas();
  }

  function getPointer(ev) {
    const touch = ev.changedTouches ? ev.changedTouches[0] : ev;
    const canvasRect = canvas.getBoundingClientRect();
    return [
      ((touch.clientX - canvasRect.left) * devicePixelRatio - matrix[4]) / matrix[0],
      ((touch.clientY - canvasRect.top) * devicePixelRatio - matrix[5]) / matrix[3],
    ];
  }

  function getTileIndex([x, y]) {
    if (x >= rackX && x < rackX + rackW && y >= rackY) {
      return Math.min(Math.floor((x - rackX) / rackTileW), match.dealCount);
    }
    return -1;
  }

  async function doPointerDown(ev) {
    if (messageText) {
      return;
    }
    if (scene === TITLE) {
      const pt = getPointer(ev);
      if (isRectContains(startButtonRect, pt)) {
        doStart();
      } else if (isRectContains(homeButtonRect, pt)) {
        location.href = '../';
      } else if (isRectContains(reloadButtonRect, pt)) {
        location.reload();
      } else if (isRectContains(playerSelectRect, pt)) {
        settings.playerCount = playerCounts[Math.floor((pt[0] - playerSelectRect[0]) / playerOptionW)];
      } else if (isRectContains(dealSelectRect, pt)) {
        settings.dealCount = dealCounts[Math.floor((pt[0] - dealSelectRect[0]) / dealOptionW)];
      } else if (isRectContains(roundSelectRect, pt)) {
        settings.roundCount = roundCounts[Math.floor((pt[0] - roundSelectRect[0]) / roundOptionW)];
      }
      updateCanvas();
    } else if (scene === PLAYING) {
      const currentBase = match.getCurrentGame().getCurrentBase();
      if (currentBase?.playerIndex === match.manualPlayerIndex) {
        const pt = getPointer(ev);
        if (isRectContains(tableButtonRect, pt)) {
          if (confirm(T('Leave the game?'))) {
            doTitle();
          }
        } else if (isRectContains(rackButtonRect, pt)) {
          if (currentBase.canWin()) {
            doWinFromStock();
          } else if (currentBase.isReachable() || currentBase.isReaching()) {
            currentBase.setReaching(!currentBase.isReaching());
            updateCanvas();
          }
        } else {
          selectedTileIndex = getTileIndex(pt);
          updateCanvas();
        }
      }
    } else if (scene === FINISHED) {
      if (match.getCurrentGame().winnerBaseIndex >= 0) {
        scene = HANDS;
        updateCanvas();
      } else {
        doNext();
      }
    } else if (scene === HANDS) {
      doNext();
    } else if (scene === RESULTS) {
      doTitle();
    }
  }

  function doPointerMove(ev) {
    if (scene === PLAYING) {
      if (selectedTileIndex >= 0) {
        selectedTileIndex = getTileIndex(getPointer(ev));
        updateCanvas();
      }
    }
  }

  function doPointerUp() {
    if (scene === PLAYING) {
      if (selectedTileIndex >= 0) {
        const currentBase = match.getCurrentGame().getCurrentBase();
        if (currentBase.playerIndex === match.manualPlayerIndex) {
          const tile = currentBase.concealedTiles[selectedTileIndex];
          if (!currentBase.isReaching() || currentBase.isTileReachable(tile)) {
            doDiscard(tile);
          }
        }
        selectedTileIndex = -1;
        updateCanvas();
      }
    }
  }

  doTitle();
});
