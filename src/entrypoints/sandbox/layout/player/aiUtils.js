export const LANGUAGE_GROUPS = [
  {
    label: "Popular",
    languages: ["original", "en", "es", "fr", "de", "vi", "ja", "ko", "zh"],
  },
  {
    label: "All Languages",
    languages: [
      "ar", "bg", "cs", "da", "el", "fi", "hi", "hr", "hu", "id", "it",
      "ms", "nl", "no", "pl", "pt", "ro", "ru", "sk", "sv", "th", "tr", "uk",
    ],
  },
];

export const getSupportedLanguages = () => {
  return {
    original: "Original",
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    vi: "Vietnamese",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    ar: "Arabic",
    bg: "Bulgarian",
    cs: "Czech",
    da: "Danish",
    el: "Greek",
    fi: "Finnish",
    hi: "Hindi",
    hr: "Croatian",
    hu: "Hungarian",
    id: "Indonesian",
    it: "Italian",
    ms: "Malay",
    nl: "Dutch",
    no: "Norwegian",
    pl: "Polish",
    pt: "Portuguese",
    ro: "Romanian",
    ru: "Russian",
    sk: "Slovak",
    sv: "Swedish",
    th: "Thai",
    tr: "Turkish",
    uk: "Ukrainian",
  };
};

function formatTimestamp(seconds) {
  const pad = (num, size) => ("000" + num).slice(size * -1);
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hrs, 2)}:${pad(mins, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
}

export const formatToVTT = (segments) => {
  let vtt = "WEBVTT\n\n";
  segments.forEach((seg, i) => {
    const startVal = parseFloat(seg.start) || 0;
    let endVal = seg.end !== undefined ? parseFloat(seg.end) : startVal + (parseFloat(seg.duration) || 2);
    
    if (endVal <= startVal) {
      endVal = startVal + 1.0;
    }

    vtt += `${i + 1}\n`;
    vtt += `${formatTimestamp(startVal)} --> ${formatTimestamp(endVal)}\n`;
    vtt += `${seg.text}\n\n`;
  });
  return vtt;
};

export const formatToSRT = (segments) => {
  let srt = "";
  segments.forEach((seg, i) => {
    const startVal = parseFloat(seg.start) || 0;
    let endVal = seg.end !== undefined ? parseFloat(seg.end) : startVal + (parseFloat(seg.duration) || 2);
    
    if (endVal <= startVal) {
      endVal = startVal + 1.0;
    }

    const start = formatTimestamp(startVal).replace(".", ",");
    const end = formatTimestamp(endVal).replace(".", ",");
    srt += `${i + 1}\n${start} --> ${end}\n${seg.text}\n\n`;
  });
  return srt;
};
