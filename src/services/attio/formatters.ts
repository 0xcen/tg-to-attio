import type { Message } from "grammy/types";

export interface ForwardedMessageData {
  text: string;
  senderUsername?: string;
  senderFirstName?: string;
  senderLastName?: string;
  chatName: string;
  date: number;
  messageId: number;
  hasMedia?: boolean;
  mediaType?: string;
}

export function extractForwardedMessageData(message: Message): ForwardedMessageData | null {
  if (!message.forward_origin) {
    return null;
  }

  let senderUsername: string | undefined;
  let senderFirstName: string | undefined;
  let senderLastName: string | undefined;
  let chatName = "Unknown";

  const origin = message.forward_origin;

  if (origin.type === "user") {
    senderUsername = origin.sender_user.username;
    senderFirstName = origin.sender_user.first_name;
    senderLastName = origin.sender_user.last_name;
    chatName = [senderFirstName, senderLastName].filter(Boolean).join(" ");
  } else if (origin.type === "chat") {
    chatName = origin.sender_chat.title || "Unknown Chat";
  } else if (origin.type === "channel") {
    chatName = origin.chat.title || "Unknown Channel";
  } else if (origin.type === "hidden_user") {
    chatName = origin.sender_user_name || "Hidden User";
  }

  const text = message.text || message.caption || "";
  const hasMedia = !!(message.photo || message.video || message.document || message.audio);
  
  let mediaType: string | undefined;
  if (message.photo) mediaType = "photo";
  else if (message.video) mediaType = "video";
  else if (message.document) mediaType = "document";
  else if (message.audio) mediaType = "audio";
  else if (message.voice) mediaType = "voice";
  else if (message.video_note) mediaType = "video_note";

  return {
    text,
    senderUsername,
    senderFirstName,
    senderLastName,
    chatName,
    date: message.date,
    messageId: message.message_id,
    hasMedia,
    mediaType,
  };
}

export function formatMessageForAttio(data: ForwardedMessageData): { title: string; content: string } {
  const date = new Date(data.date * 1000);
  const formattedDate = date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const sender = data.senderUsername 
    ? `@${data.senderUsername}`
    : [data.senderFirstName, data.senderLastName].filter(Boolean).join(" ") || "Unknown";

  const title = `Message from ${data.chatName} - ${formattedDate}`;

  let content = `**Forwarded from:** ${data.chatName}\n`;
  content += `**Sender:** ${sender}\n`;
  content += `**Date:** ${formattedDate}\n`;
  
  if (data.hasMedia && data.mediaType) {
    content += `**Media:** ${data.mediaType}\n`;
  }
  
  content += `\n---\n\n`;
  
  if (data.text) {
    content += data.text;
  } else if (data.hasMedia) {
    content += `[${data.mediaType} message]`;
  } else {
    content += "[No text content]";
  }

  return { title, content };
}

export function formatLocationString(company: { location?: string }): string | undefined {
  return company.location;
}

export function formatMessagesForSingleNote(messages: ForwardedMessageData[]): { title: string; content: string } {
  const now = new Date();
  const formattedDate = now.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get the first message's chat name for the title
  const chatName = messages.length > 0 ? messages[0].chatName : "Unknown";
  const title = `Telegram conversation with ${chatName} - ${formattedDate}`;

  let content = '';

  messages.forEach((data, index) => {
    const date = new Date(data.date * 1000);
    const timeOnly = date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const sender = data.senderUsername 
      ? `@${data.senderUsername}`
      : [data.senderFirstName, data.senderLastName].filter(Boolean).join(" ") || "Unknown";

    // Format like a chat message: [Time] Sender: Message
    content += `**[${timeOnly}] ${sender}:**\n`;
    
    if (data.text) {
      content += `${data.text}\n`;
    } else if (data.hasMedia && data.mediaType) {
      content += `*[sent a ${data.mediaType}]*\n`;
    } else {
      content += `*[empty message]*\n`;
    }

    // Add spacing between messages
    if (index < messages.length - 1) {
      content += `\n`;
    }
  });

  return { title, content };
}
