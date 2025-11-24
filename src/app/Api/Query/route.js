import OpenAI from "openai";

const { NextResponse } = require("next/server");

const client = new OpenAI({
  // baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.LLM_API_Key,
});
export const POST = async (req) => {
  const { question, rawSumamry } = await req.json();

  console.log(question, "ques");
  console.log(rawSumamry, "summ");

  const completion = await client.chat.completions.create({
    model: "gpt-5",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant. Use this summary to answer question:\n\n${rawSumamry}`,
      },
      { role: "user", content: question },
    ],
  });

  return NextResponse.json({
    success: true,
    message: rawSumamry,
    answer: completion.choices[0].message.content,
  });
};
