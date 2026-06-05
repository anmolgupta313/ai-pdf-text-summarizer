// src/app/Api/Summary/Pdf/route.js

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { extractText, getDocumentProxy } from "unpdf";
import { connectDB } from "@/lib/mongodb";
import { PDF } from "@/models";
import { getAuthUser } from "@/lib/auth";

const client = new OpenAI({ apiKey: process.env.LLM_API_Key });

const systemPrompt = `
You are a document parser and summarizer. Your job is to summarize and break the input text into semantically meaningful sections based on content and structure.

Return the result in JSON with the following format:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Cleaned up content of this section"
    }
  ]
}

Only include meaningful content. If it's a resume, detect sections like Contact Info, Summary, Skills, Experience, Projects, Education, etc.
If it's a report or article, detect sections like Introduction, Methodology, Findings, Conclusion, etc.
Do not make up information.
`;

async function summariseText(text) {
  const completion = await client.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
  });
  return completion.choices[0].message.content;
}

// ── Extract text from PDF buffer using unpdf (Node/Edge safe) ────────────────
async function extractPdfText(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8Array);
  const { text } = await extractText(pdf, { mergePages: true });
  return { text: text.trim(), pageCount: pdf.numPages };
}

export const POST = async (req) => {
  const contentType = req.headers.get("content-type") || "";

  // ── Path A: new file upload (multipart/form-data) ─────────────────────────
  if (contentType.includes("multipart/form-data")) {
    try {
      const authUser = await getAuthUser();
      if (!authUser) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }

      const formData = await req.formData();
      const file = formData.get("pdf");

      if (!file || file.type !== "application/pdf") {
        return NextResponse.json(
          { success: false, error: "A PDF file is required" },
          { status: 400 },
        );
      }

      await connectDB();

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Save file to /uploads
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      // const uploadDir = join(process.cwd(), "uploads");
      // await mkdir(uploadDir, { recursive: true });
      // await writeFile(join(uploadDir, filename), buffer);

      // Extract text with unpdf — no browser APIs needed
      const { text: extractedText, pageCount } = await extractPdfText(buffer);

      // Summarise with GPT
      const summaryRaw = await summariseText(extractedText);

      // Save to MongoDB
      const pdf = await PDF.create({
        userId: authUser.userId,
        filename,
        originalName: file.name,
        // filePath: `uploads/${filename}`,
        extractedText,
        summary: summaryRaw,
        pageCount,
        fileSize: buffer.length,
      });

      return NextResponse.json({
        success: true,
        pdfId: pdf._id,
        sumamry: summaryRaw, // typo kept to match stringToJson helper
      });
    } catch (err) {
      console.error("[Summary/Pdf upload error]", err);
      return NextResponse.json(
        { success: false, error: err.message || "Upload failed" },
        { status: 500 },
      );
    }
  }

  // ── Path B: JSON body — { text } or { pdfId } ─────────────────────────────
  try {
    const body = await req.json();
    let text = body.text;

    if (!text && body.pdfId) {
      await connectDB();
      const authUser = await getAuthUser();
      if (!authUser) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }
      const pdf = await PDF.findOne({
        _id: body.pdfId,
        userId: authUser.userId,
      });
      if (!pdf) {
        return NextResponse.json(
          { success: false, error: "PDF not found" },
          { status: 404 },
        );
      }
      // Return cached summary instantly — no GPT call needed
      if (pdf.summary) {
        return NextResponse.json({ success: true, sumamry: pdf.summary });
      }
      text = pdf.extractedText;
    }

    const summaryRaw = await summariseText(text);
    return NextResponse.json({ success: true, sumamry: summaryRaw });
  } catch (err) {
    console.error("[Summary/Pdf json error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Summarisation failed" },
      { status: 500 },
    );
  }
};
