/**
 * Registro delle fonti. Ogni regola del simulatore rimanda a una di queste voci.
 * Sono incluse solo fonti ufficiali o istituzionali verificate durante lo sviluppo.
 */
export interface Source {
  id: string;
  short: string; // etichetta breve mostrata nei "chip"
  title: string;
  org: string;
  year?: number;
  ref?: string; // rivista, GU, ecc.
  url?: string;
  note?: string;
}

export const SOURCES: Record<string, Source> = {
  DGR_FVG_2039_2015: {
    id: 'DGR_FVG_2039_2015',
    short: 'FVG · Piano emergenza 2015',
    title: 'Piano dell’emergenza urgenza della Regione Friuli Venezia Giulia (Allegato 1 alla DGR n. 2039 del 16/10/2015)',
    org: 'Regione Autonoma Friuli Venezia Giulia',
    year: 2015,
    ref: 'Mezzi BLS-D (senza infermiere), ALS con infermiere, automedica, elisoccorso; il codice colore lo attribuiscono gli infermieri di centrale con il dispatch.',
    url: 'https://mtom.regione.fvg.it/storage/2015_2039/Allegato%201%20alla%20Delibera%202039-2015.pdf',
  },
  DGR_FVG_519_2014: {
    id: 'DGR_FVG_519_2014',
    short: 'FVG · DGR 519/2014',
    title: 'DGR n. 519 del 21 marzo 2014: istituzione della Centrale Operativa 118 regionale (ora SORES)',
    org: 'Regione Autonoma Friuli Venezia Giulia',
    year: 2014,
    note: 'Citata dalla DGR 1653/2025 come atto istitutivo dell’unico riferimento regionale per il coordinamento del soccorso sanitario.',
  },
  SORES_FVG: {
    id: 'SORES_FVG',
    short: 'SORES FVG · prassi operativa',
    title: 'SORES FVG – indicazioni operative per gli equipaggi di soccorso',
    org: 'SORES – Sala Operativa Regionale Emergenza Sanitaria, Friuli Venezia Giulia',
    note: 'Procedure interne non pubblicate, riferite da soccorritori in servizio: il soccorritore non esegue manovre invasive (es. glicemia) né somministrazioni (farmaci, acqua, zucchero); riferisce la saturazione e applica l’ossigeno con il presidio e la concentrazione indicati dalla SORES; il codice di rientro è assegnato dalla SORES. Verifica sempre con il tuo ente e con la formazione regionale.',
  },
  ERC_BLS_2025: {
    id: 'ERC_BLS_2025',
    short: 'ERC 2025 · BLS adulto',
    title: 'European Resuscitation Council Guidelines 2025 – Adult Basic Life Support',
    org: 'European Resuscitation Council (ERC)',
    year: 2025,
    ref: 'Smyth MA et al. Resuscitation 2025;215 (Suppl 1):110771 · doi:10.1016/j.resuscitation.2025.110771',
    url: 'https://www.erc.edu/science-research/guidelines/guidelines-2025/guidelines-2025-english',
  },
  ERC_PLS_2025: {
    id: 'ERC_PLS_2025',
    short: 'ERC 2025 · Pediatria',
    title: 'European Resuscitation Council Guidelines 2025 – Paediatric Life Support',
    org: 'European Resuscitation Council (ERC)',
    year: 2025,
    ref: 'Djakow J et al. Resuscitation 2025;215 (Suppl 1):110767 · doi:10.1016/j.resuscitation.2025.110767',
    url: 'https://www.erc.edu/science-research/guidelines/guidelines-2025/guidelines-2025-english',
  },
  ERC_FA_2025: {
    id: 'ERC_FA_2025',
    short: 'ERC 2025 · Primo soccorso',
    title: 'European Resuscitation Council Guidelines 2025 – First Aid',
    org: 'European Resuscitation Council (ERC)',
    year: 2025,
    ref: 'Djärv T et al. Resuscitation 2025;215 (Suppl 1):110752 · doi:10.1016/j.resuscitation.2025.110752',
    url: 'https://www.erc.edu/science-research/guidelines/guidelines-2025/guidelines-2025-english',
  },
  ERC_LAY_2025: {
    id: 'ERC_LAY_2025',
    short: 'ERC 2025 · Sintesi per tutti',
    title: 'ERC Guidelines 2025 – Resuscitation for Everyone (sintesi ufficiale per il pubblico)',
    org: 'European Resuscitation Council (ERC)',
    year: 2025,
    url: 'https://www.erc.edu/media/p5ymaeej/gl2025_layperson_book_ipdf-v11-e.pdf',
  },
  DM_1992: {
    id: 'DM_1992',
    short: 'DM 15/05/1992',
    title: 'Decreto ministeriale 15 maggio 1992 – Criteri e requisiti per la codificazione degli interventi di emergenza',
    org: 'Ministero della Sanità',
    year: 1992,
    ref: 'Gazzetta Ufficiale n. 121 del 25 maggio 1992',
    url: 'https://www.gazzettaufficiale.it/eli/id/1992/05/25/092A2302/sg',
  },
  DPR_1992: {
    id: 'DPR_1992',
    short: 'DPR 27/03/1992',
    title: 'DPR 27 marzo 1992 – Atto di indirizzo e coordinamento alle Regioni per la determinazione dei livelli di assistenza sanitaria di emergenza',
    org: 'Presidenza della Repubblica',
    year: 1992,
    ref: 'Gazzetta Ufficiale n. 76 del 31 marzo 1992',
  },
  ACCORDO_EVENTI_2014: {
    id: 'ACCORDO_EVENTI_2014',
    short: 'Accordo C.U. 5/8/2014',
    title: 'Linee di indirizzo sull’organizzazione dei soccorsi sanitari negli eventi e nelle manifestazioni programmate (Allegati A1 e A2 – algoritmo di Maurer)',
    org: 'Conferenza Unificata Stato-Regioni-Autonomie locali',
    year: 2014,
    ref: 'Accordo 5 agosto 2014, Rep. Atti n. 91/CU',
    url: 'https://www.statoregioni.it/',
  },
  FVG_EVENTI_2025: {
    id: 'FVG_EVENTI_2025',
    short: 'FVG · Eventi 2025',
    title: 'Organizzazione sanitaria negli eventi e nelle manifestazioni programmate (Allegato alla DGR n. 1653 del 21/11/2025)',
    org: 'Regione Autonoma Friuli Venezia Giulia',
    year: 2025,
    ref: 'Portale G.A.M.E.S., calcolo del livello di rischio, algoritmo di Maurer, validazione e Score SORES; definizioni di MSA, MSB e squadra a piedi (SAP).',
    url: 'https://prolocoregionefvg.it/media/documents/Allegato_1_alla_Delibera_1653-2025.pdf',
  },
  ISS_TRAUMA: {
    id: 'ISS_TRAUMA',
    short: 'ISS · LG Trauma maggiore',
    title: 'Linea guida per la gestione integrata del Trauma Maggiore dalla scena dell’evento alla cura definitiva',
    org: 'Istituto Superiore di Sanità – Sistema Nazionale Linee Guida',
    ref: 'Pubblicata per sezioni sul portale SNLG (consultazioni pubbliche 2023–2024)',
    url: 'https://www.iss.it/snlg-linee-guida-concluse',
    note: 'Raccomandazioni su triage preospedaliero TRENAU, tourniquet nelle emorragie degli arti, cintura pelvica, gestione nei trauma center.',
  },
  L116_2021: {
    id: 'L116_2021',
    short: 'Legge 116/2021',
    title: 'Legge 4 agosto 2021, n. 116 – Disposizioni in materia di utilizzo dei defibrillatori semiautomatici e automatici',
    org: 'Parlamento italiano',
    year: 2021,
    note: 'In assenza di personale formato l’uso del DAE è consentito anche a chi non è formato; si applica l’art. 54 del codice penale (stato di necessità).',
  },
  L120_2001: {
    id: 'L120_2001',
    short: 'Legge 120/2001',
    title: 'Legge 3 aprile 2001, n. 120 – Utilizzo dei defibrillatori semiautomatici in ambiente extraospedaliero',
    org: 'Parlamento italiano',
    year: 2001,
  },
  CP_593: {
    id: 'CP_593',
    short: 'Art. 593 c.p.',
    title: 'Codice penale, art. 593 – Omissione di soccorso',
    org: 'Repubblica italiana',
    year: 1930,
  },
  DPCM_2001_MAXI: {
    id: 'DPCM_2001_MAXI',
    short: 'Protezione Civile 2001',
    title: 'Criteri di massima per l’organizzazione dei soccorsi sanitari nelle catastrofi',
    org: 'Presidenza del Consiglio – Dipartimento della Protezione Civile',
    year: 2001,
    ref: 'DPCM 13 febbraio 2001',
    note: 'Definisce triage, Posto Medico Avanzato (PMA) e catena dei soccorsi nelle maxi-emergenze.',
  },
  START: {
    id: 'START',
    short: 'START / JumpSTART',
    title: 'Simple Triage And Rapid Treatment (START) e JumpSTART pediatrico',
    org: 'Hoag Hospital & Newport Beach Fire Dept.; L. Romig (JumpSTART)',
    year: 1983,
    ref: 'Benson M, Koenig KL, Schultz CH. Prehosp Disaster Med 1996;11(2):117-124',
    note: 'Algoritmo di triage di massa adottato da numerose Centrali 118 italiane.',
  },
  BTS_O2_2017: {
    id: 'BTS_O2_2017',
    short: 'BTS 2017 · Ossigeno',
    title: 'BTS guideline for oxygen use in adults in healthcare and emergency settings',
    org: 'British Thoracic Society',
    year: 2017,
    ref: 'O’Driscoll BR et al. Thorax 2017;72(Suppl 1):i1–i90',
    note: 'Target SpO₂ 94–98% (88–92% nei pazienti a rischio di ipercapnia), coerente con ERC 2025 Primo soccorso.',
  },
  ESC_ACS_2023: {
    id: 'ESC_ACS_2023',
    short: 'ESC 2023 · SCA',
    title: '2023 ESC Guidelines for the management of acute coronary syndromes',
    org: 'European Society of Cardiology',
    year: 2023,
    ref: 'Byrne RA et al. Eur Heart J 2023;44:3720–3826',
    note: 'Ossigeno solo se SpO₂ < 90%; riconoscimento precoce e attivazione della rete per l’infarto.',
  },
  AHA_STROKE_2019: {
    id: 'AHA_STROKE_2019',
    short: 'AHA/ASA 2019 · Ictus',
    title: 'Guidelines for the Early Management of Patients With Acute Ischemic Stroke: 2019 Update',
    org: 'American Heart Association / American Stroke Association',
    year: 2019,
    ref: 'Powers WJ et al. Stroke 2019;50:e344–e418',
    note: 'In fase preospedaliera: scala per l’ictus, ora di esordio, glicemia, ossigeno solo per mantenere SpO₂ > 94%, trasporto rapido al centro ictus.',
  },
  CPSS: {
    id: 'CPSS',
    short: 'Cincinnati (CPSS)',
    title: 'Cincinnati Prehospital Stroke Scale',
    org: 'Kothari RU et al.',
    year: 1999,
    ref: 'Ann Emerg Med 1999;33(4):373-378',
  },
  LICE: {
    id: 'LICE',
    short: 'LICE · Crisi epilettiche',
    title: 'Lega Italiana Contro l’Epilessia – Cosa fare durante una crisi',
    org: 'Lega Italiana Contro l’Epilessia (LICE)',
    url: 'https://www.lice.it/',
    note: 'Proteggere da traumi, non bloccare, nulla in bocca, cronometrare; chiamare il 112 se la crisi supera i 5 minuti.',
  },
  TRIAGE_PS_2019: {
    id: 'TRIAGE_PS_2019',
    short: 'Triage PS 2019',
    title: 'Linee di indirizzo nazionali sul triage intraospedaliero',
    org: 'Ministero della Salute – Conferenza Stato-Regioni',
    year: 2019,
    note: 'Codici numerici 1–5 per il Pronto Soccorso (diversi dai codici del 118).',
  },
};

export type SourceId = keyof typeof SOURCES;

export function src(id: string): Source {
  const s = SOURCES[id];
  if (!s) throw new Error(`Fonte sconosciuta: ${id}`);
  return s;
}
