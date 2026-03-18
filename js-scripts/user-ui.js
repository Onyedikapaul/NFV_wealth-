function setTextByClass(className, value) {
  document.querySelectorAll(`.${className}`).forEach((el) => {
    el.textContent = value ?? "";
  });
}

function setAvatar({ name, lastname, avatarUrl }) {
  const full = `${name || ""} ${lastname || ""}`.trim();
  const initials = full
    ? full
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("")
    : "U";

  document.querySelectorAll(".user-avatar").forEach((root) => {
    const img = root.querySelector(".user-avatar-img");
    const fallback = root.querySelector(".user-avatar-fallback");
    const initialsEl = root.querySelector(".user-avatar-initials");

    if (initialsEl) initialsEl.textContent = initials;

    if (avatarUrl) {
      if (img) {
        img.src = avatarUrl;
        img.classList.remove("hidden");
      }
      if (fallback) fallback.classList.add("hidden");
    } else {
      if (img) img.classList.add("hidden");
      if (fallback) fallback.classList.remove("hidden");
    }
  });
}

async function hydrateUserUI() {
  try {
    const res = await fetch("/api/dashboard", { credentials: "include" });
    if (!res.ok) return;

    const data = await res.json();

    const fullName =
      `${data.user?.name || ""} ${data.user?.lastname || ""}`.trim();

    setTextByClass("user-fullname", fullName || "User");
    setTextByClass("user-email", data.user?.email || "");
    setTextByClass("user-username", data.user?.username || "");
    setTextByClass("welcome-user-message", `Welcome back, ${data.user?.username || "User"}!`);
    setAvatar({
      name: data.user?.name,
      lastname: data.user?.lastname,
      avatarUrl: data.user?.avatarUrl,
    });
  } catch (e) {
    console.error("hydrateUserUI:", e);
  }
}

window.hydrateUserUI = hydrateUserUI;

// keep your logout global
async function logout() {
  try {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
  } finally {
    window.location.href = "/login.html";
  }
}
window.logout = logout;
