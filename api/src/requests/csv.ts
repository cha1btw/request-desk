import { CustomerRequest } from './customer-request.entity';

// Excel and Google Sheets run a cell as a formula when it starts with = + - @
// (or a tab / carriage return). Text typed by users could abuse that, so we put
// an apostrophe in front. Cells that contain only digits, spaces and + ( ) -
// (phone numbers, numbers) cannot form a harmful formula and stay as they are.
function neutralizeFormula(value: string): string {
  if (/^[+\d\s()-]+$/.test(value)) return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

// CSV rules (RFC 4180): a cell with a comma, a quote or a line break goes in
// double quotes, and a quote inside it is written twice.
export function escapeCsvCell(value: string): string {
  const safe = neutralizeFormula(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

const HEADER = [
  'ID',
  'Title',
  'Description',
  'Status',
  'Client',
  'Client email',
  'Client phone',
  'Created at',
  'Updated at',
];

// The BOM (\uFEFF) at the start makes Excel read the file as UTF-8, so
// non-English names do not turn into garbage.
export function requestsToCsv(requests: CustomerRequest[]): string {
  const rows = requests.map((request) => [
    String(request.id),
    request.title,
    request.description,
    request.status,
    request.client.name,
    request.client.email,
    request.client.phone,
    request.createdAt.toISOString(),
    request.updatedAt.toISOString(),
  ]);

  const lines = [HEADER, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
