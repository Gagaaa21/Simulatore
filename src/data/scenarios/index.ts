import type { Scenario } from '../../engine/types';
import { acrCasa } from './acr-casa';

export const SCENARIOS: Scenario[] = [acrCasa];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
