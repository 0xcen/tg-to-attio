import { webhookCallback } from "grammy";
import { bot } from "../src/bot/index.js";

export default webhookCallback(bot, "http");
