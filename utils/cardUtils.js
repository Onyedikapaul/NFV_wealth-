export const generateLast4 = () => {
  return String(Math.floor(1000 + Math.random() * 9000)); // 4 digits
};

export const maskFromLast4 = (last4) => `•••• •••• •••• ${last4}`;

export const generateExpiry = () => {
  const now = new Date();
  const expiryYear = now.getFullYear() + 4; // 4 years validity
  const expiryMonth = now.getMonth() + 1; // 1-12
  return { expiryMonth, expiryYear };
};
