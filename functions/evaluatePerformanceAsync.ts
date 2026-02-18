import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

function parseCryptoCompare(data) {
  return {
    closeTime: data.map(d => d.time * 1000),
    open: data.map(d => d.open),
    high: data.map(d => d.high),
    low: data.map(d => d.low),
    close: data.map(d => d.close),
    volume: data.map(d => d.volumeto)
  };
}

async function fetchWithRetry(url, retries = 2) {
  const response = await fetch(url);
  if (response.status === 429 && retries > 0) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return fetchWithRetry(url, retries - 1);
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const hoursBack = body.hoursBack || 168;
    const ruleVersion = body.ruleVersion || 'v2';

    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    const allSignals = await base44.entities.Signal.list("-created_date", 5000);
    const recentSignals = allSignals.filter(s => 
      new Date(s.created_date) >= new Date(cutoffTime) &&
      s.ruleVersion === ruleVersion
    );

    if (recentSignals.length === 0) {
      return Response.json({ started: 0 });
    }

    // Get signals that haven't been evaluated yet
    const evaluatedSignalIds = (await base44.entities.SignalPerformance.list("-created_date", 5000)).map(p => p.signalId);
    const unevaluatedSignals = recentSignals.filter(s => !evaluatedSignalIds.includes(s.id));
    
    const signals = unevaluatedSignals.slice(0, 50);
    
    // Process all signals without waiting
    const promises = signals.map(signal => 
      (async () => {
        try {
          const fsym = signal.symbol.replace('USDT', '');
          const endpoint = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fsym}&tsym=USD&limit=200`;
          
          const response = await fetchWithRetry(endpoint);
          const json = await response.json();
          if (json.Response === 'Error') throw new Error(json.Message);

          const ohlcData = parseCryptoCompare(json.Data.Data);
          const signalTime = new Date(signal.created_date).getTime();
          
          let idx = -1;
          for (let i = ohlcData.closeTime.length - 1; i >= 0; i--) {
            if (ohlcData.closeTime[i] <= signalTime) {
              idx = i;
              break;
            }
          }

          if (idx < 0 || idx >= ohlcData.close.length - 1) throw new Error('Candle not found');

          const dataSlice = {
            high: ohlcData.high.slice(0, idx + 1),
            low: ohlcData.low.slice(0, idx + 1),
            close: ohlcData.close.slice(0, idx + 1)
          };

          const atr = calculateATR(dataSlice, 14);
          const entryPrice = signal.price;
          const holdingCandles = 72;
          const exitIdx = Math.min(idx + holdingCandles, ohlcData.close.length - 1);

          let stopLossPrice, takeProfitPrices;
          if (signal.direction === 'long') {
            stopLossPrice = entryPrice - atr * 1.5;
            takeProfitPrices = [entryPrice + atr * 1.5, entryPrice + atr * 3, entryPrice + atr * 4.5];
          } else {
            stopLossPrice = entryPrice + atr * 1.5;
            takeProfitPrices = [entryPrice - atr * 1.5, entryPrice - atr * 3, entryPrice - atr * 4.5];
          }

          let exitPrice = ohlcData.close[exitIdx];
          let exitReason = 'timeout';

          for (let i = idx + 1; i <= exitIdx; i++) {
            if (signal.direction === 'long') {
              if (ohlcData.low[i] <= stopLossPrice) {
                exitPrice = stopLossPrice;
                exitReason = 'SL';
                break;
              }
              for (let t = 0; t < takeProfitPrices.length; t++) {
                if (ohlcData.high[i] >= takeProfitPrices[t]) {
                  exitPrice = takeProfitPrices[t];
                  exitReason = `TP${t + 1}`;
                  break;
                }
              }
              if (exitReason !== 'timeout') break;
            } else {
              if (ohlcData.high[i] >= stopLossPrice) {
                exitPrice = stopLossPrice;
                exitReason = 'SL';
                break;
              }
              for (let t = 0; t < takeProfitPrices.length; t++) {
                if (ohlcData.low[i] <= takeProfitPrices[t]) {
                  exitPrice = takeProfitPrices[t];
                  exitReason = `TP${t + 1}`;
                  break;
                }
              }
              if (exitReason !== 'timeout') break;
            }
          }

          let pnlPercent = signal.direction === 'long' 
            ? ((exitPrice - entryPrice) / entryPrice) * 100
            : ((entryPrice - exitPrice) / entryPrice) * 100;

          const riskPercent = Math.abs((entryPrice - stopLossPrice) / entryPrice) * 100;
          const rMultiple = riskPercent > 0 ? pnlPercent / riskPercent : 0;

          let status = 'loss';
          if (pnlPercent > 0.5) status = 'win';
          else if (pnlPercent > -0.5) status = 'breakeven';

          const existing = await base44.entities.SignalPerformance.filter({ signalId: signal.id });
          if (existing.length > 0) return;

          await base44.entities.SignalPerformance.create({
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
            pnlUsd: Math.round((pnlPercent / riskPercent) * 100) / 100,
            rMultiple: Math.round(rMultiple * 100) / 100,
            mfePercent: 0,
            maePercent: 0,
            holdingCandles: exitIdx - idx,
            holdingHours: (exitIdx - idx),
            atrValue: Math.round(atr * 10000) / 10000,
            evaluatedAt: new Date().toISOString(),
            status
          });
        } catch (e) {
          // Silently fail
        }
      })()
    );

    // Don't wait for all to complete, just return immediately
    Promise.all(promises).catch(() => {});

    return Response.json({ started: signals.length });

  } catch (error) {
    return Response.json({ error: error.message, started: 0 }, { status: 500 });
  }
});