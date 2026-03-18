async function loadRecentTransactions() {
  try {
    const res = await fetch("/api/user/recent-transactions", {
      credentials: "include",
    });
    const data = await res.json();
    if (!data.success) return;

    const container = document.getElementById("recentTransactionsList");
    if (!container) return;

    if (data.transactions.length === 0) {
      container.innerHTML = `
        <div class="text-center py-6">
          <p class="text-sm text-gray-400 dark:text-gray-500">No transactions yet</p>
        </div>`;
      return;
    }

    container.innerHTML = data.transactions
      .map((txn) => {
        const date = new Date(txn.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const amount = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(txn.amount);
        const initials =
          txn.accountname
            ?.split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")
            .toUpperCase() || "??";

        return `
        <div class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span class="text-xs font-bold text-red-600 dark:text-red-400">${initials}</span>
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">${txn.accountname}</div>
              <div class="text-xs text-gray-400 dark:text-gray-500">${txn.bankname} · ${date}</div>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-red-500">-${amount}</div>
            <div class="text-xs mt-0.5">
              <span class="px-1.5 py-0.5 rounded-md text-xs font-medium ${
                txn.status === "completed"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : txn.status === "pending"
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              }">${txn.status}</span>
            </div>
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.error("loadRecentTransactions error:", err);
  }
}

loadRecentTransactions();
