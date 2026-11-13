/** Presidi disponibili su un Mezzo di Soccorso di Base (MSB) o in dotazione a una squadra a piedi. */

export type EquipmentId =
  | 'zaino'
  | 'dae'
  | 'ossigeno'
  | 'pallone'
  | 'aspiratore'
  | 'kit_emorragie'
  | 'collari'
  | 'cucchiaio'
  | 'materasso'
  | 'tavola'
  | 'ked'
  | 'steccobende'
  | 'cintura_pelvica'
  | 'sedia'
  | 'kit_ustioni'
  | 'dpi_extra'
  | 'kit_raffreddamento'
  | 'kit_parto';

export interface Equipment {
  id: EquipmentId;
  name: string;
  slots: number; // ingombro: l'equipaggio porta al massimo CAPACITY slot per viaggio
  what: string; // cos'è / cosa contiene
  when: string; // quando serve
  contains?: string[];
}

export const CAPACITY = 8;

export const EQUIPMENT: Record<EquipmentId, Equipment> = {
  zaino: {
    id: 'zaino',
    name: 'Zaino di primo soccorso',
    slots: 1,
    what: 'Borsa base dell’equipaggio.',
    contains: ['guanti e DPI base', 'saturimetro', 'sfigmomanometro e fonendoscopio', 'glucometro', 'termometro', 'lampadina per le pupille', 'cannule orofaringee', 'garze, bende, forbici', 'telo isotermico'],
    when: 'Sempre: senza zaino non puoi rilevare i parametri.',
  },
  dae: {
    id: 'dae',
    name: 'DAE – defibrillatore',
    slots: 1,
    what: 'Defibrillatore semiautomatico esterno con piastre adulto e, se previste, pediatriche.',
    when: 'Sempre nei codici rossi e in ogni sospetto arresto cardiaco o perdita di coscienza.',
  },
  ossigeno: {
    id: 'ossigeno',
    name: 'Ossigeno portatile',
    slots: 1,
    what: 'Bombola portatile con flussimetro: occhialini nasali, maschere semplici, Venturi con valvole dal 24 al 60% e maschere con reservoir.',
    when: 'Dispnea, cianosi, SpO₂ sotto il target; necessario anche per arricchire il pallone in RCP.',
  },
  pallone: {
    id: 'pallone',
    name: 'Pallone autoespansibile',
    slots: 1,
    what: 'Pallone-maschera (AMBU) con reservoir e maschere di più misure.',
    when: 'Ventilazione in arresto cardiaco o nel respiro assente/inefficace con polso presente.',
  },
  aspiratore: {
    id: 'aspiratore',
    name: 'Aspiratore portatile',
    slots: 1,
    what: 'Aspiratore a batteria con sonde rigide e flessibili.',
    when: 'Secrezioni, vomito o sangue in bocca in un paziente con coscienza alterata.',
  },
  kit_emorragie: {
    id: 'kit_emorragie',
    name: 'Kit emorragie',
    slots: 1,
    what: 'Tourniquet, garze emostatiche, bende compressive.',
    when: 'Traumi con emorragia, ferite da taglio, amputazioni.',
  },
  collari: {
    id: 'collari',
    name: 'Collari cervicali',
    slots: 1,
    what: 'Set di collari regolabili.',
    when: 'Trauma con sospetta lesione spinale, secondo il protocollo regionale.',
  },
  cucchiaio: {
    id: 'cucchiaio',
    name: 'Barella a cucchiaio',
    slots: 2,
    what: 'Barella scomponibile che si inserisce sotto il paziente senza ruotarlo.',
    when: 'Sollevare un traumatizzato limitando i movimenti della colonna.',
  },
  materasso: {
    id: 'materasso',
    name: 'Materassino a depressione',
    slots: 2,
    what: 'Materasso che si modella sul corpo e si irrigidisce togliendo l’aria.',
    when: 'Immobilizzazione e trasporto del traumatizzato con sospetta lesione spinale o di bacino.',
  },
  tavola: {
    id: 'tavola',
    name: 'Tavola spinale',
    slots: 2,
    what: 'Asse rigida con fermacapo e cinghie (ragno).',
    when: 'Soprattutto estricazione e spostamenti brevi; non è il presidio ideale per il trasporto.',
  },
  ked: {
    id: 'ked',
    name: 'Estricatore (KED)',
    slots: 1,
    what: 'Corsetto semirigido per l’estricazione da seduto.',
    when: 'Paziente stabile seduto in un veicolo con sospetta lesione spinale.',
  },
  steccobende: {
    id: 'steccobende',
    name: 'Steccobende',
    slots: 1,
    what: 'Stecche modellabili o a depressione per gli arti.',
    when: 'Sospette fratture degli arti.',
  },
  cintura_pelvica: {
    id: 'cintura_pelvica',
    name: 'Cintura pelvica',
    slots: 1,
    what: 'Fascia di compressione circonferenziale del bacino.',
    when: 'Sospetta frattura di bacino dopo trauma ad alta energia.',
  },
  sedia: {
    id: 'sedia',
    name: 'Sedia portantina',
    slots: 1,
    what: 'Sedia da trasporto per scale e spazi stretti.',
    when: 'Pazienti che non devono camminare (dolore toracico, dispnea) e devono stare seduti.',
  },
  kit_ustioni: {
    id: 'kit_ustioni',
    name: 'Kit ustioni',
    slots: 1,
    what: 'Teli sterili, medicazioni non aderenti, acqua sterile.',
    when: 'Ustioni termiche, chimiche, elettriche.',
  },
  dpi_extra: {
    id: 'dpi_extra',
    name: 'DPI aggiuntivi',
    slots: 1,
    what: 'Facciali filtranti FFP2/FFP3, occhiali, sovracamici.',
    when: 'Rischio di contatto con liquidi biologici o infezioni respiratorie.',
  },
  kit_raffreddamento: {
    id: 'kit_raffreddamento',
    name: 'Kit raffreddamento',
    slots: 1,
    what: 'Ghiaccio istantaneo, teli da bagnare, nebulizzatore e ventilatore a batteria.',
    when: 'Colpo di calore: raffreddamento attivo sul posto.',
  },
  kit_parto: {
    id: 'kit_parto',
    name: 'Kit parto',
    slots: 1,
    what: 'Telini sterili, clamp ombelicali, forbici sterili, sacchetto per la placenta, assorbenti, cuffietta e coperta per il neonato.',
    contains: ['telini sterili', '2 clamp ombelicali', 'forbici sterili', 'sacchetto per la placenta', 'assorbenti', 'cuffietta e coperta'],
    when: 'Parto imminente: assistenza alla nascita e cure al neonato.',
  },
};

export const EQUIPMENT_ORDER: EquipmentId[] = [
  'zaino', 'dae', 'ossigeno', 'pallone', 'aspiratore', 'kit_emorragie', 'dpi_extra',
  'collari', 'cucchiaio', 'materasso', 'tavola', 'ked', 'steccobende', 'cintura_pelvica',
  'sedia', 'kit_ustioni', 'kit_raffreddamento', 'kit_parto',
];
