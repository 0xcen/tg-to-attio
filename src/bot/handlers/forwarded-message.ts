import type { MyContext } from "../index.js";
import { extractForwardedMessageData } from "../../services/attio/formatters.js";
import { logger } from "../../lib/logger.js";

export async function handleForwardedMessage(ctx: MyContext) {
  if (!ctx.message) {
    return;
  }

  const messageData = extractForwardedMessageData(ctx.message);
  
  if (!messageData) {
    return;
  }

  if (!ctx.session.messageQueue) {
    ctx.session.messageQueue = [];
  }

  ctx.session.messageQueue.push(messageData);
  
  const queueCount = ctx.session.messageQueue.length;
  
  logger.info("Message queued", {
    userId: ctx.from?.id,
    queueCount,
    chatName: messageData.chatName,
  });

  await ctx.reply(
    `📥 Message queued (${queueCount})

Send more messages or use /done to process them.`,
    { parse_mode: "Markdown" }
  );
}
