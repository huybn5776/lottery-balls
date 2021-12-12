export function splitTextareaString(text: string): string[] {
  return text
    .split('\n')
    .map((t) => t.trim())
    .filter((n) => n);
}
