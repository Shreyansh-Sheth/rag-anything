import { Schema, Types, model } from "mongoose";

const content = new Schema({
  text: String,
  fileName: String,
});

const schema = new Schema({
  data: String,
  datasetId: {
    type: Types.ObjectId,
    required: true,
  },
  role: {
    required: true,
    type: String,
    enum: ["bot", "user"],
  },
  content: [content],
});

export const ChatModal = model("chats", schema);
