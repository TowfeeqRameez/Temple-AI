/* ============================================================
   TempleVerse - AI Configuration & Project Credentials
   Google Gemini & Groq Meta Llama 3.3 70B Voice Command Integration
   ============================================================ */
const TEMPLEVERSE_CONFIG = {
  gemini: {
    apiKey: (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') : '') || "",
    keyName: "TempleVerse-Gemini-Key",
    projectId: "projects/326416431982",
    projectNumber: "326416431982",
    primaryModel: "gemini-1.5-flash",
    fallbackModel: "gemini-2.0-flash",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  },
  groq: {
    apiKey: (typeof localStorage !== 'undefined' ? localStorage.getItem('groq_api_key') : '') || '',
    model: "llama-3.3-70b-versatile",
    whisperModel: "whisper-large-v3-turbo",
    chatEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    audioEndpoint: "https://api.groq.com/openai/v1/audio/transcriptions"
  }
};

window.TEMPLEVERSE_CONFIG = TEMPLEVERSE_CONFIG;
