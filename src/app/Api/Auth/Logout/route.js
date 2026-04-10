import { NextResponse } from "next/server";

export const POST = async () => {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("token", "", { maxAge: 0, path: "/" });
  return response;
};
