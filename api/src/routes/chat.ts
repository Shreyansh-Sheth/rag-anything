import { Hono } from "hono";
import { streamText } from "hono/streaming";
import { z } from "zod";
import { GetAnswer } from "../worker/chat";
import { ChatModal } from "../modals/chat";
import { Types } from "mongoose";
import { DatasetModal } from "../modals/dataset";

export const ChatRoute = new Hono().basePath("/chat");

const ChatValidation = z.object({
  question: z.string(),
  datasetId: z.string(),
});

ChatRoute.post("/", async (c) => {
  const chatData = ChatValidation.safeParse(await c.req.json());

  if (!chatData.success) {
    return c.json({ response: "error", error: chatData.error }, 400);
  }

  const { question, datasetId } = chatData.data;
  const datasetData = await DatasetModal.findById(datasetId);
  if (!datasetData) {
    return c.json({ response: "error", error: "Dataset not found" }, 400);
  }
  const { docs, stream: llm } = await GetAnswer(question, datasetId);
  const [responseStream, localStream] = llm.tee();
  console.log(docs);
  const localStreamReader = localStream.getReader();
  let FinalString = "";

  localStreamReader
    .read()
    .then(async function processResult(result): Promise<any> {
      if (result.done) {
        // SAVE to databse
        await ChatModal.create({
          data: question,
          role: "user",
          datasetId: new Types.ObjectId(datasetId),
        });
        await ChatModal.create({
          data: FinalString,
          content: docs.map((e) => ({
            text: e.pageContent,
            fileName:
              datasetData.files.find((file) => file.url === e.metadata.source)
                ?.name || "Unknown",
          })),
          role: "bot",
          datasetId: new Types.ObjectId(datasetId),
        });
        return;
      }
      FinalString += result.value;

      return localStreamReader.read().then(processResult);
    });

  return streamText(c, async (stream) => {
    stream.onAbort(() => {
      responseStream.cancel();
    });

    await stream.pipe(responseStream);
  });
});

ChatRoute.get("/:datasetId", async (c) => {
  const chats = await ChatModal.find({
    datasetId: new Types.ObjectId(c.req.param("datasetId")),
  });

  return c.json({ response: "success", data: chats });
});
