const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for voice audio blob memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max audio
});

const DEFAULT_GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_GROQ_KEY = process.env.GROQ_API_KEY || "";

/**
 * GET /api/ai/status
 * Check AI model health & configured providers
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    providers: {
      gemini: {
        configured: Boolean(DEFAULT_GEMINI_KEY),
        model: 'gemini-1.5-flash'
      },
      groq: {
        configured: Boolean(DEFAULT_GROQ_KEY || req.headers['x-groq-key']),
        model: 'llama-3.3-70b-versatile',
        whisperModel: 'whisper-large-v3-turbo'
      }
    }
  });
});

/**
 * POST /api/ai/chat
 * Proxy AI chat request securely using server-side keys
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, history, provider = 'groq', templeContext } = req.body;
    const clientGroqKey = req.headers['x-groq-key'];
    const activeGroqKey = clientGroqKey || DEFAULT_GROQ_KEY;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt query is required.' });
    }

    const systemPrompt = `You are the divine "TempleVerse AI Intelligence Guide", a reverent, knowledgeable Vedic and architectural scholar.
You possess complete knowledge of 200+ ancient Hindu temples across Bharat (India).
Always answer with warmth, spiritual reverence ("Namaste", "Om Namah Shivaya", or auspicious blessings), accurate darshan timings, sacred legends (Sthalapuranam), architectural styles (Dravidian, Nagara, Vesara), and spiritual significance.
${templeContext ? `Current devotee view context: ${JSON.stringify(templeContext)}` : ''}`;

    // Prefer Groq if key is present and requested
    if (provider === 'groq' && activeGroqKey) {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(history) ? history.map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text || h.content || ''
        })) : []),
        { role: 'user', content: prompt }
      ];

      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeGroqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.65,
          max_completion_tokens: 1024
        })
      });

      if (!groqRes.ok) {
        const errText = await groqRes.text();
        console.warn('[AI Proxy] Groq error, falling back to Gemini:', errText);
        // Fallback to Gemini
      } else {
        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content || 'May the sacred divine bless your journey.';
        return res.json({
          success: true,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          reply
        });
      }
    }

    // Fallback or Primary: Google Gemini
    if (DEFAULT_GEMINI_KEY) {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${DEFAULT_GEMINI_KEY}`;
      const geminiBody = {
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nDevotee query: ${prompt}` }
            ]
          }
        ]
      };

      const geminiRes = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      });

      if (geminiRes.ok) {
        const gData = await geminiRes.json();
        const reply = gData.candidates?.[0]?.content?.parts?.[0]?.text || 'May divine grace guide your pilgrimage.';
        return res.json({
          success: true,
          provider: 'gemini',
          model: 'gemini-1.5-flash',
          reply
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'AI service temporarily unavailable. Please check API keys.'
    });
  } catch (err) {
    console.error('[AI Proxy] Chat error:', err);
    res.status(500).json({ success: false, message: 'Error processing AI chat request.' });
  }
});

/**
 * POST /api/ai/voice-transcribe
 * Secure voice transcription proxy using Groq Whisper (whisper-large-v3-turbo)
 */
router.post('/voice-transcribe', upload.single('file'), async (req, res) => {
  try {
    const clientGroqKey = req.headers['x-groq-key'];
    const activeGroqKey = clientGroqKey || DEFAULT_GROQ_KEY;

    if (!activeGroqKey) {
      return res.status(400).json({
        success: false,
        message: 'Groq API Key required for voice recognition.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required.'
      });
    }

    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    formData.append('file', blob, req.file.originalname || 'voice_command.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    formData.append('language', req.body.language || 'en');
    formData.append('response_format', 'json');

    const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeGroqKey}`
      },
      body: formData
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      return res.status(whisperRes.status).json({
        success: false,
        message: 'Whisper voice transcription failed.',
        details: errText
      });
    }

    const data = await whisperRes.json();
    res.json({
      success: true,
      text: data.text || ''
    });
  } catch (err) {
    console.error('[AI Proxy] Voice transcription error:', err);
    res.status(500).json({ success: false, message: 'Server error during voice transcription.' });
  }
});

module.exports = router;
