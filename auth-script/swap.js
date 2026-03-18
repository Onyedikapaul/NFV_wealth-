// swap.js

let btcRate = 87468; // fallback
const THIRTY_MINUTES = 30 * 60 * 1000;

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function loadSwapData() {
  try {
    const res = await fetch("/api/swap/data", { credentials: "include" });
    const data = await res.json();
    if (!data.success) return;

    btcRate = data.btcRate || btcRate;

    applyToUI(data.balance, data.crypto_balance, btcRate);

    // save to cache
    localStorage.setItem(
      "swapDataCache",
      JSON.stringify({
        balance: data.balance,
        crypto_balance: data.crypto_balance,
        btcRate: data.btcRate,
        cachedAt: Date.now(),
      }),
    );
  } catch (err) {
    console.error("[swap] Failed to load swap data:", err);
  }
}

function loadFromCacheOrFetch() {
  try {
    const cached = localStorage.getItem("swapDataCache");
    if (cached) {
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.cachedAt;

      if (age < THIRTY_MINUTES) {
        // cache is fresh — use it
        btcRate = parsed.btcRate || btcRate;
        applyToUI(parsed.balance, parsed.crypto_balance, btcRate);
        return;
      }
    }
  } catch (e) {
    localStorage.removeItem("swapDataCache");
  }

  // cache missing or stale — fetch fresh
  loadSwapData();
}

function applyToUI(balance, cryptoBalance, rate) {
  const usdBalance = balance.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const btcBalance = cryptoBalance.toLocaleString("en-US", {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });

  $("#usd-balance-display").text("$" + usdBalance);
  $("#btc-balance-display").text(btcBalance + " BTC");
  $("#btc-rate-display").text(
    "1 BTC = $" +
      rate.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) +
      " USD",
  );

  $("#from_currency").html(`
    <option value="fiat">USD ($${usdBalance})</option>
    <option value="btc">BTC (${btcBalance})</option>
  `);

  updateCurrencyLabel();
  updateToCurrency();
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function updateCurrencyLabel() {
  const fromCurrency = $("#from_currency").val();
  $(".currency-label").text(fromCurrency === "fiat" ? "USD" : "BTC");
}

function updateToCurrency() {
  const fromCurrency = $("#from_currency").val();
  if (fromCurrency === "fiat") {
    $("#to_currency").html('<option value="btc">BTC</option>');
  } else {
    $("#to_currency").html('<option value="fiat">USD</option>');
  }
}

function calculateConversion() {
  const fromCurrency = $("#from_currency").val();
  const amount = parseFloat($("#amount").val()) || 0;

  if (amount <= 0) {
    $("#conversionResult").html(
      '<div class="text-center text-gray-500 dark:text-gray-400 text-xs">Enter an amount to see conversion</div>',
    );
    return;
  }

  let html = "";
  if (fromCurrency === "fiat") {
    const btcAmount = amount / btcRate;
    html = buildConversionHTML(
      amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " USD",
      btcAmount.toLocaleString("en-US", {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8,
      }) + " BTC",
    );
  } else {
    const fiatAmount = amount * btcRate;
    html = buildConversionHTML(
      amount.toLocaleString("en-US", {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8,
      }) + " BTC",
      "$" +
        fiatAmount.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        " USD",
    );
  }
  $("#conversionResult").html(html);
}

function buildConversionHTML(from, to) {
  return `
    <div class="flex items-center justify-between">
      <div class="flex flex-col">
        <span class="text-xs text-gray-500 dark:text-gray-400">From:</span>
        <span class="font-medium text-gray-900 dark:text-white">${from}</span>
      </div>
      <div class="flex items-center justify-center mx-2">
        <i class="fa-solid fa-arrow-right text-gray-400 text-sm"></i>
      </div>
      <div class="flex flex-col items-end">
        <span class="text-xs text-gray-500 dark:text-gray-400">To:</span>
        <span class="font-medium text-gray-900 dark:text-white">${to}</span>
      </div>
    </div>`;
}

// ─── Form Submit ──────────────────────────────────────────────────────────────

async function submitSwap(e) {
  e.preventDefault();
  const btn = $("#swapForm").find('button[type="submit"]');
  btn
    .prop("disabled", true)
    .html('<i class="fa-solid fa-spinner fa-spin mr-2"></i> Processing...');

  try {
    const res = await fetch("/api/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        from_currency: $("#from_currency").val(),
        to_currency: $("#to_currency").val(),
        amount: $("#amount").val(),
      }),
    });
    const data = await res.json();

    if (data.success) {
      $("#conversionResult").html(`
        <div class="text-center text-green-600 dark:text-green-400 font-semibold text-sm">
          ✅ ${data.message}
        </div>`);
      $("#amount").val("");
      // bust cache and reload fresh balances
      localStorage.removeItem("swapDataCache");
      await loadSwapData();
    } else {
      $("#conversionResult").html(`
        <div class="text-center text-red-500 dark:text-red-400 font-semibold text-sm">
          ❌ ${data.message}
        </div>`);
    }
  } catch (err) {
    $("#conversionResult").html(
      '<div class="text-center text-red-500 text-sm">Network error. Try again.</div>',
    );
  }

  btn
    .prop("disabled", false)
    .html(
      '<i class="fa-solid fa-arrows-rotate text-xs mr-2"></i><span>Swap Currencies</span>',
    );
}

// ─── Init ─────────────────────────────────────────────────────────────────────

$(document).ready(function () {
  // load data — from cache if fresh, else fetch
  loadFromCacheOrFetch();

  // auto-refresh every 30 mins while tab is open
  setInterval(loadSwapData, THIRTY_MINUTES);

  // events
  $("#swapForm").on("submit", submitSwap);
  $("#from_currency").on("change", function () {
    updateCurrencyLabel();
    updateToCurrency();
    calculateConversion();
  });
  $("#amount").on("input", calculateConversion);
});
