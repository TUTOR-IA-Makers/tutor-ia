import type { Question } from '@/domain'

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
}

export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

export function buildMockMoodleXml(questions: readonly Question[]): string {
  const items = questions.map(
    (question) =>
      `  <question type="coderunner">\n    <name><text>${escapeXml(question.title)}</text></name>\n  </question>`,
  )
  return `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n${items.join('\n')}\n</quiz>\n`
}
