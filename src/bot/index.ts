import { Bot, Context, session, SessionFlavor } from "grammy";
import { Redis } from "@upstash/redis";
import { config, validateConfig } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import type { SessionData } from "../types/session.js";
import { UpstashStorageAdapter } from "../lib/upstash-storage-adapter.js";
import { errorHandler } from "./middleware/error-handler.js";
import { handleStart, handleHelp, handleClear, handleDone, handleCancel } from "./handlers/commands.js";
import { handleForwardedMessage } from "./handlers/forwarded-message.js";
import { handleCallbackQuery } from "./handlers/callback-query.js";
import { handleTextMessage } from "./handlers/text-message.js";

validateConfig();

export type MyContext = Context & SessionFlavor<SessionData>;

export const bot = new Bot<MyContext>(config.botToken);

// Use Upstash Redis for session storage (required for webhooks + conversations)
const redis = new Redis({
  url: config.upstashRedisUrl,
  token: config.upstashRedisToken,
});

const storage = new UpstashStorageAdapter<SessionData>(redis);

bot.use(
  session({
    initial: (): SessionData => ({
      messageQueue: [],
      state: "idle",
    }),
    storage,
    getSessionKey: (ctx) => {
      // Use user ID as session key to maintain state across conversations
      return ctx.from?.id.toString();
    },
  })
);

// Commands
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("clear", handleClear);
bot.command("cancel", handleCancel);
bot.command("done", handleDone);

// Callback queries (button clicks)
bot.on("callback_query:data", handleCallbackQuery);

// Messages
bot.on("message", async (ctx, next) => {
  // Handle forwarded messages
  if (ctx.message.forward_origin) {
    await handleForwardedMessage(ctx);
    return;
  }
  
  // Handle text messages based on state
  if (ctx.message.text && !ctx.message.text.startsWith("/")) {
    await handleTextMessage(ctx);
    return;
  }
  
  await next();
});

bot.catch(errorHandler);

logger.info("Bot initialized successfully");
