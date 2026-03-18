// admin-auth-required.js
(function () {
  const LOGIN_PAGE = "/admin/owner/dashboard/admin-login.html";

  async function requireAdminAuth() {
    try {
      const res = await fetch("/api/admin/auth/me", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        // ❌ Not logged in → redirect to login
        window.location.replace(LOGIN_PAGE);
        return;
      }

      // ✅ Logged in → allow page to load
    } catch (err) {
      console.error("Admin auth check failed:", err);
      window.location.replace(LOGIN_PAGE);
    }
  }

  // Run immediately
  requireAdminAuth();
})();
