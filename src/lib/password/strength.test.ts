import { describe, expect, it } from 'vitest';
import { scorePassword } from './strength';

describe('scorePassword', () => {
  it('returns empty state for blank password', () => {
    expect(scorePassword('')).toEqual({ level: 0, label: '', filledSegments: 0 });
  });

  it('scores fair when minimum length is met', () => {
    expect(scorePassword('abcdefgh').level).toBe(2);
  });

  it('scores good when uppercase and number are present', () => {
    expect(scorePassword('Password1').level).toBe(3);
  });

  it('scores strong with symbols or long length', () => {
    expect(scorePassword('Password1!').level).toBe(4);
    expect(scorePassword('Password1234').level).toBe(4);
  });
});
