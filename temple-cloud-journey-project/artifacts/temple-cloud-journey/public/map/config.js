/* ============================================================
   TempleVerse - Gemini API Configuration & Project Credentials
   ============================================================ */
const TEMPLEVERSE_CONFIG = {
  gemini: {
    apiKey: "",
    keyName: "TempleVerse-Gemini-Key",
    projectId: "projects/326416431982",
    projectNumber: "326416431982",
    primaryModel: "gemini-1.5-flash",
    fallbackModel: "gemini-2.0-flash",
    apiEndpoint: "https://generativelanguage.googleapis.com/v1beta/models"
  }
};

window.TEMPLEVERSE_CONFIG = TEMPLEVERSE_CONFIG;
