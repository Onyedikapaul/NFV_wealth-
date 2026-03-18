// js/mount-mobile-nav.js
(function () {
  async function mountMobileNav(options = {}) {
    const {
      mountSelector = "[data-mobile-nav]",
      url = "/components/mobile-nav.html",
    } = options;

    const mount = document.querySelector(mountSelector);
    if (!mount) return;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);

      mount.innerHTML = await res.text();

      // Re-init Alpine on ONLY this injected DOM
      if (window.Alpine && typeof window.Alpine.initTree === "function") {
        window.Alpine.initTree(mount);
      }

      // (Optional) ensure "Menu" state variables exist if your HTML relies on them
      // This prevents Alpine "showMobileMenu is not defined" errors.
      // If your page already defines them, this does nothing.
      if (!mount.closest("[x-data]")) {
        // do nothing - but ideally mount should be inside a parent x-data
      }
    } catch (err) {
      console.error("mountMobileNav:", err);
      mount.innerHTML = `<div class="p-4 text-sm text-red-500">Failed to load mobile nav</div>`;
    }
  }

  // Expose function so you can call it manually if you want
  window.mountMobileNav = mountMobileNav;

  // Auto-mount when DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    mountMobileNav();
  });
})();
