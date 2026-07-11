import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatSession, Message } from "@/models";
import { getAuthUser } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";

export const GET = async (req, { params }) => {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { sessionId } = await params;

    await connectDB();

    // Verify the session belongs to this user
    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: authUser.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 },
      );
    }

    const messages = await Message.find({ sessionId })
      .sort({ createdAt: 1 })
      .select("role content createdAt");
    // Decrypt each message before sending to frontend
    const decryptedMessages = messages.map((m) => ({
      _id: m._id,
      role: m.role,
      content: decrypt(m.content), // ✅ decrypted for the UI
      createdAt: m.createdAt,
    }));

    // Convert to the { id, question, answer } format used in PdfSummarizer state
    const formattedForUI = [];
    for (let i = 0; i < decryptedMessages.length; i += 2) {
      const userMsg = decryptedMessages[i];
      const assistantMsg = decryptedMessages[i + 1];
      if (userMsg) {
        formattedForUI.push({
          id: i / 2 + 1,
          question: userMsg.content,
          answer: assistantMsg?.content ?? "",
        });
      }
    }

    return NextResponse.json({
      success: true,
      session,
      decryptedMessages,
      questions: formattedForUI,
    });
  } catch (err) {
    console.error("[Chat/Messages]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
};
