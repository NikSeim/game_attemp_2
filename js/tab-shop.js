// Находим элементы на странице
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-image');
const closeModal = document.getElementsByClassName('close')[0];
const buyButton = document.getElementById('buy-button');
const tokenCountElement = document.getElementById('token-count');
const resetPurchasesButton = document.getElementById('reset-purchases-button'); // Кнопка сброса покупок
let toggleButton = null; // Кнопка для активации/деактивации
let currentItemID = null; // Текущий ID предмета
let activeItemID = null; // ID текущего активного предмета

// Обновление отображения количества монет при загрузке страницы
if (tokenCountElement) {
    tokenCountElement.textContent = globalCoins.toLocaleString();
}

// Функция для открытия модального окна
document.querySelectorAll('.market-item').forEach((item, index) => {
    item.addEventListener('click', function () {
        currentItemID = this.getAttribute('data-item-id');  // Уникальный ID предмета
        const imgSrc = this.querySelector('img').src;
        let price = parseInt(this.querySelector('.price').textContent.replace(/[^0-9]/g, ''));  // Извлекаем цену как целое число

        // Если это первый элемент, он бесплатный, и цена не отображается
        if (index === 0) {
            price = 0;
            modal.querySelector('.price').textContent = ''; // Убираем отображение цены
        } else {
            modal.querySelector('.price').textContent = price;  // Отображаем цену как целое число
        }

        const name1 = this.getAttribute('data-name1');
        const name2 = this.getAttribute('data-name2');
        const name3 = this.getAttribute('data-name3');
        const name4 = this.getAttribute('data-name4');

        // Устанавливаем данные в модальное окно
        modalImg.src = imgSrc;
        document.getElementById('column1').textContent = name1;
        document.getElementById('column2').textContent = name2;
        document.getElementById('column3').textContent = name3;
        document.getElementById('column4').textContent = name4;

        // Убираем предыдущую toggleButton, если она существует
        if (toggleButton) {
            toggleButton.remove();
            toggleButton = null;
        }

        // Проверяем, достаточно ли средств на балансе (кроме первого бесплатного предмета)
        if (globalCoins >= price || price === 0) {
            buyButton.disabled = false;
            buyButton.style.backgroundColor = 'green';
        } else {
            buyButton.disabled = true;
            buyButton.style.backgroundColor = 'gray';
        }

        // Проверяем, был ли предмет куплен ранее
        const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        if (purchasedItems[currentItemID] || index === 0) {
            showToggleButton(purchasedItems[currentItemID]?.state || 'activated'); // Показываем кнопку в сохраненном состоянии или активируем первый элемент
            buyButton.style.display = 'none'; // Скрываем кнопку "Купить", если предмет куплен
        } else {
            buyButton.style.display = 'block'; // Показываем кнопку "Купить", если предмет не был куплен
        }

        modal.style.display = "block";  // Показываем модальное окно
    });
});

// Функция для закрытия модального окна
closeModal.addEventListener('click', function () {
    modal.style.display = "none";  // Скрываем модальное окно
    currentItemID = null; // Сбрасываем текущий ID предмета
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
        currentItemID = null; // Сбрасываем текущий ID предмета
    }
});

// Обработчик клика по кнопке "Купить"
buyButton.addEventListener('click', function () {
    const priceText = modal.querySelector('.price').textContent;
    const price = parseInt(priceText) || 0;  // Преобразуем цену в целое число, если она не пустая

    // Проверяем, достаточно ли средств на балансе
    if (globalCoins >= price || price === 0) {  // Добавлена проверка на бесплатность
        globalCoins -= price;  // Вычитаем цену из баланса, если цена не 0
        updateTokenCount();  // Обновляем отображение баланса в HTML
        saveGameState();  // Сохраняем обновленный баланс

        // Сохраняем информацию о покупке предмета
        let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        purchasedItems[currentItemID] = { state: 'activated' }; // Начальное состояние - активировано
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

        // Обновляем активный элемент
        deactivatePreviousActiveItem(); // Деактивируем предыдущий активный элемент

        showToggleButton('activated'); // Показываем кнопку "Деактивировать" сразу после покупки
        buyButton.style.display = 'none'; // Скрываем кнопку "Купить" после покупки

        activeItemID = currentItemID; // Устанавливаем текущий активный элемент
    }
});

