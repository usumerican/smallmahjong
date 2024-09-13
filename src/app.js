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

on(window, 'DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas');
  const matrix = [1, 0, 0, 1, 0, 0];
  let lastFrameTime;
  let stageX, stageY, stageW, stageH;
  let lineH;

  const HOME = 0;
  const PLAYING = 1;
  const FINISHED = 2;
  const HANDS = 3;
  const RESULTS = 4;
  let scene;

  const playerCounts = [1, 2, 3, 4];
  const dealCounts = [4, 7, 10, 13];
  const roundCounts = [0, 1, 2, 4];
  let playerSelectRect, playerOptionW;
  let dealSelectRect, dealOptionW;
  let roundSelectRect, roundOptionW;
  let startButtonRect, reloadButtonRect, sourceButtonRect;

  const thinkTime = 200;
  let match;
  let playerPositions;
  let currentTileIndex;
  let manualWinnable;

  const tileRatio = 1.2;
  const discardedCol = 7;
  let tableTileW, tableTileH;
  let tableX, tableY, tableW, tableH;
  let tableCy;
  let rackTileW, rackTileH;
  let rackY, rackH;
  let quitButtonRect;
  let reachButtonRect;

  const messageResolveSet = new Set();
  let messageText;
  let messagePosition;
  let messagePoints;

  const settingsKey = 'smallmahjong';
  const settings = JSON.parse(localStorage.getItem(settingsKey)) || {};
  if (!(settings.playerSelectedIndex in playerCounts)) {
    settings.playerSelectedIndex = 1;
  }
  if (!(settings.dealSelectedIndex in playerCounts)) {
    settings.dealSelectedIndex = 1;
  }
  if (!(settings.roundSelectedIndex in playerCounts)) {
    settings.roundSelectedIndex = 1;
  }

  function formatRoundGame() {
    return match.isFinalGame()
      ? 'Final'
      : `${Math.ceil(match.games.length / match.playerCount)} - ${((match.games.length - 1) % match.playerCount) + 1}`;
  }

  function fillDoubleText(context, text1, text2, cx, cy) {
    context.save();
    try {
      context.textBaseline = 'bottom';
      context.fillText(text1, cx, cy);
      context.textBaseline = 'top';
      context.fillText(text2, cx, cy);
    } finally {
      context.restore();
    }
  }

  function renderTile(context, tile, cx, cy, w, h, angle, selected, disabled) {
    context.save();
    try {
      context.translate(cx, cy);
      if (angle) {
        context.rotate(angle);
      }
      context.fillStyle = tile ? (disabled ? '#ccc' : selected ? '#ff0' : '#fff') : '#fd0';
      context.fillRect(-w / 2, -h / 2, w, h);
      context.strokeStyle = '#000';
      context.strokeRect(-w / 2, -h / 2, w, h);
      if (tile) {
        const suit = getTileSuit(tile);
        context.fillStyle = ['#f00', '#090', '#00f'][suit - 1];
        context.font = Math.ceil(w * 0.5) + 'px "Verdana", sans-serif';
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

  function renderResults(context) {
    const cellW = 3 * lineH;
    const gridX = ((1 - match.playerCount) * cellW) / 2;
    const gameCount = match.games.length;
    let y = -((3 + gameCount) * lineH) / 2;
    context.font = Math.ceil(lineH * 0.8) + 'px sans-serif';
    context.textAlign = 'right';
    for (let i = 0; i < match.playerCount; i++) {
      context.fillText(match.players[i].name, gridX + cellW * (1 + i), y);
    }
    y += lineH;
    for (let i = 0; i < gameCount; i++) {
      const game = match.games[i];
      context.fillText(i + 1, gridX, y);
      for (const base of game.bases) {
        context.fillText(base.gameScore, gridX + cellW * (1 + base.playerIndex), y);
      }
      y += lineH;
    }
    context.fillText('Total', gridX, y);
    for (const base of match.games[match.games.length - 1].bases) {
      const x = gridX + cellW * (1 + base.playerIndex);
      context.fillText(base.matchScore + base.gameScore, x, y);
      context.fillText('#' + base.place, x, y + lineH);
    }
  }

  function renderHands(context) {
    const currentGame = match.getCurrentGame();
    const handCount = currentGame.winningHands.length;
    const h = rackTileH + (5 + handCount + match.playerCount) * lineH;
    let y = -h / 2 + lineH;
    context.font = Math.ceil(lineH * 0.8) + 'px sans-serif';
    context.fillStyle = 'white';
    context.fillText(
      formatRoundGame() +
        ': ' +
        match.players[currentGame.bases[currentGame.winnerBaseIndex].playerIndex].name +
        ' won from ' +
        (currentGame.loserBaseIndex >= 0
          ? match.players[currentGame.bases[currentGame.loserBaseIndex].playerIndex].name
          : 'Stock'),
      0,
      y,
    );

    y += lineH + rackTileH / 2;
    for (let i = 0; i < currentGame.readyTiles.length; i++) {
      renderTile(context, currentGame.readyTiles[i], rackTileW * (-match.dealCount / 2 + i), y, rackTileW, rackTileH);
    }
    renderTile(context, currentGame.winningTile, rackTileW * (match.dealCount / 2), y, rackTileW, rackTileH);

    y += rackTileH / 2 + lineH;
    context.textAlign = 'right';
    for (let i = 0; i < handCount; i++) {
      const hand = currentGame.winningHands[i];
      context.fillText(getHandName(hand), lineH, y);
      context.fillText(getHandScore(hand, match.dealCount), 3 * lineH, y);
      y += lineH;
    }
    context.fillText('Total', lineH, y);
    context.fillText(currentGame.handsScore, 3 * lineH, y);

    y += 2 * lineH;
    for (const base of currentGame.bases) {
      const py = y + base.playerIndex * lineH;
      context.fillText(match.players[base.playerIndex].name, -4 * lineH, py);
      context.fillText(base.matchScore, -2 * lineH, py);
      context.fillText((base.gameScore > 0 ? '+' : '') + base.gameScore + ' = ', 2 * lineH, py);
      context.fillText(base.matchScore + base.gameScore, 4 * lineH, py);
      context.fillText('#' + base.place, 6 * lineH, py);
    }
  }

  function renderHome(context) {
    const labelX = -4 * lineH;
    const playerCy = getRectCenterY(playerSelectRect);
    context.fillText('Players', labelX, playerCy);
    for (let i = 0; i < playerCounts.length; i++) {
      const optionX = playerSelectRect[0] + playerOptionW * i;
      if (i === settings.playerSelectedIndex) {
        context.strokeRect(optionX, playerCy - playerSelectRect[3] / 2, playerOptionW, playerSelectRect[3]);
      }
      context.fillText(playerCounts[i], optionX + playerOptionW / 2, playerCy);
    }

    const dealCy = getRectCenterY(dealSelectRect);
    context.fillText('Tiles', labelX, dealCy);
    for (let i = 0; i < dealCounts.length; i++) {
      const optionX = dealSelectRect[0] + dealOptionW * i;
      if (i === settings.dealSelectedIndex) {
        context.strokeRect(optionX, dealCy - dealSelectRect[3] / 2, dealOptionW, dealSelectRect[3]);
      }
      context.fillText(dealCounts[i], optionX + dealOptionW / 2, dealCy);
    }

    const roundCy = getRectCenterY(roundSelectRect);
    context.fillText('Rounds', labelX, roundCy);
    for (let i = 0; i < roundCounts.length; i++) {
      const optionX = roundSelectRect[0] + roundOptionW * i;
      if (i === settings.roundSelectedIndex) {
        context.strokeRect(optionX, roundCy - roundSelectRect[3] / 2, roundOptionW, roundSelectRect[3]);
      }
      context.fillText(roundCounts[i], optionX + roundOptionW / 2, roundCy);
    }

    context.strokeRect(...startButtonRect);
    context.fillText('Start', getRectCenterX(startButtonRect), getRectCenterY(startButtonRect));
    context.strokeRect(...reloadButtonRect);
    context.fillText('Reload', getRectCenterX(reloadButtonRect), getRectCenterY(reloadButtonRect));
    context.strokeRect(...sourceButtonRect);
    context.fillText('Source', getRectCenterX(sourceButtonRect), getRectCenterY(sourceButtonRect));

    context.font = Math.ceil(lineH * 2) + 'px sans-serif';
    context.fillText('Small Mahjong', 0, -6 * lineH);
  }

  function renderCanvas(context) {
    context.fillStyle = '#060';
    context.fillRect(stageX, stageY, stageW, stageH);
    context.font = Math.ceil(lineH * 0.8) + 'px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#fff';
    context.strokeStyle = '#fff';

    if (scene === HOME) {
      renderHome(context);
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
    context.font = Math.ceil(tableTileH * 0.5) + 'px sans-serif';
    fillDoubleText(context, formatRoundGame(), currentGame.stockTiles.length, 0, tableCy);
    context.strokeRect(...quitButtonRect);
    for (let baseIndex = 0; baseIndex < currentGame.bases.length; baseIndex++) {
      const base = currentGame.bases[baseIndex];
      const player = match.players[base.playerIndex];
      const [x, y] = [
        [0, tableCy + 2.5 * tableTileW],
        [2.5 * tableTileW, tableCy],
        [0, tableCy - 2.5 * tableTileW],
        [-2.5 * tableTileW, tableCy],
      ][playerPositions[base.playerIndex]];
      context.fillStyle = baseIndex === currentGame.currentBaseIndex ? '#0ff' : '#fff';
      fillDoubleText(context, player.name, base.matchScore, x, y);
    }

    const manualBaseIndex = currentGame.bases.findIndex((base) => base.playerIndex === match.manualPlayerIndex);
    const manualBase = currentGame.bases[manualBaseIndex];
    for (let concealedIndex = 0; concealedIndex < manualBase.concealedTiles.length; concealedIndex++) {
      const tile = manualBase.concealedTiles[concealedIndex];
      const cx = rackTileW * (-match.dealCount / 2 + concealedIndex);
      const cy = rackY + rackTileH / 2;
      renderTile(
        context,
        tile,
        cx,
        cy,
        rackTileW,
        rackTileH,
        0,
        concealedIndex === currentTileIndex || manualBaseIndex === currentGame.winnerBaseIndex,
        manualBase.isReaching() && !manualBase.isTileReachable(tile),
      );
    }

    for (let baseIndex = 0; baseIndex < currentGame.bases.length; baseIndex++) {
      const base = currentGame.bases[baseIndex];
      context.save();
      try {
        context.translate(0, tableCy);
        const position = playerPositions[base.playerIndex];
        if (position) {
          context.rotate([0, 1.5 * Math.PI, Math.PI, 0.5 * Math.PI][position]);
          for (let concealedIndex = 0; concealedIndex < base.concealedTiles.length; concealedIndex++) {
            const cx = tableTileW * (-match.dealCount / 2 + concealedIndex);
            const cy = (tableH - tableTileH) / 2;
            renderTile(
              context,
              scene === FINISHED ? base.concealedTiles[concealedIndex] : 0,
              cx,
              cy,
              tableTileW,
              tableTileH,
              0,
              baseIndex === currentGame.winnerBaseIndex,
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
            baseIndex === currentGame.loserBaseIndex && discardedIndex === base.discardedTiles.length - 1,
          );
        }
      } finally {
        context.restore();
      }
    }

    const currentBase = currentGame.getCurrentBase();
    if (currentBase && currentBase.playerIndex === match.manualPlayerIndex) {
      if ((currentBase.isReachable() || currentBase.isReaching()) && !currentBase.isReached()) {
        context.fillStyle = currentBase.isReaching() ? '#f0f' : '#0ff';
        context.fillRect(...reachButtonRect);
        context.fillStyle = '#000';
        context.fillText(
          currentBase.isReachable() ? 'Reach?' : 'Cancel?',
          getRectCenterX(reachButtonRect),
          getRectCenterY(reachButtonRect),
        );
      }
      if (manualWinnable) {
        context.fillStyle = '#ff0';
        context.fillRect(...reachButtonRect);
        context.fillStyle = '#000';
        context.fillText('Win?', getRectCenterX(reachButtonRect), getRectCenterY(reachButtonRect));
      }
    }

    if (messageText) {
      context.font = Math.ceil(lineH * 1.2) + 'px sans-serif';
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
    stageW = canvas.width;
    stageH = canvas.height;
    stageX = -stageW / 2;
    stageY = -stageH / 2;
    lineH = Math.min(stageW / 20, stageH / 20);
    matrix[0] = matrix[3] = Math.min(canvas.width / stageW, canvas.height / stageH);
    matrix[4] = canvas.width / 2;
    matrix[5] = canvas.height / 2;

    playerSelectRect = [0, -4 * lineH, lineH * 8, lineH * 2];
    playerOptionW = playerSelectRect[2] / playerCounts.length;
    dealSelectRect = [0, -lineH, lineH * 8, lineH * 2];
    dealOptionW = dealSelectRect[2] / dealCounts.length;
    roundSelectRect = [0, 2 * lineH, lineH * 8, lineH * 2];
    roundOptionW = roundSelectRect[2] / roundCounts.length;
    startButtonRect = [-stageW / 4, 5 * lineH, stageW / 2, lineH * 3];
    reloadButtonRect = [-stageW / 2, 5 * lineH, stageW / 4, lineH * 3];
    sourceButtonRect = [stageW / 4, 5 * lineH, stageW / 4, lineH * 3];

    if (match) {
      const tileW = stageW / 15;
      const tileH = tileW * tileRatio;
      tableW = Math.min(stageW, stageH - tileH - lineH);
      tableH = tableW;
      tableTileW = tableW / (14 + 2 * tileRatio);
      tableTileH = tableTileW * tileRatio;
      rackTileW = Math.min((stageW - lineH) / (match.dealCount + 1), (stageH - tableH - lineH) / tileRatio);
      rackTileH = rackTileW * tileRatio;
      rackH = rackTileH + lineH;
      rackY = (tableH + rackH) / 2 - rackH;
      tableX = -tableW / 2;
      tableY = rackY - tableH;
      tableCy = tableY + tableH / 2;
      messagePoints = [
        [0, tableCy + tableH / 2],
        [tableW / 2, tableCy],
        [0, tableCy - tableH / 2],
        [-tableW / 2, tableCy],
        [0, tableCy],
      ];
      quitButtonRect = [-1.5 * tableTileW, tableCy - 1.5 * tableTileW, 3 * tableTileW, 3 * tableTileW];
      reachButtonRect = [
        (rackTileW * (match.dealCount + 1)) / 2 - 4 * lineH,
        rackY - 2.5 * lineH,
        4 * lineH,
        2 * lineH,
      ];
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
        messageText = player.name + ': ' + text;
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
    if (match.isFinalGame()) {
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
    manualWinnable = false;
    await showMessage(currentGame.getCurrentBase().playerIndex, 'Win from Stock');
    scene = FINISHED;
    updateCanvas();
  }

  async function doDiscard(tile) {
    manualWinnable = false;
    const currentGame = match.getCurrentGame();
    const currentBase = currentGame.getCurrentBase();
    const reaching = currentBase.isReaching();
    currentGame.discardTile(tile);
    if (reaching) {
      await showMessage(currentGame.getCurrentBase().playerIndex, 'Reach');
    }
    for (let i = 1; i < match.playerCount; i++) {
      const baseIndex = (currentGame.currentBaseIndex + i) % match.playerCount;
      const base = currentGame.bases[baseIndex];
      if (base.isReached() && currentGame.canWin(baseIndex, tile)) {
        match.winGame(baseIndex, currentGame.currentBaseIndex, tile);
        await showMessage(base.playerIndex, 'Win from ' + match.players[currentBase.playerIndex].name);
        scene = FINISHED;
        updateCanvas();
        return;
      }
    }
    if (!currentGame.stockTiles.length) {
      currentGame.updatePlaces();
      scene = FINISHED;
      await showMessage(-1, 'Draw');
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
    const winnable = currentGame.canWin(currentGame.currentBaseIndex, tile);
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
          const t = currentGame.think();
          if (currentBase.isTileReachable(t)) {
            currentBase.setReaching(true);
          }
          doDiscard(t);
        }, thinkTime);
      }
      return;
    }
    manualWinnable = winnable;
  }

  async function doStarting() {
    currentTileIndex = -1;
    scene = PLAYING;
    await showMessage(-1, formatRoundGame());
    doDraw();
  }

  function doStart() {
    match = new Match();
    match.playerCount = playerCounts[settings.playerSelectedIndex];
    match.dealCount = dealCounts[settings.dealSelectedIndex];
    match.roundCount = roundCounts[settings.roundSelectedIndex];
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

  function doHome() {
    scene = HOME;
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
    if (y >= rackY) {
      const i = Math.floor((x + (rackTileW * (match.dealCount + 1)) / 2) / rackTileW);
      if (i >= 0 && i <= match.dealCount) {
        return i;
      }
    }
    return -1;
  }

  function doPointerDown(ev) {
    if (scene === HOME) {
      const pt = getPointer(ev);
      if (isRectContains(startButtonRect, pt)) {
        doStart();
        return;
      } else if (isRectContains(reloadButtonRect, pt)) {
        location.reload();
        return;
      } else if (isRectContains(sourceButtonRect, pt)) {
        location.href = 'https://github.com/usumerican/smallmahjong';
        return;
      }
      if (isRectContains(playerSelectRect, pt)) {
        settings.playerSelectedIndex = Math.floor((pt[0] - playerSelectRect[0]) / playerOptionW);
      } else if (isRectContains(dealSelectRect, pt)) {
        settings.dealSelectedIndex = Math.floor((pt[0] - dealSelectRect[0]) / dealOptionW);
      } else if (isRectContains(roundSelectRect, pt)) {
        settings.roundSelectedIndex = Math.floor((pt[0] - roundSelectRect[0]) / roundOptionW);
      }
      updateCanvas();
      return;
    }

    if (scene === PLAYING) {
      const pt = getPointer(ev);
      if (isRectContains(quitButtonRect, pt)) {
        if (confirm('Quit game?')) {
          doHome();
        }
        return;
      }
      const currentBase = match.getCurrentGame().getCurrentBase();
      if (currentBase?.playerIndex === match.manualPlayerIndex) {
        if (isRectContains(reachButtonRect, pt)) {
          if (currentBase.isReachable() || currentBase.isReaching()) {
            currentBase.setReaching(!currentBase.isReaching());
            updateCanvas();
          } else if (manualWinnable) {
            doWinFromStock();
          }
          return;
        }
        currentTileIndex = getTileIndex(pt);
        updateCanvas();
      }
      return;
    }

    if (scene === FINISHED) {
      if (match.getCurrentGame().winnerBaseIndex >= 0) {
        scene = HANDS;
        updateCanvas();
      } else {
        doNext();
      }
      return;
    }

    if (scene === HANDS) {
      doNext();
      return;
    }

    if (scene === RESULTS) {
      doHome();
      return;
    }
  }

  function doPointerMove(ev) {
    if (scene === PLAYING) {
      if (currentTileIndex >= 0) {
        currentTileIndex = getTileIndex(getPointer(ev));
        updateCanvas();
      }
    }
  }

  function doPointerUp() {
    if (scene === PLAYING) {
      if (currentTileIndex >= 0) {
        const currentBase = match.getCurrentGame().getCurrentBase();
        if (currentBase.playerIndex === match.manualPlayerIndex) {
          const tile = currentBase.concealedTiles[currentTileIndex];
          if (!currentBase.isReaching() || currentBase.isTileReachable(tile)) {
            doDiscard(tile);
          }
        }
        currentTileIndex = -1;
        updateCanvas();
      }
    }
  }

  doHome();
});
