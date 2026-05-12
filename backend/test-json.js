const rawText = `{"translations": [{"i":0, "t":"nước"}]}`;
const translatedTexts = JSON.parse(rawText);
console.log("Is array?", Array.isArray(translatedTexts));
