let globalCoins = 0;
let betAmount = 100;
let currentRound = 1;
let correctGuesses = 0;
let ballPosition = Math.floor(Math.random() * 3) + 1;
let isInteractionEnabled = true;

document.addEventListener('DOMContentLoaded', () => {
    globalCoins = parseInt(localStorage.getItem('globalCoins')) || 0;
    document.getElementById('current-token-count').textContent = `${globalCoins.toLocaleString()} монет`;

    const betRange = document.getElementById('bet-range');
    betRange.max = globalCoins;
    betRange.min = 100;
    betRange.value = Math.min(betAmount, globalCoins);
    document.getElementById('bet-amount').textContent = betRange.value;

    betRange.addEventListener('input', function () {
        betAmount = Math.min(Math.round(this.value), globalCoins);
        document.getElementById('bet-amount').textContent = betAmount;
    });

    document.getElementById('add-tokens-button').addEventListener('click', function () {
        globalCoins += 100;
        document.getElementById('current-token-count').textContent = `${globalCoins.toLocaleString()} монет`;
        betRange.max = globalCoins;
        saveGlobalCoins();
    });

    document.getElementById('start-game').addEventListener('click', function () {
        if (betAmount > globalCoins) {
            alert('Недостаточно монет для такой ставки!');
            return;
        }
        document.getElementById('bet-window').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        startGame();
    });

    document.getElementById('exit-game').addEventListener('click', () => {
        saveGlobalCoins();
        window.location.href = '../index.html';
    });

    document.querySelectorAll('.cup').forEach(cup => {
        cup.addEventListener('click', function () {
            if (isInteractionEnabled) {
                checkGuess(this.id);
            }
        });
    });
});


function saveGlobalCoins() {
    localStorage.setItem('globalCoins', globalCoins);
}
function startGame() {
    isInteractionEnabled = false;
    console.log(`Раунд ${currentRound}: Шарик начинается под стаканом ${ballPosition}`);
    showBall();
    liftCups(() => {
        setTimeout(() => {
            hideBall();
            lowerCups(() => {
                setTimeout(shuffleCups, 500);
            });
        }, 750);
    });
}

function showBall() {
    const selectedCup = document.getElementById(`cup${ballPosition}`);
    let ball = document.getElementById('ball');

    if (!ball) {
        ball = document.createElement('div');
        ball.id = 'ball';
    }

    ball.style.width = '35px';
    ball.style.height = '35px';
    ball.style.backgroundImage = "url('../image/naperstkiimage/ball.webp')";
    ball.style.backgroundSize = 'contain';
    ball.style.backgroundRepeat = 'no-repeat';
    ball.style.bottom = '0px';
    ball.style.left = '50%';
    ball.style.transform = 'translateX(-50%)';
    ball.style.zIndex = '1'; // Шарик под стаканом

    selectedCup.style.position = 'relative';
    selectedCup.appendChild(ball);
}

function hideBall() {
    const ball = document.getElementById('ball');
    if (ball) {
        ball.remove(); // Удаляем шарик после того, как стаканы опустились
    }
}

function liftCups(callback) {
    document.querySelectorAll('.cup').forEach(cup => {
        cup.style.transform = 'translateY(-100%)';
    });
    setTimeout(callback, 750);
}

function lowerCups(callback) {
    document.querySelectorAll('.cup').forEach(cup => {
        cup.style.transform = 'translateY(0)';
    });
    setTimeout(callback, 500);
}

function shuffleCups() {
    const cups = document.querySelectorAll('.cup');
    let swapTimes = 5 + Math.floor(Math.random() * 5);

    function swapTwoCups(a, b) {
        const cupA = document.getElementById(`cup${a}`);
        const cupB = document.getElementById(`cup${b}`);

        const tempLeft = cupA.style.left;
        cupA.style.left = cupB.style.left;
        cupB.style.left = tempLeft;

        cupA.style.transform = `translateX(${cupB.offsetLeft - cupA.offsetLeft}px)`;
        cupB.style.transform = `translateX(${cupA.offsetLeft - cupB.offsetLeft}px)`;

        if (ballPosition === a) ballPosition = b;
        else if (ballPosition === b) ballPosition = a;

        console.log(`Перемешивание: Шарик под стаканом ${ballPosition}`);

        setTimeout(() => {
            cupA.style.transform = 'translateX(0)';
            cupB.style.transform = 'translateX(0)';
        }, 1000);
    }

    function performSwaps() {
        if (swapTimes > 0) {
            const [a, b] = [Math.floor(Math.random() * 3) + 1, Math.floor(Math.random() * 3) + 1];
            if (a !== b) {
                swapTwoCups(a, b);
                swapTimes--;
                setTimeout(performSwaps, 1500);
            } else {
                performSwaps();
            }
        } else {
            isInteractionEnabled = true; // Включаем взаимодействие после завершения перемешивания
        }
    }

    performSwaps();
}

function checkGuess(cupId) {
    isInteractionEnabled = false;
    const selectedCup = parseInt(cupId.replace('cup', ''));
    const cupElement = document.getElementById(cupId);

    cupElement.style.transform = 'translateY(-100%)';

    setTimeout(() => {
        console.log(`Проверка: Шарик был под стаканом ${ballPosition}`);
        if (selectedCup === ballPosition) {
            showBall();
            correctGuesses++;
            document.getElementById('round-result').textContent = 'Правильно!';
        } else {
            document.getElementById('round-result').textContent = 'Неправильно.';
        }
        document.getElementById('rounds-container').textContent = `Раунд: ${currentRound} / 3 (Успешных: ${correctGuesses})`;

        setTimeout(() => {
            hideBall();
            cupElement.style.transform = 'translateY(0)';
            setTimeout(() => {
                if (currentRound < 3) {
                    currentRound++;
                    startGame();
                } else {
                    calculateWinnings();
                }
            }, 750);
        }, 750);
    }, 750);
}

function calculateWinnings() {
    let winnings = 0;
    if (correctGuesses === 1) {
        winnings = Math.round(betAmount * 0.1);
    } else if (correctGuesses === 2) {
        winnings = Math.round(betAmount * 0.25);
    } else if (correctGuesses === 3) {
        winnings = Math.round(betAmount * 0.5);
    } else {
        winnings = Math.round(-betAmount / 2);
    }

    globalCoins += winnings;
    globalCoins = Math.round(globalCoins); // Округление глобальных монет
    saveGlobalCoins();

    document.getElementById('final-result').textContent = `Вы выиграли: ${winnings} монет. Итоговый баланс: ${globalCoins}`;
    document.getElementById('result-container').style.display = 'block';
}
