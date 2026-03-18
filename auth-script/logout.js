async function handleLogout() {
  try {
    await fetch("http://localhost:4000/api/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (_) {
    // network error — still log out locally
  }
  sessionStorage.clear();
  window.location.href = "/login.html";
}