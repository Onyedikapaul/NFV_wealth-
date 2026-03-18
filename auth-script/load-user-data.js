// user-data.js

class UserData {
  constructor() {
    this.user = null;
    this.endpoint = "/api/user/me";
  }

  async fetch() {
    try {
      const res = await window.fetch(this.endpoint, {
        method: "GET",
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/login.html";
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.user = data.user ?? data;
      return this.user;
    } catch (err) {
      console.error("[UserData] fetch error:", err);
      return null;
    }
  }

  setTextByClass(className, value) {
    document.querySelectorAll(`.${className}`).forEach((el) => {
      el.textContent = value ?? "";
    });
  }

  setTextByAttr(field, value) {
    document.querySelectorAll(`[data-user="${field}"]`).forEach((el) => {
      el.textContent = value ?? "";
    });
  }

  setInputByName(name, value) {
    document
      .querySelectorAll(`input[name="${name}"], input[data-user="${name}"]`)
      .forEach((el) => {
        el.value = value ?? "";
      });
  }

  setAvatars(avatarUrl, displayName) {
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName ?? "User")}&background=0284c7&color=fff&size=128`;
    document.querySelectorAll("[data-user-avatar]").forEach((img) => {
      img.src = avatarUrl || fallback;
      img.alt = displayName ?? "User";
    });
  }

  setVerifiedBadge(isVerified) {
    const badge = document.getElementById("verified-badge");
    if (!badge) return;
    badge.classList.toggle("hidden", !isVerified);
  }

  formatBalance(amount, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount ?? 0);
  }

  populate(user) {
    if (!user) return;

    const fullName = [user.name, user.middlename, user.lastname]
      .filter(Boolean)
      .join(" ");
    const shortName = [user.name, user.lastname].filter(Boolean).join(" ");
    const balance = this.formatBalance(user.balance);

    this.setTextByClass("user-full-name", fullName);
    this.setTextByClass("user-short-name", shortName);
    this.setTextByClass("user-name", user.name);
    this.setTextByClass("user-lastname", user.lastname);
    this.setTextByClass("user-username", user.username);
    this.setTextByClass("user-email", user.email);
    this.setTextByClass("user-phone", user.phone);
    this.setTextByClass("user-country", user.country);
    this.setTextByClass("user-accounttype", user.accounttype);
    this.setTextByClass("user-account-number", user.accountNumber);
    this.setTextByClass("user-balance", balance);
    this.setTextByClass("user-balance-raw", String(user.balance ?? 0));

    this.setTextByAttr("fullName", fullName);
    this.setTextByAttr("name", user.name);
    this.setTextByAttr("lastname", user.lastname);
    this.setTextByAttr("username", user.username);
    this.setTextByAttr("email", user.email);
    this.setTextByAttr("phone", user.phone);
    this.setTextByAttr("country", user.country);
    this.setTextByAttr("accounttype", user.accounttype);
    this.setTextByAttr("accountNumber", user.accountNumber);
    this.setTextByAttr("balance", balance);

    this.setAvatars(user.avatarUrl, shortName);

    this.setInputByName("name", user.name);
    this.setInputByName("lastname", user.lastname);
    this.setInputByName("email", user.email);
    this.setInputByName("phone", user.phone);
    this.setInputByName("country", user.country);
    this.setInputByName("accounttype", user.accounttype);
    this.setInputByName("accountNumber", user.accountNumber);

    this.setVerifiedBadge(user.isVerified);
  }

  async init() {
    const user = await this.fetch();
    if (user) this.populate(user);
    return user;
  }
}

const userData = new UserData();
document.addEventListener("DOMContentLoaded", () => {
  userData.init();
});
window.userData = userData;
