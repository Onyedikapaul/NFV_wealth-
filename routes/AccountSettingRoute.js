import express from "express";
import multer from "multer";

import checkAuth from "../middleware/authMiddleware.js"
import { updateAvatar, updatePassword, updatePin } from "../controllers/AccountSettingController.js";

const AccountSettingRouter = express.Router();

// multer — memory storage (buffer passed directly to cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG and PNG files are allowed."));
  },
});

AccountSettingRouter.put("/avatar", checkAuth, upload.single("photo"), updateAvatar);
AccountSettingRouter.put("/pin", checkAuth, updatePin);
AccountSettingRouter.put("/password", checkAuth, updatePassword);

export default AccountSettingRouter;
