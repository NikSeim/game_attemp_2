let tg = window.Telegram.WebApp;
tg.expand();

const originalWorldSize = 20;
const displayWorldSize = 5;
let playerX = Math.floor(originalWorldSize / 2);
let playerY = Math.floor(originalWorldSize / 2);
let coins = 0;
let steps = 150;
let world = [];
let visibleCells = Array.from({ length: originalWorldSize }, () => Array(originalWorldSize).fill(false));
let gameInitialized = false;
let preMiniGameState = null;
let returningFromMiniGame = false;
let coinPosition = { x: 0, y: 0 };

function saveGameState() {
    const gameState = {
        playerX,
        playerY,
        coins,
        steps,
        world,
        visibleCells,
        coinPosition
    };
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const savedGameState = localStorage.getItem('gameState');
    if (savedGameState) {
        const gameState = JSON.parse(savedGameState);
        playerX = gameState.playerX;
        playerY = gameState.playerY;
        coins = gameState.coins;
        steps = gameState.steps;
        world = gameState.world;
        visibleCells = gameState.visibleCells;
        coinPosition = gameState.coinPosition;

        if (returningFromMiniGame) {
            playerX = coinPosition.x;
            playerY = coinPosition.y;
            steps--;
            returningFromMiniGame = false;
        }

        world[playerY][playerX] = 'player';
        updateVisibility();
        renderWorld();
    }
}

function savePreMiniGameState() {
    preMiniGameState = {
        playerX,
        playerY,
        coins,
        steps,
        world: JSON.parse(JSON.stringify(world)),
        visibleCells: JSON.parse(JSON.stringify(visibleCells)),
        coinPosition: { ...coinPosition }
    };
}

function initWorld(loadSavedState = true) {
    if (loadSavedState) {
        loadGameState();
    }
    if (!gameInitialized || !loadSavedState) {
        world = Array.from({ length: originalWorldSize }, () => Array(originalWorldSize).fill(0));
        for (let i = 0; i < 50; i++) {
            let x = Math.floor(Math.random() * originalWorldSize);
            let y = Math.floor(Math.random() * originalWorldSize);
            if (world[y][x] === 0) world[y][x] = 'coin';
        }
        world[playerY][playerX] = 'player';
        updateVisibility(true);
        renderWorld();
        gameInitialized = true;
    }
}

function updateStepCounter() {
    document.getElementById('step-counter').textContent = `${steps}/150`;
}

function updateVisibility(initial = false) {
    let range = initial ? 1 : 1;
    for (let y = playerY - range; y <= playerY + range; y++) {
        for (let x = playerX - range; x <= playerX + range; x++) {
            if (y >= 0 && y < originalWorldSize && x >= 0 && x < originalWorldSize) visibleCells[y][x] = true;
        }
    }
}

function renderWorld() {
    const gameWorld = document.getElementById('game-world');
    gameWorld.innerHTML = '';

    const startX = Math.max(0, Math.min(playerX - Math.floor(displayWorldSize / 2), originalWorldSize - displayWorldSize));
    const startY = Math.max(0, Math.min(playerY - Math.floor(displayWorldSize / 2), originalWorldSize - displayWorldSize));

    for (let y = startY; y < startY + displayWorldSize; y++) {
        for (let x = startX; x < startX + displayWorldSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (world[y][x] === 'player') {
                const playerDiv = document.createElement('div');
                playerDiv.classList.add('player');
                const img = document.createElement('img');
                img.src = 'image/xyeta.jpg';
                playerDiv.appendChild(img);
                cell.appendChild(playerDiv);
            } else if (world[y][x] === 'coin') {
                const coinDiv = document.createElement('div');
                coinDiv.classList.add('coin');
                cell.appendChild(coinDiv);
            }
            const fog = document.createElement('div');
            fog.classList.add('fog');
            if (!visibleCells[y][x]) fog.style.display = 'block';
            cell.appendChild(fog);
            cell.addEventListener('click', () => handleCellClick(x, y));
            gameWorld.appendChild(cell);
        }
    }
    document.getElementById('token-count').textContent = coins;
    updateStepCounter();
}

function handleCellClick(x, y) {
    const dx = x - playerX;
    const dy = y - playerY;
    if (steps > 0 && ((Math.abs(dx) === 1 && dy === 0) || (dx === 0 && Math.abs(dy) === 1))) {
        movePlayer(dx, dy);
    }
}

function movePlayer(dx, dy) {
    let newX = playerX + dx;
    let newY = playerY + dy;
    if (newX >= 0 && newX < originalWorldSize && newY >= 0 && newY < originalWorldSize) {
        if (world[newY][newX] === 'coin') {
            coinPosition = { x: newX, y: newY };
            world[playerY][playerX] = 0;
            playerX = newX;
            playerY = newY;
            world[playerY][playerX] = 'player';
            savePreMiniGameState();
            world[newY][newX] = 0;
            returningFromMiniGame = true;
            saveGameState();
            launchFourthMiniGame();
        } else {
            world[playerY][playerX] = 0;
            playerX = newX;
            playerY = newY;
            world[playerY][playerX] = 'player';
            steps--;
            updateVisibility();
            saveGameState();
            renderWorld();
        }
    }
}

function launchFourthMiniGame() {
    savePreMiniGameState();
    returningFromMiniGame = true;
    saveGameState();
    const miniGameUrl = `html/game4.html`;
    window.location.href = miniGameUrl;
}

document.getElementById('game-tab').addEventListener('click', showGameTab);
document.getElementById('friends-tab').addEventListener('click', showFriendsTab);
document.getElementById('tasks-tab').addEventListener('click', showTasksTab);

function hideAllTabs() {
    document.getElementById('game-world').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('new-game').style.display = 'none';
    document.getElementById('score').style.display = 'none';
    document.getElementById('friends-content').style.display = 'none';
    document.getElementById('tasks-content').style.display = 'none';
}

function showGameTab() {
    hideAllTabs();
    document.getElementById('game-world').style.display = 'grid';
    document.getElementById('controls').style.display = 'flex';
    document.getElementById('new-game').style.display = 'block';
    document.getElementById('score').style.display = 'flex';
}

function showFriendsTab() {
    hideAllTabs();
    document.getElementById('friends-content').style.display = 'block';
}

function showTasksTab() {
    hideAllTabs();
    document.getElementById('tasks-content').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
    hideAllTabs();
    showGameTab();

    loadGameState();
});

// Обработка события coinsEarned для добавления монет


document.addEventListener('DOMContentLoaded', () => {
    // Получаем заработанные монеты из localStorage
    const earnedCoins = parseInt(localStorage.getItem('earnedCoins') || '0', 10);
    
    if (earnedCoins > 0) {
        coins += earnedCoins; // Добавляем заработанные монеты к общему счету
        document.getElementById('token-count').textContent = coins; // Обновляем отображение монет
        localStorage.removeItem('earnedCoins'); // Удаляем из localStorage после использования
        saveGameState(); // Сохраняем обновленное состояние игры
    }
});



document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('gameState');
    preMiniGameState = null;
    returningFromMiniGame = false;
    playerX = Math.floor(originalWorldSize / 2);
    playerY = Math.floor(originalWorldSize / 2);
    steps = 150;
    visibleCells = Array.from({ length: originalWorldSize }, () => Array(originalWorldSize).fill(false));
    gameInitialized = false;
    initWorld(false);
});

initWorld();
