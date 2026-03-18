// accountHistory.js — Deploy to /js-scripts/accountHistory.js

function transactionApp() {
  return {
    // ── State ──
    activeTab: "transactions",
    transactions: [],
    deposits: [],
    internationalTransfers: [],
    loading: false,

    // pagination - transactions
    txnPage: 1,
    txnTotal: 0,
    txnTotalPages: 1,
    txnLimit: 10,

    // pagination - deposits
    depPage: 1,
    depTotal: 0,
    depTotalPages: 1,
    depLimit: 10,

    // pagination - international
    intPage: 1,
    intTotal: 0,
    intTotalPages: 1,
    intLimit: 10,

    // modal
    showModal: false,
    modalData: null,
    modalType: null, // 'transaction' | 'deposit' | 'international'

    // filter
    txnStatus: "",
    depStatus: "",
    intStatus: "",

    // ── Init ──
    init() {
      this.loadTransactions();
      this.loadDeposits();
      this.loadInternationalTransfers();
    },

    switchTab(tab) {
      this.activeTab = tab;
    },

    // ── Load Transactions ──
    async loadTransactions() {
      this.loading = true;
      try {
        const params = new URLSearchParams({
          page: this.txnPage,
          limit: this.txnLimit,
          ...(this.txnStatus ? { status: this.txnStatus } : {}),
        });
        const res = await fetch(`/api/history/transactions?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          this.transactions = data.transactions;
          this.txnTotal = data.total;
          this.txnTotalPages = data.totalPages;
        }
      } catch (err) {
        console.error("loadTransactions error:", err);
      } finally {
        this.loading = false;
      }
    },

    // ── Load Deposits ──
    async loadDeposits() {
      this.loading = true;
      try {
        const params = new URLSearchParams({
          page: this.depPage,
          limit: this.depLimit,
          ...(this.depStatus ? { status: this.depStatus } : {}),
        });
        const res = await fetch(`/api/history/deposits?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          this.deposits = data.deposits;
          this.depTotal = data.total;
          this.depTotalPages = data.totalPages;
        }
      } catch (err) {
        console.error("loadDeposits error:", err);
      } finally {
        this.loading = false;
      }
    },

    // ── Load International Transfers ──
    async loadInternationalTransfers() {
      this.loading = true;
      try {
        const params = new URLSearchParams({
          page: this.intPage,
          limit: this.intLimit,
          ...(this.intStatus ? { status: this.intStatus } : {}),
        });
        const res = await fetch(`/api/international-transfer?${params}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          this.internationalTransfers = data.transfers;
          this.intTotal = data.total;
          this.intTotalPages = data.totalPages;
        }
      } catch (err) {
        console.error("loadInternationalTransfers error:", err);
      } finally {
        this.loading = false;
      }
    },

    // ── Pagination ──
    txnGoTo(page) {
      if (page < 1 || page > this.txnTotalPages) return;
      this.txnPage = page;
      this.loadTransactions();
    },

    depGoTo(page) {
      if (page < 1 || page > this.depTotalPages) return;
      this.depPage = page;
      this.loadDeposits();
    },

    intGoTo(page) {
      if (page < 1 || page > this.intTotalPages) return;
      this.intPage = page;
      this.loadInternationalTransfers();
    },

    // ── View Modal ──
    viewItem(item, type) {
      this.modalData = item;
      this.modalType = type;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.modalData = null;
      this.modalType = null;
    },

    // ── Get recipient label for international transfer ──
    intRecipient(t) {
      if (!t || !t.details) return "—";
      const d = t.details;
      return (
        d.accountName ||
        d.paypalEmail ||
        d.walletAddress ||
        d.fullName ||
        d.email ||
        d.username ||
        d.cashtag ||
        d.alipayId ||
        d.wechatId ||
        "—"
      );
    },

    // ── Helpers ──
    fmt(amount, currency = "USD") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
      }).format(amount || 0);
    },

    fmtDate(d) {
      if (!d) return "—";
      return new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },

    fmtTime(d) {
      if (!d) return "";
      return new Date(d).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    statusClass(status) {
      const map = {
        completed:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        approved:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
        pending:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        processing:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
        failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
        rejected:
          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
        cancelled:
          "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
      };
      return (
        map[status] ||
        "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
      );
    },

    dotClass(status) {
      const map = {
        completed: "bg-emerald-500",
        approved: "bg-emerald-500",
        pending: "bg-amber-500",
        processing: "bg-blue-500",
        failed: "bg-red-500",
        rejected: "bg-red-500",
        cancelled: "bg-gray-400",
      };
      return map[status] || "bg-gray-400";
    },

    cap(str) {
      if (!str) return "—";
      return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // ── Download PDF ──
    async downloadPdf() {
      if (!this.modalData) return;

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: "mm", format: "a4" });

      const isDeposit = this.modalType === "deposit";
      const isInternational = this.modalType === "international";
      const d = this.modalData;

      // Header bar
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, 210, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("NOVA FIRST VAULT", 14, 12);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const label = isDeposit
        ? "Deposit Receipt"
        : isInternational
          ? "International Transfer Receipt"
          : "Transfer Receipt";
      doc.text(label, 14, 20);
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

      const amountDisplay =
        isInternational && d.balanceType === "btc"
          ? `${parseFloat(d.amount).toFixed(8)} BTC`
          : this.fmt(d.amount);
      doc.text(amountDisplay, 20, 53);

      // Status
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const statusColors = {
        completed: [16, 185, 129],
        approved: [16, 185, 129],
        pending: [245, 158, 11],
        processing: [59, 130, 246],
        failed: [239, 68, 68],
        rejected: [239, 68, 68],
        cancelled: [100, 116, 139],
      };
      const sc = statusColors[d.status] || [100, 116, 139];
      doc.setTextColor(...sc);
      doc.text(this.cap(d.status), 160, 44);

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 62, 196, 62);

      let rows = [];

      if (isDeposit) {
        rows = [
          ["Reference / Txn ID", d.transactionId || "—"],
          ["Coin / Payment Method", d.paymentMethod || "—"],
          ["Wallet Address", d.walletAddress || "—"],
          ["Status", this.cap(d.status)],
          [
            "Submitted",
            this.fmtDate(d.createdAt) + " " + this.fmtTime(d.createdAt),
          ],
          ...(d.approvedAt
            ? [
                [
                  "Approved At",
                  this.fmtDate(d.approvedAt) + " " + this.fmtTime(d.approvedAt),
                ],
              ]
            : []),
          ...(d.rejectedAt
            ? [["Rejected At", this.fmtDate(d.rejectedAt)]]
            : []),
          ...(d.rejectionReason
            ? [["Rejection Reason", d.rejectionReason]]
            : []),
        ];
      } else if (isInternational) {
        const det = d.details || {};
        rows = [
          ["Transfer Method", d.method || "—"],
          ["Amount", amountDisplay],
          ["Status", this.cap(d.status)],
          ...(det.accountName ? [["Recipient Name", det.accountName]] : []),
          ...(det.accountNumber ? [["Account Number", det.accountNumber]] : []),
          ...(det.bankName ? [["Bank Name", det.bankName]] : []),
          ...(det.country ? [["Country", det.country]] : []),
          ...(det.iban ? [["IBAN", det.iban]] : []),
          ...(det.swiftCode ? [["SWIFT Code", det.swiftCode]] : []),
          ...(det.routingNumber ? [["Routing Number", det.routingNumber]] : []),
          ...(det.walletAddress ? [["Wallet Address", det.walletAddress]] : []),
          ...(det.cryptoCurrency
            ? [["Cryptocurrency", det.cryptoCurrency]]
            : []),
          ...(det.cryptoNetwork ? [["Network", det.cryptoNetwork]] : []),
          ...(det.paypalEmail ? [["PayPal Email", det.paypalEmail]] : []),
          ...(det.email ? [["Email", det.email]] : []),
          ...(det.fullName ? [["Full Name", det.fullName]] : []),
          ...(det.username ? [["Username", det.username]] : []),
          ...(det.cashtag ? [["$Cashtag", det.cashtag]] : []),
          ...(det.phone ? [["Phone", det.phone]] : []),
          ...(det.alipayId ? [["Alipay ID", det.alipayId]] : []),
          ...(det.wechatId ? [["WeChat ID", det.wechatId]] : []),
          ...(d.description ? [["Note", d.description]] : []),
          ["Date", this.fmtDate(d.createdAt) + " " + this.fmtTime(d.createdAt)],
        ];
      } else {
        rows = [
          ["Reference", d.reference || "—"],
          ["Recipient Name", d.accountname || "—"],
          ["Account Number", d.accountnumber || "—"],
          ["Bank Name", d.bankname || "—"],
          ["Account Type", d.accounttype || "—"],
          ["Routing Number", d.routing_number || "—"],
          ["Swift Code", d.swift_code || "—"],
          ["Description", d.description || "—"],
          ["Balance Before", this.fmt(d.balanceBefore)],
          ["Balance After", this.fmt(d.balanceAfter)],
          ["Status", this.cap(d.status)],
          ["Date", this.fmtDate(d.createdAt) + " " + this.fmtTime(d.createdAt)],
        ];
      }

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
        14,
        285,
      );
      doc.text("nova-first-vault.com", 168, 285);

      const filename = isDeposit
        ? `deposit-${d.transactionId || d._id}.pdf`
        : isInternational
          ? `intl-transfer-${d._id}.pdf`
          : `transfer-${d.reference || d._id}.pdf`;

      doc.save(filename);
    },
  };
}
