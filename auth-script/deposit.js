// // deposit.js — external script for deposit form submission + modal feedback

// // ── Load active wallets and populate dropdown ─────────────────────────────────
// async function loadWallets() {
//   try {
//     const res = await fetch("/api/admin/wallets/active");
//     const data = await res.json();

//     const wallets = data.wallets || [];
//     const select = document.getElementById("coinSelect");
//     const addressEl = document.getElementById("bitcoinAddress");
//     const coinLabel = document.getElementById("coinLabel");
//     const coinIcon = document.getElementById("coinIcon");
//     const coinNote = document.getElementById("coinNote");

//     if (!wallets.length) {
//       if (select)
//         select.innerHTML = `<option value="">No wallets available</option>`;
//       if (addressEl) addressEl.innerText = "No wallet address configured.";
//       return;
//     }

//     // Populate dropdown
//     if (select) {
//       select.innerHTML = wallets
//         .map(
//           (w) =>
//             `<option value="${w._id}" data-address="${w.address}" data-coin="${w.coin}" data-symbol="${w.symbol}" data-network="${w.network || ""}">
//               ${w.coin.charAt(0).toUpperCase() + w.coin.slice(1)} (${w.symbol})${w.network ? " · " + w.network : ""}
//             </option>`,
//         )
//         .join("");

//       // Set first wallet on load
//       updateWalletDisplay(wallets[0]);

//       // On change
//       select.addEventListener("change", () => {
//         const opt = select.options[select.selectedIndex];
//         updateWalletDisplay({
//           address: opt.dataset.address,
//           coin: opt.dataset.coin,
//           symbol: opt.dataset.symbol,
//           network: opt.dataset.network,
//         });
//       });
//     }
//   } catch {
//     const addressEl = document.getElementById("bitcoinAddress");
//     if (addressEl) addressEl.innerText = "Failed to load address.";
//   }
// }

// function updateWalletDisplay(wallet) {
//   const addressEl = document.getElementById("bitcoinAddress");
//   const coinLabel = document.getElementById("coinLabel");
//   const coinNote = document.getElementById("coinNote");
//   const coinNameDisplay = document.getElementById("coinNameDisplay");

//   if (addressEl) addressEl.innerText = wallet.address;

//   const networkStr = wallet.network ? ` (${wallet.network})` : "";
//   const fullName = `${wallet.coin.charAt(0).toUpperCase() + wallet.coin.slice(1)} ${wallet.symbol}${networkStr}`;

//   if (coinLabel) coinLabel.textContent = `${fullName} Deposit Address`;
//   if (coinNote)
//     coinNote.textContent = `Send only ${wallet.symbol}${wallet.network ? " via " + wallet.network : ""} to this address. Sending the wrong coin may result in loss of funds.`;
//   if (coinNameDisplay) coinNameDisplay.textContent = fullName;
// }

// // ── Copy address ──────────────────────────────────────────────────────────────
// function copyWalletAddress() {
//   const address = document.getElementById("bitcoinAddress")?.innerText;
//   if (!address) return;
//   navigator.clipboard.writeText(address).then(() => {
//     const btn = document.getElementById("copyAddressBtn");
//     if (btn) {
//       btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
//       btn.classList.replace("bg-primary-500", "bg-green-500");
//       btn.classList.replace("hover:bg-primary-600", "hover:bg-green-600");
//       setTimeout(() => {
//         btn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
//         btn.classList.replace("bg-green-500", "bg-primary-500");
//         btn.classList.replace("hover:bg-green-600", "hover:bg-primary-600");
//       }, 2000);
//     }
//   });
// }

// // ── Modal ─────────────────────────────────────────────────────────────────────
// function showDepositModal({ success, message }) {
//   const existing = document.getElementById("depositModal");
//   if (existing) existing.remove();

//   const modal = document.createElement("div");
//   modal.id = "depositModal";
//   modal.innerHTML = `
//     <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
//          id="depositModalOverlay">
//       <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 transform transition-all duration-300 scale-95 opacity-0"
//            id="depositModalBox">
//         <div class="flex justify-center mb-4">
//           <div class="w-16 h-16 rounded-full flex items-center justify-center ${
//             success
//               ? "bg-green-100 dark:bg-green-900/30"
//               : "bg-red-100 dark:bg-red-900/30"
//           }">
//             <i class="fas ${
//               success
//                 ? "fa-check-circle text-green-500 dark:text-green-400"
//                 : "fa-times-circle text-red-500 dark:text-red-400"
//             } text-3xl"></i>
//           </div>
//         </div>
//         <h3 class="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">
//           ${success ? "Deposit Submitted!" : "Submission Failed"}
//         </h3>
//         <p class="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">${message}</p>
//         <button id="depositModalBtn"
//           class="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
//             success
//               ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
//               : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
//           }">
//           ${success ? "Go to Deposit History" : "Try Again"}
//         </button>
//       </div>
//     </div>
//   `;

