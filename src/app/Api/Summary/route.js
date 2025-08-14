import OpenAI from "openai";

const { NextResponse } = require("next/server");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_Key,
});
export const POST = async (req) => {
  const body = await req.json();

  const completion = await client.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: `${JSON.stringify(body)}`,
      },
    ],
  });

  return NextResponse.json({
    success: true,
    message: body,
    sumamry: completion.choices[0].message.content,
  });
};
