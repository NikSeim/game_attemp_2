
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackContext

# Ваш токен бота
TOKEN = '7408614164:AAFJaFSrbTFaeQr5QLzplZBT4fOGY_2WVZk'
GAME_URL = 'https://nikseim.github.io/game_attemp_2/'

async def start(update: Update, context: CallbackContext) -> None:
    keyboard = [
        [
            InlineKeyboardButton("Играть", web_app=WebAppInfo(url=GAME_URL)),
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text('Нажмите "Играть", чтобы начать игру.', reply_markup=reply_markup)

def main() -> None:
    application = Application.builder().token(TOKEN).build()

    application.add_handler(CommandHandler("start", start))

    application.run_polling()

if __name__ == '__main__':
    main()
