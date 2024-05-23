"use client";
import { MIME_TYPES } from "@mantine/dropzone";
import { z } from "zod";

export const AcceptableMimeTypes: string[] = [
  MIME_TYPES.csv,
  MIME_TYPES.doc,
  MIME_TYPES.docx,
  MIME_TYPES.pdf,
  MIME_TYPES.pptx,
  MIME_TYPES.ppt,
  MIME_TYPES.xls,
  MIME_TYPES.xlsx,
];
export const SizeLimit = 10 * 1024 * 1024; // 10MB

export const NewChatValidation = z.object({
  name: z.string().min(1).max(50),
  files: z
    .array(
      z.instanceof(File).refine((file) => {
        if (!AcceptableMimeTypes.includes(file.type) || file.size > SizeLimit) {
          return false;
        }
        return true;
      }, "Invalid file type or size")
    )
    .min(1, "At least one file is required"),
});
