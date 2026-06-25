import { Engine } from 'json-rules-engine';
import type { RuleProperties } from 'json-rules-engine';

export function createRulesEngine(rules: RuleProperties[]) {
  return new Engine(rules);
}
