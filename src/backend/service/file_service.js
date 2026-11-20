import sharp from "sharp";
import crypto from "crypto";
import fs from "fs/promises"

export class FileService {
  ALLOWED_MIME_TYPES = [
    'image/bmp',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'image/webp'
  ];

  fileFilter = (_, file, callback) => {
    callback(null, this.ALLOWED_MIME_TYPES.includes(file.mimetype));
  }

  async upload(file) {
    const webpBuffer = await sharp(file.buffer)
      .webp({
        quality: 80,
        effort: 4
      })
      .toBuffer();

    const hash = crypto.createHash('sha256').update(webpBuffer).digest('hex');
    const filename = `${hash}.webp`;
    const path = `./static/assets/custom/${filename}`;

    try {
      await fs.access(path);
      console.log("User uploaded image already exists! Skipping as de-duplication...");
    } catch {
      await fs.writeFile(path, webpBuffer);
      console.log(`User uploaded image! Saving as ${filename}`);
    }

    return filename;
  }

  download(url) {
    // Do download/conversion here.

    return true;
  }
}
