import type { ProtocolId } from '../engine/types';

export interface ProtocolStep {
  title: string;
  detail?: string;
  /** passo decisionale (domanda) */
  ask?: boolean;
}

export interface Protocol {
  id: ProtocolId;
  name: string;
  family: 'Rianimazione' | 'Vie aeree' | 'Medico' | 'Trauma' | 'Ambientale' | 'Tossicologico';
  summary: string;
  steps: ProtocolStep[];
  numbers?: { label: string; value: string }[];
  pitfalls?: string[];
  sources: string[];
}

export const PROTOCOLS: Record<ProtocolId, Protocol> = {
  bls_adulto: {
    id: 'bls_adulto',
    name: 'BLSD adulto',
    family: 'Rianimazione',
    summary: 'Arresto cardiaco nell’adulto: riconoscimento, chiamata, compressioni di qualità e defibrillazione precoce.',
    steps: [
      { title: 'Sicurezza', detail: 'Scena sicura per te, i colleghi, gli astanti e il paziente; indossa i DPI.' },
      { title: 'Risponde?', detail: 'Chiamalo a voce alta e tocca le spalle.', ask: true },
      { title: 'Chiama subito', detail: 'Per chiunque non risponda: 112/118 in vivavoce senza attendere di valutare il respiro (novità ERC 2025). Fai portare il DAE.' },
      { title: 'Respira normalmente?', detail: 'Apri le vie aeree; guarda, ascolta, senti per non più di 10 s. Il respiro agonico (gasping) non è normale. All’inizio possono esserci brevi movimenti simil-convulsivi; negli sportivi il respiro può sembrare quasi normale o affannoso.', ask: true },
      { title: '30 compressioni', detail: 'Metà inferiore dello sterno, braccia tese, 5–6 cm, 100–120/min, rilascio completo, su piano rigido.' },
      { title: '2 ventilazioni', detail: 'Circa 1 s ciascuna, quanto basta a sollevare il torace (pocket mask o pallone con O₂). Chi non è addestrato fa solo compressioni.' },
      { title: 'DAE appena arriva', detail: 'Accendilo e segui i comandi. Piastre: sotto la clavicola destra accanto allo sterno e sul fianco sinistro sotto l’ascella. Nessuno tocca durante analisi e shock.' },
      { title: 'Riprendi subito', detail: 'Dopo lo shock, o se non è consigliato, riprendi le compressioni senza ricontrollare il polso. Cambia compressore ogni 2 minuti.' },
      { title: 'Fino a quando', detail: 'Fino all’arrivo del mezzo avanzato, a chiari segni di vita o all’esaurimento.' },
    ],
    numbers: [
      { label: 'Profondità', value: '5–6 cm' },
      { label: 'Frequenza', value: '100–120/min' },
      { label: 'Rapporto', value: '30:2' },
      { label: 'Valutazione respiro', value: '≤ 10 s' },
      { label: 'Ritardo defibrillazione', value: '−10% sopravvivenza ogni minuto' },
    ],
    pitfalls: [
      'Scambiare il gasping per respiro normale.',
      'Interrompere le compressioni per cercare il polso dopo lo shock.',
      'Toccare il paziente durante l’analisi del DAE.',
      'Spostare il paziente da un letto morbido a terra perdendo tempo: comprimi più a fondo e prosegui.',
    ],
    sources: ['ERC_BLS_2025', 'ERC_LAY_2025', 'L116_2021', 'L120_2001'],
  },
  pbls: {
    id: 'pbls',
    name: 'PBLSD pediatrico',
    family: 'Rianimazione',
    summary: 'Arresto cardiaco nel lattante (< 1 anno) e nel bambino: 5 ventilazioni iniziali, poi 15:2 se addestrati.',
    steps: [
      { title: 'Sicurezza e coscienza', detail: 'Stimolo verbale e tattile, non doloroso.', ask: true },
      { title: 'Chiama', detail: 'Vivavoce. Se siete in due, uno chiama e porta il DAE mentre l’altro inizia.' },
      { title: 'Vie aeree e respiro', detail: 'Lattante: capo in posizione neutra; bambino: più estensione; adolescente come l’adulto. Respiro e segni di vita per non più di 10 s.', ask: true },
      { title: '5 ventilazioni iniziali', detail: 'Circa 1 s ciascuna. Nel lattante copri bocca e naso.' },
      { title: 'Compressioni', detail: 'Metà inferiore dello sterno, almeno 1/3 del diametro antero-posteriore (mai oltre 6 cm), 100–120/min. Lattante: due pollici avvolgenti. Bambino: una o due mani.' },
      { title: '15:2', detail: 'Se addestrato in PBLS; altrimenti 30:2.' },
      { title: 'DAE', detail: 'Sotto i 25 kg (circa 8 anni): modalità pediatrica se disponibile e piastre antero-posteriori. Sopra: antero-laterali o antero-posteriori.' },
    ],
    numbers: [
      { label: 'Ventilazioni iniziali', value: '5' },
      { label: 'Rapporto (addestrati)', value: '15:2' },
      { label: 'Profondità', value: '≥ 1/3 del torace' },
      { label: 'Soglia piastre pediatriche', value: '< 25 kg' },
    ],
    pitfalls: ['Iperestendere il capo del lattante.', 'Usare il rapporto 30:2 se si è addestrati PBLS.', 'Ritardare la RCP per cercare il DAE se si è da soli.'],
    sources: ['ERC_PLS_2025'],
  },
  fbao_adulto: {
    id: 'fbao_adulto',
    name: 'Disostruzione vie aeree – adulto',
    family: 'Vie aeree',
    summary: 'Soffocamento da corpo estraneo: tosse se efficace, altrimenti colpi dorsali e compressioni addominali.',
    steps: [
      { title: 'Riconosci', detail: 'Esordio improvviso, spesso mangiando; mani alla gola.' },
      { title: 'Tosse efficace?', detail: 'Se tossisce e parla: incoraggia la tosse e sorveglia.', ask: true },
      { title: '5 colpi interscapolari', detail: 'Paziente inclinato in avanti, colpi decisi tra le scapole.' },
      { title: '5 compressioni addominali', detail: 'Da dietro, pugno tra ombelico e sterno, verso l’interno e l’alto. Alterna con i colpi dorsali.' },
      { title: 'Chiama il 112', detail: 'Il prima possibile.' },
      { title: 'Perde coscienza?', detail: 'Accompagnalo a terra e inizia la RCP: le compressioni possono espellere il corpo estraneo.', ask: true },
    ],
    pitfalls: ['Esplorare la bocca alla cieca con le dita.', 'Dimenticare la valutazione medica dopo le compressioni addominali.'],
    sources: ['ERC_FA_2025', 'ERC_BLS_2025', 'ERC_LAY_2025'],
  },
  fbao_pediatrico: {
    id: 'fbao_pediatrico',
    name: 'Disostruzione vie aeree – lattante e bambino',
    family: 'Vie aeree',
    summary: 'Lattante: 5 colpi dorsali e 5 compressioni toraciche. Bambino: 5 colpi dorsali e 5 compressioni addominali.',
    steps: [
      { title: 'Sospetta', detail: 'Non riesce a parlare o a piangere, specie mangiando o giocando.' },
      { title: 'Chiama', detail: 'Fai chiamare l’ambulanza il prima possibile.' },
      { title: 'Fino a 5 colpi dorsali', detail: 'Lattante prono sull’avambraccio, capo più in basso del torace.' },
      { title: 'Fino a 5 compressioni', detail: 'Lattante: toraciche con due pollici, più secche delle compressioni di RCP. Bambino: addominali.' },
      { title: 'Alterna', detail: 'Ripeti finché si risolve o perde coscienza. Fermati ai segni di sollievo (tosse, pianto, respiro rumoroso).' },
      { title: 'Incosciente', detail: 'RCP iniziando con 5 ventilazioni.' },
    ],
    pitfalls: ['Compressioni addominali nel lattante.', 'Dita in bocca alla cieca (si rimuove solo un oggetto chiaramente visibile).'],
    sources: ['ERC_PLS_2025'],
  },
  abcde: {
    id: 'abcde',
    name: 'Valutazione ABCDE',
    family: 'Medico',
    summary: 'Valutazione primaria sistematica: identifica e tratta subito ciò che minaccia la vita.',
    steps: [
      { title: 'A – Vie aeree', detail: 'Pervie? Rumori (russamento, gorgoglio, stridore)? Corpi estranei, vomito.' },
      { title: 'B – Respiro', detail: 'Guarda, ascolta, senti (max 10 s), frequenza, SpO₂, cianosi, lavoro respiratorio.' },
      { title: 'C – Circolo', detail: 'Polso, cute, riempimento capillare, pressione, emorragie, dolore toracico.' },
      { title: 'D – Neurologico', detail: 'AVPU, pupille, glicemia.' },
      { title: 'E – Esposizione', detail: 'Testa-piedi, temperatura, prevenzione dell’ipotermia.' },
      { title: 'Anamnesi', detail: 'SAMPLE: Sintomi, Allergie, Medicine, Patologie, Last meal, Eventi. Dolore: OPQRST.' },
    ],
    sources: ['ERC_FA_2025', 'ERC_LAY_2025'],
  },
  dolore_toracico: {
    id: 'dolore_toracico',
    name: 'Dolore toracico – sospetta sindrome coronarica',
    family: 'Medico',
    summary: 'Riposo assoluto, parametri, ossigeno solo se serve, informazioni precoci alla Centrale e DAE a portata di mano.',
    steps: [
      { title: 'Riposo', detail: 'Posizione comoda (spesso semiseduto). Il paziente non deve camminare: sedia portantina.' },
      { title: 'Parametri', detail: 'SpO₂, FC, PA, FR, cute. Ossigeno solo se SpO₂ < 90%.' },
      { title: 'OPQRST', detail: 'Ora di esordio, caratteristiche, irradiazione, durata, sintomi associati (sudorazione, nausea, dispnea).' },
      { title: 'Farmaci', detail: 'ERC 2025: un soccorritore laico aiuta ad assumere aspirina 300 mg masticabile (se non allergico) e la nitroglicerina prescritta per angina nota. In servizio segui il protocollo regionale e le indicazioni della Centrale.' },
      { title: 'ECG e Centrale', detail: 'ECG a 12 derivazioni se previsto dal protocollo regionale; comunica presto per attivare la rete dell’infarto.' },
      { title: 'DAE pronto', detail: 'Rischio di aritmie maligne: tieni il DAE vicino e rivaluta spesso.' },
    ],
    pitfalls: ['Far camminare il paziente fino all’ambulanza.', 'Ossigeno ad alti flussi a chi satura bene.'],
    sources: ['ERC_FA_2025', 'ESC_ACS_2023'],
  },
  ictus: {
    id: 'ictus',
    name: 'Sospetto ictus',
    family: 'Medico',
    summary: 'Riconosci con una scala validata, stabilisci l’ora di esordio, escludi l’ipoglicemia, centralizza.',
    steps: [
      { title: 'Scala per l’ictus', detail: 'Cincinnati: mimica facciale, slivellamento delle braccia, linguaggio. Un solo elemento anomalo è già sospetto.' },
      { title: 'Ora di esordio', detail: 'Quando è stato visto in benessere l’ultima volta: decide l’accesso a trombolisi e trombectomia.' },
      { title: 'Glicemia', detail: 'L’ipoglicemia può simulare un ictus.' },
      { title: 'Ossigeno solo se serve', detail: 'Solo per mantenere SpO₂ > 94% / se ci sono segni di ipossia.' },
      { title: 'Nulla per bocca', detail: 'Rischio di disfagia e inalazione.' },
      { title: 'Comunica subito', detail: 'Codice ictus alla Centrale; farmaci (anticoagulanti!); porta con te un familiare o il suo numero.' },
    ],
    pitfalls: ['Non chiedere l’ora di esordio.', 'Far bere il paziente.', 'Dimenticare la glicemia.'],
    sources: ['ERC_FA_2025', 'CPSS', 'AHA_STROKE_2019'],
  },
  ipoglicemia: {
    id: 'ipoglicemia',
    name: 'Ipoglicemia',
    family: 'Medico',
    summary: 'Glicemia < 70 mg/dL con sintomi: zuccheri per bocca solo se sveglio e capace di deglutire.',
    steps: [
      { title: 'Sospetta', detail: 'Diabetico o malnutrito con improvvisa alterazione della coscienza o del comportamento, sudorazione, tremori.' },
      { title: 'Misura', detail: 'Glicemia capillare: sotto 70 mg/dL (4 mmol/L).' },
      { title: 'Sveglio e deglutisce?', detail: '15–20 g di glucosio per bocca (bustine, 50–100 mL di succo o bibita zuccherata).', ask: true },
      { title: 'Ricontrolla dopo 15 min', detail: 'Se i sintomi persistono ripeti; dopo il recupero uno spuntino.' },
      { title: 'Non sveglio', detail: 'Nulla per bocca, posizione laterale se respira, mezzo avanzato.' },
    ],
    numbers: [
      { label: 'Soglia', value: '< 70 mg/dL' },
      { label: 'Dose orale', value: '15–20 g' },
      { label: 'Ricontrollo', value: '15 min' },
    ],
    sources: ['ERC_FA_2025'],
  },
  dispnea: {
    id: 'dispnea',
    name: 'Dispnea e ossigenoterapia',
    family: 'Medico',
    summary: 'Posizione seduta, ossigeno titolato sul target di SpO₂ corretto per il paziente.',
    steps: [
      { title: 'Posizione', detail: 'Seduto o semiseduto, indumenti allentati.' },
      { title: 'Target SpO₂', detail: '94–98% nella maggior parte dei pazienti; 88–92% nei pazienti a rischio di ipercapnia (BPCO).' },
      { title: 'Ipossiemia grave', detail: 'Se SpO₂ < 88% fuori dall’ospedale: flussi alti per tutti, BPCO compresi, poi titola.' },
      { title: 'Presidio', detail: 'Occhialini 1–4 L/min; maschera semplice 5–10 L/min; maschera con reservoir 10–15 L/min.' },
      { title: 'Asma', detail: 'Aiuta a usare il proprio broncodilatatore con distanziatore.' },
    ],
    numbers: [
      { label: 'Target standard', value: '94–98%' },
      { label: 'Target BPCO', value: '88–92%' },
      { label: 'Reservoir', value: '10–15 L/min' },
    ],
    sources: ['ERC_FA_2025', 'BTS_O2_2017'],
  },
  anafilassi: {
    id: 'anafilassi',
    name: 'Anafilassi',
    family: 'Medico',
    summary: 'Reazione allergica grave: adrenalina intramuscolo nella coscia il prima possibile.',
    steps: [
      { title: 'Riconosci', detail: 'Esordio rapido dopo l’esposizione: gonfiore di labbra e lingua, stridore, sibili, dispnea, pallore, ipotensione; spesso orticaria.' },
      { title: '112 e allergene', detail: 'Chiama subito e allontana la causa se nota.' },
      { title: 'Adrenalina IM', detail: 'Autoiniettore nella parte esterna della coscia, anche attraverso i vestiti, il prima possibile.' },
      { title: 'Seconda dose', detail: 'Se i sintomi persistono dopo 5 minuti, nella coscia opposta.' },
      { title: 'Posizione', detail: 'Sdraiato; seduto con le gambe distese se respira male. Non farlo alzare.' },
    ],
    numbers: [{ label: 'Seconda dose dopo', value: '5 min' }],
    sources: ['ERC_FA_2025'],
  },
  convulsioni: {
    id: 'convulsioni',
    name: 'Crisi convulsiva',
    family: 'Medico',
    summary: 'Proteggi, non bloccare, nulla in bocca, cronometra. Dopo la crisi: respiro, posizione laterale, glicemia.',
    steps: [
      { title: 'Proteggi', detail: 'Qualcosa di morbido sotto la testa, allontana oggetti e persone.' },
      { title: 'Non fare', detail: 'Non bloccare le scosse, non mettere nulla in bocca.' },
      { title: 'Cronometra', detail: 'Oltre 5 minuti o crisi ripetute senza ripresa della coscienza: stato di male, serve il mezzo avanzato.' },
      { title: 'Respira normalmente?', detail: 'Brevi movimenti simil-convulsivi possono essere l’esordio di un arresto cardiaco: se non respira normalmente inizia la RCP.', ask: true },
      { title: 'Fase post-critica', detail: 'Posizione laterale se respira e non c’è trauma, glicemia, ricerca di traumi (morso della lingua).' },
    ],
    sources: ['LICE', 'ERC_BLS_2025', 'ERC_FA_2025'],
  },
  trauma: {
    id: 'trauma',
    name: 'Trauma maggiore',
    family: 'Trauma',
    summary: 'Sicurezza, emorragie massive per prime, vie aeree con protezione del rachide, centralizzazione.',
    steps: [
      { title: 'Scena', detail: 'Mezzo a protezione, alta visibilità, Forze dell’ordine/VVF se servono; dinamica (alta energia?).' },
      { title: 'X – Emorragie massive', detail: 'Compressione diretta, tourniquet sugli arti se non basta.' },
      { title: 'A – Vie aeree + rachide', detail: 'Stabilizzazione manuale del capo; sublussazione della mandibola; casco rimosso in due.' },
      { title: 'B – Respiro', detail: 'FR, SpO₂, simmetria; ossigeno per target 94–98%.' },
      { title: 'C – Circolo', detail: 'Polso, cute, riempimento capillare, PA; cintura pelvica se sospetta frattura di bacino da alta energia.' },
      { title: 'D – Neurologico', detail: 'AVPU/GCS, pupille, motilità e sensibilità.' },
      { title: 'E – Esposizione', detail: 'Testa-piedi, poi copri: l’ipotermia peggiora l’emorragia.' },
      { title: 'Restrizione del movimento spinale', detail: 'Stabilizzazione manuale, collare secondo protocollo, barella a cucchiaio e materassino a depressione. Tavola spinale per l’estricazione.' },
      { title: 'Centralizza', detail: 'Triage preospedaliero (TRENAU) verso il Trauma Center; MSA o elisoccorso.' },
    ],
    pitfalls: ['Iperestendere il capo.', 'Posizione laterale di sicurezza nel trauma.', 'Trasporto sulla tavola spinale invece che nel materassino.'],
    sources: ['ISS_TRAUMA', 'ERC_FA_2025'],
  },
  emorragia: {
    id: 'emorragia',
    name: 'Emorragia massiva',
    family: 'Trauma',
    summary: 'Compressione diretta subito; tourniquet sull’arto se la compressione non basta.',
    steps: [
      { title: 'Compressione diretta', detail: 'Ferma e decisa sulla ferita.' },
      { title: 'Medicazione', detail: 'Garza emostatica zaffata nella ferita e bendaggio compressivo.' },
      { title: 'Tourniquet', detail: 'Il prima possibile se la compressione non basta: 5–7 cm a monte della ferita, mai su un’articolazione; stringi finché il sangue si ferma; annota l’ora; non allentarlo.' },
      { title: 'Secondo tourniquet', detail: 'Se il primo non basta, un secondo sopra il primo.' },
      { title: 'Shock', detail: 'Supino, telo isotermico, ossigeno se SpO₂ bassa, mezzo avanzato.' },
    ],
    numbers: [{ label: 'Tourniquet', value: '5–7 cm a monte' }],
    sources: ['ERC_FA_2025', 'ISS_TRAUMA'],
  },
  colpo_calore: {
    id: 'colpo_calore',
    name: 'Colpo di calore',
    family: 'Ambientale',
    summary: 'Alterazione neurologica e ipertermia: raffredda subito, trasporta dopo.',
    steps: [
      { title: 'Sospetta', detail: 'Confusione, agitazione, disorientamento, convulsioni o incoscienza durante sforzo o caldo, anche con temperature moderate.' },
      { title: 'Raffreddamento passivo', detail: 'All’ombra, via gli indumenti in eccesso.' },
      { title: 'Raffreddamento attivo', detail: 'Gold standard: immersione in acqua a 1–26 °C dal collo in giù fino a temperatura centrale < 39 °C. Alternative: telo con acqua e ghiaccio (TACO), ghiaccio, teli bagnati, nebulizzazione e ventilazione.' },
      { title: 'Senza temperatura centrale', detail: 'Raffredda per 15 minuti o fino alla risoluzione dei sintomi neurologici.' },
      { title: 'Prima raffreddare, poi trasportare', detail: 'Continua a raffreddare anche durante il trasporto.' },
    ],
    numbers: [
      { label: 'Acqua', value: '1–26 °C' },
      { label: 'Stop a', value: '< 39 °C' },
    ],
    sources: ['ERC_FA_2025'],
  },
  intossicazione: {
    id: 'intossicazione',
    name: 'Intossicazione acuta (alcol e sostanze)',
    family: 'Tossicologico',
    summary: 'Proteggi le vie aeree, cerca ipoglicemia e traumi, previeni l’ipotermia, non lasciarlo mai solo.',
    steps: [
      { title: 'ABCDE', detail: 'La coscienza ridotta mette a rischio le vie aeree: vomito e inalazione.' },
      { title: 'Posizione laterale', detail: 'Se respira normalmente e non c’è trauma.' },
      { title: 'Aspirazione', detail: 'Se vomito o secrezioni in bocca.' },
      { title: 'Glicemia', detail: 'L’alcol può causare ipoglicemia, soprattutto nei giovani.' },
      { title: 'Traumi ed ipotermia', detail: 'Cerca ferite al capo dopo cadute; copri con il telo.' },
      { title: 'Sorveglianza', detail: 'Rivaluta spesso: non affidarlo agli amici.' },
    ],
    sources: ['ERC_FA_2025'],
  },
  annegamento: {
    id: 'annegamento',
    name: 'Annegamento',
    family: 'Ambientale',
    summary: 'Recupero sicuro, 5 ventilazioni iniziali, poi RCP standard; DAE dopo aver asciugato il torace.',
    steps: [
      { title: 'Recupero sicuro', detail: 'Chi non è formato non entra in acqua: lancia un galleggiante o allunga un oggetto.' },
      { title: 'Respira?', detail: 'Se non risponde e non respira normalmente…', ask: true },
      { title: '5 ventilazioni', detail: 'Prima delle compressioni: la causa è l’ipossia.' },
      { title: 'RCP 30:2', detail: 'Compressioni e ventilazioni standard.' },
      { title: 'DAE', detail: 'Asciuga il torace prima di applicare le piastre.' },
      { title: 'Ipotermia', detail: 'Togli gli indumenti bagnati e copri.' },
    ],
    sources: ['ERC_FA_2025', 'ERC_LAY_2025'],
  },
  oppioidi: {
    id: 'oppioidi',
    name: 'Sospetto sovradosaggio da oppioidi',
    family: 'Tossicologico',
    summary: 'Respiro lento o assente, sopore, pupille a punta di spillo: ventila e chiama il mezzo avanzato.',
    steps: [
      { title: 'Sospetta', detail: 'Respiro lento, irregolare o assente; sopore estremo o incoscienza; pupille miotiche.' },
      { title: 'Respira normalmente?', detail: 'Se no: RCP. Se il respiro è insufficiente: ventila con pallone e ossigeno.', ask: true },
      { title: 'Naloxone', detail: 'Se disponibile e se sei formato a usarlo (ERC 2025); altrimenti lo somministra l’équipe sanitaria.' },
      { title: 'Rivaluta', detail: 'L’effetto del naloxone può finire prima di quello dell’oppioide.' },
    ],
    sources: ['ERC_FA_2025', 'ERC_LAY_2025'],
  },
  ustioni: {
    id: 'ustioni',
    name: 'Ustioni termiche',
    family: 'Ambientale',
    summary: 'Ferma il processo, raffredda con acqua corrente fresca, copri, previeni l’ipotermia.',
    steps: [
      { title: 'Sicurezza', detail: 'Allontana dalla fonte di calore.' },
      { title: 'Raffredda', detail: 'Acqua corrente fresca, non ghiacciata, per almeno 20 minuti.' },
      { title: 'Rimuovi', detail: 'Anelli, orologi e indumenti non adesi.' },
      { title: 'Copri', detail: 'Medicazione pulita non aderente o pellicola appoggiata senza avvolgere.' },
      { title: 'Ipotermia', detail: 'Copri il resto del corpo, soprattutto nei bambini e nelle ustioni estese.' },
    ],
    sources: ['ERC_FA_2025'],
  },
};

export const PROTOCOL_ORDER: ProtocolId[] = [
  'bls_adulto', 'pbls', 'fbao_adulto', 'fbao_pediatrico', 'abcde', 'dolore_toracico', 'ictus', 'ipoglicemia',
  'dispnea', 'anafilassi', 'convulsioni', 'trauma', 'emorragia', 'colpo_calore', 'intossicazione', 'annegamento',
  'oppioidi', 'ustioni',
];
