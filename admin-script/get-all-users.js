// (function () {
//   const API_URL = "/api/admin/users";
//   const tbody = document.getElementById("usersTbody");
//   let allUsers = [];
//   let currentToggleData = null; // { userId, toggle, type }

//   const userId = new URLSearchParams(window.location.search).get("userId");
//   let currentUserOtp = { code: null, purpose: null, expires: null };

//   function esc(str) {
//     return String(str ?? "").replace(
//       /[&<>"']/g,
//       (m) =>
//         ({
//           "&": "&amp;",
//           "<": "&lt;",
//           ">": "&gt;",
//           '"': "&quot;",
//           "'": "&#039;",
//         })[m],
//     );
//   }

//   function fullName(u) {
//     return (
//       u.name ||
//       [u.firstname, u.middlename, u.lastname].filter(Boolean).join(" ")
//     );
//   }

//   // ── TOAST ──────────────────────────────────────────────
//   function showToast(type, message) {
//     let container = document.getElementById("toast-container");
//     if (!container) {
//       container = document.createElement("div");
//       container.id = "toast-container";
//       container.style.cssText =
//         "position:fixed;top:1.5rem;right:1.5rem;z-index:99999;display:flex;flex-direction:column;gap:0.5rem;";
//       document.body.appendChild(container);
//     }
//     const colors = { success: "#d1fae5", error: "#fee2e2", warning: "#fef3c7" };
//     const borders = {
//       success: "#10b981",
//       error: "#ef4444",
//       warning: "#f59e0b",
//     };
//     const icons = { success: "✅", error: "❌", warning: "⚠️" };
//     const toast = document.createElement("div");
//     toast.style.cssText = `display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1.2rem;border-radius:6px;font-size:0.875rem;font-weight:500;min-width:280px;box-shadow:0 4px 16px rgba(0,0,0,0.12);background:${colors[type]};border-left:4px solid ${borders[type]};animation:slideIn 0.3s ease;`;
//     toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span><button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:1rem;opacity:0.6;">✕</button>`;
//     container.appendChild(toast);
//     setTimeout(() => toast.remove(), 3500);
//   }

//   // Copy Function
//   function copyCode(code) {
//     navigator.clipboard
//       .writeText(code)
//       .then(() => {
//         showToast("success", `OTP ${code} copied to clipboard`);
//       })
//       .catch(() => {
//         showToast("error", "Copy failed — please copy manually");
//       });
//   }

//   // ── RENDER ─────────────────────────────────────────────
//   function render(users) {
//     tbody.innerHTML = users
//       .map((u) => {
//         const name = fullName(u);
//         return `
//         <tr>
//           <td>${esc(name)}</td>
//           <td>${esc(u.email)}</td>

//           <td>
//             <label class="toggle">
//               <input type="checkbox" ${u.isAllowedToDeposit ? "checked" : ""}
//                 data-user-id="${esc(u._id)}" data-type="deposit" />
//               <span class="toggle-slider"></span>
//             </label>
//           </td>

//           <td>
//            <label class="toggle">
//   <input type="checkbox" ${u.isAllowedToTransfer ? "checked" : ""}
//     data-user-id="${esc(u._id)}" data-type="transfer" />
//   <span class="toggle-slider"></span>
// </label>
//           </td>

//           <td>
//             <button class="btn btn-sm" data-login-id="${esc(u._id)}"
//               style="cursor:pointer;border-radius:10px;padding:10px;background-color:#0b2f55;color:white;border:none;">
//               Login
//             </button>
//           </td>

//           <td>
//             <button class="btn btn-sm btn-more" data-more-id="${esc(u._id)}"
//               data-more-name="${esc(name)}" data-more-email="${esc(u.email)}"
//               style="cursor:pointer;border-radius:10px;padding:10px;background:#111827;color:white;border:none;">
//               More
//             </button>
//           </td>
//           <td>
//   ${u.otp_code ? `
//     <div style="display:flex;align-items:center;gap:6px;">
//       <span style="font-family:'Courier New',monospace;font-size:0.82rem;
//         font-weight:700;letter-spacing:3px;
//         color:${u.otp_expires_at && Date.now() > new Date(u.otp_expires_at).getTime() ? '#92400e' : '#1e40af'};
//         background:${u.otp_expires_at && Date.now() > new Date(u.otp_expires_at).getTime() ? '#fef9c3' : '#dbeafe'};
//         padding:2px 8px;border-radius:5px;">
//         ${esc(u.otp_code)}
//       </span>
//       <button onclick="copyCode('${esc(u.otp_code)}')"
//         title="Copy OTP"
//         style="background:none;border:1px solid #bfdbfe;border-radius:5px;cursor:pointer;
//           padding:4px 6px;display:inline-flex;align-items:center;justify-content:center;
//           color:#3b82f6;transition:all 0.2s;"
//         onmouseover="this.style.background='#eff6ff';this.style.borderColor='#3b82f6'"
//         onmouseout="this.style.background='none';this.style.borderColor='#bfdbfe'">
//         <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
//           fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//           <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
//           <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
//         </svg>
//       </button>
//       <span style="font-size:0.7rem;color:#9ca3af;">
//         ${esc(u.otp_purpose?.replace(/_/g, " ") || "")}
//       </span>
//     </div>
//   ` : `<span style="color:#d1d5db;font-size:0.78rem;">—</span>`}
// </td>
//      </tr>
//       `;
//       })
//       .join("");

