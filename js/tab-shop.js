// Дополнительный функционал для вкладки Shop

document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', () => {
        alert('Item bought!');
    });
});
