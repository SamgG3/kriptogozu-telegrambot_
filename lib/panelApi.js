// lib/panelApi.js
const BASE_URL = process.env.PANEL_BASE_URL || "";

// Panel veya mock fiyat
export async function getSpotPrice(symbol) {
  try {
    if (BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/price?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.price ?? null;
    }
    // Panel henüz yoksa mock
    if (symbol === "BTCUSDT") return "65000.00";
    if (symbol === "ETHUSDT") return "3200.00";
    return null;
  } catch (e) {
    console.error("getSpotPrice error", e);
    return null;
  }
}

// Panel veya mock sinyaller
export async function getSignals() {
  try {
    if (BASE_URL) {
      const res = await fetch(`${BASE_URL}/api/signals`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    // Mock örnek
    return [
      { symbol: "BTCUSDT", direction: "long", potential: 12.4, confidence: 71 },
      { symbol: "ETHUSDT", direction: "short", potential: 10.8, confidence: 67 },
    ];
  } catch (e) {
    console.error("getSignals error", e);
    return [];
  }
}
