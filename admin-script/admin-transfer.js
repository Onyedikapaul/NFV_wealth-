(function () {
  const API_BASE = "/api/admin";

  const result = document.getElementById("result");
  const form = document.getElementById("adminTransferForm");

  const userSelect = document.getElementById("userSelect");
  const amountEl = document.getElementById("amount");
  const currencyEl = document.getElementById("currency");
  const titleEl = document.getElementById("title");
  const narrationEl = document.getElementById("narration");
  const scopeEl = document.getElementById("scope");
  const statusEl = document.getElementById("status");

  // ✅ sender details (beneficiary = sender)
  const bankNameEl = document.getElementById("bankName");
  const senderAccountNumberEl = document.getElementById("accountNumber");
  const senderAccountNameEl = document.getElementById("accountName");

  const submitBtn = document.getElementById("submitBtn");
  const resetBtn = document.getElementById("resetBtn");

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

  async function loadUsers() {
    try {
      userSelect.innerHTML = `<option value="">Loading users...</option>`;

      const res = await fetch(`${API_BASE}/users`, {
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load users");

      // ✅ your API returns array directly
      const users = Array.isArray(data) ? data : [];

      if (!users.length) {
        userSelect.innerHTML = `<option value="">No users found</option>`;
        return;
      }

      userSelect.innerHTML =
        `<option value="">Select a user</option>` +
        users
          .map((u) => {
            const label = `${fullName(u) || "No Name"} — ${u.email || ""}`;
            return `<option value="${u._id}">${label}</option>`;
          })
          .join("");
    } catch (err) {
      console.error(err);
      userSelect.innerHTML = `<option value="">Error loading users</option>`;
      showMsg("error", err.message);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();

    const payload = {
      userId: userSelect.value,
      amount: Number(amountEl.value),
      currency: (currencyEl.value || "USD").trim(),
      title: (titleEl.value || "").trim(),
      narration: (narrationEl.value || "").trim(),
      scope: scopeEl.value,
      status: statusEl.value,

      // ✅ beneficiary is SENDER info
      beneficiary: {
        bankName: (bankNameEl.value || "").trim(),
        accountNumber: (senderAccountNumberEl.value || "").trim(),
        accountName: (senderAccountNameEl.value || "").trim(),
      },
    };

    if (!payload.userId) return showMsg("warn", "Please select a user.");
    if (!payload.title) return showMsg("warn", "Title is required.");
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
      return showMsg("warn", "Amount must be greater than 0.");
    }

    // ✅ require sender details
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
      const res = await fetch(`${API_BASE}/transfer/credit`, {
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
          ? `<br/>New Balance: <b>${Number(data.user.accountBalance).toLocaleString()}</b>`
          : "";

      showMsg("success", `Credited successfully. Ref: <b>${ref}</b>${newBal}`);

      form.reset();
      currencyEl.value = "USD";
    } catch (err) {
      console.error(err);
      showMsg("error", err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Credit User";
    }
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    currencyEl.value = "USD";
    clearMsg();
  });

  document.addEventListener("DOMContentLoaded", loadUsers);
})();
