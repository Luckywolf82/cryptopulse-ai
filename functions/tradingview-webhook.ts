import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const requestId = crypto.randomUUID();
  console.log(`[TradingView Webhook ${requestId}] Request received`);

  // Parse webhook payload - handle string or object
  let payload;
  try {
    const body = await req.text();
    payload = body ? JSON.parse(body) : {};
    console.log(`[TradingView Webhook ${requestId}] Payload parsed successfully`);
  } catch (error) {
    console.error(`[TradingView Webhook ${requestId}] Invalid JSON payload:`, error.message);
    
    // Alert admin of suspicious activity
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: Deno.env.get('ADMIN_EMAIL') || 'admin@example.com',
        subject: '⚠️ TradingView Webhook: Invalid JSON',
        body: `Request ID: ${requestId}\nError: ${error.message}\nTimestamp: ${new Date().toISOString()}`
      });
    } catch (emailError) {
      console.error(`[TradingView Webhook ${requestId}] Failed to send alert email:`, emailError.message);
    }
    
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
    console.error(`[TradingView Webhook ${requestId}] Auth failed - no valid secret or user session`);
    
    // Alert admin of potential security breach
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: Deno.env.get('ADMIN_EMAIL') || 'admin@example.com',
        subject: '🚨 TradingView Webhook: Unauthorized Access Attempt',
        body: `Request ID: ${requestId}\nTimestamp: ${new Date().toISOString()}\nIP: ${req.headers.get('cf-connecting-ip') || 'unknown'}\nPayload: ${JSON.stringify(payload, null, 2)}`
      });
    } catch (emailError) {
      console.error(`[TradingView Webhook ${requestId}] Failed to send security alert:`, emailError.message);
    }
    
    return Response.json({ 
      accepted: false, 
      error: 'unauthorized' 
    }, { status: 401 });
  }

  console.log(`[TradingView Webhook ${requestId}] Auth passed`);

  // Validate required fields
  const requiredFields = ['symbol', 'timeframe', 'triggerType', 'direction'];
  const missing = requiredFields.filter(field => !payload[field]);
  
  if (missing.length > 0) {
    console.error(`[TradingView Webhook ${requestId}] Invalid payload - missing fields:`, missing);
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
      price: price ?? null,
      payload
    });

    console.log(`[TradingView Webhook ${requestId}] Signal created successfully:`, signal.id, `Score: ${score}`);

    // Alert admin of high-quality signals
    if (alertTriggered) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: Deno.env.get('ADMIN_EMAIL') || 'admin@example.com',
          subject: `🎯 High-Quality Signal: ${symbol} ${direction.toUpperCase()}`,
          body: `Signal ID: ${signal.id}\nSymbol: ${symbol}\nDirection: ${direction.toUpperCase()}\nTimeframe: ${timeframe}\nTrigger: ${triggerType}\nScore: ${score}\nPrice: ${price || 'N/A'}\nTimestamp: ${new Date().toISOString()}`
        });
      } catch (emailError) {
        console.error(`[TradingView Webhook ${requestId}] Failed to send signal alert:`, emailError.message);
      }
    }

    return Response.json({
      accepted: true,
      score,
      alertTriggered,
      createdSignalId: signal.id
    }, { status: 200 });
  } catch (error) {
    console.error(`[TradingView Webhook ${requestId}] DB create failed:`, error.message);
    
    // Alert admin of critical database error
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: Deno.env.get('ADMIN_EMAIL') || 'admin@example.com',
        subject: '❌ TradingView Webhook: Database Error',
        body: `Request ID: ${requestId}\nError: ${error.message}\nPayload: ${JSON.stringify(payload, null, 2)}\nTimestamp: ${new Date().toISOString()}`
      });
    } catch (emailError) {
      console.error(`[TradingView Webhook ${requestId}] Failed to send critical alert:`, emailError.message);
    }
    
    return Response.json({
      accepted: false,
      error: 'db_create_failed',
      message: error.message
    }, { status: 500 });
  }
});