// ---------- DOM helpers ----------
function setTextByClass(className, value, options = {}) {
  const {
    fallback = "",
    trim = true,
  } = options;

  const text =
    value === null || value === undefined || value === ""
      ? fallback
      : String(value);

  const finalText = trim ? text.trim() : text;

  document.querySelectorAll(`.${className}`).forEach((el) => {
    if (el) el.textContent = finalText;
  });
}

function safeTrim(v) {
  return (v ?? "").toString().trim();
}

function getInitials(firstName, lastName) {
  const f = safeTrim(firstName)[0] || "";
  const l = safeTrim(lastName)[0] || "";
  const initials = (f + l).toUpperCase();
  return initials || "U";
}

// ---------- Avatar renderer ----------
function renderAvatar(user = {}) {
  const avatars = document.querySelectorAll(".user-avatar");
  if (!avatars.length) return;

  const firstName = safeTrim(user.name);
  const lastName = safeTrim(user.lastname);

  // IMPORTANT: accept BOTH keys so you never break:
  // - avatarUrl (your API)
  // - profileImage (your older code)
  const avatarUrl = safeTrim(user.avatarUrl || user.profileImage);

  const initials = getInitials(firstName, lastName);
  const alt = `${firstName} ${lastName}`.trim() || "User";

  avatars.forEach((avatar) => {
    const imgEl = avatar.querySelector(".user-avatar-img");
    const fallbackEl = avatar.querySelector(".user-avatar-fallback");
    const initialsEl = avatar.querySelector(".user-avatar-initials");

    // Defensive: if markup missing, skip safely
    if (!imgEl || !fallbackEl || !initialsEl) return;

    initialsEl.textContent = initials;

    if (avatarUrl) {
      imgEl.src = avatarUrl;
      imgEl.alt = alt;

      imgEl.classList.remove("hidden");
      fallbackEl.classList.add("hidden");
    } else {
      imgEl.removeAttribute("src");
      imgEl.alt = alt;

      imgEl.classList.add("hidden");
      fallbackEl.classList.remove("hidden");
    }
  });
}

// ---------- Formatting ----------
function formatUSD(amount) {
  const n = Number(amount ?? 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// ---------- Hydrate UI from /api/dashboard ----------
async function hydrateUserUI() {
  try {
    const res = await fetch("/api/dashboard", { credentials: "include" });
    if (!res.ok) throw new Error("Not authenticated");

    const data = await res.json();
    const user = data?.user || {};

    const fullName = `${safeTrim(user.name)} ${safeTrim(user.lastname)}`.replace(/\s+/g, " ").trim();
    const displayName = safeTrim(user.username) || safeTrim(user.name) || "User";

    // Sidebar + any page
    setTextByClass("user-fullname", fullName, { fallback: "User" });
    setTextByClass("user-username", user.username, { fallback: "" });
    setTextByClass("user-email", user.email, { fallback: "" });
    setTextByClass("welcome-userName", `Welcome back, ${displayName}`, { fallback: "Welcome back" });

    // Optional fields (safe)
    setTextByClass("user-wallet-address", data?.assets?.crypto?.address, { fallback: "N/A" });
    setTextByClass("user-account-number", data?.assets?.fiat?.accountNumber, { fallback: "----" });

    // Transaction limit (only if element exists)
    if (document.querySelector(".user-transaction-limit")) {
      const limit = user?.transactionLimit ?? 0;
      setTextByClass("user-transaction-limit", formatUSD(limit), { fallback: "N/A" });
    }

    // Avatar
    renderAvatar({
      name: user.name,
      lastname: user.lastname,
      avatarUrl: user.avatarUrl,
    });

    return data;
  } catch (err) {
    console.error("hydrateUserUI:", err);
    return null;
  }
}

// ---------- Logout ----------
async function logout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    window.location.href = "/login.html";
  }
}

// Make them globally callable (for sidebar onclick, etc.)
window.setTextByClass = setTextByClass;
window.renderAvatar = renderAvatar;
window.hydrateUserUI = hydrateUserUI;
window.logout = logout;

// Auto-run on every page (safe)
document.addEventListener("DOMContentLoaded", () => {
  hydrateUserUI();
});
