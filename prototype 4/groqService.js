/* ============================================================
   TempleVerse - Groq Voice & Meta Llama 3.3 70B AI Service
   Powered by Groq LPUs, Meta Llama 3.3 70B, Whisper & Web Speech API
   Real-Time Voice Command Recognition & High-Speed Audio Narration
   ============================================================ */

class TempleVerseGroqVoiceService {
  constructor() {
    const customKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('groq_api_key') : null;
    this.config = (typeof window !== 'undefined' ? window.TEMPLEVERSE_CONFIG?.groq : null) || {
      apiKey: customKey || "",
      model: "llama-3.3-70b-versatile",
      whisperModel: "whisper-large-v3-turbo",
      chatEndpoint: "https://api.groq.com/openai/v1/chat/completions",
      audioEndpoint: "https://api.groq.com/openai/v1/audio/transcriptions"
    };
    if (customKey) this.config.apiKey = customKey;

    this.isListening = false;
    this.sessionActive = false;
    this.recognition = null;
    this.currentUtterance = null;
    this.isSpeechMuted = (typeof localStorage !== 'undefined') ? (localStorage.getItem('templeverse_speech_muted') === 'true') : false;
    this.activeCallbacks = null;
  }

  /**
   * Creates a fresh, clean SpeechRecognition instance on demand
   */
  createRecognitionInstance() {
    const SpeechRec = (typeof window !== 'undefined') ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    if (!SpeechRec) {
      console.info("[TempleVerse Groq] Native Web Speech API not supported in this browser.");
      return null;
    }
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    // Set Indian cultural English acoustic language, fallback to browser language
    rec.lang = (typeof navigator !== 'undefined' && navigator.language && navigator.language.startsWith('en'))
      ? 'en-IN'
      : (typeof navigator !== 'undefined' ? (navigator.language || 'en-IN') : 'en-IN');
    return rec;
  }

