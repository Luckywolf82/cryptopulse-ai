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
  let payload;
  try {
    payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;
    console.log('[TradingView Webhook] Payload parsed successfully');
  } catch (error) {
    console.log('[TradingView Webhook] Invalid JSON payload');
    return {
      statusCode: 400,
      body: JSON.stringify({
        accepted: false,
        error: 'invalid_json'
      })
    };
  }
  
  // Validate webhook secret from multiple sources (case-insensitive header)
  const headerSecret = Object.keys(request.headers).find(k => k.toLowerCase() === 'x-signal-secret');
  const providedSecret = 
    (headerSecret ? request.headers[headerSecret] : null) ||
    payload.secret || 
    new URLSearchParams(request.url.split('?')[1] || '').get('secret');
  
  const expectedSecret = secrets.SIGNAL_WEBHOOK_SECRET;

  if (!providedSecret || providedSecret !== expectedSecret) {
    console.log('[TradingView Webhook] Auth failed - secret mismatch or missing');
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
  try {
    const signal = await base44.entities.Signal.create({
      symbol,
      exchange: exchange || 'UNKNOWN',
      timeframe,
      triggerType,
      direction,
      score,
      price: price ?? null
    });

    console.log('[TradingView Webhook] Signal created successfully:', signal.id);

    return {
      statusCode: 200,
      body: JSON.stringify({
        accepted: true,
        score,
        alertTriggered,
        createdSignalId: signal.id
      })
    };
  } catch (error) {
    console.log('[TradingView Webhook] DB create failed:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        accepted: false,
        error: 'db_create_failed',
        message: error.message
      })
    };
  }
}

export const config = {
  method: 'POST',
  path: '/api/tradingview/webhook'
};