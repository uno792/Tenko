import * as cheerio from "cheerio";

export async function fetchText(url: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const html = await res.text();
    const $ = cheerio.load(html);
    const text = [
      $("title").text(),
      $("h1,h2,h3,h4").text(),
      $("time").text(),
      $("a").text(),
      $("p,li").text()
    ].join("\n");
    return text.replace(/\s+\n/g, "\n").replace(/\n{2,}/g, "\n").trim();
  } finally {
    clearTimeout(t);
  }
}
