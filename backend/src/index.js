import express from "express";
import "dotenv/config.js";
import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";
import cors from "cors";
import User from "./models/user.model.js";

import { clerkMiddleware } from "@clerk/express";
import job from "./lib/cron.js";
import clerkWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), "public");

// Its important that you dont parse the webhook event data, It should be in raw formart
app.use(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook,
);

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}

server.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);

  if (process.env.NODE_ENV === "production") {
    job.start();
  }
});
