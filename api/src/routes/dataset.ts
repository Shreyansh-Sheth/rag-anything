import { File } from "buffer";
import { mkdirSync, writeFileSync } from "fs";
import { Hono } from "hono";
import { Types } from "mongoose";
import { z } from "zod";
import { DatasetModal } from "../modals/dataset";
import { IngestDocumentQueue } from "../worker/queue";

export const DatasetRoute = new Hono<{ Variables: Variables }>().basePath(
  "/dataset"
);

DatasetRoute.post("/", async (c) => {
  // Body Contains Files and also name in shape of form data
  const body = await c.req.parseBody({
    all: true,
  });

  const parseResult = z
    .object({
      name: z.string().min(1).max(50),
      files: z
        .array(z.instanceof(File))
        .min(1)
        .or(z.instanceof(File).transform((file) => [file])),
    })
    .safeParse(body);

  if (!parseResult.success) {
    return c.json({ error: parseResult.error }, 400);
  }
  const validatedBody = parseResult.data;
  const Dataset = new DatasetModal({
    name: validatedBody.name,
    userId: c.get("user").sub,
  });
  // Create folder for dataset
  mkdirSync(`public/${Dataset._id}`, {
    recursive: true,
  });

  // Save files to public folder
  for (let i = 0; i < validatedBody.files.length; i++) {
    const file = validatedBody.files[i];
    const arrayBufferView = new Uint8Array(await file.arrayBuffer());
    const RandomId = new Types.ObjectId();
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    writeFileSync(
      `public/${Dataset._id}/${RandomId}.${fileExtension}`,
      arrayBufferView
    );
    Dataset.files.push({
      name: file.name,
      url: `public/${Dataset._id}/${RandomId}.${fileExtension}`,
      _id: RandomId,
    });
  }

  await Dataset.save();
  // Load ALl Files Into ChromaDB
  //   await ProcessDataset(Dataset._id.toString());
  await IngestDocumentQueue.add(Dataset._id.toString(), {
    datasetId: Dataset._id.toString(),
  });

  return c.json({
    success: true,
  });
});

DatasetRoute.get("/", async (c) => {
  const datasets = await DatasetModal.find({
    userId: c.get("user").sub,
  }).lean();
  return c.json(datasets);
});

DatasetRoute.get("/:id", async (c) => {
  const dataset = await DatasetModal.findOne({
    _id: new Types.ObjectId(c.req.param("id")),
    userId: c.get("user").sub,
  }).lean();

  return c.json(dataset);
});
