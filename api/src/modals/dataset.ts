import { Schema, model } from "mongoose";

const fileSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  indexingStatus: {
    type: String,
    enum: ["PENDING", "IN-PROGRESS", "COMPLETED", "FAILED"],
    default: "PENDING",
  },
  indexingError: {
    type: String,
    required: false,
  },
});

const schema = new Schema({
  name: String,
  userId: String,
  files: [fileSchema],
});

export const DatasetModal = model("datasets", schema);
