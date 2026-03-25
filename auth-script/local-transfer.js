// localtransfer.js
// Drop this at: /auth-script/local-transfer.js

let userBalance = 0;
let transactionMin = 4000;
let transactionMax = 500000;

// ─── Auto-inject jsPDF if not already loaded ──────────────────────────────────
(function ensureJsPDF() {
  if (window.jspdf) return;
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  document.head.appendChild(s);
})();

// ─── Load User Data ───────────────────────────────────────────────────────────

async function loadTransferPageData() {
  try {
    const res = await fetch("/api/transfer/user-data", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;

    userBalance = data.balance;
    transactionMin = data.transactionMinimum || 4000;
    transactionMax = data.transactionLimit || 500000;

    window._userBalance = userBalance;
    window._transactionMin = transactionMin;
    window._transactionMax = transactionMax;

    const fmt = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const balanceEl = document.getElementById("balance-display");
    if (balanceEl) balanceEl.textContent = "$" + fmt(userBalance);

    const maxEl = document.getElementById("transfer-max-display");
    if (maxEl) maxEl.textContent = "$" + fmt(transactionMax);

    const userNameEl = document.getElementById("mobile-menu-username");
    if (userNameEl && data.name) userNameEl.textContent = data.name;

    loadUserProfile();
  } catch (err) {
    console.error("[localtransfer] Failed to load user data:", err);
  }
}

async function loadUserProfile() {
  try {
    const res = await fetch("/api/user/profile", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;
    const emailEl = document.getElementById("mobile-menu-email");
    if (emailEl && data.email) emailEl.textContent = data.email;
  } catch (_) {}
}

// ─── OTP Request ──────────────────────────────────────────────────────────────

async function requestOTP(purpose) {
  const btn = document.getElementById("otpRequestBtn");
  const originalHTML = btn.innerHTML;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending OTP...';

  try {
    const res = await fetch("/api/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ purpose }),
    });

    const data = await res.json();

    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>OTP Sent!';
      btn.classList.remove("from-green-500", "to-green-600", "hover:from-green-600", "hover:to-green-700");
      btn.classList.add("from-emerald-500", "to-emerald-600");
      document.getElementById("otp_code").focus();

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        btn.classList.remove("from-emerald-500", "to-emerald-600");
        btn.classList.add("from-green-500", "to-green-600", "hover:from-green-600", "hover:to-green-700");
      }, 30000);
    } else {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      showToast("Failed to send OTP: " + data.message, "error");
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    showToast("Connection error. Please try again.", "error");
    console.error("[OTP]", err);
  }
}

// ─── Confirm Transfer ─────────────────────────────────────────────────────────

function initTransferConfirm() {
  const confirmBtn = document.getElementById("confirmTransferBtn");
  if (!confirmBtn) return;

  const processingModal = document.getElementById("processingModal");
  const progressBar = document.getElementById("progressBar");
  const processingMessage = document.getElementById("processingMessage");

  const processingMessages = [
    "Initiating transfer...",
    "Verifying account details...",
    "Processing transaction...",
    "Confirming with bank...",
    "Finalizing transfer...",
  ];

  confirmBtn.addEventListener("click", async function (e) {
    e.preventDefault();

    const transferFormEl = document.getElementById("transferFormData");
    const alpineData = window.Alpine ? Alpine.$data(transferFormEl) : null;
    if (!alpineData) return showToast("Form error. Please refresh.", "error");

    const { amount, accountname, accountnumber, bankname } = alpineData;

    document.getElementById("modalAmount").textContent = parseFloat(amount).toFixed(2);
    document.getElementById("modalRecipient").textContent = accountname;
    document.getElementById("modalBank").textContent = bankname;
    document.getElementById("modalAccount").textContent = accountnumber;
    document.getElementById("cardHolderName").textContent = (accountname || "").substring(0, 20);

    processingModal.classList.remove("hidden");

    let progress = 0;
    let currentStage = 0;
    progressBar.style.width = "0%";
    processingMessage.textContent = processingMessages[0];

    const interval = 50;
    const progressIncrement = 100 / (5000 / interval);

    const progressInterval = setInterval(async function () {
      progress += progressIncrement;
      progressBar.style.width = Math.min(progress, 100) + "%";
      document.getElementById("progressPercentage").textContent = Math.min(Math.round(progress), 100);

      if (progress >= 20 && currentStage < 1) { currentStage = 1; processingMessage.textContent = processingMessages[1]; }
      else if (progress >= 40 && currentStage < 2) { currentStage = 2; processingMessage.textContent = processingMessages[2]; }
      else if (progress >= 60 && currentStage < 3) { currentStage = 3; processingMessage.textContent = processingMessages[3]; }
      else if (progress >= 80 && currentStage < 4) { currentStage = 4; processingMessage.textContent = processingMessages[4]; }

      if (progress >= 100) {
        clearInterval(progressInterval);
        await submitTransfer(alpineData, processingModal);
      }
    }, interval);
  });
}