//     bindToggleEvents();
//     bindLoginEvents();
//   }

//   // ── TOGGLE EVENTS ──────────────────────────────────────
//   function bindToggleEvents() {
//     tbody.querySelectorAll("input[type='checkbox']").forEach((toggle) => {
//       toggle.addEventListener("change", (e) => {
//         const userId = e.target.dataset.userId;
//         const type = e.target.dataset.type; // 'deposit' or 'withdraw'
//         const newValue = e.target.checked;

//         if (!newValue) {
//           // Turning OFF — ask for reason
//           e.target.checked = true; // revert visually until confirmed
//           currentToggleData = { userId, toggle: e.target, type };
//           showReasonModal(type);
//         } else {
//           // Turning ON — no reason needed
//           e.target.disabled = true;
//           updatePermission(userId, type, true, null)
//             .then(() =>
//               showToast("success", `${capitalize(type)} enabled successfully`),
//             )
//             .catch(() => {
//               showToast("error", "Failed to update permission");
//               e.target.checked = false;
//             })
//             .finally(() => {
//               e.target.disabled = false;
//             });
//         }
//       });
//     });
//   }

//   function capitalize(str) {
//     return str.charAt(0).toUpperCase() + str.slice(1);
//   }

//   // ── REASON MODAL ───────────────────────────────────────
//   function showReasonModal(type) {
//     const modal = document.getElementById("reasonModal");
//     const title = modal.querySelector("h3");
//     const desc = modal.querySelector("p");
//     const input = document.getElementById("transferReasonInput");
//     title.textContent = `Disable ${capitalize(type)}`;
//     desc.textContent = `Provide a reason for disabling ${type} for this user. This will be shown to them.`;
//     if (input) input.value = "";
//     modal.style.display = "flex";
//   }

//   function hideReasonModal() {
//     document.getElementById("reasonModal").style.display = "none";
//     currentToggleData = null;
//   }

//   document
//     .getElementById("cancelReasonBtn")
//     ?.addEventListener("click", hideReasonModal);

//   document
//     .getElementById("submitReasonBtn")
//     ?.addEventListener("click", async () => {
//       const reason = document
//         .getElementById("transferReasonInput")
//         ?.value.trim();
//       if (!reason) {
//         showToast("warning", "Please provide a reason.");
//         return;
//       }
//       if (!currentToggleData) return;

//       const { userId, toggle, type } = currentToggleData;
//       const btn = document.getElementById("submitReasonBtn");
//       btn.disabled = true;
//       btn.textContent = "Updating...";

//       try {
//         await updatePermission(userId, type, false, reason);
//         toggle.checked = false;
//         hideReasonModal();
//         showToast("warning", `${capitalize(type)} disabled for user`);
//       } catch (err) {
//         showToast("error", err.message || "Failed to update");
//       } finally {
//         btn.disabled = false;
//         btn.textContent = "Submit";
//       }
//     });

//   // ── API CALL ───────────────────────────────────────────
//   async function updatePermission(userId, type, allowed, reason) {
//     const body = { type, allowed };
//     if (!allowed && reason) body.reason = reason;

//     const res = await fetch(`/api/admin/users/${userId}/permission`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify(body),
//     });

//     const data = await res.json().catch(() => ({}));
//     if (!res.ok) throw new Error(data.message || "Update failed");
//     return data;
//   }

//   // ── LOGIN EVENTS ───────────────────────────────────────
//   function bindLoginEvents() {
//     tbody.querySelectorAll("[data-login-id]").forEach((btn) => {
//       btn.addEventListener("click", async () => {
//         const userId = btn.dataset.loginId;
//         btn.disabled = true;
//         btn.textContent = "Logging in...";
//         try {
//           const res = await fetch(`/api/admin/users/${userId}/login`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             credentials: "include",
//           });
//           const data = await res.json().catch(() => ({}));
//           if (!res.ok) throw new Error(data.message || "Login failed");
//           window.location.href = data.redirectUrl || "/dashboard";
//         } catch (err) {
//           showToast("error", err.message || "Login failed");
//           btn.disabled = false;
//           btn.textContent = "Login";
//         }
//       });
//     });
//   }

