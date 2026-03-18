function setTextByClass(className, value) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.textContent = value ?? "";
  });
}

function setAttrByClass(className, attr, value) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.setAttribute(attr, value ?? "");
  });
}

async function loadUserProfile() {
  try {
    const res = await fetch("/api/user/profile", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;

    const u = data.user;

    setTextByClass("user-name", u.name);
    setTextByClass("user-lastname", u.lastname);
    setTextByClass("user-fullname", u.fullname);
    setTextByClass("user-username", `@${u.username}`);
    setTextByClass("user-email", u.email);
    setTextByClass("user-phone", u.phone);
    setTextByClass("user-country", u.country);
    setTextByClass("user-accounttype", u.accounttype);
    setTextByClass("user-account-number", u.accountNumber);
    setTextByClass("user-balance", u.balanceFormatted);
    setTextByClass("user-crypto-balance", u.cryptoFormatted);
    setTextByClass("user-status", u.accountStatus);
    setTextByClass("user-btc-price", `$${u.btcPrice?.toLocaleString()}`);
    setTextByClass("user-btc-usd", u.btcInUsdFormatted);
    setTextByClass("user-total-portfolio", u.totalPortfolioFormatted);
    setTextByClass("user-monthly-deposits", u.monthlyDepositsFormatted);
    setTextByClass("user-monthly-expenses", u.monthlyExpensesFormatted);
    setTextByClass("user-pending-total", u.pendingTotalFormatted);
    setTextByClass('user-total-cards', u.totalCards);
    setTextByClass('user-active-cards', u.activeCards);
    setTextByClass('user-pending-cards', u.pendingCards);
    setTextByClass(
      "user-pending-count",
      `${u.pendingCount} awaiting processing`,
    );
    const combinedTotal = u.monthlyDeposits + u.monthlyExpenses;
    setTextByClass(
      "user-monthly-total",
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(combinedTotal),
    );

    // Avatar images
    if (u.avatarUrl) {
      setAttrByClass("user-avatar", "src", u.avatarUrl);
    }

    // Store globally for other scripts to use
    window._userProfile = u;
  } catch (err) {
    console.error("loadUserProfile error:", err);
  }
}

loadUserProfile();
