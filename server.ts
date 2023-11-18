import { Telegraf, Context } from "telegraf";
import { getApchuSize } from "./apchuSize.js";
import { getEmoji } from "./emoji.js";
import { MongoDbDriver, Stats } from "./storage/mongodb/mongoDbDriver.js";
import express from "express";
const app = express();

app.get("/", (req: any, res: any) => {
  res.send("Hello from App Engine!");
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

async function initBot() {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;

  if (!process.env.BOT_TOKEN || !connectionString) {
    console.dir("Env variables not found");
    return;
  }

  const mongo = new MongoDbDriver(connectionString);

  try {
    await mongo.openConnection();
  } catch (e) {
    console.dir(e);
  }

  const bot = new Telegraf(process.env.BOT_TOKEN);

  bot.on("inline_query", async (ctx: Context) => {
    let apchuSize = getApchuSize();
    const emoji = getEmoji(apchuSize);

    const answer = `Сегодня ты дал Апщу на ${apchuSize}см. ${emoji}`;

    const stats: Stats = {
      userId: ctx.from?.id,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
      userName: ctx.from?.username,
      apchuSize,
    };

    try {
      await mongo.saveStats(stats);
    } catch (e) {
      console.error(e);
    }

    const averageSize = await mongo.getAverageSizeForUser(ctx.from?.id);

    const statsAnswer = `Твой средний размер за всё время - ${averageSize}см. ${getEmoji(
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

initBot();
