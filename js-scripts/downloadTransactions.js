// exportPdf.js
window.downloadTransactionsPdf = async (ctx) => {
  try {
    if (!ctx)
      throw new Error(
        "No Alpine context passed to downloadTransactionsPdf(ctx).",
      );

    const params = new URLSearchParams();

    // only add if exists
    if (ctx.orderBy) params.set("sort", ctx.orderBy);
    params.set("limit", "all");

    if (ctx.dateFrom) params.set("date_from", ctx.dateFrom);
    if (ctx.dateTo) params.set("date_to", ctx.dateTo);
    if (ctx.status) params.set("status", ctx.status);
    if (ctx.type) params.set("type", ctx.type);
    if (ctx.search) params.set("search", ctx.search);

    // const base = ctx.API_BASE || "";
    const url = `/api/transactions/export/pdf?${params.toString()}`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/pdf" },
    });

    if (res.status === 401) {
      window.location.href = "../login.html";
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      alert("Export failed: " + text);
      return;
    }

    const blob = await res.blob();

    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);

    // close modal (if your state uses showExportModal)
    if ("showExportModal" in ctx) ctx.showExportModal = false;
  } catch (err) {
    console.error("downloadTransactionsPdf error:", err);
    alert("Export failed. Check console.");
  }
};
