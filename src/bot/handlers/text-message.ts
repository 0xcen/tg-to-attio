import { InlineKeyboard } from "grammy";
import type { MyContext } from "../index.js";
import { logger } from "../../lib/logger.js";
import { attioClient } from "../../services/attio/client.js";

export async function handleTextMessage(ctx: MyContext) {
  const text = ctx.message?.text;
  if (!text) return;

  // Handle company search input
  if (ctx.session.state === "awaiting_company_search") {
    await ctx.reply("🔍 Searching...");

    try {
      const searchResults = await attioClient.searchCompanies(text);
      ctx.session.searchResults = searchResults;

      if (searchResults.length === 0) {
        const keyboard = new InlineKeyboard()
          .text("← Back", "back")
          .text("❌ Cancel", "cancel");

        await ctx.reply(
          `No companies found for "${text}". Try different terms.`,
          { reply_markup: keyboard }
        );
        return;
      }

      const keyboard = new InlineKeyboard();
      const displayResults = searchResults.slice(0, 5);

      for (const company of displayResults) {
        const label = company.location
          ? `${company.name} - ${company.location}`
          : company.name;
        keyboard.text(label, `select:${company.id}`).row();
      }

      if (searchResults.length > 5) {
        keyboard
          .text(`Showing 5 of ${searchResults.length} results`, "noop")
          .row();
      }

      keyboard.text("← Back", "back").text("❌ Cancel", "cancel");

      ctx.session.state = "awaiting_company_selection";

      await ctx.reply("Select a company:", { reply_markup: keyboard });
      
      logger.info("Company search completed", { 
        userId: ctx.from?.id, 
        query: text, 
        resultsCount: searchResults.length 
      });
    } catch (error) {
      logger.error("Search failed", {
        error: error instanceof Error ? error.message : String(error),
        query: text,
      });
      await ctx.reply(
        "❌ Search failed. Please try again or use /cancel to exit."
      );
    }
    return;
  }

  // If not in a specific state, ignore text messages
  logger.debug("Ignoring text message", { userId: ctx.from?.id, state: ctx.session.state });
}
