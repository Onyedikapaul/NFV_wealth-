async function loadSidebar() {
  const slot = document.getElementById("sidebar-slot");
  if (!slot) return;

  const res = await fetch("/components/sidebar.html");
  const html = await res.text();
  slot.innerHTML = html;

  setActiveSidebarLink();
  if (typeof hydrateUserUI === "function") hydrateUserUI();
}

function setActiveSidebarLink() {
  const current = window.location.pathname;

  document.querySelectorAll(".sidebar-link").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    const isActive =
      href === current || (href.endsWith(".html") && current.endsWith(href));

    // Reset to inactive look (same as your other links)
    a.classList.remove(
      "bg-gradient-to-r",
      "from-primary-500",
      "to-primary-600",
      "text-white",
      "shadow-lg",
      "shadow-primary-500/25",
    );

    // Also reset icon wrapper if needed
    const wrap = a.querySelector(".w-10.h-10");
    if (wrap) wrap.classList.remove("bg-white/20");

    const icon = a.querySelector("i");
    if (icon) icon.classList.remove("text-white");

    // Apply active look only to current link
    if (isActive) {
      a.classList.add(
        "bg-gradient-to-r",
        "from-primary-500",
        "to-primary-600",
        "text-white",
        "shadow-lg",
        "shadow-primary-500/25",
      );

      if (wrap) wrap.classList.add("bg-white/20");
      if (icon) icon.classList.add("text-white");
    }
  });
}

document.addEventListener("DOMContentLoaded", loadSidebar);
