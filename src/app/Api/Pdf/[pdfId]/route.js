import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { join } from "path";
import { connectDB } from "@/lib/mongodb";
import { PDF, ChatSession, Message } from "@/models";
import { getAuthUser } from "@/lib/auth";

export const DELETE = async (req, { params }) => {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { pdfId } = await params;
    await connectDB();

    // Make sure this PDF belongs to the logged-in user
    const pdf = await PDF.findOne({ _id: pdfId, userId: authUser.userId });
    if (!pdf) {
      return NextResponse.json(
        { success: false, error: "PDF not found" },
        { status: 404 },
      );
    }

    // Delete the physical file from disk (don't crash if already gone)
    try {
      await unlink(join(process.cwd(), pdf.filePath));
    } catch {
      // file already missing — ignore
    }

    // Find all sessions for this PDF then delete their messages
    const sessionIds = await ChatSession.find({ pdfId }).distinct("_id");
    await Message.deleteMany({ sessionId: { $in: sessionIds } });
    await ChatSession.deleteMany({ pdfId });
    await PDF.deleteOne({ _id: pdfId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Pdf/Delete]", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
};
