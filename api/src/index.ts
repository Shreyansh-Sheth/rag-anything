import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mongoose from "mongoose";
import { DatasetRoute } from "./routes/dataset";
import { etag } from "hono/etag";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import "./worker";
import { ChatRoute } from "./routes/chat";
import jwksClient, { Headers } from "jwks-rsa";
import jwt, { GetPublicKeyOrSecret } from "jsonwebtoken";
import { promisify } from "util";
import { env } from "process";

mongoose.connect("mongodb://localhost:27017/test");

const app = new Hono<{
  Variables: Variables;
}>();
app.use(etag(), logger());
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(async (c, next) => {
  var client = jwksClient({
    jwksUri: env.JWT_URL!,
  });

  function getKey(
    header: Parameters<GetPublicKeyOrSecret>["0"],
    callback: Parameters<GetPublicKeyOrSecret>["1"]
  ): ReturnType<GetPublicKeyOrSecret> {
    client.getSigningKey(header.kid, function (err, key) {
      let signingKey = key?.getPublicKey();
      callback(null, signingKey);
    });
  }
  const token = c.req.header("authorization")?.split(" ")[1];
  if (!token) return c.json({ error: "No token provided" }, 401);

  try {
    const verify = await promisify(jwt.verify);
    //@ts-ignore
    const decoded = (await verify(token, getKey)) as {
      sub: string;
    };

    if (!decoded) {
      return c.json({ error: "Invalid token" }, 401);
    }
    const sub = decoded.sub as string;

    c.set("user", { sub });

    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

app.route("/", DatasetRoute);
app.route("/", ChatRoute);

const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