// Функция для деактивации предыдущего активного элемента
function deactivatePreviousActiveItem() {
    if (activeItemID && activeItemID !== currentItemID) {
        let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        purchasedItems[activeItemID].state = 'deactivated';  // Деактивируем предыдущий активный элемент
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

        // Деактивируем предыдущую кнопку, если она есть
        const previousToggleButton = document.querySelector(`[data-item-id="${activeItemID}"] #toggle-button`);
        if (previousToggleButton) {
            previousToggleButton.textContent = 'Активировать';
            previousToggleButton.style.backgroundColor = 'green';
            previousToggleButton.classList.remove('active');
        }
    }

    // Деактивация первого элемента по умолчанию, если он активен
    if (activeItemID === 'item-1' && currentItemID !== 'item-1') {
        let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
        purchasedItems['item-1'].state = 'deactivated';
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));

        const defaultToggleButton = document.querySelector(`[data-item-id="item-1"] #toggle-button`);
        if (defaultToggleButton) {
            defaultToggleButton.textContent = 'Активировать';
            defaultToggleButton.style.backgroundColor = 'green';
            defaultToggleButton.classList.remove('active');
        }
    }
}

// Функция для отображения toggleButton с соответствующим состоянием
function showToggleButton(state) {
    if (!toggleButton) {
        toggleButton = document.createElement('button');
        toggleButton.id = 'toggle-button';
        toggleButton.style.width = buyButton.style.width; // Задаем такую же ширину, как у кнопки "Купить"
        toggleButton.style.marginTop = buyButton.style.marginTop; // Устанавливаем тот же отступ сверху
        buyButton.parentNode.insertBefore(toggleButton, buyButton); // Вставляем toggleButton перед кнопкой "Купить"
        toggleButton.addEventListener('click', toggleButtonState);
    }

    if (state === 'activated') {
        toggleButton.textContent = 'Деактивировать';
        toggleButton.style.backgroundColor = 'red';
        toggleButton.classList.add('active');
    } else {
        toggleButton.textContent = 'Активировать';
        toggleButton.style.backgroundColor = 'green';
        toggleButton.classList.remove('active');
    }
}

// Функция для переключения состояния toggleButton
function toggleButtonState() {
    let purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};

    // Если кнопка уже активирована, деактивируем её
    if (toggleButton.classList.contains('active')) {
        toggleButton.textContent = 'Активировать';
        toggleButton.style.backgroundColor = 'green';
        toggleButton.classList.remove('active');
        purchasedItems[currentItemID].state = 'deactivated';
        activeItemID = null;
    } else {
        // Деактивируем текущую активную кнопку, если такая есть
        deactivatePreviousActiveItem();

        // Активируем текущую кнопку
        toggleButton.textContent = 'Деактивировать';
        toggleButton.style.backgroundColor = 'red';
        toggleButton.classList.add('active');
        purchasedItems[currentItemID].state = 'activated';
        activeItemID = currentItemID; // Сохраняем текущую активную кнопку
    }
    localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems)); // Сохраняем состояние кнопки
}

// Функция для сброса покупок
resetPurchasesButton.addEventListener('click', function () {
    localStorage.removeItem('purchasedItems'); // Удаляем информацию о покупках
    globalCoins = 10000; // Сбрасываем глобальный баланс монет (установите начальное значение по вашему усмотрению)
    updateTokenCount(); // Обновляем отображение баланса
    saveGameState(); // Сохраняем состояние игры
    alert('Покупки и баланс сброшены!');
    location.reload(); // Перезагружаем страницу для обновления интерфейса
});

// Функция для обновления отображения количества монет
function updateTokenCount() {
    if (tokenCountElement) {
        tokenCountElement.textContent = globalCoins.toLocaleString();
    }
}

// Функция для сохранения состояния игры
function saveGameState() {
    localStorage.setItem('globalCoins', globalCoins);
}

// Функция для загрузки состояния игры
function loadGameState() {
    globalCoins = parseInt(localStorage.getItem('globalCoins')) || 10000; // Устанавливаем начальный баланс монет
    updateTokenCount(); // Обновляем отображение баланса

    // Проверка и активация первого элемента при загрузке
    const purchasedItems = JSON.parse(localStorage.getItem('purchasedItems')) || {};
    if (!purchasedItems['item-1']) {
        purchasedItems['item-1'] = { state: 'activated' };
        localStorage.setItem('purchasedItems', JSON.stringify(purchasedItems));
        activeItemID = 'item-1';  // Устанавливаем первый элемент как активный
    } else {
        // Если есть активный элемент, сохраняем его ID
        for (let id in purchasedItems) {
            if (purchasedItems[id].state === 'activated') {
                activeItemID = id;
                break;
            }
        }
    }

    // Если первый элемент был деактивирован, устанавливаем его состояние
    if (purchasedItems['item-1'] && purchasedItems['item-1'].state === 'deactivated') {
        activeItemID = null; // Сбрасываем активный элемент
    }
}

// Загрузка состояния игры при загрузке страницы
document.addEventListener('DOMContentLoaded', loadGameState);
