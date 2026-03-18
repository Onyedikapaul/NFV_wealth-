(function () {
  const LOGIN_PAGE = "/admin/owner/dashboard/admin-login.html";
  const DASHBOARD_PAGE = "/admin/owner/dashboard/index.html";

  // Detect if current page IS login page
  const isLoginPage = window.location.pathname.includes("admin-login");

  async function checkAdminAuth() {
    try {
      const res = await fetch("/api/admin/auth/me", {
        method: "GET",
        credentials: "include", // IMPORTANT
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        // ❌ Not logged in
        if (!isLoginPage) {
          window.location.replace(LOGIN_PAGE);
        }
        return;
      }

      // ✅ Logged in
      if (isLoginPage) {
        // If admin is already logged in, send to dashboard
        window.location.replace(DASHBOARD_PAGE);
      }
    } catch (err) {
      console.error("Admin auth check failed:", err);
      if (!isLoginPage) {
        window.location.replace(LOGIN_PAGE);
      }
    }
  }

  // Run immediately
  checkAdminAuth();
})();
