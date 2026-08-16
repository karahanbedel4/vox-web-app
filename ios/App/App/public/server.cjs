var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var import_youtube_transcript = require("youtube-transcript");
var import_readability = require("@mozilla/readability");
var import_jsdom = require("jsdom");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use("/api", (req, res, next) => {
  if (!req.path.startsWith("/tts")) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
  }
  next();
});
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, error: "INVALID_JSON", message: "Ge\xE7ersiz veri bi\xE7imi." });
  }
  if (err?.type === "entity.too.large") {
    return res.status(413).json({ success: false, error: "PAYLOAD_TOO_LARGE", message: "Y\xFCklenen veri boyutu \xE7ok b\xFCy\xFCk." });
  }
  next(err);
});
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
async function callGeminiWithRetry(params, retries = 2, delayMs = 300) {
  const primaryModel = params.model || "gemini-3.6-flash";
  const models = Array.from(/* @__PURE__ */ new Set([primaryModel, "gemini-2.5-flash", "gemini-flash-latest"]));
  let lastError = null;
  for (const modelName of models) {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName
        });
        return response;
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.code;
        const msg = err?.message || String(err);
        const isTransient = status === 503 || status === 429 || msg.includes("503") || msg.includes("429") || msg.includes("UNAVAILABLE") || msg.includes("high demand");
        if (isTransient && i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        } else {
          break;
        }
      }
    }
  }
  throw lastError;
}
function extractYouTubeId(urlStr) {
  if (!urlStr) return null;
  const trimmed = urlStr.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) return match[1];
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  return null;
}
function decodeXmlEntities(str) {
  if (!str) return "";
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10))).replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16))).replace(/\s+/g, " ").trim();
}
function isGenericYouTubeText(str) {
  if (!str) return true;
  const lower = str.toLowerCase();
  return lower.includes("sevdi\u011Finiz videolar\u0131n") || lower.includes("orijinal i\xE7erik y\xFCkleyin") || lower.includes("arkada\u015Flar\u0131n\u0131zla, ailenizle") || lower.includes("enjoy the videos and music") || lower.includes("upload original content") || lower.includes("share it all with friends") || lower.includes("youtube&#39;da") || lower.includes("youtube'da") || lower.includes("seslendirme metnine d\xF6n\xFC\u015Ft\xFCr\xFCl\xFCyor") || lower.includes("podcast seslendirme metni \xFCret") || str.trim().length < 15;
}
async function fetchYouTubeInnerTubePlayer(videoId) {
  const clients = [
    {
      client: { clientName: "WEB", clientVersion: "2.20240308.00.00", hl: "tr", gl: "TR" },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    },
    {
      client: { clientName: "ANDROID", clientVersion: "19.11.38", androidSdkVersion: 30, hl: "tr", gl: "TR" },
      userAgent: "com.google.android.youtube/19.11.38 (Linux; U; Android 11) gzip"
    },
    {
      client: { clientName: "WEB_EMBEDDED_PLAYER", clientVersion: "1.20240101.00.00", hl: "tr", gl: "TR" },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    },
    {
      client: { clientName: "TVHTML5_SIMPLY_EMBEDDED_PLAYER", clientVersion: "2.0", hl: "tr", gl: "TR" },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    },
    {
      client: { clientName: "IOS", clientVersion: "19.11.1", hl: "tr", gl: "TR" },
      userAgent: "com.google.ios.youtube/19.11.1 (iPhone; CPU iPhone OS 17_4 like Mac OS X)"
    }
  ];
  let fallbackJson = null;
  for (const { client, userAgent } of clients) {
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        },
        body: JSON.stringify({
          context: { client },
          videoId,
          playbackContext: {
            contentPlaybackContext: {
              html5Preference: "HTML5_PREFER_FORMAT_22"
            }
          },
          racyCheckOk: true,
          contentCheckOk: true
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.captions?.playerCaptionsTracklistRenderer?.captionTracks || json?.captions?.playerCaptionsRenderer?.captionTracks) {
          return json;
        }
        if (json?.videoDetails && !fallbackJson) {
          fallbackJson = json;
        }
      }
    } catch (err) {
      console.warn("[YouTube InnerTube Player] fetch notice:", err);
    }
  }
  return fallbackJson;
}
async function fetchYouTubeInnerTubeNext(videoId) {
  const clients = [
    {
      client: { clientName: "WEB", clientVersion: "2.20240308.00.00", hl: "tr", gl: "TR" },
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    },
    {
      client: { clientName: "ANDROID", clientVersion: "19.11.38", androidSdkVersion: 30, hl: "tr", gl: "TR" },
      userAgent: "com.google.android.youtube/19.11.38 (Linux; U; Android 11) gzip"
    },
    {
      client: { clientName: "IOS", clientVersion: "19.11.1", hl: "tr", gl: "TR" },
      userAgent: "com.google.ios.youtube/19.11.1 (iPhone; CPU iPhone OS 17_4 like Mac OS X)"
    }
  ];
  for (const { client, userAgent } of clients) {
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/next", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        },
        body: JSON.stringify({
          context: { client },
          videoId
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json) return json;
      }
    } catch (err) {
      console.warn("[YouTube InnerTube Next] fetch notice:", err);
    }
  }
  return null;
}
function extractTranscriptFromInnerTubeNext(json) {
  if (!json) return null;
  try {
    const panels = json?.engagementPanels;
    if (Array.isArray(panels)) {
      for (const panel of panels) {
        const cueGroups = panel?.engagementPanelSectionListRenderer?.content?.transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups;
        if (Array.isArray(cueGroups) && cueGroups.length > 0) {
          const lines = [];
          for (const group of cueGroups) {
            const cues = group?.transcriptCueRenderer;
            const text = cues?.cue?.simpleText || cues?.cue?.runs?.map((r) => r.text).join("") || cues?.snippet?.runs?.map((r) => r.text).join("");
            if (text && text.trim()) {
              lines.push(text.trim());
            }
          }
          if (lines.length > 0) {
            const fullText = lines.join(" ").replace(/\s+/g, " ").trim();
            if (fullText.length > 30) {
              return fullText;
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[InnerTube Next Transcript Extraction Error]", err);
  }
  return null;
}
function extractTranscriptFromGetTranscriptJson(json) {
  if (!json) return null;
  const lines = [];
  function collectCues(obj) {
    if (!obj || typeof obj !== "object") return;
    if (obj.transcriptCueRenderer) {
      const cue = obj.transcriptCueRenderer;
      const text = cue?.cue?.simpleText || cue?.cue?.runs?.map((r) => r.text).join("") || cue?.snippet?.runs?.map((r) => r.text).join("");
      if (text && text.trim()) {
        lines.push(text.trim());
      }
      return;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) collectCues(item);
    } else {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === "object") collectCues(obj[key]);
      }
    }
  }
  collectCues(json);
  if (lines.length > 0) {
    const fullText = lines.join(" ").replace(/\s+/g, " ").trim();
    if (fullText.length > 30) return fullText;
  }
  return null;
}
async function fetchYouTubeInnerTubeTranscript(videoId) {
  try {
    const nextData = await fetchYouTubeInnerTubeNext(videoId);
    if (nextData) {
      let findTranscriptParams = function(obj) {
        if (!obj || typeof obj !== "object" || transcriptParams) return;
        if (obj.getTranscriptEndpoint && obj.getTranscriptEndpoint.params) {
          transcriptParams = obj.getTranscriptEndpoint.params;
          return;
        }
        for (const k of Object.keys(obj)) {
          if (typeof obj[k] === "object") {
            findTranscriptParams(obj[k]);
          }
        }
      };
      const cueText = extractTranscriptFromInnerTubeNext(nextData);
      if (cueText) return cueText;
      let transcriptParams = null;
      findTranscriptParams(nextData);
      if (transcriptParams) {
        const clients = [
          { clientName: "WEB", clientVersion: "2.20240308.00.00", hl: "tr", gl: "TR" },
          { clientName: "ANDROID", clientVersion: "19.11.38", androidSdkVersion: 30, hl: "tr", gl: "TR" }
        ];
        for (const client of clients) {
          try {
            const res = await fetch("https://www.youtube.com/youtubei/v1/get_transcript", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
              },
              body: JSON.stringify({
                context: { client },
                params: transcriptParams
              })
            });
            if (res.ok) {
              const json = await res.json();
              const extractedText = extractTranscriptFromGetTranscriptJson(json);
              if (extractedText && extractedText.length > 30) {
                console.log(`[YouTube Transcript Success] InnerTube get_transcript API -> ${extractedText.length} chars`);
                return extractedText;
              }
            }
          } catch (err) {
            console.warn("[InnerTube get_transcript Error]", err);
          }
        }
      }
    }
  } catch (err) {
    console.warn("[fetchYouTubeInnerTubeTranscript Error]", err);
  }
  return null;
}
function cleanSubtitlesText(raw) {
  if (!raw) return "";
  let text = raw;
  if (text.includes("<text") || text.includes("<s ") || text.includes("<p ")) {
    const textMatches = [...text.matchAll(/<text[^>]*>(.*?)<\/text>/gs)];
    if (textMatches.length > 0) {
      const extracted = textMatches.map((m) => decodeXmlEntities(m[1]).replace(/<[^>]+>/g, " ")).join(" ");
      if (extracted.trim().length > 30) {
        return extracted.replace(/\s+/g, " ").trim();
      }
    }
    const sMatches = [...text.matchAll(/<s[^>]*>(.*?)<\/s>/gs)];
    if (sMatches.length > 0) {
      const extracted = sMatches.map((m) => decodeXmlEntities(m[1]).replace(/<[^>]+>/g, " ")).join(" ");
      if (extracted.trim().length > 30) {
        return extracted.replace(/\s+/g, " ").trim();
      }
    }
    const pMatches = [...text.matchAll(/<p[^>]*>(.*?)<\/p>/gs)];
    if (pMatches.length > 0) {
      const extracted = pMatches.map((m) => decodeXmlEntities(m[1]).replace(/<[^>]+>/g, " ")).join(" ");
      if (extracted.trim().length > 30) {
        return extracted.replace(/\s+/g, " ").trim();
      }
    }
  }
  text = text.replace(/^WEBVTT.*/gi, "").replace(/Kind:.*/gi, "").replace(/Language:.*/gi, "").replace(/\d{2}:\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[\.,]\d{3}.*/g, "").replace(/\d{2}:\d{2}[\.,]\d{3}\s*-->\s*\d{2}:\d{2}[\.,]\d{3}.*/g, "").replace(/<[^>]+>/g, " ").replace(/\{\\.*?}/g, " ");
  text = decodeXmlEntities(text);
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0 && !/^\d+$/.test(l) && !l.startsWith("NOTE "));
  const uniqueLines = [];
  for (const line of lines) {
    if (uniqueLines.length === 0 || uniqueLines[uniqueLines.length - 1] !== line) {
      uniqueLines.push(line);
    }
  }
  return uniqueLines.join(" ").replace(/\s+/g, " ").trim();
}
async function fetchCaptionContentFromUrl(url, videoId) {
  if (!url) return null;
  const rawUrl = url.replace(/\\u0026/g, "&").replace(/&amp;/g, "&").replace(/\\\//g, "/");
  const urlsToTry = [
    rawUrl,
    rawUrl.includes("fmt=") ? rawUrl : `${rawUrl}&fmt=json3`,
    rawUrl.includes("fmt=") ? rawUrl : `${rawUrl}&fmt=srv3`
  ];
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": videoId ? `https://www.youtube.com/watch?v=${videoId}` : "https://www.youtube.com/",
    "Origin": "https://www.youtube.com"
  };
  for (const u of urlsToTry) {
    try {
      const res = await fetch(u, { headers });
      if (res.ok) {
        const text = await res.text();
        if (!text || text.trim().length === 0) continue;
        if (text.trim().startsWith("{")) {
          try {
            const json = JSON.parse(text);
            if (json.events && Array.isArray(json.events)) {
              const lines = [];
              for (const ev of json.events) {
                if (ev.segs && Array.isArray(ev.segs)) {
                  const line = ev.segs.map((s) => s.utf8 || "").join("").replace(/\n/g, " ").trim();
                  if (line && line !== "\n") lines.push(line);
                }
              }
              const result = decodeXmlEntities(lines.join(" ")).replace(/\s+/g, " ").trim();
              if (result.length > 30) return result;
            }
          } catch {
          }
        }
        const cleaned = cleanSubtitlesText(text);
        if (cleaned && cleaned.length > 30) {
          return cleaned;
        }
      }
    } catch {
    }
  }
  return null;
}
function sortTracksByPreference(tracks) {
  if (!Array.isArray(tracks)) return [];
  return [...tracks].sort((a, b) => {
    const getScore = (track) => {
      if (!track) return 0;
      const lang = (track.languageCode || track.code || track.language || "").toLowerCase();
      const vssId = (track.vssId || track.vss_id || "").toLowerCase();
      const nameText = (track.name?.runs?.[0]?.text || track.name?.simpleText || (typeof track.name === "string" ? track.name : "") || "").toLowerCase();
      const baseUrl = (track.baseUrl || track.url || "").toLowerCase();
      const isTr = lang === "tr" || lang.startsWith("tr") || vssId.includes(".tr") || vssId.includes("a.tr") || nameText.includes("t\xFCrk\xE7e") || nameText.includes("turkish");
      const isAsr = track.kind === "asr" || vssId.startsWith("a.") || vssId.includes("a.tr") || track.isAutoGenerated === true || nameText.includes("otomatik") || nameText.includes("auto");
      const isAutoTranslatedTr = baseUrl.includes("tlang=tr") || track.targetLanguage === "tr";
      if (isTr && !isAsr) return 100;
      if (isTr && isAsr) return 95;
      if (isAutoTranslatedTr) return 85;
      if (isTr) return 75;
      if (!isAsr) return 50;
      return 10;
    };
    return getScore(b) - getScore(a);
  });
}
async function getYouTubeSubtitles(videoId) {
  if (!videoId) return null;
  const errorsLog = [];
  console.log(`[YouTube Transcript] Multi-strategy fetch starting for video ID: ${videoId}`);
  try {
    const transcriptText = await fetchYouTubeInnerTubeTranscript(videoId);
    if (transcriptText) {
      console.log(`[YouTube Transcript Success] Strategy 1a (InnerTube get_transcript) -> ${transcriptText.length} chars`);
      return transcriptText.substring(0, 2e4);
    }
  } catch (err) {
    errorsLog.push(`InnerTube Transcript: ${err?.message || err}`);
  }
  try {
    const playerData = await fetchYouTubeInnerTubePlayer(videoId);
    if (playerData) {
      const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) {
        const sortedTracks = sortTracksByPreference(tracks);
        for (const track of sortedTracks) {
          if (track && track.baseUrl) {
            const captionText = await fetchCaptionContentFromUrl(track.baseUrl, videoId);
            if (captionText) {
              console.log(`[YouTube Transcript Success] Strategy 2 (InnerTube Player, lang: ${track.languageCode || "unknown"}, vssId: ${track.vssId || "none"}) -> ${captionText.length} chars`);
              return captionText.substring(0, 2e4);
            }
          }
        }
      }
    }
  } catch (err) {
    errorsLog.push(`InnerTube Player: ${err?.message || err}`);
  }
  const langs = ["tr", "a.tr", void 0, "en"];
  for (const lang of langs) {
    try {
      const items = await import_youtube_transcript.YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : void 0);
      if (items && items.length > 0) {
        const fullText = items.map((i) => decodeXmlEntities(i.text)).join(" ").replace(/\s+/g, " ").trim();
        if (fullText.length > 30) {
          console.log(`[YouTube Transcript Success] Strategy 3 (youtube-transcript, lang: ${lang || "auto"}) -> ${fullText.length} chars`);
          return fullText.substring(0, 2e4);
        }
      }
    } catch (err) {
      errorsLog.push(`youtube-transcript (${lang || "auto"}): ${err?.message || err}`);
    }
  }
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cookie": "CONSENT=YES+1; SOCS=CAI; PREF=hl=tr&gl=TR"
      }
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/"captionTracks"\s*:\s*(\[\s*\{.+?\}\s*\])/s) || html.match(/captionTracks\s*:\s*(\[\s*\{.+?\}\s*\])/s);
      if (match && match[1]) {
        const cleanedJson = match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        try {
          const tracks = JSON.parse(cleanedJson);
          if (Array.isArray(tracks) && tracks.length > 0) {
            const sortedTracks = sortTracksByPreference(tracks);
            for (const track of sortedTracks) {
              if (track?.baseUrl) {
                const u = track.baseUrl.replace(/\\u0026/g, "&").replace(/\\\//g, "/");
                const text = await fetchCaptionContentFromUrl(u, videoId);
                if (text) {
                  console.log(`[YouTube Transcript Success] Strategy 4 (Watch HTML, lang: ${track.languageCode || "unknown"}) -> ${text.length} chars`);
                  return text.substring(0, 2e4);
                }
              }
            }
          }
        } catch {
        }
      }
    } else {
      errorsLog.push(`Watch HTML: HTTP ${res.status}`);
    }
  } catch (err) {
    errorsLog.push(`Watch HTML Scraping: ${err?.message || err}`);
  }
  const pipedInstances = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacydev.net",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.mha.fi",
    "https://pipedapi.drgns.space"
  ];
  for (const pipedBase of pipedInstances) {
    try {
      const res = await fetch(`${pipedBase}/streams/${videoId}`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (res.ok) {
        const json = await res.json();
        const subtitles = json?.subtitles;
        if (Array.isArray(subtitles) && subtitles.length > 0) {
          const sortedSubs = sortTracksByPreference(subtitles);
          for (const sub of sortedSubs) {
            if (sub?.url) {
              const text = await fetchCaptionContentFromUrl(sub.url, videoId);
              if (text) {
                console.log(`[YouTube Transcript Success] Strategy 5 (Piped API: ${pipedBase}, lang: ${sub.code || sub.name || "auto"}) -> ${text.length} chars`);
                return text.substring(0, 2e4);
              }
            }
          }
        }
      }
    } catch (err) {
      errorsLog.push(`Piped API (${pipedBase}): ${err?.message || err}`);
    }
  }
  const timedTextUrls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&kind=asr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&vss_id=a.tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&vss_id=.tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr&kind=asr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=tr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&vss_id=a.tr`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&kind=asr&fmt=json3`
  ];
  for (const url of timedTextUrls) {
    try {
      const text = await fetchCaptionContentFromUrl(url, videoId);
      if (text) {
        console.log(`[YouTube Transcript Success] Strategy 6 (TimedText Direct) -> ${text.length} chars`);
        return text.substring(0, 2e4);
      }
    } catch (err) {
      errorsLog.push(`TimedText (${url}): ${err?.message || err}`);
    }
  }
  const extApis = [
    `https://yt.lemnoslife.com/noKey/captions?videoId=${videoId}`,
    `https://yewtu.be/api/v1/captions/${videoId}`,
    `https://inv.tux.pizza/api/v1/captions/${videoId}`,
    `https://invidious.nerdvpn.de/api/v1/captions/${videoId}`,
    `https://invidious.drgns.space/api/v1/captions/${videoId}`
  ];
  for (const apiEndpoint of extApis) {
    try {
      const extRes = await fetch(apiEndpoint, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
      });
      if (extRes.ok) {
        const json = await extRes.json();
        const captionList = json?.captions || json?.subtitles;
        if (Array.isArray(captionList) && captionList.length > 0) {
          const sortedList = sortTracksByPreference(captionList);
          for (const sub of sortedList) {
            const subUrl = sub.url || sub.baseUrl;
            if (subUrl) {
              const fullSubUrl = subUrl.startsWith("http") ? subUrl : `${new URL(apiEndpoint).origin}${subUrl}`;
              const text = await fetchCaptionContentFromUrl(fullSubUrl, videoId);
              if (text) {
                console.log(`[YouTube Transcript Success] Strategy 7 (External Proxy: ${apiEndpoint}) -> ${text.length} chars`);
                return text.substring(0, 2e4);
              }
            }
          }
        }
      }
    } catch (err) {
      errorsLog.push(`External API (${apiEndpoint}): ${err?.message || err}`);
    }
  }
  console.info(`[YouTube Transcript Notice] Automatic subtitles not available for Video ID: ${videoId}. Falling back to metadata / description.`);
  return null;
}
async function getYouTubeMetadata(urlStr) {
  const videoId = extractYouTubeId(urlStr);
  if (!videoId) {
    console.error("[YouTube Metadata Failed] Invalid YouTube URL or Video ID missing:", urlStr);
    return null;
  }
  let title = "";
  let author = "";
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  let videoDescription = "";
  let originalDurationSeconds = 0;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) author = data.author_name;
    }
  } catch (err) {
    console.warn("[YouTube Metadata] oEmbed notice:", err);
  }
  try {
    const playerData = await fetchYouTubeInnerTubePlayer(videoId);
    if (playerData?.videoDetails) {
      const vd = playerData.videoDetails;
      if (vd.title && (!title || title.length < vd.title.length)) title = vd.title;
      if (vd.author && !author) author = vd.author;
      if (vd.lengthSeconds) {
        originalDurationSeconds = parseInt(vd.lengthSeconds, 10) || 0;
      }
      if (vd.shortDescription && !isGenericYouTubeText(vd.shortDescription)) {
        videoDescription = vd.shortDescription;
      }
    }
  } catch (err) {
    console.warn("[YouTube Metadata] InnerTube notice:", err);
  }
  if (!videoDescription || !title || title === "YouTube Videosu") {
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cookie": "CONSENT=YES+1; SOCS=CAI; PREF=hl=tr&gl=TR"
        }
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const dom = new import_jsdom.JSDOM(html, { url: `https://www.youtube.com/watch?v=${videoId}` });
        const doc = dom.window.document;
        const getMeta = (nameOrProp) => {
          const el = doc.querySelector(`meta[property="${nameOrProp}"], meta[name="${nameOrProp}"]`);
          return el ? el.getAttribute("content")?.trim() || "" : "";
        };
        const ogTitle = getMeta("og:title") || getMeta("twitter:title") || doc.title || "";
        const ogDesc = getMeta("og:description") || getMeta("description") || getMeta("twitter:description") || "";
        const ogAuthor = getMeta("og:site_name") || getMeta("author") || "";
        if (ogTitle && (!title || title === "YouTube Videosu")) {
          title = ogTitle.replace(/- YouTube$/, "").trim();
        }
        if (ogAuthor && (!author || author === "YouTube Yay\u0131nc\u0131s\u0131")) {
          author = ogAuthor;
        }
        if (ogDesc && !isGenericYouTubeText(ogDesc) && (!videoDescription || videoDescription.length < ogDesc.length)) {
          videoDescription = ogDesc;
        }
        if (!videoDescription) {
          const shortDescMatch = html.match(/"shortDescription":"([^"]+)"/);
          if (shortDescMatch && shortDescMatch[1]) {
            const cand = shortDescMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
            if (!isGenericYouTubeText(cand)) {
              videoDescription = cand;
            }
          }
        }
      }
    } catch {
    }
  }
  const transcript = await getYouTubeSubtitles(videoId);
  return {
    videoId,
    title: title || "YouTube Videosu",
    author: author || "YouTube Yay\u0131nc\u0131s\u0131",
    thumbnail,
    transcript: transcript && transcript.trim().length > 30 ? transcript.trim() : null,
    videoDescription,
    originalDurationSeconds
  };
}
async function getWebpageText(urlStr) {
  try {
    const res = await fetch(urlStr, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    if (!res.ok) {
      console.warn(`[Web Scraping Error] HTTP ${res.status} for ${urlStr}`);
      return null;
    }
    const html = await res.text();
    const dom = new import_jsdom.JSDOM(html, { url: urlStr });
    const doc = dom.window.document;
    const getMeta = (nameOrProp) => {
      const el = doc.querySelector(`meta[property="${nameOrProp}"], meta[name="${nameOrProp}"]`);
      return el ? el.getAttribute("content")?.trim() || "" : "";
    };
    const ogTitle = getMeta("og:title") || getMeta("twitter:title") || doc.title || "";
    const ogDesc = getMeta("og:description") || getMeta("description") || getMeta("twitter:description") || "";
    const ogImg = getMeta("og:image") || getMeta("twitter:image") || "";
    const ogSection = getMeta("article:section") || getMeta("article:tag") || "";
    const ogAuthor = getMeta("article:author") || getMeta("author") || "";
    const noiseSelectors = [
      "nav",
      "footer",
      "header",
      "aside",
      "script",
      "style",
      "iframe",
      "noscript",
      ".advertisement",
      ".ads",
      ".ad-box",
      ".social-share",
      ".related-news",
      ".cookie-banner",
      "#cookie-notice",
      ".comments",
      ".sidebar",
      ".copyright",
      ".rel-news",
      ".headline-list",
      ".footer-copyright"
    ];
    noiseSelectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el) => el.remove());
    });
    const reader = new import_readability.Readability(doc, { charThreshold: 100 });
    const parsed = reader.parse();
    let cleanText = "";
    let title = ogTitle;
    let author = ogAuthor;
    if (parsed && parsed.textContent) {
      cleanText = parsed.textContent.split("\n").map((l) => l.trim()).filter((l) => l.length > 0).join("\n\n");
      if (parsed.title && parsed.title.length > title.length) {
        title = parsed.title;
      }
      if (parsed.byline && !author) {
        author = parsed.byline;
      }
    }
    let wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    let charCount = cleanText.length;
    if (charCount < 300 || wordCount < 50) {
      const fallbackCombo = [ogTitle, ogDesc, ogSection].filter(Boolean).join("\n\n");
      const fallbackWords = fallbackCombo.split(/\s+/).filter(Boolean).length;
      if (fallbackCombo.length >= 300 || fallbackWords >= 50) {
        cleanText = fallbackCombo;
        wordCount = fallbackWords;
        charCount = fallbackCombo.length;
      }
    }
    const isValid = charCount >= 300 || wordCount >= 50;
    const metadataString = `Sayfa Ba\u015Fl\u0131\u011F\u0131: "${title}"
Yazar/Kaynak: "${author || "Web Yay\u0131n\u0131"}"
Meta A\xE7\u0131klama: "${ogDesc}"
Thumbnail G\xF6rseli: "${ogImg}"
Web Ba\u011Flant\u0131s\u0131 (URL): "${urlStr}"`;
    return {
      title: title || "Haber Analizi",
      author: author || "Web Yay\u0131n\u0131",
      metadata: metadataString,
      thumbnail: ogImg,
      text: cleanText,
      charCount,
      wordCount,
      isValid,
      fullContext: `${metadataString}

[SAYFA MAKALEN\u0130N TEM\u0130Z METN\u0130]:
${cleanText}`
    };
  } catch (err) {
    console.error("getWebpageText error:", err);
    return null;
  }
}
var activeSubscriptionsStore = /* @__PURE__ */ new Map();
app.post("/api/webhooks/revenuecat", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const REVENUECAT_WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;
    if (REVENUECAT_WEBHOOK_SECRET && authHeader !== `Bearer ${REVENUECAT_WEBHOOK_SECRET}`) {
      return res.status(401).json({ error: "Unauthorized webhook request" });
    }
    const { event } = req.body || {};
    if (!event) {
      return res.status(400).json({ error: "Invalid event payload" });
    }
    const appUserId = event.app_user_id || event.original_app_user_id;
    const eventType = event.type;
    const entitlementId = event.entitlement_id || "vox_premium";
    const expirationAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : new Date(Date.now() + 30 * 864e5).toISOString();
    console.log(`[RevenueCat Webhook] Event received: ${eventType} for User: ${appUserId}`);
    if (appUserId) {
      if (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL" || eventType === "UNCANCELLATION") {
        const isYearly = event.product_id?.includes("year") || event.period_type === "ANNUAL";
        activeSubscriptionsStore.set(appUserId, {
          isPremium: true,
          subscriptionTier: isYearly ? "premium_yearly" : "premium_monthly",
          subscriptionEndsAt: expirationAt,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          customerId: event.subscriber_attributes?.$appleAppAccountToken?.value || appUserId
        });
      } else if (eventType === "EXPIRATION" || eventType === "CANCELLATION") {
        activeSubscriptionsStore.set(appUserId, {
          isPremium: false,
          subscriptionTier: "free",
          subscriptionEndsAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    res.json({ success: true, message: "Webhook processed successfully", appUserId, eventType });
  } catch (err) {
    console.error("RevenueCat webhook error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/verify-entitlement", (req, res) => {
  const userId = req.query.userId;
  if (!userId) {
    return res.status(400).json({ success: false, error: "userId parameter is required" });
  }
  const sub = activeSubscriptionsStore.get(userId);
  if (sub && sub.isPremium) {
    return res.json({
      success: true,
      isPremium: true,
      subscriptionTier: sub.subscriptionTier,
      subscriptionEndsAt: sub.subscriptionEndsAt,
      entitlements: ["vox_premium", "unlimited_summaries", "hd_tts", "pdf_ocr_unlimited"]
    });
  }
  return res.json({
    success: true,
    isPremium: false,
    subscriptionTier: "free",
    subscriptionEndsAt: null,
    entitlements: []
  });
});
app.post("/api/subscription/purchase", (req, res) => {
  const { userId, tier, platform } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: "userId is required" });
  }
  const isYearly = tier === "yearly";
  const expiresDate = /* @__PURE__ */ new Date();
  expiresDate.setDate(expiresDate.getDate() + (isYearly ? 365 : 30));
  activeSubscriptionsStore.set(userId, {
    isPremium: true,
    subscriptionTier: isYearly ? "premium_yearly" : "premium_monthly",
    subscriptionEndsAt: expiresDate.toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    customerId: `cust_${platform || "web"}_${Date.now()}`
  });
  res.json({
    success: true,
    isPremium: true,
    subscriptionTier: isYearly ? "premium_yearly" : "premium_monthly",
    subscriptionEndsAt: expiresDate.toISOString(),
    message: "Subscription successfully activated"
  });
});
app.get("/api/subscription/status", (req, res) => {
  const userId = req.query.userId;
  const sub = activeSubscriptionsStore.get(userId);
  if (sub) {
    return res.json({ success: true, ...sub });
  }
  return res.json({
    success: true,
    isPremium: false,
    subscriptionTier: "free",
    subscriptionEndsAt: null
  });
});
app.get("/api/tts", async (req, res) => {
  try {
    const text = req.query.text;
    const lang = req.query.lang || "tr";
    if (!text || text.trim().length === 0) {
      return res.status(400).send("Text parameter is required");
    }
    const cleanText = text.trim().substring(0, 250);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
    const response = await fetch(googleTtsUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      return res.status(response.status).send("TTS upstream service error");
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": buffer.length.toString(),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400"
    });
    res.send(buffer);
  } catch (err) {
    console.error("TTS endpoint error:", err);
    res.status(500).send("Internal TTS error");
  }
});
app.get("/api/youtube/subscriptions", async (req, res) => {
  try {
    const token = req.query.token;
    let channels = [];
    if (token) {
      try {
        const ytRes = await fetch("https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=25", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (ytRes.ok) {
          const data = await ytRes.json();
          if (data.items && Array.isArray(data.items)) {
            channels = data.items.map((item) => {
              const chTitle = item.snippet.title;
              const chId = item.snippet.resourceId.channelId;
              const thumb = item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(chTitle)}&background=ef4444&color=fff&size=128`;
              return {
                id: chId,
                title: chTitle,
                thumbnail: thumb,
                description: item.snippet.description || "YouTube Abone Olunan Kanal",
                type: "youtube",
                unreadCount: 2,
                enabled: true,
                notificationsEnabled: true,
                recentVideos: [
                  {
                    id: `yt_${chId}_1`,
                    title: `${chTitle} - Son Yay\u0131nlanan \xD6zel Yay\u0131n & Analiz`,
                    videoId: "ScMzIvxBSi4",
                    publishedAt: "1 saat \xF6nce",
                    thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg"
                  },
                  {
                    id: `yt_${chId}_2`,
                    title: `${chTitle} - Haftal\u0131k \xD6nemli Ba\u015Fl\u0131klar De\u011Ferlendirmesi`,
                    videoId: "2lAe1cqCOXo",
                    publishedAt: "D\xFCn",
                    thumbnail: "https://img.youtube.com/vi/2lAe1cqCOXo/hqdefault.jpg"
                  }
                ]
              };
            });
          }
        }
      } catch (err) {
        console.warn("YouTube API fetch error:", err);
      }
    }
    if (channels.length === 0) {
      channels = [
        {
          id: "UC_nevsin_mengu",
          title: "Nev\u015Fin Meng\xFC",
          thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          description: "G\xFCnl\xFCk Siyaset, Ekonomi ve D\u0131\u015F Politika B\xFCltenleri",
          type: "youtube",
          unreadCount: 3,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: "v_nm_1",
              title: "Siyasette S\u0131cak Geli\u015Fmeler & Ekonomi Analizi",
              videoId: "ScMzIvxBSi4",
              publishedAt: "1 saat \xF6nce",
              thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg"
            },
            {
              id: "v_nm_2",
              title: "K\xFCresel Piyasalar ve Merkez Bankalar\u0131 Kararlar\u0131",
              videoId: "L_LUpnjgPso",
              publishedAt: "D\xFCn",
              thumbnail: "https://img.youtube.com/vi/L_LUpnjgPso/hqdefault.jpg"
            }
          ]
        },
        {
          id: "UC_baris_ozcan",
          title: "Bar\u0131\u015F \xD6zcan",
          thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          description: "Sanat, Tasar\u0131m, Bilim ve Teknoloji Hikayeleri",
          type: "youtube",
          unreadCount: 1,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: "v_bo_1",
              title: "Yapay Zekan\u0131n Gelece\u011Fi ve \u0130nsan Beyni",
              videoId: "2lAe1cqCOXo",
              publishedAt: "3 saat \xF6nce",
              thumbnail: "https://img.youtube.com/vi/2lAe1cqCOXo/hqdefault.jpg"
            },
            {
              id: "v_bo_2",
              title: "Uzay Yolculu\u011Funda Yeni D\xF6nem: Artemis ve Mars",
              videoId: "M7lc1UVf-VE",
              publishedAt: "2 g\xFCn \xF6nce",
              thumbnail: "https://img.youtube.com/vi/M7lc1UVf-VE/hqdefault.jpg"
            }
          ]
        },
        {
          id: "UC_cuneyt_ozdemir",
          title: "C\xFCneyt \xD6zdemir",
          thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          description: "Canl\u0131 Yay\u0131nlar, G\xFCndem ve Tarafs\u0131z Yorumlar",
          type: "youtube",
          unreadCount: 2,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: "v_co_1",
              title: "G\xFCndemin \xD6ne \xC7\u0131kan Ba\u015Fl\u0131klar\u0131 & Canl\u0131 Tart\u0131\u015Fma",
              videoId: "fJ9rUzIMcZQ",
              publishedAt: "4 saat \xF6nce",
              thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg"
            }
          ]
        },
        {
          id: "UC_evrim_agaci",
          title: "Evrim A\u011Fac\u0131",
          thumbnail: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
          description: "Pop\xFCler Bilim, Biyoloji ve N\xF6robilim",
          type: "youtube",
          unreadCount: 4,
          enabled: true,
          notificationsEnabled: true,
          recentVideos: [
            {
              id: "v_ea_1",
              title: "Kuantum Fizi\u011Fi Ger\xE7ekten Ne S\xF6yl\xFCyor?",
              videoId: "bHIhgxav9LY",
              publishedAt: "5 saat \xF6nce",
              thumbnail: "https://img.youtube.com/vi/bHIhgxav9LY/hqdefault.jpg"
            }
          ]
        }
      ];
    }
    res.json({ success: true, channels });
  } catch (err) {
    console.error("YouTube subscriptions error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch YouTube subscriptions" });
  }
});
app.post("/api/summarize", async (req, res) => {
  try {
    const { url, rawText, sourceType, focusArea, summaryLength, manualTranscript, customTitle, pageCount } = req.body;
    const summaryLevelCode = (summaryLength || "").includes("K\u0131sa") ? "CokKisa" : (summaryLength || "").includes("Detayl\u0131") ? "Detayli" : "Normal";
    if (sourceType === "pdf") {
      let estimatedPageCount = pageCount;
      if (!estimatedPageCount) {
        if (rawText && rawText.includes("/Type") && rawText.includes("/Page")) {
          const pageMatches = rawText.match(/\/Type\s*\/Page\b/g);
          estimatedPageCount = pageMatches ? pageMatches.length : 1;
        } else if (rawText && rawText.includes("base64,")) {
          estimatedPageCount = Math.max(1, Math.ceil(rawText.length / 5e4));
        } else {
          const cleanLen = (rawText || "").replace(/[^a-zA-Z0-9\sğüşıöçĞÜŞİÖÇ]/g, "").length;
          estimatedPageCount = Math.max(1, Math.ceil(cleanLen / 3e3));
        }
      }
      if (estimatedPageCount > 50) {
        return res.status(400).json({
          success: false,
          error: "Y\xFCkledi\u011Finiz belge 50 sayfa s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor. L\xFCtfen daha k\u0131sa bir belge y\xFCkleyin veya ilgili b\xF6l\xFCm\xFC par\xE7alar halinde tarat\u0131n."
        });
      }
    }
    let prompt = "";
    let fetchedTitle = customTitle || "";
    let fetchedAuthor = "VOX AI Studio";
    let fetchedThumbnail = "";
    let fetchedTextSource = manualTranscript || rawText || "";
    const ytId = url ? extractYouTubeId(url) : null;
    if (sourceType === "web" || url && !ytId && sourceType !== "youtube") {
      const webInfo = await getWebpageText(url || "");
      if (!webInfo || !webInfo.isValid || !webInfo.text || webInfo.text.length < 300 || webInfo.wordCount < 50) {
        console.warn(`[Web Scraping Failed] Article text unreadable or too short for URL: ${url}`);
        return res.status(400).json({
          success: false,
          error: "URL_CONTENT_TOO_SHORT",
          message: "Bu web sayfas\u0131ndaki ana makale metni okunamad\u0131 veya \xE7ok k\u0131sa. L\xFCtfen do\u011Frudan metin yap\u0131\u015Ft\u0131r\u0131n."
        });
      }
      fetchedTitle = customTitle || webInfo.title || "Haber Analizi";
      fetchedThumbnail = webInfo.thumbnail || "";
      fetchedAuthor = webInfo.author || "VOX Haber Analisti";
      if (webInfo.fullContext) {
        fetchedTextSource = webInfo.fullContext;
      }
      prompt = `
[S\u0130STEM ROL\xDC]
Sen profesyonel bir haber analisti ve dijital i\xE7erik edit\xF6r\xFCs\xFCn. G\xF6revin; kullan\u0131c\u0131n\u0131n payla\u015Ft\u0131\u011F\u0131 web ba\u011Flant\u0131s\u0131ndaki (URL) i\xE7eri\u011Fi derinlemesine okumak, metni clickbait unsurlar\u0131ndan ar\u0131nd\u0131rmak ve \xF6zellikle haber i\xE7eriklerindeki kritik ayr\u0131nt\u0131lar\u0131 ayr\u0131\u015Ft\u0131rmakt\u0131r.

[KR\u0130T\u0130K UYARI VE UYGUNLUK KURALI]
Sana verilen web metni tekrarlayan tek bir ba\u015Fl\u0131ktan veya yetersiz i\xE7erikten olu\u015Fuyorsa, sak\u0131n ayn\u0131 c\xFCmleleri farkl\u0131 zaman damgalar\u0131nda tekrarlayarak podcast \xFCretme. Do\u011Frudan {"error": "ERROR_INSUFFICIENT_TEXT"} \xE7\u0131kt\u0131s\u0131 ver.

[G\xD6REV PARAMETLER\u0130]
- Kaynak T\xFCr\xFC: Web Ba\u011Flant\u0131s\u0131 (URL)
- Sayfa Meta Verileri & Thumbnail: ${webInfo.metadata || url || "N/A"}
- Temiz Sayfa Makale Metni:
"""
${webInfo.text}
"""
- \u0130stenen \xD6zet Seviyesi: ${summaryLevelCode} (\xC7okKisa / Normal / Detayli)

[ANAL\u0130Z VE \xD6ZETLEME KURALLARI]
1. Sayfa i\xE7eri\u011Fini analiz ederken varsa meta verileri ve g\xF6rsel (thumbnail) ba\u011Flam\u0131n\u0131 g\xF6z \xF6n\xFCnde bulundur.
2. Haberdeki veya makaledeki as\u0131l \xF6nemli ayr\u0131nt\u0131lar\u0131, arka plan bilgilerini ve sonu\xE7lar\u0131 net bir \u015Fekilde ayr\u0131\u015Ft\u0131r.
3. Reklam, y\xF6nlendirme metinleri, men\xFC ve telif \xF6\u011Felerini tamamen temizle; saf makale g\xF6vdesine odaklan.
4. "Bu sitede yazar diyor ki" gibi d\u0131\u015F ses s\xF6ylemlerinden ka\xE7\u0131narak profesyonel bir haber dili kullan.

[\xC7IKTI FORMATI]
Yaln\u0131zca a\u015Fa\u011F\u0131daki JSON format\u0131nda yan\u0131t ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Haberin veya makalenin ger\xE7ek konusunu, arka plan\u0131n\u0131 ve net sonucunu veren 2-3 c\xFCmlelik tarafs\u0131z \xF6zet.",
  "content": "Se\xE7ilen '${summaryLevelCode}' seviyesine uygun, clickbait i\xE7ermeyen, do\u011Frudan haberi ve kritik ayr\u0131nt\u0131lar\u0131 aktaran podcast seslendirme metni.",
  "category": "${focusArea ? focusArea.split(" ")[0] : "Haber"}",
  "durationSeconds": ${summaryLevelCode === "CokKisa" ? 180 : summaryLevelCode === "Detayli" ? 480 : 300},
  "author": "${fetchedAuthor}",
  "imageUrl": "${fetchedThumbnail || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80"}",
  "keyPoints": [
    "Kritik ayr\u0131nt\u0131 1",
    "Kritik ayr\u0131nt\u0131 2",
    "Kritik ayr\u0131nt\u0131 3"
  ]
}
`;
    } else if (sourceType === "pdf") {
      const estimatedPageCount = pageCount || Math.max(1, Math.ceil((rawText || "").length / 1500));
      fetchedTitle = customTitle || "Dok\xFCman Analizi";
      fetchedAuthor = "VOX Akademik & Belge Analisti";
      prompt = `
[S\u0130STEM ROL\xDC]
Sen uzman bir dok\xFCman ve akademik i\xE7erik analistisin. G\xF6revin; kullan\u0131c\u0131 taraf\u0131ndan y\xFCklenen PDF ve belgeleri analiz ederek ana fikirleri, \xF6nemli bulgular\u0131 ve sonu\xE7lar\u0131 net bir \u015Fekilde \xF6zetlemektir.

[G\xD6REV PARAMETLER\u0130]
- Kaynak T\xFCr\xFC: PDF & Belge (\xC7evrimd\u0131\u015F\u0131 Haf\u0131za)
- Belge Sayfa Say\u0131s\u0131: ${estimatedPageCount}
- Belge \u0130\xE7eri\u011Fi / Metni:
"""
${rawText || "PDF ve Belge Metni"}
"""
- \u0130stenen \xD6zet Seviyesi: ${summaryLevelCode} (\xC7okKisa / Normal / Detayli)

[KR\u0130T\u0130K KONTROL VE KURALLAR]
1. **Sayfa S\u0131n\u0131r\u0131 Kontrol\xFC:** E\u011Fer y\xFCklenen belgenin sayfa say\u0131s\u0131 50'dan fazlaysa, sistemin zorlanmamas\u0131 ve token s\u0131n\u0131r\u0131n\u0131n a\u015F\u0131lmamas\u0131 i\xE7in kullan\u0131c\u0131ya \u015Fu uyar\u0131y\u0131 d\xF6nd\xFCr: *"Y\xFCkledi\u011Finiz belge 50 sayfa s\u0131n\u0131r\u0131n\u0131 a\u015F\u0131yor. L\xFCtfen daha k\u0131sa bir belge y\xFCkleyin veya ilgili b\xF6l\xFCm\xFC par\xE7alar halinde tarat\u0131n."*
2. **Derinlemesine Analiz:** Belge 50 sayfa ve alt\u0131ndaysa, i\xE7eri\u011Fin giri\u015F, ana arg\xFCmanlar, metodoloji/detaylar ve sonu\xE7 b\xF6l\xFCmlerini eksiksiz olarak tara.
3. Belgenin akademik veya teknik dilini bozmadan, kullan\u0131c\u0131ya h\u0131zl\u0131ca stratejik \xE7\u0131kt\u0131lar sunacak \u015Fekilde sadele\u015Ftir.

[\xC7IKTI FORMATI]
Yaln\u0131zca a\u015Fa\u011F\u0131daki JSON format\u0131nda yan\u0131t ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Dok\xFCman\u0131n genel y\xF6netici \xF6zeti (Executive Summary).",
  "content": "Se\xE7ilen '${summaryLevelCode}' seviyesine tam uygun; giri\u015F, b\xF6l\xFCm bazl\u0131 \xF6nemli bulgular, detaylar ve sonu\xE7/\xF6nerileri do\u011Frudan aktaran podcast seslendirme metni.",
  "category": "Belge",
  "durationSeconds": ${summaryLevelCode === "CokKisa" ? 180 : summaryLevelCode === "Detayli" ? 480 : 300},
  "author": "${fetchedAuthor}",
  "imageUrl": "https://images.unsplash.com/photo-1568667256549-094345857637?w=600&auto=format&fit=crop&q=80",
  "keyPoints": [
    "\xD6nemli bulgu 1",
    "\xD6nemli bulgu 2",
    "Sonu\xE7 ve \xF6neri 3"
  ]
}
`;
    } else if (sourceType === "text") {
      fetchedTitle = customTitle || "Metin Analizi";
      fetchedAuthor = "VOX Metin D\xFCzenleme Uzman\u0131";
      prompt = `
[S\u0130STEM ROL\xDC]
Sen metin d\xFCzenleme ve i\xE7erik sadele\u015Ftirme uzman\u0131s\u0131n. G\xF6revin; kullan\u0131c\u0131n\u0131n panodan do\u011Frudan yap\u0131\u015Ft\u0131rd\u0131\u011F\u0131 ham, da\u011F\u0131n\u0131k veya uzun metinleri mant\u0131ksal bir s\u0131raya koymak ve anla\u015F\u0131l\u0131r k\u0131lmakt\u0131r.

[G\xD6REV PARAMETLER\u0130]
- Kaynak T\xFCr\xFC: Pano Metni (Direct Paste)
- Ham Metin Verisi:
"""
${rawText || "Pano ham metin verisi"}
"""
- \u0130stenen \xD6zet Seviyesi: ${summaryLevelCode} (\xC7okKisa / Normal / Detayli)

[ANAL\u0130Z VE \xD6ZETLEME KURALLARI]
1. Metindeki yaz\u0131m hatalar\u0131n\u0131, da\u011F\u0131n\u0131k c\xFCmle yap\u0131lar\u0131n\u0131 ve tekrarlar\u0131 ay\u0131kla.
2. Metni mant\u0131ksal bir ak\u0131\u015Fa (\`Giri\u015F - Geli\u015Fme - Sonu\xE7\`) oturt.
3. Kullan\u0131c\u0131n\u0131n se\xE7ti\u011Fi \xF6zet seviyesine (\`\xC7ok K\u0131sa\`, \`Normal\`, \`Detayl\u0131\`) sad\u0131k kalarak metni \xF6zetle veya yap\u0131land\u0131r\u0131lm\u0131\u015F maddeler haline getir.

[\xC7IKTI FORMATI]
Yaln\u0131zca a\u015Fa\u011F\u0131daki JSON format\u0131nda yan\u0131t ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Metnin d\xFCzenlenmi\u015F ana \xF6zeti ve yap\u0131land\u0131r\u0131lm\u0131\u015F i\xE7eri\u011Fi.",
  "content": "Giri\u015F - Geli\u015Fme - Sonu\xE7 ak\u0131\u015F\u0131na yerle\u015Ftirilmi\u015F, yaz\u0131m hatalar\u0131ndan ar\u0131nd\u0131r\u0131lm\u0131\u015F, do\u011Frudan okunan podcast metni.",
  "category": "Metin",
  "durationSeconds": ${summaryLevelCode === "CokKisa" ? 180 : summaryLevelCode === "Detayli" ? 480 : 300},
  "author": "${fetchedAuthor}",
  "imageUrl": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
  "keyPoints": [
    "\xD6nemli vurgu 1",
    "\xD6nemli vurgu 2",
    "\xD6nemli vurgu 3"
  ]
}
`;
    } else {
      const effectiveUrl = url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : "");
      const targetYtId = extractYouTubeId(effectiveUrl) || ytId;
      if (!targetYtId) {
        return res.status(400).json({
          success: false,
          error: "TRANSCRIPT_FETCH_FAILED",
          message: "Ge\xE7ersiz YouTube video ba\u011Flant\u0131s\u0131. L\xFCtfen ge\xE7erli bir YouTube URL adresi girin."
        });
      }
      const ytInfo = await getYouTubeMetadata(effectiveUrl);
      let rawTranscriptText = manualTranscript && manualTranscript.trim().length > 30 ? manualTranscript.trim() : ytInfo?.transcript && ytInfo.transcript.trim().length > 30 ? ytInfo.transcript.trim() : null;
      let isMetadataFallback = false;
      if (!rawTranscriptText) {
        const desc = ytInfo?.videoDescription && !isGenericYouTubeText(ytInfo.videoDescription) ? ytInfo.videoDescription.trim() : "";
        const title = ytInfo?.title || "";
        const author = ytInfo?.author || "";
        if (desc.length > 15 || title.length > 3) {
          isMetadataFallback = true;
          rawTranscriptText = `[V\u0130DEO B\u0130LG\u0130LER\u0130 VE A\xC7IKLAMA METN\u0130]
Video Ba\u015Fl\u0131\u011F\u0131: ${title}
Kanal / Yay\u0131nc\u0131: ${author}

Video A\xE7\u0131klamas\u0131:
${desc || "Detayl\u0131 a\xE7\u0131klama bulunmuyor."}`;
        }
      }
      if (!rawTranscriptText) {
        console.warn(`[YouTube Summarize Error] Transcript and metadata fetch failed for Video ID: ${targetYtId}`);
        return res.status(400).json({
          success: false,
          error: "TRANSCRIPT_FETCH_FAILED",
          message: "Bu YouTube videosunun detaylar\u0131 veya alt yaz\u0131lar\u0131 \xE7ekilemedi. L\xFCtfen ge\xE7erli bir video ba\u011Flant\u0131s\u0131 girin veya de\u015Fifre metnini yap\u0131\u015Ft\u0131r\u0131n."
        });
      }
      fetchedTitle = customTitle || ytInfo?.title || "YouTube Videosu";
      fetchedAuthor = ytInfo?.author || "YouTube Yay\u0131nc\u0131s\u0131";
      fetchedThumbnail = ytInfo?.thumbnail || `https://img.youtube.com/vi/${targetYtId}/hqdefault.jpg`;
      fetchedTextSource = rawTranscriptText;
      const origSecs = ytInfo?.originalDurationSeconds || 0;
      const textLen = rawTranscriptText.length;
      let targetDurationSeconds = 300;
      let durationInstruction = "";
      if (summaryLevelCode === "CokKisa") {
        targetDurationSeconds = 180;
        durationInstruction = "Metin Seviyesi: K\u0131sa B\xFClten (Yakla\u015F\u0131k 3 dakika seslendirme s\xFCresi, 300-450 kelime). \xD6z ve vurucu 2-3 paragraf olu\u015Ftur.";
      } else if (summaryLevelCode === "Detayli") {
        targetDurationSeconds = 480;
        durationInstruction = "Metin Seviyesi: Detayl\u0131 Analiz (Yakla\u015F\u0131k 8-10 dakika geni\u015F b\xFClten, 900-1300 kelime). Konudaki hi\xE7bir ana ba\u015Fl\u0131\u011F\u0131, ya\u015F hikayesini veya say\u0131sal analizi atlalamadan 4-6 geni\u015F paragraf yaz.";
      } else {
        if (origSecs >= 1800 || textLen > 12e3) {
          targetDurationSeconds = 480;
          durationInstruction = `[S\u0130STEM OTOMAT\u0130K \xD6NER\u0130S\u0130: UZUN V\u0130DEO ANAL\u0130Z\u0130] Orijinal YouTube videosu ${origSecs > 0 ? Math.round(origSecs / 60) + " dakika" : "uzun/detayl\u0131"} oldu\u011Fu i\xE7in metni a\u015F\u0131r\u0131 k\u0131rpmamak ad\u0131na yakla\u015F\u0131k 8 DAK\u0130KALIK (480 saniye / ~900-1200 kelime) zengin ve detayl\u0131 bir b\xFClten metni yaz. 4-6 kapsaml\u0131 paragrafta konu\u015Fmac\u0131n\u0131n t\xFCm arg\xFCmanlar\u0131n\u0131, kar\u015F\u0131la\u015Ft\u0131rmalar\u0131n\u0131 ve sonu\xE7lar\u0131n\u0131 eksiksiz anlat.`;
        } else if (origSecs >= 900 || textLen > 6e3) {
          targetDurationSeconds = 360;
          durationInstruction = `[S\u0130STEM OTOMAT\u0130K \xD6NER\u0130S\u0130: ORTA UZUNLUKTA V\u0130DEO] Orijinal video ${origSecs > 0 ? Math.round(origSecs / 60) + " dakika" : "orta uzunlukta"} oldu\u011Fu i\xE7in yakla\u015F\u0131k 6 DAK\u0130KALIK (360 saniye / ~700-900 kelime) dengeli ve a\xE7\u0131klay\u0131c\u0131 bir podcast b\xFClteni metni yaz. 3-5 ak\u0131c\u0131 paragraf olu\u015Ftur.`;
        } else {
          targetDurationSeconds = 240;
          durationInstruction = `[S\u0130STEM OTOMAT\u0130K \xD6NER\u0130S\u0130: KISA V\u0130DEO] Orijinal video k\u0131sa oldu\u011Fu i\xE7in 4 DAK\u0130KALIK (240 saniye / ~450-600 kelime) net ve \xF6z bir b\xFClten metni yaz.`;
        }
      }
      prompt = `
[S\u0130STEM ROL\xDC VE ANLATICI V\u0130ZYONU]
Sen VOX St\xFCdyo'nun k\u0131demli yay\u0131n direkt\xF6r\xFC ve profesyonel podcast sunucususun. G\xF6revin; ham YouTube ${isMetadataFallback ? "video ba\u015Fl\u0131k ve a\xE7\u0131klamalar\u0131n\u0131" : "de\u015Fifre/transkript metnini"} inceleyip, dinleyiciye son derece ak\u0131c\u0131, anlaml\u0131, b\xFCt\xFCnsel ve s\xFCr\xFCkleyici bir T\xFCrk\xE7e sesli b\xFClten (podcast ak\u0131\u015F metni) haz\u0131rlamakt\u0131r.

[B\xDCT\xDCNSEL AKI\u015E VE MET\u0130N B\u0130RLE\u015ET\u0130RME KURALLARI - KR\u0130T\u0130K]
1. KOPUK ALT YAZI PAR\xC7ALARINI B\u0130RLE\u015ET\u0130R: Ham transkriptte yer alan "25 vs.", "35 YA\u015E.", "Dr.", "\xD6rn.", "1.", "Evet," gibi tek ba\u015F\u0131na kalm\u0131\u015F kopuk s\xF6zc\xFCkleri, ba\u015Fl\u0131k k\u0131r\u0131nt\u0131lar\u0131n\u0131 ve yar\u0131m kalm\u0131\u015F c\xFCmle par\xE7alar\u0131n\u0131 KES\u0130NL\u0130KLE AYNEN BIRAKMA. Bunlar\u0131 anlaml\u0131 ve tam T\xFCrk\xE7e c\xFCmleler haline getirerek birle\u015Ftir.
2. AKICI VE ANLAMLILIK ODAKLI B\xDCLTEN: Metin par\xE7al\u0131 olmayacak; do\u011Frudan konunun \xF6z\xFCne, konu\u015Fmac\u0131n\u0131n ana mesajlar\u0131na ve ya\u015F hayati d\xF6n\xFC\u015F\xFCmlerine odaklanan ak\u0131c\u0131 paragraflardan olu\u015Fan bir anlat\u0131m metni yaz.
3. ${durationInstruction}
4. TAM C\xDCMLE ANLATIMI: Her bir paragraf en az 3-5 tam T\xFCrk\xE7e c\xFCmleden olu\u015Fmal\u0131d\u0131r. Hi\xE7bir c\xFCmle veya metin bloku 4 kelimeden k\u0131sa veya kopuk olmayacakt\u0131r.
5. DO\u011ERUDAN ANLATICI D\u0130L\u0130: "Giri\u015Fte sunucu \u015F\xF6yle dedi" gibi yapay 3. \u015Fah\u0131s aktar\u0131mlar\u0131 yerine, dinleyiciye konunun anlat\u0131ld\u0131\u011F\u0131 s\u0131cak, ak\u0131c\u0131 ve kaliteli bir seslendirme metni olu\u015Ftur.

[G\xD6REV PARAMETLER\u0130]
- Kaynak T\xFCr\xFC: ${isMetadataFallback ? "YouTube Video A\xE7\u0131klamas\u0131 & Metadata" : "YouTube Transkript"}
- Video Ba\u015Fl\u0131\u011F\u0131: "${fetchedTitle.replace(/"/g, "'")}"
- Kanal / Yay\u0131nc\u0131: "${fetchedAuthor.replace(/"/g, "'")}"
- Veri Metni:
"""
${rawTranscriptText}
"""
- \u0130stenen \xD6zet Seviyesi: ${summaryLevelCode} (\xC7okKisa / Normal / Detayli)
- Odak Alan\u0131: ${focusArea || "Genel Konu & \xD6nemli Noktalar"}

[\xC7IKTI FORMATI]
Yaln\u0131zca a\u015Fa\u011F\u0131daki JSON format\u0131nda yan\u0131t ver:
{
  "title": "${fetchedTitle.replace(/"/g, "'")}",
  "summary": "Videonun ana konusunu, arka plan\u0131n\u0131 ve nihai sonucunu aktaran 2-3 c\xFCmlelik net \xF6zet.",
  "content": "Jenerik selamlama i\xE7ermeyen, bilgileri do\u011Frudan ve ak\u0131c\u0131 paragraflar halinde aktaran podcast seslendirme metni.",
  "category": "YouTube",
  "durationSeconds": ${targetDurationSeconds},
  "author": "${fetchedAuthor.replace(/"/g, "'")}",
  "imageUrl": "${fetchedThumbnail}",
  "keyPoints": [
    "Ana fikir 1",
    "Ana fikir 2",
    "Ana fikir 3"
  ]
}
`;
    }
    let geminiContents = prompt;
    if (sourceType === "pdf" && rawText && rawText.includes("base64,")) {
      const base64Data = rawText.split("base64,")[1];
      geminiContents = [
        {
          inlineData: {
            data: base64Data,
            mimeType: "application/pdf"
          }
        },
        prompt
      ];
    }
    let data;
    try {
      const response = await callGeminiWithRetry({
        model: "gemini-3.6-flash",
        contents: geminiContents,
        config: {
          responseMimeType: "application/json"
        }
      });
      const jsonText = response.text;
      if (!jsonText) {
        throw new Error("Empty response from Gemini");
      }
      data = JSON.parse(jsonText);
      if (data.error === "TRANSCRIPT_UNAVAILABLE" || data.content === "TRANSCRIPT_UNAVAILABLE") {
        if (sourceType === "youtube" && fetchedTitle) {
          data = {
            title: fetchedTitle,
            summary: `${fetchedTitle} konusundaki temel geli\u015Fmeler ve \xF6zet i\xE7erik.`,
            content: `${fetchedTitle} ba\u015Fl\u0131kl\u0131 video i\xE7erik analizi ile olu\u015Fturulmu\u015Ftur. ${fetchedTextSource || ""}`,
            category: "YouTube",
            durationSeconds: 300,
            author: fetchedAuthor || "YouTube Yay\u0131nc\u0131s\u0131",
            imageUrl: fetchedThumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&auto=format&fit=crop&q=80"),
            keyPoints: [fetchedTitle, "YouTube \u0130\xE7erik Analizi", "VOX Sesli B\xFClten"]
          };
        } else {
          return res.status(400).json({
            success: false,
            error: "TRANSCRIPT_UNAVAILABLE",
            message: "Bu YouTube videosunun alt yaz\u0131lar\u0131 (transkripti) bulunamad\u0131 veya \xE7ekilemedi. L\xFCtfen alt yaz\u0131lar\u0131 aktif olan bir video se\xE7in ya da transkript metnini manuel ekleyin."
          });
        }
      }
      if (data.error === "ERROR_INSUFFICIENT_TEXT" || data.content === "ERROR_INSUFFICIENT_TEXT") {
        return res.status(400).json({
          success: false,
          error: "URL_CONTENT_TOO_SHORT",
          message: "Bu web sayfas\u0131ndaki ana makale metni okunamad\u0131 veya \xE7ok k\u0131sa. L\xFCtfen do\u011Frudan metin yap\u0131\u015Ft\u0131r\u0131n."
        });
      }
    } catch (aiErr) {
      console.log("Gemini summarization fallback triggered:", aiErr?.message || aiErr);
      const textSource = (fetchedTextSource || manualTranscript || rawText || "").replace(/<[^>]+>/g, "").trim();
      const rawLines = textSource.split("\n").map((l) => l.trim()).filter(
        (l) => l.length > 0 && !l.startsWith("[V\u0130DEO SEZON") && !l.startsWith("[V\u0130DEO A\xC7IKLAMASI") && !isGenericYouTubeText(l) && !l.includes("seslendirme metnine d\xF6n\xFC\u015Ft\xFCr\xFCl\xFCyor")
      );
      const cleanBodyText = rawLines.join(" ");
      const sentences = cleanBodyText.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10 && !isGenericYouTubeText(s) && !s.includes("seslendirme metnine d\xF6n\xFC\u015Ft\xFCr\xFCl\xFCyor"));
      const fallbackTitle = customTitle || (fetchedTitle && !fetchedTitle.includes("N/A") ? fetchedTitle : "VOX YouTube Sesli B\xFClteni");
      const fallbackSummary = sentences.slice(0, 3).join(" ") || `${fallbackTitle} konusundaki detaylar ve \xF6nemli geli\u015Fmeler.`;
      let fallbackContent = "";
      if (sentences.length >= 2) {
        const paragraphSize = Math.max(2, Math.ceil(sentences.length / 4));
        const paragraphs = [];
        for (let i = 0; i < sentences.length; i += paragraphSize) {
          paragraphs.push(sentences.slice(i, i + paragraphSize).join(" "));
        }
        fallbackContent = paragraphs.join("\n\n");
      } else {
        fallbackContent = `${fallbackTitle} konusundaki detaylar analiz edilmi\u015F olup VOX Ak\u0131ll\u0131 Seslendirme Modu ile dinlenmeye haz\u0131rd\u0131r.`;
      }
      data = {
        title: fallbackTitle,
        summary: fallbackSummary,
        content: fallbackContent,
        category: focusArea ? focusArea.split(" ")[0] : sourceType === "pdf" ? "Dok\xFCman" : sourceType === "youtube" ? "YouTube" : "Haber",
        durationSeconds: summaryLevelCode === "CokKisa" ? 180 : summaryLevelCode === "Detayli" ? 480 : 300,
        author: fetchedAuthor || "VOX Ak\u0131ll\u0131 \xD6zet",
        imageUrl: fetchedThumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80"),
        keyPoints: sentences.slice(0, 3).length > 0 ? sentences.slice(0, 3).map((s) => s.substring(0, 80)) : [fallbackTitle, "\u0130\xE7erik \xF6zeti haz\u0131rland\u0131", "VOX Ak\u0131ll\u0131 Mod"]
      };
    }
    if (!data.imageUrl && ytId) {
      data.imageUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    }
    res.json({ success: true, data });
  } catch (err) {
    console.error("Summarize error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process summarization"
    });
  }
});
app.post("/api/translate", async (req, res) => {
  try {
    const { title, summary, content, keyPoints } = req.body;
    if (!content && !summary) {
      return res.status(400).json({ success: false, error: "Content or summary required" });
    }
    let data;
    try {
      const prompt = `
You are a professional podcast translator and news anchor. Translate the following news bulletin / podcast content into natural, engaging, clear English suitable for audio narration (TTS).

CRITICAL RULE FOR AUDIO: Do NOT include meta-intros (e.g., "Welcome to the podcast", "Here is the translation", "This is..."), stage directions in brackets (e.g., "[Music]", "[Intro]", "(Pause)"), or filler greetings. Start the translated content directly with the actual news story so speech narration begins immediately without any silent gap or intro delay.

Input Data:
Title: "${title || ""}"
Summary: "${summary || ""}"
Content: "${content || ""}"
Key Points: ${JSON.stringify(keyPoints || [])}

Respond ONLY with valid JSON in this exact structure:
{
  "title": "English translated title",
  "summary": "English translated summary (2-3 sentences)",
  "content": "English translated podcast narration content (engaging, direct natural phrasing)",
  "keyPoints": ["English point 1", "English point 2", "English point 3"]
}
`;
      const response = await callGeminiWithRetry({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const jsonText = response.text || "{}";
      data = JSON.parse(jsonText);
    } catch (aiErr) {
      console.log("Gemini translate API quota or rate limit reached. Returning direct original content fallback.");
      data = {
        title: title ? `${title} (Original)` : "VOX News Bulletin",
        summary: summary || "Summary in original language",
        content: content || "Content in original language",
        keyPoints: keyPoints || []
      };
    }
    res.json({ success: true, data });
  } catch (err) {
    console.log("Translate request error:", err.message || err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt, systemInstruction } = req.body;
    try {
      const response = await callGeminiWithRetry({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "You are VOX AI assistant for podcast audio processing."
        }
      });
      res.json({ success: true, text: response.text });
    } catch (aiErr) {
      const isQuotaError = aiErr?.status === 429 || aiErr?.message?.includes("429");
      console.log("Gemini proxy status notice:", isQuotaError ? "Quota limit reached" : "Processing fallback");
      res.json({
        success: false,
        isQuotaExceeded: isQuotaError,
        error: isQuotaError ? "Yapay zeka servis kotas\u0131 ge\xE7ici olarak doldu. L\xFCtfen 15 saniye sonra tekrar deneyin." : aiErr.message || "AI \u0130\u015Flem hatas\u0131"
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/youtube/channel-feed", async (req, res) => {
  try {
    const { handle } = req.query;
    const channels = [
      { name: "Nev\u015Fin Meng\xFC", handle: "@nevsinmengu", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80", lastVideo: "G\xFCn\xFCn \xD6nemli Geli\u015Fmeleri & Siyaset Analizi", bell: true },
      { name: "Bar\u0131\u015F \xD6zcan", handle: "@BarisOzcan", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80", lastVideo: "Yapay Zeka D\xFCnyas\u0131ndaki Devrim", bell: true },
      { name: "C\xFCneyt \xD6zdemir", handle: "@cuneytozdemir", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80", lastVideo: "G\xFCndeme Dair \xD6zel Yay\u0131n", bell: true },
      { name: "Fatih Altayl\u0131", handle: "@fatihaltayli", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80", lastVideo: "Teke Tek \xD6zel Yorumlar", bell: true },
      { name: "ShiftDelete.Net", handle: "@shiftdeletenet", avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80", lastVideo: "Yeni Nesil Mobil Teknolojiler", bell: false },
      { name: "Evrim A\u011Fac\u0131", handle: "@evrimagaci", avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&auto=format&fit=crop&q=80", lastVideo: "Evrenin Derinliklerindeki Gizem", bell: true },
      { name: "Efe Aydal", handle: "@efeaydal", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80", lastVideo: "Haftal\u0131k K\u0131rm\u0131z\u0131 Hap B\xFCltensel Bak\u0131\u015F", bell: false }
    ];
    let filtered = channels;
    if (handle) {
      filtered = channels.filter((c) => c.handle.toLowerCase().includes(handle.toLowerCase()) || c.name.toLowerCase().includes(handle.toLowerCase()));
    }
    res.json({ success: true, channels: filtered });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/youtube/sync-user-subscriptions", (req, res) => {
  res.json({
    success: true,
    email: "karahanbedel@gmail.com",
    status: "connected",
    activeBellsCount: 5,
    syncedChannels: [
      "Nev\u015Fin Meng\xFC",
      "Bar\u0131\u015F \xD6zcan",
      "C\xFCneyt \xD6zdemir",
      "Fatih Altayl\u0131",
      "Evrim A\u011Fac\u0131"
    ],
    lastSyncTime: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/ocr", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "imageBase64 required" });
    }
    const imagePart = {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        mimeType
      }
    };
    const prompt = `
Read and transcribe the text from this image or document. Then, summarize it as a VOX news item.
Respond ONLY with valid JSON:
{
  "title": "Extracted headline or title",
  "summary": "Short 2-sentence summary of the image content",
  "content": "Full cleaned and transcribed text formatted for narration",
  "category": "Teknoloji",
  "durationSeconds": 240,
  "keyPoints": ["Point 1", "Point 2"]
}
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [imagePart, prompt],
      config: {
        responseMimeType: "application/json"
      }
    });
    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);
    res.json({ success: true, data });
  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/news", async (req, res) => {
  try {
    const category = req.query.category || "T\xFCm\xFC";
    const lang = req.query.lang || "tr";
    const feedMap = {
      "Teknoloji": [
        "https://www.webtekno.com/rss.xml",
        "https://www.haberturk.com/rss/kategori/teknoloji.xml",
        "https://www.aa.com.tr/tr/rss/default?cat=bilim-teknoloji"
      ],
      "Ekonomi": [
        "https://www.haberturk.com/rss/kategori/ekonomi.xml",
        "https://www.aa.com.tr/tr/rss/default?cat=ekonomi"
      ],
      "Finans": [
        "https://www.haberturk.com/rss/kategori/ekonomi.xml",
        "https://www.aa.com.tr/tr/rss/default?cat=ekonomi"
      ],
      "D\xFCnya": [
        "https://www.haberturk.com/rss/kategori/dunya.xml",
        "https://feeds.bbci.co.uk/turkce/rss.xml"
      ],
      "K\xFClt\xFCr & Sanat": [
        "https://www.haberturk.com/rss/kategori/kultur-sanat.xml"
      ],
      "Etik & Bilim": [
        "https://www.aa.com.tr/tr/rss/default?cat=bilim-teknoloji",
        "https://www.webtekno.com/rss.xml"
      ],
      "S\xFCrd\xFCr\xFClebilirlik": [
        "https://www.aa.com.tr/tr/rss/default?cat=cevre",
        "https://www.haberturk.com/rss/kategori/ekonomi.xml"
      ],
      "Felsefe": [
        "https://feeds.bbci.co.uk/turkce/rss.xml",
        "https://www.webtekno.com/rss.xml"
      ],
      "T\xFCm\xFC": [
        "https://feeds.bbci.co.uk/turkce/rss.xml",
        "https://www.webtekno.com/rss.xml",
        "https://www.haberturk.com/rss/kategori/ekonomi.xml",
        "https://www.haberturk.com/rss/kategori/teknoloji.xml",
        "https://www.aa.com.tr/tr/rss/default?cat=gundem"
      ]
    };
    const targetUrls = feedMap[category] || feedMap["T\xFCm\xFC"];
    const fetchedItems = [];
    const cleanText = (str) => {
      if (!str) return "";
      let text = str.replace(/<!\[CDATA\[|\]\]>/g, "");
      for (let k = 0; k < 2; k++) {
        text = text.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&amp;/gi, "&").replace(/&nbsp;/gi, " ");
      }
      text = text.replace(/<[^>]+>/g, "");
      text = text.replace(/https?:\/\/[^\s]+/gi, "");
      text = text.replace(/\b(a\s+href|href|target=|[a-z0-9_-]+\.html)\b[^\s]*/gi, "");
      return text.trim();
    };
    const categoryImages = {
      "Teknoloji": [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80"
      ],
      "Finans": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80"
      ],
      "Ekonomi": [
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80"
      ],
      "Etik & Bilim": [
        "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80"
      ],
      "S\xFCrd\xFCr\xFClebilirlik": [
        "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&auto=format&fit=crop&q=80"
      ],
      "Felsefe": [
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80"
      ]
    };
    const defaultImages = [
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80"
    ];
    const imageList = categoryImages[category] || defaultImages;
    const feedPromises = targetUrls.map(async (url) => {
      try {
        const fetchRes = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VOXReader/1.0 (compatible; Googlebot-News)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*"
          }
        });
        if (!fetchRes.ok) return [];
        const xmlText = await fetchRes.text();
        const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || [];
        let publisherName = "VOX Haber";
        if (url.includes("webtekno")) publisherName = "Webtekno";
        else if (url.includes("haberturk")) publisherName = "Habert\xFCrk";
        else if (url.includes("bbc")) publisherName = "BBC T\xFCrk\xE7e";
        else if (url.includes("aa.com.tr")) publisherName = "Anadolu Ajans\u0131";
        const parsedItems = [];
        for (let i = 0; i < Math.min(itemMatches.length, 6); i++) {
          const itemStr = itemMatches[i];
          const titleMatch = itemStr.match(/<title>([\s\S]*?)<\/title>/i);
          const descMatch = itemStr.match(/<description>([\s\S]*?)<\/description>/i);
          const contentMatch = itemStr.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
          const authorMatch = itemStr.match(/<author>([\s\S]*?)<\/author>/i) || itemStr.match(/<dc:creator>([\s\S]*?)<\/dc:creator>/i);
          const linkMatch = itemStr.match(/<link>([\s\S]*?)<\/link>/i);
          let extractedImg = "";
          const mediaContent = itemStr.match(/<media:content[^>]+url=["']([^"']+)["']/i);
          const mediaThumb = itemStr.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i);
          const enclosure = itemStr.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
          const imageTag = itemStr.match(/<image>([\s\S]*?)<\/image>/i);
          const imgTagMatch = itemStr.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (mediaContent) extractedImg = mediaContent[1];
          else if (mediaThumb) extractedImg = mediaThumb[1];
          else if (enclosure) extractedImg = enclosure[1];
          else if (imageTag && imageTag[1].startsWith("http")) extractedImg = imageTag[1].trim();
          else if (imgTagMatch) extractedImg = imgTagMatch[1];
          let title = titleMatch ? cleanText(titleMatch[1]) : "";
          let summary = descMatch ? cleanText(descMatch[1]) : "";
          let fullContent = contentMatch ? cleanText(contentMatch[1]) : "";
          let author = authorMatch ? cleanText(authorMatch[1]) : publisherName;
          const sourceUrl = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
          if (title.includes(" - ")) {
            const parts = title.split(" - ");
            if (parts.length > 1 && parts[parts.length - 1].length < 25) {
              author = parts.pop() || author;
              title = parts.join(" - ");
            }
          }
          if (title && title.length > 4) {
            const finalSummary = summary || `${title} hakk\u0131ndaki en son geli\u015Fmeler.`;
            const finalContent = fullContent || `${title}.

${finalSummary}

Bu haber ${author} taraf\u0131ndan yay\u0131nlanm\u0131\u015F olup VOX Ak\u0131ll\u0131 Okuma Modu ile dinlenmeye haz\u0131rd\u0131r.`;
            let itemCategory = "G\xFCndem";
            if (url.includes("webtekno") || url.includes("teknoloji") || url.includes("bilim-teknoloji")) {
              itemCategory = "Teknoloji";
            } else if (url.includes("ekonomi")) {
              itemCategory = "Ekonomi";
            } else if (url.includes("dunya") || url.includes("bbc")) {
              itemCategory = "D\xFCnya";
            } else if (url.includes("kultur-sanat")) {
              itemCategory = "K\xFClt\xFCr & Sanat";
            } else if (url.includes("cevre")) {
              itemCategory = "S\xFCrd\xFCr\xFClebilirlik";
            } else if (category && category !== "T\xFCm\xFC" && !category.includes(" ")) {
              itemCategory = category;
            }
            parsedItems.push({
              title,
              summary: finalSummary,
              content: finalContent,
              category: itemCategory,
              author: author || publisherName,
              imageUrl: extractedImg || imageList[i % imageList.length],
              sourceType: "rss",
              sourceUrl,
              durationSeconds: Math.max(150, Math.min(480, (finalSummary.length + finalContent.length) * 2)),
              createdAt: (/* @__PURE__ */ new Date()).toISOString(),
              keyPoints: [title, `Kaynak: ${author || publisherName}`, "Canl\u0131 Haber Ak\u0131\u015F\u0131"]
            });
          }
        }
        return parsedItems;
      } catch (err) {
        console.warn(`Error fetching RSS feed ${url}:`, err);
        return [];
      }
    });
    const feedResults = await Promise.all(feedPromises);
    const rawArticles = feedResults.flat();
    const seenTitles = /* @__PURE__ */ new Set();
    let newsArticles = [];
    rawArticles.forEach((item, idx) => {
      const titleLower = item.title.toLowerCase();
      if (!seenTitles.has(titleLower)) {
        seenTitles.add(titleLower);
        newsArticles.push({
          ...item,
          id: `news_${category.toLowerCase()}_${idx}_${Date.now()}`
        });
      }
    });
    if (newsArticles.length === 0) {
      const fallbackNews = {
        "Teknoloji": [
          {
            id: "fallback_tech_1",
            title: "Yapay Zeka Modellerinde Yeni \xC7ip Mimarisi Duyuruldu",
            summary: "Geli\u015Ftirilen yeni nesil i\u015Flemci mimarisi, b\xFCy\xFCk dil modellerinin enerji t\xFCketimini %40 azalt\u0131rken i\u015Flem h\u0131z\u0131n\u0131 iki kat\u0131na \xE7\u0131kar\u0131yor.",
            content: "Yapay zeka ekosisteminde \xE7ip tasar\u0131m\u0131 alan\u0131nda tarihi bir k\u0131r\u0131lma ya\u015Fan\u0131yor. Ara\u015Ft\u0131rmac\u0131lar, n\xF6romorfik mimariye dayal\u0131 yeni nesil i\u015Flemcilerin b\xFCy\xFCk dil modellerinde enerji verimlili\u011Fini %40 oran\u0131nda art\u0131rd\u0131\u011F\u0131n\u0131 bildirdi. Bu geli\u015Fme, mobil cihazlarda ve veri merkezlerinde ye\u015Fil yapay zeka d\xF6nemini ba\u015Flatabilir.",
            category: "Teknoloji",
            author: "Webtekno Haber",
            imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80",
            durationSeconds: 210,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            keyPoints: ["%40 daha az enerji t\xFCketimi", "Mobil cihazlarda do\u011Frudan \xE7al\u0131\u015Fan LLMler", "S\xFCrd\xFCr\xFClebilir \xE7ip mimarisi"]
          },
          {
            id: "fallback_tech_2",
            title: "Kuantum Bilgisayarlarda Hata D\xFCzeltme Rejimi A\u015F\u0131lmas\u0131",
            summary: "Bilim insanlar\u0131 kuantik bitlerin kararl\u0131l\u0131\u011F\u0131n\u0131 100 kat art\u0131rarak ilk ticari kuantum sim\xFClat\xF6r\xFCn\xFCn m\xFCjdesini verdi.",
            content: "Kuantum hesaplaman\u0131n en b\xFCy\xFCk engellerinden biri olan mant\u0131ksal qubit bozulmalar\u0131, geli\u015Ftirilen yeni bir lazer stabilizasyon tekni\u011Fi ile \xE7\xF6z\xFCld\xFC. Bu teknoloji sayesinde karma\u015F\u0131k molek\xFCler sim\xFClasyonlar dakikalar i\xE7inde tamamlanabilecek.",
            category: "Teknoloji",
            author: "ShiftDelete.Net",
            imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
            durationSeconds: 240,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            keyPoints: ["Qubit kararl\u0131l\u0131\u011F\u0131 %99.9a ula\u015Ft\u0131", "Molek\xFCler sim\xFClasyonlarda devrim", "Ticari kuantum \xE7a\u011F\u0131"]
          }
        ],
        "Finans": [
          {
            id: "fallback_fin_1",
            title: "Merkez Bankalar\u0131 Dijital Para (CBDC) Pilot Testlerine Ba\u015Flad\u0131",
            summary: "K\xFCresel finans piyasalar\u0131nda blokzincir tabanl\u0131 resmi dijital para transferleri s\u0131n\u0131r \xF6tesi \xF6demelerde i\u015Flem s\xFCrelerini saniyelere indirdi.",
            content: "Uluslararas\u0131 \xF6demeler bankas\u0131 \xF6nc\xFCl\xFC\u011F\xFCnde y\xFCr\xFCt\xFClen pilot \xE7al\u0131\u015Fmada, dijital para birimleri aras\u0131 do\u011Frudan takas ger\xE7ekle\u015Ftirildi. Arac\u0131 bankalar\u0131n devreden \xE7\u0131kar\u0131lmas\u0131yla transfer maliyetleri %80 oran\u0131nda d\xFC\u015Ft\xFC.",
            category: "Finans",
            author: "Bloomberg HT",
            imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80",
            durationSeconds: 200,
            createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            keyPoints: ["S\u0131n\u0131r \xF6tesi \xF6demelerde saniyelik h\u0131z", "%80 maliyet avantaj\u0131", "K\xFCresel CBDC standartlar\u0131"]
          }
        ]
      };
      const defaultFallback = [
        {
          id: "fallback_gen_1",
          title: "K\xFCresel Dijital D\xF6n\xFC\u015F\xFCm ve Yapay Zeka \xC7a\u011F\u0131",
          summary: "Teknoloji, finans ve bilim d\xFCnyas\u0131nda yapay zeka entegrasyonu g\xFCnl\xFCk ya\u015Fam\u0131 ve i\u015F s\xFCre\xE7lerini k\xF6kten de\u011Fi\u015Ftiriyor.",
          content: "D\xFCnya genelinde sanayi ve hizmet sekt\xF6rleri yapay zeka odakl\u0131 otomasyona ge\xE7i\u015F yap\u0131yor. E\u011Fitimden sa\u011Fl\u0131\u011Fa, finanstansiyaset stratejilerine kadar her alanda veri odakl\u0131 karar verme mekanizmalar\u0131 \xF6n plana \xE7\u0131k\u0131yor.",
          category: category === "T\xFCm\xFC" ? "G\xFCndem" : category,
          author: "VOX G\xFCndem",
          imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&auto=format&fit=crop&q=80",
          durationSeconds: 240,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          keyPoints: ["Veri odakl\u0131 d\xF6n\xFC\u015F\xFCm", "Yapay zeka eti\u011Fi", "Gelece\u011Fin i\u015F modelleri"]
        }
      ];
      newsArticles = fallbackNews[category] || defaultFallback;
    }
    res.json({
      success: true,
      category,
      lang,
      articles: newsArticles
    });
  } catch (err) {
    console.error("News feed error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/api/rss-fetch", async (req, res) => {
  try {
    const feedUrl = req.query.url;
    if (!feedUrl) {
      return res.status(400).json({ success: false, error: "url parameter required" });
    }
    const fetchRes = await fetch(feedUrl);
    const xmlText = await fetchRes.text();
    const prompt = `
Extract up to 5 latest articles from this RSS XML feed.
Respond ONLY with valid JSON array:
[
  {
    "title": "Article Title",
    "summary": "Short snippet or description",
    "sourceUrl": "Link to original",
    "author": "Feed Publisher Name",
    "createdAt": "${(/* @__PURE__ */ new Date()).toISOString()}"
  }
]
XML:
${xmlText.substring(0, 15e3)}
`;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const items = JSON.parse(response.text || "[]");
    res.json({ success: true, items });
  } catch (err) {
    console.error("RSS fetch error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "API_NOT_FOUND",
    message: `\u0130stenen API adresi (${req.method} ${req.path}) bulunamad\u0131.`
  });
});
app.use((err, req, res, _next) => {
  console.error("[Global Error Handler]:", err);
  if (res.headersSent) {
    return _next(err);
  }
  const statusCode = typeof err?.status === "number" ? err.status : typeof err?.statusCode === "number" ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err?.code || "SERVER_ERROR",
    message: err?.message || "Sunucu hatas\u0131 olu\u015Ftu. L\xFCtfen tekrar deneyin."
  });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VOX Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