//   // ── MORE ACTIONS MODAL ─────────────────────────────────
//   let activeUserId = null;

//   function openMoreModal({ userId, name, email }) {
//     activeUserId = userId;
//     document.getElementById("amUserName").textContent = name || "—";
//     document.getElementById("amUserEmail").textContent = email || "—";
//     const modal = document.getElementById("moreActionsModal");
//     modal.classList.remove("d-none");
//     modal.setAttribute("aria-hidden", "false");
//     document.body.style.overflow = "hidden";
//   }

//   function closeMoreModal() {
//     const modal = document.getElementById("moreActionsModal");
//     modal.classList.add("d-none");
//     modal.setAttribute("aria-hidden", "true");
//     document.body.style.overflow = "";
//     activeUserId = null;
//   }

//   // ── FETCH USERS ────────────────────────────────────────

//   function bindMoreModalEvents() {
//     tbody.addEventListener("click", (e) => {
//       const btn = e.target.closest("[data-more-id]");
//       if (!btn) return;
//       openMoreModal({
//         userId: btn.dataset.moreId,
//         name: btn.dataset.moreName,
//         email: btn.dataset.moreEmail,
//       });
//     });

//     document.addEventListener("click", (e) => {
//       if (e.target.closest("[data-am-close='1']")) closeMoreModal();
//     });

//     document.addEventListener("keydown", (e) => {
//       if (e.key === "Escape") closeMoreModal();
//     });

//     document.getElementById("amEditBtn")?.addEventListener("click", () => {
//       if (activeUserId)
//         window.location.href = `/admin/owner/dashboard/edit-user.html?userId=${encodeURIComponent(activeUserId)}`;
//     });

//     document.getElementById("amEmailBtn")?.addEventListener("click", () => {
//       if (activeUserId)
//         window.location.href = `/admin/owner/dashboard/send-email-message.html?userId=${encodeURIComponent(activeUserId)}`;
//     });

//     document.getElementById("amDepositsBtn")?.addEventListener("click", () => {
//       if (activeUserId)
//         window.location.href = `/admin/owner/dashboard/user-deposits.html?userId=${encodeURIComponent(activeUserId)}`;
//     });

//     document.getElementById("amTransferBtn")?.addEventListener("click", () => {
//       if (activeUserId)
//         window.location.href = `/admin/owner/dashboard/user-local-Transfers.html?userId=${encodeURIComponent(activeUserId)}`;
//     });

//     document
//       .getElementById("amAddDepositBtn")
//       ?.addEventListener("click", () => {
//         if (activeUserId)
//           window.location.href = `/admin/owner/dashboard/add-deposit.html?userId=${encodeURIComponent(activeUserId)}`;
//       });

//     document
//       .getElementById("amAddTransferBtn")
//       ?.addEventListener("click", () => {
//         if (activeUserId)
//           window.location.href = `/admin/owner/dashboard/add-local-transfer.html?userId=${encodeURIComponent(activeUserId)}`;
//       });

//     document
//       .getElementById("amInternationalTransfers")
//       ?.addEventListener("click", () => {
//         if (activeUserId)
//           window.location.href = `/admin/owner/dashboard/user-international-Transfer.html?userId=${encodeURIComponent(activeUserId)}`;
//       });

//     document
//       .getElementById("amAddInternationalTransferBtn")
//       ?.addEventListener("click", () => {
//         if (activeUserId)
//           window.location.href = `/admin/owner/dashboard/add-international-transfer.html?userId=${encodeURIComponent(activeUserId)}`;
//       });
//   }

//   async function fetchUsers() {
//     try {
//       const res = await fetch(API_URL, { credentials: "include" });
//       const data = await res.json();
//       allUsers = Array.isArray(data) ? data : data.users || [];
//       render(allUsers);
//     } catch (err) {
//       tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Error: ${esc(err.message)}</td></tr>`;
//     }
//   }

//   document.addEventListener("DOMContentLoaded", () => {
//     bindMoreModalEvents();
//     fetchUsers();
//   });
// })();

