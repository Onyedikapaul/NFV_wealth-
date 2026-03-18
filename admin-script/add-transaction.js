(function () {
  const API_BASE = "/api/admin";

  const result = document.getElementById("result");
  const form = document.getElementById("adminTransferForm");

  const userNameText = document.getElementById("userNameText");
  const userEmailText = document.getElementById("userEmailText");
  const userBalText = document.getElementById("userBalText");
  const userIdText = document.getElementById("userIdText");

  const createdAtEl = document.getElementById("createdAt");

  const txTypeEl = document.getElementById("txType");
  const amountEl = document.getElementById("amount");
  const currencyEl = document.getElementById("currency");
  const titleEl = document.getElementById("title");
  const narrationEl = document.getElementById("narration");
  const scopeEl = document.getElementById("scope");
  const statusEl = document.getElementById("status");

  const bankNameEl = document.getElementById("bankName");
  const senderAccountNumberEl = document.getElementById("accountNumber");
  const senderAccountNameEl = document.getElementById("accountName");

  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");
  const backBtn = document.getElementById("backBtn");

  // ---- helpers ----
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function showMsg(type, msg) {
    const bg =
      type === "success" ? "#d4edda" : type === "warn" ? "#fff3cd" : "#f8d7da";
    const bd =
      type === "success" ? "#c3e6cb" : type === "warn" ? "#ffeeba" : "#f5c6cb";

    result.innerHTML = `
      <div style="padding:10px;border:1px solid ${bd};background:${bg};border-radius:10px;">
        ${msg}
      </div>
    `;
  }

  function clearMsg() {
    result.innerHTML = "";
  }

  function fullName(u) {
    return [u?.firstname, u?.middlename, u?.lastname]
      .filter(Boolean)
      .join(" ")
      .trim();
  }

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // ---- target user ----
  const userId = getQueryParam("userId");

  async function loadTargetUser() {
    if (!userId) {
      showMsg("error", "Missing userId in URL. Example: ?userId=USER_ID");
      submitBtn.disabled = true;

      if (userNameText) userNameText.textContent = "Missing userId";
      if (userEmailText) userEmailText.textContent = "—";
      if (userBalText) userBalText.textContent = "—";
      if (userIdText) userIdText.textContent = "—";
      return;
    }

    try {
      if (userNameText) userNameText.textContent = "Loading...";
      if (userEmailText) userEmailText.textContent = "—";
      if (userBalText) userBalText.textContent = "—";
      if (userIdText) userIdText.textContent = userId;

      const res = await fetch(`${API_BASE}/users/${userId}`, {
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load user");

      const u = data?.user || data;

      if (userNameText) userNameText.textContent = fullName(u) || "No Name";
      if (userEmailText) userEmailText.textContent = u?.email || "—";
      if (userBalText)
        userBalText.textContent =
          u?.accountBalance != null ? money(u.accountBalance) : "—";
      if (userIdText) userIdText.textContent = u?._id || userId;
    } catch (err) {
      console.error(err);
      showMsg("error", err.message);
      submitBtn.disabled = true;

      if (userNameText) userNameText.textContent = "Error loading user";
      if (userEmailText) userEmailText.textContent = "—";
      if (userBalText) userBalText.textContent = "—";
      if (userIdText) userIdText.textContent = userId || "—";
    }
  }

  // ---- submit ----
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();

    if (!userId) return showMsg("error", "Missing userId in URL.");

    const txType = String(txTypeEl.value || "credit")
      .toLowerCase()
      .trim();
    if (txType !== "credit" && txType !== "debit") {
      return showMsg("warn", "Invalid transaction type.");
    }

    const payload = {
      userId,
      amount: Number(amountEl.value),
      currency: (currencyEl.value || "USD").trim(),
      title: (titleEl.value || "").trim(),
      narration: (narrationEl.value || "").trim(),
      scope: scopeEl.value,
      status: statusEl.value,
      createdAt: createdAtEl?.value || "",

      beneficiary: {
        bankName: (bankNameEl.value || "").trim(),
        accountNumber: (senderAccountNumberEl.value || "").trim(),
        accountName: (senderAccountNameEl.value || "").trim(),
      },
    };

    if (!payload.title) return showMsg("warn", "Title is required.");
    if (!payload.createdAt) return showMsg("warn", "Transaction date is required.");
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return showMsg("warn", "Amount must be greater than 0.");
    }

    if (
      !payload.beneficiary.bankName ||
      !payload.beneficiary.accountNumber ||
      !payload.beneficiary.accountName
    ) {
      return showMsg(
        "warn",
        "Sender details required: bank name, account number, account name.",
      );
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    try {
      const endpoint =
        txType === "credit"
          ? `${API_BASE}/transfer/credit`
          : `${API_BASE}/transfer/debit`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Transfer failed");

      const ref = data.transaction?.ref || "-";
      const newBal =
        data.user?.accountBalance != null
          ? `<br/>New Balance: <b>${money(data.user.accountBalance)}</b>`
          : "";

      showMsg(
        "success",
        `${txType.toUpperCase()} successful. Ref: <b>${ref}</b>${newBal}`,
      );

      form.reset();
      currencyEl.value = "USD";
      txTypeEl.value = txType; // keep selection
      await loadTargetUser(); // refresh balance shown
    } catch (err) {
      console.error(err);
      showMsg("error", err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Process";
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    currencyEl.value = "USD";
    clearMsg();
  });

  backBtn.addEventListener("click", () => {
    history.back();
  });

  document.addEventListener("DOMContentLoaded", loadTargetUser);
})();
