/* ============================================================
   TempleVerse - Gemini AI RAG & Knowledge Service
   Powered by Google Gemini API & Grounded Verified Dataset (200 Shrines)
   Enhanced with Conversational Memory & Aspect-Specific Follow-Up Intelligence
   ============================================================ */

class TempleVerseGeminiService {
  constructor() {
    const customKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('gemini_api_key') : null;
    this.config = (typeof window !== 'undefined' && window.TEMPLEVERSE_CONFIG?.gemini) || {
      apiKey: customKey || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "",
      primaryModel: "gemini-1.5-flash",
      fallbackModel: "gemini-2.0-flash",
      apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models"
    };
    if (customKey) this.config.apiKey = customKey;
    this.modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

    // Conversational Context Memory
    this.currentTemple = null; // Currently active temple being discussed
    this.conversationHistory = []; // Multi-turn chat history [{ role: 'user' | 'model', text: string }]
  }

  /**
   * Sets the active temple context (e.g. from a card click or prior question)
   */
  setTempleContext(temple) {
    if (temple && typeof temple === 'object') {
      this.currentTemple = temple;
    }
  }

  /**
   * Gets the active temple context
   */
  getTempleContext() {
    return this.currentTemple;
  }

  /**
   * Clears conversational history and active temple context
   */
  clearHistory() {
    this.conversationHistory = [];
    this.currentTemple = null;
  }

