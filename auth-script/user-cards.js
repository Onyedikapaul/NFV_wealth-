// user-cards.js — Drop this script on any page that has .userCardsMount
// Fetches up to 2 cards for the logged-in user and renders them.
// Reads card.color_scheme from the API to pick the card gradient.

(function () {
  // ── Color scheme map (matches color_scheme field in DB) ──────────────────
  const COLOR_SCHEMES = {
    blue: {
      gradient:
        "linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #1e3a8a 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#93c5fd",
    },
    purple: {
      gradient:
        "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#c4b5fd",
    },
    violet: {
      gradient:
        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 40%, #4338ca 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#ddd6fe",
    },
    rose: {
      gradient:
        "linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#fda4af",
    },
    gold: {
      gradient:
        "linear-gradient(135deg, #b45309 0%, #92400e 50%, #78350f 100%)",
      shine: "rgba(255,215,0,0.15)",
      accent: "#fcd34d",
    },
    emerald: {
      gradient:
        "linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#6ee7b7",
    },
    slate: {
      gradient:
        "linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)",
      shine: "rgba(255,255,255,0.08)",
      accent: "#94a3b8",
    },
    cyan: {
      gradient:
        "linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #164e63 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#67e8f9",
    },
    pink: {
      gradient:
        "linear-gradient(135deg, #db2777 0%, #be185d 50%, #831843 100%)",
      shine: "rgba(255,255,255,0.10)",
      accent: "#f9a8d4",
    },
    black: {
      gradient:
        "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0d0d0d 100%)",
      shine: "rgba(255,255,255,0.06)",
      accent: "#e2e8f0",
    },
    // default fallback
    default: {
      gradient:
        "linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #1e3a8a 100%)",
      shine: "rgba(255,255,255,0.12)",
      accent: "#93c5fd",
    },
  };

  // ── Brand icon map ───────────────────────────────────────────────────────
  const BRAND_ICONS = {
    mastercard: "fa-brands fa-cc-mastercard",
    visa: "fa-brands fa-cc-visa",
    amex: "fa-brands fa-cc-amex",
  };

  // ── Status badge config ──────────────────────────────────────────────────
  const STATUS_CONFIG = {
    active: {
      bg: "rgba(52,211,153,0.2)",
      border: "rgba(52,211,153,0.4)",
      dot: "#34d399",
      label: "Active",
    },
    pending: {
      bg: "rgba(251,191,36,0.2)",
      border: "rgba(251,191,36,0.4)",
      dot: "#fbbf24",
      label: "Pending",
    },
    blocked: {
      bg: "rgba(239,68,68,0.2)",
      border: "rgba(239,68,68,0.4)",
      dot: "#ef4444",
      label: "Blocked",
    },
    inactive: {
      bg: "rgba(148,163,184,0.2)",
      border: "rgba(148,163,184,0.4)",
      dot: "#94a3b8",
      label: "Inactive",
    },
  };

  // ── Render a single card ─────────────────────────────────────────────────
  function renderCard(card) {
    const scheme = COLOR_SCHEMES[card.color_scheme] || COLOR_SCHEMES.default;
    const status = STATUS_CONFIG[card.status] || STATUS_CONFIG.inactive;
    const brandIcon = BRAND_ICONS[card.card_brand] || BRAND_ICONS.visa;
    const cardTypeLabel =
      card.card_type === "virtual" ? "Virtual Card" : "Physical Card";
    const maskedNumber = card.last_four
      ? `•••• •••• •••• ${card.last_four}`
      : "•••• •••• •••• ••••";
    const expiry =
      card.expiry_month && card.expiry_year
        ? `${card.expiry_month}/${card.expiry_year.slice(-2)}`
        : "••/••";

    const el = document.createElement("div");
    el.className = "uc-card-wrap";
    el.innerHTML = `
      <div class="uc-card" style="background: ${scheme.gradient};">
        <!-- Shine overlay -->
        <div class="uc-shine" style="background: linear-gradient(135deg, transparent 30%, ${scheme.shine} 50%, transparent 70%);"></div>

        <!-- Decorative circles -->
        <div class="uc-circle uc-circle-1" style="background: ${scheme.shine};"></div>
        <div class="uc-circle uc-circle-2" style="background: ${scheme.shine};"></div>

        <!-- Chip -->
        <div class="uc-chip">
          <i class="fa-solid fa-microchip" style="color: ${scheme.accent}; font-size: 13px;"></i>
        </div>

        <!-- Status badge -->
        <div class="uc-status" style="background:${status.bg}; border: 1px solid ${status.border};">
          <span class="uc-status-dot" style="background:${status.dot};"></span>
          ${status.label}
        </div>

        <!-- Card content -->
        <div class="uc-body">
          <div class="uc-type">${cardTypeLabel}</div>
          <div class="uc-number">${maskedNumber}</div>

          <div class="uc-footer">
            <div class="uc-holder-wrap">
              <div class="uc-label">Card Holder</div>
              <div class="uc-value uc-holder-name">${card.card_holder_name || "—"}</div>
            </div>
            <div class="uc-expiry-wrap">
              <div class="uc-label">Expires</div>
              <div class="uc-value">${expiry}</div>
            </div>
          </div>
        </div>

        <!-- Brand logo -->
        <div class="uc-brand">
          <i class="${brandIcon}" style="color: rgba(255,255,255,0.5); font-size: 26px;"></i>
        </div>
      </div>
    `;
    return el;
  }

  // ── Skeleton loader ──────────────────────────────────────────────────────
  function renderSkeleton() {
    const el = document.createElement("div");
    el.className = "uc-card-wrap";
    el.innerHTML = `
      <div class="uc-card uc-skeleton" style="background: linear-gradient(135deg, #1e293b, #0f172a);">
        <div class="uc-skel-line" style="width:40%; height:10px; margin-bottom:20px;"></div>
        <div class="uc-skel-line" style="width:80%; height:16px; margin-bottom:24px;"></div>
        <div style="display:flex; justify-content:space-between;">
          <div class="uc-skel-line" style="width:35%; height:10px;"></div>
          <div class="uc-skel-line" style="width:20%; height:10px;"></div>
        </div>
      </div>
    `;
    return el;
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  function renderEmpty(container) {
    container.innerHTML = `
      <div class="uc-empty">
        <i class="fa-regular fa-credit-card" style="font-size:28px; color:#475569; margin-bottom:8px;"></i>
        <p style="color:#64748b; font-size:0.82rem; margin:0;">No cards found</p>
      </div>
    `;
  }

  // ── Inject styles ────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById("uc-styles")) return;
    const style = document.createElement("style");
    style.id = "uc-styles";
    style.textContent = `
      .uc-card-wrap { margin-bottom: 14px; }
      .uc-card-wrap:last-child { margin-bottom: 0; }

      .uc-card {
        position: relative;
        border-radius: 16px;
        padding: 16px;
        min-height: 160px;
        overflow: hidden;
        cursor: pointer;
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .uc-card:hover {
        transform: translateY(-3px) scale(1.01);
        box-shadow: 0 16px 48px rgba(0,0,0,0.45);
      }

      /* Shine sweep on hover */
      .uc-shine {
        position: absolute;
        inset: 0;
        opacity: 0;
        transition: opacity 0.5s ease;
        pointer-events: none;
      }
      .uc-card:hover .uc-shine { opacity: 1; }

      /* Decorative bg circles */
      .uc-circle {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
      }
      .uc-circle-1 {
        width: 120px; height: 120px;
        top: -40px; right: -30px;
      }
      .uc-circle-2 {
        width: 80px; height: 80px;
        bottom: -20px; left: 20px;
      }

      /* Chip */
      .uc-chip {
        position: absolute;
        top: 14px; left: 14px;
        width: 38px; height: 30px;
        background: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(4px);
        transition: transform 0.3s ease;
      }
      .uc-card:hover .uc-chip { transform: scale(1.08); }

      /* Status */
      .uc-status {
        position: absolute;
        top: 14px; right: 14px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.7rem;
        font-weight: 700;
        color: rgba(255,255,255,0.95);
        backdrop-filter: blur(6px);
        letter-spacing: 0.03em;
      }
      .uc-status-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        display: inline-block;
      }

      /* Body */
      .uc-body {
        position: relative;
        z-index: 2;
        padding-top: 52px;
      }
      .uc-type {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255,255,255,0.7);
        margin-bottom: 6px;
      }
      .uc-number {
        font-family: 'Courier New', monospace;
        font-size: 0.95rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: #fff;
        text-shadow: 0 1px 4px rgba(0,0,0,0.3);
        margin-bottom: 18px;
      }
      .uc-footer {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
      }
      .uc-label {
        font-size: 0.6rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: rgba(255,255,255,0.6);
        margin-bottom: 3px;
      }
      .uc-value {
        font-size: 0.82rem;
        font-weight: 700;
        color: #fff;
      }
      .uc-holder-name {
        max-width: 130px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .uc-expiry-wrap { text-align: right; }

      /* Brand logo */
      .uc-brand {
        position: absolute;
        bottom: 12px; right: 14px;
        z-index: 2;
        transition: opacity 0.3s ease;
        opacity: 0.45;
      }
      .uc-card:hover .uc-brand { opacity: 0.7; }

      /* Skeleton */
      .uc-skeleton { pointer-events: none; }
      .uc-skel-line {
        background: rgba(255,255,255,0.08);
        border-radius: 6px;
        animation: ucPulse 1.4s ease-in-out infinite;
      }
      @keyframes ucPulse {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 1; }
      }

      /* Empty */
      .uc-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 28px 0;
      }
    `;
    document.head.appendChild(style);
  }

  // ── Mount a single container ─────────────────────────────────────────────
  async function mountCards(mount, cards) {
    mount.innerHTML = "";

    if (!cards || !cards.length) {
      renderEmpty(mount);
      return;
    }

    // Show max 2
    const visible = cards.slice(0, 2);
    visible.forEach((card) => mount.appendChild(renderCard(card)));
  }

  // ── Main init ────────────────────────────────────────────────────────────
  async function initUserCards() {
    // Grab ALL .userCardsMount elements on the page
    const mounts = document.querySelectorAll(".userCardsMount");
    if (!mounts.length) return;

    injectStyles();

    // Show skeletons in every mount while loading
    mounts.forEach((mount) => {
      mount.innerHTML = "";
      mount.appendChild(renderSkeleton());
      mount.appendChild(renderSkeleton());
    });

    try {
      const res = await fetch("/api/user/cards", { credentials: "include" });
      const { success, cards } = await res.json();
      console.log(
        "Cards from API:",
        cards.map((c) => ({ id: c._id, color_scheme: c.color_scheme })),
      );

      // Populate every mount with the same card data
      mounts.forEach((mount) => {
        mountCards(mount, success ? cards : []);
      });
    } catch (err) {
      console.error("userCards error:", err);
      mounts.forEach((mount) => renderEmpty(mount));
    }
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initUserCards);
  } else {
    initUserCards();
  }
})();
