/**
 * ASS Subtitle Parser
 *
 * Parses Advanced SubStation Alpha (.ass) subtitle data into
 * structured objects usable by the WebCodecs subtitle burner.
 * Handles style extraction and dialogue timing/text parsing.
 */

/**
 * Parse an ASS time string (H:MM:SS.CC) into seconds.
 * @param {string} timeStr - e.g. "0:02:15.40"
 * @returns {number} Time in seconds
 */
function parseAssTime(timeStr) {
  const parts = timeStr.trim().split(":");
  if (parts.length !== 3) return 0;
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const secParts = parts[2].split(".");
  const seconds = parseInt(secParts[0], 10) || 0;
  const centiseconds = parseInt(secParts[1] || "0", 10) || 0;
  return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
}

/**
 * Parse an ASS color string (&HAABBGGRR) into CSS-compatible rgba.
 * @param {string} colorStr - e.g. "&H00FFFFFF" or "&HB4000000"
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
function parseAssColor(colorStr) {
  const cleaned = colorStr.replace(/^&H/i, "").replace(/&$/, "");
  const padded = cleaned.padStart(8, "0");
  const alpha = parseInt(padded.slice(0, 2), 16);
  const blue = parseInt(padded.slice(2, 4), 16);
  const green = parseInt(padded.slice(4, 6), 16);
  const red = parseInt(padded.slice(6, 8), 16);
  // ASS alpha: 0 = fully opaque, 255 = fully transparent
  return { r: red, g: green, b: blue, a: 1 - alpha / 255 };
}

/**
 * Convert parsed color to CSS rgba string.
 */
function colorToRgba({ r, g, b, a }) {
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
}

/**
 * Parse a complete ASS subtitle string.
 *
 * @param {string} assData - Raw ASS file content
 * @returns {{
 *   styles: Map<string, AssStyle>,
 *   dialogues: Array<{start: number, end: number, text: string, styleName: string}>
 * }}
 */
export function parseASS(assData) {
  const lines = assData.split("\n");
  const styles = new Map();
  const dialogues = [];

  let currentSection = "";
  let styleFormatOrder = [];
  let eventFormatOrder = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Section headers
    if (line.startsWith("[")) {
      currentSection = line.toLowerCase();
      continue;
    }

    // Parse styles
    if (currentSection.includes("styles")) {
      if (line.startsWith("Format:")) {
        styleFormatOrder = line
          .slice(7)
          .split(",")
          .map((f) => f.trim().toLowerCase());
        continue;
      }

      if (line.startsWith("Style:")) {
        const values = line.slice(6).split(",").map((v) => v.trim());
        const styleObj = {};
        styleFormatOrder.forEach((key, idx) => {
          styleObj[key] = values[idx] || "";
        });

        const name = styleObj.name || "Default";
        styles.set(name, {
          fontName: styleObj.fontname || "sans-serif",
          fontSize: parseInt(styleObj.fontsize, 10) || 48,
          primaryColor: styleObj.primarycolour
            ? parseAssColor(styleObj.primarycolour)
            : { r: 255, g: 255, b: 255, a: 1 },
          backColor: styleObj.backcolour
            ? parseAssColor(styleObj.backcolour)
            : { r: 0, g: 0, b: 0, a: 0.7 },
          outlineColor: styleObj.outlinecolour
            ? parseAssColor(styleObj.outlinecolour)
            : { r: 0, g: 0, b: 0, a: 1 },
          bold: styleObj.bold === "-1" || styleObj.bold === "1",
          outline: parseFloat(styleObj.outline) || 1,
          shadow: parseFloat(styleObj.shadow) || 0,
          alignment: parseInt(styleObj.alignment, 10) || 2,
          marginV: parseInt(styleObj.marginv, 10) || 20,
          marginL: parseInt(styleObj.marginl, 10) || 10,
          marginR: parseInt(styleObj.marginr, 10) || 10,
          borderStyle: parseInt(styleObj.borderstyle, 10) || 1,
        });
        continue;
      }
    }

    // Parse dialogues
    if (currentSection.includes("events")) {
      if (line.startsWith("Format:")) {
        eventFormatOrder = line
          .slice(7)
          .split(",")
          .map((f) => f.trim().toLowerCase());
        continue;
      }

      if (line.startsWith("Dialogue:")) {
        const textIdx = eventFormatOrder.indexOf("text");
        // Dialogue text may contain commas, so we split only up to textIdx
        const rawValues = line.slice(9);
        const parts = rawValues.split(",");
        const fieldValues = parts.slice(0, textIdx);
        const text = parts.slice(textIdx).join(",").trim();

        const eventObj = {};
        eventFormatOrder.forEach((key, idx) => {
          if (idx < textIdx) {
            eventObj[key] = (fieldValues[idx] || "").trim();
          }
        });

        const start = parseAssTime(eventObj.start || "0:00:00.00");
        const end = parseAssTime(eventObj.end || "0:00:00.00");

        // Skip zero-duration or invalid entries
        if (end <= start) continue;

        // Clean ASS escape sequences
        const cleanedText = text
          .replace(/\\N/g, "\n") // Newline
          .replace(/\\n/g, "\n")
          .replace(/\{[^}]*\}/g, ""); // Remove override tags like {\b1}

        dialogues.push({
          start,
          end,
          text: cleanedText,
          styleName: eventObj.style || "Default",
        });
      }
    }
  }

  // Ensure a Default style exists
  if (!styles.has("Default")) {
    styles.set("Default", {
      fontName: "sans-serif",
      fontSize: 48,
      primaryColor: { r: 255, g: 255, b: 255, a: 1 },
      backColor: { r: 0, g: 0, b: 0, a: 0.7 },
      outlineColor: { r: 0, g: 0, b: 0, a: 1 },
      bold: true,
      outline: 1,
      shadow: 0,
      alignment: 2,
      marginV: 20,
      marginL: 10,
      marginR: 10,
      borderStyle: 3,
    });
  }

  return { styles, dialogues };
}

export { colorToRgba };
