import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import {getRandomInt} from './randomInt.js'

dotenv.config()
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('inline_query', (ctx) => {
    const apchuSize = getRandomInt(63, 40)
    let answer = `Сегодня ты дал ${apchuSize} сантиметровый апчу`

    ctx.answerInlineQuery(answer)
  })

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))