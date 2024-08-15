const gameArea = document.getElementById('game-area');
const background = document.getElementById('background');
const player = document.getElementById('player');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const exitButton = document.getElementById('exit');
const ground = document.getElementById('ground');
const gameContainer = document.getElementById('game3-container');

let score = 0;
let isJumping = false;
let isCrouching = false;
let velocityY = 0;
const gravity = 1.2;
let obstacles = [];
let gameInterval;
let timerInterval;
let backgroundInterval;
let timeLeft = 60;
const initialVelocityY = 20;
let groundSpeed = 11;
let obstacleSpeed = 11;
let backgroundSpeed = 4;
const initialGroundSpeed = 11;
const initialObstacleSpeed = 11;
const initialBackgroundSpeed = 4;
let gameOver = false;
let attempts = 0;
let enemyVisible = false;
let ammoInterval;
let hasStarted = false; // Флаг, указывающий, была ли игра запущена впервые

function createModals() {
    const gameOverModal = document.createElement('div');
    gameOverModal.id = 'game-over-modal';
    gameOverModal.style.position = 'absolute';
    gameOverModal.style.top = '50%';
    gameOverModal.style.left = '50%';
    gameOverModal.style.transform = 'translate(-50%, -50%)';
    gameOverModal.style.width = '50%';
    gameOverModal.style.height = '50%';
    gameOverModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverModal.style.color = 'white';
    gameOverModal.style.display = 'flex';
    gameOverModal.style.flexDirection = 'column';
    gameOverModal.style.alignItems = 'center';
    gameOverModal.style.justifyContent = 'center';
    gameOverModal.style.borderRadius = '10px';
    gameOverModal.style.zIndex = '1000';
    gameOverModal.style.display = 'none';

    const attemptsMessage = document.createElement('p');
    attemptsMessage.id = 'attempts-message';
    attemptsMessage.textContent = 'Попытки: 1/3';

    const retryButton = document.createElement('button');
    retryButton.id = 'retry-button';
    retryButton.textContent = 'Попробовать еще раз';
    retryButton.style.margin = '10px';
    retryButton.style.padding = '10px 20px';
    retryButton.style.fontSize = '18px';
    retryButton.style.cursor = 'pointer';
    retryButton.style.border = 'none';
    retryButton.style.borderRadius = '5px';
    retryButton.style.backgroundColor = 'green';
    retryButton.style.color = 'white';

    const exitGameButton = document.createElement('button');
    exitGameButton.id = 'exit-game-button';
    exitGameButton.textContent = 'Выйти из игры';
    exitGameButton.style.margin = '10px';
    exitGameButton.style.padding = '10px 20px';
    exitGameButton.style.fontSize = '18px';
    exitGameButton.style.cursor = 'pointer';
    exitGameButton.style.border = 'none';
    exitGameButton.style.borderRadius = '5px';
    exitGameButton.style.backgroundColor = 'red';
    exitGameButton.style.color = 'white';

    retryButton.addEventListener('click', () => {
        if (attempts < 3) {
            hideModal('game-over-modal');
            restartGame();
        }
    });

    exitGameButton.addEventListener('click', () => {
        saveGameResult();
        window.location.href = '../index.html';
    });

    gameOverModal.appendChild(attemptsMessage);
    gameOverModal.appendChild(retryButton);
    gameOverModal.appendChild(exitGameButton);
    document.body.appendChild(gameOverModal);

    const winModal = document.createElement('div');
    winModal.id = 'win-modal';
    winModal.style.position = 'absolute';
    winModal.style.top = '50%';
    winModal.style.left = '50%';
    winModal.style.transform = 'translate(-50%, -50%)';
    winModal.style.width = '50%';
    winModal.style.height = '50%';
    winModal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    winModal.style.color = 'white';
    winModal.style.display = 'flex';
    winModal.style.flexDirection = 'column';
    winModal.style.alignItems = 'center';
    winModal.style.justifyContent = 'center';
    winModal.style.borderRadius = '10px';
    winModal.style.zIndex = '1000';
    winModal.style.display = 'none';

    const winMessage = document.createElement('p');
    winMessage.id = 'win-message';
    winMessage.style.fontSize = '24px';
    winMessage.style.marginBottom = '20px';

    const collectButton = document.createElement('button');
    collectButton.id = 'collect-button';
    collectButton.textContent = 'Забрать';
    collectButton.style.margin = '10px';
    collectButton.style.padding = '10px 20px';
    collectButton.style.fontSize = '18px';
    collectButton.style.cursor = 'pointer';
    collectButton.style.border = 'none';
    collectButton.style.borderRadius = '5px';
    collectButton.style.backgroundColor = 'green';
    collectButton.style.color = 'white';

    collectButton.addEventListener('click', () => {
        saveGameResult();
        window.location.href = '../index.html';
    });

    winModal.appendChild(winMessage);
    winModal.appendChild(collectButton);
    document.body.appendChild(winModal);
}

