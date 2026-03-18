import e from "express";
import {
  adminAddDeposit,
  adminAddWithdrawal,
  approveWithdrawal,
  confirmDeposit,
  getUserDeposits,
  getUserWithdrawals,
  rejectDeposit,
  rejectWithdrawal,
} from "../../controller/admin/adminDepositWithdrawalController.js";

const AdminDepositWithdrawalRouter = e.Router();

AdminDepositWithdrawalRouter.post("/users/:id/deposit", adminAddDeposit);
AdminDepositWithdrawalRouter.post("/users/:id/withdrawal", adminAddWithdrawal);

AdminDepositWithdrawalRouter.get("/users/:id/deposits", getUserDeposits);
AdminDepositWithdrawalRouter.get("/users/:id/withdrawals", getUserWithdrawals);


// Deposit routes
AdminDepositWithdrawalRouter.patch("/users/:id/confirm", confirmDeposit);
AdminDepositWithdrawalRouter.patch("/users/:id/reject", rejectDeposit);

// Withdrawal routes
AdminDepositWithdrawalRouter.patch("/users/:id/approve", approveWithdrawal);
AdminDepositWithdrawalRouter.patch("/users/withdrawal/:id/reject", rejectWithdrawal);

export default AdminDepositWithdrawalRouter;
