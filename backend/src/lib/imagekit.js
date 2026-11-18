import ImageKit, { toFile } from "@imagekit/nodejs";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

function hasImageKitConfig() {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

// This helper function makes a safe, unique filename for the uploaded files.
function createFileName(originalFilename = "upload") {
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/gi, "_");
  return `chat-${Date.now()}-${safeName}`;
}

async function uploadChatMedia(file) {
  const filename = createFileName(file.originalname);

  const result = await imagekit.files.upload({
    file: await toFile(file.buffer, filename, { type: file.mimetype }),
    filename,
    folder: "/chat",
  });
  return result.url;
}

export { uploadChatMedia, hasImageKitConfig };
