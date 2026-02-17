import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Read the i18n file content
    const i18nFileUrl = 'https://raw.githubusercontent.com/yourusername/yourrepo/main/components/lib/i18n.js';
    // For now, we'll use the payload to receive the i18n structure
    const { i18nData } = await req.json();

    if (!i18nData || !i18nData.en || !i18nData.no) {
      return Response.json({ 
        error: 'Missing i18n data. Please provide the current translations.' 
      }, { status: 400 });
    }

    const languages = ['en', 'no', 'id'];
    const missingKeys = {};
    const suggestions = {};

    // Check each language against English (source of truth)
    const englishKeys = flattenObject(i18nData.en.translation);
    
    for (const lang of languages) {
      if (lang === 'en') continue;
      
      const langKeys = flattenObject(i18nData[lang]?.translation || {});
      const missing = [];
      
      for (const key in englishKeys) {
        if (!langKeys[key]) {
          missing.push(key);
        }
      }
      
      if (missing.length > 0) {
        missingKeys[lang] = missing;
        
        // Generate suggestions using AI
        const translationPrompt = lang === 'no' 
          ? 'Norwegian (Bokmål)'
          : 'Indonesian';
          
        const prompt = `Translate these English UI text keys to ${translationPrompt}. Maintain the same JSON key structure. Keep technical terms and brand names in English where appropriate.

Missing translations:
${missing.map(k => `"${k}": "${englishKeys[k]}"`).join('\n')}

Provide ONLY a valid JSON object with the translations, no explanations.`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              translations: {
                type: "object",
                additionalProperties: { type: "string" }
              }
            }
          }
        });
        
        suggestions[lang] = result.translations || {};
      }
    }

    // Check for keys in other languages that don't exist in English
    const extraKeys = {};
    for (const lang of languages) {
      if (lang === 'en') continue;
      const langKeys = flattenObject(i18nData[lang]?.translation || {});
      const extra = [];
      
      for (const key in langKeys) {
        if (!englishKeys[key]) {
          extra.push(key);
        }
      }
      
      if (extra.length > 0) {
        extraKeys[lang] = extra;
      }
    }

    return Response.json({
      success: true,
      status: Object.keys(missingKeys).length === 0 ? 'complete' : 'incomplete',
      missingKeys,
      suggestions,
      extraKeys,
      summary: {
        totalEnglishKeys: Object.keys(englishKeys).length,
        missingInNorwegian: missingKeys.no?.length || 0,
        missingInIndonesian: missingKeys.id?.length || 0,
      }
    });

  } catch (error) {
    console.error('i18n completeness check failed:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});

// Helper function to flatten nested objects into dot notation
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}