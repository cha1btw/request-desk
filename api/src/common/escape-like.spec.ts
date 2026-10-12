import { escapeLike } from './escape-like';

describe('escapeLike', () => {
  it('leaves normal text unchanged', () => {
    expect(escapeLike('Anna Petrenko')).toBe('Anna Petrenko');
  });

  it('escapes the LIKE wildcards and the escape character itself', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
