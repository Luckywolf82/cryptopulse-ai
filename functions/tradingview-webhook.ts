import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  console.log('[TradingView Webhook] Request received');

  // Parse webhook payload - handle string or object
  let payload;
  try {
    const body = await req.text();
    payload = body ? JSON.parse(body) : {};
    console.log('[TradingView Webhook] Payload parsed successfully');
  } catch (error) {
    console.log('[TradingView Webhook] Invalid JSON payload');
    return Response.json({
      accepted: false,
      error: 'invalid_json'
    }, { status: 400 });
  }
  
  // Auth: Accept either webhook secret OR authenticated user (for testing)
  const headerSecret = Object.keys(req.headers).find(k => k.toLowerCase() === 'x-signal-secret');
  const providedSecret = 
    (headerSecret ? req.headers.get(headerSecret) : null) ||
    payload.secret || 
    new URL(req.url).searchParams.get('secret');
  
  const expectedSecret = Deno.env.get('SIGNAL_WEBHOOK_SECRET');
  const isAuthenticatedUser = await base44.auth.isAuthenticated();

  if (!isAuthenticatedUser && (!providedSecret || providedSecret !== expectedSecret)) {
    console.log('[TradingView Webhook] Auth failed - no valid secret or user session');
    return Response.json({ 
      accepted: false, 
      error: 'unauthorized' 
    }, { status: 401 });
  }

  console.log('[TradingView Webhook] Auth passed');

  // Validate required fields
  const requiredFields = ['symbol', 'timeframe', 'triggerType', 'direction'];
  const missing = requiredFields.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    return Response.json({
      accepted: false,
      error: 'invalid_payload',
      missing
    }, { status: 400 });
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
    const signal = await base44.asServiceRole.entities.Signal.create({
      symbol,
      exchange: exchange || 'UNKNOWN',
      timeframe,
      triggerType,
      direction,
      score,
      price: price ?? null
    });

    console.log('[TradingView Webhook] Signal created successfully:', signal.id);

    return Response.json({
      accepted: true,
      score,
      alertTriggered,
      createdSignalId: signal.id
    }, { status: 200 });
  } catch (error) {
    console.log('[TradingView Webhook] DB create failed:', error.message);
    return Response.json({
      accepted: false,
      error: 'db_create_failed',
      message: error.message
    }, { status: 500 });
  }
});