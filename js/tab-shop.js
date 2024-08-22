// Находим элементы на странице
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-image');
const closeModal = document.getElementsByClassName('close')[0];

// Функция для открытия модального окна
document.querySelectorAll('.market-item').forEach(item => {
    item.addEventListener('click', function () {
        const imgSrc = this.querySelector('img').src;
        const price = this.querySelector('.price').textContent;
        const name1 = this.getAttribute('data-name1');
        const name2 = this.getAttribute('data-name2');
        const name3 = this.getAttribute('data-name3');
        const name4 = this.getAttribute('data-name4');
        const description = this.getAttribute('data-description');
        const detail = this.getAttribute('data-detail');

        // Устанавливаем данные в модальное окно
        modalImg.src = imgSrc;
        modal.querySelector('.price').textContent = price;
        document.getElementById('column1').textContent = name1;
        document.getElementById('column2').textContent = name2;
        document.getElementById('column3').textContent = name3;
        document.getElementById('column4').textContent = name4;

        // Устанавливаем дополнительную информацию
        const modalDescription = document.createElement('p');
        modalDescription.textContent = description;
        modalDescription.classList.add('modal-description');

        const modalDetail = document.createElement('p');
        modalDetail.textContent = detail;
        modalDetail.classList.add('modal-detail');

        const modalInfo = document.getElementById('modal-info');
        // Очищаем предыдущие данные перед добавлением новых
        modalInfo.querySelector('.modal-description')?.remove();
        modalInfo.querySelector('.modal-detail')?.remove();
        modalInfo.appendChild(modalDescription);
        modalInfo.appendChild(modalDetail);

        modal.style.display = "block";  // Показываем модальное окно
    });
});

// Функция для закрытия модального окна
closeModal.addEventListener('click', function () {
    modal.style.display = "none";  // Скрываем модальное окно
});

// Закрытие модального окна при клике вне его
window.addEventListener('click', function (event) {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});
