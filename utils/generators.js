import crypto from "crypto";

function generateAccountNumber() {
  return "10" + Math.floor(100000000 + Math.random() * 900000000);
}

function generateCryptoAddress(prefix = "CR") {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 32)}`;
}

export { generateAccountNumber, generateCryptoAddress };
