const userId = new URLSearchParams(window.location.search).get("userId");

function showToast(type, message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>
    <button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6;">✕</button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function showConfirm(message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.innerHTML = `
    <div class="confirm-box">
      <h3>Are you sure?</h3>
      <p>${message}</p>
      <div class="confirm-actions">
        <button class="confirm-cancel">Cancel</button>
        <button class="confirm-delete">Delete</button>
      </div>
    </div>`;
  overlay.querySelector(".confirm-cancel").onclick = () => overlay.remove();
  overlay.querySelector(".confirm-delete").onclick = () => {
    overlay.remove();
    onConfirm();
  };
  document.body.appendChild(overlay);
}

function updateStatusBadge(status) {
  const badge = document.getElementById("statusBadge");
  badge.className = `badge badge-${status}`;
  badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function populate(user) {
  document.getElementById("name").value = user.name || "";
  document.getElementById("middlename").value = user.middlename || "";
  document.getElementById("lastname").value = user.lastname || "";
  document.getElementById("username").value = user.username || "";
  document.getElementById("email").value = user.email || "";
  document.getElementById("phone").value = user.phone || "";
  document.getElementById("country").value = user.country || "";
  document.getElementById("accounttype").value = user.accounttype || "";
  document.getElementById("accountNumber").value = user.accountNumber || "";
  document.getElementById("account_balance").value = user.balance ?? 0;
  document.getElementById("crypto_balance").value = user.crypto_balance ?? 0;
  document.getElementById("transactionLimit").value =
    user.transactionLimit ?? 500000;
  document.getElementById("transactionMinimum").value =
    user.transactionMinimum ?? 100;
  document.getElementById("isAllowedToTransact").value = String(
    user.isAllowedToTransact ?? true,
  );
  document.getElementById("emailVerified").value = String(
    user.isVerified ?? false,
  );
  document.getElementById("status").value = user.accountStatus || "active";
  document.getElementById("suspensionReason").value =
    user.suspensionReason || "";

  // pin and password are never pre-filled for security
  document.getElementById("pin").value = "";
  document.getElementById("password").value = "";

  const needsReason = ["suspended", "closed", "on-hold"].includes(
    user.accountStatus,
  );
  document.getElementById("suspensionWrap").style.display = needsReason
    ? "block"
    : "none";

  updateStatusBadge(user.accountStatus || "active");
  document.getElementById("metaText").textContent =
    `ID: ${user._id} · Joined: ${new Date(user.createdAt).toLocaleDateString()}`;
}

async function loadUser() {
  if (!userId) {
    document.getElementById("alertBox").className = "alert alert-error";
    document.getElementById("alertBox").textContent = "No userId in URL.";
    return;
  }
  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      credentials: "include",
    });
    const { success, user } = await res.json();
    if (!success) throw new Error("Failed to load user");
    populate(user);
  } catch (err) {
    showToast("error", err.message || "Failed to load user");
  }
}

// Show reason textarea when status changes to suspended / closed / on-hold
document.getElementById("status").addEventListener("change", function () {
  const needsReason = ["suspended", "closed", "on-hold"].includes(this.value);
  document.getElementById("suspensionWrap").style.display = needsReason
    ? "block"
    : "none";
  if (this.value === "active")
    document.getElementById("suspensionReason").value = "";
});

// Save
document.getElementById("saveBtn").addEventListener("click", async () => {
  const status = document.getElementById("status").value;
  const suspensionReason = document
    .getElementById("suspensionReason")
    .value.trim();

  const needsReason = ["suspended", "closed", "on-hold"].includes(status);
  if (needsReason && !suspensionReason) {
    showToast(
      "warning",
      `Please provide a reason for setting this account to "${status}".`,
    );
    document.getElementById("suspensionReason").focus();
    return;
  }

  const btn = document.getElementById("saveBtn");
  btn.disabled = true;
  btn.textContent = "Saving...";

  const body = {
    name: document.getElementById("name").value.trim(),
    middlename: document.getElementById("middlename").value.trim(),
    lastname: document.getElementById("lastname").value.trim(),
    username: document.getElementById("username").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    country: document.getElementById("country").value.trim(),
    accounttype: document.getElementById("accounttype").value.trim(),
    accountNumber: document.getElementById("accountNumber").value.trim(),
    balance: parseFloat(document.getElementById("account_balance").value),
    crypto_balance: parseFloat(document.getElementById("crypto_balance").value),
    transactionLimit: parseFloat(
      document.getElementById("transactionLimit").value,
    ),
    transactionMinimum: parseFloat(
      document.getElementById("transactionMinimum").value,
    ),
    isAllowedToTransact:
      document.getElementById("isAllowedToTransact").value === "true",
    accountStatus: status,
    suspensionReason: suspensionReason || null,
    isVerified: document.getElementById("emailVerified").value === "true",
  };

  // Only send pin / password if filled
  const pin = document.getElementById("pin").value.trim();
  const pw = document.getElementById("password").value.trim();
  if (pin) body.pin = pin;
  if (pw) body.password = pw;

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const { success, message } = await res.json();
    if (!success) throw new Error(message);
    showToast("success", "User updated successfully");
    loadUser();
  } catch (err) {
    showToast("error", err.message || "Failed to save");
  } finally {
    btn.disabled = false;
    btn.textContent = "Save Changes";
  }
});

// Delete
document.getElementById("deleteBtn").addEventListener("click", () => {
  showConfirm(
    "This will permanently delete the user and cannot be undone.",
    async () => {
      try {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
          credentials: "include",
        });
        const { success, message } = await res.json();
        if (!success) throw new Error(message);
        showToast("success", "User deleted");
        setTimeout(
          () => (window.location.href = "/admin/owner/dashboard/users.html"),
          1500,
        );
      } catch (err) {
        showToast("error", err.message || "Failed to delete");
      }
    },
  );
});

loadUser();
