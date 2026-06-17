const express = require('express');
const router = express.Router();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
];

/**
 * POST /api/ai/chat
 * Body: { messages: [...], maxRetries?: number }
 * Proxies the request to OpenRouter with the server-side API key.
 */
router.post('/chat', async (req, res) => {
  const { messages, maxRetries = 3 } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set in .env');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const result = await fetchWithRetry(apiKey, messages, maxRetries);
    if (result) {
      return res.json({ content: result });
    }
    return res.status(503).json({ error: 'All models are currently rate-limited. Please try again later.' });
  } catch (err) {
    console.error('OpenRouter proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Fetch with automatic retry on 429 (rate-limit) errors.
 * Tries each model in the MODELS list before retrying with delays.
 */
async function fetchWithRetry(apiKey, messages, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const model of MODELS) {
      try {
        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://seiwow.ch',
            'X-Title': 'lern-app',
          },
          body: JSON.stringify({ model, messages }),
        });

        if (response.status === 429) {
          console.warn(`Rate-limited on ${model}, trying next model...`);
          continue;
        }

        if (!response.ok) {
          console.warn(`Error ${response.status} on ${model}, trying next model...`);
          continue;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;

        console.warn(`Empty response from ${model}, trying next model...`);
      } catch (err) {
        console.warn(`Fetch error on ${model}:`, err.message);
      }
    }

    // All models failed this attempt — wait before retrying
    if (attempt < maxRetries - 1) {
      const waitMs = (attempt + 1) * 5000;
      console.log(`All models rate-limited. Waiting ${waitMs / 1000}s before retry ${attempt + 2}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  return null;
}

module.exports = router;
