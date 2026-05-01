import { describe, expect, it } from 'vitest';
import { parseQuestionsJson } from './generate-questions';

describe('parseQuestionsJson', () => {
  it('parses the canonical {"questions": [...]} shape', () => {
    const input = '{"questions": ["What surprised you?", "Best class so far?"]}';
    expect(parseQuestionsJson(input)).toEqual([
      'What surprised you?',
      'Best class so far?',
    ]);
  });

  it('parses a bare JSON array', () => {
    const input = '["Q1", "Q2", "Q3"]';
    expect(parseQuestionsJson(input)).toEqual(['Q1', 'Q2', 'Q3']);
  });

  it('strips ```json fences', () => {
    const input = '```json\n{"questions": ["Q1"]}\n```';
    expect(parseQuestionsJson(input)).toEqual(['Q1']);
  });

  it('strips bare ``` fences', () => {
    const input = '```\n["Q1", "Q2"]\n```';
    expect(parseQuestionsJson(input)).toEqual(['Q1', 'Q2']);
  });

  it('trims whitespace around questions', () => {
    expect(parseQuestionsJson('{"questions": ["  trimmed  ", "kept"]}')).toEqual([
      'trimmed',
      'kept',
    ]);
  });

  it('drops empty strings from the list', () => {
    expect(parseQuestionsJson('{"questions": ["good", "", "   ", "alsoGood"]}')).toEqual([
      'good',
      'alsoGood',
    ]);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseQuestionsJson('not json at all')).toThrow(/invalid JSON/i);
  });

  it('throws when the JSON contains no questions array', () => {
    expect(() => parseQuestionsJson('{"foo": "bar"}')).toThrow(/questions.*array/i);
  });

  it('throws when the questions array is empty', () => {
    expect(() => parseQuestionsJson('{"questions": []}')).toThrow(/zero usable/i);
  });

  it('throws when all entries are non-strings', () => {
    expect(() => parseQuestionsJson('{"questions": [1, 2, null]}')).toThrow(
      /zero usable/i,
    );
  });
});
