// account-settings.js

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message, type = "success") {
  const existing = document.getElementById("settings-toast");
  if (existing) existing.remove();

  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    loading: "fa-spinner fa-spin",
  };
  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    loading: "bg-blue-500",
  };

  const toast = document.createElement("div");
  toast.id = "settings-toast";
  toast.style.cssText =
    "transition: opacity 0.3s, transform 0.3s; opacity: 0; transform: translateX(20px);";
  toast.className = `fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold max-w-xs ${colors[type]}`;
  toast.innerHTML = `
    <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
      <i class="fa-solid ${icons[type]} text-xs"></i>
    </div>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  });

  if (type !== "loading") {
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(20px)";
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }

  return toast;
}

// ─── Button helpers ───────────────────────────────────────────────────────────
// We use data-orig-html on the button so the original label
// is always retrievable no matter what, even after async gaps.

function startBtn(btn) {
  btn.setAttribute("data-orig-html", btn.innerHTML);
  btn.disabled = true;
  btn.style.opacity = "0.75";
  btn.style.cursor = "not-allowed";
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2 text-xs"></i>Processing...`;
}

function resetBtn(btn) {
  const orig = btn.getAttribute("data-orig-html") || "Submit";
  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.cursor = "";
  btn.innerHTML = orig;
  btn.removeAttribute("data-orig-html");
}

// ─── Close modal ──────────────────────────────────────────────────────────────

function closeModal(varName) {
  try {
    const root = document.querySelector("[x-data]");
    if (root && window.Alpine) {
      Alpine.$data(root)[varName] = false;
      return;
    }
  } catch (_) {}
  const el = document.querySelector(`[x-show="${varName}"]`);
  if (el) el.style.display = "none";
}

// ─── 1. Avatar Upload ─────────────────────────────────────────────────────────

async function handleAvatarUpload(form) {
  const fileInput = form.querySelector("input[name='photo']");
  if (!fileInput?.files[0]) {
    showToast("Please select a photo first.", "error");
    return;
  }

  const btn = form.querySelector("button[type='submit']");
  startBtn(btn);
  const loadingToast = showToast("Uploading photo...", "loading");

  try {
    const fd = new FormData();
    fd.append("photo", fileInput.files[0]);

    const res = await fetch("/api/settings/avatar", {
      method: "PUT",
      body: fd,
      credentials: "include",
    });
    const data = await res.json();
    loadingToast.remove();

    if (data.success) {
      showToast(data.message || "Photo updated!", "success");
      if (data.avatarUrl) {
        document
          .querySelectorAll("[data-user-avatar]")
          .forEach((img) => (img.src = data.avatarUrl));
      }
      try {
        const root = document.querySelector("[x-data]");
        if (root && window.Alpine) {
          const d = Alpine.$data(root);
          d.selectedFile = null;
          d.selectedFileName = "";
        }
      } catch (_) {}
      form.reset();
      resetBtn(btn);
      closeModal("showProfilePictureModal");
    } else {
      showToast(data.message || "Upload failed.", "error");
      resetBtn(btn);
    }
  } catch {
    loadingToast.remove();
    showToast("Network error. Try again.", "error");
    resetBtn(btn);
  }
}

// ─── 2. PIN Change ────────────────────────────────────────────────────────────

async function handlePinChange(form) {
  const btn = form.querySelector("button[type='submit']");
  startBtn(btn);

  try {
    const pin = form.querySelector("input[name='pin']")?.value?.trim();
    const current_password = form.querySelector(
      "input[name='current_password']",
    )?.value;

    const res = await fetch("/api/settings/pin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pin, current_password }),
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "PIN updated!", "success");
      form.reset();
      resetBtn(btn);
      closeModal("showTransactionPinModal");
    } else {
      showToast(data.message || "Failed to update PIN.", "error");
      resetBtn(btn);
    }
  } catch {
    showToast("Network error. Try again.", "error");
    resetBtn(btn);
  }
}

// ─── 3. Password Change ───────────────────────────────────────────────────────

async function handlePasswordChange(form) {
  const btn = form.querySelector("button[type='submit']");
  startBtn(btn);

  try {
    const current_password = form.querySelector(
      "input[name='current_password_for_change']",
    )?.value;
    const new_password = form.querySelector(
      "input[name='new_password']",
    )?.value;
    const confirm_password = form.querySelector(
      "input[name='confirm_password']",
    )?.value;

    const res = await fetch("/api/settings/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        current_password,
        new_password,
        confirm_password,
      }),
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || "Password updated!", "success");
      form.reset();
      resetBtn(btn);
      closeModal("showPasswordModal");
    } else {
      showToast(data.message || "Failed to update password.", "error");
      resetBtn(btn);
    }
  } catch {
    showToast("Network error. Try again.", "error");
    resetBtn(btn);
  }
}

// ─── Wire up forms ────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("submit", (e) => {
    if (e.target.id === "avatar-form") {
      e.preventDefault();
      handleAvatarUpload(e.target);
    }
    if (e.target.id === "pin-form") {
      e.preventDefault();
      handlePinChange(e.target);
    }
    if (e.target.id === "password-form") {
      e.preventDefault();
      handlePasswordChange(e.target);
    }
  });
});
