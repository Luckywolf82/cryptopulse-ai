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

// Helper: Parse CryptoCompare OHLCV data
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

// Fetch all historical data for a symbol (up to 1 year ago)
async function fetchHistoricalData(fsym, limit = 2000) {
  const response = await fetchWithRetry(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=USD&limit=${limit}`);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.Response === 'Error') {
    throw new Error(`CryptoCompare: ${json.Message || 'Unknown error'}`);
  }

  return parseCryptoCompare(json.Data.Data);
}

// Aggregate 1h data to 4h
function aggregateTo4h(data1h) {
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
  
  return data4h;
}

// Scan for signals in historical data
async function scanHistoricalData(symbol, data1h, data4h, base44, timeframeSignal = '1h') {
  const signals = [];
  
  const ema20_1h = calculateEMA(data1h.close, 20);
  const ema50_1h = calculateEMA(data1h.close, 50);
  const ema50_4h = calculateEMA(data4h.close, 50);
  const rsi14 = calculateRSI(data1h.close, 14);

  // Scan through historical candles
  for (let idx = 60; idx < data1h.close.length - 2; idx++) {
    const prevEma20 = ema20_1h[idx - 1];
    const prevEma50 = ema50_1h[idx - 1];
    const currEma20 = ema20_1h[idx];
    const currEma50 = ema50_1h[idx];
    const currRsi14 = rsi14[idx];

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
    const sliceStart = Math.max(0, idx - N);
    const highSlice = data1h.high.slice(sliceStart, idx);
    const lowSlice = data1h.low.slice(sliceStart, idx);

    const maxHigh = Math.max(...highSlice);
    const minLow = Math.min(...lowSlice);

    const breakUp = data1h.close[idx] > maxHigh;
    const breakDown = data1h.close[idx] < minLow;

    const recent20Low = Math.min(...data1h.low.slice(Math.max(0, idx - 20), Math.max(0, idx - 10)));
    const older40Low = Math.min(...data1h.low.slice(Math.max(0, idx - 40), Math.max(0, idx - 30)));
    const higherLow = recent20Low > older40Low;

    const recent20High = Math.max(...data1h.high.slice(Math.max(0, idx - 20), Math.max(0, idx - 10)));
    const older40High = Math.max(...data1h.high.slice(Math.max(0, idx - 40), Math.max(0, idx - 30)));
    const lowerHigh = recent20High < older40High;

    if (breakUp && higherLow) {
      mssDirection = 'long';
    } else if (breakDown && lowerHigh) {
      mssDirection = 'short';
    }

    // Detect PULLBACK_RETEST
    let pullbackDirection = null;
    const closeLong = data1h.close[idx] > currEma50;
    const lowRetestLong = data1h.low[idx] <= currEma50 * 1.005;
    const closeAboveLong = data1h.close[idx] >= currEma50;

    const closeShort = data1h.close[idx] < currEma50;
    const highRetestShort = data1h.high[idx] >= currEma50 * 0.995;
    const closeBelowShort = data1h.close[idx] <= currEma50;

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
    const idx4h = Math.floor(idx / 4);
    const close4h = data4h.close[idx4h];
    const ema50_4hValue = ema50_4h[idx4h];
    const htfAlign = (emaFlipDirection === 'long' && close4h > ema50_4hValue) ||
                     (emaFlipDirection === 'short' && close4h < ema50_4hValue) ||
                     (mssDirection === 'long' && close4h > ema50_4hValue) ||
                     (mssDirection === 'short' && close4h < ema50_4hValue) ||
                     (pullbackDirection === 'long' && close4h > ema50_4hValue) ||
                     (pullbackDirection === 'short' && close4h < ema50_4hValue) ||
                     (rsiDirection === 'long' && close4h > ema50_4hValue) ||
                     (rsiDirection === 'short' && close4h < ema50_4hValue);

    // Determine trigger type
    let triggerType = null;
    let direction = null;

    if (mssDirection) {
      triggerType = 'MSS';
      direction = mssDirection;
    } else if (emaFlipDirection) {
      triggerType = 'EMA_FLIP';
      direction = emaFlipDirection;
    } else if (pullbackDirection && htfAlign) {
      triggerType = 'PULLBACK_RETEST';
      direction = pullbackDirection;
    } else if (rsiDirection && htfAlign) {
      triggerType = 'RSI_REVERSAL';
      direction = rsiDirection;
    }

    if (!triggerType) continue;

    // Calculate score
    let score = 0;
    if (triggerType === 'MSS') score = 60;
    else if (triggerType === 'EMA_FLIP') score = 50;
    else if (triggerType === 'PULLBACK_RETEST') score = 45;
    else if (triggerType === 'RSI_REVERSAL') score = 40;
    else score = 35;

    // Add bonuses
    const lastVol = data1h.volume[idx];
    const avgVol = data1h.volume.slice(Math.max(0, idx - 21), idx)
      .reduce((a, b) => a + b, 0) / 20;
    const volumeSpike = lastVol > 1.5 * avgVol;
    if (volumeSpike) score += 10;
    if (htfAlign) score += 10;

    const ranges20 = [];
    for (let i = Math.max(0, idx - 20); i <= idx; i++) {
      ranges20.push(data1h.high[i] - data1h.low[i]);
    }
    const avgRange20 = ranges20.reduce((a, b) => a + b, 0) / ranges20.length;
    const ranges120 = [];
    for (let i = Math.max(0, idx - 120); i <= idx; i++) {
      ranges120.push(data1h.high[i] - data1h.low[i]);
    }
    const avgRange120 = ranges120.reduce((a, b) => a + b, 0) / ranges120.length;
    const volatilityHealthy = avgRange20 > avgRange120 * 0.7;
    if (volatilityHealthy) score += 5;

    const distFromEma50 = Math.abs(data1h.close[idx] - currEma50) / currEma50;
    const tooExtended = distFromEma50 > 0.06;
    if (tooExtended) score -= 10;

    score = Math.max(0, Math.min(100, score));

    signals.push({
      timestamp: new Date(data1h.closeTime[idx]),
      symbol,
      triggerType,
      direction,
      score,
      price: data1h.close[idx],
      volume: lastVol,
      payloadJson: {
        closeTime: data1h.closeTime[idx],
        ema20: currEma20,
        ema50: currEma50,
        ema50_4h: ema50_4hValue,
        volumeSpike,
        htfAlign,
        volatilityHealthy,
        tooExtended,
        distFromEma50
      }
    });
  }

  return signals;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const symbols = body.symbols || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT'];
    const daysBack = body.daysBack || 365;
    const minScore = body.minScore || 50;

    const results = {
      scannedSymbols: 0,
      signalsCreatedCount: 0,
      signalsByType: {},
      errors: [],
      created: []
    };

    for (const symbol of symbols) {
      try {
        const fsym = symbol.replace('USDT', '');
        console.log(`Backfilling ${symbol}...`);

        const data1h = await fetchHistoricalData(fsym, 2000);
        
        if (data1h.close.length < 60) {
          throw new Error('Insufficient historical data');
        }

        const data4h = aggregateTo4h(data1h);
        const signals = await scanHistoricalData(symbol, data1h, data4h, base44);

        results.scannedSymbols++;

        // Filter and create signals
        for (const signal of signals) {
          if (signal.score < minScore) continue;

          // Check if signal already exists
          const existing = await base44.entities.Signal.filter({
            symbol,
            exchange: 'BINANCE',
            timeframe: '1h',
            triggerType: signal.triggerType,
            direction: signal.direction
          });

          const isDuplicate = existing.some(s => 
            Math.abs(new Date(s.created_date) - signal.timestamp) < 3600000 // 1 hour tolerance
          );

          if (!isDuplicate) {
            await base44.entities.Signal.create({
              symbol,
              exchange: 'BINANCE',
              timeframe: '1h',
              triggerType: signal.triggerType,
              direction: signal.direction,
              score: signal.score,
              price: signal.price,
              volume: signal.volume,
              payloadJson: signal.payloadJson
            });

            results.signalsCreatedCount++;
            results.signalsByType[signal.triggerType] = (results.signalsByType[signal.triggerType] || 0) + 1;
            results.created.push({
              symbol,
              triggerType: signal.triggerType,
              direction: signal.direction,
              score: signal.score,
              timestamp: signal.timestamp.toISOString()
            });
          }
        }

      } catch (error) {
        results.errors.push({
          symbol,
          error: error.message
        });
      }
    }

    return Response.json(results);

  } catch (error) {
    return Response.json({
      error: 'Backfill failed',
      details: error.message
    }, { status: 500 });
  }
});