async function submitTransfer(alpineData, processingModal) {
  try {
    const payload = {
      amount:         alpineData.amount,
      accountname:    alpineData.accountname,
      accountnumber:  alpineData.accountnumber,
      bankname:       alpineData.bankname,
      Accounttype:    alpineData.Accounttype,
      routing_number: alpineData.routing_number,
      swift_code:     alpineData.swift_code,
      Description:    alpineData.Description,
      pin:            alpineData.pin,
      otp_code:       alpineData.otp_code,
    };

    const res = await fetch("/api/transfer/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    processingModal.classList.add("hidden");

    if (data.success) {
      // ── Snapshot BEFORE reset (alpineData & alpineFormData are the same object) ──
      const receipt = {
        reference:      data.reference,
        accountname:    alpineData.accountname,
        accountnumber:  alpineData.accountnumber,
        bankname:       alpineData.bankname,
        accounttype:    alpineData.Accounttype,
        routing_number: alpineData.routing_number,
        swift_code:     alpineData.swift_code,
        description:    alpineData.Description,
        amount:         alpineData.amount,
        status:         data.status || "pending",
        createdAt:      new Date().toISOString(),
        message:        data.message,
      };

      // ── Close preview + reset all Alpine fields ──
      const transferFormEl = document.getElementById("transferFormData");
      const alpineFormData = window.Alpine ? Alpine.$data(transferFormEl) : null;
      if (alpineFormData) {
        alpineFormData.showPreview    = false;
        alpineFormData.amount         = "";
        alpineFormData.accountname    = "";
        alpineFormData.accountnumber  = "";
        alpineFormData.bankname       = "";
        alpineFormData.Accounttype    = "Online System";
        alpineFormData.routing_number = "";
        alpineFormData.swift_code     = "";
        alpineFormData.pin            = "";
        alpineFormData.otp_code       = "";
        alpineFormData.Description    = "";
      }

      // ── Show receipt modal with snapshotted data ──
      showReceiptModal(receipt);
    } else {
      if (res.status === 403) {
        const status = data.message.toLowerCase().includes("suspended") ? "suspended" : "on-hold";
        showAccountStatusModal(status, data.message);
      } else {
        showTransferResult("error", data.message);
      }
    }
  } catch (err) {
    processingModal.classList.add("hidden");
    showTransferResult("error", "Network error. Please try again.");
    console.error("[transfer/local]", err);
  }
}

// ─── Receipt Modal ────────────────────────────────────────────────────────────

function showReceiptModal(txn) {
  const existing = document.getElementById("transferReceiptModal");
  if (existing) existing.remove();

  const fmt = (amount, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const fmtTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const statusClass = (s) => {
    const map = { completed: "bg-emerald-100 text-emerald-700", pending: "bg-amber-100 text-amber-700", failed: "bg-red-100 text-red-700" };
    return map[s] || "bg-gray-100 text-gray-600";
  };

  const dotClass = (s) => {
    const map = { completed: "bg-emerald-500", pending: "bg-amber-500", failed: "bg-red-500" };
    return map[s] || "bg-gray-400";
  };

  const cap = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "—");

  const optRow = (label, value) =>
    value && String(value).trim() !== ""
      ? `<div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
           <span class="text-sm text-gray-500 dark:text-gray-400">${label}</span>
           <span class="text-sm font-medium text-gray-900 dark:text-white text-right max-w-xs break-all">${value}</span>
         </div>`
      : "";

  // Store txn on window so PDF button can access it without encoding issues
  window._currentReceiptTxn = txn;

  const modal = document.createElement("div");
  modal.id = "transferReceiptModal";
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";

  modal.innerHTML = `
    <style>
      @keyframes rcptFadeIn  { from { opacity: 0; } to { opacity: 1; } }
      @keyframes rcptSlideUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      #transferReceiptModal .receipt-dialog { animation: rcptSlideUp 0.2s ease-out; }
    </style>

    <div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 receipt-dialog">

      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
            <i class="fas fa-receipt text-white text-sm"></i>
          </div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Transfer Receipt</h2>
        </div>
        <button onclick="document.getElementById('transferReceiptModal').remove()"
          class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <i class="fas fa-times text-gray-500 dark:text-gray-400"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">

        <!-- Amount Hero -->
        <div class="text-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-3">
            <i class="fas fa-arrow-up text-xl text-red-500 dark:text-red-400"></i>
          </div>
          <div class="text-3xl font-bold text-red-500 dark:text-red-400 mb-2">${fmt(txn.amount)}</div>
          <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusClass(txn.status)}">
            <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass(txn.status)}"></span>
            ${cap(txn.status)}
          </span>
          ${txn.message ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${txn.message}</p>` : ""}
        </div>

        <!-- Details -->
        <div class="space-y-0">
          ${optRow("Reference", txn.reference)}
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Recipient</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">${txn.accountname || "—"}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Account Number</span>
            <span class="text-sm font-mono text-gray-900 dark:text-white">${txn.accountnumber || "—"}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Bank</span>
            <span class="text-sm text-gray-900 dark:text-white">${txn.bankname || "—"}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Account Type</span>
            <span class="text-sm text-gray-900 dark:text-white">${txn.accounttype || "—"}</span>
          </div>
          ${optRow("Routing Number", txn.routing_number)}
          ${optRow("SWIFT Code", txn.swift_code)}
          ${optRow("Description", txn.description)}
          <div class="flex justify-between py-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">Date</span>
            <span class="text-sm text-gray-900 dark:text-white">${fmtDate(txn.createdAt)} ${fmtTime(txn.createdAt)}</span>
          </div>
        </div>

        <!-- Download PDF + Close -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <button onclick="downloadTransferReceiptPdf(window._currentReceiptTxn)"
            class="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all duration-200 transform hover:scale-[1.02]">
            <i class="fas fa-download mr-2"></i>Download PDF Receipt
          </button>
          <button onclick="document.getElementById('transferReceiptModal').remove()"
            class="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all duration-200">
            <i class="fas fa-times mr-2"></i>Close
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

// ─── Download PDF Receipt (jsPDF — same as accountHistory.js) ─────────────────

function downloadTransferReceiptPdf(txn) {
  if (!window.jspdf) {
    showToast("PDF library still loading, please try again in a moment.", "error");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const fmt = (amount, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const fmtTime = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const cap = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : "—");

  // Header bar
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NOVA FIRST VAULT", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Transfer Receipt", 14, 20);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 20);

  // Amount block
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 35, 182, 22, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Amount", 20, 44);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(14, 165, 233);
  doc.text(fmt(txn.amount), 20, 53);

  // Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const statusColors = {
    completed: [16, 185, 129], approved: [16, 185, 129],
    pending: [245, 158, 11], processing: [59, 130, 246],
    failed: [239, 68, 68], rejected: [239, 68, 68], cancelled: [100, 116, 139],
  };
  const sc = statusColors[txn.status] || [100, 116, 139];
  doc.setTextColor(...sc);
  doc.text(cap(txn.status), 160, 44);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 62, 196, 62);

  // Rows
  const rows = [
    ["Reference",      txn.reference      || "—"],
    ["Recipient Name", txn.accountname    || "—"],
    ["Account Number", txn.accountnumber  || "—"],
    ["Bank Name",      txn.bankname       || "—"],
    ["Account Type",   txn.accounttype    || "—"],
    ["Routing Number", txn.routing_number || "—"],
    ["Swift Code",     txn.swift_code     || "—"],
    ["Description",    txn.description    || "—"],
    ["Status",         cap(txn.status)],
    ["Date",           fmtDate(txn.createdAt) + " " + fmtTime(txn.createdAt)],
  ];

  let y = 70;
  doc.setFontSize(10);
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 10, "F");
    }
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(label, 20, y);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(String(value || "—"), 100);
    doc.text(lines, 110, y);
    y += lines.length > 1 ? lines.length * 6 + 2 : 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "This is an auto-generated receipt. Please contact support if you have any questions.",
    14, 285
  );
  doc.text("nova-first-vault.com", 168, 285);

  doc.save(`transfer-${txn.reference || txn.accountnumber || "receipt"}.pdf`);
}

