// wallet-address.js
// Fetches the active deposit wallet address and populates .user-wallet-address

(function () {
  async function loadWalletAddress() {
    const targets = document.querySelectorAll(".user-wallet-address");
    if (!targets.length) {
      console.warn(
        "[wallet-address] No .user-wallet-address elements found on page.",
      );
      return;
    }

    // Show loading state
    targets.forEach((el) => {
      el.textContent = "Loading...";
      el.style.opacity = "0.5";
    });

    try {
      const res = await fetch("/api/wallet/deposit-address", {
        credentials: "include",
      });

      console.log("[wallet-address] status:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      console.log("[wallet-address] response:", json);

      const address = json?.wallet?.address;

      if (!address) {
        targets.forEach((el) => {
          el.textContent = "No address configured";
          el.style.opacity = "0.5";
        });
        return;
      }

      targets.forEach((el) => {
        el.textContent = address;
        el.setAttribute("title", address);
        el.style.opacity = "1";
      });
    } catch (err) {
      console.error("[wallet-address] fetch error:", err);
      targets.forEach((el) => {
        el.textContent = "Failed to load address";
        el.style.opacity = "0.4";
      });
    }
  }

  // Use window load to avoid Alpine.js timing conflicts
  window.addEventListener("load", loadWalletAddress);
})();
