/**
 * Seed Signal Data for Testing
 * POST /api/signals/seed
 */

export default async function handler(request, context) {
  const { base44 } = context;

  // Create realistic test signal
  const signal = await base44.entities.Signal.create({
    symbol: "SOLUSDT",
    exchange: "BINANCE",
    timeframe: "1h",
    triggerType: "EMA_FLIP",
    direction: "long",
    score: 78,
    price: 152.44,
    payload: {
      volumeSpike: true,
      htfAlign: true,
      volatilityHealthy: true
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      createdSignalId: signal.id,
      message: "Test signal created"
    })
  };
}

export const config = {
  method: 'POST',
  path: '/api/signals/seed'
};