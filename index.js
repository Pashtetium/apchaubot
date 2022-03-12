import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import { getApchuSize } from './apchuSize.js'
import { getEmoji } from './emoji.js'

dotenv.config()
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.on('inline_query', (ctx) => {
    let apchuSize = getApchuSize()
    console.log('apchuSize = ' + apchuSize)
    let emoji = getEmoji(apchuSize)
    console.log('emoji = ' + emoji)

    let answer = `Сегодня ты дал Апщу на ${apchuSize}см. ${emoji}`
    console.log('answer = ' + answer)
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
    ], { is_personal: true, cache_time: 43200})
  })

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))