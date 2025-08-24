// api/telegram.js
import { Telegraf } from "telegraf";
import { webhookCallback } from "telegraf";
import { getSpotPrice, getSignals } from "../lib/panelApi.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is missing");
}

const bot = new Telegraf(token, {});

bot.start((ctx) => ctx.reply("KriptoGözü botuna hoş geldin! /help ile komutları gör."));
bot.help((ctx) =>
  ctx.reply(
    [
      "Komutlar:",
      "/ping – Bot canlı mı kontrol eder",
      "/price BTCUSDT – İstenen sembolün fiyatı",
      "/signals – Panel sinyalleri",
      "/about – Bilgi"
    ].join("\n")
  )
);
bot.command("about", (ctx) => ctx.reply("KriptoGözü • webhook tabanlı Telegram botu"));
bot.command("ping", (ctx) => ctx.reply("pong"));

bot.command("price", async (ctx) => {
  try {
    const parts = ctx.message.text.trim().split(/\s+/);
    const symbol = (parts[1] || "BTCUSDT").toUpperCase();
    const price = await getSpotPrice(symbol);
    if (!price) return ctx.reply(`Fiyat bulunamadı: ${symbol}`);
    return ctx.reply(`${symbol} fiyatı: ${price}`);
  } catch (err) {
    console.error("/price error", err);
    return ctx.reply("Bir hata oluştu.");
  }
});

bot.command("signals", async (ctx) => {
  try {
    const signals = await getSignals();
    if (!signals || signals.length === 0) {
      return ctx.reply("Şu an paylaşılacak sinyal yok.");
    }
    const lines = signals.map((s, i) =>
      `${i + 1}. ${s.symbol} • ${s.direction.toUpperCase()} • Potansiyel: ${s.potential}% • Güven: ${s.confidence}%`
    );
    return ctx.reply(lines.join("\n"));
  } catch (err) {
    console.error("/signals error", err);
    return ctx.reply("Sinyaller alınamadı.");
  }
});

export const config = { runtime: "nodejs18.x" };
const tgWebhook = webhookCallback(bot, "express");

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).send("OK");
  if (req.method === "POST") return tgWebhook(req, res);
  return res.status(405).send("Method Not Allowed");
}
