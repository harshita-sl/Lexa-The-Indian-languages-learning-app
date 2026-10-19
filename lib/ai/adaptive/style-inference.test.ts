import { describe, it, expect } from 'vitest';
import {
  computeStyle,
  modalityScore,
  STYLE_WARMUP_ATTEMPTS,
  SessionEvidence,
} from './style-inference';

function evidence(
  skill: SessionEvidence['skill'],
  count: number,
  isCorrect = true,
  latencyMs = 3000
): SessionEvidence[] {
  return Array.from({ length: count }, () => ({ skill, isCorrect, latencyMs }));
}

describe('computeStyle', () => {
  it('returns declared style when there is no evidence', () => {
    const p = computeStyle('audio', []);
    expect(p.declared).toBe('audio');
    expect(p.inferred).toBeNull();
    expect(p.effective).toBe('audio');
    expect(p.evidence).toBe(0);
  });

  it('defaults to balanced when declared is missing/invalid', () => {
    expect(computeStyle(null, []).declared).toBe('balanced');
    expect(computeStyle('nonsense', []).declared).toBe('balanced');
  });

  it('stays declared while evidence is below warmup', () => {
    const sessions = evidence('listening', STYLE_WARMUP_ATTEMPTS - 1);
    const p = computeStyle('visual', sessions);
    expect(p.inferred).toBeNull();
    expect(p.effective).toBe('visual');
  });

  it('a dominant inferred modality overrides a mismatched declared style', () => {
    // All evidence is strong 'listening' performance → inferred 'audio'
    // beats a 'visual' declaration with zero visual evidence.
    const sessions = evidence('listening', 20, true, 2500);
    const p = computeStyle('visual', sessions);
    expect(p.inferred).toBe('audio');
    expect(p.effective).toBe('audio');
  });

  it('balanced declared style defers to inference once warmed up', () => {
    const sessions = evidence('speaking', 16, true, 2000);
    const p = computeStyle('balanced', sessions);
    expect(p.inferred).toBe('speaking');
    expect(p.effective).toBe('speaking');
  });

  it('declared style holds when evidence actually supports it', () => {
    const sessions = [
      ...evidence('vocabulary', 12, true, 2500),
      ...evidence('listening', 5, false, 12000),
    ];
    const p = computeStyle('visual', sessions);
    expect(p.inferred).toBe('visual');
    expect(p.effective).toBe('visual');
  });
});

describe('modalityScore', () => {
  it('rewards accuracy and speed; weak prior with no rows', () => {
    const strong = modalityScore(evidence('listening', 5, true, 1000), 'audio');
    const none = modalityScore([], 'audio');
    expect(strong).toBeGreaterThan(0.8);
    expect(none).toBe(0.25);
  });
});
