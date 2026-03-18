let cache = {
  bitcoin: {
    price: null,
    cachedAt: null,
  },
};

const THIRTY_MINUTES = 30 * 60 * 1000;

export async function getCachedPrice(coin = "bitcoin") {
  const now = Date.now();
  const entry = cache[coin];

  // return cached price if still fresh
  if (
    entry?.price &&
    entry?.cachedAt &&
    now - entry.cachedAt < THIRTY_MINUTES
  ) {
    return entry.price;
  }

  // fetch fresh from CoinGecko
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`,
    );
    const data = await res.json();
    const price = data?.[coin]?.usd;

    if (!price) throw new Error("No price returned");

    // update cache
    cache[coin] = { price, cachedAt: now };
    console.log(`[priceCache] ${coin} price updated: $${price}`);
    return price;
  } catch (err) {
    console.error(`[priceCache] Failed to fetch ${coin} price:`, err.message);

    // if fetch fails but we have a stale price, return it as fallback
    if (entry?.price) {
      console.warn(
        `[priceCache] Using stale price for ${coin}: $${entry.price}`,
      );
      return entry.price;
    }

    // absolute fallback
    return 87468;
  }
}

export function clearPriceCache(coin = "bitcoin") {
  if (cache[coin]) {
    cache[coin] = { price: null, cachedAt: null };
    console.log(`[priceCache] Cache cleared for ${coin}`);
  }
}
