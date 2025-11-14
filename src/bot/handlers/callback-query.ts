import { InlineKeyboard } from "grammy";
import type { MyContext } from "../index.js";
import { logger } from "../../lib/logger.js";
import { attioClient } from "../../services/attio/client.js";
import { formatMessagesForSingleNote } from "../../services/attio/formatters.js";
import { updateRecentCompanies } from "../../services/redis/client.js";

export async function handleCallbackQuery(ctx: MyContext) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  await ctx.answerCallbackQuery();

  // Handle cancel
  if (data === "cancel") {
    ctx.session.messageQueue = [];
    ctx.session.selectedCompanyId = undefined;
    ctx.session.selectedCompanyName = undefined;
    ctx.session.searchResults = undefined;
    ctx.session.state = "idle";
    
    await ctx.editMessageText("❌ Operation cancelled. Message queue cleared.");
    logger.info("User cancelled via button", { userId: ctx.from?.id });
    return;
  }

  // Handle search button
  if (data === "search") {
    ctx.session.state = "awaiting_company_search";
    await ctx.editMessageText("🔍 Type the company name to search:");
    logger.info("User clicked search", { userId: ctx.from?.id });
    return;
  }

  // Handle company selection
  if (data.startsWith("select:")) {
    const companyId = data.replace("select:", "");
    const company =
      ctx.session.recentCompanies?.find((c) => c.id === companyId) ||
      ctx.session.searchResults?.find((c) => c.id === companyId);

    if (!company) {
      await ctx.editMessageText("❌ Company not found. Please try again or use /cancel");
      return;
    }

    ctx.session.selectedCompanyId = company.id;
    ctx.session.selectedCompanyName = company.name;
    ctx.session.state = "awaiting_confirmation";

    const queueCount = ctx.session.messageQueue?.length || 0;
    const keyboard = new InlineKeyboard()
      .text("✓ Confirm", "confirm")
      .text("← Back", "back")
      .text("❌ Cancel", "cancel");

    await ctx.editMessageText(
      `Add ${queueCount} message(s) to **${company.name}**?

This will create ${queueCount} note(s) in Attio.`,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      }
    );
    
    logger.info("User selected company", { userId: ctx.from?.id, companyId, companyName: company.name });
    return;
  }

  // Handle back button
  if (data === "back") {
    // Reset to awaiting_company_selection state
    ctx.session.selectedCompanyId = undefined;
    ctx.session.selectedCompanyName = undefined;
    ctx.session.state = "awaiting_company_selection";
    
    // Show company selection again (could refactor to reuse /done logic)
    await ctx.editMessageText("Going back... Please use /done again to select a company.");
    return;
  }

  // Handle confirm button
  if (data === "confirm") {
    await saveMessagesToCompany(ctx);
    return;
  }
}

async function saveMessagesToCompany(ctx: MyContext) {
  const companyId = ctx.session.selectedCompanyId;
  const companyName = ctx.session.selectedCompanyName;
  const messages = ctx.session.messageQueue || [];

  if (!companyId || !companyName || messages.length === 0) {
    await ctx.editMessageText("❌ Missing required data. Please try again with /done");
    return;
  }

  await ctx.editMessageText(`💾 Saving messages...`);

  try {
    const formatted = formatMessagesForSingleNote(messages);

    const note = await attioClient.createNote({
      parent_object: "companies",
      parent_record_id: companyId,
      title: formatted.title,
      format: "markdown",
      content: formatted.content,
    });

    if (ctx.from?.id) {
      await updateRecentCompanies(ctx.from.id, companyId, companyName);
    }

    await ctx.editMessageText(
      `✅ Successfully added ${messages.length} message(s) to **${companyName}**!`,
      { parse_mode: "Markdown" }
    );

    logger.info("Messages saved to company", {
      userId: ctx.from?.id,
      companyId,
      companyName,
      messageCount: messages.length,
      noteId: note.id.note_id,
    });

    // Clear session
    ctx.session.messageQueue = [];
    ctx.session.selectedCompanyId = undefined;
    ctx.session.selectedCompanyName = undefined;
    ctx.session.searchResults = undefined;
    ctx.session.state = "idle";
  } catch (error) {
    logger.error("Failed to save messages", {
      error: error instanceof Error ? error.message : String(error),
      companyId,
      companyName,
    });

    await ctx.editMessageText(
      "❌ Failed to save messages. Please try again or contact support."
    );
  }
}
