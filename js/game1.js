const gameArea = document.getElementById('game-area');
const coinCounter = document.getElementById('coin-counter');
const exitButton = document.getElementById('exit');
const timerElement = document.getElementById('timer');

let coins = 0;
const gameDuration = 30000; // 30 seconds
const objectFallInterval = 200; // Further increased falling objects (400ms / 2 = 200ms)

// Array of objects with a value of 1 for each coin and -10 for bomb
const objects = [
    { src: '../image/blumsmall.jpg', value: 1 },
    { src: '../image/blummedium.jpg', value: 1 },
    { src: '../image/blumlarge.jpg', value: 1 },
    { src: '../image/bomb.jpg', value: -10 }
];

// Event listener for exit button
exitButton.addEventListener('click', () => {
    const savedGameState = localStorage.getItem('gameState');
    let gameState = savedGameState ? JSON.parse(savedGameState) : null;

    if (gameState) {
        gameState.coins += coins;
        localStorage.setItem('gameState', JSON.stringify(gameState));
    }

    window.location.href = '../index.html';
});

// Function to create falling objects
function createFallingObject() {
    const objectData = objects[Math.floor(Math.random() * objects.length)];
    const object = document.createElement('img');
    object.src = objectData.src;
    object.classList.add('falling-object');
    object.style.left = `${Math.random() * 90}vw`; // Random horizontal position
    object.style.top = `-50px`; // Start above the game area
    object.value = objectData.value;

    object.addEventListener('click', () => {
        coins += object.value;
        if (coins < 0) coins = 0;
        coinCounter.textContent = coins;
        object.remove();
    });

    gameArea.appendChild(object);
    animateFallingObject(object);
}

// Function to animate falling objects
function animateFallingObject(object) {
    let top = -50; // Start above the game area
    const fallSpeed = Math.random() * 2 + 2; // Random fall speed

    function fall() {
        if (top < window.innerHeight) {
            top += fallSpeed;
            object.style.top = `${top}px`;
            requestAnimationFrame(fall);
        } else {
            object.remove(); // Remove object when it falls out of view
        }
    }

    fall();
}

// Function to start the game
function startGame() {
    // Initialize the timer display
    timerElement.textContent = `0:30`;
    timerElement.style.backgroundColor = 'rgb(0, 170, 255)'; // Blue

    // Set interval for falling objects
    const gameInterval = setInterval(createFallingObject, objectFallInterval);
    let timeLeft = gameDuration / 1000; // Convert to seconds

    // Set interval for timer
    const timerInterval = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Change timer color based on remaining time
        if (timeLeft <= 5) {
            timerElement.style.backgroundColor = 'rgb(255, 0, 0)'; // Red
        } else if (timeLeft <= 15) {
            timerElement.style.backgroundColor = 'rgb(255, 153, 0)'; // Yellow
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
        }
    }, 1000);

    // End game after game duration
    setTimeout(() => {
        clearInterval(gameInterval);
        clearInterval(timerInterval);
        setTimeout(() => {
            const savedGameState = localStorage.getItem('gameState');
            let gameState = savedGameState ? JSON.parse(savedGameState) : null;

            if (gameState) {
                gameState.coins += coins;
                localStorage.setItem('gameState', JSON.stringify(gameState));
            }

            window.location.href = '../index.html';
        }, 3000); // Allow 3 seconds to finish animations
    }, gameDuration);
}

// Start the game
startGame();
