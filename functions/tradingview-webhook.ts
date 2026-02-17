/**
 * TradingView Webhook Handler
 * POST /api/tradingview/webhook
 * 
 * Receives trading signals from TradingView alerts and scores them
 */

export default async function handler(request, context) {
  const { base44, secrets } = context;

  console.log('[TradingView Webhook] Request received');

  // Parse webhook payload - handle string or object
  const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
  
  // Validate webhook secret from multiple sources
  const providedSecret = 
    request.headers['x-signal-secret'] || 
    payload.secret || 
    new URLSearchParams(request.url.split('?')[1] || '').get('secret');
  
  const expectedSecret = secrets.SIGNAL_WEBHOOK_SECRET;

  if (!providedSecret || providedSecret !== expectedSecret) {
    console.log('[TradingView Webhook] Auth failed');
    return {
      statusCode: 401,
      body: JSON.stringify({ 
        accepted: false, 
        error: 'unauthorized' 
      })
    };
  }

  console.log('[TradingView Webhook] Auth passed');

  // Validate required fields
  const requiredFields = ['symbol', 'timeframe', 'triggerType', 'direction'];
  const missing = requiredFields.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        accepted: false,
        error: 'invalid_payload',
        missing
      })
    };
  }

  const {
    symbol,
    exchange,
    timeframe,
    triggerType,
    direction,
    price,
    meta = {}
  } = payload;

  // Calculate base score by trigger type
  const baseScores = {
    'EMA_FLIP': 50,
    'MSS': 60,
    'RSI_DIV': 55
  };
  let score = baseScores[triggerType] || 45;

  // Add bonuses
  if (meta.volumeSpike === true) score += 10;
  if (meta.htfAlign === true) score += 10;
  if (meta.volatilityHealthy === true) score += 5;

  // Subtract penalties
  if (meta.lowLiquidity === true) score -= 20;
  if (meta.highSpread === true) score -= 15;
  if (meta.tooExtended === true) score -= 10;

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  const alertTriggered = score >= 70;

  // Store signal in database
  const signal = await base44.entities.Signal.create({
    symbol,
    exchange: exchange || 'UNKNOWN',
    timeframe,
    triggerType,
    direction,
    score,
    price: price ?? null,
    volume: payload.volume ?? null,
    liquidityScore: payload.liquidityScore ?? null,
    htfBias: payload.htfBias ?? null,
    payloadJson: payload
  });

  console.log('[TradingView Webhook] Signal created:', signal.id);

  return {
    statusCode: 200,
    body: JSON.stringify({
      accepted: true,
      score,
      alertTriggered,
      createdSignalId: signal.id
    })
  };
}

export const config = {
  method: 'POST',
  path: '/api/tradingview/webhook'
};