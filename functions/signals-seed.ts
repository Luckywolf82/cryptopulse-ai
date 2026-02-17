import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const signal = await base44.asServiceRole.entities.Signal.create({
      symbol: 'BTCUSDT',
      exchange: 'BINANCE',
      timeframe: '15m',
      triggerType: 'EMA_FLIP',
      direction: 'long',
      score: 75,
      price: 43250.50
    });

    console.log('[Seed] Test signal created:', signal.id);

    return Response.json({
      success: true,
      signalId: signal.id,
      signal
    }, { status: 200 });
  } catch (error) {
    console.log('[Seed] Failed to create signal:', error.message);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});