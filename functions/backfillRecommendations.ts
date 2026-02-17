import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    // Fetch all signals with score >= 70
    const signals = await base44.asServiceRole.entities.Signal.filter({});
    const highScoreSignals = signals.filter(s => s.score >= 70);

    console.log(`Found ${highScoreSignals.length} signals with score >= 70`);

    // Process each signal
    for (const signal of highScoreSignals) {
      try {
        results.processed++;

        // Check if recommendation already exists for this specific signal
         const existingRecs = await base44.asServiceRole.entities.TradingRecommendation.filter({
           signalId: signal.id
         });

         if (existingRecs.length > 0) {
           results.skipped++;
           results.details.push({
             symbol: signal.symbol,
             status: 'skipped',
             reason: 'Recommendation already exists for this signal'
           });
           continue;
         }

         // Validate target price will be positive
         const currentPrice = signal.price || 1;

        // Generate AI recommendation
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

        **CRITICAL REQUIREMENTS:**
        - target_price MUST be a positive number (> 0), NEVER 0 or null
        - If direction is LONG, target_price should be 10-30% above entry price
        - If direction is SHORT, target_price should be 10-30% below entry price

        **Your response should be a JSON object with:**
        {
        "recommendation_action": "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL",
        "target_price": number (MUST be positive and calculated as described above),
        "stop_loss": number,
        "expected_return_percent": number,
        "confidence_score": number (0-100),
        "time_horizon": "short_term" | "medium_term" | "long_term",
        "technical_reason": "string",
        "risk_factors": ["string1", "string2"]
        }

        Base your recommendation on the signal strength and technical trigger.
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
              time_horizon: { type: 'string' },
              technical_reason: { type: 'string' },
              risk_factors: { type: 'array', items: { type: 'string' } }
            },
            required: ['recommendation_action', 'target_price', 'stop_loss']
          }
        });

        // Validate target price
        if (!response.target_price || response.target_price <= 0) {
          results.errors++;
          results.details.push({
            symbol: signal.symbol,
            status: 'error',
            reason: 'Invalid target price from LLM'
          });
          continue;
        }

        const assetType = signal.exchange === 'BINANCE' ? 'crypto' : 'forex';

        await base44.asServiceRole.entities.TradingRecommendation.create({
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

        results.created++;
        results.details.push({
          symbol: signal.symbol,
          status: 'created',
          action: response.recommendation_action,
          confidence: response.confidence_score
        });

      } catch (error) {
        results.errors++;
        results.details.push({
          symbol: signal.symbol,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json(results);

  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});