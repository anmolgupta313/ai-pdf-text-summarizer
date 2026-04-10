

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ChatSession } from "@/models";
import { getAuthUser } from "@/lib/auth";

export const GET = async (req, { params }) => {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { pdfId } = await params;

    await connectDB();

    const sessions = await ChatSession.find({
      pdfId,
      userId: authUser.userId,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, sessions });
  } catch (err) {
    console.error("[Chat/Sessions]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
};
