import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import {getRandomInt} from './randomInt.js'

dotenv.config()
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('inline_query', (ctx) => {
    let apchuSize = getRandomInt(3, 40)
    let answer = `Сегодня ты дал ${apchuSize} сантиметровый апчу`

    ctx.answerInlineQuery([      
      {
        id: '1',
        type: 'article',
        title: 'Апщу бер',
        input_message_content: {
          message_text: answer,
        },
        description: 'Покажет, насколько большой у тебя апщу',
      } 
    ], { is_personal: true })
  })

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))