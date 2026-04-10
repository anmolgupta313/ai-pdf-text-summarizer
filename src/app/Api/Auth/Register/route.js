import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { signToken, COOKIE_OPTIONS } from "@/lib/auth";

export const POST = async (req) => {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json(
      {
        success: true,
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("[Auth/Register]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
};
