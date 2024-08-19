// Можно добавить обработчики событий для вкладки Friends
document.addEventListener('DOMContentLoaded', () => {
    const longButton = document.querySelector('.long-button');
    if (longButton) {
        longButton.addEventListener('click', () => {
            alert('Invite friends button clicked!');
        });
    }
});
