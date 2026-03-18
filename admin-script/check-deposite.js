(function () {
  const rowsMount = document.getElementById("rowsMount");
  const tableMeta = document.getElementById("tableMeta");
  const alertBox = document.getElementById("alertBox");

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const refreshBtn = document.getElementById("refreshBtn");

  const statTotal = document.getElementById("statTotal");
  const statPending = document.getElementById("statPending");
  const statApproved = document.getElementById("statApproved");
  const statRejected = document.getElementById("statRejected");

  const imgModal = document.getElementById("imgModal");
  const imgTitle = document.getElementById("imgTitle");
  const frontImg = document.getElementById("frontImg");
  const backImg = document.getElementById("backImg");
  const frontLink = document.getElementById("frontLink");
  const backLink = document.getElementById("backLink");

  const confirmModal = document.getElementById("confirmModal");
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmText = document.getElementById("confirmText");
  const confirmOk = document.getElementById("confirmOk");

  let allDeposits = [];
  let pendingAction = null;

  function money(n) {
    const num = Number(n || 0);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function fmtDate(d) {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return "-";
    }
  }

  function badge(status) {
    const s = String(status || "pending").toLowerCase();
    return `<span class="badge ${s}">${s}</span>`;
  }

  function showError(msg) {
    alertBox.style.display = "block";
    alertBox.textContent = msg || "Something went wrong.";
  }

  function clearError() {
    alertBox.style.display = "none";
    alertBox.textContent = "";
  }

  function computeStats(list) {
    const total = list.length;
    const pending = list.filter(
      (x) => (x.status || "").toLowerCase() === "pending",
    ).length;
    const approved = list.filter(
      (x) => (x.status || "").toLowerCase() === "approved",
    ).length;
    const rejected = list.filter(
      (x) => (x.status || "").toLowerCase() === "rejected",
    ).length;

    statTotal.textContent = total;
    statPending.textContent = pending;
    statApproved.textContent = approved;
    statRejected.textContent = rejected;

    tableMeta.textContent = `${total} deposit(s)`;
  }

  function matchesSearch(d, q) {
    if (!q) return true;
    const s = q.toLowerCase();

    const u = d.user || {};
    const hay = [
      u.firstname,
      u.lastname,
      u.email,
      u.accountNumber,
      d.reference,
      d.status,
      d.currency,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(s);
  }

  function applyFilters() {
    const q = String(searchInput.value || "").trim();
    const st = String(statusFilter.value || "")
      .trim()
      .toLowerCase();

    const filtered = allDeposits.filter((d) => {
      if (st && String(d.status || "").toLowerCase() !== st) return false;
      return matchesSearch(d, q);
    });

    computeStats(filtered);
    renderRows(filtered);
  }

  function renderRows(list) {
    if (!list.length) {
      rowsMount.innerHTML = `<tr><td colspan="8" class="muted">No check deposits found.</td></tr>`;
      return;
    }

    rowsMount.innerHTML = list
      .map((d) => {
        const u = d.user || {};
        const fullName =
          [u.firstname, u.lastname].filter(Boolean).join(" ").trim() || "—";
        const email = u.email || "—";
        const acct = u.accountNumber || "—";

        const ref = d.reference
          ? `<span title="${d.reference}">${d.reference}</span>`
          : "—";

        const front = d.frontImageUrl || "";
        const back = d.backImageUrl || "";
        const canView = front || back;

        const st = String(d.status || "pending").toLowerCase();
        const disabled = st !== "pending" ? "disabled" : "";

        return `
                <tr>
                  <td>
                    <div style="font-weight:700">${fullName}</div>
                    <div class="muted">${email}</div>
                  </td>
                  <td>${money(d.amount)} ${String(d.currency || "USD").toUpperCase()}</td>
                  <td>${badge(d.status)}</td>
                  <td>${fmtDate(d.createdAt)}</td>
                  <td>
                    ${
                      canView
                        ? `<span class="link" data-view="1" data-id="${d._id}">View</span>`
                        : `<span class="muted">—</span>`
                    }
                  </td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-small btn-success" data-approve="1" data-id="${d._id}" ${disabled}>Approve</button>
                      <button class="btn btn-small btn-danger" data-reject="1" data-id="${d._id}" ${disabled}>Reject</button>
                      <button class="btn btn-small btn-ghost" data-delete="1" data-id="${d._id}">Delete</button>
                    </div>
                  </td>
                </tr>
              `;
      })
      .join("");
  }

  async function fetchDeposits() {
    clearError();
    rowsMount.innerHTML = `<tr><td colspan="8" class="muted">Loading...</td></tr>`;
    tableMeta.textContent = "Loading...";

    try {
      const res = await fetch("/api/admin/check-deposits", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data?.message || `Request failed (${res.status})`);

      allDeposits = Array.isArray(data.deposits) ? data.deposits : [];
      computeStats(allDeposits);
      applyFilters();
    } catch (e) {
      console.error(e);
      showError(e.message || "Failed to load check deposits.");
      rowsMount.innerHTML = `<tr><td colspan="8" class="muted">Failed to load.</td></tr>`;
      tableMeta.textContent = "Error";
    }
  }

  function openModal(deposit) {
    const u = deposit.user || {};
    const name =
      [u.firstname, u.lastname].filter(Boolean).join(" ").trim() || "User";
    imgTitle.textContent = `Check Images — ${name}`;

    const front = deposit.frontImageUrl || "";
    const back = deposit.backImageUrl || "";

    frontImg.src = front || "";
    backImg.src = back || "";
    frontLink.href = front || "#";
    backLink.href = back || "#";

    imgModal.style.display = "flex";
  }

  function closeModal() {
    imgModal.style.display = "none";
    frontImg.src = "";
    backImg.src = "";
    frontLink.href = "#";
    backLink.href = "#";
  }

  function openConfirm({ title, text, onOk }) {
    confirmTitle.textContent = title || "Confirm";
    confirmText.textContent = text || "Are you sure?";
    pendingAction = onOk || null;
    confirmOk.disabled = false;
    confirmOk.textContent = "Continue";
    confirmModal.style.display = "flex";
  }

  function closeConfirm() {
    confirmModal.style.display = "none";
    pendingAction = null;
  }

  async function callAction(url, method) {
    const res = await fetch(url, {
      method: method || "PATCH",
      credentials: "include",
      headers: { Accept: "application/json" },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data?.message || `Action failed (${res.status})`);
    return data;
  }

  // Events
  refreshBtn.addEventListener("click", fetchDeposits);
  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);

  document.addEventListener("click", (e) => {
    const t = e.target;

    // view images
    if (t && t.dataset && t.dataset.view === "1") {
      const id = t.dataset.id;
      const dep = allDeposits.find((x) => String(x._id) === String(id));
      if (dep) openModal(dep);
    }

    // modal close
    if (t && t.dataset && t.dataset.close === "1") closeModal();

    // confirm close
    if (t && t.dataset && t.dataset.confirmClose === "1") closeConfirm();

    // approve
    if (t && t.dataset && t.dataset.approve === "1") {
      const id = t.dataset.id;
      openConfirm({
        title: "Approve check deposit?",
        text: "This will credit the user's balance and create a successful transaction.",
        onOk: async () => {
          await callAction(`/api/admin/check-deposits/${id}/approve`, "PATCH");
          closeConfirm();
          fetchDeposits();
        },
      });
    }

    // reject
    if (t && t.dataset && t.dataset.reject === "1") {
      const id = t.dataset.id;
      openConfirm({
        title: "Reject check deposit?",
        text: "This will mark it rejected, create a failed transaction, and email the user.",
        onOk: async () => {
          await callAction(`/api/admin/check-deposits/${id}/reject`, "PATCH");
          closeConfirm();
          fetchDeposits();
        },
      });
    }

    // delete
    if (t && t.dataset && t.dataset.delete === "1") {
      const id = t.dataset.id;
      openConfirm({
        title: "Delete check deposit?",
        text: "This will permanently delete the deposit record.",
        onOk: async () => {
          await callAction(`/api/admin/check-deposits/${id}`, "DELETE");
          closeConfirm();
          fetchDeposits();
        },
      });
    }
  });

  confirmOk.addEventListener("click", async () => {
    if (!pendingAction) return;
    try {
      confirmOk.disabled = true;
      confirmOk.textContent = "Working...";
      await pendingAction();
    } catch (err) {
      console.error(err);
      confirmOk.disabled = false;
      confirmOk.textContent = "Continue";
      showError(err.message || "Action failed");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeConfirm();
    }
  });

  // Load
  document.addEventListener("DOMContentLoaded", fetchDeposits);
})();
