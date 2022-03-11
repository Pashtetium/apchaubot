import dotenv from 'dotenv'
import { Telegraf } from 'telegraf'
import {getRandomInt} from './randomInt.js'

dotenv.config()
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
  ctx.reply('Hello ' + ctx.from.first_name + '!');
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))