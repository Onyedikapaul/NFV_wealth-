// async function loadHeader() {
//   const slot = document.getElementById("header-slot");
//   if (!slot) return;

//   const res = await fetch("/components/header.html", { cache: "no-store" });
//   const html = await res.text();
//   slot.innerHTML = html;

//   // Set page title from <body data-title="...">
//   const pageTitle =
//     document.body.getAttribute("data-title") || document.title || "Dashboard";

//   const titleEl = document.querySelector("[data-page-title]");
//   if (titleEl) titleEl.textContent = pageTitle;

//   // Welcome message will be filled after user loads
//   if (typeof window.hydrateUserUI === "function") {
//     await window.hydrateUserUI();

//     const nameFromDom =
//       document.querySelector(".user-username")?.textContent?.trim() ||
//       document.querySelector(".user-fullname")?.textContent?.trim() ||
//       "User";

//     const welcomeEl = document.querySelector("[data-welcome-message]");
//     if (welcomeEl) welcomeEl.textContent = `Welcome back, ${nameFromDom}`;
//   }

//   // Notifications (optional)
//   if (typeof window.loadNotifications === "function") {
//     window.loadNotifications();
//   }
// }

// document.addEventListener("DOMContentLoaded", loadHeader);

const HEADER_MAP = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome to your account overview",
  },
  "/dashboard/cards.html": {
    title: "Cards",
    subtitle: "Manage and monitor your cards",
  },
  "/dashboard/accounthistory.html": {
    title: "Transactions",
    subtitle: "View and track your activity",
  },

  "/dashboard/localtransfer.html": {
    title: "Local Transfer",
    subtitle: "",
  },

  "/dashboard/internationaltransfer.html": {
    title: "International Transfer",
    subtitle: "Send funds globally with confidence",
  },

  "/dashboard/deposits.html": {
    title: "Deposit",
    subtitle: "",
  },
  "/dashboard/swap.html": {
    title: "Currency Swap",
    subtitle: "Convert between USD and Bitcoin",
  },

  "/dashboard/account-settings.html": {
    title: "Account Settings",
    subtitle: "Manage profile, security, and preferences",
  },
};

async function loadHeader() {
  const slot = document.getElementById("header-slot");
  if (!slot) return;

  // 1. Load header HTML
  const res = await fetch("/components/header.html", { cache: "no-store" });
  const html = await res.text();
  slot.innerHTML = html;

  // 2. Set page title + subtitle based on URL
  const path = window.location.pathname.replace(/\/+$/, "");
  const conf = HEADER_MAP[path] || {
    title:
      document.body.getAttribute("data-title") || document.title || "Dashboard",
    subtitle: document.body.getAttribute("data-subtitle") || "",
  };

  const titleEl = document.querySelector("[data-page-title]");
  const subEl = document.querySelector("[data-welcome-message]");

  if (titleEl) titleEl.textContent = conf.title;
  if (subEl) subEl.textContent = conf.subtitle;

  // 3. Hydrate user data (name/avatar/email)
  if (typeof window.hydrateUserUI === "function") {
    await window.hydrateUserUI();

    const nameFromDom =
      document.querySelector(".user-username")?.textContent?.trim() ||
      document.querySelector(".user-fullname")?.textContent?.trim() ||
      "User";

    // Optional: override subtitle with welcome message
    if (subEl && !conf.subtitle) {
      subEl.textContent = `Welcome back, ${nameFromDom}`;
    }
  }

  // 4. Notifications (unchanged)
  if (typeof window.loadNotifications === "function") {
    window.loadNotifications();
  }
}

document.addEventListener("DOMContentLoaded", loadHeader);
