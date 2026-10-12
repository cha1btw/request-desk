import { Client } from '../clients/client.entity';
import { escapeCsvCell, requestsToCsv } from './csv';
import { CustomerRequest } from './customer-request.entity';
import { RequestStatus } from './request-status.enum';

function makeRequest(overrides: Partial<CustomerRequest> = {}): CustomerRequest {
  return {
    id: 1,
    title: 'Fix the door',
    description: 'It does not close',
    status: RequestStatus.New,
    clientId: 1,
    client: { id: 1, name: 'Anna', email: 'anna@example.com', phone: '+380 44 123 45 67' } as Client,
    comments: [],
    createdAt: new Date('2026-10-01T10:00:00Z'),
    updatedAt: new Date('2026-10-02T11:30:00Z'),
    ...overrides,
  };
}

describe('escapeCsvCell', () => {
  it('leaves plain text unchanged', () => {
    expect(escapeCsvCell('Fix the door')).toBe('Fix the door');
  });

  it('wraps cells with commas in quotes', () => {
    expect(escapeCsvCell('door, window')).toBe('"door, window"');
  });

  it('doubles quotes inside a quoted cell', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('keeps line breaks inside a quoted cell', () => {
    expect(escapeCsvCell('line 1\nline 2')).toBe('"line 1\nline 2"');
  });

  it('neutralizes spreadsheet formulas', () => {
    expect(escapeCsvCell('=SUM(A1:A9)')).toBe("'=SUM(A1:A9)");
    expect(escapeCsvCell('@cmd')).toBe("'@cmd");
    expect(escapeCsvCell('-2+3+cmd')).toBe("'-2+3+cmd");
  });

  it('does not touch phone numbers', () => {
    expect(escapeCsvCell('+380 44 123 45 67')).toBe('+380 44 123 45 67');
  });
});

describe('requestsToCsv', () => {
  it('starts with a BOM and a header row and ends each line with CRLF', () => {
    const csv = requestsToCsv([]);
    expect(csv).toBe(
      '\uFEFFID,Title,Description,Status,Client,Client email,Client phone,Created at,Updated at\r\n',
    );
  });

  it('writes one row per request', () => {
    const csv = requestsToCsv([
      makeRequest(),
      makeRequest({ id: 2, title: 'Paint, the fence', status: RequestStatus.Done }),
    ]);
    const lines = csv.trim().split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe(
      '1,Fix the door,It does not close,new,Anna,anna@example.com,+380 44 123 45 67,2026-10-01T10:00:00.000Z,2026-10-02T11:30:00.000Z',
    );
    expect(lines[2]).toContain('2,"Paint, the fence"');
    expect(lines[2]).toContain(',done,');
  });
});