//   document.body.appendChild(modal);

//   requestAnimationFrame(() => {
//     const box = document.getElementById("depositModalBox");
//     box.classList.remove("scale-95", "opacity-0");
//     box.classList.add("scale-100", "opacity-100");
//   });

//   document.getElementById("depositModalBtn").addEventListener("click", () => {
//     if (success) {
//       window.location.href = "/dashboard/accounthistory.html";
//     } else {
//       closeDepositModal();
//     }
//   });

//   if (!success) {
//     document
//       .getElementById("depositModalOverlay")
//       .addEventListener("click", (e) => {
//         if (e.target === e.currentTarget) closeDepositModal();
//       });
//   }
// }

// function closeDepositModal() {
//   const box = document.getElementById("depositModalBox");
//   if (!box) return;
//   box.classList.add("scale-95", "opacity-0");
//   setTimeout(() => {
//     const modal = document.getElementById("depositModal");
//     if (modal) modal.remove();
//   }, 200);
// }

// // ── Submit ─────────────────────────────────────────────────────────────────────
// async function submitDeposit(e) {
//   e.preventDefault();

//   const amount = document.getElementById("deposit_amount").value;
//   const txId = document.getElementById("transaction_id").value;
//   const select = document.getElementById("coinSelect");
//   const selectedOpt = select?.options[select.selectedIndex];
//   const paymentMethod = selectedOpt
//     ? `${selectedOpt.dataset.coin} (${selectedOpt.dataset.symbol})${selectedOpt.dataset.network ? " · " + selectedOpt.dataset.network : ""}`
//     : "";

//   const submitBtn = document.querySelector(
//     '#depositForm button[type="submit"]',
//   );

//   if (!paymentMethod) {
//     showDepositModal({ success: false, message: "Please select a coin." });
//     return;
//   }

//   if (submitBtn) {
//     submitBtn.disabled = true;
//     submitBtn.innerHTML =
//       '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';
//   }

//   try {
//     const res = await fetch("/api/deposits", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({
//         deposit_amount: amount,
//         transaction_id: txId,
//         payment_method: paymentMethod,
//         wallet_address: document.getElementById("bitcoinAddress")?.innerText,
//       }),
//     });

//     const data = await res.json();

//     showDepositModal({
//       success: res.ok,
//       message:
//         data.message ||
//         (res.ok
//           ? "Your deposit is pending approval."
//           : "Something went wrong."),
//     });

//     if (res.ok) {
//       document.getElementById("depositForm").reset();
//     }
//   } catch {
//     showDepositModal({
//       success: false,
//       message: "Network error. Please check your connection and try again.",
//     });
//   } finally {
//     if (submitBtn) {
//       submitBtn.disabled = false;
//       submitBtn.innerHTML =
//         '<i class="fas fa-check-circle mr-2"></i> Submit Deposit';
//     }
//   }
// }

// document.addEventListener("DOMContentLoaded", () => {
//   loadWallets();
//   const form = document.getElementById("depositForm");
//   if (form) form.addEventListener("submit", submitDeposit);
// });


// deposit.js — external script for deposit form submission + modal feedback

// ── Load active wallets and populate dropdown ─────────────────────────────────
async function loadWallets() {
  try {
    const res = await fetch("/api/admin/wallets/active");
    const data = await res.json();

    const wallets = data.wallets || [];
    const select = document.getElementById("coinSelect");
    const addressEl = document.getElementById("bitcoinAddress");

    if (!wallets.length) {
      if (select) select.innerHTML = `<option value="">No wallets available</option>`;
      if (addressEl) addressEl.innerText = "No wallet address configured.";
      return;
    }

    // Populate dropdown
    if (select) {
      select.innerHTML = wallets
        .map(
          (w) =>
            `<option value="${w._id}" data-address="${w.address}" data-coin="${w.coin}" data-symbol="${w.symbol}" data-network="${w.network || ""}">
              ${w.coin.charAt(0).toUpperCase() + w.coin.slice(1)} (${w.symbol})${w.network ? " · " + w.network : ""}
            </option>`,
        )
        .join("");

      // Set first wallet on load
      updateWalletDisplay(wallets[0]);

      // On change
      select.addEventListener("change", () => {
        const opt = select.options[select.selectedIndex];
        updateWalletDisplay({
          address: opt.dataset.address,
          coin: opt.dataset.coin,
          symbol: opt.dataset.symbol,
          network: opt.dataset.network,
        });
      });
    }
  } catch {
    const addressEl = document.getElementById("bitcoinAddress");
    if (addressEl) addressEl.innerText = "Failed to load address.";
  }
}

