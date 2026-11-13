/**
 * Codifiche ufficiali degli interventi di emergenza – DM 15 maggio 1992 (Allegato A).
 * Molte Centrali usano estensioni regionali (es. codici patologia a due cifre C01–C20):
 * il simulatore usa la codifica nazionale di base.
 */

export type LuogoCode = 'S' | 'P' | 'Y' | 'K' | 'L' | 'Q' | 'Z';
export const LUOGO: Record<LuogoCode, { label: string; def: string }> = {
  S: { label: 'Strada', def: 'Eventi localizzabili sulla viabilità pubblica o privata o che comunque hanno avuto origine da essa.' },
  P: { label: 'Uffici ed esercizi pubblici', def: 'Edifici adibiti in prevalenza a uffici o attività commerciali (negozi, uffici postali, alberghi, ristoranti).' },
  Y: { label: 'Impianti sportivi', def: 'Strutture prevalentemente adibite ad attività sportive (es. palestre, stadi).' },
  K: { label: 'Casa', def: 'Edifici prevalentemente adibiti ad abitazioni.' },
  L: { label: 'Impianti lavorativi', def: 'Sedi dove si effettuano in modo esclusivo e organizzato lavori e opere (fabbriche, laboratori, cantieri).' },
  Q: { label: 'Scuole', def: 'Sedi di attività prescolastiche o scolastiche (asili, scuole, università).' },
  Z: { label: 'Altri luoghi', def: 'Ambienti diversi da quelli precedenti (parchi, aree concerti, spiagge, laghi…).' },
};

export type PatologiaCode = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8' | 'C9';
export const PATOLOGIA: Record<PatologiaCode, string> = {
  C1: 'Patologia di origine traumatica',
  C2: 'Patologia di origine cardiocircolatoria',
  C3: 'Patologia di origine respiratoria',
  C4: 'Patologia di origine neurologica',
  C5: 'Patologia di origine psichiatrica',
  C6: 'Patologia di origine neoplastica',
  C7: 'Intossicazione',
  C8: 'Altra patologia',
  C9: 'Patologia non identificata',
  C0: 'Etilista',
};

export type CriticitaCode = 'B' | 'V' | 'G' | 'R';
export const CRITICITA: Record<CriticitaCode, { label: string; colore: string; def: string; hex: string }> = {
  B: { label: 'Bianco', colore: 'bianco', def: 'Non critico: servizio che con ragionevole certezza non ha necessità di essere espletato in tempi brevi.', hex: '#EEF2F5' },
  V: { label: 'Verde', colore: 'verde', def: 'Poco critico: intervento differibile.', hex: '#2DB34F' },
  G: { label: 'Giallo', colore: 'giallo', def: 'Mediamente critico: intervento indifferibile.', hex: '#F5C21B' },
  R: { label: 'Rosso', colore: 'rosso', def: 'Molto critico: intervento di emergenza.', hex: '#E5323B' },
};

/** Valutazione sanitaria del paziente effettuata dal personale giunto sul posto (DM 15/05/1992, punto 3.d). */
export type ValutazioneCode = 'I0' | 'I1' | 'I2' | 'I3' | 'I4';
export const VALUTAZIONE: Record<ValutazioneCode, { def: string; colore: string; hex: string }> = {
  I0: { def: 'Soggetto che non necessita di intervento', colore: 'bianco', hex: '#EEF2F5' },
  I1: { def: 'Soggetto affetto da forma morbosa di grado lieve', colore: 'verde', hex: '#2DB34F' },
  I2: { def: 'Soggetto affetto da forma morbosa grave', colore: 'giallo', hex: '#F5C21B' },
  I3: { def: 'Soggetto con compromissione delle funzioni vitali', colore: 'rosso', hex: '#E5323B' },
  I4: { def: 'Deceduto', colore: 'nero', hex: '#2A2F36' },
};

export function giudizioSintesi(l: LuogoCode, p: PatologiaCode, c: CriticitaCode): string {
  return `${l}${p}${c}`;
}
