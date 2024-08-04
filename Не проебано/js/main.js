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
let preMiniGameState = null; // Variable to store game state before mini game
let returningFromMiniGame = false; // Variable to track if returning from mini game
let coinPosition = { x: 0, y: 0 }; // Variable to store the position of the collected coin

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
            // Place the player on the position of the collected coin
            playerX = coinPosition.x;
            playerY = coinPosition.y;
            steps--; // Deduct one step when returning from mini game
            returningFromMiniGame = false; // Reset the flag
        }

        // Ensure the player's position is updated in the world
        world[playerY][playerX] = 'player';
        
        updateVisibility(); // Update visibility after loading the state
        renderWorld(); // Render the game world after loading the state
    }
}


function savePreMiniGameState() {
    preMiniGameState = {
        playerX,
        playerY,
        coins,
        steps,
        world: JSON.parse(JSON.stringify(world)), // Deep copy of the world array
        visibleCells: JSON.parse(JSON.stringify(visibleCells)), // Deep copy of visibleCells array
        coinPosition: { ...coinPosition } // Save coin position
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
            coins++; // Increase coins by 1 on collecting a coin
            coinPosition = { x: newX, y: newY }; // Save the position of the collected coin
            world[playerY][playerX] = 0; // Remove player from the old position
            playerX = newX; // Move player to the coin's position
            playerY = newY;
            world[playerY][playerX] = 'player'; // Place player on the new position
            savePreMiniGameState(); // Save the pre-mini game state before launching the mini game
            world[newY][newX] = 0; // Remove the coin from the world
            returningFromMiniGame = true; // Set the flag indicating returning from mini game
            saveGameState(); // Save the game state before launching the mini game
            // Launch the first mini game when a coin is collected
            launchMiniGame();
        } else {
            world[playerY][playerX] = 0;
            playerX = newX;
            playerY = newY;
            world[playerY][playerX] = 'player';
            steps--;
            updateVisibility();
            saveGameState(); // Save the game state after player moves
            renderWorld();
        }
    }
}

// Function to launch the first mini game
function launchMiniGame() {
    const miniGameUrl = `html/game1.html`; // Always navigate to the first mini game
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
    loadGameState(); // Load the game state when the page is loaded
    hideAllTabs();
    showGameTab();
});

document.getElementById('new-game').addEventListener('click', () => {
    localStorage.removeItem('gameState'); // Clear saved game state
    preMiniGameState = null; // Clear pre-mini game state
    returningFromMiniGame = false; // Reset the flag
    playerX = Math.floor(originalWorldSize / 2);
    playerY = Math.floor(originalWorldSize / 2);
    steps = 150;
    visibleCells = Array.from({ length: originalWorldSize }, () => Array(originalWorldSize).fill(false));
    gameInitialized = false;
    initWorld(false); // Initialize a new game
});

initWorld();
