import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import UserRouter from "./routes/UserRoutes.js";
import DashboardRouter from "./routes/dashboardRoutes.js";
import AccountSettingRouter from "./routes/AccountSettingRoute.js";
import UserDataRouter from "./routes/UserDataRoute.js";
import DepositRouter from "./controllers/DepositController.js";
import AdminAuthRouter from "./routes/admin/AdminRoute.js";
import BitcoinRouter from "./controllers/admin/AdminBitcoinController.js";
import BitcoinAddressRouter from "./controllers/BitcoinContoller.js";
import SwapRouter from "./controllers/SwapController.js";
import TransferRouter from "./controllers/Transfercontroller.js";
import OtpRouter from "./controllers/OTPController.js";
import BeneficiaryRouter from "./controllers/BeneficiaryController.js";
import HistoryRouter from "./controllers/HistoryController.js";
import UserDataRouterNew from "./controllers/UserDataRoute.js";
import CardRouter from "./controllers/CardController.js";
import InternationalTransferRouter from "./controllers/InternationalTransferController.js";
import ForgottenPasswordRouter from "./routes/forgottenPasswordRoute.js";
import AdminCardRouter from "./controllers/admin/AdminCardController.js";
import AdminUserRouter from "./routes/admin/AdminUserRoute.js";
import AdminDepositRouter from "./controllers/admin/AdminDepositController.js";
import AdminLocalTransferRouter from "./controllers/admin/AdminLocalTransferController.js";
import UserCardRouter from "./controllers/UserCardsController.js";
import WalletRouter from "./controllers/GetWalletAddressController.js";
import AdminInternationalTransferRouter from "./controllers/admin/AdminInternationalTransferController.js";

const app = express();
app.set('trust proxy', 1); // add this right after const app = express();
const port = process.env.PORT || 4000;

connectDB();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allowed origins
const allowedOrigins = [
  "http://localhost:4000",
  "http://127.0.0.1:5500",
  "https://nova-first-vault.com",
  "https://www.nova-first-vault.com",
  "https://nova-first-vault-com-715112.hostingersite.com",
];

// Middleware
app.use(cookieParser());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

// Serve HTML/CSS/JS (same folder)
app.use(express.static(__dirname));

// Test route
app.get("/", (req, res) => {
  res.send("API Is Working");
});

app.use("/api", UserRouter);
app.use("/api", ForgottenPasswordRouter);
app.use("/api", DashboardRouter);

//New
app.use("/api/settings", AccountSettingRouter);
app.use("/api/user", UserDataRouter);
app.use("/api/deposits", DepositRouter);
app.use("/api/wallets", BitcoinAddressRouter);
app.use("/api/swap", SwapRouter);
app.use("/api/transfer", TransferRouter);
app.use("/api/otp", OtpRouter);
app.use("/api/beneficiaries", BeneficiaryRouter);
app.use("/api/history", HistoryRouter);
app.use("/api/user", UserDataRouterNew);
app.use("/api/cards", CardRouter);
app.use("/api/international-transfer", InternationalTransferRouter);
app.use("/api/user/cards", UserCardRouter);
app.use("/api/wallet", WalletRouter);

// Admin
app.use("/api/admin/auth", AdminAuthRouter);
app.use("/api/admin/deposits", AdminDepositRouter);
app.use("/api/admin/wallets", BitcoinRouter);
app.use("/api/admin", AdminCardRouter);
app.use("/api/admin", AdminUserRouter);
app.use("/api/admin", AdminLocalTransferRouter);
app.use("/api/admin/international-transfers", AdminInternationalTransferRouter);

app.get('/api/debug-cookie', (req, res) => {
  console.log('All cookies:', req.cookies);
  console.log('Headers:', req.headers);
  res.json({ cookies: req.cookies });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
