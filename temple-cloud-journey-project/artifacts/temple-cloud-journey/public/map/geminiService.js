/* ============================================================
   TempleVerse - Gemini AI RAG & Knowledge Service
   Powered by Google Gemini API
   ============================================================ */

class TempleVerseGeminiService {
  constructor() {
    this.config = window.TEMPLEVERSE_CONFIG?.gemini || {
      apiKey: "",
      primaryModel: "gemini-1.5-flash",
      fallbackModel: "gemini-2.0-flash",
      apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models"
    };
    this.modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
  }

  /**
   * Generates a context-aware answer using the Gemini API and RAG context
   * @param {string} userQuestion - The user's query
   * @param {object} specificTemple - Optional temple object if querying a specific temple
   * @returns {Promise<string>}
   */
  async askGemini(userQuestion, specificTemple = null) {
    const context = this.buildRAGContext(userQuestion, specificTemple);
    const systemPrompt = this.getSystemPrompt();

    const fullPrompt = `${systemPrompt}\n\n=== VERIFIED TEMPLEVERSE KNOWLEDGE CONTEXT ===\n${context}\n\n=== USER QUESTION ===\n${userQuestion}\n\nProvide a respectful, insightful, structured answer based on the knowledge base. Distinguish documented historical facts from sacred traditions and beliefs.`;

    let lastError = null;

    // Try primary and fallback models
    for (const model of this.modelsToTry) {
      try {
        const responseText = await this.callGeminiAPI(model, fullPrompt);
        if (responseText) {
          return responseText;
        }
      } catch (err) {
        console.warn(`[TempleVerse Gemini] Attempt with model ${model} failed:`, err);
        lastError = err;
      }
    }

    // Fallback: If network is blocked or quota exceeded, generate structured RAG answer from local knowledge base
    return this.generateLocalGroundedAnswer(userQuestion, specificTemple, lastError);
  }

