(function () {
  const API_URL = "/api/admin/users";
  const tbody = document.getElementById("usersTbody");
  let allUsers = [];
  let currentToggleData = null; // { userId, toggle, type }

  function esc(str) {
    return String(str ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[m],
    );
  }

  function fullName(u) {
    return (
      u.name ||
      [u.firstname, u.middlename, u.lastname].filter(Boolean).join(" ")
    );
  }

  // ── TOAST ──────────────────────────────────────────────
  function showToast(type, message) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style.cssText =
        "position:fixed;top:1.5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;";
      document.body.appendChild(container);
    }
    const colors = { success: "#d1fae5", error: "#fee2e2", warning: "#fef3c7" };
    const borders = {
      success: "#10b981",
      error: "#ef4444",
      warning: "#f59e0b",
    };
    const icons = { success: "✅", error: "❌", warning: "⚠️" };
    const toast = document.createElement("div");
    toast.style.cssText = `display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1.2rem;border-radius:6px;font-size:0.875rem;font-weight:500;min-width:280px;box-shadow:0 4px 16px rgba(0,0,0,0.12);background:${colors[type]};border-left:4px solid ${borders[type]};animation:slideIn 0.3s ease;`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:1rem;opacity:0.6;">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ── RENDER ─────────────────────────────────────────────
  function render(users) {
    tbody.innerHTML = users
      .map((u) => {
        const name = fullName(u);
        return `
        <tr>
          <td>${esc(name)}</td>
          <td>${esc(u.email)}</td>

          <td>
            <label class="toggle">
              <input type="checkbox" ${u.isAllowedToDeposit ? "checked" : ""}
                data-user-id="${esc(u._id)}" data-type="deposit" />
              <span class="toggle-slider"></span>
            </label>
          </td>

          <td>
           <label class="toggle">
  <input type="checkbox" ${u.isAllowedToTransfer ? "checked" : ""}
    data-user-id="${esc(u._id)}" data-type="transfer" />
  <span class="toggle-slider"></span>
</label>
          </td>

          <td>
            <button class="btn btn-sm" data-login-id="${esc(u._id)}"
              style="cursor:pointer;border-radius:10px;padding:10px;background-color:#0b2f55;color:white;border:none;">
              Login
            </button>
          </td>

          <td>
            <button class="btn btn-sm btn-more" data-more-id="${esc(u._id)}"
              data-more-name="${esc(name)}" data-more-email="${esc(u.email)}"
              style="cursor:pointer;border-radius:10px;padding:10px;background:#111827;color:white;border:none;">
              More
            </button>
          </td>
        </tr>
      `;
      })
      .join("");

    bindToggleEvents();
    bindLoginEvents();
  }

  // ── TOGGLE EVENTS ──────────────────────────────────────
  function bindToggleEvents() {
    tbody.querySelectorAll("input[type='checkbox']").forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const userId = e.target.dataset.userId;
        const type = e.target.dataset.type; // 'deposit' or 'withdraw'
        const newValue = e.target.checked;

        if (!newValue) {
          // Turning OFF — ask for reason
          e.target.checked = true; // revert visually until confirmed
          currentToggleData = { userId, toggle: e.target, type };
          showReasonModal(type);
        } else {
          // Turning ON — no reason needed
          e.target.disabled = true;
          updatePermission(userId, type, true, null)
            .then(() =>
              showToast("success", `${capitalize(type)} enabled successfully`),
            )
            .catch(() => {
              showToast("error", "Failed to update permission");
              e.target.checked = false;
            })
            .finally(() => {
              e.target.disabled = false;
            });
        }
      });
    });
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── REASON MODAL ───────────────────────────────────────
  function showReasonModal(type) {
    const modal = document.getElementById("reasonModal");
    const title = modal.querySelector("h3");
    const desc = modal.querySelector("p");
    const input = document.getElementById("transferReasonInput");
    title.textContent = `Disable ${capitalize(type)}`;
    desc.textContent = `Provide a reason for disabling ${type} for this user. This will be shown to them.`;
    if (input) input.value = "";
    modal.style.display = "flex";
  }

  function hideReasonModal() {
    document.getElementById("reasonModal").style.display = "none";
    currentToggleData = null;
  }

  document
    .getElementById("cancelReasonBtn")
    ?.addEventListener("click", hideReasonModal);

  document
    .getElementById("submitReasonBtn")
    ?.addEventListener("click", async () => {
      const reason = document
        .getElementById("transferReasonInput")
        ?.value.trim();
      if (!reason) {
        showToast("warning", "Please provide a reason.");
        return;
      }
      if (!currentToggleData) return;

      const { userId, toggle, type } = currentToggleData;
      const btn = document.getElementById("submitReasonBtn");
      btn.disabled = true;
      btn.textContent = "Updating...";

      try {
        await updatePermission(userId, type, false, reason);
        toggle.checked = false;
        hideReasonModal();
        showToast("warning", `${capitalize(type)} disabled for user`);
      } catch (err) {
        showToast("error", err.message || "Failed to update");
      } finally {
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    });

  // ── API CALL ───────────────────────────────────────────
  async function updatePermission(userId, type, allowed, reason) {
    const body = { type, allowed };
    if (!allowed && reason) body.reason = reason;

    const res = await fetch(`/api/admin/users/${userId}/permission`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Update failed");
    return data;
  }

  // ── LOGIN EVENTS ───────────────────────────────────────
  function bindLoginEvents() {
    tbody.querySelectorAll("[data-login-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const userId = btn.dataset.loginId;
        btn.disabled = true;
        btn.textContent = "Logging in...";
        try {
          const res = await fetch(`/api/admin/users/${userId}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.message || "Login failed");
          window.location.href = data.redirectUrl || "/dashboard";
        } catch (err) {
          showToast("error", err.message || "Login failed");
          btn.disabled = false;
          btn.textContent = "Login";
        }
      });
    });
  }

  // ── MORE ACTIONS MODAL ─────────────────────────────────
  let activeUserId = null;

  function openMoreModal({ userId, name, email }) {
    activeUserId = userId;
    document.getElementById("amUserName").textContent = name || "—";
    document.getElementById("amUserEmail").textContent = email || "—";
    const modal = document.getElementById("moreActionsModal");
    modal.classList.remove("d-none");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeMoreModal() {
    const modal = document.getElementById("moreActionsModal");
    modal.classList.add("d-none");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    activeUserId = null;
  }

  // ── FETCH USERS ────────────────────────────────────────

  function bindMoreModalEvents() {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-more-id]");
      if (!btn) return;
      openMoreModal({
        userId: btn.dataset.moreId,
        name: btn.dataset.moreName,
        email: btn.dataset.moreEmail,
      });
    });

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-am-close='1']")) closeMoreModal();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMoreModal();
    });

    document.getElementById("amEditBtn")?.addEventListener("click", () => {
      if (activeUserId)
        window.location.href = `/admin/owner/dashboard/edit-user.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    document.getElementById("amEmailBtn")?.addEventListener("click", () => {
      if (activeUserId)
        window.location.href = `/admin/owner/dashboard/send-email-message.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    document.getElementById("amDepositsBtn")?.addEventListener("click", () => {
      if (activeUserId)
        window.location.href = `/admin/owner/dashboard/user-deposits.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    document.getElementById("amTransferBtn")?.addEventListener("click", () => {
      if (activeUserId)
        window.location.href = `/admin/owner/dashboard/user-local-Transfers.html?userId=${encodeURIComponent(activeUserId)}`;
    });

    document
      .getElementById("amAddDepositBtn")
      ?.addEventListener("click", () => {
        if (activeUserId)
          window.location.href = `/admin/owner/dashboard/add-deposit.html?userId=${encodeURIComponent(activeUserId)}`;
      });

    document
      .getElementById("amAddTransferBtn")
      ?.addEventListener("click", () => {
        if (activeUserId)
          window.location.href = `/admin/owner/dashboard/add-local-transfer.html?userId=${encodeURIComponent(activeUserId)}`;
      });

    document
      .getElementById("amInternationalTransfers")
      ?.addEventListener("click", () => {
        if (activeUserId)
          window.location.href = `/admin/owner/dashboard/user-international-Transfer.html?userId=${encodeURIComponent(activeUserId)}`;
      });

    document
      .getElementById("amAddInternationalTransferBtn")
      ?.addEventListener("click", () => {
        if (activeUserId)
          window.location.href = `/admin/owner/dashboard/add-international-transfer.html?userId=${encodeURIComponent(activeUserId)}`;
      });
  }

  async function fetchUsers() {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const data = await res.json();
      allUsers = Array.isArray(data) ? data : data.users || [];
      render(allUsers);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Error: ${esc(err.message)}</td></tr>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindMoreModalEvents();
    fetchUsers();
  });
})();
