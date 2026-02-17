import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Helper: Calculate EMA
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const emaArray = [data[0]];
  
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  
  return emaArray;
}

// Helper: Calculate RSI with Wilder smoothing
function calculateRSI(data, period = 14) {
  if (data.length < period + 1) {
    return [];
  }

  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  // Initial average gain/loss over first period
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsiArray = [];
  
  // First RSI value
  if (avgLoss === 0) {
    rsiArray.push(avgGain > 0 ? 100 : 50);
  } else {
    const rs = avgGain / avgLoss;
    rsiArray.push(100 - (100 / (1 + rs)));
  }

  // Wilder smoothing for subsequent values
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsiArray.push(avgGain > 0 ? 100 : 50);
    } else {
      const rs = avgGain / avgLoss;
      rsiArray.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsiArray;
}

// Helper: Fetch with retry on 429
async function fetchWithRetry(url, retries = 1) {
  try {
    const response = await fetch(url);
    if (response.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, retries - 1);
    }
    return response;
  } catch (error) {
    throw error;
  }
}

// Helper: Process klines data (Binance format)
function parseKlines(klines) {
  return {
    openTime: klines.map(k => k[0]),
    open: klines.map(k => parseFloat(k[1])),
    high: klines.map(k => parseFloat(k[2])),
    low: klines.map(k => parseFloat(k[3])),
    close: klines.map(k => parseFloat(k[4])),
    volume: klines.map(k => parseFloat(k[5])),
    closeTime: klines.map(k => k[6])
  };
}

// Helper: Process CryptoCompare OHLCV data
function parseCryptoCompare(data) {
  return {
    openTime: data.map(d => d.time * 1000),
    open: data.map(d => d.open),
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    volume: data.map(d => d.volumeto),
    closeTime: data.map(d => d.time * 1000 + 3600000)
  };
}

