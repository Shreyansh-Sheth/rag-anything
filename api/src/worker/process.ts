import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Worker } from "bullmq";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { Types } from "mongoose";
import { DatasetModal } from "../modals/dataset";
import { embeddings } from "./embedding";
import { IngestDocumentQueue, connection } from "./queue";

export const IngestDocumentWorker = new Worker(
  IngestDocumentQueue.name,
  async (job) => {
    console.info("Processing Dataset " + job.data.datasetId);
    await ProcessDataset(job.data.datasetId);
  },
  {
    useWorkerThreads: true,
    connection: connection,
  }
);

const ProcessDataset = async (datasetId: string) => {
  const dataset = await DatasetModal.findById(datasetId).lean();

  if (!dataset) {
    console.error("Dataset not found " + datasetId);
    return;
  }

  const filesProcessing = dataset.files.map(async (file) => {
    if (file.indexingStatus !== "PENDING") {
      return file;
    }
    try {
      await processSingleFile(file.url, datasetId);
      file.indexingStatus = "COMPLETED";
    } catch (error) {
      console.error("Error processing file " + file.url);
      file.indexingStatus = "FAILED";
      if (error instanceof Error) {
        file.indexingError = error?.message;
      } else {
        file.indexingError = "Unknown Error";
        console.error("Unknown Error");
      }
    }
    return file;
  });

  const newFiles = new Types.DocumentArray(await Promise.all(filesProcessing));
  await DatasetModal.updateOne(
    {
      _id: new Types.ObjectId(datasetId),
    },
    {
      files: newFiles,
    }
  );
};

const extensionLoader = [
  {
    extension: ["pdf"],
    load: async (file: string) => {
      return await new PDFLoader(file).load();
    },
  },
  {
    extension: ["txt", "md"],
    load: async (file: string) => {
      return await new TextLoader(file).load();
    },
  },
];

const processSingleFile = async (filePath: string, datasetId: string) => {
  const extension = filePath.split(".").pop();
  if (!extension) {
    console.error("Extension not found for file " + filePath);
    return;
  }
  const loader = extensionLoader.find((loader) =>
    loader.extension.includes(extension.toLowerCase())
  );

  if (!loader) {
    console.error("Loader not found for extension " + extension);
    return;
  }

  const docs = await loader.load(filePath);

  await Chroma.fromDocuments(docs, embeddings, {
    collectionName: datasetId,
    url: "http://localhost:8000",
  });

  return;
};