function updateWalletDisplay(wallet) {
  const addressEl = document.getElementById("bitcoinAddress");
  const coinLabel = document.getElementById("coinLabel");
  const coinNote = document.getElementById("coinNote");
  const coinNameDisplay = document.getElementById("coinNameDisplay");

  if (addressEl) addressEl.innerText = wallet.address;

  const networkStr = wallet.network ? ` (${wallet.network})` : "";
  const fullName = `${wallet.coin.charAt(0).toUpperCase() + wallet.coin.slice(1)} ${wallet.symbol}${networkStr}`;

  if (coinLabel) coinLabel.textContent = `${fullName} Deposit Address`;
  if (coinNote)
    coinNote.textContent = `Send only ${wallet.symbol}${wallet.network ? " via " + wallet.network : ""} to this address. Sending the wrong coin may result in loss of funds.`;
  if (coinNameDisplay) coinNameDisplay.textContent = fullName;
}

// ── Copy address ──────────────────────────────────────────────────────────────
function copyWalletAddress() {
  const address = document.getElementById("bitcoinAddress")?.innerText;
  if (!address) return;
  navigator.clipboard.writeText(address).then(() => {
    const btn = document.getElementById("copyAddressBtn");
    if (btn) {
      btn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
      btn.classList.replace("bg-primary-500", "bg-green-500");
      btn.classList.replace("hover:bg-primary-600", "hover:bg-green-600");
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
        btn.classList.replace("bg-green-500", "bg-primary-500");
        btn.classList.replace("hover:bg-green-600", "hover:bg-primary-600");
      }, 2000);
    }
  });
}

// ── Receipt Modal (same style as accountHistory view modal) ───────────────────
function showDepositReceiptModal(dep) {
  const existing = document.getElementById("depositReceiptModal");
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

  const modal = document.createElement("div");
  modal.id = "depositReceiptModal";
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";
  modal.style.cssText = "animation: fadeIn 0.2s ease-out;";

  modal.innerHTML = `
    <style>
      @keyframes receiptFadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes receiptSlideUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      #depositReceiptModal .receipt-dialog { animation: receiptSlideUp 0.2s ease-out; }
    </style>

    <div class="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 receipt-dialog">

      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
            <i class="fas fa-receipt text-white text-sm"></i>
          </div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Deposit Receipt</h2>
        </div>
        <button onclick="document.getElementById('depositReceiptModal').remove()"
          class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <i class="fas fa-times text-gray-500 dark:text-gray-400"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6">

        <!-- Amount Hero -->
        <div class="text-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-3">
            <i class="fas fa-arrow-down text-xl text-emerald-600 dark:text-emerald-400"></i>
          </div>
          <div class="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            ${fmt(dep.amount)}
          </div>
          <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
            Pending
          </span>
          ${dep.message ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${dep.message}</p>` : ""}
        </div>

        <!-- Details -->
        <div class="space-y-0">
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Transaction ID</span>
            <span class="text-sm font-mono font-semibold text-gray-900 dark:text-white text-right max-w-xs break-all">${dep.transactionId || "—"}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Coin / Method</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white">${dep.paymentMethod || "—"}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Wallet Address</span>
            <span class="text-xs font-mono text-gray-700 dark:text-gray-300 text-right max-w-xs break-all">${dep.walletAddress || "—"}</span>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700/50">
            <span class="text-sm text-gray-500 dark:text-gray-400">Status</span>
            <span class="text-sm font-medium text-amber-600 dark:text-amber-400">Pending Approval</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-sm text-gray-500 dark:text-gray-400">Submitted</span>
            <span class="text-sm text-gray-900 dark:text-white">${fmtDate(dep.createdAt)} ${fmtTime(dep.createdAt)}</span>
          </div>
        </div>

        <!-- Info notice -->
        <div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/50 rounded-xl">
          <div class="flex items-start gap-2">
            <i class="fas fa-info-circle text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0 text-sm"></i>
            <p class="text-xs text-amber-700 dark:text-amber-300">Your deposit is pending approval. You will be notified once it has been reviewed and credited to your account.</p>
          </div>
        </div>

        <!-- Download PDF + Close -->
        <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <button onclick="downloadDepositReceiptPdf(${JSON.stringify(dep).replace(/"/g, '&quot;')})"
            class="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/25 transition-all duration-200 transform hover:scale-[1.02]">
            <i class="fas fa-download mr-2"></i>Download PDF Receipt
          </button>
          <button onclick="document.getElementById('depositReceiptModal').remove()"
            class="w-full inline-flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all duration-200">
            <i class="fas fa-times mr-2"></i>Close
          </button>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close on backdrop click
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.remove();
  });
}

