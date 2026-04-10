import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { signToken, COOKIE_OPTIONS } from "@/lib/auth";

export const POST = async (req) => {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user._id.toString(), email: user.email });

    const response = NextResponse.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email },
    });

    response.cookies.set("token", token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error("[Auth/Login]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
};
