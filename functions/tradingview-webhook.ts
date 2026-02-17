/**
 * TradingView Webhook Handler
 * POST /api/tradingview/webhook
 * 
 * Receives trading signals from TradingView alerts and scores them
 */

export default async function handler(request, context) {
  const { base44, secrets } = context;

  // Validate webhook secret
  const providedSecret = request.headers['x-signal-secret'];
  const expectedSecret = secrets.SIGNAL_WEBHOOK_SECRET;

  if (!providedSecret || providedSecret !== expectedSecret) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing secret' })
    };
  }

  // Parse webhook payload
  const payload = JSON.parse(request.body);
  const {
    symbol,
    exchange,
    timeframe,
    triggerType,
    direction,
    price,
    volume,
    liquidityScore,
    htfBias,
    meta = {}
  } = payload;

  // Calculate base score by trigger type
  const baseScores = {
    'EMA_FLIP': 50,
    'STRUCTURE_BREAK': 60,
    'RSI_DIVERGENCE': 55
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

  // Determine if alert should be triggered
  const alertTriggered = score >= 70;

  // Store signal in database
  const signal = await base44.entities.Signal.create({
    symbol,
    exchange,
    timeframe,
    triggerType,
    direction,
    score,
    price: price || null,
    volume: volume || null,
    liquidityScore: liquidityScore || null,
    htfBias: htfBias || null,
    payloadJson: payload,
    alertTriggered
  });

  // If high-quality signal, log notification placeholder
  if (alertTriggered) {
    // TODO: Implement Telegram notification
    console.log(`🚨 HIGH QUALITY SIGNAL: ${symbol} ${direction.toUpperCase()} @ ${price} (Score: ${score})`);
  }

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