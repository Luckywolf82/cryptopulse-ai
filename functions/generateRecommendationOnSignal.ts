import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const { event, data } = body;

    // Only process create events for signals with score >= 70
     if (event.type !== 'create' || !data || data.score < 70) {
       return Response.json({ skipped: true, reason: 'Score too low or not a create event' });
     }

     const signal = data;

     // Check if recommendation already exists for this signal
     const existingRecs = await base44.entities.TradingRecommendation.filter({
       signalId: signal.id
     });

     if (existingRecs.length > 0) {
       return Response.json({ skipped: true, reason: 'Recommendation already exists for this signal' });
     }

    // Fetch current price and market context
    const marketContext = await fetchMarketContext(signal.symbol, signal.exchange);

    // Generate AI recommendation using LLM
    const prompt = `
    You are a professional trading analyst. Based on the following signal, generate a detailed trading recommendation.

    **Signal Details:**
    - Symbol: ${signal.symbol}
    - Exchange: ${signal.exchange}
    - Direction: ${signal.direction.toUpperCase()}
    - Timeframe: ${signal.timeframe}
    - Trigger Type: ${signal.triggerType}
    - Signal Score: ${signal.score}/100
    - Entry Price: $${signal.price}
    - Current Price: $${marketContext.currentPrice}
    - 24h Volume: $${marketContext.volume24h?.toLocaleString() || 'N/A'}
    - Market Trend: ${marketContext.trend}

    **CRITICAL REQUIREMENTS:**
    - target_price MUST be a positive number (> 0), NEVER 0 or null
    - If direction is LONG, target_price should be 10-30% above entry price
    - If direction is SHORT, target_price should be 10-30% below entry price

    **Your response should be a JSON object with:**
    {
    "recommendation_action": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL",
    "target_price": number (in USD - MUST be positive and calculated as described above),
    "stop_loss": number (in USD),
    "expected_return_percent": number,
    "confidence_score": number (0-100),
    "time_horizon": "short_term" | "medium_term" | "long_term",
    "technical_reason": "string explaining technical analysis",
    "risk_factors": ["string1", "string2"],
    "entry_timing": "string with timing recommendation"
    }

    Base your recommendation on:
    1. The signal strength (score of ${signal.score})
    2. The technical trigger (${signal.triggerType})
    3. Current market conditions
    4. Risk/reward ratio
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          recommendation_action: {
            type: 'string',
            enum: ['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL']
          },
          target_price: { type: 'number' },
          stop_loss: { type: 'number' },
          expected_return_percent: { type: 'number' },
          confidence_score: { type: 'number' },
          time_horizon: {
            type: 'string',
            enum: ['short_term', 'medium_term', 'long_term']
          },
          technical_reason: { type: 'string' },
          risk_factors: {
            type: 'array',
            items: { type: 'string' }
          },
          entry_timing: { type: 'string' }
        },
        required: ['recommendation_action', 'target_price', 'stop_loss', 'expected_return_percent']
      }
    });

    // Validate target price
    if (!response.target_price || response.target_price <= 0) {
      return Response.json({
        error: 'Invalid target price from LLM',
        skipped: true
      }, { status: 400 });
    }

    // Determine asset type
    const assetType = signal.exchange === 'BINANCE' ? 'crypto' : 'forex';

    // Create recommendation
    const recommendation = await base44.entities.TradingRecommendation.create({
      signalId: signal.id,
      recommendation_type: assetType,
      asset_symbol: signal.symbol,
      asset_name: `${signal.symbol} - ${signal.direction.toUpperCase()} Signal`,
      recommendation_action: response.recommendation_action,
      current_price: signal.price,
      target_price: response.target_price,
      stop_loss: response.stop_loss,
      confidence_score: response.confidence_score,
      time_horizon: response.time_horizon,
      technical_reason: response.technical_reason,
      risk_factors: response.risk_factors || [],
      expected_return_percent: response.expected_return_percent,
      news_catalyst: [`${signal.triggerType} signal on ${signal.timeframe}`]
    });

    return Response.json({
      created: true,
      recommendationId: recommendation.id,
      action: response.recommendation_action,
      confidence: response.confidence_score
    });

  } catch (error) {
    console.error('Error generating recommendation:', error);
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});

async function fetchMarketContext(symbol, exchange) {
  try {
    // For simplicity, we'll return mock data - in production, fetch from an API
    return {
      currentPrice: 0, // Would be fetched from API
      volume24h: 0,
      trend: 'neutral'
    };
  } catch (error) {
    return {
      currentPrice: 0,
      volume24h: 0,
      trend: 'unknown'
    };
  }
}