document.addEventListener('DOMContentLoaded', createModals);

exitButton.addEventListener('click', () => {
    saveGameResult();
    window.location.href = '../index.html';
});

function createObstacle(leftPosition) {
    const obstacle = document.createElement('div');
    obstacle.classList.add('obstacle');
    obstacle.style.left = leftPosition + 'px';  // Исправлено
    gameArea.appendChild(obstacle);
    obstacles.push(obstacle);
}

function moveBackground() {
    let backgroundPosition = parseFloat(getComputedStyle(background).backgroundPositionX) || 0;
    backgroundPosition -= backgroundSpeed;
    background.style.backgroundPositionX = backgroundPosition + 'px';  // Исправлено
}

function moveObstacles() {
    if (gameOver) return;

    let groundPosition = parseFloat(ground.style.backgroundPositionX || 0);
    let backgroundPosition = parseFloat(getComputedStyle(background).backgroundPositionX) || 0;

    groundPosition -= groundSpeed;
    backgroundPosition -= backgroundSpeed;

    ground.style.backgroundPositionX = groundPosition + 'px';
    background.style.backgroundPositionX = backgroundPosition + 'px';

    obstacles.forEach((obstacle, index) => {
        const obstacleLeft = parseFloat(obstacle.style.left);
        obstacle.style.left = (obstacleLeft - obstacleSpeed) + 'px';

        if (obstacleLeft < -50) {
            obstacle.remove();
            obstacles.splice(index, 1);
        } else {
            const obstacleRect = obstacle.getBoundingClientRect();
            const playerRect = player.getBoundingClientRect();

            if (obstacleLeft + obstacleSpeed <= playerRect.left && obstacleLeft + obstacleSpeed + obstacleSpeed > playerRect.left) {
                score++;
                scoreElement.textContent = score;
                if (score % 6 === 0) {  // Ускорение каждые 6 очков
                    groundSpeed += 2;
                    obstacleSpeed += 2;
                    backgroundSpeed += 0.5;
                }
            }

            if (
                obstacleRect.left < playerRect.right &&
                obstacleRect.right > playerRect.left &&
                obstacleRect.bottom > playerRect.top &&
                obstacleRect.top < playerRect.bottom
            ) {
                endGame();
            }
        }
    });

    if (timeLeft > 35) {
        const lastObstacleLeft = obstacles.length > 0 ? parseFloat(obstacles[obstacles.length - 1].style.left) : gameArea.clientWidth;
        const randomGap = Math.random() * 500 + 600;  // Изменено значение для randomGap
        if (lastObstacleLeft < gameArea.clientWidth) {
            createObstacle(gameArea.clientWidth + randomGap);
        }
    }
}

function updatePlayerPosition() {
    if (gameOver) return;

    let playerBottom = parseInt(window.getComputedStyle(player).bottom);
    if (isJumping) {
        velocityY -= gravity;
        playerBottom += velocityY;
        if (playerBottom <= 60) {
            playerBottom = 60;
            isJumping = false;
            velocityY = 0;
        }
    }
    player.style.bottom = playerBottom + 'px';  // Исправлено
    requestAnimationFrame(updatePlayerPosition);
}

function jump() {
    if (!isJumping && parseInt(window.getComputedStyle(player).bottom) <= 60) {
        isJumping = true;
        velocityY = initialVelocityY;
    }
}

function crouch() {
    if (!isCrouching) {
        isCrouching = true;
        player.src = '../image/polxyeta.jpg';
        player.style.height = '50px';
        player.style.bottom = '60px';
    }
}

function standUp() {
    if (isCrouching) {
        isCrouching = false;
        player.src = '../image/xyeta.jpg';
        player.style.height = '100px';
        player.style.bottom = '60px';
    }
}

