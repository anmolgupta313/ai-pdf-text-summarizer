import OpenAI from "openai";

const { NextResponse } = require("next/server");

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:
    "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",
});
export const POST = async (req) => {
  const { question, sumamry } = await req.json();

  console.log(question, "ques");
  console.log(sumamry, "summ");

  const completion = await client.chat.completions.create({
    model: "meta-llama/llama-3.3-70b-instruct:free",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant. Use this summary to answer question:\n\n${sumamry}`,
      },
      { role: "user", content: question },
    ],
  });

  return NextResponse.json({
    success: true,
    message: sumamry,
    answer: completion.choices[0].message.content,
  });
};
