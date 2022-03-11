import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import {getRandomInt} from './randomInt.js'

dotenv.config()
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.inlineQuery('a', (ctx) => {
    let apchuSize = getRandomInt(3, 40)
    let answer = `Сегодня ты дал ${apchuSize} сантиметровый апчу`
    let id = 0

    ctx.answerInlineQuery([
      {
        id: `${id}`,
        type: 'article',
        title: 'Апщу бер',
        input_message_content: {
          message_text: answer,
        },
        description: 'Покажет, насколько большой у тебя апщу'
      }      
    ])

    id++
  })

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))