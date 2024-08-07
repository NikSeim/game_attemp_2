// game4.js
let coinImage = document.getElementById('coin-image');
let message = document.getElementById('message');
let timerElement = document.getElementById('timer');

let coinsEarned = 0;
let timeLeft = 20; // 20 seconds timer
const maxClicks = 500;
let clickCount = 0;

function updateMessage() {
    message.textContent = `Монет заработано: ${coinsEarned}`;
}

function handleCoinClick() {
    if (clickCount < maxClicks) {
        clickCount++;
        coinsEarned++;
        updateMessage();
    }
    if (clickCount >= maxClicks) {
        message.textContent += `\nДостигнут лимит нажатий: ${maxClicks}`;
    }
}

function handleCoinTouchStart(event) {
    event.preventDefault();
    handleCoinClick();
}

function handleCoinTouchEnd(event) {
    event.preventDefault();
    if (clickCount >= maxClicks) {
        coinImage.removeEventListener('touchstart', handleCoinTouchStart);
        coinImage.removeEventListener('mousedown', handleCoinClick);
    }
}

function startTimer() {
    let timer = setInterval(() => {
        timeLeft--;
        timerElement.textContent = `Оставшееся время: ${timeLeft} секунд`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            message.textContent = `Время вышло! Монет заработано: ${coinsEarned}`;
            coinImage.removeEventListener('touchstart', handleCoinTouchStart);
            coinImage.removeEventListener('mousedown', handleCoinClick);
            setTimeout(() => {
                // Save earned coins to local storage and return to main game
                localStorage.setItem('earnedCoins', coinsEarned);
                window.location.href = `../index.html?earnedCoins=${coinsEarned}`;
            }, 2000);
        }
    }, 1000);
}

coinImage.addEventListener('touchstart', handleCoinTouchStart);
coinImage.addEventListener('mousedown', handleCoinClick);
coinImage.addEventListener('touchend', handleCoinTouchEnd);
coinImage.addEventListener('mouseup', handleCoinTouchEnd);

startTimer();
updateMessage();
