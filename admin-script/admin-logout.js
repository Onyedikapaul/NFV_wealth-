// admin-logout.js
async function logout() {
  const btn = document.getElementById("logoutBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Logging out...";
  }

  try {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include", // IMPORTANT so cookie is sent
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    console.error("Logout error:", err);
    // even if it fails, still redirect (cookie may already be gone)
  } finally {
    // Always redirect to admin login
    window.location.replace("/admin/owner/dashboard/admin-login.html");
  }
}