// ── Global copy function (must be outside IIFE for onclick to work) ──
window.copyCode = function (code, btn) {
  navigator.clipboard
    .writeText(code)
    .then(() => {
      btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
        fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
      btn.style.borderColor = "#6ee7b7";
      btn.style.color = "#10b981";
      btn.style.background = "#ecfdf5";
      setTimeout(() => {
        btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`;
        btn.style.borderColor = "#bfdbfe";
        btn.style.color = "#3b82f6";
        btn.style.background = "none";
      }, 2000);
      // show toast — grabbed from inside IIFE via global
      const container = document.getElementById("toast-container");
      if (container) {
        const t = document.createElement("div");
        t.style.cssText = `display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1.2rem;border-radius:6px;font-size:0.875rem;font-weight:500;min-width:280px;box-shadow:0 4px 16px rgba(0,0,0,0.12);background:#d1fae5;border-left:4px solid #10b981;`;
        t.innerHTML = `<span>✅</span><span>OTP <strong>${code}</strong> copied!</span>`;
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
      }
    })
    .catch(() => {
      alert("Copy failed — please copy manually: " + code);
    });
};

(function () {
  const API_URL = "/api/admin/users";
  const tbody = document.getElementById("usersTbody");
  let allUsers = [];
  let currentToggleData = null;

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

  // ── TOAST ──
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

  // ── OTP CELL ──
  function otpCell(u) {
    if (!u.otp_code)
      return `<span style="color:#d1d5db;font-size:0.78rem;">—</span>`;

    const isExpired =
      u.otp_expires_at && Date.now() > new Date(u.otp_expires_at).getTime();
    const codeColor = isExpired ? "#92400e" : "#1e40af";
    const codeBg = isExpired ? "#fef9c3" : "#dbeafe";
    const purpose = esc(u.otp_purpose?.replace(/_/g, " ") || "");

    return `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-family:'Courier New',monospace;font-size:0.82rem;font-weight:700;
          letter-spacing:3px;color:${codeColor};background:${codeBg};
          padding:2px 8px;border-radius:5px;">
          ${esc(u.otp_code)}
        </span>
        <button
          onclick="copyCode('${esc(u.otp_code)}', this)"
          title="Copy OTP"
          style="background:none;border:1px solid #bfdbfe;border-radius:5px;cursor:pointer;
            padding:4px 6px;display:inline-flex;align-items:center;justify-content:center;
            color:#3b82f6;transition:all 0.2s;"
          onmouseover="this.style.background='#eff6ff';this.style.borderColor='#3b82f6'"
          onmouseout="this.style.background='none';this.style.borderColor='#bfdbfe'">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
        ${purpose ? `<span style="font-size:0.7rem;color:#9ca3af;">${purpose}</span>` : ""}
        ${isExpired ? `<span style="font-size:0.68rem;color:#ef4444;font-weight:600;">Expired</span>` : ""}
      </div>`;
  }

  // ── RENDER ──
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

          <td>${otpCell(u)}</td>
        </tr>`;
      })
      .join("");

    bindToggleEvents();
    bindLoginEvents();
  }

  // ── TOGGLE EVENTS ──
  function bindToggleEvents() {
    tbody.querySelectorAll("input[type='checkbox']").forEach((toggle) => {
      toggle.addEventListener("change", (e) => {
        const userId = e.target.dataset.userId;
        const type = e.target.dataset.type;
        const newValue = e.target.checked;
        if (!newValue) {
          e.target.checked = true;
          currentToggleData = { userId, toggle: e.target, type };
          showReasonModal(type);
        } else {
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

  // ── REASON MODAL ──
  function showReasonModal(type) {
    const modal = document.getElementById("reasonModal");
    modal.querySelector("h3").textContent = `Disable ${capitalize(type)}`;
    modal.querySelector("p").textContent =
      `Provide a reason for disabling ${type} for this user. This will be shown to them.`;
    const input = document.getElementById("transferReasonInput");
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
      if (!reason) return showToast("warning", "Please provide a reason.");
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

  // ── API ──
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

  // ── LOGIN EVENTS ──
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

  // ── MORE ACTIONS MODAL ──
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

    const nav = (id, path) =>
      document.getElementById(id)?.addEventListener("click", () => {
        if (activeUserId)
          window.location.href = `${path}?userId=${encodeURIComponent(activeUserId)}`;
      });

    nav("amEditBtn", "/admin/owner/dashboard/edit-user.html");
    nav("amEmailBtn", "/admin/owner/dashboard/send-email-message.html");
    nav("amDepositsBtn", "/admin/owner/dashboard/user-deposits.html");
    nav("amTransferBtn", "/admin/owner/dashboard/user-local-Transfers.html");
    nav("amAddDepositBtn", "/admin/owner/dashboard/add-deposit.html");
    nav("amAddTransferBtn", "/admin/owner/dashboard/add-local-transfer.html");
    nav(
      "amInternationalTransfers",
      "/admin/owner/dashboard/user-international-Transfer.html",
    );
    nav(
      "amAddInternationalTransferBtn",
      "/admin/owner/dashboard/add-international-transfer.html",
    );
  }

  // ── FETCH ──
  async function fetchUsers() {
    try {
      const res = await fetch(API_URL, { credentials: "include" });
      const data = await res.json();
      allUsers = Array.isArray(data) ? data : data.users || [];
      render(allUsers);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:red;">Error: ${esc(err.message)}</td></tr>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bindMoreModalEvents();
    fetchUsers();
  });
})();
