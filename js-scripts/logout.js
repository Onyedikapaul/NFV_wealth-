async function logout() {
  try {
    const res = await fetch("/api/logout", {
      method: "POST", // make sure your backend expects POST
      credentials: "include", // sends cookies
    });

    if (res.ok) {
      // Logout successful → redirect to login
      window.location.href = "/login.html";
    } else {
      console.error("Logout failed:", res.statusText);
      // Still redirect to login just in case
      window.location.href = "/login.html";
    }
  } catch (err) {
    console.error("Logout error:", err);
    window.location.href = "/login.html";
  }
}
