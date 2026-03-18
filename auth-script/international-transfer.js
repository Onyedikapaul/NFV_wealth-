// // international-transfer-script.js
// // Clean version — no alert(), no double submit, no dead code

// document.addEventListener("DOMContentLoaded", function () {
//   // ── Toast Notification ───────────────────────────────────────────────────────
//   function showToast(message, type = "success") {
//     const existing = document.getElementById("it-toast");
//     if (existing) existing.remove();

//     const colors = {
//       success: "bg-green-500",
//       error: "bg-red-500",
//       info: "bg-blue-500",
//     };

//     const icons = {
//       success: "fa-circle-check",
//       error: "fa-circle-xmark",
//       info: "fa-circle-info",
//     };

//     const toast = document.createElement("div");
//     toast.id = "it-toast";
//     toast.className = `fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl text-white shadow-xl text-sm font-medium transition-all duration-300 opacity-0 translate-y-2 ${colors[type]}`;
//     toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
//     document.body.appendChild(toast);

//     requestAnimationFrame(() => {
//       toast.classList.remove("opacity-0", "translate-y-2");
//     });

//     setTimeout(() => {
//       toast.classList.add("opacity-0", "translate-y-2");
//       setTimeout(() => toast.remove(), 300);
//     }, 4000);
//   }

//   window.showToast = showToast;

//   // ── OTP Request ──────────────────────────────────────────────────────────────
//   window.requestOTP = async function (purpose) {
//     const btn = document.getElementById("otpRequestBtn");
//     const originalHTML = btn.innerHTML;

//     btn.disabled = true;
//     btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';

//     try {
//       const response = await fetch("/api/otp/request", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify({ purpose }),
//       });

//       const data = await response.json();

//       if (data.success) {
//         btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>OTP Sent!';
//         showToast("OTP sent to your email. Valid for 10 minutes.", "success");
//         document.getElementById("otp_code_input")?.focus();

//         // Re-enable after 30s cooldown
//         setTimeout(() => {
//           btn.disabled = false;
//           btn.innerHTML = originalHTML;
//         }, 30000);
//       } else {
//         btn.disabled = false;
//         btn.innerHTML = originalHTML;
//         showToast(data.message || "Failed to send OTP.", "error");
//       }
//     } catch (err) {
//       btn.disabled = false;
//       btn.innerHTML = originalHTML;
//       showToast("Connection error. Please try again.", "error");
//       console.error("[OTP]", err);
//     }
//   };

//   // ── Submit Transfer ──────────────────────────────────────────────────────────
//   // Called directly from Alpine's submitForm() — passes Alpine data object
//   window.submitTransfer = async function (alpineData) {
//     const pin = alpineData.pin;

//     if (!pin || pin.length < 4) {
//       showToast("Please enter your transaction PIN.", "error");
//       return;
//     }

//     const form = document.getElementById("internationalTransferForm");
//     if (!form) {
//       showToast("Form not found. Please refresh.", "error");
//       return;
//     }

//     // Close preview modal
//     alpineData.showPreview = false;

//     // Show processing modal
//     const processingModal = document.getElementById("processingModal");
//     if (processingModal) processingModal.classList.remove("hidden");

//     try {
//       // Collect all visible form fields
//       const formData = new FormData(form);
//       const body = Object.fromEntries(formData.entries());

//       // Force correct values from Alpine state — don't trust hidden inputs alone
//       body.balance_type =
//         alpineData.withdrawMethod === "Cryptocurrency" ? "btc" : "fiat";
//       body.withdrawMethod = alpineData.withdrawMethod;
//       body.pin = pin;

//       const response = await fetch("/api/international-transfer/submit", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         credentials: "include",
//         body: JSON.stringify(body),
//       });

//       const data = await response.json();

//       if (processingModal) processingModal.classList.add("hidden");

//       if (data.success) {
//         showToast("Transfer submitted! Pending review.", "success");
//         setTimeout(() => {
//           window.location.href = "accounthistory.html";
//         }, 1500);
//       } else {
//         showToast(
//           data.message || "Transfer failed. Please try again.",
//           "error",
//         );
//       }
//     } catch (err) {
//       if (processingModal) processingModal.classList.add("hidden");
//       showToast("Connection error. Please try again.", "error");
//       console.error("[Transfer Submit]", err);
//     }
//   };
// });


