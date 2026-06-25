import OpenAI from "openai";
// import { YoutubeTranscript } from "youtube-transcript";

const { NextResponse } = require("next/server");
import * as cheerio from "cheerio";

const client = new OpenAI({
  apiKey: process.env.LLM_API_Key,
});

function getYouTubeVideoId(url) {
  try {
    const uTube = new URL(url);
    if (uTube.hostname.includes("youtube.com"))
      return uTube.searchParams.get("v");
    if (uTube.hostname === "youtu.be") return uTube.pathname.slice(1);
  } catch {}
  return null;
}

// async function fetchYouTubeTranscript(videoId) {
//   try {
//     const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
//       lang: "en",
//     });

//     if (!transcriptItems || transcriptItems.length === 0) return null;

//     return transcriptItems
//       .map((item) => item.text)
//       .join(" ")
//       .replace(/\s+/g, " ")
//       .trim();
//   } catch {
//     try {
//       const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
//       if (!transcriptItems || transcriptItems.length === 0) return null;
//       return transcriptItems
//         .map((item) => item.text)
//         .join(" ")
//         .replace(/\s+/g, " ")
//         .trim();
//     } catch {
//       return null;
//     }
//   }
// }

async function fetchYouTubeTranscript(videoId) {
  const proxyUrl = process.env.YT_PROXY_URL;
  const secret = process.env.PROXY_SECRET;

  if (!proxyUrl)
    throw new Error("YT_PROXY_URL is not set in environment variables.");

  const res = await fetch(`${proxyUrl}/transcript?videoId=${videoId}`, {
    headers: {
      "x-proxy-secret": secret || "",
    },
  });

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Proxy returned an error.");
  }

  return data.transcript || null;
}

export const POST = async (req) => {
  try {
    const body = await req.json();
    const url = body.body;
    if (!url) {
      return NextResponse.json({ success: false, error: "No URL provided." });
    }
    // Fetch website HTML
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching ${url}`);
    }
    const html = await res.text();

    // Extract readable text from HTML
    const $ = cheerio.load(html);
    $(
      "script, style, nav, footer, header, noscript, iframe, [aria-hidden='true']",
    ).remove();
    const article =
      $("article").text() ||
      $("main").text() ||
      $('[role="main"]').text() ||
      $("body").text();

    const text = article.replace(/\s+/g, " ").trim();

    let contentText = "";
    let contentSource = "webpage";

    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      contentSource = "youtube";
      const transcript = await fetchYouTubeTranscript(videoId);

      if (!transcript) {
        return NextResponse.json({
          success: false,
          error:
            "Could not retrieve a transcript for this YouTube video. " +
            "The video may have captions disabled or be age-restricted.",
        });
      }
      contentText = transcript;
    } else {
      contentText = text;

      if (!contentText || contentText.length < 100) {
        return NextResponse.json({
          success: false,
          error:
            "The page returned very little readable text. It may require " +
            "JavaScript to render, or access may be restricted.",
        });
      }
    }

    const systemPrompt =
      contentSource === "youtube"
        ? `You are an expert summarizer. The user provides a YouTube video transcript. Summarize it clearly and in depth: what the video is about, the key points made, and any conclusions. Use plain English .`
        : `You are an expert summarizer. The user provides scraped webpage ${text}. Summarize it clearly and in depth: the topic, the main information, and any key takeaways. Use plain English.`;
    //     const prompt = `
    // You are GPT-5.1. Summarize the following website text into a deep,.
    // Do NOT include HTML or code and scripts if it does get that in content then just return webiste is ristricted. Summarize as if you had full page access.

    // TEXT CONTENT STARTS BELOW:
    // ${text}
    // TEXT CONTENT ENDS HERE.

    // `;

    // const prompt =`You summarize website content in depth.`

    const prompt =
      contentSource === "youtube"
        ? `Summarize this YouTube video ${contentText}`
        : `Summarize this webpage content from ${url}`;
    const completion = await client.chat.completions.create({
      model: "gpt-5.1",

      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      url,
      sumamry: completion.choices[0].message.content,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
};
