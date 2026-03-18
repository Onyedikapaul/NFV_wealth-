import express from "express";

import { requireAdmin } from "../../middleware/requireAdmin.js";
import { adminLogin, adminLogout, adminMe } from "../../controllers/admin/AdminController.js";

const AdminAuthRouter = express.Router();

AdminAuthRouter.post("/login", adminLogin);
AdminAuthRouter.post("/logout", adminLogout);
AdminAuthRouter.get("/me", requireAdmin, adminMe);

export default AdminAuthRouter;
