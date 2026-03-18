(function () {
  const API_URL = "/api/admin/user-messages";

  const result = document.getElementById("result");
  const mount = document.getElementById("messagesMount");

  function escapeHTML(str = "") {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showMsg(type, msg) {
    if (!result) return;
    const bg =
      type === "success"
        ? "#d4edda"
        : type === "warn"
          ? "#fff3cd"
          : "#f8d7da";
    const bd =
      type === "success"
        ? "#c3e6cb"
        : type === "warn"
          ? "#ffeeba"
          : "#f5c6cb";

    result.innerHTML = `
      <div style="padding:10px;border:1px solid ${bd};background:${bg};border-radius:12px;">
        ${escapeHTML(msg)}
      </div>
    `;
  }

  function clearMsg() {
    if (result) result.innerHTML = "";
  }

  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  }

  function fullName(u) {
    if (!u) return "";
    return [u.firstname, u.middlename, u.lastname].filter(Boolean).join(" ").trim();
  }

  function renderList(items) {
    if (!mount) return;

    if (!Array.isArray(items) || items.length === 0) {
      mount.innerHTML = `<div class="empty-state">No customer messages found.</div>`;
      return;
    }

    mount.innerHTML = `
      <div class="messages-feed">
        ${items
          .map((t) => {
            const ticketId = t.ticketId || "—";
            const dept = t.department || "—";
            const msg = String(t.message || "").trim();
            const created = formatDate(t.createdAt);

            const email = t.user?.email || "—";
            const name = fullName(t.user) || "—";

            return `
              <article class="msg-card">
                <div class="msg-top">
                  <div class="msg-left">
                    <div class="msg-ticket">${escapeHTML(ticketId)}</div>
                    <div class="msg-email">${escapeHTML(email)}</div>
                    <div class="msg-name">${escapeHTML(name)}</div>
                  </div>

                  <div class="msg-right">
                    <span class="msg-dept">${escapeHTML(dept)}</span>
                    <div class="msg-date">${escapeHTML(created)}</div>
                  </div>
                </div>

                <div class="msg-body">
                  ${msg ? escapeHTML(msg) : `<span class="msg-empty">No Message</span>`}
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;
  }

  async function fetchMessages() {
    clearMsg();
    if (mount) mount.innerHTML = `<div class="loading">Loading...</div>`;

    try {
      const res = await fetch(API_URL, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        showMsg("error", data?.message || "Failed to load messages");
        if (mount) mount.innerHTML = "";
        return;
      }

      // ✅ Your API returns array directly
      const items = Array.isArray(data) ? data : [];

      showMsg(items.length ? "success" : "warn", `Loaded ${items.length} ticket(s)`);
      renderList(items);
    } catch (err) {
      console.error(err);
      showMsg("error", "Network error while loading messages");
      if (mount) mount.innerHTML = "";
    }
  }

  document.addEventListener("DOMContentLoaded", fetchMessages);
})();