// ── Download PDF Receipt (same jsPDF approach as accountHistory.js) ────────────
function downloadDepositReceiptPdf(dep) {
  if (!window.jspdf) {
    alert("PDF library not loaded. Please refresh and try again.");
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

  // ── Header bar ──
  doc.setFillColor(14, 165, 233);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("NOVA FIRST VAULT", 14, 12);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Deposit Receipt", 14, 20);
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
  doc.text(fmt(dep.amount), 20, 53);

  // ── Status ──
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const statusColors = {
    completed: [16, 185, 129],
    approved: [16, 185, 129],
    pending: [245, 158, 11],
    failed: [239, 68, 68],
    rejected: [239, 68, 68],
  };
  const sc = statusColors[dep.status] || [245, 158, 11];
  doc.setTextColor(...sc);
  doc.text(cap(dep.status || "pending"), 160, 44);

  // ── Divider ──
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 62, 196, 62);

  // ── Rows ──
  const rows = [
    ["Reference / Txn ID", dep.transactionId || "—"],
    ["Coin / Payment Method", dep.paymentMethod || "—"],
    ["Wallet Address", dep.walletAddress || "—"],
    ["Status", cap(dep.status || "pending")],
    ["Submitted", fmtDate(dep.createdAt) + " " + fmtTime(dep.createdAt)],
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
    14,
    285
  );
  doc.text("nova-first-vault.com", 168, 285);

  doc.save(`deposit-${dep.transactionId || "receipt"}.pdf`);
}

// ── Error Modal (for failed submissions only) ─────────────────────────────────
function showDepositErrorModal(message) {
  const existing = document.getElementById("depositErrorModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "depositErrorModal";
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-white/20 dark:border-gray-700/50">
      <div class="w-16 h-16 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/30 mx-auto mb-4">
        <i class="fas fa-times-circle text-red-500 dark:text-red-400 text-3xl"></i>
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Submission Failed</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">${message}</p>
      <button onclick="document.getElementById('depositErrorModal').remove()"
        class="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all">
        Try Again
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });
}

// ── Submit ─────────────────────────────────────────────────────────────────────
async function submitDeposit(e) {
  e.preventDefault();

  const amount = document.getElementById("deposit_amount").value;
  const txId = document.getElementById("transaction_id").value;
  const select = document.getElementById("coinSelect");
  const selectedOpt = select?.options[select.selectedIndex];
  const walletAddress = document.getElementById("bitcoinAddress")?.innerText;
  const paymentMethod = selectedOpt
    ? `${selectedOpt.dataset.coin} (${selectedOpt.dataset.symbol})${selectedOpt.dataset.network ? " · " + selectedOpt.dataset.network : ""}`
    : "";

  const submitBtn = document.querySelector('#depositForm button[type="submit"]');

  if (!paymentMethod) {
    showDepositErrorModal("Please select a coin.");
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Submitting...';
  }

  try {
    const res = await fetch("/api/deposits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        deposit_amount: amount,
        transaction_id: txId,
        payment_method: paymentMethod,
        wallet_address: walletAddress,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      // ── Reset form ──
      document.getElementById("depositForm").reset();

      // ── Show receipt modal ──
      showDepositReceiptModal({
        amount: amount,
        transactionId: txId,
        paymentMethod: paymentMethod,
        walletAddress: walletAddress,
        status: "pending",
        createdAt: new Date().toISOString(),
        message: data.message || "Your deposit is pending approval.",
      });
    } else {
      showDepositErrorModal(data.message || "Something went wrong.");
    }
  } catch {
    showDepositErrorModal("Network error. Please check your connection and try again.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Submit Deposit';
    }
  }
}

// ── Also need jsPDF on this page — add it if not already loaded ───────────────
(function ensureJsPDF() {
  if (window.jspdf) return;
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  document.head.appendChild(script);
})();

document.addEventListener("DOMContentLoaded", () => {
  loadWallets();
  const form = document.getElementById("depositForm");
  if (form) form.addEventListener("submit", submitDeposit);
});