  /**
   * Sets or updates user Groq API key in memory & localStorage
   */
  setGroqApiKey(key) {
    const trimmed = (key || '').trim();
    this.config.apiKey = trimmed;
    if (typeof localStorage !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('groq_api_key', trimmed);
      } else {
        localStorage.removeItem('groq_api_key');
      }
    }
  }

  getGroqApiKey() {
    return this.config.apiKey;
  }

  /**
   * Starts listening to voice commands with live visual callbacks
   */
  startListening(callbacks = {}) {
    this.activeCallbacks = callbacks;

    // If session is already marked active or listening, cleanly stop first
    if (this.sessionActive || this.isListening) {
      this.stopListening();
      return;
    }

    // Teardown any previous stale instance
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }

    this.recognition = this.createRecognitionInstance();

    if (!this.recognition) {
      if (typeof callbacks.onError === 'function') {
        callbacks.onError(new Error("Microphone speech recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari."), 'not-supported');
      }
      return;
    }

    this.sessionActive = true;
    let latestTranscript = '';
    let hasFinalized = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      if (typeof callbacks.onStart === 'function') callbacks.onStart();
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0] ? item[0].transcript : '';
        if (item.isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }

      const currentLive = (final + (interim ? ' ' + interim : '')).trim();
      if (currentLive) {
        latestTranscript = currentLive;
        if (typeof callbacks.onInterim === 'function') {
          callbacks.onInterim(currentLive);
        }
      }
    };

    this.recognition.onerror = (event) => {
      const errCode = event.error;
      console.warn("[TempleVerse Groq] Voice Recognition error:", errCode);
      this.sessionActive = false;
      this.isListening = false;

      // Gracefully handle benign non-actionable events without disruptive alerts
      if (errCode === 'no-speech') {
        if (typeof callbacks.onNoSpeech === 'function') {
          callbacks.onNoSpeech();
        } else if (typeof callbacks.onEnd === 'function') {
          callbacks.onEnd('');
        }
        return;
      }
      if (errCode === 'aborted') {
        if (typeof callbacks.onEnd === 'function') {
          callbacks.onEnd('');
        }
        return;
      }

      let msg = "Voice recognition error. Please try again.";
      if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
        msg = "Microphone access was denied. Please allow microphone permission in your browser.";
      } else if (errCode === 'network') {
        msg = "Speech recognition network error. Please check your internet connection.";
      }

      if (typeof callbacks.onError === 'function') {
        callbacks.onError(new Error(msg), errCode);
      }
    };

    this.recognition.onend = () => {
      this.sessionActive = false;
      this.isListening = false;

      const resultText = latestTranscript.trim();
      if (resultText && !hasFinalized) {
        hasFinalized = true;
        if (typeof callbacks.onFinal === 'function') {
          callbacks.onFinal(resultText);
        }
      } else {
        if (typeof callbacks.onEnd === 'function') {
          callbacks.onEnd(resultText);
        }
      }
    };

    try {
      this.recognition.start();
    } catch (err) {
      console.warn("[TempleVerse Groq] Failed to start recognition:", err);
      this.sessionActive = false;
      this.isListening = false;
      // If recognition is already starting/started, silently ignore rather than crashing UI
      if (err.message && err.message.includes('already started')) {
        return;
      }
      if (typeof callbacks.onError === 'function') callbacks.onError(err, 'start-failed');
    }
  }

  /**
   * Stops voice recognition listening
   */
  stopListening() {
    this.sessionActive = false;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        try { this.recognition.abort(); } catch (err) {}
      }
    }
  }

  /**
   * Analyzes and executes high-level voice navigation actions or routes to LLM
   * @param {string} spokenCommand
   * @returns {object} Action result object
   */
  analyzeVoiceCommand(spokenCommand) {
    const raw = (spokenCommand || '').trim();
    const cmd = raw.toLowerCase();

    if (!cmd) {
      return { type: 'noop', spokenCommand: raw };
    }

    // 1. Reset / Clear Filters
    if (/\b(show all|all temples|reset map|clear search|reset filters|clear all|reset)\b/i.test(cmd)) {
      return { type: 'reset_filters', spokenCommand: raw };
    }

    // 2. Region Filters (Explicit south or north commands)
    if (/\b(show south|south temples|south india temples|southern temples)\b/i.test(cmd)) {
      return { type: 'filter_region', region: 'South India', spokenCommand: raw };
    }
    if (/\b(show north|north temples|north india temples|northern temples)\b/i.test(cmd)) {
      return { type: 'filter_region', region: 'North India', spokenCommand: raw };
    }

    // 3. Question or Conversational AI Intent (Must take priority over state/word matching!)
    const isQuestionOrConversational = /^(what|which|where|who|why|how|when|tell me|give me|explain|can you|is there|are there|list|show me information|find me details)\b/i.test(cmd) ||
      /\b(related to|associated with|dedicated to|history of|story of|mystery of|darshan timings|dress code|ticket price|architecture of|legend of|significance of)\b/i.test(cmd);

    // 4. Prayer & Blessings Intent Categories
    // Visa
    if (/\b(visa|visas|passport|foreign travel|abroad)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Visa',
        searchTerm: 'visa',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    // Marriage
    if (/\b(marriage|wedding|spouse|vivah|kalyana|matrimony|marital)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Marriage',
        searchTerm: 'marriage',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    // 4. Specific Diseases & Health Concerns (High Priority before generic health category)
    if (/\b(skin|psoriasis|vitiligo|eczema|rash|rashes|smallpox|chickenpox|measles|spider\s*bite\w*)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'skin',
        specificDisease: 'skin',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(autis\w*|seizur\w*|epilep\w*|mental\s*wellbeing|emotional\s*distress|behavioral\s*distress|psychosis|insomnia|depression|anxiety|tremor|parkinson|phobia|nightmare)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'autism mental wellbeing',
        specificDisease: 'mental_autism',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(kidney\w*|renal|creatinine|nephro\w*|dialysis|ckd)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'kidney',
        specificDisease: 'kidney',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(asthma|respiratory|breath\w*|wheez\w*|lung\w*|bronch\w*|chronic\s*cough)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'asthma respiratory',
        specificDisease: 'respiratory_asthma',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(heart\w*|cardiac|cardio\w*|blood\s*pressure|hypertension|bp|cardiovascular)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'heart',
        specificDisease: 'heart_cardiac',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(diabet\w*|sugar|blood\s*sugar|glucose)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'diabetes',
        specificDisease: 'diabetes',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(paralysis|stroke|bone\w*|joint\w*|arthritis|rheumat\w*|spine|back\s*pain|ortho\w*)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'paralysis bone joint',
        specificDisease: 'paralysis_bone',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(eye\w*|vision|sight|blind\w*|cataract)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'eye vision',
        specificDisease: 'eye_vision',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    if (/\b(throat|speech|stammer\w*|voice|vocal|thyroid|mute)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'throat speech thyroid',
        specificDisease: 'throat_speech',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }

    // Generic Health
    if (/\b(health|healing|heal|cure|disease|illness|wellness|ayur|sick|recovery)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Health',
        searchTerm: 'health',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    // Child / Progeny
    if (/\b(child|children|baby|pregnancy|pregnant|fertility|progeny|santana)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Child',
        searchTerm: 'child',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    // Wealth
    if (/\b(wealth|money|prosperity|business|rich|lakshmi|kuber|abundance)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Wealth',
        searchTerm: 'wealth',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    // Education
    if (/\b(education|studies|study|exam|vidya|knowledge|saraswati|wisdom|student)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Education',
        searchTerm: 'education',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }
    // Wishes / Mannat
    if (/\b(wishes|wish|mannat|boon|desire)\b/i.test(cmd)) {
      return {
        type: 'filter_category',
        category: 'Wishes',
        searchTerm: 'wishes',
        openAI: isQuestionOrConversational || cmd.includes('related to') || cmd.length > 15,
        spokenCommand: raw
      };
    }

    // 5. Explicit State Navigation (Requires strict word boundaries — NEVER match substrings like "mp" in "temple")
    const statePatterns = [
      { regex: /\b(tamil\s*nadu|tamilnadu)\b/i, id: 'IN-TN', name: 'Tamil Nadu' },
      { regex: /\b(kerala)\b/i, id: 'IN-KL', name: 'Kerala' },
      { regex: /\b(karnataka)\b/i, id: 'IN-KA', name: 'Karnataka' },
      { regex: /\b(andhra\s*pradesh|andhra)\b/i, id: 'IN-AP', name: 'Andhra Pradesh' },
      { regex: /\b(telangana)\b/i, id: 'IN-TG', name: 'Telangana' },
      { regex: /\b(uttarakhand|uttaranchal)\b/i, id: 'IN-UK', name: 'Uttarakhand' },
      { regex: /\b(uttar\s*pradesh)\b/i, id: 'IN-UP', name: 'Uttar Pradesh' },
      { regex: /\b(rajasthan)\b/i, id: 'IN-RJ', name: 'Rajasthan' },
      { regex: /\b(gujarat)\b/i, id: 'IN-GJ', name: 'Gujarat' },
      { regex: /\b(himachal\s*pradesh|himachal)\b/i, id: 'IN-HP', name: 'Himachal Pradesh' },
      { regex: /\b(jammu\s*(and|&)?\s*kashmir|kashmir|jammu)\b/i, id: 'IN-JK', name: 'Jammu & Kashmir' },
      { regex: /\b(punjab)\b/i, id: 'IN-PB', name: 'Punjab' },
      { regex: /\b(haryana)\b/i, id: 'IN-HR', name: 'Haryana' },
      { regex: /\b(delhi)\b/i, id: 'IN-DL', name: 'Delhi' },
      { regex: /\b(bihar)\b/i, id: 'IN-BR', name: 'Bihar' },
      { regex: /\b(west\s*bengal|bengal)\b/i, id: 'IN-WB', name: 'West Bengal' },
      { regex: /\b(maharashtra)\b/i, id: 'IN-MH', name: 'Maharashtra' },
      { regex: /\b(odisha|orissa)\b/i, id: 'IN-OR', name: 'Odisha' },
      { regex: /\b(assam)\b/i, id: 'IN-AS', name: 'Assam' }
    ];

    // Only match Madhya Pradesh if the phrase "madhya pradesh" or explicit state phrases like "in mp", "state of mp" are spoken
    if (/\b(madhya\s*pradesh|in\s+mp|state\s+of\s+mp|state\s+mp)\b/i.test(cmd)) {
      return { type: 'filter_state', stateId: 'IN-MP', stateName: 'Madhya Pradesh', spokenCommand: raw };
    }
    // Only match Uttar Pradesh acronym if explicit
    if (/\b(in\s+up|state\s+of\s+up|state\s+up)\b/i.test(cmd)) {
      return { type: 'filter_state', stateId: 'IN-UP', stateName: 'Uttar Pradesh', spokenCommand: raw };
    }

    // Check full state names ONLY if not a conversational question
    if (!isQuestionOrConversational) {
      for (const st of statePatterns) {
        if (st.regex.test(cmd)) {
          return {
            type: 'filter_state',
            stateId: st.id,
            stateName: st.name,
            spokenCommand: raw
          };
        }
      }
    }

    // 6. Search / Conversational AI Query (Deities like Venkateswara, Shiva, Krishna, or Specific Temples)
    return {
      type: 'search_query',
      query: raw,
      openAI: isQuestionOrConversational || cmd.includes('temple') || cmd.length > 15,
      spokenCommand: raw
    };
  }

  /**
   * Invokes Groq Meta Llama 3.3 70B via ultra-fast LPU endpoint with RAG context
   * @param {string} prompt - Spoken voice query
   * @param {object} templeContext - Optional active temple
   * @returns {Promise<string>}
   */
  async askGroqLlama(prompt, templeContext = null) {
    const hasGroqKey = this.config.apiKey && this.config.apiKey.trim().startsWith('gsk_');

    if (hasGroqKey && typeof fetch === 'function') {
      try {
        // Build RAG Grounding context from verified 200 temples dataset
        const ragContext = window.templeVerseGemini
          ? window.templeVerseGemini.buildRAGContext(prompt, templeContext)
          : "Verified All-India Temples Knowledge Base (200 Shrines across North & South India).";

        const systemPrompt = `You are TempleVerse Voice AI, powered by Meta Llama 3.3 70B and our verified 200-temple dataset.
Provide an inspiring, culturally reverent, and concise spoken-friendly answer about Indian temples, their sacred deities, daily rituals, architectural wonders, or pilgrim guidelines.
Focus directly on the user's specific voice question. Keep your tone majestic, respectful, and crystal clear.`;

        const response = await fetch(this.config.chatEndpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.config.model, // llama-3.3-70b-versatile
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `=== VERIFIED TEMPLE GROUNDING ARCHIVES ===\n${ragContext}\n\n=== VOICE QUERY ===\n${prompt}` }
            ],
            temperature: 0.35,
            max_tokens: 1200
          })
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer && answer.trim().length > 15) {
            return answer;
          }
        } else {
          console.warn(`[TempleVerse Groq] Groq Llama 3.3 70B returned HTTP ${response.status}`);
        }
      } catch (err) {
        console.warn("[TempleVerse Groq] Groq Llama 3.3 API call failed, falling back to local grounded intelligence:", err);
      }
    }

    // Seamless fallback to Grounded Knowledge Engine / Gemini
    if (window.templeVerseGemini && typeof window.templeVerseGemini.askGemini === 'function') {
      return await window.templeVerseGemini.askGemini(prompt, templeContext);
    }

    return "Namaste! TempleVerse Voice AI has processed your sacred query. Click on any temple on the map to explore darshan timings, rituals, and architecture.";
  }

  /**
   * High quality text-to-speech voice narration for AI answers
   */
  speakResponse(text) {
    if (this.isSpeechMuted || !window.speechSynthesis) return;

    this.stopSpeaking();

    // Clean markdown, links, emojis, and hashtags for crisp speech synthesis
    const cleanSpeech = text
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[*_#`~>]/g, '')
      .replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[-•]\s*/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) return;

    // Speak introductory excerpt (~first 2-3 sentences) so voice is prompt and pleasant
    const sentences = cleanSpeech.split(/(?<=[.!?])\s+/);
    const spokenExcerpt = sentences.slice(0, 3).join(' ');

    const utterance = new SpeechSynthesisUtterance(spokenExcerpt);
    utterance.rate = 0.96;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    // Find warm Indian English or natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('IN') || v.name.toLowerCase().includes('india') || v.name.toLowerCase().includes('natural'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stops active speech playback
   */
  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Toggles speech narration mute state
   */
  toggleSpeechMute() {
    this.isSpeechMuted = !this.isSpeechMuted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('templeverse_speech_muted', String(this.isSpeechMuted));
    }
    if (this.isSpeechMuted) {
      this.stopSpeaking();
    }
    return this.isSpeechMuted;
  }
}

// Global Groq Voice Service Instance
if (typeof window !== 'undefined') {
  window.templeVerseGroq = new TempleVerseGroqVoiceService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TempleVerseGroqVoiceService;
}