// ─── Error result modal (failed transfers only) ───────────────────────────────

function showTransferResult(type, message) {
  const existing = document.getElementById("transferResultModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "transferResultModal";
  modal.className = "fixed inset-0 z-50 overflow-y-auto";
  modal.innerHTML = `
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20 dark:border-gray-700/50">
        <div class="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/50">
          <i class="fas fa-times-circle text-red-600 dark:text-red-400 text-3xl"></i>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Transfer Failed</h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">${message}</p>
        <button onclick="document.getElementById('transferResultModal').remove()"
          class="w-full px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all">
          Try Again
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function showAccountStatusModal(status, message) {
  const statusModal = document.getElementById("accountStatusModal");
  if (!statusModal) return;

  const iconContainer = statusModal.querySelector(".rounded-2xl");
  const icon = statusModal.querySelector(".fas");
  if (status === "on-hold") {
    if (iconContainer) iconContainer.className = "mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/50";
    if (icon) icon.className = "fas fa-exclamation-circle text-2xl text-amber-600 dark:text-amber-400";
  } else {
    if (iconContainer) iconContainer.className = "mx-auto w-16 h-16 mb-6 flex items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/50";
    if (icon) icon.className = "fas fa-ban text-2xl text-red-600 dark:text-red-400";
  }

  const titleEl = statusModal.querySelector("#accountStatusTitle");
  const msgEl   = statusModal.querySelector("#accountStatusMessage");
  if (titleEl) titleEl.textContent = status === "on-hold" ? "Account On Hold" : "Account Suspended";
  if (msgEl)   msgEl.textContent   = message;
  statusModal.classList.remove("hidden");
}

// ─── Toast helper ─────────────────────────────────────────────────────────────

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg text-white text-sm font-medium ${
    type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ─── Beneficiary: redirect .php calls to Node API ─────────────────────────────

(function () {
  const _origFetch = window.fetch;
  window.fetch = function (url, options) {
    if (typeof url === "string" && url.includes("beneficiaries.php")) {
      url = url.replace("beneficiaries.php", "/api/beneficiaries");
    }
    if (typeof url === "string" && url.includes("request-otp.php")) {
      url = "/api/otp/request";
      if (options?.body && typeof options.body === "string") {
        const params = new URLSearchParams(options.body);
        options = {
          ...options,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose: params.get("purpose") }),
        };
      }
    }
    return _origFetch(url, options);
  };
})();

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  loadTransferPageData();
  initTransferConfirm();
});