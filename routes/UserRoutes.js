import express from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  resendLoginOTP,
  resendVerificationOTP,
  verifyEmail,
  verifyLoginOTP,
} from "../controllers/UserController.js";
import checkAuth from "../middleware/authMiddleware.js";

const UserRouter = express.Router();

// Registration route
UserRouter.post("/register", registerUser);

// Login route
UserRouter.post("/login", loginUser);
UserRouter.post("/verify-login-otp",  verifyLoginOTP); 
UserRouter.post("/resend-login-otp",  resendLoginOTP); 

// Logout route
UserRouter.post("/logout", logoutUser);

UserRouter.post("/verify-email",          verifyEmail);
UserRouter.post("/resend-verification",   resendVerificationOTP);

// Check Auth 
UserRouter.get("/user/check-auth", checkAuth, (req, res) => {
  return res.status(200).json({ user: req.user });
});

export default UserRouter;
