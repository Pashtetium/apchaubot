import { Telegraf, Context } from "telegraf";
import { getApchuSize } from "./apchuSize.js";
import { getEmoji } from "./emoji.js";
import { MongoDbDriver, Stats } from "./storage/mongodb/mongoDbDriver.js";
import express from "express";
import { isVipUser } from "./vip-list.js";
import { isUltraVipUser } from "./vip-list.js";
import { isAdmin } from "./admin-list.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 8080;
const dbConnectionString = process.env.MONGODB_CONNECTION_STRING;

let httpServer: any;

async function init() {
  if (!BOT_TOKEN || !dbConnectionString) {
    console.error("Env variables not found");
    return;
  }

  const [mongoClient, err] = await setupStorage(dbConnectionString);
  if (!mongoClient) throw err;

  httpServer = setupRoutes();

  const bot = await setupBot(BOT_TOKEN, mongoClient);

  setupGracefulShutdown(bot, mongoClient);
}

init();

function setupRoutes() {
  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
  });

  return server;
}

function setupGracefulShutdown(bot: Telegraf, mongoClient: MongoDbDriver) {
  process.once("SIGINT", async () => {
    await mongoClient.closeConnection();
    bot.stop("SIGINT");
  });
  process.once("SIGTERM", async () => {
    await mongoClient.closeConnection();
    bot.stop("SIGTERM");
  });
  process.once("SIGHUP", async () => {
    await mongoClient.closeConnection();
    bot.stop("SIGHUP");
  });
}

async function setupBot(BOT_TOKEN: string, mongoClient: MongoDbDriver) {
  const bot = new Telegraf(BOT_TOKEN);

  bot.on("inline_query", async (ctx: Context) => {
    let apchuSize = getApchuSize();
    const isVip = isVipUser(ctx.from?.id);
    const isUltraVip = isUltraVipUser(ctx.from?.id);
    if (isVip) {
      apchuSize += 5;
    }

    if (isUltraVip) {
      apchuSize += 50;
    }

    const emoji = getEmoji(apchuSize);
    const answer = `Сегодня ты дал Апщу на ${apchuSize}см. ${emoji} ${
      isUltraVip ? "⭐ULTRA VIP⭐" : isVip ? "💎ᴠɪᴘ💎" : ""
    }`;

    const averageSize = await mongoClient.getAverageSizeForUser(ctx.from?.id);

    const statsAnswer = `Твой средний размер за всё время - ${averageSize}см. ${getEmoji(
      averageSize
    )}`;

    const sponsors = await mongoClient.getSponsors();
    console.log("Fetched sponsors:", sponsors);
    let sponsorsAnswer = "Список спонсоров:\n\n";
    if (sponsors.length === 0) {
      sponsorsAnswer += "Пока нет спонсоров.";
    } else {
      sponsors.forEach((sponsor, index) => {
        sponsorsAnswer += `${index + 1}. [${sponsor.name}](${sponsor.url})\n`;
      });
    }

    ctx.answerInlineQuery(
      [
        {
          id: `apchu_${apchuSize}`,
          type: "article",
          title: "Апщу бер",
          input_message_content: {
            message_text: answer,
          },
          description: "Покажет, насколько большой у тебя апщу",
        },
        {
          id: "stats",
          type: "article",
          title: "Твоя статистика",
          input_message_content: {
            message_text: statsAnswer,
          },
          description: "Покажет твой средний размер",
        },
        {
          id: "sponsors",
          type: "article",
          title: "Список спонсоров",
          input_message_content: {
            message_text: sponsorsAnswer,
            parse_mode: "Markdown",
          },
          description: "Показать список спонсоров",
        },
      ],
      { is_personal: true, cache_time: 43200 }
    );
  });

  bot.on("chosen_inline_result", async (ctx: Context) => {
    const resultId = ctx.chosenInlineResult?.result_id;

    if (resultId?.startsWith("apchu_")) {
      const apchuSize = parseInt(resultId.replace("apchu_", ""), 10);

      const stats: Stats = {
        userId: ctx.from?.id,
        firstName: ctx.from?.first_name,
        lastName: ctx.from?.last_name,
        userName: ctx.from?.username,
        apchuSize,
      };

      try {
        await mongoClient.saveStats(stats);
      } catch (e) {
        console.error(e);
      }
    }
  });

  bot.command("addsponsor", async (ctx: Context) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply("У вас нет прав для выполнения этой команды.");
      return;
    }

    const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : undefined;
    const args = messageText?.split(" ").slice(1);
    if (!args || args.length < 2) {
      await ctx.reply("Использование: /addsponsor <название> <ссылка>");
      return;
    }

    const name = args[0];
    const url = args.slice(1).join(" ");

    try {
      await mongoClient.addSponsor(name, url);
      await ctx.reply(`Спонсор "${name}" успешно добавлен!`);
    } catch (e) {
      console.error(e);
      await ctx.reply("Ошибка при добавлении спонсора.");
    }
  });

  bot.command("removesponsor", async (ctx: Context) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply("У вас нет прав для выполнения этой команды.");
      return;
    }

    const messageText = ctx.message && "text" in ctx.message ? ctx.message.text : undefined;
    const args = messageText?.split(" ").slice(1);
    if (!args || args.length < 1) {
      await ctx.reply("Использование: /removesponsor <название>");
      return;
    }

    const name = args.join(" ");

    try {
      await mongoClient.removeSponsor(name);
      await ctx.reply(`Спонсор "${name}" успешно удален!`);
    } catch (e) {
      console.error(e);
      await ctx.reply("Ошибка при удалении спонсора.");
    }
  });

  bot.command("shutdown", async (ctx: Context) => {
    if (!isAdmin(ctx.from?.id)) {
      await ctx.reply("У вас нет прав для выполнения этой команды.");
      return;
    }

    await ctx.reply("Останавливаю бота...");
    console.log("Shutdown command received from admin, stopping bot...");

    setTimeout(async () => {
      console.log("Closing HTTP server...");
      httpServer.close(() => {
        console.log("HTTP server closed");
      });

      console.log("Closing MongoDB connection...");
      await mongoClient.closeConnection();

      console.log("Stopping bot...");
      bot.stop();

      console.log("Exiting process...");
      process.exit(0);
    }, 1000);
  });

  bot.launch();

  return bot;
}

async function setupStorage(
  dbConnectionString: string
): Promise<[MongoDbDriver, null] | [null, unknown]> {
  const mongo = new MongoDbDriver(dbConnectionString);

  try {
    await mongo.openConnection();
    return [mongo, null];
  } catch (e) {
    return [null, e];
  }
}
