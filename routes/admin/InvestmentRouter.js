import e from "express";
import { createPlan, deletePlan, fetchAllPlans, togglePlan } from "../../controller/admin/InvestmentController.js";

const AdminInvestmentRouter = e.Router();

// GET all plans including inactive (admin only)
AdminInvestmentRouter.get('/plans/all', fetchAllPlans);

// POST create new plan (admin only)
AdminInvestmentRouter.post('/plans', createPlan);

// PATCH toggle active status
AdminInvestmentRouter.patch('/plans/:id/toggle', togglePlan);

// DELETE plan
AdminInvestmentRouter.delete('/plans/:id', deletePlan);

export default AdminInvestmentRouter;