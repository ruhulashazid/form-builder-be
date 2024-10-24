import path from "node:path";
import multer from "multer";

export const multerDiskStorage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);

    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

export const uploader = multer({
  dest: "uploads/",
  storage: multerDiskStorage,
});
