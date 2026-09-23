import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all PULLBACK_RETEST signals
    const pullbackSignals = await base44.asServiceRole.entities.Signal.filter({
      triggerType: 'PULLBACK_RETEST'
    });

    const results = {
      totalFound: pullbackSignals.length,
      deleted: 0,
      kept: 0,
      deletedSignals: []
    };

    // Check each signal against new criteria
    for (const signal of pullbackSignals) {
      const meta = signal.payloadJson || {};
      
      // New criteria: htfAlign=true, volatilityHealthy=true, volumeSpike=true
      const meetsNewCriteria = 
        meta.htfAlign === true &&
        meta.volatilityHealthy === true &&
        meta.volumeSpike === true;

      if (!meetsNewCriteria) {
        // Delete signal that doesn't meet criteria
        await base44.asServiceRole.entities.Signal.delete(signal.id);
        results.deleted++;
        results.deletedSignals.push({
          id: signal.id,
          symbol: signal.symbol,
          direction: signal.direction,
          created_date: signal.created_date,
          htfAlign: meta.htfAlign,
          volatilityHealthy: meta.volatilityHealthy,
          volumeSpike: meta.volumeSpike
        });
      } else {
        results.kept++;
      }
    }

    return Response.json({
      success: true,
      message: `Cleaned up ${results.deleted} PULLBACK_RETEST signals that didn't meet new criteria`,
      results
    });

  } catch (error) {
    return Response.json({
      error: 'Cleanup failed',
      details: error.message
    }, { status: 500 });
  }
});