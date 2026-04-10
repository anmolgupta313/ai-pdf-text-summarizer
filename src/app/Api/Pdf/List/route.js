

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PDF } from "@/models";
import { getAuthUser } from "@/lib/auth";

export const GET = async () => {
  try {
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    // Exclude heavy extractedText field — only need metadata for the sidebar
    const pdfs = await PDF.find({ userId: authUser.userId })
      .select("-extractedText")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, pdfs });
  } catch (err) {
    console.error("[Pdf/List]", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch PDFs" },
      { status: 500 }
    );
  }
};
