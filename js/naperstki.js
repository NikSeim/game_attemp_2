// Глобальная переменная для монет, загружаем из localStorage или начинаем с 0
let globalCoins = localStorage.getItem('globalCoins') ? parseInt(localStorage.getItem('globalCoins')) : 0;
let bugChosen = false; // Флаг выбора жука
let chosenBugIndex = null; // Индекс выбранного жука
let bugSpeeds = [];
let bugStopped = [];
let firstBugReached = false; // Флаг первого жука
let firstBugIndex = null; // Индекс первого пришедшего жука
let betAmount = 100; // Сумма ставки по умолчанию 100

const minSpeed = 1;
const maxSpeed = 3;

// DOM элементы
const coinCountElement = document.getElementById('coinCount'); // Элемент для отображения количества монет
const addCoinsBtn = document.getElementById('addCoinsBtn'); // Кнопка добавления монет
const betRange = document.getElementById('betRange'); // Ползунок для выбора ставки
const betAmountElement = document.getElementById('betAmount'); // Элемент для отображения суммы ставки
const playButton = document.getElementById('playButton'); // Кнопка "Играть"
const gameContainer = document.getElementById('gameContainer'); // Игровое поле
const container = document.querySelector('.container'); // Основной контейнер
const bugs = document.querySelectorAll('.bug'); // Жуки
const chooseBugText = document.querySelector('.choose-bug-text'); // Текст выбора жука
const gameField = document.getElementById('gameField'); // Игровое поле

// Окна для результата
const winModal = document.createElement('div');
const loseModal = document.createElement('div');

// Создаем модальное окно для победы
function createWinModal() {
    winModal.classList.add('modal');
    winModal.innerHTML = `
        <div class="modal-content">
            <h2>Вы победили!</h2>
            <p>Забрать ваш приз 5х!!!</p>
            <button class="green-button" id="claimPrizeBtn">Забрать</button>
        </div>
    `;
    document.body.appendChild(winModal);
    
    document.getElementById('claimPrizeBtn').addEventListener('click', () => {
        globalCoins += betAmount * 5; // Увеличиваем количество монет на 5х от ставки
        saveGlobalCoins();
        updateCoinDisplay();
        winModal.style.display = 'none';
        // Переход на index.html с правильным путем
        window.location.href = '../index.html./index.html';
    });
}

// Создаем модальное окно для поражения
function createLoseModal() {
    loseModal.classList.add('modal');
    loseModal.innerHTML = `
        <div class="modal-content">
            <h2>Вы проиграли!</h2>
            <button class="red-button" id="exitBtn">Уйти</button>
        </div>
    `;
    document.body.appendChild(loseModal);
    
    document.getElementById('exitBtn').addEventListener('click', () => {
        loseModal.style.display = 'none';
        // Переход на index.html с правильным путем
        window.location.href = '../index.html';
    });
}

// Инициализация модальных окон
createWinModal();
createLoseModal();

// Скрываем модальные окна по умолчанию
winModal.style.display = 'none';
loseModal.style.display = 'none';

// Обновление количества монет на экране
function updateCoinDisplay() {
    coinCountElement.textContent = globalCoins; // Обновляем отображение монет
}

// Сохранение монет в localStorage
function saveGlobalCoins() {
    localStorage.setItem('globalCoins', globalCoins.toString());
}

// Добавить 100 монет
addCoinsBtn.addEventListener('click', () => {
    globalCoins += 100; // Добавляем 100 монет
    saveGlobalCoins(); // Сохраняем в localStorage
    updateCoinDisplay(); // Обновляем отображение монет
    updateBetRange(); // Обновляем максимальную ставку
});

// Обновление диапазона ставок
function updateBetRange() {
    betRange.max = globalCoins; // Максимальная ставка равна текущему количеству монет
    betRange.min = 100; // Минимальная ставка = 100
}

// Обновление суммы ставки при движении ползунка
betRange.addEventListener('input', () => {
    betAmount = parseInt(betRange.value); // Обновляем сумму ставки
    betAmountElement.textContent = betAmount; // Отображаем выбранную ставку
});

// Показ игрового поля и скрытие стартового окна
playButton.addEventListener('click', () => {
    if (betAmount > globalCoins) {
        alert("Недостаточно монет для игры!");
        return;
    }

    container.style.display = 'none'; // Скрываем меню
    gameContainer.style.display = 'block'; // Показываем игру
});

// Получение случайной скорости для жука
function getRandomSpeed() {
    return Math.random() * (maxSpeed - minSpeed) + minSpeed;
}

// Движение жуков
function moveBugs() {
    let raceFinished = true;

    bugs.forEach((bug, index) => {
        if (!bugStopped[index]) {
            let bugPosition = bug.getBoundingClientRect().top;
            let gameFieldPosition = gameField.getBoundingClientRect().top;

            // Проверяем, достиг ли жук верхней границы игрового поля
            if (bugPosition <= gameFieldPosition) {
                if (!firstBugReached) {
                    firstBugReached = true;
                    firstBugIndex = index; // Запоминаем индекс первого финишировавшего жука
                }
                bugStopped[index] = true; // Останавливаем жука
            } else {
                bug.style.transform = `translateY(-${bugSpeeds[index]}px)`;
                bugSpeeds[index] += getRandomSpeed();
                raceFinished = false; // Гонка продолжается
            }
        }
    });

    if (!raceFinished) {
        requestAnimationFrame(moveBugs);
    } else {
        // Определяем результат игры
        if (chosenBugIndex === firstBugIndex) {
            chooseBugText.textContent = `Ваш Жук победил!`;
            globalCoins += betAmount * 5; // При победе умножаем ставку на 5 и добавляем к монетам
            saveGlobalCoins(); // Сохраняем обновленный баланс
            winModal.style.display = 'block'; // Показать окно победы
        } else {
            globalCoins -= betAmount; // При проигрыше вычитаем ставку из монет
            if (globalCoins < 0) globalCoins = 0; // Не допускаем отрицательных значений
            saveGlobalCoins(); // Сохраняем обновленный баланс
            updateCoinDisplay(); // Обновляем отображение монет
            chooseBugText.textContent = `Ваш Жук проиграл!`;
            loseModal.style.display = 'block'; // Показать окно поражения
        }
        updateCoinDisplay(); // Обновляем монеты после завершения игры
    }
}

// Запуск гонки и выбор жука
bugs.forEach((bug, index) => {
    bug.addEventListener('click', () => {
        if (!bugChosen) {
            chooseBugText.textContent = `Ваш Жук ${index + 1}`;
            bugChosen = true;
            chosenBugIndex = index;

            bugs.forEach(() => {
                bugSpeeds.push(getRandomSpeed()); // Генерируем скорость для каждого жука
                bugStopped.push(false); // Инициализация остановки жуков
            });

            requestAnimationFrame(moveBugs); // Запуск гонки
        }
    });
});

// Инициализация
function initializeGame() {
    updateCoinDisplay(); // Обновляем количество монет при загрузке
    updateBetRange(); // Устанавливаем диапазон ставки
    betRange.value = 100; // Сбрасываем значение ползунка на 100 при загрузке
    betAmount = 100; // Ставка по умолчанию
    betAmountElement.textContent = betAmount; // Отображаем выбранную ставку
}

initializeGame(); // Инициализация игры
