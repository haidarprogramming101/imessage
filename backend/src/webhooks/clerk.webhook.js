import express from "express";
import User from "../models/user.model.js";
import { verifyWebhook } from "@clerk/express/webhooks";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

    if (!signingSecret) {
      return res
        .status(503)
        .json({ error: "Webhook signing secret is not provided" });
    }

    // Convert the raw body into a string
    const payload = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : String(req.body);

    // Create a Web Request
    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers),
      body: payload,
    });

    // Verify the webhook signature
    const evt = await verifyWebhook(request, signingSecret);

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const user = evt.data;

      const email =
        user.email_adresses?.find(
          (email) => email.id === user.primary_email_address_id,
        )?.email_address ?? user.email.addresses?.[0]?.email_address;

      const fullName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.username ||
        email?.split("@")[0] ||
        "Clerk User";

      await User.findOneAndUpdate(
        { clerkId: user.id },
        { clerkId: user.id, email, fullName, profilePic: user.image_url },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    if (evt.type === "user.deleted") {
      if (evt.data.id) await User.findOneAndDelete({ clerkId: evt.data.id });
    }
    res.status(200).json({ recieved: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(400).json({ message: "Webhook verification failed" });
  }
});

export default router;
