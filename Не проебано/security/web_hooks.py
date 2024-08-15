from flask import Flask, request
import requests

app = Flask(__name__)

TOKEN = "7408614164:AAFJaFSrbTFaeQr5QLzplZBT4fOGY_2WVZk"

@app.route('/webhook', methods=['POST'])
def webhook():
    update = request.json
    handle_update(update)
    return "OK"

def handle_update(update):
    message = update.get('message')
    if message:
        chat_id = message['chat']['id']
        text = message.get('text')
        if text:
            process_command(chat_id, text)

def process_command(chat_id, text):
    # Пример обработки команды
    if text == '/start':
        send_message(chat_id, "Привет! Добро пожаловать в игру!")
    elif text == '/status':
        send_message(chat_id, "Твой статус: здоров!")

def send_message(chat_id, text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    data = {"chat_id": chat_id, "text": text}
    response = requests.post(url, data=data)
    if not response.ok:
        print("Ошибка отправки сообщения:", response.text)

if __name__ == '__main__':
    app.run(port=5000)
