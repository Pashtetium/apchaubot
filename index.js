import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import { getApchuSize } from "./apchuSize.js";
import { getEmoji } from "./emoji.js";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const connectionString = process.env.MONGODB_CONNECTION_STRING;

const client = new MongoClient(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const saveStats = async (ctx) => {
  const stats = {
    userId: ctx.from.id,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name,
    userName: ctx.from.username,
  };

  const groupId = ctx;

  await client.connect((err) => {
    const collection = client.db().collection(groupId);
    // perform actions on the collection object
    console.log(collection);
    client.close();
  });
};

bot.on("inline_query", async (ctx) => {
  let apchuSize = getApchuSize();
  console.log("apchuSize = " + apchuSize);
  let emoji = getEmoji(apchuSize);
  console.log("emoji = " + emoji);

  let answer = `Сегодня ты дал Апщу на ${apchuSize}см. ${emoji}`;
  console.log("answer = " + answer);

  if (ctx?.chat_type === "group") {
    saveStats(ctx);
  }

  const chat = await ctx.getChat();

  console.log(chat.id);

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
