import express from "express";
import fs from "node:fs/promises";
import { uploader } from "../common/multer";
import cloudinary from "../common/Cloudinary";

const router = express.Router();

router.post(
  "/upload",
  uploader.single("image"),
  async function (req: any, res: any) {
    const image = req.file as any | null;

    if (!image) {
      return res.status(422).json({
        message: "Image is missing",
      });
    }

    const fileUploadResult = await cloudinary.uploader.upload(image.path);
    const uploadedFileUrl = cloudinary.url(fileUploadResult.public_id);
    await fs.unlink(image.path);

    return res.json({
      message: "Upload was successful",
      url: uploadedFileUrl,
    });
  }
);

export default router;
