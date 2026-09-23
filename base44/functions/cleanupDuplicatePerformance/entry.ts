import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all performances
    const allPerformances = await base44.entities.SignalPerformance.list("-created_date", 10000);

    // Group by signalId
    const grouped = {};
    allPerformances.forEach(perf => {
      if (!grouped[perf.signalId]) {
        grouped[perf.signalId] = [];
      }
      grouped[perf.signalId].push(perf);
    });

    let deletedCount = 0;

    // For each signal, keep newest, delete rest
    for (const signalId in grouped) {
      const perfs = grouped[signalId];
      if (perfs.length > 1) {
        // Sort by created_date descending
        perfs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        
        // Delete all but the first (newest)
        for (let i = 1; i < perfs.length; i++) {
          await base44.entities.SignalPerformance.delete(perfs[i].id);
          deletedCount++;
        }
      }
    }

    return Response.json({
      message: 'Cleanup complete',
      deletedCount,
      uniqueSignals: Object.keys(grouped).length
    });

  } catch (error) {
    return Response.json({
      error: 'Cleanup failed',
      details: error.message
    }, { status: 500 });
  }
});