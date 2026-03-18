// account-settings.js

document.addEventListener("DOMContentLoaded", () => {
  // ─── Alpine helper: close modal ───────────────────────────────────────────
  function closeAlpineModal(varName) {
    const root = document.querySelector("[x-data]");
    if (!root) return;
    try {
      const d = Alpine.$data(root);
      if (varName in d) d[varName] = false;
    } catch (_) {}
  }

  function resetAlpinePreview() {
    const root = document.querySelector("[x-data]");
    if (!root) return;
    try {
      const d = Alpine.$data(root);
      d.selectedFile = null;
      d.selectedFileName = "";
    } catch (_) {}
  }

  // ─── Toast ────────────────────────────────────────────────────────────────
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
    toast.className = `fixed top-5 right-5 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold ${colors[type]}`;
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

  // ─── Button loading state ─────────────────────────────────────────────────
  function setButtonLoading(btn, loading, originalHTML) {
    btn.disabled = loading;
    btn.classList.toggle("opacity-75", loading);
    btn.classList.toggle("cursor-not-allowed", loading);
    btn.innerHTML = loading
      ? `<i class="fa-solid fa-spinner fa-spin mr-2 text-xs"></i>Processing...`
      : originalHTML;
  }

  // ─── Mark input as errored ────────────────────────────────────────────────
  function markError(input) {
    if (!input) return;
    input.classList.add("!border-red-400", "ring-1", "ring-red-300");
    const clear = () => {
      input.classList.remove("!border-red-400", "ring-1", "ring-red-300");
      input.removeEventListener("input", clear);
    };
    input.addEventListener("input", clear);
    setTimeout(clear, 4000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Unified submit handler (single listener on document)
  // ══════════════════════════════════════════════════════════════════════════
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!["avatar-form", "pin-form", "password-form"].includes(form.id)) return;
    e.preventDefault();

    // ── 1. AVATAR ──────────────────────────────────────────────────────────
    if (form.id === "avatar-form") {
      const fileInput = form.querySelector("input[name='photo']");

      if (!fileInput?.files[0]) {
        showToast("Please select a photo first.", "error");
        return;
      }
      if (fileInput.files[0].size > 2 * 1024 * 1024) {
        showToast("File must be under 2MB.", "error");
        return;
      }

      const btn = form.querySelector("button[type='submit']");
      const orig = btn.innerHTML;
      setButtonLoading(btn, true, orig);
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

          // Update avatar previews on the page
          if (data.avatarUrl) {
            document
              .querySelectorAll("img.user-avatar, img[data-avatar]")
              .forEach((img) => (img.src = data.avatarUrl));
          }

          form.reset();
          resetAlpinePreview();
          closeAlpineModal("showProfilePictureModal");
        } else {
          showToast(data.message || "Upload failed.", "error");
        }
      } catch {
        loadingToast.remove();
        showToast("Network error. Try again.", "error");
      } finally {
        setButtonLoading(btn, false, orig);
      }
    }

    // ── 2. PIN ─────────────────────────────────────────────────────────────
    else if (form.id === "pin-form") {
      const pinInput = form.querySelector("input[name='pin']");
      const passInput = form.querySelector("input[name='current_password']");
      const pin = pinInput.value.trim();
      const password = passInput.value;

      if (!pin) {
        markError(pinInput);
        showToast("PIN is required.", "error");
        return;
      }
      if (!password) {
        markError(passInput);
        showToast("Current password is required.", "error");
        return;
      }
      if (!/^\d{4,6}$/.test(pin)) {
        markError(pinInput);
        showToast("PIN must be 4–6 digits only.", "error");
        return;
      }

      const btn = form.querySelector("button[type='submit']");
      const orig = btn.innerHTML;
      setButtonLoading(btn, true, orig);

      try {
        const res = await fetch("/api/settings/pin", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ pin, current_password: password }),
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message || "PIN updated!", "success");
          form.reset();
          closeAlpineModal("showTransactionPinModal");
        } else {
          showToast(data.message || "Failed to update PIN.", "error");
          if (data.message?.toLowerCase().includes("password"))
            markError(passInput);
        }
      } catch {
        showToast("Network error. Try again.", "error");
      } finally {
        setButtonLoading(btn, false, orig);
      }
    }

    // ── 3. PASSWORD ────────────────────────────────────────────────────────
    else if (form.id === "password-form") {
      const currentInput = form.querySelector(
        "input[name='current_password_for_change']",
      );
      const newInput = form.querySelector("input[name='new_password']");
      const confirmInput = form.querySelector("input[name='confirm_password']");

      const current = currentInput.value;
      const newPass = newInput.value;
      const confirm = confirmInput.value;

      if (!current) {
        markError(currentInput);
        showToast("Current password is required.", "error");
        return;
      }
      if (!newPass) {
        markError(newInput);
        showToast("New password is required.", "error");
        return;
      }
      if (!confirm) {
        markError(confirmInput);
        showToast("Please confirm your new password.", "error");
        return;
      }

      if (newPass.length < 6) {
        markError(newInput);
        showToast("Password must be at least 6 characters.", "error");
        return;
      }
      if (newPass !== confirm) {
        markError(newInput);
        markError(confirmInput);
        showToast("New passwords do not match.", "error");
        return;
      }

      const btn = form.querySelector("button[type='submit']");
      const orig = btn.innerHTML;
      setButtonLoading(btn, true, orig);

      try {
        const res = await fetch("/api/settings/password", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            current_password: current,
            new_password: newPass,
            confirm_password: confirm,
          }),
        });
        const data = await res.json();

        if (data.success) {
          showToast(data.message || "Password updated!", "success");
          form.reset();
          closeAlpineModal("showPasswordModal");
        } else {
          showToast(data.message || "Failed to update password.", "error");
          const msg = data.message?.toLowerCase() || "";
          if (msg.includes("current")) markError(currentInput);
          if (msg.includes("match")) {
            markError(newInput);
            markError(confirmInput);
          }
          if (msg.includes("same")) markError(newInput);
        }
      } catch {
        showToast("Network error. Try again.", "error");
      } finally {
        setButtonLoading(btn, false, orig);
      }
    }
  });
});
