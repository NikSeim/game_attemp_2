    // Получаем элементы на странице
    const tasks = document.querySelectorAll('.task-box');
    const modal = document.getElementById('modal');
    const closeModal = document.querySelector('.close');
    const claimButtonModal = document.querySelector('.claim-button-modal');
    const overlay = document.getElementById('overlay');
    const resetButton = document.getElementById('reset-days'); // Кнопка сброса дней
    const messageBox = document.getElementById('message-box'); // Контейнер для сообщений
    const allRewardsClaimed = document.getElementById('all-rewards-claimed'); // Сообщение "All rewards claimed"
    let claimTimeout; // Таймер для отслеживания времени нажатия кнопки

    // Функция для генерации объектов дней в модальном окне
    function generateDays() {
        const daysContainer = document.getElementById('days-container');
        daysContainer.innerHTML = ''; // Очистка содержимого
        messageBox.innerHTML = ''; // Очистка сообщений
        allRewardsClaimed.style.display = 'none'; // Скрываем сообщение "All rewards claimed"

        const claimedDayIndex = parseInt(localStorage.getItem('claimedDayIndex')) || 0;

        for (let i = 1; i <= 12; i++) {
            const dayBox = document.createElement('div');
            dayBox.classList.add('day-box');

            const dayNumber = document.createElement('div');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = `${i} day`;

            const coinImg = document.createElement('img');
            coinImg.src = "https://github.com/NikSeim/images/raw/main/tokendisgn.webp";
            coinImg.alt = "Coin";

            const dayCoins = document.createElement('div');
            dayCoins.classList.add('day-coins');
            dayCoins.textContent = `+${i * 1000} coins`;

            dayBox.appendChild(dayNumber);
            dayBox.appendChild(coinImg);
            dayBox.appendChild(dayCoins);

            if (i <= claimedDayIndex) {
                dayBox.classList.add('disabled'); // Серый фон для завершенного контейнера
            } else if (i === claimedDayIndex + 1) {
                dayBox.classList.add('next'); // Зеленая окантовка для следующего дня
            }

            daysContainer.appendChild(dayBox);
        }

        checkClaimButtonState(); // Проверяем состояние кнопки "Claim"
    }

    // Функция для проверки состояния кнопки "Claim"
    function checkClaimButtonState() {
        const claimedDayIndex = parseInt(localStorage.getItem('claimedDayIndex')) || 0;
        const lastClaimTime = parseInt(localStorage.getItem('lastClaimTime')) || 0;
        const currentTime = Date.now();

        const timeSinceLastClaim = currentTime - lastClaimTime;

        if (claimedDayIndex >= 12) {
            // Если все награды получены, скрываем кнопку и показываем сообщение
            claimButtonModal.style.display = 'none';
            allRewardsClaimed.style.display = 'block';
            return; // Прекращаем выполнение функции
        }

        if (timeSinceLastClaim >= 86400000) { // Если прошло больше минуты с последнего нажатия
            activateNextDay(); // Активируем следующий день
            claimButtonModal.classList.remove('disabled');
            claimButtonModal.disabled = false;
            claimButtonModal.textContent = "Claim";

            // Запускаем таймер ожидания нажатия кнопки "Claim"
            clearTimeout(claimTimeout);
            claimTimeout = setTimeout(() => {
                if (!claimButtonModal.disabled) { // Если кнопка не была нажата
                    resetStreak(); // Выполняем сброс прогресса
                    messageBox.innerHTML = "Your streak is lost."; // Отображаем сообщение в модальном окне
                }
            }, 60000); // 1 минута ожидания
        } else {
            claimButtonModal.classList.add('disabled');
            claimButtonModal.disabled = true;
            claimButtonModal.textContent = "Come back";
            const timeLeft = 86400000 - timeSinceLastClaim;
            setTimeout(checkClaimButtonState, timeLeft); // Проверяем снова через оставшееся время
        }
    }

    // Функция для активации следующего дня
    function activateNextDay() {
        const claimedDayIndex = parseInt(localStorage.getItem('claimedDayIndex')) || 0;
        const nextDayBox = document.querySelector(`.day-box:nth-child(${claimedDayIndex + 1})`);

        if (nextDayBox) {
            nextDayBox.classList.remove('next');
            nextDayBox.classList.add('active'); // Делает следующий день полностью зеленым
        }
    }

    // Функция для открытия модального окна с анимацией
    function showModal() {
        generateDays();
        overlay.style.display = 'block';
        modal.classList.remove('slide-down'); // Убираем класс скрытия
        modal.classList.add('slide-up'); // Добавляем класс показа
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    // Функция для закрытия модального окна с анимацией
    function closeModalWindow() {
        modal.classList.remove('slide-up'); // Убираем класс показа
        modal.classList.add('slide-down'); // Добавляем класс скрытия
        document.body.classList.remove('modal-open');
        
        setTimeout(() => {
            overlay.style.display = 'none';
            modal.style.display = 'none';
        }, 300); // Время должно совпадать с длительностью анимации в CSS
    }

    // Привязка события для открытия модального окна ко всем задачам
    tasks.forEach(task => {
        task.addEventListener('click', showModal);
    });

    // Закрытие модального окна при клике на крестик
    closeModal.addEventListener('click', closeModalWindow);

    // Закрытие модального окна при клике вне его
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            closeModalWindow();
        }
    });

    // Логика для кнопки "Claim"
    claimButtonModal.addEventListener('click', function() {
        const claimedDayIndex = parseInt(localStorage.getItem('claimedDayIndex')) || 0;
        const currentDayBox = document.querySelector(`.day-box:nth-child(${claimedDayIndex + 1})`);

        if (currentDayBox && !claimButtonModal.disabled) {
            currentDayBox.classList.remove('next');
            currentDayBox.classList.add('disabled'); // Делаем текущий день завершенным

            // Сохраняем состояние в localStorage
            localStorage.setItem('claimedDayIndex', claimedDayIndex + 1);
            localStorage.setItem('lastClaimTime', Date.now()); // Записываем время нажатия

            // Останавливаем таймер сброса, так как кнопка была нажата
            clearTimeout(claimTimeout);

            // Обновляем состояние сразу после нажатия
            generateDays(); // Генерируем новые дни сразу после нажатия
            checkClaimButtonState(); // Проверяем состояние кнопки и дней
        }
    });

    // Функция сброса прогресса
    function resetStreak() {
        localStorage.setItem('claimedDayIndex', 0); // Сбрасываем прогресс до первого дня
        localStorage.removeItem('lastClaimTime'); // Удаляем время последнего нажатия
        generateDays(); // Обновляем отображение дней
    }

    // Устанавливаем состояние при загрузке страницы
    document.addEventListener('DOMContentLoaded', function() {
        generateDays();

        // Проверяем кнопку и дни каждую минуту
        setInterval(checkClaimButtonState, 86400000);
    });

    // Логика для кнопки сброса дней на "Day 1"
    resetButton.addEventListener('click', function() {
        resetStreak();
        messageBox.innerHTML = "Прогресс сброшен на первый день."; // Отображаем сообщение в модальном окне
    });
