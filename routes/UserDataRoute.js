import express from "express";
import checkAuth from "../middleware/authMiddleware.js";
import { getMe } from "../controllers/UserDataController.js";

const UserDataRouter = express.Router();

UserDataRouter.get("/me", checkAuth, getMe);

export default UserDataRouter;