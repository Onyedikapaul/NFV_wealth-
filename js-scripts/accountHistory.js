document.addEventListener("alpine:init", () => {
  Alpine.data("transactionApp", () => ({
    // state
    transactions: [],
    loading: true,

    pagination: {
      page: 1,
      per_page: 15,
      total: 0,
      total_pages: 1,
      from: 0,
      to: 0,
    },

    currentPage: 1,

    showFilterModal: false,
    showExportModal: false,
    showReceiptModal: false,

    selectedTransaction: null,

    dateFrom: "",
    dateTo: "",
    status: "",
    type: "",
    orderBy: "desc",
    perPage: "15",
    search: "",

    // IMPORTANT: set your real API base here
    API_BASE: "http://localhost:4000", // change in production
    // Example endpoint: GET /api/transactions
    // Example receipt endpoint (optional): GET /api/transactions/:id

    init() {
      this.loadTransactions();
    },

    // -----------------------------
    // Data loading
    // -----------------------------
    async loadTransactions() {
      this.loading = true;

      try {
        const params = new URLSearchParams();
        params.set("page", String(this.currentPage));
        // params.set("limit", String(this.perPage)); // backend should read limit
        // params.set("sort", this.orderBy); // backend should read sort

        params.set("per_page", "15"); // backend expects per_page
        params.set("order", this.orderBy); // backend expects order

        if (this.dateFrom) params.set("date_from", this.dateFrom);
        if (this.dateTo) params.set("date_to", this.dateTo);
        if (this.status) params.set("status", this.status);
        if (this.type) params.set("type", this.type);
        if (this.search) params.set("search", this.search);

        const url = `/api/transactions?${params.toString()}`;
        console.log("📡 Fetching:", url);

        const res = await fetch(url, {
          method: "GET",
          credentials: "include", // crucial if auth uses httpOnly cookie
          headers: { Accept: "application/json" },
        });

        // If session expired
        if (res.status === 401) {
          window.location.href = "../login.html";
          return;
        }

        const data = await res.json();
        console.log("📦 API response:", data);

        // Expecting:
        // { success: true, transactions: [...], pagination: {...} }
        if (!data?.success) {
          console.error("❌ Failed:", data?.message || "Unknown error");
          this.transactions = [];
          this.pagination = {
            ...this.pagination,
            total: 0,
            total_pages: 1,
            from: 0,
            to: 0,
          };
          return;
        }

        // Normalize API txns into what your UI expects
        const normalized = (data.transactions || []).map((t) => {
          const amount = Number(t.amount ?? 0);
          const currency = (t.currency || "USD").toUpperCase();
          const isDebit = t.direction
            ? String(t.direction).toLowerCase() === "debit"
            : Boolean(t.is_debit);

          const formattedAmount = this.formatMoney(amount, currency, isDebit);

          return {
            id: t._id || t.id, // mongoose id
            amount,
            currency,
            is_debit: isDebit,
            status: (t.status || "pending").toLowerCase(),
            reference: t.reference || t.ref || "—",
            description: t.description || "—",
            type: t.type || (isDebit ? "debit" : "credit"),
            created_at: t.createdAt || t.created_at || new Date().toISOString(),

            // optional receipt fields
            recipient_name: t.recipient_name || t.recipientName || "",
            recipient_account: t.recipient_account || t.recipientAccount || "",
            recipient_bank: t.recipient_bank || t.recipientBank || "",

            formatted_amount: formattedAmount,
          };
        });

        this.transactions = normalized;

        // Pagination: backend should return these keys (or compatible)
        const p = data.pagination || {};
        const page = Number(p.page || this.currentPage || 1);
        const per = Number(p.per_page || p.limit || this.perPage || 15);
        const total = Number(p.total || 0);
        const totalPages = Number(
          p.total_pages || Math.max(1, Math.ceil(total / per)),
        );

        const from = total === 0 ? 0 : (page - 1) * per + 1;
        const to = total === 0 ? 0 : Math.min(page * per, total);

        this.pagination = {
          page,
          per_page: per,
          total,
          total_pages: totalPages,
          from,
          to,
        };

        this.currentPage = page;
      } catch (err) {
        console.error("💥 loadTransactions error:", err);
        this.transactions = [];
      } finally {
        this.loading = false;
      }
    },

    // -----------------------------
    // Helpers
    // -----------------------------
    formatMoney(amount, currency, isDebit) {
      const sign = isDebit ? "-" : "+";
      const value = Math.abs(Number(amount || 0)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      // simple prefixing
      const prefix = currency === "USD" ? "$" : currency ? currency + " " : "";
      return `${sign}${prefix}${value}`;
    },

    getStatusBadgeClass(status) {
      const classes = {
        completed:
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        pending:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
        failed: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
        cancelled:
          "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
      };
      return (
        classes[String(status || "pending").toLowerCase()] || classes.pending
      );
    },

    getStatusDotClass(status) {
      const classes = {
        completed: "bg-green-500",
        pending: "bg-yellow-500",
        failed: "bg-red-500",
        cancelled: "bg-gray-500",
      };
      return (
        classes[String(status || "pending").toLowerCase()] || classes.pending
      );
    },

    formatDate(dateString) {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },

    formatTime(dateString) {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    // -----------------------------
    // Pagination
    // -----------------------------
    goToPage(page) {
      const totalPages = Number(this.pagination.total_pages || 1);
      const next = Number(page);

      if (next >= 1 && next <= totalPages) {
        this.currentPage = next;
        this.loadTransactions();
      }
    },

    // -----------------------------
    // Receipt
    // -----------------------------
    viewReceipt(txn) {
      this.selectedTransaction = txn;
      this.showReceiptModal = true;
    },

    printReceipt() {
      if (!this.selectedTransaction) return;
      const win = window.open("", "_blank");
      win.document.write(this.generateReceiptHtml());
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 250);
    },

    downloadReceipt() {
      // print dialog -> save as PDF
      this.printReceipt();
    },

    generateReceiptHtml() {
      const txn = this.selectedTransaction || {};
      const safeStatus = String(txn.status || "pending").toLowerCase();

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transaction Receipt - ${txn.reference || ""}</title>
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            body { font-family: Arial, sans-serif; padding:40px; background:#f5f5f5; }
            .receipt { max-width:600px; margin:0 auto; background:#fff; padding:40px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align:center; border-bottom:2px solid #e5e7eb; padding-bottom:20px; margin-bottom:30px; }
            .header h1 { font-size:24px; color:#1f2937; margin-bottom:10px; }
            .amount { font-size:36px; font-weight:bold; color:${txn.is_debit ? "#dc2626" : "#16a34a"}; margin:20px 0; }
            .detail-row { display:flex; justify-content:space-between; gap:18px; padding:12px 0; border-bottom:1px solid #f3f4f6; }
            .detail-label { color:#6b7280; font-size:14px; }
            .detail-value { color:#1f2937; font-weight:600; font-size:14px; text-align:right; }
            .status { display:inline-block; padding:6px 12px; border-radius:6px; font-size:12px; font-weight:600; }
            .status.completed { background:#dcfce7; color:#16a34a; }
            .status.pending { background:#fef3c7; color:#d97706; }
            .status.failed { background:#fee2e2; color:#dc2626; }
            .status.cancelled { background:#e5e7eb; color:#374151; }
            .footer { text-align:center; margin-top:30px; padding-top:20px; border-top:2px solid #e5e7eb; color:#6b7280; font-size:12px; }
            @media print { body { background:white; padding:0; } .receipt { box-shadow:none; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Transaction Receipt</h1>
              <p style="color:#6b7280; margin-top:5px;">Reference: ${txn.reference || "—"}</p>
            </div>

            <div style="text-align:center;">
              <div class="amount">${txn.formatted_amount || "—"}</div>
              <p style="color:#6b7280;">${txn.is_debit ? "Debit Transaction" : "Credit Transaction"}</p>
            </div>

            <div style="margin-top:20px;">
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="status ${safeStatus}">${
                  String(txn.status || "pending")
                    .charAt(0)
                    .toUpperCase() + String(txn.status || "pending").slice(1)
                }</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Transaction Type</span>
                <span class="detail-value">${txn.type || "—"}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Description</span>
                <span class="detail-value">${txn.description || "N/A"}</span>
              </div>

              ${
                txn.recipient_name
                  ? `
              <div class="detail-row">
                <span class="detail-label">Recipient Name</span>
                <span class="detail-value">${txn.recipient_name}</span>
              </div>`
                  : ""
              }

              ${
                txn.recipient_account
                  ? `
              <div class="detail-row">
                <span class="detail-label">Recipient Account</span>
                <span class="detail-value">${txn.recipient_account}</span>
              </div>`
                  : ""
              }

              ${
                txn.recipient_bank
                  ? `
              <div class="detail-row">
                <span class="detail-label">Recipient Bank</span>
                <span class="detail-value">${txn.recipient_bank}</span>
              </div>`
                  : ""
              }

              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${this.formatDate(txn.created_at)} at ${this.formatTime(txn.created_at)}</span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Transaction ID</span>
                <span class="detail-value">#${txn.id || "—"}</span>
              </div>
            </div>

            <div class="footer">
              <p>This is a computer-generated receipt and does not require a signature.</p>
              <p style="margin-top:5px;">Generated on ${new Date().toLocaleString("en-US")}</p>
            </div>
          </div>
        </body>
        </html>
      `;
    },

    // -----------------------------
    // Filters
    // -----------------------------
    applyFilters() {
      this.currentPage = 1;
      this.showFilterModal = false;
      this.loadTransactions();
    },

    // -----------------------------
    // Export
    // (Disable for now, until backend exists)
    // -----------------------------
    exportData() {
      if (!this.exportType) {
        alert("Select a file format (e.g. PDF).");
        return;
      }
      if (!this.exportAs) {
        alert("Select how you want to receive the file.");
        return;
      }

      // For now: just show what would be exported
      const params = new URLSearchParams();
      params.set("format", this.exportType);
      params.set("as", this.exportAs);
      params.set("style", this.statementStyle);

      // include current filters so export matches what user sees
      if (this.dateFrom) params.set("date_from", this.dateFrom);
      if (this.dateTo) params.set("date_to", this.dateTo);
      if (this.status) params.set("status", this.status);
      if (this.type) params.set("type", this.type);
      if (this.search) params.set("search", this.search);
      params.set("sort", this.orderBy);
      params.set("limit", this.perPage);

      console.log("📤 Export payload:", Object.fromEntries(params.entries()));
      alert(
        "Export is not connected yet, but your options were captured. Check console.",
      );

      this.showExportModal = false;
    },
  }));
});
