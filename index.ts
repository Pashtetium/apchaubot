import { Telegraf, Context } from "telegraf";
import { getApchuSize } from "./apchuSize.js";
import { getEmoji } from "./emoji.js";
import { isVipUser } from "./vip-list.js";
import { MongoDbDriver, Stats } from "./storage/mongodb/mongoDbDriver.js";

async function main() {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;

  if (!process.env.BOT_TOKEN || !connectionString) {
    throw new Error("Env variables not found");
  }

  const mongo = new MongoDbDriver(connectionString);

  try {
    await mongo.openConnection();
  } catch (e) {
    console.error(e);
  }

  const bot = new Telegraf(process.env.BOT_TOKEN);

  bot.on("inline_query", async (ctx: Context) => {
    let apchuSize = getApchuSize();
    const emoji = getEmoji(apchuSize);
    const isVipKazakh = isVipUser(ctx.from?.id);

    if (isVipKazakh) {
      apchuSize += 10;
    }

    const answer = `Сегодня ты дал Апщу на ${apchuSize}см. ${
      isVipKazakh ? "😎(vip)😎" : emoji
    }`;

    const stats: Stats = {
      userId: ctx.from?.id,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      userName: ctx.from?.username,
      apchuSize,
    };

    try {
      const savedStats = await mongo.saveStats(stats);
      console.info(savedStats);
    } catch (e) {
      console.error(e);
    }

    const averageSize = await mongo.getAverageSizeForUser(ctx.from?.id);

    const statsAnswer = `Твой средний размер за всё время - ${getEmoji(
      averageSize
    )}`;

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
        {
          id: "2",
          type: "article",
          title: "Твоя статистика",
          input_message_content: {
            message_text: statsAnswer,
          },
          description: "Покажет твой средний размер",
        },
      ],
      { is_personal: true, cache_time: 43200 }
    );
  });

  bot.launch();

  // Enable graceful stop
  process.once("SIGINT", async () => {
    await mongo.closeConnection();
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", async () => {
    await mongo.closeConnection();
    bot.stop("SIGTERM");
  });
}

main();