  /**
   * Calls the Google Gemini Generative Language REST API
   */
  async callGeminiAPI(model, promptText) {
    const url = `${this.config.apiEndpoint}/${model}:generateContent?key=${this.config.apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 1000
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
   * Constructs RAG context by searching local verified dataset for relevant matches
   */
  buildRAGContext(query, specificTemple) {
    if (specificTemple) {
      return `Temple Name: ${specificTemple.name}
Full Official Title: ${specificTemple.fullName || specificTemple.name}
Presiding Deity: ${specificTemple.deity}
Location: ${specificTemple.location || specificTemple.stateName}
State / Region: ${specificTemple.stateName || 'North India'}
Sacred Uniqueness: ${specificTemple.uniqueness || 'N/A'}
Architecture: ${specificTemple.architecture || 'N/A'}
History: ${specificTemple.history || 'N/A'}
Daily Rituals: ${specificTemple.ritual || 'N/A'}
Major Festivals: ${specificTemple.festival || 'N/A'}
Sacred Beliefs & Traditions: ${specificTemple.belief || 'N/A'}
Visitor Information: ${specificTemple.visitorInfo || 'N/A'}
Official Source: ${specificTemple.source || 'Temple Trust'}`;
    }

    const qLower = query.toLowerCase();
    const matchedTemples = [];

    if (typeof getAllTemplesList === 'function') {
      const all = getAllTemplesList();
      for (const t of all) {
        if (
          (t.name || '').toLowerCase().includes(qLower) ||
          (t.fullName || '').toLowerCase().includes(qLower) ||
          (t.deity || '').toLowerCase().includes(qLower) ||
          (t.location || '').toLowerCase().includes(qLower) ||
          (t.stateName || '').toLowerCase().includes(qLower) ||
          (t.speciality || []).some(s => s.toLowerCase().includes(qLower)) ||
          (t.uniqueness || '').toLowerCase().includes(qLower) ||
          (t.architecture || '').toLowerCase().includes(qLower)
        ) {
          matchedTemples.push(t);
        }
      }
    }

    if (matchedTemples.length > 0) {
      return matchedTemples.slice(0, 6).map(t => 
        `- **${t.name}** in ${t.stateName} (${t.location}): Deity: ${t.deity}. Speciality: ${(t.speciality || []).join(', ')}. Uniqueness: ${t.uniqueness || 'Sacred pilgrimage'}.`
      ).join('\n');
    }

    return `Verified North Indian Temple Heritage Dataset: 100 prominent shrines across Jammu & Kashmir, Uttarakhand, Himachal Pradesh, Punjab, Haryana, Delhi NCR, Uttar Pradesh, Rajasthan, Madhya Pradesh, and Bihar covering Jyotirlingas, Shakti Peethas, Nagara architecture, and Himalayan cave shrines.`;
  }

  /**
   * Returns system instructions adhering strictly to TempleVerse guidelines
   */
  getSystemPrompt() {
    return `You are TempleVerse AI, an intelligent, respectful, and authoritative Indian Temple Heritage and Cultural Intelligence Assistant.
Your core mission is to provide accurate, culturally rich, and well-structured insights about Indian temples, their sacred traditions, deities, and architectural wonders.

Guidelines:
1. Always maintain a reverent, culturally respectful, and scholarly tone.
2. Clearly distinguish between "Documented Historical Facts" (dynasty, architecture, inscriptions) and "Sacred Traditions / Local Beliefs" (mythology, legends, prayer purposes).
3. Use clean markdown formatting with bullet points and bold headers.
4. When relevant, mention visitor information (timings, dress code, entry rules, ticketing).`;
  }

  /**
   * Fallback grounded response when direct internet to Google is offline
   */
  generateLocalGroundedAnswer(query, specificTemple, error) {
    if (specificTemple) {
      return `### 🕉 **${specificTemple.name}**
*Presiding Deity:* **${specificTemple.deity}**  
*Location:* ${specificTemple.location || specificTemple.stateName}

#### ✨ **Sacred Uniqueness**
${specificTemple.uniqueness || 'Revered pilgrimage site with ancient spiritual traditions.'}

#### 🏛 **Architecture & History**
- **Architecture Style:** ${specificTemple.architecture || 'Classic North Indian Nagara style.'}
- **Historical Heritage:** ${specificTemple.history || 'Ancient shrine maintained by official temple administration.'}

#### 🪔 **Rituals & Sacred Traditions**
- **Daily Rituals:** ${specificTemple.ritual || 'Daily aarti, abhishek, and darshan.'}
- **Key Festivals:** ${specificTemple.festival || 'Navratri, Maha Shivaratri, Janmashtami.'}
- **Beliefs & Traditions:** ${specificTemple.belief || 'Devotees visit seeking spiritual peace and wish fulfillment.'}

#### ℹ️ **Pilgrim & Visitor Guide**
${specificTemple.visitorInfo || 'Modest traditional attire recommended.'}

*(Verified Heritage Source: ${specificTemple.source || 'TempleVerse Official Repository'})*`;
    }

    return `### 🕉 **TempleVerse AI Knowledge Assistant**
*Query:* "${query}"

Here are insights from the verified **North Indian Temples Knowledge Base** (100 shrines across 10 Northern states & regions):
- **Jammu & Kashmir & Himalayas:** Holy cave shrines like Mata Vaishno Devi and Amarnath Cave, Martand Sun Temple, and Shankaracharya Temple.
- **Uttarakhand:** Sacred Char Dham (Badrinath, Kedarnath, Gangotri, Yamunotri) and Panch Kedar high-altitude stone architecture.
- **Himachal Pradesh:** Jwala Ji eternal flames, Chintpurni, Hadimba pagoda-style wooden temple, and Baijnath.
- **Punjab & Haryana:** The golden sanctum of Sri Harmandir Sahib (Golden Temple), Durgiana, Sthaneshwar Mahadev, and Kurukshetra tirthas.
- **Delhi NCR:** Modern stone carving wonders like Swaminarayan Akshardham, Birla Mandir, Kalkaji, and Chhatarpur.
- **Uttar Pradesh:** Kashi Vishwanath on the Ganga, Ram Janmabhoomi in Ayodhya, and the sacred groves of Mathura & Vrindavan (Banke Bihari, Prem Mandir).
- **Rajasthan & Madhya Pradesh:** The rare Brahma Temple in Pushkar, Dilwara & Ranakpur Jain marble pillars, Khatu Shyam Ji, Mahakaleshwar & Omkareshwar Jyotirlingas, and Khajuraho temples.
- **Bihar:** The world-revered Mahabodhi Temple at Bodh Gaya, Vishnupad, and ancient Mundeshwari Devi.

*Click on any state pin on the India Map to discover its exact temples and visitor guidelines!*`;
  }
}

window.templeVerseGemini = new TempleVerseGeminiService();
