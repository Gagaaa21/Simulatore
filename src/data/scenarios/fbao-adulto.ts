import type { Scenario } from '../../engine/types';
import { afterContact, before, flagT } from './helpers';

/** Ostruzione grave delle vie aeree da corpo estraneo in un adulto cosciente, al ristorante. */
export const fbaoAdulto: Scenario = {
  id: 'fbao-adulto',
  title: 'Il boccone di troppo',
  subtitle: 'Soffocamento al ristorante: la tosse non basta più',
  category: '118',
  difficulty: 1,
  minutes: 8,
  setting: 'ristorante',
  timeOfDay: 'sera',
  role: 'msb',
  crew: 3,
  dispatch: {
    luogo: 'P',
    patologia: 'C3',
    criticita: 'R',
    address: 'Trattoria «Il Glicine», via Garibaldi 21',
    caller: 'Titolare del locale',
    time: '20:41',
    travel: 240,
    text: 'Uomo di 58 anni che si è soffocato mangiando. All’inizio tossiva, ora «non riesce più a parlare». Un cameriere gli sta dando colpi sulla schiena.',
  },
  loadout: {
    essential: ['zaino', 'pallone', 'aspiratore', 'dae'],
    recommended: ['ossigeno'],
    fetchTime: 90,
    note: 'Codice rosso respiratorio: se il paziente perde coscienza serviranno subito pallone, aspiratore e DAE.',
  },
  scene: {
    intro: 'Sala del ristorante, clienti in piedi attorno a un tavolo. Il paziente è in piedi, piegato in avanti, con le mani alla gola; un cameriere gli batte sulla schiena senza risultato.',
    hazards: [],
    bystanders: 'La moglie e il cameriere. Gli altri clienti si sono scostati.',
  },
  patient: {
    name: 'Giorgio',
    age: 58,
    sex: 'M',
    weightKg: 84,
    avpu: 'A',
    gcs: 15,
    airway: 'ostruzione_completa',
    breathing: 'assente',
    rhythm: 'tachicardia',
    pulseRadial: true,
    v: { hr: 128, rr: 0, spo2: 86, sbp: 165, dbp: 95, glu: 120, temp: 36.6, crt: 2 },
    spo2Air: 86,
    skin: { color: 'cianotica', temp: 'normale', sweaty: true },
    pupils: 'normali',
    speech: 'assente',
    position: 'in_piedi',
    canSwallow: false,
    seizing: false,
    vomitInMouth: false,
    look: { skinTone: '#e2b48f', hair: '#3a2c22', hairStyle: 'corti', shirt: '#f2f2f0', pants: '#2c3340', build: 'robusto' },
  },
  trauma: false,
  arrest: { shockable: false, roscAfterCprSeconds: 60, needsVentilation: true },
  answers: {
    testimoni: '[Moglie] Stava mangiando la bistecca, ha riso ed è diventato rosso, poi viola. Prima tossiva, adesso non riesce a fare niente!',
    eventi: '[Moglie] Gli è andato di traverso un pezzo di carne mentre rideva.',
    patologie: '[Moglie] È iperteso, nient’altro.',
    farmaci: '[Moglie] Prende una pastiglia per la pressione.',
    allergie: '[Moglie] Nessuna.',
    pasto: '[Moglie] Stava cenando adesso: bistecca e vino.',
    sintomi: 'Mi fa male lo stomaco dove mi avete schiacciato… e la gola.',
  },
  exam: {
    testaPiedi: 'Nessun trauma. Dolore alla palpazione dell’addome superiore dopo le compressioni addominali.',
    cavoOrale: 'Nessun corpo estraneo visibile.',
  },
  protocol: { correct: ['fbao_adulto'] },
  valutazione: { correct: ['I1', 'I2'] },
  reportKeys: ['spo2'],
  msa: { available: true, eta: 600 },
  timeLimit: 1080,
  objectives: [
    {
      id: 'manovra_rapida',
      label: 'Prima manovra di disostruzione entro 30 s dal contatto',
      category: 'tempi',
      points: 12,
      critical: true,
      check: (s) => afterContact(s, 'colpi_dorsali', 'compressioni_addominali') <= 30,
      why: 'L’ostruzione completa porta all’ipossia in pochi minuti: si agisce subito.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'sequenza',
      label: 'Colpi dorsali prima delle compressioni addominali, alternati',
      category: 'trattamento',
      points: 10,
      check: (s) => before(s, 'colpi_dorsali', 'compressioni_addominali') && s.count('compressioni_addominali') >= 1,
      why: 'ERC: fino a 5 colpi interscapolari, poi fino a 5 compressioni addominali, alternando finché si risolve.',
      sources: ['ERC_FA_2025', 'ERC_LAY_2025'],
    },
    {
      id: 'risolta',
      label: 'Ostruzione risolta',
      category: 'trattamento',
      points: 10,
      critical: true,
      check: (s) => flagT(s, 'liberatoAt') !== null || flagT(s, 'corpoRimossoAt') !== null,
      why: 'L’obiettivo è ripristinare il passaggio d’aria prima dell’arresto cardiaco ipossico.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'dopo',
      label: 'Dopo la disostruzione: saturimetro e rivalutazione',
      category: 'valutazione',
      points: 6,
      check: (s) => {
        const t = flagT(s, 'liberatoAt') ?? flagT(s, 'corpoRimossoAt');
        return t !== null && s.pulseOx && (s.doneAt.get('saturimetro') ?? []).length > 0;
      },
      why: 'Dopo un episodio ipossico si controlla l’ossigenazione e si cercano complicanze.',
      sources: ['ERC_FA_2025'],
    },
    {
      id: 'ospedale',
      label: 'Paziente accompagnato in ospedale per una valutazione medica',
      category: 'comunicazione',
      points: 6,
      check: (s) => s.ended?.reason === 'Trasporto in ospedale' || s.ended?.reason === 'Consegna al mezzo avanzato',
      why: 'Dopo le compressioni addominali serve una valutazione medica: possono causare lesioni interne.',
      sources: ['ERC_FA_2025'],
    },
  ],
  teaching: [
    'Se la vittima tossisce in modo efficace, incoraggia la tosse e sorveglia; se la tosse diventa inefficace, agisci.',
    'Fino a 5 colpi interscapolari con il paziente inclinato in avanti, poi fino a 5 compressioni addominali; alterna.',
    'Se perde coscienza, accompagnalo a terra e inizia subito le compressioni toraciche: possono espellere il corpo estraneo.',
    'Rimuovi solo un oggetto chiaramente visibile; mai esplorare la bocca alla cieca.',
    'Dopo le compressioni addominali il paziente va valutato in ospedale anche se sta bene.',
  ],
  sources: ['ERC_FA_2025', 'ERC_BLS_2025', 'ERC_LAY_2025'],
  hooks: {
    tick: (s) => {
      const p = s.p;
      // da cosciente l'ipossia progredisce più lentamente (residua minima ventilazione)
      if (p.airway === 'ostruzione_completa' && p.avpu === 'A') p.spo2Air = Math.min(100, p.spo2Air + 0.3);
      // disostruzione da cosciente: almeno un ciclo di colpi dorsali e due di compressioni addominali
      if (p.airway === 'ostruzione_completa' && p.avpu === 'A' && s.count('colpi_dorsali') >= 1 && s.count('compressioni_addominali') >= 2 && !s.busy) {
        p.airway = 'pervie';
        p.breathing = 'tachipnoico';
        p.speech = 'frasi_brevi';
        p.position = 'seduto';
        p.spo2Air = 93;
        p.skin.color = 'arrossata';
        p.canSwallow = true;
        s.base.rr = 24;
        s.set('liberatoAt', s.t);
        s.say('paziente', 'Con la compressione il boccone schizza fuori! Il paziente tossisce forte, respira a fondo e si lascia cadere su una sedia.');
        s.soundQueue.push('ok');
      }
      // perdita di coscienza con ostruzione ancora presente
      if (p.airway === 'ostruzione_completa' && p.avpu === 'U' && !s.flags.svenuto) {
        s.set('svenuto', s.t);
        s.set('cprIndicata', true);
        p.position = 'supino';
        p.breathing = 'assente';
        s.say('paziente', 'Il paziente perde i sensi: lo accompagnate a terra.');
        s.hint('Ostruzione con perdita di coscienza: chiama aiuto e inizia subito le compressioni toraciche.');
      }
      // le compressioni smuovono il corpo estraneo
      if (s.flags.svenuto && s.cpr.active) {
        const n = Number(s.flags.cprSec ?? 0) + 1;
        s.set('cprSec', n);
        if (n === 20 && !s.flags.corpoVisibile) {
          s.set('corpoVisibile', true);
          s.say('evento', 'Durante le compressioni il paziente ha un sussulto: controlla la bocca prima di ventilare.');
        }
      }
      if (s.flags.corpoRimosso && !s.flags.corpoRimossoAt) {
        s.set('corpoRimossoAt', s.t);
        p.airway = 'pervie';
        s.set('cprIndicata', false);
      }
      // dopo la rimozione, con la ventilazione il respiro riprende
      const rem = flagT(s, 'corpoRimossoAt');
      if (rem !== null && !s.inArrest() && p.breathing === 'assente' && (s.bvm || s.cpr.ventilation === 'pallone') && s.t - rem > 20) {
        p.breathing = 'superficiale';
        p.spo2Air = 80;
        s.base.rr = 10;
        s.say('paziente', 'Il paziente fa un respiro spontaneo, poi un altro.');
      }
      if (rem !== null && p.breathing === 'superficiale' && s.t - rem > 70) {
        p.breathing = 'normale';
        p.avpu = 'P';
        p.spo2Air = 92;
        s.base.rr = 16;
        s.say('paziente', 'Il respiro è ora regolare; il paziente reagisce allo stimolo doloroso.');
      }
      if (s.inArrest() && !s.flags.corpoRimosso) s.cpr.goodSeconds = 0;
      if (flagT(s, 'liberatoAt') !== null) s.base.hr = Math.max(94, s.base.hr - 0.2);
    },
    onAction: (s, id) => {
      const p = s.p;
      if (id === 'coscienza' && p.airway === 'ostruzione_completa' && p.avpu === 'A') {
        s.find('È cosciente, ti guarda terrorizzato, si porta le mani alla gola: alla domanda «Ti stai soffocando?» annuisce. Non riesce a parlare né a tossire.');
        s.measure('avpu', 'Coscienza (AVPU)', 'A');
        return true;
      }
      if (id === 'compressioni_addominali' && !s.did('colpi_dorsali') && s.count('compressioni_addominali') === 1) {
        s.penalize('addominali_prima', 'lieve', 'Compressioni addominali prima dei colpi dorsali', 'La sequenza ERC inizia con fino a 5 colpi interscapolari.', ['ERC_FA_2025']);
      }
      if (id === 'ispeziona_bocca' && s.flags.corpoVisibile && !s.flags.corpoRimosso) {
        s.find('In fondo alla bocca vedi chiaramente un pezzo di carne.');
        return true;
      }
      if (id === 'pallone' && p.airway === 'ostruzione_completa') {
        s.find('Il torace non si solleva: l’ostruzione persiste. Controlla la bocca.');
        return true;
      }
      if (id === 'gas' && p.airway === 'ostruzione_completa' && p.avpu === 'U') {
        s.find('Non respira: nessun passaggio d’aria.');
        return true;
      }
      return false;
    },
  },
};
