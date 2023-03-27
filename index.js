import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { getApchuSize } from "./apchuSize.js";
import { getEmoji } from "./emoji.js";
import { vipList } from "./vip-list.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on("inline_query", (ctx) => {
  let apchuSize = getApchuSize();
  const emoji = getEmoji(apchuSize);
  const isVipKazakh =
    vipList.find((vip) => ctx.from?.username === vip)?.length > 0;

  if (isVipKazakh) {
    apchuSize += 10;
  }

  const answer = `Сегодня ты дал Апщу на ${apchuSize}см. ${
    isVipKazakh ? "😎(vip)😎" : emoji
  }`;

  ctx.answerInlineQuery(
    [
      {
        id: "1",
        type: "article",
        title: "Апщу бер",
        input_message_content: {
          message_text: answer,
        },
        description: "Покажет, насколько большой у тебя апщу",
      },
    ],
    { is_personal: true, cache_time: 43200 }
  );
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
