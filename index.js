// index.js — Render için Express + Telegraf webhook
import express from "express";
import { Telegraf } from "telegraf";
import { getSpotPrice, getSignals } from "./lib/panelApi.js";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");

const bot = new Telegraf(token);

// ---- Komutlar ----
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

bot.command("about", (ctx) => ctx.reply("KriptoGözü • Telegram botu (Render)"));
bot.command("ping", (ctx) => ctx.reply("pong"));

bot.command("price", async (ctx) => {
  try {
    const parts = ctx.message.text.trim().split(/\s+/);
    const symbol = (parts[1] || "BTCUSDT").toUpperCase();
    const price = await getSpotPrice(symbol);
    return ctx.reply(price ? `${symbol} fiyatı: ${price}` : `Fiyat bulunamadı: ${symbol}`);
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
    const lines = signals.map(
      (s, i) =>
        `${i + 1}. ${s.symbol} • ${s.direction.toUpperCase()} • Pot: ${s.potential}% • Güven: ${s.confidence}%`
    );
    return ctx.reply(lines.join("\n"));
  } catch (err) {
    console.error("/signals error", err);
    return ctx.reply("Sinyaller alınamadı.");
  }
});

// ---- Express server ----
const app = express();
app.use(express.json());

const SECRET = process.env.TELEGRAM_SECRET_TOKEN;

app.get("/", (_, res) => res.status(200).send("OK"));

// Telegram webhook endpoint
app.post("/webhook", (req, res) => {
  if (SECRET && req.get("x-telegram-bot-api-secret-token") !== SECRET) {
    return res.status(401).send("unauthorized");
  }
  bot.handleUpdate(req.body, res);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot up on :" + PORT));
