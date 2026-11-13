import type { ProtocolId } from '../engine/types';

/** Chi esegue il passo: il soccorritore, la SORES (via radio) o l'équipe sanitaria (ALS, automedica). */
export type Who = 'tu' | 'sores' | 'equipe';

/** Passo d'azione. */
export interface AlgoStep {
  t: string;
  d?: string;
  who?: Who;
}
/** Domanda con due rami; dopo i rami l'algoritmo prosegue. */
export interface AlgoAsk {
  ask: string;
  d?: string;
  si: AlgoNode[];
  no: AlgoNode[];
  /** il ramo termina qui (non prosegue con i passi successivi) */
  fine?: 'si' | 'no';
}
export type AlgoNode = AlgoStep | AlgoAsk;

export interface Algoritmo {
  nodes: AlgoNode[];
  /** cosa fa il soccorritore e cosa resta all'équipe sanitaria, secondo il modello FVG */
  tu: string[];
  equipe: string[];
}

export const isAsk = (n: AlgoNode): n is AlgoAsk => 'ask' in n;

const sores = (t: string, d?: string): AlgoStep => ({ t, d, who: 'sores' });
const equipe = (t: string, d?: string): AlgoStep => ({ t, d, who: 'equipe' });

export const ALGORITMI: Record<ProtocolId, Algoritmo> = {
  bls_adulto: {
    nodes: [
      { t: 'Sicurezza e DPI', d: 'Scena sicura per te, i colleghi, gli astanti e il paziente.' },
      {
        ask: 'Risponde?',
        d: 'Chiamalo a voce alta e scuotilo per le spalle.',
        si: [{ t: 'Valutazione ABCDE', d: 'Lascialo nella posizione in cui si trova se è sicura e rivaluta.' }, sores('Riferisci alla SORES')],
        no: [{ t: 'Chiedi aiuto', d: 'Fuori servizio: 112 in vivavoce subito e fai portare il DAE.' }],
        fine: 'si',
      },
      {
        ask: 'Respira normalmente?',
        d: 'Apri le vie aeree; guarda, ascolta e senti per non più di 10 secondi. Il gasping non è respiro normale.',
        si: [{ t: 'Posizione laterale di sicurezza', d: 'Rivaluta il respiro di continuo.' }, sores('Riferisci alla SORES')],
        no: [sores('Arresto cardiaco: riferiscilo alla SORES', 'Sui codici rossi parte anche l’automedica.')],
        fine: 'si',
      },
      { t: 'RCP 30:2', d: 'Centro del torace, 5–6 cm, 100–120/min, rilascio completo. 2 ventilazioni con pallone collegato all’ossigeno ad alti flussi.' },
      { t: 'DAE appena disponibile', d: 'Accendilo, piastre sul torace nudo, nessuno tocca il paziente durante l’analisi.' },
      {
        ask: 'Shock consigliato?',
        si: [{ t: '«Via tutti!» e shock', d: 'Poi riprendi subito le compressioni per 2 minuti.' }],
        no: [{ t: 'Riprendi subito le compressioni', d: 'Per 2 minuti, fino alla nuova analisi.' }],
      },
      { t: 'Cambio compressore ogni 2 minuti', d: 'Durante l’analisi del DAE, in meno di 5 secondi.' },
      equipe('Farmaci e gestione avanzata', 'All’arrivo dell’automedica passa le consegne continuando la RCP.'),
    ],
    tu: ['Riconoscere l’arresto e iniziare la RCP', 'Usare il DAE', 'Ventilare con pallone e ossigeno ad alti flussi', 'Cannula di Guedel e aspiratore'],
    equipe: ['Adrenalina e antiaritmici', 'Vie aeree avanzate', 'Decidere quando sospendere la rianimazione'],
  },

  pbls: {
    nodes: [
      { t: 'Sicurezza e DPI' },
      {
        ask: 'Risponde?',
        d: 'Chiamalo e stimolalo; nel lattante non scuoterlo.',
        si: [{ t: 'Valutazione ABCDE' }, sores('Riferisci alla SORES')],
        no: [{ t: 'Chiedi aiuto' }],
        fine: 'si',
      },
      {
        ask: 'Respira normalmente?',
        d: 'Vie aeree aperte (nel lattante capo in posizione neutra); guarda, ascolta e senti per non più di 10 secondi.',
        si: [{ t: 'Posizione laterale di sicurezza' }, sores('Riferisci alla SORES')],
        no: [{ t: 'Aspira le secrezioni se ostruiscono' }, { t: '5 ventilazioni iniziali', d: 'Con pallone e maschera pediatrici e ossigeno ad alti flussi.' }],
        fine: 'si',
      },
      {
        ask: 'Segni di vita?',
        d: 'Movimenti, tosse, respiro normale.',
        si: [{ t: 'Continua a ventilare', d: 'Rivaluta ogni minuto.' }],
        no: [{ t: 'RCP 15:2', d: 'Lattante: due pollici avvolgenti, un terzo del torace. 100–120/min.' }],
        fine: 'si',
      },
      { t: 'DAE appena disponibile', d: 'Sotto i 25 kg piastre antero-posteriori e modalità pediatrica se disponibile.' },
      sores('Aggiorna la SORES', 'Arresto pediatrico: parte anche l’automedica.'),
      equipe('Farmaci e gestione avanzata'),
    ],
    tu: ['5 ventilazioni iniziali e RCP 15:2', 'Aspirare le secrezioni', 'Pallone pediatrico con ossigeno', 'DAE con piastre pediatriche'],
    equipe: ['Accessi vascolari e intraossei', 'Farmaci', 'Vie aeree avanzate'],
  },

  fbao_adulto: {
    nodes: [
      { t: '«Ti stai soffocando?»', d: 'Sospetto quando qualcuno, spesso mangiando, si porta le mani alla gola.' },
      {
        ask: 'Tosse efficace?',
        si: [{ t: 'Incoraggia a tossire', d: 'Non dare colpi; sorveglia che la tosse resti efficace.' }],
        no: [],
      },
      {
        ask: 'È cosciente?',
        si: [{ t: '5 colpi interscapolari', d: 'Paziente piegato in avanti, sostieni il torace.' }, { t: '5 compressioni addominali', d: 'Pugno tra ombelico e sterno, verso l’interno e verso l’alto.' }, { t: 'Alterna 5 e 5', d: 'Fino alla risoluzione o alla perdita di coscienza.' }],
        no: [{ t: 'A terra e RCP 30:2', d: 'Le compressioni possono smuovere il corpo estraneo.' }, { t: 'Guarda in bocca prima di ventilare', d: 'Rimuovi solo ciò che vedi, un solo tentativo, niente dita alla cieca.' }],
      },
      { t: 'Dopo la disostruzione', d: 'Valutazione ABCDE e saturimetro.' },
      sores('Riferisci alla SORES', 'Dopo le compressioni addominali serve sempre una valutazione medica.'),
    ],
    tu: ['Colpi interscapolari e compressioni addominali', 'RCP se perde coscienza', 'Rimuovere un corpo estraneo visibile'],
    equipe: ['Laringoscopia e pinza di Magill', 'Valutazione delle lesioni da compressioni addominali'],
  },

  fbao_pediatrico: {
    nodes: [
      { t: 'Riconosci il soffocamento', d: 'Esordio improvviso mentre mangia o gioca: niente voce, pianto o tosse.' },
      {
        ask: 'Tosse efficace?',
        si: [{ t: 'Incoraggia a tossire e sorveglia' }],
        no: [],
      },
      {
        ask: 'È cosciente?',
        si: [
          {
            ask: 'Lattante (sotto 1 anno)?',
            si: [{ t: '5 colpi dorsali', d: 'A pancia in giù sull’avambraccio, testa più in basso del torace.' }, { t: '5 compressioni toraciche', d: 'Supino, due dita o pollici sulla metà inferiore dello sterno.' }],
            no: [{ t: '5 colpi interscapolari' }, { t: '5 compressioni addominali' }],
          },
        ],
        no: [{ t: '5 ventilazioni iniziali' }, { t: 'RCP 15:2', d: 'Guarda in bocca prima di ventilare.' }],
      },
      sores('Riferisci alla SORES', 'Valutazione medica sempre, anche se la disostruzione riesce.'),
    ],
    tu: ['Colpi dorsali e compressioni toraciche nel lattante', 'Compressioni addominali sopra l’anno di età', 'PBLS se perde coscienza'],
    equipe: ['Rimozione strumentale del corpo estraneo', 'Valutazione ospedaliera'],
  },

  abcde: {
    nodes: [
      { t: 'Sicurezza e impressione generale', d: 'Coscienza, respiro, colorito a colpo d’occhio.' },
      {
        ask: 'A – Vie aeree pervie?',
        si: [],
        no: [{ t: 'Apri le vie aeree e aspira', d: 'Guedel se incosciente senza riflessi; posizione laterale se respira e non c’è trauma.' }],
      },
      {
        ask: 'B – Respiro adeguato?',
        d: 'Frequenza, espansione, lavoro respiratorio, SpO₂.',
        si: [],
        no: [
          { t: 'In emergenza: ossigeno al 100%', d: 'Reservoir a 15 L/min o pallone, senza attendere la SORES; poi lo riferisci.' },
          sores('Altrimenti riferisci la SpO₂', 'Presidio e concentrazione li indica la SORES.'),
          { t: 'Pallone se il respiro è assente o inefficace' },
        ],
      },
      {
        ask: 'C – Emorragie o shock?',
        d: 'Polso, cute, riempimento capillare, pressione.',
        si: [{ t: 'Ferma le emorragie, supino, telo isotermico' }],
        no: [],
      },
      { t: 'D – Neurologico', d: 'AVPU, pupille, Cincinnati se sospetti un ictus. Se è diabetico riferiscilo.' },
      { t: 'E – Esposizione', d: 'Testa-piedi, temperatura, prevenzione dell’ipotermia.' },
      sores('Riferisci alla SORES', 'Valutazione ABCDE e parametri: la SORES assegna codice e destinazione.'),
      { t: 'Rivaluta', d: 'Dopo ogni intervento e a ogni cambiamento.' },
    ],
    tu: ['Valutazione ABCDE con parametri non invasivi', 'Interventi sui problemi che trovi, in ordine', 'Riferire alla SORES'],
    equipe: ['Glicemia capillare', 'Accessi venosi e farmaci', 'ECG a 12 derivazioni'],
  },

  dolore_toracico: {
    nodes: [
      { t: 'Riposo assoluto', d: 'Semiseduto; non deve camminare: sedia portantina anche per poche rampe.' },
      { t: 'Parametri', d: 'SpO₂, FC, PA, FR, cute.' },
      sores('Riferisci la SpO₂', 'Ossigeno solo se la SORES lo indica (di norma sotto il 90%).'),
      { t: 'Ora di esordio e caratteristiche del dolore', d: 'OPQRST, sintomi associati, terapie in corso.' },
      sores('Riferisci alla SORES', 'Parte l’ALS: l’infermiere esegue e trasmette l’ECG.'),
      {
        ask: 'Perde coscienza e non respira normalmente?',
        si: [{ t: 'BLSD subito', d: 'Il DAE deve essere già accanto al paziente.' }],
        no: [{ t: 'Rivaluta e tieni il DAE pronto' }],
      },
      equipe('ECG, aspirina, nitrati, attivazione dell’emodinamica'),
    ],
    tu: ['Riposo e posizione', 'Parametri non invasivi', 'DAE pronto e BLSD'],
    equipe: ['ECG a 12 derivazioni e teletrasmissione', 'Aspirina, nitrati e altri farmaci, anche quelli del paziente'],
  },

  ictus: {
    nodes: [
      { t: 'Scala di Cincinnati', d: 'Mimica facciale, slivellamento delle braccia, linguaggio.' },
      {
        ask: 'Almeno un segno anomalo?',
        si: [{ t: 'Ora di esordio', d: 'L’ultima volta in cui è stato visto bene, non l’ora del ritrovamento.' }, { t: 'Terapie e patologie', d: 'Anticoagulanti, diabete, aritmie.' }],
        no: [{ t: 'Continua la valutazione ABCDE' }],
      },
      { t: 'Nulla per bocca', d: 'La deglutizione può essere compromessa.' },
      sores('Riferisci subito alla SORES', 'Cincinnati, ora di esordio, anticoagulanti: si attiva il percorso ictus.'),
      { t: 'Tempo sulla scena minimo', d: 'Porta con te un familiare o il suo numero.' },
      equipe('Glicemia, valutazione neurologica, trombolisi o trombectomia in ospedale'),
    ],
    tu: ['Riconoscere con la scala di Cincinnati', 'Raccogliere l’ora di esordio', 'Riferire presto e partire in fretta'],
    equipe: ['Glicemia capillare', 'Decisione sulla riperfusione'],
  },

  ipoglicemia: {
    nodes: [
      { t: 'Sospetta', d: 'Diabetico (soprattutto con insulina) confuso, sudato, pallido, con tremori o comportamento strano.' },
      { t: 'Anamnesi', d: 'Farmaci, insulina, ultimo pasto, da quanto è così.' },
      { t: 'Parametri', d: 'AVPU, SpO₂, FC, PA.' },
      sores('Riferisci alla SORES', 'Sospetta ipoglicemia: la SORES invia l’ALS.'),
      { t: 'Nulla per bocca', d: 'Il soccorritore non somministra nulla, nemmeno acqua e zucchero.' },
      {
        ask: 'La coscienza peggiora?',
        si: [{ t: 'Vie aeree e posizione laterale', d: 'Aspiratore pronto, aggiorna la SORES.' }],
        no: [{ t: 'Rivaluta ogni pochi minuti' }],
      },
      equipe('Glicemia capillare e glucosio', 'Per bocca o in vena, deciso dall’infermiere.'),
    ],
    tu: ['Riconoscere i segni e l’anamnesi', 'Parametri non invasivi', 'Proteggere le vie aeree se peggiora'],
    equipe: ['Glicemia capillare (manovra invasiva)', 'Somministrazione di glucosio o zucchero'],
  },

  dispnea: {
    nodes: [
      { t: 'Posizione seduta', d: 'Indumenti allentati, nessuno sforzo.' },
      { t: 'SpO₂ e frequenza respiratoria' },
      {
        ask: 'BPCO o rischio di ipercapnia?',
        si: [sores('Riferisci SpO₂ e BPCO', 'Di norma maschera Venturi al 24–28%, obiettivo 88–92%.')],
        no: [sores('Riferisci la SpO₂', 'Obiettivo 94–98%; sotto l’85% di norma reservoir.')],
      },
      { t: 'Applica esattamente il presidio indicato', d: 'Presidio e concentrazione li decide la SORES.' },
      { t: 'Ricontrolla e riferisci di nuovo', d: 'Nel BPCO, sopra il 92% la SORES riduce la concentrazione.' },
      { t: 'Niente scale a piedi', d: 'Sedia portantina.' },
      equipe('Aerosol e farmaci', 'Anche lo spray del paziente.'),
    ],
    tu: ['Posizione e parametri', 'Ossigeno come indicato dalla SORES', 'Trasporto seduto'],
    equipe: ['Broncodilatatori e altri farmaci', 'Ventilazione non invasiva'],
  },

  anafilassi: {
    nodes: [
      { t: 'Riconosci', d: 'Esordio rapido dopo un allergene: gonfiore di labbra e lingua, stridore, sibili, ipotensione; spesso orticaria.' },
      sores('Chiedi subito il mezzo avanzato', 'L’adrenalina è il farmaco salvavita: se il paziente ha l’autoiniettore, riferiscilo.'),
      {
        ask: 'Respira male?',
        si: [{ t: 'Seduto con le gambe distese' }],
        no: [{ t: 'Sdraiato', d: 'Gambe sollevate se è pallido o ipoteso.' }],
      },
      { t: 'Mai in piedi né a camminare' },
      { t: 'Ossigeno al 100%', d: 'Reservoir a 15 L/min subito, in autonomia: è un’emergenza.' },
      sores('Riferisci la SpO₂ e l’ossigeno avviato'),
      { t: 'DAE vicino', d: 'Può evolvere in arresto: BLSD.' },
      equipe('Adrenalina intramuscolo', 'Seconda dose dopo 5 minuti se i sintomi persistono.'),
    ],
    tu: ['Riconoscere e chiamare subito', 'Posizione corretta', 'Ossigeno al 100% e DAE pronto'],
    equipe: ['Adrenalina, anche con l’autoiniettore del paziente', 'Altri farmaci e gestione delle vie aeree'],
  },

  convulsioni: {
    nodes: [
      {
        ask: 'Crisi in corso?',
        si: [{ t: 'Proteggi senza trattenere', d: 'Qualcosa di morbido sotto la testa, allontana gli oggetti, niente in bocca.' }, { t: 'Cronometra' }],
        no: [],
      },
      {
        ask: 'Dura più di 5 minuti o si ripete?',
        si: [sores('Stato di male: riferiscilo subito', 'Serve il mezzo avanzato.')],
        no: [],
      },
      {
        ask: 'A crisi finita respira normalmente?',
        d: 'Brevi movimenti simil-convulsivi possono essere l’esordio di un arresto.',
        si: [{ t: 'Posizione laterale di sicurezza', d: 'Aspira se serve, cerca traumi e morso della lingua.' }],
        no: [{ t: 'BLSD' }],
      },
      { t: 'Anamnesi dai presenti', d: 'Epilessia, farmaci saltati, sonno, alcol o sostanze, diabete.' },
      sores('Riferisci la SpO₂ e la valutazione'),
      equipe('Farmaci antiepilettici e glicemia'),
    ],
    tu: ['Proteggere e cronometrare', 'Valutare il respiro a crisi finita', 'Posizione laterale'],
    equipe: ['Benzodiazepine e altri farmaci', 'Glicemia'],
  },

  trauma: {
    nodes: [
      { t: 'Sicurezza', d: 'Mezzo a protezione con i lampeggianti, alta visibilità, Forze dell’ordine e VVF se servono.' },
      { t: 'Dinamica', d: 'Alta energia: sospetta lesioni gravi anche se il paziente sta bene.' },
      {
        ask: 'Emorragia massiva?',
        si: [{ t: 'Compressione e tourniquet', d: 'Prima di tutto il resto.' }],
        no: [],
      },
      { t: 'A – Vie aeree e rachide', d: 'Stabilizzazione manuale del capo, sublussazione, casco rimosso in due.' },
      { t: 'B – Respiro', d: 'FR, simmetria, SpO₂.' },
      { t: 'Ossigeno al 100%', d: 'Reservoir a 15 L/min in autonomia, poi riferisci la SpO₂ alla SORES.' },
      { t: 'C – Circolo', d: 'Polso, cute, PA; cintura pelvica se dolore al bacino dopo alta energia.' },
      { t: 'D ed E', d: 'AVPU, pupille, motilità; testa-piedi e telo isotermico.' },
      sores('Riferisci dinamica e parametri', 'Elisoccorso e Trauma Center li decide la SORES.'),
      { t: 'Immobilizzazione', d: 'Collare, barella a cucchiaio, materassino a depressione; tavola spinale solo per l’estricazione.' },
      equipe('Analgesia, accessi venosi, gestione avanzata'),
    ],
    tu: ['Sicurezza della scena', 'Emorragie, rachide, vie aeree', 'Immobilizzazione e telo isotermico'],
    equipe: ['Analgesia e farmaci', 'Accessi venosi e intraossei', 'Decompressione e vie aeree avanzate'],
  },

  emorragia: {
    nodes: [
      { t: 'Guanti e compressione diretta subito', d: 'Ferma e decisa sulla ferita.' },
      {
        ask: 'La compressione basta?',
        si: [{ t: 'Medicazione compressiva', d: 'Garza emostatica nella ferita e bendaggio.' }],
        no: [
          {
            ask: 'Ferita su un arto?',
            si: [{ t: 'Tourniquet', d: '5–7 cm a monte, mai su un’articolazione; stringi finché il sangue si ferma; annota l’ora; non allentarlo.' }, { t: 'Se non basta: secondo tourniquet sopra il primo' }],
            no: [{ t: 'Garza emostatica zaffata e compressione mantenuta' }],
          },
        ],
      },
      { t: 'Supino e telo isotermico' },
      sores('Riferisci alla SORES', 'Ora del tourniquet e parametri.'),
      equipe('Gestione dello shock emorragico'),
    ],
    tu: ['Compressione, medicazione, tourniquet', 'Prevenire l’ipotermia'],
    equipe: ['Liquidi, sangue e farmaci', 'Acido tranexamico'],
  },

  colpo_calore: {
    nodes: [
      { t: 'Sospetta', d: 'Sforzo o caldo con confusione, agitazione o perdita di coscienza.' },
      { t: 'Temperatura' },
      { t: 'All’ombra e via gli indumenti in eccesso' },
      { t: 'Raffreddamento attivo subito', d: 'Immersione in acqua fredda se disponibile; altrimenti teli bagnati e ghiaccio, nebulizzazione e ventilazione.' },
      {
        ask: 'Sotto i 39 °C o sintomi risolti?',
        si: [{ t: 'Sospendi il raffreddamento' }],
        no: [{ t: 'Continua e ricontrolla' }],
      },
      { t: 'Prima raffreddare, poi trasportare' },
      sores('Riferisci alla SORES'),
      equipe('Liquidi e farmaci'),
    ],
    tu: ['Riconoscere e misurare la temperatura', 'Raffreddare subito'],
    equipe: ['Liquidi per via venosa', 'Gestione delle complicanze'],
  },

  intossicazione: {
    nodes: [
      { t: 'Sicurezza', d: 'Siringhe, aggressività, ambienti tossici.' },
      {
        ask: 'Vie aeree a rischio?',
        d: 'Vomito, gorgoglio, russamento.',
        si: [{ t: 'Aspira e posizione laterale', d: 'Se respira e non c’è trauma.' }],
        no: [],
      },
      sores('Riferisci la SpO₂'),
      {
        ask: 'Coscienza ridotta?',
        si: [sores('Chiedi il mezzo avanzato', 'Può esserci un’ipoglicemia: la misura e la tratta l’infermiere.')],
        no: [],
      },
      { t: 'Telo isotermico e ricerca di traumi' },
      { t: 'Non lasciarlo solo', d: 'Rivaluta spesso, non affidarlo agli amici.' },
    ],
    tu: ['Proteggere le vie aeree', 'Prevenire l’ipotermia', 'Sorvegliare'],
    equipe: ['Glicemia e glucosio', 'Antidoti e farmaci'],
  },

  annegamento: {
    nodes: [
      { t: 'Recupero sicuro', d: 'In acqua entra solo personale formato; da riva galleggiante o oggetto da allungare.' },
      {
        ask: 'Respira normalmente?',
        si: [{ t: 'Posizione laterale', d: 'Ossigeno al 100% con reservoir, poi riferiscilo alla SORES.' }],
        no: [{ t: '5 ventilazioni iniziali', d: 'Con pallone e ossigeno: la causa è l’ipossia.' }, { t: 'RCP 30:2' }, { t: 'DAE', d: 'Asciuga il torace prima delle piastre.' }],
      },
      { t: 'Togli gli indumenti bagnati e copri' },
      sores('Riferisci alla SORES'),
      equipe('Gestione avanzata delle vie aeree'),
    ],
    tu: ['5 ventilazioni iniziali e RCP', 'DAE', 'Prevenire l’ipotermia'],
    equipe: ['Vie aeree avanzate e farmaci'],
  },

  oppioidi: {
    nodes: [
      { t: 'Sicurezza', d: 'Siringa nel contenitore rigido, senza reincappucciarla.' },
      { t: 'Sospetta', d: 'Sopore estremo, respiro lento, pupille a punta di spillo.' },
      {
        ask: 'Respira normalmente?',
        si: [{ t: 'Posizione laterale' }, sores('Riferisci la SpO₂')],
        no: [{ t: 'Apri le vie aeree e ventila con il pallone', d: 'Collegato all’ossigeno ad alti flussi.' }, { t: 'Se non respira o gasping: BLSD' }],
      },
      sores('Riferisci alla SORES', 'Respiro, saturazione, pupille, siringa trovata.'),
      equipe('Naloxone', 'Il suo effetto può finire prima di quello dell’oppioide.'),
    ],
    tu: ['Ventilare con pallone e ossigeno', 'Mettere in sicurezza la siringa'],
    equipe: ['Naloxone', 'Gestione avanzata'],
  },

  fratture: {
    nodes: [
      { t: 'Sicurezza e dinamica', d: 'Alta energia? Gestiscilo come trauma maggiore.' },
      { ask: 'Emorragia importante?', si: [{ t: 'Comprimi e tampona', d: 'L’emorragia massiva viene prima della frattura.' }], no: [] },
      { t: 'Non muovere', d: 'Posizione antalgica; spostalo solo se la scena non è sicura.' },
      {
        ask: 'Distorsione senza segni di frattura?',
        si: [{ t: 'Togli la scarpa, immobilizza', d: 'Ghiaccio avvolto, arto in scarico.' }],
        no: [],
      },
      { t: 'Polso, motilità, sensibilità a valle' },
      {
        ask: 'Frattura esposta?',
        si: [{ t: 'Copri con garze e telo sterile', d: 'Non disinfettare, non toccare i monconi.' }],
        no: [],
      },
      { t: 'Immobilizza senza ridurre', d: 'Steccobenda o materassino, articolazione sopra e sotto; la lussazione resta com’è.' },
      { t: 'Ricontrolla polso, motilità, sensibilità' },
      { t: 'Telo isotermico e rassicura' },
      sores('Riferisci alla SORES', 'Dinamica, sede, frattura esposta, polso a valle, parametri.'),
      equipe('Analgesia'),
    ],
    tu: ['Riconoscere la frattura', 'Coprire la frattura esposta', 'Immobilizzare con controllo prima e dopo', 'Conservare la parte amputata'],
    equipe: ['Analgesia', 'Riduzione e trattamento definitivo'],
  },
  ipotermia: {
    nodes: [
      { t: 'Al riparo', d: 'Ambiente caldo, finestre chiuse, ambulanza riscaldata.' },
      { t: 'Coscienza e respiro', d: 'Valuta il respiro con calma: può essere lento e superficiale.' },
      {
        ask: 'Respira normalmente?',
        si: [],
        no: [{ t: 'BLSD' }],
        fine: 'no',
      },
      { t: 'Temperatura', d: 'Sotto i 35 °C il saturimetro non è affidabile.' },
      { t: 'Togli il bagnato', d: 'Con delicatezza, poi coperte e telo isotermico.' },
      {
        ask: 'Sotto i 32 °C, confusa, senza brivido?',
        si: [{ t: 'Sdraiata e immobile', d: 'Niente sedia, niente passi: il movimento può scatenare una FV.' }, { t: 'Ossigeno al 100%', d: 'Reservoir a 15 L/min, poi riferiscilo.' }],
        no: [{ t: 'Riscaldamento passivo graduale' }],
      },
      { t: 'Niente massaggi né frizioni' },
      sores('Riferisci alla SORES', 'Temperatura, coscienza, da quanto tempo era al freddo.'),
      equipe('Riscaldamento attivo e monitoraggio del ritmo'),
    ],
    tu: ['Riparo e riscaldamento passivo', 'Via il bagnato, coperte e telo', 'Movimenti delicati, paziente sdraiato'],
    equipe: ['Riscaldamento attivo', 'Monitoraggio del ritmo', 'Liquidi caldi in vena'],
  },
  trauma_cranico: {
    nodes: [
      { t: 'Dinamica', d: 'Alta energia? Trauma maggiore.' },
      { t: 'ABCDE, pupille e arti', d: 'Medica la ferita con una compressione delicata.' },
      { t: 'Chiedi i farmaci', d: 'Anticoagulanti o antiaggreganti?' },
      {
        ask: 'Segni d’allarme o anticoagulanti?',
        d: 'Vomito, sonnolenza, cefalea in aumento, pupille diverse, convulsioni, deficit di lato.',
        si: [sores('Riferisci subito', 'Serve la valutazione in ospedale anche se sta bene.')],
        no: [],
      },
      {
        ask: 'Alla rivalutazione è peggiorato?',
        d: 'Coscienza e pupille ogni pochi minuti.',
        si: [sores('Aggiorna la SORES', 'Codice e mezzi cambiano.'), { t: 'Vie aeree protette', d: 'Aspira se vomita; posizione che protegga le vie aeree.' }],
        no: [{ t: 'Continua a rivalutare' }],
      },
      equipe('Gestione avanzata delle vie aeree e della pressione'),
    ],
    tu: ['Chiedere i farmaci', 'Riconoscere i segni d’allarme', 'Rivalutare e aggiornare la SORES'],
    equipe: ['Valutazione neurologica', 'Gestione avanzata'],
  },
  ansia: {
    nodes: [
      { t: 'Ambiente tranquillo', d: 'Poche persone, tono calmo.' },
      { t: 'Parametri e anamnesi', d: 'SpO₂, FC, PA, FR; asma, allergie, dolore toracico, farmaci, sostanze.' },
      {
        ask: 'Segni di una causa organica?',
        d: 'Saturazione bassa, sibili, orticaria, dolore toracico, malattie note.',
        si: [{ t: 'Segui il protocollo della causa' }],
        no: [{ t: 'Rassicura e guida il respiro', d: 'Lento, dal naso, contando insieme.' }],
        fine: 'si',
      },
      { t: 'Niente sacchetto' },
      sores('Riferisci alla SORES', 'Parametri e sintomi: decide il trasporto.'),
    ],
    tu: ['Escludere le cause organiche', 'Rassicurare e guidare il respiro'],
    equipe: ['Valutazione medica'],
  },
  monossido: {
    nodes: [
      { t: 'Sospetta il monossido', d: 'Più persone con mal di testa e nausea, caldaia o stufa, inverno.' },
      { t: 'Arieggia e fai uscire tutti', d: 'Porte e finestre aperte, niente interruttori né fiamme.' },
      sores('Chiedi i Vigili del fuoco'),
      { t: 'Ossigeno al 100%', d: 'Reservoir a 15 L/min, anche con SpO₂ del 98–99%.' },
      { t: 'ABCDE', d: 'Il saturimetro non distingue il CO: non rassicura.' },
      {
        ask: 'Coscienza compromessa?',
        si: [{ t: 'Posizione laterale se respira normalmente', d: 'Convulsioni e vomito sono possibili.' }],
        no: [{ t: 'Semiseduto, a riposo', d: 'Non deve camminare: lo sforzo aumenta il bisogno di ossigeno.' }],
      },
      { t: 'Chiedi chi altro era in casa', d: 'Anche chi dorme in un’altra stanza.' },
      sores('Riferisci alla SORES', 'Sospetto CO, sintomi, numero di persone coinvolte.'),
      equipe('Valutazione per la camera iperbarica'),
    ],
    tu: ['Sicurezza della scena', 'Ossigeno al 100%', 'Contare le persone coinvolte'],
    equipe: ['Dosaggio della carbossiemoglobina', 'Indicazione all’ossigenoterapia iperbarica'],
  },
  parto: {
    nodes: [
      { t: 'Domande', d: 'Settimane, presentazione, gravidanze precedenti, contrazioni, rottura delle acque e colore del liquido.' },
      {
        ask: 'Parto imminente?',
        d: 'Premiti, voglia di spingere, capelli visibili al perineo durante la spinta.',
        si: [],
        no: [{ t: 'Trasporto semiseduta o sul fianco sinistro', d: 'Rassicura, privacy, aiutala a respirare.' }],
        fine: 'no',
      },
      { t: 'Prepara', d: 'Ambiente caldo, kit parto, telini, DPI.' },
      { t: 'Posizione', d: 'Bacino sollevato di 4–5 cm, cosce divaricate, ginocchia flesse.' },
      { t: 'Accompagna la testa', d: 'Sostieni senza mai tirare. Podalica: non toccare.' },
      { t: 'Annota l’ora di nascita' },
      { t: 'Asciuga e stimola', d: 'Garza su naso e bocca, poi asciuga tra le cosce della madre.' },
      {
        ask: 'Piange entro 30–60 secondi?',
        si: [{ t: 'Cambia il telo e avvolgilo', d: 'Coprigli la testa.' }],
        no: [{ t: 'Stimola: asciuga e massaggia la schiena' }, { t: 'Se non respira: rianimazione neonatale' }],
      },
      { t: 'Clampa il cordone', d: 'Taglia solo se corto (< 30 cm).' },
      { t: 'Sul ventre della madre', d: 'Su un fianco, coperto.' },
      { t: 'Secondamento', d: 'Placenta nel sacchetto senza tirare il cordone; massaggio del fondo uterino.' },
      sores('Riferisci alla SORES', 'Ora di nascita, condizioni di madre e neonato, perdite.'),
      equipe('Assistenza ostetrica e neonatale'),
    ],
    tu: ['Preparare e accompagnare il parto', 'Asciugare, stimolare e scaldare il neonato', 'Clampare il cordone, raccogliere la placenta'],
    equipe: ['Valutazione ostetrica', 'Rianimazione neonatale avanzata', 'Farmaci per l’emorragia post partum'],
  },
  ustioni: {
    nodes: [
      { t: 'Spegni la fonte di calore', d: 'E metti in sicurezza la scena.' },
      { t: 'Raffredda subito', d: 'Acqua corrente fresca per almeno 20 minuti. Niente ghiaccio, niente burro, olio o dentifricio.' },
      { t: 'Togli indumenti e anelli', d: 'Lascia ciò che è attaccato alla pelle.' },
      {
        ask: 'Bambino o ustione estesa?',
        si: [{ t: 'Copri subito il resto del corpo', d: 'Il raffreddamento esteso porta all’ipotermia.' }],
        no: [{ t: 'Telo isotermico dopo il raffreddamento' }],
      },
      { t: 'Stima l’estensione', d: 'Regola del palmo: il palmo del paziente con le dita vale circa l’1%.' },
      { t: 'Copri l’ustione', d: 'Pellicola appoggiata o medicazione non aderente, senza stringere.' },
      sores('Riferisci alla SORES', 'Estensione, sede, età; fuliggine o voce rauca vanno segnalate subito.'),
      equipe('Analgesia e liquidi'),
    ],
    tu: ['Raffreddare, scoprire, coprire', 'Stimare l’estensione', 'Prevenire l’ipotermia'],
    equipe: ['Analgesia', 'Liquidi e gestione delle vie aeree'],
  },
};
