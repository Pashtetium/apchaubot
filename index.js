import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import {getRandomInt} from './randomInt.js'

dotenv.config()
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('inline_query', (ctx) => {
    // const apchuSize = getRandomInt(3, 40)
    let answer = `Сегодня ты дал 15 сантиметровый апчу`
  
    ctx.answerInlineQuery([
      {
        type: 'article',
        title: 'Апщу бер',
        input_message_content: {
          message_text: answer,
        },
        description: 'Покажет, насколько большой у тебя апщу'
      }      
    ])
  })

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))