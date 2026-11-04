import { SubmissionRecord } from '../../data/services';

export const embedSnippet = (origin: string, projectId: string) =>
  `<script src="${origin}/flowpilot.js" data-project-id="${projectId}" defer></script>`;

export const inlineSnippet = (projectId: string) => `<div data-flowpilot="${projectId}"></div>`;

/**
 * Cells starting with = + - @ would run as formulas when opened in a spreadsheet.
 * The data comes from anonymous visitors, so they get a leading quote.
 */
export function csvCell(value: unknown): string {
  let text = value === undefined || value === null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function submissionsToCsv(rows: SubmissionRecord[]): string {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row.data)))];
  const header = ['Received', ...columns].map(csvCell).join(',');
  const lines = rows.map((row) => [row.createdAt, ...columns.map((column) => row.data[column])].map(csvCell).join(','));
  return [header, ...lines].join('\r\n');
}
