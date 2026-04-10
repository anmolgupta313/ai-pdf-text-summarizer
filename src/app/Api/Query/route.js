

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { connectDB } from "@/lib/mongodb";
import { PDF, ChatSession, Message } from "@/models";
import { getAuthUser } from "@/lib/auth";

const client = new OpenAI({ apiKey: process.env.LLM_API_Key });

export const POST = async (req) => {
  const { question, rawSumamry, pdfId, sessionId } = await req.json();

  if (pdfId) {
    try {
      const authUser = await getAuthUser();
      if (!authUser) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 }
        );
      }

      await connectDB();

      // Verify PDF belongs to this user
      const pdf = await PDF.findOne({ _id: pdfId, userId: authUser.userId });
      if (!pdf) {
        return NextResponse.json(
          { success: false, error: "PDF not found" },
          { status: 404 }
        );
      }

      // Get or create session
      let session;
      if (sessionId) {
        session = await ChatSession.findOne({
          _id: sessionId,
          userId: authUser.userId,
        });
        if (!session) {
          return NextResponse.json(
            { success: false, error: "Session not found" },
            { status: 404 }
          );
        }
      } else {
        session = await ChatSession.create({
          userId: authUser.userId,
          pdfId: pdf._id,
          title: question.slice(0, 60),
        });
      }

      const history = await Message.find({ sessionId: session._id })
        .sort({ createdAt: 1 })
        .select("role content");

      await Message.create({
        sessionId: session._id,
        role: "user",
        content: question,
      });

      const completion = await client.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant. Answer questions based strictly on the PDF content below.
If the answer is not in the document, say so clearly.

--- PDF CONTENT ---
${pdf.extractedText.slice(0, 80000)}
--- END PDF CONTENT ---`,
          },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: question },
        ],
      });

      const answer = completion.choices[0].message.content;

      // Save assistant reply
      await Message.create({
        sessionId: session._id,
        role: "assistant",
        content: answer,
      });

      return NextResponse.json({
        success: true,
        answer,
        sessionId: session._id,
      });
    } catch (err) {
      console.error("[Query authenticated]", err);
      return NextResponse.json(
        { success: false, error: err.message || "Query failed" },
        { status: 500 }
      );
    }
  }


  try {
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
  } catch (err) {
    console.error("[Query]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Query failed" },
      { status: 500 }
    );
  }
};
