(function () {
  // Generic loader: mounts HTML into a div by id, prevents double load, supports callbacks
  async function loadPart({ mountId, file, onLoaded }) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    if (mount.dataset.loaded === "true") return;
    mount.dataset.loaded = "true";

    const res = await fetch(file, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${file} (${res.status})`);

    mount.innerHTML = await res.text();

    if (typeof onLoaded === "function") {
      onLoaded();
    }
  }

  // OPTIONAL: run any DOM fixes for topnav
  function bindTopnavFixes() {
    // Example: stop dropdown menu click from bubbling
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      menu.addEventListener("click", (e) => e.stopPropagation());
    });

    // Example: logout (if you have a logout button in topnav/sidebar)
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (err) {
          console.error("Logout error:", err);
        }
        window.location.href = "/login.html";
      });
    }
  }

  // OPTIONAL: run any DOM fixes for sidebar
  function bindSidebarFixes() {
    // Auto highlight active sidebar link if links have .navitem
    const current = location.pathname.split("/").pop() || "index.html";

    document.querySelectorAll(".navitem").forEach((a) => {
      const href = (a.getAttribute("href") || "").split("/").pop();
      if (href && href === current) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  // OPTIONAL: footer fixes
  function bindFooterFixes() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", () => {
    // ✅ Use RELATIVE paths (recommended)
    // If your folder is: admin-component/topnav.html etc
    Promise.allSettled([
      loadPart({
        mountId: "topnav-mount",
        file: "./admin-component/topnav.html",
        onLoaded: bindTopnavFixes,
      }),
      loadPart({
        mountId: "sidebar-mount",
        file: "./admin-component/sidebar.html",
        onLoaded: bindSidebarFixes,
      }),
      loadPart({
        mountId: "footer-mount",
        file: "./admin-component/footer.html",
        onLoaded: bindFooterFixes,
      }),
    ]).then((results) => {
      // show errors clearly
      results.forEach((r) => {
        if (r.status === "rejected") console.error(r.reason);
      });
    });
  });
})();
