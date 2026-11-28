/** Sentence boundaries, not hesitation marks or commas, start a new dialogue line. */
export function speechSentences(text:string):string[]{
 return text.trim().split(/(?<=[.!?。！？])\s+/u).map(part=>part.trim()).filter(Boolean);
}
