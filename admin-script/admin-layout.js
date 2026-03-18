(async function () {
  async function loadHTML(selector, file) {
    const el = document.querySelector(selector);
    if (!el) return;

    try {
      const res = await fetch(file, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${file}: ${res.status}`);
      el.innerHTML = await res.text();
    } catch (err) {
      console.error(err);
      el.innerHTML = `
        <div style="padding:12px;border:1px solid #ff4d4d;border-radius:10px;">
          Could not load <b>${file}</b>
        </div>
      `;
    }
  }

  function setActiveSidebarLink() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll("[data-nav]");
    links.forEach((a) => {
      const target = a.getAttribute("data-nav");
      if (target === path) a.classList.add("is-active");
      else a.classList.remove("is-active");
    });
  }

  function bindMobileSidebarToggle() {
    const btn = document.getElementById("sidebarToggle");
    const sidebar = document.getElementById("sidebar-mount");
    if (!btn || !sidebar) return;

    btn.addEventListener("click", () => {
      sidebar.classList.toggle("is-open");
    });

    // close sidebar when clicking a link on mobile
    sidebar.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) sidebar.classList.remove("is-open");
    });
  }

  // load shared parts
  await loadHTML("#topnav-mount", "/admin-component/topnav.html");
  await loadHTML("#sidebar-mount", "/admin-component/sidebar.html");
  await loadHTML("#footer-mount", "/admin-component/footer.html");

  // after sidebar is loaded
  setActiveSidebarLink();
  bindMobileSidebarToggle();
})();
