import express from "express";
import {
  addWallet,
  deleteWallet,
  getActiveWallets,
  getAllWallets,
  updateWallet,
} from "../../controller/admin/walletController.js";

const WalletRouter = express.Router();

// Public — used by deposit page
WalletRouter.get("/active", getActiveWallets);

// Admin only
WalletRouter.get("/", getAllWallets);
WalletRouter.post("/", addWallet);
WalletRouter.put("/:id", updateWallet);
WalletRouter.delete("/:id", deleteWallet);

export default WalletRouter;
