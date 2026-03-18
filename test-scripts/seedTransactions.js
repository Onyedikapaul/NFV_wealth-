import mongoose from "mongoose";
import dotenv from "dotenv";
import TransactionModel from "../models/TransactionModel.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// ⚠️ PUT A REAL USER ID FROM YOUR USERS COLLECTION HERE
const USER_ID = "6972a8be23742946f474230d";

function ref() {
  return "TRX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

const sampleTransactions = [
  {
    amount: 1200,
    isDebit: false,
    status: "completed",
    type: "deposit",
    description: "Salary Payment",
  },
  {
    amount: 250,
    isDebit: true,
    status: "completed",
    type: "transfer",
    description: "Transfer to John",
  },
  {
    amount: 89.99,
    isDebit: true,
    status: "pending",
    type: "card",
    description: "Netflix Subscription",
  },
  {
    amount: 450,
    isDebit: false,
    status: "completed",
    type: "refund",
    description: "Order Refund",
  },
  {
    amount: 75.5,
    isDebit: true,
    status: "failed",
    type: "transfer",
    description: "Bank Transfer Failed",
  },
  {
    amount: 999,
    isDebit: false,
    status: "completed",
    type: "deposit",
    description: "Crypto Sale",
  },
  {
    amount: 32.2,
    isDebit: true,
    status: "completed",
    type: "card",
    description: "Uber Ride",
  },
  {
    amount: 150,
    isDebit: true,
    status: "completed",
    type: "transfer",
    description: "Sent to Friend",
  },
  {
    amount: 2000,
    isDebit: false,
    status: "pending",
    type: "deposit",
    description: "Incoming Transfer",
  },
  {
    amount: 18.75,
    isDebit: true,
    status: "completed",
    type: "card",
    description: "Coffee Shop",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const docs = sampleTransactions.map((t) => ({
      userId: USER_ID,
      amount: t.amount,
      currency: "USD",
      isDebit: t.isDebit,
      status: t.status,
      type: t.type,
      description: t.description,
      reference: ref(),
      createdAt: new Date(Date.now() - Math.random() * 1000000000),
      updatedAt: new Date(),
    }));

    await TransactionModel.insertMany(docs);

    console.log("🎉 10 test transactions inserted!");
    process.exit();
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
