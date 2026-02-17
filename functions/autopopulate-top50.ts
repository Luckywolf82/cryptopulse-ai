import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch Binance 24hr tickers
    const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    
    if (!binanceResponse.ok) {
      return Response.json({
        error: 'Failed to fetch Binance data',
        details: `HTTP ${binanceResponse.status}`
      }, { status: 500 });
    }

    const tickers = await binanceResponse.json();

    // Stable coins and fiat currencies to exclude
    const excludedBaseAssets = [
      'USDT', 'USDC', 'BUSD', 'TUSD', 'DAI', 'FDUSD', 'USDP',
      'EUR', 'TRY', 'BRL', 'GBP'
    ];

    // Filter to USDT pairs only
    const usdtPairs = tickers.filter(ticker => {
      const symbol = ticker.symbol;
      
      // Must end with USDT
      if (!symbol.endsWith('USDT')) return false;
      
      // Exclude leveraged tokens
      if (symbol.endsWith('UPUSDT') || symbol.endsWith('DOWNUSDT') || 
          symbol.endsWith('BULLUSDT') || symbol.endsWith('BEARUSDT')) {
        return false;
      }
      
      // Exclude stable-to-stable pairs
      const baseAsset = symbol.replace('USDT', '');
      if (excludedBaseAssets.includes(baseAsset)) {
        return false;
      }
      
      return true;
    });

    // Sort by quote volume descending
    usdtPairs.sort((a, b) => {
      const volA = parseFloat(a.quoteVolume) || 0;
      const volB = parseFloat(b.quoteVolume) || 0;
      return volB - volA;
    });

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
        if (!existing.notes || !existing.notes.includes('Auto: Binance Top50 by quoteVolume')) {
          updateData.notes = existing.notes 
            ? `${existing.notes}\nAuto: Binance Top50 by quoteVolume`
            : 'Auto: Binance Top50 by quoteVolume';
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
            notes: 'Auto: Binance Top50 by quoteVolume',
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