function saveGameResult() {
    const savedGameState = localStorage.getItem('gameState');
    let gameState = savedGameState ? JSON.parse(savedGameState) : { coins: 0 };

    gameState.coins += score;
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function updateTimer() {
    if (gameOver) return;

    timeLeft--;
    timerElement.textContent = timeLeft;

    if (timeLeft <= 0) {
        saveGameResult();
        window.location.href = '../index.html';
        return;
    }

    if (timeLeft <= 35 && timeLeft > 30) {
        const decrementStep = 2 / 5;
        groundSpeed -= decrementStep;
        obstacleSpeed -= decrementStep;
        backgroundSpeed -= 0.5 / 5;
        if (groundSpeed < 0) groundSpeed = 0;
        if (obstacleSpeed < 0) obstacleSpeed = 0;
        if (backgroundSpeed < 0) backgroundSpeed = 0;
    }

    if (timeLeft === 30) {
        showEnemy();
    }

    if (timeLeft === 5) {
        launchBigAmmo();
    }
}

function showEnemy() {
    if (!enemyVisible) {
        const enemy = document.createElement('img');
        enemy.src = '../image/enemy.jpg';
        enemy.id = 'enemy';
        enemy.style.position = 'absolute';
        enemy.style.bottom = '60px';
        enemy.style.right = '24px'; // 24px from the right side
        enemy.style.width = '100px'; // 2 times wider than player (50px * 2)
        enemy.style.height = '150px'; // 1.5 times taller than player (100px * 1.5)
        enemy.style.transform = 'scaleX(-1)';
        enemy.style.opacity = '0';
        enemy.style.transition = 'opacity 3s';
        gameArea.appendChild(enemy);

        setTimeout(() => {
            enemy.style.opacity = '1';
            startShooting();
        }, 100); // Delay to trigger transition

        enemyVisible = true;
    }
}

function startShooting() {
    ammoInterval = setInterval(() => {
        if (gameOver || timeLeft <= 8) return;
        createAmmo();
    }, 900);  // Интервал в 500 ms для атаки 2 снаряда в секунду
}

function createAmmo() {
    const ammo = document.createElement('img');
    ammo.src = '../image/ammo.jpg';
    ammo.classList.add('ammo');
    ammo.style.position = 'absolute';
    ammo.style.right = '124px'; // Adjusted to match the enemy's right position
    ammo.style.width = '40px'; // Increased width
    ammo.style.height = '20px';

    const minAmmoBottom = 66; // 6px above the ground
    const maxAmmoBottom = 150 + 12; // The height of the enemy + 12px

    ammo.style.bottom = (Math.random() * (maxAmmoBottom - minAmmoBottom) + minAmmoBottom) + 'px';  // Исправлено
    gameArea.appendChild(ammo);

    const ammoInterval = setInterval(() => {
        if (gameOver) {
            clearInterval(ammoInterval);
            ammo.remove();
            return;
        }
        
        let ammoRight = parseFloat(ammo.style.right);
        ammoRight += 16; // Move ammo to the left at a speed of 16
        ammo.style.right = ammoRight + 'px';  // Исправлено

        const ammoRect = ammo.getBoundingClientRect();
        const playerRect = player.getBoundingClientRect();

        if (
            ammoRect.left < playerRect.right &&
            ammoRect.right > playerRect.left &&
            ammoRect.bottom > playerRect.top &&
            ammoRect.top < playerRect.bottom
        ) {
            endGame();
        }

        if (ammoRight > gameArea.clientWidth) {
            clearInterval(ammoInterval);
            ammo.remove();
        }
    }, 20);
}

function launchBigAmmo() {
    const bigAmmo = document.createElement('img');
    bigAmmo.src = '../image/bigammo.jpg';
    bigAmmo.classList.add('bigammo');
    bigAmmo.style.position = 'absolute';

    const playerRect = player.getBoundingClientRect();

    // Set the height of bigammo to be within the same range as the enemy's ammo
    const minAmmoBottom = 66; // 6px above the ground
    const maxAmmoBottom = 150 + 12; // The height of the enemy + 12px
    bigAmmo.style.bottom = (Math.random() * (maxAmmoBottom - minAmmoBottom) + minAmmoBottom) + 'px';  // Исправлено

    bigAmmo.style.left = playerRect.right + 'px';  // Исправлено
    bigAmmo.style.width = '60px'; // Set desired width for bigammo
    bigAmmo.style.height = '40px'; // Set desired height for bigammo

    gameArea.appendChild(bigAmmo);

    const bigAmmoInterval = setInterval(() => {
        if (gameOver) {
            clearInterval(bigAmmoInterval);
            bigAmmo.remove();
            return;
        }

        let bigAmmoLeft = parseFloat(bigAmmo.style.left);
        bigAmmoLeft += 16; // Move big ammo to the right at a speed of 16
        bigAmmo.style.left = bigAmmoLeft + 'px';  // Исправлено

        const bigAmmoRect = bigAmmo.getBoundingClientRect();
        const enemyRect = document.getElementById('enemy').getBoundingClientRect();

        if (
            bigAmmoRect.left < enemyRect.right &&
            bigAmmoRect.right > enemyRect.left &&
            bigAmmoRect.bottom > enemyRect.top &&
            bigAmmoRect.top < enemyRect.bottom
        ) {
            clearInterval(bigAmmoInterval);
            const enemy = document.getElementById('enemy');
            enemy.src = '../image/deadenemy.jpg';
            player.src = '../image/win.jpg';
            score += 100; // Add 100 points
            scoreElement.textContent = score; // Update score display
            showWinModal(); // Show win modal
            bigAmmo.remove();
        }

        if (bigAmmoLeft > gameArea.clientWidth) {
            clearInterval(bigAmmoInterval);
            bigAmmo.remove();
        }
    }, 20);
}

function showWinModal() {
    const winModal = document.getElementById('win-modal');
    const winMessage = document.getElementById('win-message');
    winMessage.textContent = 'Вы выиграли 100 + ' + (score - 100) + '!';  // Исправлено
    winModal.style.display = 'flex';
}

function endGame() {
    gameOver = true;
    player.src = '../image/rip.jpg';
    player.style.bottom = '60px';
    clearInterval(gameInterval);
    clearInterval(timerInterval);
    clearInterval(backgroundInterval);
    clearInterval(ammoInterval);
    showGameOverModal();
}

function showGameOverModal() {
    attempts++;
    document.getElementById('attempts-message').textContent = 'Попытки: ' + attempts + '/3';  // Исправлено
    const retryButton = document.getElementById('retry-button');
    if (attempts >= 3) {
        retryButton.classList.add('disabled');
        retryButton.style.backgroundColor = 'grey';
        retryButton.disabled = true;
    }
    document.getElementById('game-over-modal').style.display = 'flex';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function restartGame() {
    document.removeEventListener('keydown', jumpEvent);
    document.removeEventListener('keydown', crouchEvent);
    document.removeEventListener('keyup', standUpEvent);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('click', jump);
    
    hideModal('game-over-modal');
    score = 0;
    isJumping = false;
    isCrouching = false;
    velocityY = 0;
    obstacles.forEach(obstacle => obstacle.remove());
    obstacles = [];
    const enemy = document.getElementById('enemy');
    if (enemy) {
        enemy.remove();
    }
    player.src = '../image/xyeta.jpg';
    player.style.bottom = '60px';
    player.style.height = '100px';
    gameOver = false;
    timeLeft = 60;
    groundSpeed = initialGroundSpeed;
    obstacleSpeed = initialObstacleSpeed;
    backgroundSpeed = initialBackgroundSpeed;
    scoreElement.textContent = score;
    timerElement.textContent = timeLeft;
    enemyVisible = false;
    startGame();
}

// Создаем элемент "Tap to Play" в JavaScript
function createStartScreen() {
    const startScreen = document.createElement('div');
    startScreen.id = 'start-screen';
    startScreen.style.position = 'fixed';
    startScreen.style.top = '0';
    startScreen.style.left = '0';
    startScreen.style.width = '100%';
    startScreen.style.height = '100%';
    startScreen.style.display = 'flex';
    startScreen.style.justifyContent = 'center';
    startScreen.style.alignItems = 'center';
    startScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    startScreen.style.color = 'white';
    startScreen.style.fontSize = '36px';
    startScreen.style.fontWeight = 'bold';
    startScreen.style.zIndex = '1000';
    startScreen.style.cursor = 'pointer';
    startScreen.textContent = 'Tap to Play';
    
    startScreen.addEventListener('click', () => {
        if (!hasStarted) {
            startScreen.remove();
            gameContainer.classList.remove('hidden');
            hasStarted = true; // Флаг, указывающий, что игра была начата
            startGame(); // Начинаем игру после клика
        }
    });
    
    document.body.appendChild(startScreen);
}

function startGame() {
    createObstacle(gameArea.clientWidth + 200);
    gameInterval = setInterval(moveObstacles, 20);
    timerInterval = setInterval(updateTimer, 1000);
    backgroundInterval = setInterval(moveBackground, 20);
    requestAnimationFrame(updatePlayerPosition);
    document.addEventListener('keydown', jumpEvent);
    document.addEventListener('keydown', crouchEvent);
    document.addEventListener('keyup', standUpEvent);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('click', jump);
}

const jumpEvent = (e) => {
    if (e.code === 'Space') {
        jump();
    }
};

const crouchEvent = (e) => {
    if (e.code === 'ArrowDown') {
        crouch();
    }
};

const standUpEvent = (e) => {
    if (e.code === 'ArrowDown') {
        standUp();
    }
};

let touchStartY = 0;

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    const touchEndY = e.changedTouches[0].clientY;
    const touchDiff = touchStartY - touchEndY;

    if (touchDiff > 30) {
        jump();
    } else if (touchDiff < -30) {
        crouch();
    }
}

// Изначально создаем стартовый экран
createStartScreen();
