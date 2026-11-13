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
import { pblsLattante } from './pbls-lattante';
import { tutorial } from './tutorial';
import { ustioneBambino } from './ustione-bambino';
import { fratturaCampo } from './frattura-campo';
import { ipotermia } from './ipotermia';
import { monossido } from './monossido';
import { parto } from './parto';

/** Ordine consigliato: dal più semplice al più complesso all'interno di ogni categoria. */
export const SCENARIOS: Scenario[] = [
  tutorial,
  acrCasa,
  fbaoAdulto,
  ipoglicemia,
  ictus,
  doloreToracico,
  fbaoLattante,
  pblsLattante,
  ustioneBambino,
  fratturaCampo,
  emorragiaCantiere,
  monossido,
  oppioidi,
  annegamento,
  bpco,
  ipotermia,
  traumaMoto,
  parto,
  convulsioni,
  acrConcerto,
  colpoCalore,
  anafilassi,
  alcol,
  acrSupermercato,
];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

/** Scenari che contano per turni, distintivi e statistiche (esclusa la missione guidata). */
export const CAREER_SCENARIOS: Scenario[] = SCENARIOS.filter((s) => !s.tutorial);
