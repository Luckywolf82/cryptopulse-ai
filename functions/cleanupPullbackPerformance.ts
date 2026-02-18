import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all PULLBACK_RETEST performance records
    const pullbackPerformances = await base44.asServiceRole.entities.SignalPerformance.filter({
      triggerType: 'PULLBACK_RETEST'
    });

    const results = {
      totalFound: pullbackPerformances.length,
      deleted: 0
    };

    // Delete all PULLBACK_RETEST performance records
    for (const perf of pullbackPerformances) {
      await base44.asServiceRole.entities.SignalPerformance.delete(perf.id);
      results.deleted++;
    }

    return Response.json({
      success: true,
      message: `Deleted ${results.deleted} PULLBACK_RETEST performance records`,
      results
    });

  } catch (error) {
    return Response.json({
      error: 'Cleanup failed',
      details: error.message
    }, { status: 500 });
  }
});