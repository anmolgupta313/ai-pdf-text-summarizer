import mongoose from "mongoose";

// User
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
  },
  { timestamps: true },
);

//PDF

const pdfSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    // filePath: {
    //   type: String,
    //   required: false,
    // },
    extractedText: {
      type: String,
      default: "",
    },

    summary: {
      type: String,
      default: "",
    },
    pageCount: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 }, // bytes
  },
  { timestamps: true },
);

//Chat Session

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pdfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PDF",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "New chat",
    },
  },
  { timestamps: true },
);

//Message

const messageSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatSession",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);

export const PDF = mongoose.models.PDF || mongoose.model("PDF", pdfSchema);

export const ChatSession =
  mongoose.models.ChatSession ||
  mongoose.model("ChatSession", chatSessionSchema);

export const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
