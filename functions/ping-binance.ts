Deno.serve(async (req) => {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    
    if (!response.ok) {
      return Response.json({
        ok: false,
        error: 'Binance API request failed',
        details: `HTTP ${response.status}: ${response.statusText}`
      }, { status: 500 });
    }

    const data = await response.json();
    
    return Response.json({
      ok: true,
      count: Array.isArray(data) ? data.length : 0
    });
  } catch (error) {
    return Response.json({
      ok: false,
      error: 'Failed to connect to Binance API',
      details: error.message
    }, { status: 500 });
  }
});