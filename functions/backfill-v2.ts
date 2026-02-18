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

// Helper: Calculate RSI
function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return [];

  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsiArray = [];
  
  if (avgLoss === 0) {
    rsiArray.push(avgGain > 0 ? 100 : 50);
  } else {
    const rs = avgGain / avgLoss;
    rsiArray.push(100 - (100 / (1 + rs)));
  }

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

// Helper: Fetch with retry
async function fetchWithRetry(url, retries = 2) {
  try {
    const response = await fetch(url);
    
    // Check HTTP status
    if (response.status === 429 && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithRetry(url, retries - 1);
    }
    
    // Check JSON response for rate limit errors
    if (response.ok) {
      const json = await response.json();
      if (json.Response === 'Error' && json.Message && json.Message.includes('rate limit') && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchWithRetry(url, retries - 1);
      }
      // Return response with parsed JSON
      return { ok: true, json: () => Promise.resolve(json), status: response.status };
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

// Helper: Parse CryptoCompare data
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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const days = body.days || 30;
    const timeframe = body.timeframe || '1h';
    const limitSymbols = body.limitSymbols || 50;
    const delayMs = body.delayMs || 300; // Delay between symbols to avoid rate limiting

    // Load watchlist
    const watchlist = await base44.asServiceRole.entities.Watchlist.filter({
      exchange: 'BINANCE',
      isActive: true,
      scanEnabled: true
    });

    const symbolsToScan = watchlist.slice(0, limitSymbols);
    const hoursToFetch = Math.min(days * 24, 2000); // CryptoCompare max limit is 2000

    const results = {
      symbolsProcessed: 0,
      candlesAnalyzed: 0,
      signalsCreated: 0,
      errors: [],
      debug: []
    };

    // Process each symbol
    for (const watchItem of symbolsToScan) {
      try {
        const symbol = watchItem.symbol;
        const fsym = symbol.replace('USDT', '');

        results.debug.push(`Processing ${symbol} (${fsym})`);

        // Fetch historical data
        const data1hRes = await fetchWithRetry(
          `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=USD&limit=${hoursToFetch + 120}`
        );

        if (!data1hRes.ok) {
          results.debug.push(`HTTP error for ${symbol}: ${data1hRes.status}`);
          continue;
        }

        const json1h = await data1hRes.json();
        if (json1h.Response === 'Error') {
          results.debug.push(`CryptoCompare error for ${symbol}: ${json1h.Message || 'Unknown'}`);
          continue;
        }
        
        results.debug.push(`Fetched ${json1h.Data.Data.length} candles for ${symbol}`);

        const data1h = parseCryptoCompare(json1h.Data.Data);

        // Create 4h aggregated data
        const data4h = {
          open: [], high: [], low: [], close: [], volume: [], openTime: [], closeTime: []
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

        // Calculate indicators for entire dataset
        const ema20_1h = calculateEMA(data1h.close, 20);
        const ema50_1h = calculateEMA(data1h.close, 50);
        const ema50_4h = calculateEMA(data4h.close, 50);
        const rsi14 = calculateRSI(data1h.close, 14);

        // Track recent signals per (triggerType, direction) for cooldown
        const recentSignals = new Map();

        // Iterate through closed candles (skip last open candle, start from sufficient lookback)
        for (let i = 120; i < data1h.close.length - 1; i++) {
          results.candlesAnalyzed++;

          const prevEma20 = ema20_1h[i - 1];
          const prevEma50 = ema50_1h[i - 1];
          const currEma20 = ema20_1h[i];
          const currEma50 = ema50_1h[i];
          const currRsi14 = rsi14[i - 120 + 14];

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
          const sliceStart = Math.max(0, i - N);
          const highSlice = data1h.high.slice(sliceStart, i);
          const lowSlice = data1h.low.slice(sliceStart, i);

          const maxHigh = Math.max(...highSlice);
          const minLow = Math.min(...lowSlice);

          const breakUp = data1h.close[i] > maxHigh;
          const breakDown = data1h.close[i] < minLow;

          const recent20Low = Math.min(...data1h.low.slice(i - 20, i - 10));
          const older40Low = Math.min(...data1h.low.slice(i - 40, i - 30));
          const higherLow = recent20Low > older40Low;

          const recent20High = Math.max(...data1h.high.slice(i - 20, i - 10));
          const older40High = Math.max(...data1h.high.slice(i - 40, i - 30));
          const lowerHigh = recent20High < older40High;

          if (breakUp && higherLow) {
            mssDirection = 'long';
          } else if (breakDown && lowerHigh) {
            mssDirection = 'short';
          }

          // Detect PULLBACK_RETEST
          let pullbackDirection = null;
          
          const atrPeriod = 14;
          const atrValues = [];
          for (let j = i - atrPeriod; j < i; j++) {
            const tr = Math.max(
              data1h.high[j] - data1h.low[j],
              Math.abs(data1h.high[j] - data1h.close[j - 1]),
              Math.abs(data1h.low[j] - data1h.close[j - 1])
            );
            atrValues.push(tr);
          }
          const atr = atrValues.reduce((a, b) => a + b, 0) / atrPeriod;
          
          const trendAboveEma50 = data1h.close[i] > currEma50;
          const retestEma20Long = Math.abs(data1h.low[i] - currEma20) <= 0.5 * atr;
          const closeBackAbove = data1h.close[i] > currEma20;
          
          const trendBelowEma50 = data1h.close[i] < currEma50;
          const retestEma20Short = Math.abs(data1h.high[i] - currEma20) <= 0.5 * atr;
          const closeBackBelow = data1h.close[i] < currEma20;
          
          if (trendAboveEma50 && retestEma20Long && closeBackAbove) {
            pullbackDirection = 'long';
          } else if (trendBelowEma50 && retestEma20Short && closeBackBelow) {
            pullbackDirection = 'short';
          }

          // Detect RSI_REVERSAL
          let rsiDirection = null;
          if (currRsi14 < 35) {
            rsiDirection = 'long';
          } else if (currRsi14 > 65) {
            rsiDirection = 'short';
          }

          // Calculate filters
          const lastVol = data1h.volume[i];
          const avgVol = data1h.volume.slice(i - 21, i - 1).reduce((a, b) => a + b, 0) / 20;
          const volumeSpike = lastVol > 1.5 * avgVol;

          const ranges20 = [];
          const ranges120 = [];
          for (let j = i - 20; j <= i; j++) {
            ranges20.push(data1h.high[j] - data1h.low[j]);
          }
          for (let j = i - 120; j <= i; j++) {
            ranges120.push(data1h.high[j] - data1h.low[j]);
          }
          const avgRange20 = ranges20.reduce((a, b) => a + b, 0) / ranges20.length;
          const avgRange120 = ranges120.reduce((a, b) => a + b, 0) / ranges120.length;
          const volatilityHealthy = avgRange20 > avgRange120 * 0.7;

          // HTF alignment
          const i4h = Math.floor(i / 4);
          const close4h = data4h.close[i4h];
          const ema50_4hValue = ema50_4h[i4h];
          
          const htfAlign = (emaFlipDirection === 'long' && close4h > ema50_4hValue) ||
                           (emaFlipDirection === 'short' && close4h < ema50_4hValue) ||
                           (mssDirection === 'long' && close4h > ema50_4hValue) ||
                           (mssDirection === 'short' && close4h < ema50_4hValue) ||
                           (pullbackDirection === 'long' && close4h > ema50_4hValue) ||
                           (pullbackDirection === 'short' && close4h < ema50_4hValue) ||
                           (rsiDirection === 'long' && close4h > ema50_4hValue) ||
                           (rsiDirection === 'short' && close4h < ema50_4hValue);

          // Determine trigger with priority
          let triggerType = null;
          let direction = null;

          if (mssDirection) {
            triggerType = 'MSS';
            direction = mssDirection;
          } else if (emaFlipDirection) {
            triggerType = 'EMA_FLIP';
            direction = emaFlipDirection;
          } else if (pullbackDirection && htfAlign && volatilityHealthy && volumeSpike) {
            triggerType = 'PULLBACK_RETEST';
            direction = pullbackDirection;
          } else if (rsiDirection && htfAlign) {
            triggerType = 'RSI_REVERSAL';
            direction = rsiDirection;
          }

          if (!triggerType) continue;

          // Check cooldown (12h for PULLBACK_RETEST, 6h for others)
          const cooldownHours = triggerType === 'PULLBACK_RETEST' ? 12 : 6;
          const cooldownKey = `${symbol}-${triggerType}-${direction}`;
          const lastSignalTime = recentSignals.get(cooldownKey);
          const currentTime = data1h.closeTime[i];

          if (lastSignalTime && (currentTime - lastSignalTime) < cooldownHours * 60 * 60 * 1000) {
            continue;
          }

          // Calculate score
          const distFromEma50 = Math.abs(data1h.close[i] - currEma50) / currEma50;
          const tooExtended = triggerType === 'PULLBACK_RETEST' 
            ? distFromEma50 > 0.04 
            : distFromEma50 > 0.06;

          let score = 0;
          if (triggerType === 'MSS') score = 60;
          else if (triggerType === 'EMA_FLIP') score = 50;
          else if (triggerType === 'PULLBACK_RETEST') score = 65;
          else if (triggerType === 'RSI_REVERSAL') score = 40;

          if (volumeSpike) score += 10;
          if (htfAlign) score += 10;
          if (volatilityHealthy) score += 5;
          if (tooExtended) score -= 10;

          score = Math.max(0, Math.min(100, score));

          // Create signal with historical timestamp
          await base44.asServiceRole.entities.Signal.create({
            symbol,
            exchange: 'BINANCE',
            timeframe: '1h',
            triggerType,
            direction,
            score,
            price: data1h.close[i],
            volume: lastVol,
            ruleVersion: 'v2',
            payloadJson: {
              closeTime: data1h.closeTime[i],
              candleTimestamp: data1h.closeTime[i],
              ema20: currEma20,
              ema50: currEma50,
              ema50_4h: ema50_4hValue,
              volumeSpike,
              htfAlign,
              volatilityHealthy,
              tooExtended,
              distFromEma50,
              isBackfilled: true
            }
          });

          results.signalsCreated++;
          recentSignals.set(cooldownKey, currentTime);
        }

        results.symbolsProcessed++;

      } catch (error) {
        results.errors.push({
          symbol: watchItem.symbol,
          error: error.message
        });
      }
      
      // Delay between symbols to avoid rate limiting
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return Response.json({
      success: true,
      message: `Backfilled ${results.signalsCreated} v2 signals`,
      results
    });

  } catch (error) {
    return Response.json({
      error: 'Backfill failed',
      details: error.message
    }, { status: 500 });
  }
});