// Helper: Concurrent execution with limit
async function mapWithConcurrency(array, fn, concurrency) {
  const results = [];
  const executing = [];
  
  for (const [index, item] of array.entries()) {
    const promise = Promise.resolve().then(() => fn(item, index));
    results.push(promise);
    
    if (concurrency <= array.length) {
      const executing_promise = promise.then(() => 
        executing.splice(executing.indexOf(executing_promise), 1)
      );
      executing.push(executing_promise);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }
  
  return Promise.all(results);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse input parameters
    const body = await req.json().catch(() => ({}));
    const limitSymbols = body.limitSymbols || 50;
    const timeframeSignal = body.timeframeSignal || '1h';
    const timeframeBias = body.timeframeBias || '4h';
    const lookback = body.lookback || 120;
    const cooldownHours = body.cooldownHours || 6;
    const maxConcurrency = body.maxConcurrency || 6;
    const minScore = body.minScore || 70;

    // Load active watchlist
    const watchlist = await base44.entities.Watchlist.filter({
      exchange: 'BINANCE',
      isActive: true,
      scanEnabled: true
    });

    const symbolsToScan = watchlist.slice(0, limitSymbols);
    
    const results = {
      scannedCount: 0,
      symbolsWithData: 0,
      symbolsMissingData: 0,
      triggersFoundCount: 0,
      signalsCreatedCount: 0,
      skippedCooldown: 0,
      errorsCount: 0,
      topCandidates: [],
      created: [],
      errors: []
    };

    // Process symbols with concurrency limit
    await mapWithConcurrency(symbolsToScan, async (watchItem) => {
      try {
        const symbol = watchItem.symbol;
        results.scannedCount++;

        // Convert symbol format for CryptoCompare (BTCUSDT -> BTC)
        const fsym = symbol.replace('USDT', '');
        
        // Fetch historical data from CryptoCompare
        const data1hRes = await fetchWithRetry(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=USD&limit=${lookback}`);

        if (!data1hRes.ok) {
          throw new Error(`HTTP ${data1hRes.status}`);
        }

        const json1h = await data1hRes.json();

        if (json1h.Response === 'Error') {
          throw new Error(`CryptoCompare: ${json1h.Message || 'Unknown error'}`);
        }

        const data1h = parseCryptoCompare(json1h.Data.Data);
        
        // For 4h, aggregate 1h data (simpler than separate API call)
        const data4h = {
          open: [],
          high: [],
          low: [],
          close: [],
          volume: [],
          openTime: [],
          closeTime: []
        };
        
        for (let i = 0; i < data1h.open.length; i += 4) {
          if (i + 3 < data1h.open.length) {
            data4h.open.push(data1h.open[i]);
            data4h.high.push(Math.max(...data1h.high.slice(i, i + 4)));
            data4h.low.push(Math.min(...data1h.low.slice(i, i + 4)));
            data4h.close.push(data1h.close[i + 3]);
            data4h.volume.push(data1h.volume.slice(i, i + 4).reduce((a, b) => a + b, 0));
            data4h.openTime.push(data1h.openTime[i]);
            data4h.closeTime.push(data1h.closeTime[i + 3]);
          }
        }

        // Use last closed candle
        const lastClosedIndex = data1h.close.length - 2;
        const lastClosedIndex4h = data4h.close.length - 2;

        if (lastClosedIndex < 60) {
          throw new Error('Insufficient data');
        }

        // Calculate EMAs and RSI
         const ema20_1h = calculateEMA(data1h.close, 20);
         const ema50_1h = calculateEMA(data1h.close, 50);
         const ema50_4h = calculateEMA(data4h.close, 50);
         const rsi14 = calculateRSI(data1h.close, 14);

         const prevEma20 = ema20_1h[lastClosedIndex - 1];
         const prevEma50 = ema50_1h[lastClosedIndex - 1];
         const currEma20 = ema20_1h[lastClosedIndex];
         const currEma50 = ema50_1h[lastClosedIndex];
         const currRsi14 = rsi14[rsi14.length - 1];

         // Detect EMA_FLIP
         let emaFlipDirection = null;
         if (prevEma20 <= prevEma50 && currEma20 > currEma50) {
           emaFlipDirection = 'long';
         } else if (prevEma20 >= prevEma50 && currEma20 < currEma50) {
           emaFlipDirection = 'short';
         }

         // Detect MSS
         let mssDirection = null;
         const N = 20;
         const sliceStart = Math.max(0, lastClosedIndex - N);
         const highSlice = data1h.high.slice(sliceStart, lastClosedIndex);
         const lowSlice = data1h.low.slice(sliceStart, lastClosedIndex);

         const maxHigh = Math.max(...highSlice);
         const minLow = Math.min(...lowSlice);

         const breakUp = data1h.close[lastClosedIndex] > maxHigh;
         const breakDown = data1h.close[lastClosedIndex] < minLow;

         const recent20Low = Math.min(...data1h.low.slice(lastClosedIndex - 20, lastClosedIndex - 10));
         const older40Low = Math.min(...data1h.low.slice(lastClosedIndex - 40, lastClosedIndex - 30));
         const higherLow = recent20Low > older40Low;

         const recent20High = Math.max(...data1h.high.slice(lastClosedIndex - 20, lastClosedIndex - 10));
         const older40High = Math.max(...data1h.high.slice(lastClosedIndex - 40, lastClosedIndex - 30));
         const lowerHigh = recent20High < older40High;

         if (breakUp && higherLow) {
           mssDirection = 'long';
         } else if (breakDown && lowerHigh) {
           mssDirection = 'short';
         }

         // Detect PULLBACK_RETEST
         let pullbackDirection = null;
         const closeLong = data1h.close[lastClosedIndex] > currEma50;
         const lowRetestLong = data1h.low[lastClosedIndex] <= currEma50 * 1.005;
         const closeAboveLong = data1h.close[lastClosedIndex] >= currEma50;

         const closeShort = data1h.close[lastClosedIndex] < currEma50;
         const highRetestShort = data1h.high[lastClosedIndex] >= currEma50 * 0.995;
         const closeBelowShort = data1h.close[lastClosedIndex] <= currEma50;

         if (closeLong && lowRetestLong && closeAboveLong) {
           pullbackDirection = 'long';
         } else if (closeShort && highRetestShort && closeBelowShort) {
           pullbackDirection = 'short';
         }

         // Detect RSI_REVERSAL
         let rsiDirection = null;
         if (currRsi14 < 35) {
           rsiDirection = 'long';
         } else if (currRsi14 > 65) {
           rsiDirection = 'short';
         }

         // Calculate HTF alignment
         const close4h = data4h.close[lastClosedIndex4h];
         const ema50_4hValue = ema50_4h[lastClosedIndex4h];
         const htfAlign = (emaFlipDirection === 'long' && close4h > ema50_4hValue) ||
                          (emaFlipDirection === 'short' && close4h < ema50_4hValue) ||
                          (mssDirection === 'long' && close4h > ema50_4hValue) ||
                          (mssDirection === 'short' && close4h < ema50_4hValue) ||
                          (pullbackDirection === 'long' && close4h > ema50_4hValue) ||
                          (pullbackDirection === 'short' && close4h < ema50_4hValue) ||
                          (rsiDirection === 'long' && close4h > ema50_4hValue) ||
                          (rsiDirection === 'short' && close4h < ema50_4hValue);

         // Determine trigger type with priority: MSS > EMA_FLIP > PULLBACK_RETEST > RSI_REVERSAL
         let triggerType = null;
         let direction = null;
         let baseTriggerType = null;

         if (mssDirection) {
           triggerType = 'MSS';
           direction = mssDirection;
           baseTriggerType = 'MSS';
         } else if (emaFlipDirection) {
           triggerType = 'EMA_FLIP';
           direction = emaFlipDirection;
           baseTriggerType = 'EMA_FLIP';
         } else if (pullbackDirection && htfAlign) {
           triggerType = 'PULLBACK_RETEST';
           direction = pullbackDirection;
           baseTriggerType = 'PULLBACK_RETEST';
         } else if (rsiDirection && htfAlign) {
           triggerType = 'RSI_REVERSAL';
           direction = rsiDirection;
           baseTriggerType = 'RSI_REVERSAL';
         }

         // Count triggers found (before cooldown)
         if (triggerType || mssDirection || emaFlipDirection || pullbackDirection || rsiDirection) {
           results.triggersFoundCount++;
         }

         if (!triggerType) {
           return; // No signal
         }

        // Calculate indicators
        const lastVol = data1h.volume[lastClosedIndex];
        const avgVol = data1h.volume.slice(lastClosedIndex - 21, lastClosedIndex - 1)
          .reduce((a, b) => a + b, 0) / 20;
        const volumeSpike = lastVol > 1.5 * avgVol;

        const ranges20 = [];
        const ranges120 = [];
        for (let i = lastClosedIndex - 20; i <= lastClosedIndex; i++) {
          ranges20.push(data1h.high[i] - data1h.low[i]);
        }
        for (let i = lastClosedIndex - 120; i <= lastClosedIndex; i++) {
          ranges120.push(data1h.high[i] - data1h.low[i]);
        }
        const avgRange20 = ranges20.reduce((a, b) => a + b, 0) / ranges20.length;
        const avgRange120 = ranges120.reduce((a, b) => a + b, 0) / ranges120.length;
        const volatilityHealthy = avgRange20 > avgRange120 * 0.7;

        const distFromEma50 = Math.abs(data1h.close[lastClosedIndex] - currEma50) / currEma50;
        const tooExtended = distFromEma50 > 0.06;

        // Check symbol quality
        const isLowQuality = watchItem.min24hVolumeUsd && watchItem.min24hVolumeUsd < 5000000;

        // Calculate score based on trigger type
        let score = 0;
        if (triggerType === 'MSS') score = 60;
        else if (triggerType === 'EMA_FLIP') score = 50;
        else if (triggerType === 'PULLBACK_RETEST') score = 45;
        else if (triggerType === 'RSI_REVERSAL') score = 40;
        else score = 35;

        // Add bonuses
        if (volumeSpike) score += 10;
        if (htfAlign) score += 10;
        if (volatilityHealthy) score += 5;

        // Apply penalties
        if (tooExtended) score -= 10;
        if (isLowQuality) score -= 10;

        score = Math.max(0, Math.min(100, score));

        // Check cooldown
        const cooldownTime = new Date(Date.now() - cooldownHours * 60 * 60 * 1000).toISOString();
        const recentSignals = await base44.entities.Signal.filter({
          symbol,
          exchange: 'BINANCE',
          timeframe: timeframeSignal,
          triggerType,
          direction
        });

        const hasCooldown = recentSignals.some(s => 
          new Date(s.created_date) > new Date(cooldownTime)
        );

        if (hasCooldown) {
          results.skippedCooldown++;
          return;
        }

        // Create signal
        const signalData = {
          symbol,
          exchange: 'BINANCE',
          timeframe: timeframeSignal,
          triggerType,
          direction,
          score,
          price: data1h.close[lastClosedIndex],
          volume: lastVol,
          payloadJson: {
            closeTime: data1h.closeTime[lastClosedIndex],
            ema20: currEma20,
            ema50: currEma50,
            ema50_4h: ema50_4hValue,
            volumeSpike,
            htfAlign,
            volatilityHealthy,
            tooExtended,
            distFromEma50
          }
        };

        await base44.entities.Signal.create(signalData);
         results.signalsCreatedCount++;

         // Track top candidates (sorted by score)
         results.topCandidates.push({
           symbol,
           triggerType,
           direction,
           score,
           volumeSpike,
           htfAlign,
           volatilityHealthy,
           tooExtended,
           isLowQuality
         });

         results.topCandidates.sort((a, b) => b.score - a.score);
         if (results.topCandidates.length > 10) {
           results.topCandidates = results.topCandidates.slice(0, 10);
         }

         results.created.push({
           symbol,
           triggerType,
           direction,
           score
         });

        // Update lastScannedAt
        await base44.entities.Watchlist.update(watchItem.id, {
          lastScannedAt: new Date().toISOString()
        });

      } catch (error) {
        results.errorsCount++;
        results.errors.push({
          symbol: watchItem.symbol,
          error: error.message
        });
      }
    }, maxConcurrency);

    return Response.json(results);

  } catch (error) {
    return Response.json({
      error: 'Scanner failed',
      details: error.message
    }, { status: 500 });
  }
});