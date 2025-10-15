import OpenAI from "openai";

const { NextResponse } = require("next/server");
import * as cheerio from "cheerio";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
     process.env.LLM_API_Key,
});
export const POST = async (req) => {
  try {
    const body = await req.json();
    const url = body.body;

    // Fetch website HTML
    const res = await fetch(url);
    const html = await res.text();

    // Extract readable text from HTML
    const $ = cheerio.load(html);
    const text = $("body").text().replace(/\s+/g, " ").trim();

    // Send text to model for summarization
    const completion = await client.chat.completions.create({
      model: "meta-llama/llama-3.3-70b-instruct:free",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes website content clearly and comprehensively.",
        },
        {
          role: "user",
          content: `Here is the website content:\n\n${text}`,
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
