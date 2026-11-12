import type { Scenario } from '../../engine/types';
import { acrCasa } from './acr-casa';
import { fbaoAdulto } from './fbao-adulto';
import { fbaoLattante } from './fbao-lattante';
import { doloreToracico } from './dolore-toracico';
import { ictus } from './ictus';
import { ipoglicemia } from './ipoglicemia';
import { emorragiaCantiere } from './emorragia-cantiere';
import { traumaMoto } from './trauma-moto';
import { bpco } from './bpco';
import { annegamento } from './annegamento';
import { oppioidi } from './oppioidi';
import { colpoCalore } from './colpo-calore';
import { convulsioni } from './convulsioni';
import { alcol } from './alcol';
import { anafilassi } from './anafilassi';
import { acrConcerto } from './acr-concerto';
import { acrSupermercato } from './acr-supermercato';

/** Ordine consigliato: dal più semplice al più complesso all'interno di ogni categoria. */
export const SCENARIOS: Scenario[] = [
  acrCasa,
  fbaoAdulto,
  ipoglicemia,
  ictus,
  doloreToracico,
  fbaoLattante,
  emorragiaCantiere,
  oppioidi,
  annegamento,
  bpco,
  traumaMoto,
  convulsioni,
  acrConcerto,
  colpoCalore,
  anafilassi,
  alcol,
  acrSupermercato,
];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));
