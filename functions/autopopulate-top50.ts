import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch top cryptos from CoinGecko (no geo-blocking)
    const coingeckoResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=100&sparkline=false'
    );
    
    if (!coingeckoResponse.ok) {
      return Response.json({
        error: 'Failed to fetch CoinGecko data',
        details: `HTTP ${coingeckoResponse.status}`
      }, { status: 500 });
    }

    const coins = await coingeckoResponse.json();

    // Stable coins and uncommon tokens to exclude
    const excludedSymbols = ['usdt', 'usdc', 'busd', 'tusd', 'dai', 'fdusd', 'usdp', 'usd1', 'pyusd', 'zama', 'rlust', 'stable', 'usde'];
    
    // Only include well-known cryptos that CryptoCompare supports
    const knownSymbols = ['btc', 'eth', 'bnb', 'sol', 'xrp', 'ada', 'doge', 'avax', 'dot', 'matic', 'ltc', 'trx', 'link', 'atom', 'xlm', 'etc', 'bch', 'near', 'algo', 'vet', 'icp', 'apt', 'arb', 'op', 'fil', 'ldo', 'grt', 'aave', 'uni', 'mkr', 'snx', 'crv', 'hbar', 'qnt', 'imx', 'axs', 'sand', 'mana', 'enj', 'gala'];

    // Convert to Binance USDT pair format and filter
    const usdtPairs = coins
      .filter(coin => 
        !excludedSymbols.includes(coin.symbol.toLowerCase()) &&
        knownSymbols.includes(coin.symbol.toLowerCase())
      )
      .map(coin => ({
        symbol: `${coin.symbol.toUpperCase()}USDT`,
        quoteVolume: coin.total_volume || 0
      }));

    // Select top 50
    const top50 = usdtPairs.slice(0, 50);
    const top50Symbols = top50.map(t => t.symbol);

    // Get existing watchlist records
    const existingWatchlist = await base44.entities.Watchlist.filter({
      exchange: 'BINANCE'
    });

    const now = new Date().toISOString();
    const upsertPromises = [];

    // Upsert top 50
    for (const ticker of top50) {
      const symbol = ticker.symbol;
      const quoteVolume = parseFloat(ticker.quoteVolume) || 0;
      
      const existing = existingWatchlist.find(w => 
        w.symbol === symbol && w.exchange === 'BINANCE'
      );

      if (existing) {
        // Update existing record
        const updateData = {
          isActive: true,
          min24hVolumeUsd: quoteVolume,
          lastAutoUpdatedAt: now
        };

        // Set source if not already set
        if (!existing.source) {
          updateData.source = 'auto_top50';
        }

        // Append notes if not already present
        if (!existing.notes || !existing.notes.includes('Auto: Top50 by volume')) {
          updateData.notes = existing.notes 
            ? `${existing.notes}\nAuto: Top50 by volume`
            : 'Auto: Top50 by volume';
        }

        upsertPromises.push(
          base44.entities.Watchlist.update(existing.id, updateData)
        );
      } else {
        // Create new record
        upsertPromises.push(
          base44.entities.Watchlist.create({
            symbol,
            exchange: 'BINANCE',
            isActive: true,
            scanEnabled: true,
            scanIntervalMinutes: 15,
            source: 'auto_top50',
            notes: 'Auto: Top50 by volume (CoinGecko)',
            min24hVolumeUsd: quoteVolume,
            lastAutoUpdatedAt: now
          })
        );
      }
    }

    // Execute all upserts
    await Promise.all(upsertPromises);

    // Deactivate old auto_top50 records not in current top 50
    const toDeactivate = existingWatchlist.filter(w => 
      w.source === 'auto_top50' && 
      !top50Symbols.includes(w.symbol) &&
      w.isActive
    );

    const deactivatePromises = toDeactivate.map(w =>
      base44.entities.Watchlist.update(w.id, { isActive: false })
    );

    await Promise.all(deactivatePromises);

    return Response.json({
      count: 50,
      symbols: top50Symbols,
      deactivated: toDeactivate.length
    });

  } catch (error) {
    return Response.json({
      error: 'Failed to auto-populate watchlist',
      details: error.message
    }, { status: 500 });
  }
});