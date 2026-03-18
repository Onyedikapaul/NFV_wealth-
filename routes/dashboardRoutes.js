import express from "express";
import { fetchUserDashboardData } from "../controllers/DashboardController.js";
import checkAuth from "../middleware/authMiddleware.js";


const DashboardRouter = express.Router();

DashboardRouter.get("/dashboard", checkAuth, fetchUserDashboardData);

export default DashboardRouter;