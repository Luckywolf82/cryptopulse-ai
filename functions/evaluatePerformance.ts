import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Calculate ATR (Average True Range)
function calculateATR(data, period = 14) {
  const trueRanges = [];
  
  for (let i = 1; i < data.high.length; i++) {
    const tr = Math.max(
      data.high[i] - data.low[i],
      Math.abs(data.high[i] - data.close[i - 1]),
      Math.abs(data.low[i] - data.close[i - 1])
    );
    trueRanges.push(tr);
  }
  
  const atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  return atr;
}

// Parse CryptoCompare OHLCV data
function parseCryptoCompare(data) {
  return {
    openTime: data.map(d => d.time * 1000),
    open: data.map(d => d.open),
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    volume: data.map(d => d.volumeto),
    closeTime: data.map(d => d.time * 1000)
  };
}

// Fetch with retry on 429
async function fetchWithRetry(url, retries = 2) {
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

// Process a single signal
async function processSignal(signal, base44, lookbackMap) {
  const fsym = signal.symbol.replace('USDT', '');
  const lookback = lookbackMap[signal.timeframe] || { cryptocompare: 168, holdingCandles: 24 };
  
  // Determine API endpoint based on timeframe
  let endpoint = '';
  if (signal.timeframe === '15m') {
    endpoint = `https://min-api.cryptocompare.com/data/v2/histominute?fsym=${fsym}&tsym=USD&limit=${lookback.cryptocompare}&aggregate=15`;
  } else if (signal.timeframe === '1h') {
    endpoint = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=USD&limit=${lookback.cryptocompare}`;
  } else if (signal.timeframe === '4h') {
    endpoint = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=USD&limit=${lookback.cryptocompare}`;
  } else if (signal.timeframe === '1d') {
    endpoint = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${fsym}&tsym=USD&limit=${lookback.cryptocompare}`;
  }

  const response = await fetchWithRetry(endpoint);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();

  if (json.Response === 'Error') {
    throw new Error(`API: ${json.Message}`);
  }

  let ohlcData = parseCryptoCompare(json.Data.Data);

  // For 4h, aggregate 1h data
  if (signal.timeframe === '4h') {
    const data4h = {
      open: [],
      high: [],
      low: [],
      close: [],
      volume: [],
      openTime: [],
      closeTime: []
    };
    
    for (let i = 0; i < ohlcData.open.length; i += 4) {
      if (i + 3 < ohlcData.open.length) {
        data4h.open.push(ohlcData.open[i]);
        data4h.high.push(Math.max(...ohlcData.high.slice(i, i + 4)));
        data4h.low.push(Math.min(...ohlcData.low.slice(i, i + 4)));
        data4h.close.push(ohlcData.close[i + 3]);
        data4h.volume.push(ohlcData.volume.slice(i, i + 4).reduce((a, b) => a + b, 0));
        data4h.openTime.push(ohlcData.openTime[i]);
        data4h.closeTime.push(ohlcData.closeTime[i + 3]);
      }
    }
    ohlcData = data4h;
  }

  // Find signal candle (closed candle before signal timestamp)
  const signalTime = new Date(signal.created_date).getTime();
  let signalCandleIndex = -1;

  for (let i = ohlcData.closeTime.length - 1; i >= 0; i--) {
    if (ohlcData.closeTime[i] <= signalTime) {
      signalCandleIndex = i;
      break;
    }
  }

  if (signalCandleIndex < 0 || signalCandleIndex >= ohlcData.close.length - 1) {
    throw new Error('Signal candle not found in data');
  }

  // Calculate ATR from data up to signal candle
  const dataUpToSignal = {
    high: ohlcData.high.slice(0, signalCandleIndex + 1),
    low: ohlcData.low.slice(0, signalCandleIndex + 1),
    close: ohlcData.close.slice(0, signalCandleIndex + 1)
  };

  const atr = calculateATR(dataUpToSignal, 14);

  // Entry is signal price
  const entryPrice = signal.price;

  // Calculate SL and TP based on ATR
  let stopLossPrice, takeProfitPrices;

  if (signal.direction === 'long') {
    stopLossPrice = entryPrice - atr * 1.5;
    takeProfitPrices = [
      entryPrice + atr * 1.5,
      entryPrice + atr * 3,
      entryPrice + atr * 4.5
    ];
  } else {
    stopLossPrice = entryPrice + atr * 1.5;
    takeProfitPrices = [
      entryPrice - atr * 1.5,
      entryPrice - atr * 3,
      entryPrice - atr * 4.5
    ];
  }

  // Simulate holding for specified period
  const holdingCandles = lookback.holdingCandles;
  const exitCandleIndex = Math.min(signalCandleIndex + holdingCandles, ohlcData.close.length - 1);

  let exitPrice = ohlcData.close[exitCandleIndex];
  let exitReason = 'timeout';
  let mfePercent = 0;
  let maePercent = 0;

  // Simulate candle-by-candle
  for (let i = signalCandleIndex + 1; i <= exitCandleIndex; i++) {
    const high = ohlcData.high[i];
    const low = ohlcData.low[i];
    const close = ohlcData.close[i];

    if (signal.direction === 'long') {
      // Check SL
      if (low <= stopLossPrice) {
        exitPrice = stopLossPrice;
        exitReason = 'SL';
        break;
      }

      // Check TPs
      for (let t = 0; t < takeProfitPrices.length; t++) {
        if (high >= takeProfitPrices[t]) {
          exitPrice = takeProfitPrices[t];
          exitReason = `TP${t + 1}`;
          break;
        }
      }

      if (exitReason !== 'timeout') break;

      // Track MFE/MAE
      const maxHigh = Math.max(...ohlcData.high.slice(signalCandleIndex + 1, i + 1));
      const minLow = Math.min(...ohlcData.low.slice(signalCandleIndex + 1, i + 1));
      mfePercent = ((maxHigh - entryPrice) / entryPrice) * 100;
      maePercent = ((entryPrice - minLow) / entryPrice) * 100;
    } else {
      // Short logic (opposite)
      if (high >= stopLossPrice) {
        exitPrice = stopLossPrice;
        exitReason = 'SL';
        break;
      }

      for (let t = 0; t < takeProfitPrices.length; t++) {
        if (low <= takeProfitPrices[t]) {
          exitPrice = takeProfitPrices[t];
          exitReason = `TP${t + 1}`;
          break;
        }
      }

      if (exitReason !== 'timeout') break;

      const minLow = Math.min(...ohlcData.low.slice(signalCandleIndex + 1, i + 1));
      const maxHigh = Math.max(...ohlcData.high.slice(signalCandleIndex + 1, i + 1));
      mfePercent = ((entryPrice - minLow) / entryPrice) * 100;
      maePercent = ((maxHigh - entryPrice) / entryPrice) * 100;
    }
  }

  // Calculate PnL
  let pnlPercent = 0;
  if (signal.direction === 'long') {
    pnlPercent = ((exitPrice - entryPrice) / entryPrice) * 100;
  } else {
    pnlPercent = ((entryPrice - exitPrice) / entryPrice) * 100;
  }

  const riskPercent = ((entryPrice - stopLossPrice) / entryPrice) * Math.abs(100);
  const rMultiple = riskPercent > 0 ? pnlPercent / riskPercent : 0;
  const pnlUsd = pnlPercent / riskPercent;

  const holdingHours = (exitCandleIndex - signalCandleIndex) * 
    (signal.timeframe === '15m' ? 0.25 : signal.timeframe === '1h' ? 1 : signal.timeframe === '4h' ? 4 : 24);

  // Determine status
  let status = 'loss';
  if (pnlPercent > 0.5) status = 'win';
  else if (pnlPercent > -0.5) status = 'breakeven';

  // Check if performance already exists for this signal
  const existing = await base44.entities.SignalPerformance.filter({ signalId: signal.id });
  
  if (existing.length > 0) {
    throw new Error('Performance already evaluated for this signal');
  }

  // Create performance record
  const perfRecord = {
    signalId: signal.id,
    symbol: signal.symbol,
    timeframe: signal.timeframe,
    triggerType: signal.triggerType,
    direction: signal.direction,
    signalScore: signal.score,
    entryPrice,
    exitPrice,
    exitReason,
    stopLossPrice,
    takeProfitPrices,
    pnlPercent: Math.round(pnlPercent * 100) / 100,
    pnlUsd: Math.round(pnlUsd * 100) / 100,
    rMultiple: Math.round(rMultiple * 100) / 100,
    mfePercent: Math.round(mfePercent * 100) / 100,
    maePercent: Math.round(maePercent * 100) / 100,
    holdingCandles: exitCandleIndex - signalCandleIndex,
    holdingHours: Math.round(holdingHours * 100) / 100,
    atrValue: Math.round(atr * 10000) / 10000,
    evaluatedAt: new Date().toISOString(),
    status
  };

  await base44.entities.SignalPerformance.create(perfRecord);
  return { symbol: signal.symbol, status };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 168; // 1 week default
    const holdingPeriodHours = body.holdingPeriodHours || 72;
    const maxConcurrency = body.maxConcurrency || 3;

    // Load recent signals
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const signals = await base44.entities.Signal.filter({ created_date: { $gte: cutoffTime } });

    if (signals.length === 0) {
      return Response.json({ message: 'No signals to evaluate', evaluated: 0, errors: 0, created: [] });
    }

    // De-duplicate: keep only latest signal per symbol/timeframe/triggerType/direction
    const deduped = {};
    for (const sig of signals) {
      const key = `${sig.symbol}|${sig.timeframe}|${sig.triggerType}|${sig.direction}`;
      if (!deduped[key] || new Date(sig.created_date) > new Date(deduped[key].created_date)) {
        deduped[key] = sig;
      }
    }

    const uniqueSignals = Object.values(deduped);

    const results = {
      evaluated: 0,
      errors: 0,
      created: [],
      errorDetails: []
    };

    // Determine lookback periods based on timeframe
    const lookbackMap = {
      '15m': { cryptocompare: 288, holdingCandles: Math.ceil(holdingPeriodHours * 4) },
      '1h': { cryptocompare: 168, holdingCandles: Math.ceil(holdingPeriodHours) },
      '4h': { cryptocompare: 168, holdingCandles: Math.ceil(holdingPeriodHours / 4) },
      '1d': { cryptocompare: 365, holdingCandles: Math.ceil(holdingPeriodHours / 24) }
    };

    // Process with concurrency control
    let processing = 0;
    const queue = [...uniqueSignals];

    while (queue.length > 0 || processing > 0) {
      while (processing < maxConcurrency && queue.length > 0) {
        const signal = queue.shift();
        processing++;

        processSignal(signal, base44, lookbackMap)
          .then(created => {
            results.evaluated++;
            results.created.push(created);
          })
          .catch(error => {
            results.errors++;
            results.errorDetails.push({
              symbol: signal.symbol,
              error: error.message
            });
          })
          .finally(() => {
            processing--;
          });
      }

      if (processing > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return Response.json({
      evaluated: results.evaluated,
      errors: results.errors,
      created: results.created,
      errorDetails: results.errorDetails
    });

  } catch (error) {
    return Response.json({
      error: 'Evaluation failed',
      details: error.message
    }, { status: 500 });
  }
});