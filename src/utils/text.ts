const MAX_TEXT_CHUNK_LENGTH = 2000; // 你可以根据需要调整这个值

export function splitText(
  text: string = "",
  maxLength: number = MAX_TEXT_CHUNK_LENGTH
): string[] {
  const paragraphs = text.split("\n");
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 1 <= maxLength) {
      // +1 是为了加上换行符
      currentChunk += (currentChunk.length > 0 ? "\n" : "") + paragraph;
    } else {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}