  /**
   * Updates or saves user-provided Gemini API key
   */
  setApiKey(key) {
    if (key && typeof key === 'string') {
      this.config.apiKey = key.trim();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('gemini_api_key', key.trim());
      }
    } else {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('gemini_api_key');
      }
      this.config.apiKey = "";
    }
  }

  /**
   * Generates a context-aware answer using the Gemini API or grounded knowledge base
   * @param {string} userQuestion - The user's query
   * @param {object} specificTemple - Optional temple object if querying a specific temple
   * @returns {Promise<string>}
   */
  async askGemini(userQuestion, specificTemple = null) {
    // 1. Resolve which temple is in scope (from explicit param, query text, or active context)
    const activeTemple = this.resolveTempleFromQuery(userQuestion, specificTemple);
    if (activeTemple) {
      this.currentTemple = activeTemple;
    }

    const context = this.buildRAGContext(userQuestion, activeTemple);
    const systemPrompt = this.getSystemPrompt();

    let lastError = null;

    // Check if a valid Google AI Studio key is provided (or custom key in localStorage)
    const isCustomKey = Boolean((typeof localStorage !== 'undefined') && localStorage.getItem('gemini_api_key'));
    const isStudioKey = typeof this.config.apiKey === 'string' && this.config.apiKey.startsWith('AIzaSy');
    const shouldCallAPI = (isCustomKey || isStudioKey) && typeof fetch === 'function';

    if (shouldCallAPI) {
      // Try primary and fallback models with multi-turn conversation history
      for (const model of this.modelsToTry) {
        try {
          const responseText = await this.callGeminiAPI(model, userQuestion, context, systemPrompt);
          if (responseText && responseText.trim().length > 20) {
            // Record in conversation history
            this.conversationHistory.push({ role: 'user', text: userQuestion });
            this.conversationHistory.push({ role: 'model', text: responseText });
            return responseText;
          }
        } catch (err) {
          console.warn(`[TempleVerse Gemini] Attempt with model ${model} failed:`, err);
          lastError = err;
        }
      }
    }

    // Tier 2 Fallback: If Gemini fails or key is missing, check if Groq Meta Llama 3.3 70B is available
    const groqKey = (typeof window !== 'undefined' && window.templeVerseGroq?.getGroqApiKey?.()) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('groq_api_key') : '') ||
      (typeof window !== 'undefined' && window.TEMPLEVERSE_CONFIG?.groq?.apiKey) ||
      (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) || '';

    if (groqKey && groqKey.trim().startsWith('gsk_') && typeof fetch === 'function') {
      try {
        const groqAnswer = await this.callGroqFallback(userQuestion, context, systemPrompt, groqKey.trim());
        if (groqAnswer && groqAnswer.trim().length > 20) {
          console.info("[TempleVerse] Gemini unavailable; successfully generated text response via Groq Meta Llama 3.3 70B.");
          this.conversationHistory.push({ role: 'user', text: userQuestion });
          this.conversationHistory.push({ role: 'model', text: groqAnswer });
          return groqAnswer;
        }
      } catch (groqErr) {
        console.warn("[TempleVerse Gemini] Groq fallback attempt failed, falling back to local grounded intelligence:", groqErr);
      }
    }

    // Tier 3 Fallback: Always deliver an accurate, tailored grounded answer from the verified 200-temple dataset
    const answer = this.generateLocalGroundedAnswer(userQuestion, activeTemple, lastError);

    // Record in conversation history
    this.conversationHistory.push({ role: 'user', text: userQuestion });
    this.conversationHistory.push({ role: 'model', text: answer });

    return answer;
  }

  /**
   * Calls Groq Meta Llama 3.3 70B REST API as a resilient high-speed text fallback
   */
  async callGroqFallback(userQuestion, context, systemPrompt, groqKey) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `=== VERIFIED ALL-INDIA TEMPLEVERSE GROUNDING CONTEXT ===\n${context}\n\n=== DEVOTEE QUESTION ===\n${userQuestion}\n\nAnswer the devotee's specific question accurately and respectfully based strictly on the verified heritage dataset above.` }
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.35,
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  }

  /**
   * Calls the Google Gemini Generative Language REST API with multi-turn dialogue support
   */
  async callGeminiAPI(model, userQuestion, context, systemPrompt) {
    if (typeof fetch !== 'function') {
      throw new Error("fetch is not supported in this environment");
    }
    const url = `${this.config.apiEndpoint}/${model}:generateContent?key=${this.config.apiKey}`;

    // Format previous turns (up to last 6 messages) for multi-turn conversational context
    const contents = [];
    const recentHistory = this.conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      });
    }

    // Append the current turn with RAG grounding context
    const currentPrompt = `=== VERIFIED ALL-INDIA TEMPLEVERSE GROUNDING CONTEXT ===\n${context}\n\n=== USER QUESTION ===\n${userQuestion}\n\nAnswer the user's specific question accurately, respectfully, and thoroughly based on the verified dataset above. If it's a follow-up question (e.g. regarding timings, history, rituals, or guidelines), directly and specifically answer that aspect.`;

    contents.push({
      role: "user",
      parts: [{ text: currentPrompt }]
    });

    const payload = {
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1400
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error("No text candidate returned from Gemini API");
    }

    return textPart;
  }

  /**
   * Retrieves all verified temples from memory
   */
  getAllTemples() {
    if (typeof getAllTemplesList === 'function') {
      const list = getAllTemplesList();
      if (list && list.length) return list;
    }
    const byState = (typeof window !== 'undefined' && (window.ALL_INDIA_TEMPLES_BY_STATE || window.NORTH_INDIA_TEMPLES_BY_STATE)) ||
      (typeof global !== 'undefined' && (global.ALL_INDIA_TEMPLES_BY_STATE || global.NORTH_INDIA_TEMPLES_BY_STATE)) || {};
    const stateNames = {
      'IN-RJ': 'Rajasthan', 'IN-MH': 'Maharashtra', 'IN-TN': 'Tamil Nadu',
      'IN-KA': 'Karnataka', 'IN-KL': 'Kerala', 'IN-AP': 'Andhra Pradesh',
      'IN-TG': 'Telangana', 'IN-UP': 'Uttar Pradesh', 'IN-GJ': 'Gujarat',
      'IN-WB': 'West Bengal', 'IN-MP': 'Madhya Pradesh', 'IN-BR': 'Bihar',
      'IN-PB': 'Punjab', 'IN-HR': 'Haryana', 'IN-UK': 'Uttarakhand',
      'IN-HP': 'Himachal Pradesh', 'IN-JK': 'Jammu & Kashmir', 'IN-DL': 'Delhi'
    };
    const list = [];
    for (const [st, tlist] of Object.entries(byState)) {
      tlist.forEach(t => {
        list.push({
          ...t,
          stateId: st,
          stateName: t.stateName || stateNames[st] || st
        });
      });
    }
    return list;
  }

  /**
   * Identifies which temple is being asked about (resolves name, pronouns, or active context)
   */
  resolveTempleFromQuery(query, explicitTemple = null) {
    if (explicitTemple && typeof explicitTemple === 'object') {
      return explicitTemple;
    }

    const all = this.getAllTemples();
    const qLower = (query || '').toLowerCase().trim();

    // 1. Check for exact or high-confidence temple name match in query
    for (const t of all) {
      const nameLower = t.name.toLowerCase();
      // Base name without generic suffix (e.g. "brihadeeswarar", "kedarnath", "vaishno devi")
      const baseName = nameLower.replace(/\b(temple|mandir|kovil|gufa|dham|shrine|bhawan|cave)\b/gi, '').trim();

      if (qLower === nameLower || qLower.includes(nameLower)) {
        return t;
      }
      if (baseName.length >= 4 && qLower.includes(baseName)) {
        return t;
      }
      if (t.fullName && qLower.includes(t.fullName.toLowerCase())) {
        return t;
      }
    }

    // 2. Check pronouns and conversational follow-up patterns
    // e.g. "what are the timings?", "tell me about its history", "who built it?", "what are the rituals here?"
    const isFollowUp = /\b(this|here|it|the temple|this temple|that temple|its|same temple|about it|there|this mandir)\b/i.test(qLower) ||
      /^(what|when|how|who|why|tell me|give me|explain|can|is|are|details of|where)\b/i.test(qLower);

    const isAspectTerm = /timing|darshan|ritual|pooja|puja|history|built|builder|dress|reach|festival|legend|story|mystery|deity|guideline|ticket|cost|fee|rules|open|close|architecture|aarti/i.test(qLower);

    if ((isFollowUp || isAspectTerm) && this.currentTemple) {
      return this.currentTemple;
    }

    return null;
  }

  /**
   * Detects the specific attribute/aspect requested in a follow-up query
   */
  detectAspect(query) {
    const q = (query || '').toLowerCase();

    if (/timing|darshan time|hours|open|close|when to visit|slot|schedule|morning|evening|aarti time/i.test(q)) {
      return 'timings';
    }
    if (/ritual|pooja|puja|sewa|seva|aarti|abhishekam|pradakshina|parikrama|vow|mannat|offering|deepam|archana|prasadam|prasad|holy water|ghee/i.test(q)) {
      return 'rituals';
    }
    if (/history|origin|built|builder|dynasty|century|ruler|king|founded|how old|historical|inscriptions|ancient|who built|chola|pandya|gupta|shankaracharya/i.test(q)) {
      return 'history';
    }
    if (/architectur|style|vimana|gopuram|carving|stone|sculpture|structure|mandapam|pillar|pillars|nagara|dravidian|vesara|shikhara|mandapa|rock/i.test(q)) {
      return 'architecture';
    }
    if (/story|stories|legend|legends|mythology|myth|mystery|miracle|purana|folklore|tale|significance|why sacred|how it came|secret|shadow|curse|boon/i.test(q)) {
      return 'legends_stories';
    }
    if (/dress|wear|clothes|clothing|rules|rule|guideline|guidelines|etiquette|allowed|camera|mobile|shoes|counter|entry fee|ticket|vip|cost|pass|fee|locker/i.test(q)) {
      return 'dress_code_guidelines';
    }
    if (/reach|distance|route|nearest|airport|railway|station|bus|train|drive|flight|transport|trek|road|how can i go|where is it located|how to get/i.test(q)) {
      return 'how_to_reach';
    }
    if (/festival|festivals|celebration|celebrated|utsavam|utsav|brahmotsavam|fair|mela|annual/i.test(q)) {
      return 'festivals';
    }
    if (/deity|god|goddess|presiding|idol|murti|avatar|form|blessing|speciality|purpose|why visit|who is worshipped|who is the god/i.test(q)) {
      return 'deity_significance';
    }

    return 'full_overview';
  }

  /**
   * Detects semantic prayer intents and granular disease requests from user query
   */
  extractIntents(query) {
    const q = (query || '').toLowerCase();
    const intents = [];

    // 1. Specific Disease Intents (takes priority over generic health)
    if (/\b(skin|psoriasis|vitiligo|eczema|rash|rashes|smallpox|chickenpox|measles|leucoderma|dermatolog\w*|spider\s*bite\w*)\b/i.test(q)) {
      intents.push('disease:skin');
    }
    if (/\b(autis\w*|seizur\w*|epilep\w*|mental\s*wellbeing|emotional\s*distress|behavioral\s*distress|psychosis|insomnia|depression|anxiety|tremor|parkinson|phobia|nightmare|speech\s*anxiety|temple\s*stay|pradakshina)\b/i.test(q)) {
      intents.push('disease:mental_autism');
    }
    if (/\b(kidney\w*|renal|creatinine|nephro\w*|dialysis|ckd)\b/i.test(q)) {
      intents.push('disease:kidney');
    }
    if (/\b(asthma|respiratory|breath\w*|wheez\w*|lung\w*|bronch\w*|chronic\s*cough)\b/i.test(q)) {
      intents.push('disease:respiratory');
    }
    if (/\b(heart\w*|cardiac|cardio\w*|blood\s*pressure|hypertension|bp|cardiovascular)\b/i.test(q)) {
      intents.push('disease:heart');
    }
    if (/\b(diabet\w*|sugar|blood\s*sugar|glucose)\b/i.test(q)) {
      intents.push('disease:diabetes');
    }
    if (/\b(paralysis|stroke|bone\w*|joint\w*|arthritis|rheumat\w*|spine|back\s*pain|ortho\w*|fracture\w*)\b/i.test(q)) {
      intents.push('disease:paralysis_bone');
    }
    if (/\b(eye\w*|vision|sight|blind\w*|cataract|ophthal\w*)\b/i.test(q)) {
      intents.push('disease:eye');
    }
    if (/\b(throat|speech|stammer\w*|voice|vocal|thyroid|mute|stutter\w*)\b/i.test(q)) {
      intents.push('disease:throat_speech');
    }
    if (/\b(digest\w*|liver|stomach|ulcer|gastric|jaundice|gastro\w*|abdomen)\b/i.test(q)) {
      intents.push('disease:digestive');
    }
    if (/\b(tooth|teeth|dental|gum|oral)\b/i.test(q)) {
      intents.push('disease:dental');
    }

    // Generic health intent ONLY when no specific disease intent is triggered
    const hasSpecificDisease = intents.some(it => it.startsWith('disease:'));
    if (!hasSpecificDisease && /\b(health|heal|cure|curing|disease|illness|medical|medicine|ailment|physical|treatment|pain|fever|ayur|wellness)\b/i.test(q)) {
      intents.push('health');
    }

    // Standard prayer intents
    if (/child|children|baby|babies|progeny|fertility|conception|pregnancy|childbirth|santan|garba|santana|offspring/.test(q)) {
      intents.push('child');
    }
    if (/visa|abroad|foreign|passport|overseas|emigrat|greencard|us visa|h1b/.test(q)) {
      intents.push('visa');
    }
    if (/marr|wed|matrimon|spouse|husband|wife|kalyan|vivah|mangalya|match/.test(q)) {
      intents.push('marriage');
    }
    if (/wealth|prosper|money|business|financ|rich|debt|lakshmi|kubera|cash|loss|profit|job|career|employment/.test(q)) {
      intents.push('wealth');
    }
    if (/educat|study|studies|exam|learn|knowledg|vidya|saraswati|school|college|academic|memory/.test(q)) {
      intents.push('education');
    }
    if (/wish|wishes|mannat|boon|desire|fulfil|fulfill|prarthana|vow|miracle/.test(q)) {
      intents.push('wishes');
    }
    if (/shiva|mahadev|lingam|nataraja|jyotirlinga|kedarnath|somnath|kashi/.test(q)) intents.push('shiva');
    if (/vishnu|venkateswara|perumal|narayana|balaji|tirupati|badrinath/.test(q)) intents.push('vishnu');
    if (/krishna|govinda|radha|dwarka|guruvayur|vrindavan/.test(q)) intents.push('krishna');
    if (/devi|goddess|durga|kali|shakti|amman|mariamman|vaishno|meenakshi|kamakhya/.test(q)) intents.push('goddess');
    if (/ganesha|ganapati|vinayaka|pillayar/.test(q)) intents.push('ganesha');
    if (/murugan|kartikeya|subramanya|subrahmanya|palani/.test(q)) intents.push('murugan');
    if (/hanuman|anjaneya|maruti|bajrangbali|sankat mochan/.test(q)) intents.push('hanuman');
    return intents;
  }

  /**
   * Scores a temple against a query and detected intents with strict intent gating
   */
  scoreTemple(t, query, intents) {
    let score = 0;
    const qLower = (query || '').toLowerCase();
    const specStr = (t.speciality || []).join(' ').toLowerCase();
    const unique = (t.uniqueness || '').toLowerCase();
    const belief = (t.belief || '').toLowerCase();
    const ritual = (t.ritual || '').toLowerCase();
    const name = (t.name || '').toLowerCase();
    const deity = (t.deity || '').toLowerCase();
    const state = (t.stateName || '').toLowerCase();
    const loc = (t.location || '').toLowerCase();
    const theme = (t.problemTheme || '').toLowerCase();
    const diseases = (t.specificDiseases || []);
    const kw = (t.keywords || []).map(k => String(k).toLowerCase());
    const allText = [name, t.fullName, deity, state, loc, unique, belief, ritual, specStr, theme].join(' ').toLowerCase();

    const blessingIntents = intents.filter(it => it.startsWith('disease:') || ['visa', 'marriage', 'child', 'wealth', 'education', 'health', 'wishes'].includes(it));
    const deityIntents = intents.filter(it => ['shiva', 'vishnu', 'krishna', 'goddess', 'ganesha', 'murugan', 'hanuman'].includes(it));

    // 1. BLESSING & SPECIFIC DISEASE STRICT GATING:
    // When devotee queries a specific blessing or health concern, only shrines that specifically address it can match.
    if (blessingIntents.length > 0) {
      let matchesBlessing = false;

      // Visa (Foreign travel / overseas visa blessings)
      if (intents.includes('visa')) {
        if (specStr.includes('visa') || /chilkur|visa balaji/.test(name) || /visa|overseas|foreign travel/.test(unique) || /visa|overseas|foreign travel/.test(belief) || /visa|overseas|foreign travel/.test(theme)) {
          score += 350;
          matchesBlessing = true;
        }
      }

      // Specific Diseases (Top Priority)
      if (intents.includes('disease:skin') && (diseases.includes('Skin & Psoriasis') || /\b(skin|psoriasis|vitiligo|eczema|rash|smallpox|chickenpox|measles|spider\s*bite)\b/i.test(theme) || kw.some(k => /\b(skin|psoriasis|vitiligo|eczema|rash|smallpox)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:mental_autism') && (diseases.includes('Mental Wellbeing & Autism') || /\b(autism|seizure|epilepsy|mental\s*wellbeing|emotional\s*distress|behavioral\s*distress|psychosis|insomnia|tremor|parkinson)\b/i.test(theme) || kw.some(k => /\b(autism|seizure|epilepsy|mental|psychosis|insomnia|tremor|parkinson)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:kidney') && (diseases.includes('Kidney & Renal') || /\b(kidney|renal|creatinine|nephro|ckd)\b/i.test(theme) || kw.some(k => /\b(kidney|renal|creatinine)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:respiratory') && (diseases.includes('Respiratory & Asthma') || /\b(asthma|respiratory|breath|wheez|lung|bronch)\b/i.test(theme) || kw.some(k => /\b(asthma|respiratory|breath)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:heart') && (diseases.includes('Heart & Blood Pressure') || /\b(heart|cardiac|cardio|blood\s*pressure|hypertension|bp)\b/i.test(theme) || kw.some(k => /\b(heart|cardiac|cardio)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:diabetes') && (diseases.includes('Diabetes & Metabolism') || /\b(diabet|sugar|glucose)\b/i.test(theme) || kw.some(k => /\b(diabet|sugar)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:paralysis_bone') && (diseases.includes('Paralysis, Bone & Joint') || /\b(paralysis|stroke|bone|joint|arthritis|rheumat|spine|back\s*pain|ortho)\b/i.test(theme) || kw.some(k => /\b(paralysis|stroke|bone|joint|arthritis|rheumat)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:eye') && (diseases.includes('Eye & Vision') || /\b(eye|vision|sight|blind|cataract)\b/i.test(theme) || kw.some(k => /\b(eye|vision|sight)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:throat_speech') && (diseases.includes('Throat, Speech & Thyroid') || /\b(throat|speech|stammer|voice|vocal|thyroid|mute)\b/i.test(theme) || kw.some(k => /\b(throat|speech|stammer|voice|thyroid)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:digestive') && (diseases.includes('Digestive & Liver') || /\b(digest|liver|stomach|ulcer|gastric|jaundice|abdomen)\b/i.test(theme) || kw.some(k => /\b(digest|liver|stomach|ulcer)\b/i.test(k)))) {
        score += 350;
        matchesBlessing = true;
      }
      if (intents.includes('disease:dental') && (diseases.includes('Dental & Oral') || /\b(tooth|teeth|dental|gum)\b/i.test(theme))) {
        score += 350;
        matchesBlessing = true;
      }

      // Generic Health (only when no specific disease is requested)
      if (intents.includes('health')) {
        if (specStr.includes('health') || /healing|medicine|cure|disease|illness|vaitheeswaran|vaidyanath/.test(unique) || /health|illness|healing/.test(belief)) {
          score += 200;
          matchesBlessing = true;
        }
      }

      // Other primary blessings
      if (intents.includes('marriage')) {
        if (specStr.includes('marriage') || /marriage|wedding|kalyana|vivaha|spouse|matrimon/.test(unique) || /marriage|wedding|kalyana|vivaha|spouse|matrimon/.test(belief) || /marriage|wedding|kalyana|vivaha|spouse|matrimon/.test(theme)) {
          score += 300;
          matchesBlessing = true;
        }
      }
      if (intents.includes('child')) {
        if (specStr.includes('child') || /child|fertility|conception|pregnancy|progeny|offspring/.test(unique) || /child|fertility|conception|pregnancy|progeny|offspring/.test(belief) || /child|fertility|conception|pregnancy|progeny|offspring/.test(theme) || /garba|santana|sheetla/.test(name)) {
          score += 300;
          matchesBlessing = true;
        }
      }
      if (intents.includes('wealth')) {
        if (/wealth|prosperity/.test(specStr) || /wealth|prosperity|financial|business|debt|lakshmi|kubera/.test(unique) || /wealth|prosperity|financial|business|debt|lakshmi|kubera/.test(belief) || /wealth|prosperity|financial|business|debt|lakshmi|kubera/.test(theme) || /vaithamanidhi|kubera|lakshmi|padmanabha/.test(name)) {
          score += 300;
          matchesBlessing = true;
        }
      }
      if (intents.includes('education')) {
        if (/education/.test(specStr) || /education|learning|vidya|saraswati|exam|studies/.test(unique) || /education|learning|vidya|saraswati|exam|studies/.test(belief) || /education|learning|vidya|saraswati|exam|studies/.test(theme) || /saraswati|hayagriva|mookambika/.test(name) || /saraswati|hayagriva/.test(deity)) {
          score += 300;
          matchesBlessing = true;
        }
      }
      if (intents.includes('wishes')) {
        if (/wishes/.test(specStr) || /mannat|wish|boon/.test(belief) || /mannat|wish|boon/.test(unique) || /mannat|wish|boon/.test(theme) || /khatu|salasar|vaishno/.test(name)) {
          score += 250;
          matchesBlessing = true;
        }
      }

      // If devotee queried a blessing or disease, non-matching shrines MUST be disqualified!
      if (!matchesBlessing) {
        return 0;
      }
    }

    // 2. DEITY GATING (when ONLY deity intent is present, e.g. "shiva temples")
    if (blessingIntents.length === 0 && deityIntents.length > 0) {
      let matchesDeity = false;
      if (deityIntents.includes('shiva') && (deity.includes('shiva') || specStr.includes('shiva') || deity.includes('mahadev') || deity.includes('lingam') || unique.includes('jyotirlinga') || belief.includes('jyotirlinga'))) matchesDeity = true;
      if (deityIntents.includes('vishnu') && (deity.includes('vishnu') || specStr.includes('vishnu') || deity.includes('perumal') || deity.includes('narayana') || deity.includes('venkateswara') || deity.includes('balaji'))) matchesDeity = true;
      if (deityIntents.includes('krishna') && (deity.includes('krishna') || specStr.includes('krishna') || deity.includes('govinda') || deity.includes('radha') || deity.includes('dwarkadhish'))) matchesDeity = true;
      if (deityIntents.includes('goddess') && (deity.includes('devi') || specStr.includes('goddess') || deity.includes('goddess') || deity.includes('amman') || deity.includes('shakti') || deity.includes('kali') || deity.includes('durga'))) matchesDeity = true;
      if (deityIntents.includes('ganesha') && (deity.includes('ganesha') || specStr.includes('ganesha') || deity.includes('vinayaka') || deity.includes('pillayar') || deity.includes('ganapati'))) matchesDeity = true;
      if (deityIntents.includes('murugan') && (deity.includes('murugan') || specStr.includes('murugan') || deity.includes('kartikeya') || deity.includes('subramanya') || deity.includes('subrahmanya'))) matchesDeity = true;
      if (deityIntents.includes('hanuman') && (deity.includes('hanuman') || specStr.includes('hanuman') || deity.includes('anjaneya') || deity.includes('maruti') || deity.includes('bajrangbali'))) matchesDeity = true;

      if (!matchesDeity) {
        return 0;
      }
      score += 150;
    }

    // 3. Fine-grained bonus ranking for exact name, deity, or location matches
    const stop = new Set([
      'the','is','are','for','in','of','to','and','a','that','this','what','which','tell','me',
      'temple','temples','mandir','mandirs','shrine','shrines','give','about','some','show',
      'their','everything','useful','enter','entered','every','with','from','related','associated',
      'dedicated','regarding','pertaining','search','find','please','information','details',
      'place','places','list','names','name','know','query','guidance','best','famous','top',
      'prominent','all','any','help','want','need','prayer','prayers','cure','cures'
    ]);
    const tokens = qLower.split(/[^a-z0-9]+/).filter(w => w.length > 2 && !stop.has(w));
    tokens.forEach(tok => {
      if (name.includes(tok)) score += 30;
      else if (deity.includes(tok)) score += 20;
      else if (state.includes(tok) || loc.includes(tok)) score += 15;
      else if (specStr.includes(tok)) score += 12;
    });

    return score;
  }

  /**
   * Finds top relevant temples for query with strict threshold gating
   */
  findRelevantTemples(query, limit = 6) {
    const all = this.getAllTemples();
    if (!all.length) return [];

    const intents = this.extractIntents(query);
    const scored = all.map(t => ({
      temple: t,
      score: this.scoreTemple(t, query, intents)
    })).filter(x => x.score > 0);

    scored.sort((a, b) => b.score - a.score);

    // If strong intent matched, never pad with low-relevance or noise matches
    if (scored.length > 0 && scored[0].score >= 100) {
      const relevant = scored.filter(s => s.score >= 100);
      return relevant.slice(0, limit);
    }

    return scored.slice(0, limit);
  }

  /**
   * Constructs RAG context by searching local verified dataset for relevant matches
   */
  buildRAGContext(query, specificTemple) {
    if (specificTemple) {
      return `Target Temple: ${specificTemple.name}
Full Official Title: ${specificTemple.fullName || specificTemple.name}
Presiding Deity: ${specificTemple.deity}
Location: ${specificTemple.location || specificTemple.stateName}
State & Region: ${specificTemple.stateName} (${specificTemple.region || 'India'})
${specificTemple.problemTheme ? `Traditional Prayer Purpose & Medical Distinction: ${specificTemple.problemTheme}` : ''}
${(specificTemple.specificDiseases && specificTemple.specificDiseases.length > 0) ? `Specific Disease Categories: ${specificTemple.specificDiseases.join(', ')}` : ''}
Sacred Uniqueness: ${specificTemple.uniqueness || 'N/A'}
Architecture: ${specificTemple.architecture || 'N/A'}
History: ${specificTemple.history || 'N/A'}
Daily Rituals: ${specificTemple.ritual || 'N/A'}
Major Festivals: ${specificTemple.festival || 'N/A'}
Sacred Beliefs & Traditions: ${specificTemple.belief || 'N/A'}
Visitor Information: ${specificTemple.visitorInfo || 'N/A'}
Official Source: ${specificTemple.source || 'Temple Trust'}`;
    }

    const matched = this.findRelevantTemples(query, 6);
    if (matched.length > 0) {
      return matched.map((m, idx) => {
        const t = m.temple;
        return `[Temple ${idx + 1}] ${t.name}
- Presiding Deity: ${t.deity}
- State & Region: ${t.stateName} (${t.region || 'India'})
- Location: ${t.location || t.stateName}
- Speciality & Blessings: ${(t.speciality || []).join(', ')}
${t.problemTheme ? `- Traditional Prayer Purpose & Health Distinction: ${t.problemTheme}` : ''}
${(t.specificDiseases && t.specificDiseases.length > 0) ? `- Specific Disease Tags: ${t.specificDiseases.join(', ')}` : ''}
- Sacred Purpose & Uniqueness: ${t.uniqueness || 'N/A'}
- Pilgrim Beliefs & Vows: ${t.belief || 'N/A'}
- Daily Rituals & Distinctive Practices: ${t.ritual || 'N/A'}
- Visitor Information & Timings: ${t.visitorInfo || 'N/A'}`;
      }).join('\n\n');
    }

    return `Verified All-India Temple Heritage Dataset: 200 prominent shrines across North & South India covering Jyotirlingas, Divya Desams, Shakti Peethas, Himalayan cave shrines, Dravidian gopurams, and Nagara stone architecture.`;
  }

  getSystemPrompt() {
    return `You are TempleVerse AI, an authoritative, culturally respectful, and intelligent Indian Temple Heritage Assistant.
Your core mission is to provide accurate, culturally rich, and directly relevant insights about Indian temples based on the verified dataset.
When a user asks follow-up questions about a specific temple (such as timings, rituals, history, architecture, legends, or visitor rules), provide a direct, tailored, and comprehensive answer for that specific aspect without repeating standard overview boilerplate.`;
  }

  cleanText(str) {
    if (!str) return '';
    return str
      .replace(/^Problem\/theme:\s*/i, '')
      .replace(/\bDistinction:\s*/i, '• ')
      .replace(/\[Secondary source;[^\]]*\]/gi, '')
      .trim();
  }

  /**
   * Helper to parse visitorInfo into structured fields
   */
  parseVisitorInfo(visitorInfoStr) {
    const raw = visitorInfoStr || '';
    const timingsMatch = raw.match(/Timings?:\s*([\s\S]*?)(?=\s*(?:Dress Code|Entry Rules|Ticket Price|Attire|$))/i);
    const dressMatch = raw.match(/(?:Dress Code|Attire):\s*([\s\S]*?)(?=\s*(?:Timings|Entry Rules|Ticket Price|$))/i);
    const entryMatch = raw.match(/Entry Rules:\s*([\s\S]*?)(?=\s*(?:Timings|Dress Code|Ticket Price|$))/i);
    const ticketMatch = raw.match(/Ticket Price:\s*([\s\S]*?)$/i);

    return {
      timings: timingsMatch ? timingsMatch[1].trim().replace(/\.$/, '') : '06:00 AM – 12:30 PM & 04:00 PM – 08:30 PM',
      dressCode: dressMatch ? dressMatch[1].trim().replace(/\.$/, '') : 'Traditional Indian modest attire (Dhoti/Kurta for men, Saree/Salwar for women; avoid shorts and sleeveless tops)',
      entryRules: entryMatch ? entryMatch[1].trim().replace(/\.$/, '') : 'Free queue entry; footwear must be deposited outside; photography prohibited in the inner sanctum sanctorum',
      ticketPrice: ticketMatch ? ticketMatch[1].trim().replace(/\.$/, '') : 'Free general darshan for all pilgrims; special darshan / puja tickets available at official counters'
    };
  }

  /**
   * Grounded response generated directly from the verified 200-temple dataset
   */
  generateLocalGroundedAnswer(query, targetTemple = null, error = null) {
    const all = this.getAllTemples();

    // 1. Resolve which temple is in scope
    const temple = targetTemple || this.resolveTempleFromQuery(query);

    if (temple) {
      this.currentTemple = temple;
      const aspect = this.detectAspect(query);
      return this.formatAspectResponse(temple, aspect, query);
    }

    // 2. Multi-temple intent search (e.g. child wellness, visa, health, marriage, wealth, education)
    const intents = this.extractIntents(query);
    const scored = all.map(t => ({
      temple: t,
      score: this.scoreTemple(t, query, intents)
    })).filter(x => x.score > 0);

    scored.sort((a, b) => b.score - a.score);

    if (scored.length === 0) {
      return this.formatOverviewResponse(query);
    }

    // Strictly filter out low-relevance or noise padding when a strong intent is active
    let relevantMatches = scored;
    if (scored.length > 0 && scored[0].score >= 100) {
      relevantMatches = scored.filter(s => s.score >= 100);
    }

    if (relevantMatches.length === 0) {
      return this.formatOverviewResponse(query);
    }

    if (intents.length > 1) {
      return this.formatMultiIntentResponse(query, intents, relevantMatches);
    }

    return this.formatThemeResponse(query, relevantMatches.slice(0, 5));
  }

  /**
   * Dispatches aspect-specific response generator for a single temple
   */
  formatAspectResponse(t, aspect, query) {
    switch (aspect) {
      case 'timings':
        return this.formatTimingsResponse(t);
      case 'rituals':
        return this.formatRitualsResponse(t);
      case 'history':
        return this.formatHistoryResponse(t);
      case 'architecture':
        return this.formatArchitectureResponse(t);
      case 'legends_stories':
        return this.formatLegendsResponse(t);
      case 'dress_code_guidelines':
        return this.formatGuidelinesResponse(t);
      case 'how_to_reach':
        return this.formatTravelResponse(t);
      case 'festivals':
        return this.formatFestivalsResponse(t);
      case 'deity_significance':
        return this.formatDeityBlessingsResponse(t);
      case 'full_overview':
      default:
        return this.formatSingleTempleResponse(t);
    }
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 1: Timings & Darshan Hours
     ──────────────────────────────────────────────────────────── */
  formatTimingsResponse(t) {
    const v = this.parseVisitorInfo(t.visitorInfo);
    return `### 🕰️ **Sacred Darshan Timings & Aarti Schedule: ${t.name}**
*📍 ${t.location || t.stateName} (${t.region || 'India'}) • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### ⏰ **Daily Darshan Schedule**
- **Darshan Timings:** **${v.timings}**
- **Morning Darshan:** Recommended early between **05:30 AM – 07:30 AM** during morning abhishek and aarti.
- **Evening Darshan:** Devotees gather around **06:00 PM – 07:30 PM** for the evening deeparadhana.

#### 🪔 **Daily Aarti & Ritual Schedule**
${t.ritual ? `- **Daily Ritual Schedule:** ${this.cleanText(t.ritual)}` : '- **Daily Aartis:** Mangala Aarti at dawn, Madhyana Bhog at noon, Sandhya Deeparadhana at sunset, and Shayan Aarti before night closure.'}

#### 🎫 **Darshan Entry & Queue Guidelines**
- **Ticket Price:** ${v.ticketPrice}
- **Entry Rules:** ${v.entryRules}
- **Dress Code:** ${v.dressCode}

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"What are the daily rituals and offerings?"*
- *"Tell me the ancient history & who built it"*
- *"What are the sacred legends & miracles?"*
- *"What is the dress code and rules?"*
- *"How do I reach ${t.name}?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 2: Daily Rituals & Sacred Offerings
     ──────────────────────────────────────────────────────────── */
  formatRitualsResponse(t) {
    const v = this.parseVisitorInfo(t.visitorInfo);
    return `### 🪔 **Sacred Daily Rituals & Puja Traditions: ${t.name}**
*📍 ${t.location || t.stateName} • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### 🪔 **Daily Ritual Sequence & Offerings**
${t.ritual ? `- **Core Daily Rituals:** ${this.cleanText(t.ritual)}` : '- **Daily Sequence:** Begins with dawn awakening (Suprabhatam/Mangala Aarti), followed by sacred holy water bath (Abhishekam), divine alankaram, noon bhog offering, and evening deeparadhana.'}
${t.uniqueness ? `- **Distinctive Ritual Practice:** ${this.cleanText(t.uniqueness)}` : ''}

#### 🙏 **Pilgrim Vows, Prarthana & Offerings**
${t.belief ? `- **Sacred Beliefs & Vows:** ${this.cleanText(t.belief)}` : '- **Devotional Vows:** Pilgrims perform pradakshina (circumambulation), light sacred deepams (ghee/oil lamps), offer coconuts, fresh flowers, and sacred bilva/tulsi leaves.'}

#### ⏰ **Darshan Timings for Rituals**
- **Darshan Hours:** ${v.timings}
- **Prasadam:** Consecrated temple prasadam is distributed to devotees following the noon and evening aarti.

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"What are the darshan timings?"*
- *"Tell me the legends & miracles of ${t.name}"*
- *"Who built this temple and what is its history?"*
- *"What are the annual festivals celebrated here?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 3: History, Dynasties & Construction
     ──────────────────────────────────────────────────────────── */
  formatHistoryResponse(t) {
    return `### 🏛️ **Historical Chronology & Construction: ${t.name}**
*📍 ${t.location || t.stateName} (${t.region || 'India'}) • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### 📜 **Dynastic Patronage & Historical Era**
${t.history ? `- **Historical Heritage:** ${this.cleanText(t.history)}` : `- **Ancient Heritage:** One of India's historically revered sanctuaries, patronized across centuries by royal dynasties and saint-philosophers.`}

#### 🗿 **Architectural School & Antiquity**
${t.architecture ? `- **Architectural Style:** ${this.cleanText(t.architecture)}` : `- **Structure:** Ancient stone temple architecture adhering to classical Agama and Shilpa Shastra principles.`}

#### ✨ **Sacred Significance Through the Ages**
${t.uniqueness ? `- **Heritage Uniqueness:** ${this.cleanText(t.uniqueness)}` : ''}
${t.belief ? `- **Puranic & Historical Lore:** ${this.cleanText(t.belief)}` : ''}

*(Official Archive Source: ${t.source || 'Temple Trust & Archaeological Survey'})*

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"Explain the architectural style & stone carvings"*
- *"What are the sacred legends & divine mysteries?"*
- *"What are the darshan timings & aarti schedule?"*
- *"What are the daily rituals & sevas?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 4: Architecture & Engineering
     ──────────────────────────────────────────────────────────── */
  formatArchitectureResponse(t) {
    return `### 🗿 **Architectural Style & Sacred Engineering: ${t.name}**
*📍 ${t.location || t.stateName} • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### 🏛 **Architectural Design & Structure**
${t.architecture ? `- **Architectural Style:** ${this.cleanText(t.architecture)}` : '- **Sacred Geometry:** Designed in classical temple architecture adhering to sacred Vastu Purusha Mandala principles.'}

#### ✨ **Monumental Highlights & Sculptural Art**
${t.uniqueness ? `- **Unique Engineering / Carvings:** ${this.cleanText(t.uniqueness)}` : ''}
${t.history ? `- **Construction Era:** ${this.cleanText(t.history)}` : ''}

#### 🪔 **Sanctum Sanctorum (Garbhagriha)**
- The sanctum is oriented to harness divine energy, holding the consecrated murti of **${t.deity.split('.')[0]}**.
- Intricate stone pillars, pillared mandapams, and sacred circumambulatory pathways (*Pradakshina Path*) designed for resonant chanting and meditation.

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"Tell me the history and who built it"*
- *"What are the sacred legends and mysteries?"*
- *"What are the darshan timings?"*
- *"What are the daily rituals performed here?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 5: Legends, Puranic Lore & Mysteries
     ──────────────────────────────────────────────────────────── */
  formatLegendsResponse(t) {
    return `### 📜 **Sacred Legends, Puranic Lore & Mysteries: ${t.name}**
*📍 ${t.location || t.stateName} • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### ✨ **The Sacred Divine Legend**
${t.belief ? `- **Puranic Lore & Tradition:** ${this.cleanText(t.belief)}` : `- **Sacred Manifestation:** Devotees revere this sacred shrine as a divine manifestation of ${t.deity.split('.')[0]}, radiating powerful spiritual vibrations.`}

#### 🪔 **Sacred Uniqueness & Divine Boons**
${t.uniqueness ? `- **Miraculous Significance:** ${this.cleanText(t.uniqueness)}` : ''}
- Devotees travel from across India seeking blessings for **${(t.speciality || []).join(', ') || 'spiritual peace and fulfillment of sincere prayers'}**.

#### 🙏 **Living Faith & Traditions**
${t.ritual ? `- **Tradition in Practice:** ${this.cleanText(t.ritual)}` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"What are the exact darshan timings?"*
- *"What are the daily rituals & offerings?"*
- *"Who built this temple and what is its history?"*
- *"What is the dress code and visitor rules?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 6: Guidelines, Dress Code & Rules
     ──────────────────────────────────────────────────────────── */
  formatGuidelinesResponse(t) {
    const v = this.parseVisitorInfo(t.visitorInfo);
    return `### ℹ️ **Pilgrim Guidelines, Dress Code & Visiting Rules: ${t.name}**
*📍 ${t.location || t.stateName} • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### 👔 **Prescribed Dress Code**
- **Strict Dress Code:** ${v.dressCode}

#### 🚪 **Entry Rules & Darshan Etiquette**
- **Footwear:** Must be deposited at the temple shoe stall outside before entering the sacred complex.
- **Electronics & Photography:** ${v.entryRules.includes('photography') || v.entryRules.includes('mobile') ? v.entryRules : 'Photography is prohibited inside the inner sanctum sanctorum (Garbhagriha). Mobile phones must be kept on silent mode or in lockers.'}
- **Entry Guidelines:** ${v.entryRules}

#### 🎫 **Ticketing & Darshan Charges**
- **Darshan Fee:** ${v.ticketPrice}
- **Visiting Timings:** ${v.timings}

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"How do I reach ${t.name}?"*
- *"What are the darshan timings and aarti schedule?"*
- *"What are the daily rituals & special sevas?"*
- *"Tell me the ancient history & legends"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 7: Travel Logistics & How to Reach
     ──────────────────────────────────────────────────────────── */
  formatTravelResponse(t) {
    const v = this.parseVisitorInfo(t.visitorInfo);
    return `### 📍 **Travel Logistics & How to Reach: ${t.name}**
*📍 Located in ${t.location || t.stateName} (${t.region || 'India'})*

---

#### 🗺️ **Exact Location & Coordinates**
- **State & Region:** ${t.stateName} (${t.region || 'India'})
- **Location Details:** ${t.location || t.stateName}
- **Presiding Deity:** ${t.deity.split('.')[0]}

#### 🚆 **How to Reach (Air, Rail & Road)**
- **By Air:** Connect via the nearest domestic/international airport serving ${t.stateName}.
- **By Train:** Accessible via the nearest major railway junction with frequent express trains across India.
- **By Road:** Well-connected by state highways, national highways, and regular state transport / private buses and taxis.

#### ⏰ **Recommended Darshan Schedule**
- **Darshan Timings:** ${v.timings}
- Plan your travel to arrive early in the morning for peaceful darshan and ritual viewing.

${t.mapUrl ? `👉 **[📍 Open Navigation in Google Maps](${t.mapUrl})**` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"What are the darshan timings?"*
- *"What is the dress code and rules?"*
- *"What are the daily rituals and offerings?"*
- *"Tell me the history of ${t.name}"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 8: Festivals & Auspicious Celebrations
     ──────────────────────────────────────────────────────────── */
  formatFestivalsResponse(t) {
    const v = this.parseVisitorInfo(t.visitorInfo);
    return `### 🎊 **Annual Festivals & Celebrations: ${t.name}**
*📍 ${t.location || t.stateName} • Presiding Deity: ${t.deity.split('.')[0]}*

---

#### 🎆 **Major Annual Festivals**
${t.festival ? `- **Celebrated Festivals:** ${this.cleanText(t.festival)}` : `- **Auspicious Occasions:** Major Hindu festivals including Maha Shivaratri, Navratri, Diwali, Brahmotsavam, and temple annual car festivals (*Rathotsavam*).`}

#### 🪔 **Festival Rituals & Grand Processions**
- During festive periods, special **Maha Abhishekam**, **Kalyanotsavam (celestial wedding)**, and chariot processions (*Theerthavari / Veedhi Utsavam*) take place with grand nagaswaram and thavil instrumental music.
${t.uniqueness ? `- **Festive Sanctity:** ${this.cleanText(t.uniqueness)}` : ''}

#### ℹ️ **Pilgrim Advisory for Festival Visits**
- **Darshan Timings:** ${v.timings}
- Heavy pilgrim footfall occurs during festivals; early morning tokens or online pre-booking is strongly advised.

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"What are the daily rituals and offerings?"*
- *"What are the normal darshan timings?"*
- *"What is the dress code and visitor rules?"*
- *"Tell me the sacred legends of ${t.name}"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 9: Deity & Divine Blessings
     ──────────────────────────────────────────────────────────── */
  formatDeityBlessingsResponse(t) {
    return `### 🕉️ **Presiding Deity & Divine Blessings: ${t.name}**
*📍 ${t.location || t.stateName} • Presiding Deity: ${t.deity}*

---

#### 🪔 **Presiding Deity & Divine Form**
- **Main Sanctum:** ${t.deity}
- **Divine Speciality:** ${(t.speciality || []).join(', ') || 'Spiritual Peace & Wish Fulfillment'}

#### 🙏 **Spiritual Blessings & Purpose of Prayers**
${t.belief ? `- **Sacred Beliefs & Boons:** ${this.cleanText(t.belief)}` : `- **Divine Grace:** Devotees visit ${t.name} with deep faith seeking relief from obstacles, good health, family harmony, and wish fulfillment.`}
${t.uniqueness ? `- **Sacred Purpose:** ${this.cleanText(t.uniqueness)}` : ''}

#### 🪔 **Ritual Offerings to the Deity**
${t.ritual ? `- **Daily Offerings:** ${this.cleanText(t.ritual)}` : '- Traditional offerings include holy water, fresh milk, honey, flowers, coconut, and lighting of sacred ghee deepams.'}

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}

---
💡 *Related follow-ups you can ask about ${t.name}:*
- *"What are the darshan timings?"*
- *"What are the daily rituals?"*
- *"Who built this temple and what is its history?"*
- *"What is the dress code?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     ASPECT 10: Complete Single Temple Overview (Initial Introduction)
     ──────────────────────────────────────────────────────────── */
  formatSingleTempleResponse(t) {
    const v = this.parseVisitorInfo(t.visitorInfo);
    return `### 🕉️ **${t.name}**
*${t.fullName && t.fullName !== t.name ? t.fullName : t.name}*
- **📍 Location:** ${t.location || t.stateName} (${t.region || 'India'})
- **🪔 Presiding Deity:** ${(t.deity || 'Supreme Divine').split('.')[0]}
- **🏷️ Sacred Speciality:** ${(t.speciality || []).join(', ') || 'Spiritual Peace'}

---

#### ✨ **Sacred Uniqueness**
${this.cleanText(t.uniqueness) || 'Revered pilgrimage shrine with deep spiritual sanctity and heritage.'}

#### 🏛 **Architecture & Historical Heritage**
- **Architecture Style:** ${t.architecture ? this.cleanText(t.architecture) : 'Classical stone masonry architecture.'}
- **Historical Era:** ${t.history ? this.cleanText(t.history) : 'Ancient sacred shrine maintained by official temple trust administration.'}

#### 🪔 **Daily Rituals & Annual Festivals**
${t.ritual ? `- **Daily Rituals:** ${this.cleanText(t.ritual)}` : '- **Daily Rituals:** Morning and evening Aarti, abhishek, and deeparadhana.'}
${t.festival ? `- **Major Festivals:** ${this.cleanText(t.festival)}` : ''}

#### 🙏 **Pilgrim Beliefs & Sacred Vows**
${this.cleanText(t.belief) || 'Devotees visit seeking divine blessings, peace, and wish fulfillment.'}

#### ℹ️ **Visitor Guide & Timings**
- **Darshan Timings:** ${v.timings}
- **Dress Code:** ${v.dressCode}
- **Entry Rules:** ${v.entryRules}
- **Ticket Price:** ${v.ticketPrice}

${t.mapUrl ? `[📍 View on Google Maps](${t.mapUrl})` : ''}
*(Verified Source: ${t.source || 'Temple Trust Official Archive'})*

---
💡 **Follow-up questions you can ask me about ${t.name}:**
- *"What are the exact darshan timings & aarti schedule?"*
- *"What are the daily rituals & special sevas?"*
- *"Tell me the ancient history & who built it"*
- *"Explain the architectural style & stone carvings"*
- *"What are the sacred legends & divine mysteries?"*
- *"What is the dress code & entry guidelines?"*
- *"How do I reach ${t.name} (nearest airport/train)?"*`;
  }

  /* ────────────────────────────────────────────────────────────
     MULTI-INTENT & THEME RESPONSES
     ──────────────────────────────────────────────────────────── */
  formatMultiIntentResponse(query, intents, scored) {
    let md = `### 🕉️ **Verified Temple Guidance for Your Prayers**\n`;
    md += `Based on our verified **All-India Temples Knowledge Base (200 shrines across North & South India)**, here are the sacred shrines specifically revered for your prayers:\n\n`;

    const intentTitles = {
      child: '👶 Temples for Child Wellness, Progeny & Safe Childbirth',
      visa: '✈️ Temples for Visa Approvals & Overseas Opportunities',
      health: '🌿 Temples for Health, Healing & Curing Ailments',
      marriage: '💍 Temples for Removing Marriage Obstacles & Harmonious Wedding',
      wealth: '💰 Temples for Wealth, Prosperity & Business Growth',
      education: '📚 Temples for Education, Learning & Academic Success',
      wishes: '✨ Temples for Wish Fulfillment & Sacred Mannat'
    };

    intents.forEach(intent => {
      const title = intentTitles[intent] || `Sacred Shrines for ${intent.toUpperCase()}`;
      md += `#### ${title}\n\n`;

      const intentMatches = scored.filter(s => {
        const t = s.temple;
        const spec = (t.speciality || []).join(' ').toLowerCase();
        const u = (t.uniqueness || '').toLowerCase();
        const b = (t.belief || '').toLowerCase();
        if (intent === 'visa') return spec.includes('visa') || /visa|foreign|abroad/.test(u) || /visa|foreign|abroad/.test(b) || t.name.toLowerCase().includes('chilkur');
        if (intent === 'child') return spec.includes('child') || /child|fertility|conception|pregnancy|progeny/.test(u) || /child|fertility|offspring|progeny/.test(b) || /garba|santana|sheetla/.test(t.name.toLowerCase());
        if (intent === 'health') return spec.includes('health') || /healing|medicine|cure|disease|illness/.test(u);
        if (intent === 'marriage') return spec.includes('marriage') || /marriage|wedding|kalyana/.test(u);
        if (intent === 'wealth') return /wealth|prosperity/.test(spec) || /wealth|prosperity/.test(u);
        if (intent === 'education') return /education/.test(spec) || /education|learning|vidya/.test(u);
        if (intent === 'wishes') return /wishes/.test(spec) || /mannat|wish|boon/.test(b);
        return false;
      });

      const topForIntent = intentMatches.slice(0, 3);
      if (topForIntent.length === 0) {
        return;
      }

      topForIntent.forEach((s, idx) => {
        const t = s.temple;
        md += `##### ${idx + 1}. **${t.name}** — *${t.stateName} (${t.region || 'India'})*\n`;
        md += `- **🪔 Presiding Deity:** ${(t.deity || 'Supreme Divine').split('.')[0]}\n`;
        md += `- **📍 Location:** ${t.location || t.stateName}\n`;
        if (t.problemTheme) md += `- **🌿 Traditional Purpose & Distinction:** ${this.cleanText(t.problemTheme)}\n`;
        if (t.uniqueness) md += `- **✨ Sacred Purpose:** ${this.cleanText(t.uniqueness)}\n`;
        if (t.belief && t.belief !== t.uniqueness) md += `- **🙏 Pilgrim Belief:** ${this.cleanText(t.belief)}\n`;
        if (t.ritual) md += `- **🪔 Ritual Practice:** ${this.cleanText(t.ritual)}\n`;
        if (t.visitorInfo) md += `- **ℹ️ Visitor Info:** ${t.visitorInfo.split('.')[0]}.\n`;
        md += `\n`;
      });
    });

    md += `---\n💡 *Tip: Ask me about any specific temple above to explore its complete darshan schedule, rituals, history, or how to reach!*`;
    return md;
  }

  formatThemeResponse(query, topList) {
    let md = `### 🕉️ **Verified Temple Guidance**\n`;
    const count = topList.length;
    md += `Here ${count === 1 ? 'is the sacred shrine' : 'are the top sacred shrines'} matching your query from our **All-India Knowledge Base (200 Verified Temples)**:\n\n`;

    topList.forEach((s, idx) => {
      const t = s.temple;
      md += `#### ${idx + 1}. **${t.name}** — *${t.stateName} (${t.region || 'India'})*\n`;
      md += `- **🪔 Presiding Deity:** ${(t.deity || 'Supreme Divine').split('.')[0]}\n`;
      md += `- **📍 Location:** ${t.location || t.stateName}\n`;
      md += `- **🏷️ Speciality:** ${(t.speciality || []).join(', ')}\n`;
      if (t.problemTheme) md += `- **🌿 Traditional Purpose & Distinction:** ${this.cleanText(t.problemTheme)}\n`;
      if (t.uniqueness) md += `- **✨ Sacred Purpose:** ${this.cleanText(t.uniqueness)}\n`;
      if (t.belief && t.belief !== t.uniqueness) md += `- **🙏 Sacred Beliefs & Vows:** ${this.cleanText(t.belief)}\n`;
      if (t.ritual) md += `- **🪔 Rituals:** ${this.cleanText(t.ritual)}\n`;
      if (t.visitorInfo) md += `- **ℹ️ Visitor Guide:** ${t.visitorInfo.split('.')[0]}.\n`;
      md += `\n`;
    });

    md += `---\n💡 *Tip: Ask me about any specific temple above to explore its complete darshan schedule, rituals, history, or how to reach!*`;
    return md;
  }

  formatOverviewResponse(query) {
    return `### 🕉️ **TempleVerse AI Knowledge Assistant**
*Query:* "${query}"

Here are renowned sacred shrines from our verified **All-India Temples Knowledge Base (200 Shrines across 15 states in North & South India)**:
- **For Visa & Overseas Travel:** **Chilkur Balaji Temple ("Visa Balaji")** in Telangana (11 & 108 pradakshinas tradition).
- **For Child Wellness & Safe Childbirth:** **Sri Garbarakshambigai Amman Temple** (Tamil Nadu), **Chammanakuzhi Santana Gopala** (Kerala), **Mannarasala Sree Nagaraja** (Kerala), and **Sheetla Mata** (Haryana).
- **For Health & Healing:** **Sri Vaitheeswaran Koil** (Tamil Nadu) and **Vaidyanath Jyotirlinga**.
- **For Marriage Obstacles:** **Thirumanancheri** and **Thiruvidandhai Nithya Kalyana Perumal** (Tamil Nadu).
- **For Education & Learning:** **Sri Gnana Saraswati Temple** (Basar, Telangana), **Koothanur Maha Saraswathi** (Tamil Nadu), and **Kollur Mookambika** (Karnataka).
- **For Supreme Darshan:** The 12 Jyotirlingas, Sacred Char Dham (Badrinath, Kedarnath), Tirupati Balaji, Madurai Meenakshi, Sabarimala, and Kashi Vishwanath.

*Ask me about any specific temple, deity, state, or prayer purpose for detailed darshan guidance!*`;
  }
}

// Global service instance
if (typeof window !== 'undefined') {
  window.templeVerseGemini = new TempleVerseGeminiService();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TempleVerseGeminiService;
}
