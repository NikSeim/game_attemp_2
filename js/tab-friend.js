function copyText() {
    const textToCopy = "https://t.me/ldfbhuibf_bot"; // Текст для копирования
    const tempInput = document.createElement("input");
    tempInput.value = textToCopy;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    const notification = document.getElementById("copy-notification");
    notification.classList.add("show");

    const button = document.querySelector('.square-button');
    button.disabled = true;

    setTimeout(() => {
        notification.classList.remove("show");
    }, 1000);

    setTimeout(() => {
        button.disabled = false;
        notification.style.opacity = "1";
    }, 4000);
}
