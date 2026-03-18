import e from "express";
import { adminCancelInvestment, adminCompleteInvestment, adminGetAllInvestments } from "../../controller/admin/UsersInvestmentController.js";

const UsersInvestmentRouter = e.Router();


UsersInvestmentRouter.get('/admin/all', adminGetAllInvestments);
UsersInvestmentRouter.patch('/admin/:id/complete', adminCompleteInvestment);
UsersInvestmentRouter.patch('/admin/:id/cancel', adminCancelInvestment);

export default UsersInvestmentRouter;