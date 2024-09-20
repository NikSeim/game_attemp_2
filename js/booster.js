document.addEventListener('DOMContentLoaded', () => {
    // Обработчик для кнопки закрытия вкладки
    document.getElementById('close-button').addEventListener('click', function() {
        if (window.opener) {
            window.opener.saveGameState(); // Сохраняем состояние игры
            window.close(); // Закрываем вкладку Booster
        } else {
            window.location.href = '../index.html'; // Перенаправление на главную страницу
        }
    });

    // Обработчик клика по кнопке "Максимальное количество шагов"
    document.getElementById('max-steps').addEventListener('click', function() {
        if (window.opener && typeof window.opener.addMaxSteps === 'function') {
            window.opener.addMaxSteps(); // Увеличиваем количество шагов
            window.opener.saveGameState(); // Сохранение состояния игры после увеличения шагов
        }
    });

    // Сохраняем состояние перед закрытием окна/вкладки
    window.addEventListener('beforeunload', () => {
        if (window.opener) {
            window.opener.saveGameState(); // Сохранение состояния игры перед закрытием вкладки
        }
    });
});

function showSection(sectionId) {
    // Скрываем все секции
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');

    // Показываем выбранную секцию
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();  // Запрещаем вызов контекстного меню
        });

        img.setAttribute('draggable', false);  // Отключаем перетаскивание изображения
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        // Отключаем контекстное меню при нажатии правой кнопкой мыши
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();  // Блокируем контекстное меню
        });

        // Отключаем перетаскивание изображения
        img.setAttribute('draggable', false);

        // Отключаем долгие нажатия на мобильных устройствах
        img.addEventListener('touchstart', (e) => {
            let timeoutId = setTimeout(() => {
                e.preventDefault();  // Блокируем вызов контекстного меню при долгом нажатии
            }, 300);  // 300 мс — время долгого нажатия, можно настроить

            // Сбрасываем таймер, если палец убран раньше
            img.addEventListener('touchend', () => clearTimeout(timeoutId));
            img.addEventListener('touchmove', () => clearTimeout(timeoutId));
        });
    });
});

// booster


document.addEventListener("DOMContentLoaded", function() {
    // Функция для открытия модального окна
    function openModal(imageSrc, name1, name2, name3, price) {
        const modal = document.getElementById('shop-modal'); // Модальное окно
        const modalImage = document.getElementById('shop-modal-image'); // Изображение
        const modalTitle = document.getElementById('shop-column1'); // Название
        const modalDescription = document.getElementById('shop-column2'); // Описание
        const modalMoreInfo = document.getElementById('shop-column3'); // Доп. описание
        const modalPrice = document.querySelector('.shop-price'); // Цена
        const overlay = document.getElementById('overlay'); // Overlay (затемненный фон)

        // Устанавливаем данные в модальное окно
        modalImage.src = imageSrc;
        modalTitle.innerText = name1;
        modalDescription.innerText = name2;
        modalMoreInfo.innerText = name3;
        modalPrice.innerText = `Цена: ${price} монет`;

        // Показать overlay и модальное окно
        overlay.classList.add('active');
        modal.classList.add('active');
    }

    
    function closeModal() {
        const modal = document.getElementById('shop-modal');
        const overlay = document.getElementById('overlay');

      
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }

    const sectionButtons = document.querySelectorAll('.menu-item button');
    sectionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const menuItem = this.closest('.menu-item');
            const imageSrc = menuItem.getAttribute('data-image');
            const name1 = menuItem.getAttribute('data-name1');
            const name2 = menuItem.getAttribute('data-name2');
            const name3 = menuItem.getAttribute('data-name3');
            const price = menuItem.getAttribute('data-price');

            openModal(imageSrc, name1, name2, name3, price);
        });
    });

    const overlay = document.getElementById('overlay');
    overlay.addEventListener('click', closeModal);

    const closeButton = document.querySelector('.shop-close');
    closeButton.addEventListener('click', closeModal);
});
