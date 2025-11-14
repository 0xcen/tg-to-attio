import { ErrorHandler } from "grammy";
import { logger } from "../../lib/logger.js";

export const errorHandler: ErrorHandler = async (err) => {
  const { ctx, error } = err;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  logger.error("Bot error occurred", {
    error: errorMessage,
    stack: errorStack,
    updateType: ctx.update.update_id,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });

  try {
    await ctx.reply(
      "❌ An error occurred while processing your request. Please try again or use /cancel to reset.",
      { parse_mode: "Markdown" }
    );
  } catch (replyError) {
    logger.error("Failed to send error message to user", {
      error: replyError instanceof Error ? replyError.message : String(replyError),
    });
  }
};
