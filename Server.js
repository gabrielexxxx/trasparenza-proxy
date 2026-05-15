// ============================================================
//  Proxy server — Analisi Trasparenza Comuni
//  Node.js + Express
//  Avvio: node server.js
// ============================================================

const express = require(“express”);
const cors    = require(“cors”);
const axios   = require(“axios”);
const cheerio = require(“cheerio”);

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── GET /fetch-page?url=https://… ──────────────────────────
// Scarica la pagina remota e restituisce il testo visibile
app.get(”/fetch-page”, async (req, res) => {
const { url } = req.query;

if (!url) {
return res.status(400).json({ error: “Parametro ‘url’ mancante” });
}

try {
const response = await axios.get(url, {
timeout: 15000,
headers: {
“User-Agent”:
“Mozilla/5.0 (Windows NT 10.0; Win64; x64) “ +
“AppleWebKit/537.36 (KHTML, like Gecko) “ +
“Chrome/124.0.0.0 Safari/537.36”,
“Accept-Language”: “it-IT,it;q=0.9”,
},
});

```
const $ = cheerio.load(response.data);

// Rimuovi tag inutili
$("script, style, noscript, iframe, svg, img").remove();

// Estrai testo visibile pulito
const testo = $("body")
  .text()
  .replace(/\s{3,}/g, "\n")   // comprimi spazi
  .replace(/\n{4,}/g, "\n\n") // comprimi righe vuote
  .trim()
  .slice(0, 12000);            // tronca a 12k caratteri

// Estrai anche tutti i link con il loro testo (utile per vedere le voci AT)
const links = [];
$("a").each((_, el) => {
  const href  = $(el).attr("href") || "";
  const label = $(el).text().trim();
  if (label.length > 2 && label.length < 120) {
    links.push({ label, href });
  }
});

return res.json({
  url,
  testo,
  links: links.slice(0, 300), // max 300 link
});
```

} catch (err) {
return res.status(500).json({
error: `Impossibile raggiungere la pagina: ${err.message}`,
});
}
});

// ── Health check ─────────────────────────────────────────────
app.get(”/”, (_, res) => res.json({ status: “ok”, service: “trasparenza-proxy” }));

app.listen(PORT, () => {
console.log(`✅  Proxy attivo su http://localhost:${PORT}`);
});
