const gameArea = document.getElementById('game-area');
const exitButton = document.getElementById('exit');
const roundCounter = document.getElementById('round-counter');
const timerDisplay = document.getElementById('timer');
const successCounter = document.getElementById('success-counter');
const gridSize = 6;
let path = [];
let userPath = [];
let gameInProgress = false;
let round = 0;
let rounds = 3;
let memorizationTime = 3; // Time to memorize the path
let timeLimit = 15; // Time limit for each round
let timeLeft;
let timerInterval;
let successfulRounds = 0; // Number of successful rounds
let coinsEarned = 0; // Total coins earned

// Exit button event
exitButton.addEventListener('click', () => {
    endGame();
    window.location.href = '../index.html';
});

// Initialize game area
for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = `${i}-${j}`;
        cell.addEventListener('click', handleCellClick);
        gameArea.appendChild(cell);
    }
}

// Start the game
startGame();

function startGame() {
    round = 0;
    successfulRounds = 0;
    coinsEarned = 0;
    updateSuccessCounter();
    startRound();
}

function startRound() {
    round++;
    const cellCount = 5 + round; // 6 cells in Round 1, 7 in Round 2, and 8 in Round 3
    path = generatePattern(cellCount);
    highlightPath();
    updateRoundCounter();
    timeLeft = memorizationTime;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateMemorizationTimer, 1000);
}

function startMemorizationPhase() {
    gameInProgress = false;
    userPath = [];
    timeLeft = memorizationTime;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateMemorizationTimer, 1000);
}

function startUserInputPhase() {
    gameInProgress = true;
    userPath = [];
    timeLeft = timeLimit;
    updateTimerDisplay();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateRoundTimer, 1000);
}

// Generate a random pattern
function generatePattern(cellCount) {
    const path = [];
    while (path.length < cellCount) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        const index = `${x}-${y}`;
        if (!path.includes(index)) {
            path.push(index);
        }
    }
    return path;
}

function highlightPath() {
    path.forEach(index => {
        const cell = document.querySelector(`.cell[data-index='${index}']`);
        cell.classList.add('highlight');
    });
}

function clearHighlight() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('highlight');
    });
}

function clearAllSelections() {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('selected');
    });
}

function handleCellClick(event) {
    if (!gameInProgress) return;

    const index = event.target.dataset.index;

    if (!userPath.includes(index)) {
        userPath.push(index);
        event.target.classList.add('selected');
    }

    if (userPath.length === path.length) {
        setTimeout(checkUserPath, 200);
    }
}

function checkUserPath() {
    // Check if all user-selected cells match the pattern (order does not matter)
    const isCorrect = userPath.length === path.length && userPath.every(cell => path.includes(cell));

    endRound(isCorrect);
}

function endRound(success) {
    clearInterval(timerInterval);
    gameInProgress = false;
    clearHighlight();
    clearAllSelections();

    if (success) {
        successfulRounds++;
        coinsEarned += 15;
        updateSuccessCounter();
    }

    if (round >= rounds) {
        showEndGameMenu(); // Show the endgame menu after the last round
    } else {
        setTimeout(startRound, 1000); // Start the next round after a delay
    }
}

function endGame() {
    updateCoins(coinsEarned); 
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 1000);
}

function updateMemorizationTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        clearInterval(timerInterval);
        clearHighlight();
        startUserInputPhase();
    }
}

function updateRoundTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        updateTimerDisplay();
    } else {
        endRound(false);
    }
}

function updateRoundCounter() {
    roundCounter.textContent = `Round ${round}/${rounds}`;
}

function updateSuccessCounter() {
    successCounter.textContent = `Success ${successfulRounds}/${rounds}`;
}

function updateTimerDisplay() {
    timerDisplay.textContent = timeLeft;
}

function updateCoins(earnedCoins) {
    const savedGameState = localStorage.getItem('gameState');
    let gameState = savedGameState ? JSON.parse(savedGameState) : null;

    localStorage.setItem('earnedCoins', coinsEarned);
}

// Function to display the endgame menu after 3 rounds
function showEndGameMenu() {
    clearGameArea(); // Clear the game area for the endgame menu

    const endGameMenu = document.createElement('div');
    endGameMenu.classList.add('end-game-menu');

    const message = document.createElement('p');
    message.textContent = `You won ${successfulRounds}/3 rounds`;

    const coinsMessage = document.createElement('p');
    coinsMessage.textContent = `You earned ${coinsEarned} coins`;

    const collectButton = document.createElement('button');
    collectButton.textContent = 'Collect';
    collectButton.style.backgroundColor = 'green';
    collectButton.style.color = 'white';
    collectButton.style.padding = '10px 20px';
    collectButton.style.fontSize = '18px';
    collectButton.style.border = 'none';
    collectButton.style.borderRadius = '5px';
    collectButton.style.cursor = 'pointer';

    collectButton.addEventListener('click', () => {
        endGame();
    });

    endGameMenu.appendChild(message);
    endGameMenu.appendChild(coinsMessage);
    endGameMenu.appendChild(collectButton);

    document.body.appendChild(endGameMenu);
}

// Function to clear the game area
function clearGameArea() {
    gameArea.innerHTML = '';
    const endGameMenu = document.querySelector('.end-game-menu');
    endGameMenu.remove();
}
