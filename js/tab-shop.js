document.addEventListener('DOMContentLoaded', () => {
    const marketItems = document.querySelectorAll('.market-item');

    marketItems.forEach(item => {
        item.addEventListener('click', () => {
            // Здесь можно добавить функционал, например, открытие модального окна с детальной информацией
            alert('Товар добавлен в корзину!');
        });
    });
});
