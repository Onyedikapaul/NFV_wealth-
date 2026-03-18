async function mountComponent(name, url) {
  const mount = document.querySelector(`[data-component="${name}"]`);
  if (!mount) return;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}`);
    mount.innerHTML = await res.text();
  } catch (err) {
    console.error("mountComponent:", err);
    mount.innerHTML = `<div class="p-4 text-sm text-red-500">Failed to load component</div>`;
  }
}

window.mountComponent = mountComponent;

document.addEventListener("DOMContentLoaded", async () => {
  await mountComponent("mobile-header", "/components/mobile-header.html");

  // set title
  const title = document.body.getAttribute("data-page-title");
  if (title) {
    const el = document.querySelector("[data-mobile-title]");
    if (el) el.textContent = title;
  }

  // IMPORTANT: load notifications after component is injected
  if (window.loadNotifications) window.loadNotifications();
});