// international-transfer.js
// Clean version — receipt modal on success, no redirect

document.addEventListener("DOMContentLoaded", function () {

  // ── Toast Notification ───────────────────────────────────────────────────────
  function showToast(message, type = "success") {
    const existing = document.getElementById("it-toast");
    if (existing) existing.remove();

    const colors = { success: "bg-green-500", error: "bg-red-500", info: "bg-blue-500" };
    const icons  = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info" };

    const toast = document.createElement("div");
    toast.id = "it-toast";
    toast.className = `fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl text-white shadow-xl text-sm font-medium transition-all duration-300 opacity-0 translate-y-2 ${colors[type]}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => { toast.classList.remove("opacity-0", "translate-y-2"); });
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.showToast = showToast;

  // ── OTP Request ──────────────────────────────────────────────────────────────
  window.requestOTP = async function (purpose) {
    const btn = document.getElementById("otpRequestBtn");
    const originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';

    try {
      const response = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ purpose }),
      });

      const data = await response.json();

      if (data.success) {
        btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i>OTP Sent!';
        showToast("OTP sent to your email. Valid for 10 minutes.", "success");
        document.getElementById("otp_code_input")?.focus();
        setTimeout(() => { btn.disabled = false; btn.innerHTML = originalHTML; }, 30000);
      } else {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        showToast(data.message || "Failed to send OTP.", "error");
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      showToast("Connection error. Please try again.", "error");
      console.error("[OTP]", err);
    }
  };

  // ── Submit Transfer ──────────────────────────────────────────────────────────
  window.submitTransfer = async function (alpineData) {
    const pin = alpineData.pin;

    if (!pin || String(pin).length < 4) {
      showToast("Please enter your transaction PIN.", "error");
      return;
    }

    const otp = document.getElementById("otp_code_input")?.value || "";
    if (!otp || otp.length !== 6) {
      showToast("Please enter the 6-digit OTP.", "error");
      return;
    }

    const form = document.getElementById("internationalTransferForm");
    if (!form) { showToast("Form not found. Please refresh.", "error"); return; }

    // Close preview modal
    alpineData.showPreview = false;

    // Show processing modal
    const processingModal = document.getElementById("processingModal");
    if (processingModal) processingModal.classList.remove("hidden");

    try {
      const formData = new FormData(form);
      const body = Object.fromEntries(formData.entries());

      body.balance_type  = alpineData.withdrawMethod === "Cryptocurrency" ? "btc" : "fiat";
      body.withdrawMethod = alpineData.withdrawMethod;
      body.pin           = pin;
      body.otp_code      = otp;

      const response = await fetch("/api/international-transfer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (processingModal) processingModal.classList.add("hidden");

      if (data.success) {
        // ── Reset Alpine form state ──
        alpineData.amount         = "";
        alpineData.pin            = "";
        alpineData.description    = "";
        alpineData.accountName    = "";
        alpineData.accountNumber  = "";
        alpineData.bankName       = "";
        alpineData.bankAddress    = "";
        alpineData.country        = "";
        alpineData.iban           = "";
        alpineData.swiftCode      = "";
        alpineData.routingNumber  = "";
        alpineData.walletAddress  = "";
        alpineData.paypalEmail    = "";
        alpineData.wiseFullName   = "";
        alpineData.wiseEmail      = "";
        alpineData.wiseCountry    = "";
        alpineData.skrillEmail    = "";
        alpineData.skrillFullName = "";
        alpineData.venmoUsername  = "";
        alpineData.venmoPhone     = "";
        alpineData.zelleEmail     = "";
        alpineData.zellePhone     = "";
        alpineData.zelleName      = "";
        alpineData.cashAppTag     = "";
        alpineData.cashAppFullName = "";
        alpineData.revolutFullName = "";
        alpineData.revolutEmail   = "";
        alpineData.revolutPhone   = "";
        alpineData.alipayId       = "";
        alpineData.alipayFullName = "";
        alpineData.wechatId       = "";
        alpineData.wechatName     = "";
        if (document.getElementById("otp_code_input")) {
          document.getElementById("otp_code_input").value = "";
        }

        // ── Build details object for receipt ──
        const method = alpineData.withdrawMethod;
        const details = buildDetails(method, body);

        // ── Show receipt modal ──
        showIntlReceiptModal({
          method:      method,
          amount:      body.amount,
          balanceType: body.balance_type,
          currency:    "USD",
          status:      data.status || "pending",
          description: body.Description || "",
          details:     details,
          createdAt:   new Date().toISOString(),
          message:     data.message || "Transfer submitted successfully.",
        });

      } else {
        showToast(data.message || "Transfer failed. Please try again.", "error");
      }
    } catch (err) {
      if (processingModal) processingModal.classList.add("hidden");
      showToast("Connection error. Please try again.", "error");
      console.error("[Transfer Submit]", err);
    }
  };

  // ── Build details object per method ──────────────────────────────────────────
  function buildDetails(method, body) {
    switch (method) {
      case "Wire Transfer":
        return {
          accountName:   body.accountName,
          accountNumber: body.accountNumber,
          bankName:      body.bankName,
          bankAddress:   body.bankaddress,
          country:       body.country,
          iban:          body.iban,
          swiftCode:     body.swiftCode,
          routingNumber: body.routingNumber,
        };
      case "Cryptocurrency":
        return {
          cryptoCurrency: body.cryptoCurrency,
          cryptoNetwork:  body.cryptoNetwork,
          walletAddress:  body.wallet_address,
        };
      case "PayPal":
        return { paypalEmail: body.paypalEmail };
      case "Wise Transfer":
        return { fullName: body.wiseFullName, email: body.wiseEmail, country: body.wiseCountry };
      case "Skrill":
        return { email: body.skrillEmail, fullName: body.skrillFullName };
      case "Venmo":
        return { username: body.venmoUsername, phone: body.venmoPhone };
      case "Zelle":
        return { email: body.zelleEmail, phone: body.zellePhone, fullName: body.zelleName };
      case "Cash App":
        return { cashtag: body.cashAppTag, fullName: body.cashAppFullName };
      case "Revolut":
        return { fullName: body.revolutFullName, email: body.revolutEmail, phone: body.revolutPhone };
      case "Alipay":
        return { alipayId: body.alipayId, fullName: body.alipayFullName };
      case "WeChat Pay":
        return { wechatId: body.wechatId, fullName: body.wechatName };
      default:
        return {};
    }
  }

  // ── Get recipient label (mirrors accountHistory.js intRecipient) ─────────────
  function getRecipient(details) {
    if (!details) return "—";
    return (
      details.accountName   ||
      details.paypalEmail   ||
      details.walletAddress ||
      details.fullName      ||
      details.email         ||
      details.username      ||
      details.cashtag       ||
      details.alipayId      ||
      details.wechatId      ||
      "—"
    );
  }

  // ── Receipt Modal ─────────────────────────────────────────────────────────────
  window.showIntlReceiptModal = function (txn) {
    const existing = document.getElementById("intlReceiptModal");
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
      const map = {
        completed:  "bg-emerald-100 text-emerald-700",
        approved:   "bg-emerald-100 text-emerald-700",
        pending:    "bg-amber-100 text-amber-700",
        processing: "bg-blue-100 text-blue-700",
        failed:     "bg-red-100 text-red-700",
      };
      return map[s] || "bg-amber-100 text-amber-700";
    };

    const dotClass = (s) => {
      const map = { completed: "bg-emerald-500", approved: "bg-emerald-500", pending: "bg-amber-500", processing: "bg-blue-500", failed: "bg-red-500" };
      return map[s] || "bg-amber-500";
    };

    const cap = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "—";

    const isBtc = txn.balanceType === "btc";
    const amountDisplay = isBtc
      ? `${parseFloat(txn.amount).toFixed(8)} BTC`
      : fmt(txn.amount);

    // Build detail rows based on method
    const optRow = (label, value) =>
      value && String(value).trim()
        ? `<div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
             <span class="text-sm text-gray-500 dark:text-gray-400">${label}</span>
             <span class="text-sm font-medium text-gray-900 dark:text-white text-right max-w-xs break-all">${value}</span>
           </div>`
        : "";

    const d = txn.details || {};
    let detailRows = "";

    switch (txn.method) {
      case "Wire Transfer":
        detailRows = [
          optRow("Recipient", d.accountName),
          optRow("Account Number", d.accountNumber),
          optRow("Bank Name", d.bankName),
          optRow("Bank Address", d.bankAddress),
          optRow("Country", d.country),
          optRow("IBAN", d.iban),
          optRow("SWIFT Code", d.swiftCode),
          optRow("Routing Number", d.routingNumber),
        ].join("");
        break;
      case "Cryptocurrency":
        detailRows = [
          optRow("Cryptocurrency", d.cryptoCurrency),
          optRow("Network", d.cryptoNetwork),
          optRow("Wallet Address", d.walletAddress),
        ].join("");
        break;
      case "PayPal":
        detailRows = optRow("PayPal Email", d.paypalEmail);
        break;
      case "Wise Transfer":
        detailRows = [optRow("Full Name", d.fullName), optRow("Email", d.email), optRow("Country", d.country)].join("");
        break;
      case "Skrill":
        detailRows = [optRow("Email", d.email), optRow("Full Name", d.fullName)].join("");
        break;
      case "Venmo":
        detailRows = [optRow("Username", d.username), optRow("Phone", d.phone)].join("");
        break;
      case "Zelle":
        detailRows = [optRow("Email", d.email), optRow("Phone", d.phone), optRow("Full Name", d.fullName)].join("");
        break;
      case "Cash App":
        detailRows = [optRow("$Cashtag", d.cashtag), optRow("Full Name", d.fullName)].join("");
        break;
      case "Revolut":
        detailRows = [optRow("Full Name", d.fullName), optRow("Email", d.email), optRow("Phone", d.phone)].join("");
        break;
      case "Alipay":
        detailRows = [optRow("Alipay ID", d.alipayId), optRow("Full Name", d.fullName)].join("");
        break;
      case "WeChat Pay":
        detailRows = [optRow("WeChat ID", d.wechatId), optRow("Full Name", d.fullName)].join("");
        break;
      default:
        detailRows = "";
    }

    const modal = document.createElement("div");
    modal.id = "intlReceiptModal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";

    modal.innerHTML = `
      <style>
        @keyframes intlFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes intlSlideUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        #intlReceiptModal .receipt-dialog { animation: intlSlideUp 0.2s ease-out; }
      </style>

      <div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 receipt-dialog">

        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
              <i class="fas fa-globe text-white text-sm"></i>
            </div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">International Transfer Receipt</h2>
          </div>
          <button onclick="document.getElementById('intlReceiptModal').remove()"
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
            <div class="text-3xl font-bold text-red-500 dark:text-red-400 mb-2">${amountDisplay}</div>
            <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${statusClass(txn.status)}">
              <span class="w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass(txn.status)}"></span>
              ${cap(txn.status)}
            </span>
            ${txn.message ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${txn.message}</p>` : ""}
          </div>

          <!-- Details -->
          <div class="space-y-0">
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-sm text-gray-500 dark:text-gray-400">Method</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">${txn.method}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
              <span class="text-sm text-gray-500 dark:text-gray-400">Currency</span>
              <span class="text-sm text-gray-900 dark:text-white">${isBtc ? "BTC" : "USD"}</span>
            </div>
            ${detailRows}
            ${txn.description ? optRow("Note", txn.description) : ""}
            <div class="flex justify-between py-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">Date</span>
              <span class="text-sm text-gray-900 dark:text-white">${fmtDate(txn.createdAt)} ${fmtTime(txn.createdAt)}</span>
            </div>
          </div>

          <!-- Download + Close -->
          <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <button onclick="downloadIntlReceiptPdf(${JSON.stringify(txn).replace(/"/g, '&quot;')})"
              class="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all duration-200 transform hover:scale-[1.02]">
              <i class="fas fa-download mr-2"></i>Download PDF Receipt
            </button>
            <button onclick="document.getElementById('intlReceiptModal').remove()"
              class="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all duration-200">
              <i class="fas fa-times mr-2"></i>Close
            </button>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
  };

  // ── Download PDF (same jsPDF style as accountHistory.js) ─────────────────────
  window.downloadIntlReceiptPdf = function (txn) {
    if (!window.jspdf) {
      showToast("PDF library not loaded. Please refresh.", "error");
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

    const isBtc = txn.balanceType === "btc";
    const amountDisplay = isBtc
      ? `${parseFloat(txn.amount).toFixed(8)} BTC`
      : fmt(txn.amount);

    const d = txn.details || {};

    // ── Header bar ──
    doc.setFillColor(14, 165, 233);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NOVA FIRST VAULT", 14, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("International Transfer Receipt", 14, 20);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 140, 20);

    // ── Amount block ──
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 35, 182, 22, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Amount", 20, 44);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(14, 165, 233);
    doc.text(amountDisplay, 20, 53);

    // ── Status ──
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const statusColors = {
      completed: [16, 185, 129], approved: [16, 185, 129],
      pending: [245, 158, 11], processing: [59, 130, 246],
      failed: [239, 68, 68], rejected: [239, 68, 68], cancelled: [100, 116, 139],
    };
    const sc = statusColors[txn.status] || [245, 158, 11];
    doc.setTextColor(...sc);
    doc.text(cap(txn.status), 160, 44);

    // ── Divider ──
    doc.setDrawColor(226, 232, 240);
    doc.line(14, 62, 196, 62);

    // ── Rows ──
    const rows = [
      ["Transfer Method", txn.method || "—"],
      ["Amount", amountDisplay],
      ["Status", cap(txn.status)],
      ...(d.accountName    ? [["Recipient Name",   d.accountName]]    : []),
      ...(d.accountNumber  ? [["Account Number",   d.accountNumber]]  : []),
      ...(d.bankName       ? [["Bank Name",        d.bankName]]       : []),
      ...(d.country        ? [["Country",          d.country]]        : []),
      ...(d.iban           ? [["IBAN",             d.iban]]           : []),
      ...(d.swiftCode      ? [["SWIFT Code",       d.swiftCode]]      : []),
      ...(d.routingNumber  ? [["Routing Number",   d.routingNumber]]  : []),
      ...(d.walletAddress  ? [["Wallet Address",   d.walletAddress]]  : []),
      ...(d.cryptoCurrency ? [["Cryptocurrency",   d.cryptoCurrency]] : []),
      ...(d.cryptoNetwork  ? [["Network",          d.cryptoNetwork]]  : []),
      ...(d.paypalEmail    ? [["PayPal Email",     d.paypalEmail]]    : []),
      ...(d.email          ? [["Email",            d.email]]          : []),
      ...(d.fullName       ? [["Full Name",        d.fullName]]       : []),
      ...(d.username       ? [["Username",         d.username]]       : []),
      ...(d.cashtag        ? [["$Cashtag",         d.cashtag]]        : []),
      ...(d.phone          ? [["Phone",            d.phone]]          : []),
      ...(d.alipayId       ? [["Alipay ID",        d.alipayId]]       : []),
      ...(d.wechatId       ? [["WeChat ID",        d.wechatId]]       : []),
      ...(txn.description  ? [["Note",             txn.description]]  : []),
      ["Date", fmtDate(txn.createdAt) + " " + fmtTime(txn.createdAt)],
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

    // ── Footer ──
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text(
      "This is an auto-generated receipt. Please contact support if you have any questions.",
      14, 285
    );
    doc.text("nova-first-vault.com", 168, 285);

    doc.save(`intl-transfer-${Date.now()}.pdf`);
  };

  // ── Auto-inject jsPDF if not already loaded ───────────────────────────────────
  (function ensureJsPDF() {
    if (window.jspdf) return;
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(s);
  })();

});