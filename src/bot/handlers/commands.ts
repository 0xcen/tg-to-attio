import { CommandContext, InlineKeyboard } from "grammy";
import type { MyContext } from "../index.js";
import { logger } from "../../lib/logger.js";
import { getRecentCompanies } from "../../services/redis/client.js";

export async function handleStart(ctx: CommandContext<MyContext>) {
  logger.info("User started bot", { userId: ctx.from?.id });
  
  await ctx.reply(
    `👋 Welcome to the Attio CRM Bot!

📋 **How it works:**

1️⃣ Forward me messages from your customer conversations (forward as many as you need)

2️⃣ When you're done forwarding, send /done

3️⃣ Select which company they belong to

4️⃣ All messages will be added to that company in Attio as separate notes

**Commands:**
/done - Process queued messages
/clear - Clear message queue
/cancel - Cancel current operation
/help - Show this help message

Ready to get started? Forward me your first message! 🚀`,
    { parse_mode: "Markdown" }
  );
}

export async function handleHelp(ctx: CommandContext<MyContext>) {
  await ctx.reply(
    `📚 **Help & Commands**

**Workflow:**
1. Forward messages to me (one or many)
2. Send /done when finished
3. Choose a company
4. Messages are saved to Attio

**Commands:**
/start - Welcome message
/help - Show this help
/done - Process queued messages
/clear - Clear message queue
/cancel - Cancel operation

**Tips:**
• You can forward multiple messages before using /done
• Each message becomes a separate note in Attio
• Recent companies are saved for quick access
• All messages in a batch go to the same company`,
    { parse_mode: "Markdown" }
  );
}

export async function handleClear(ctx: CommandContext<MyContext>) {
  const queueCount = ctx.session.messageQueue?.length || 0;
  
  if (queueCount === 0) {
    await ctx.reply("✨ Queue is already empty.");
    return;
  }
  
  ctx.session.messageQueue = [];
  ctx.session.selectedCompanyId = undefined;
  ctx.session.selectedCompanyName = undefined;
  ctx.session.searchResults = undefined;
  ctx.session.state = "idle";
  
  logger.info("User cleared message queue", { 
    userId: ctx.from?.id,
    clearedCount: queueCount,
  });
  
  await ctx.reply(`🗑️ Cleared ${queueCount} message(s) from queue.`);
}

export async function handleCancel(ctx: CommandContext<MyContext>) {
  ctx.session.messageQueue = [];
  ctx.session.selectedCompanyId = undefined;
  ctx.session.selectedCompanyName = undefined;
  ctx.session.searchResults = undefined;
  ctx.session.state = "idle";
  
  await ctx.reply("❌ Operation cancelled. All data cleared.");
  logger.info("User cancelled operation", { userId: ctx.from?.id });
}

export async function handleDone(ctx: CommandContext<MyContext>) {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply("❌ Unable to identify user.");
    return;
  }

  const queueCount = ctx.session.messageQueue?.length || 0;

  if (queueCount === 0) {
    await ctx.reply("📭 No messages in queue. Forward some messages first!");
    return;
  }

  const messages = ctx.session.messageQueue;
  const firstMessage = messages[0];
  const lastMessage = messages[messages.length - 1];

  const firstDate = new Date(firstMessage.date * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lastDate = new Date(lastMessage.date * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Escape special Markdown characters
  const escapeMarkdown = (text: string) => {
    return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
  };

  const firstPreview = escapeMarkdown(firstMessage.text.substring(0, 100)) + (firstMessage.text.length > 100 ? "..." : "");
  const lastPreview = queueCount > 1 ? escapeMarkdown(lastMessage.text.substring(0, 100)) + (lastMessage.text.length > 100 ? "..." : "") : "";

  const preview = `📊 *Total:* ${queueCount} message(s)
📤 *From:* ${escapeMarkdown(firstMessage.chatName)}
📅 *First:* ${firstDate}
📅 *Last:* ${lastDate}

*First message:* ${firstPreview}
${queueCount > 1 ? `*Last message:* ${lastPreview}` : ""}

Which company are these messages for?`;

  const recentCompanies = await getRecentCompanies(userId);
  ctx.session.recentCompanies = recentCompanies;

  const keyboard = new InlineKeyboard();

  if (recentCompanies.length > 0) {
    for (let i = 0; i < Math.min(recentCompanies.length, 4); i++) {
      const company = recentCompanies[i];
      keyboard.text(`🏢 ${company.name}`, `select:${company.id}`);
      if (i % 2 === 1) keyboard.row();
    }
    
    if (recentCompanies.length % 2 !== 0) {
      keyboard.row();
    }
  }

  keyboard.text("🔍 Search company", "search").row();
  keyboard.text("❌ Cancel", "cancel");

  ctx.session.state = "awaiting_company_selection";

  await ctx.reply(preview, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
  
  logger.info("User initiated /done", { userId, queueCount });
}
