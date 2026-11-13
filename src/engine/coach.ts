import type { Sim } from './engine';
import type { ActionGroup, Position } from './types';
import { ACTIONS } from './actions';
import { emergenzaO2 } from './oxygen';

/** Un passo suggerito dalla guida in addestramento. */
export interface CoachStep {
  text: string;
  /** azione da evidenziare nel pannello */
  action?: string;
  /** scheda in cui si trova l'azione */
  group?: ActionGroup;
  /** il passo è la scelta del protocollo (pulsante in alto) */
  protocol?: boolean;
  /** scelta consigliata per le azioni con un pannello (posizione) */
  pos?: Position;
  /** rapporto compressioni:ventilazioni da impostare nel pannello della RCP */
  cprRatio?: '15:2';
}

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** L'azione esiste, è pertinente al caso ed eseguibile adesso. */
function usable(sim: Sim, id: string): boolean {
  const a = ACTIONS[id];
  if (!a) return false;
  if (a.visible && !a.visible(sim)) return false;
  // presidio rimasto sul mezzo: lo propone solo se il caso lo prevede (cliccando parte il recupero)
  const lo = sim.scenario.loadout;
  const missing = (a.needs ?? []).filter((e) => !sim.brought.has(e));
  if (missing.length && (!lo || missing.some((e) => !lo.essential.includes(e) && !lo.recommended.includes(e) || lo.unavailable?.includes(e)))) return false;
  if (missing.length && sim.fetching.length) return false;
  return sim.actionAvailability(id) === true;
}

function make(sim: Sim, id: string, text: string, pos?: Position): CoachStep | null {
  return usable(sim, id) ? { text, action: id, group: ACTIONS[id].group, ...(pos ? { pos } : {}) } : null;
}

/** L'ossigeno in corso è quello indicato dalla SORES. */
function o2ComeIndicato(sim: Sim): boolean {
  const o = sim.o2Order;
  if (!o?.device || !sim.o2) return false;
  return sim.o2.device === o.device && (o.device !== 'venturi' || sim.o2.fio2 === o.fio2) && (o.device === 'venturi' || Math.abs(sim.o2.flow - o.flow) <= 1);
}

/** Come caricare il paziente, in base al caso: modalità e posizione da scegliere nel pannello del trasporto. */
function trasportoTesto(sim: Sim): string {
  const proto = sim.scenario.protocol.correct[0];
  const sedia = sim.has('sedia');
  if (sim.scenario.trauma) return 'Il paziente è immobilizzato: caricalo in barella sul materassino e trasporta.';
  if (proto === 'dispnea')
    return sedia
      ? 'Trasporto: sedia portantina, paziente seduto. Con questa dispnea non deve fare le scale a piedi.'
      : 'Trasporto: in barella, paziente seduto. Con questa dispnea non deve camminare.';
  if (proto === 'dolore_toracico') return 'Trasporto: in barella, semiseduto. Con il dolore toracico non deve camminare.';
  if (sim.flags.nonCamminare) return 'Trasporto: in barella, non a piedi. ' + String(sim.flags.nonCamminare);
  return 'Il paziente è pronto: carica e trasporta.';
}

function first(...xs: Array<CoachStep | null | false | undefined>): CoachStep | null {
  for (const x of xs) if (x) return x;
  return null;
}

/**
 * Il prossimo passo secondo la sequenza insegnata nei corsi: sicurezza, coscienza, BLSD se serve,
 * poi A-B-C-D-E, anamnesi, protocollo, SORES, trasporto o consegna. Le urgenze del caso vengono prima.
 */
export function nextStep(sim: Sim): CoachStep | null {
  if (sim.ended) return null;
  const sc = sim.scenario;
  const p = sim.p;
  const proto = sc.protocol.correct[0];
  const did = (...ids: string[]) => sim.didAny(...ids);
  const step = (id: string, text: string, pos?: Position) => make(sim, id, text, pos);

  // ── arrivo e sicurezza
  if (sim.phase === 'scena') {
    return first(
      sc.role !== 'laico' && !did('guanti') && step('guanti', 'Proteggiti: indossa i guanti.'),
      !did('valuta_scena') && step('valuta_scena', 'Prima di avvicinarti valuta la sicurezza della scena.'),
      ...sc.scene.hazards.filter((h) => !sim.flags['fix_' + h.fixAction]).map((h) => step(h.fixAction, `Pericolo: ${lowerFirst(h.label)}. Mettilo in sicurezza prima di avvicinarti.`)),
      step('avvicinati', 'La scena è sicura: avvicinati al paziente.'),
    );
  }

  // ── emorragia massiva: viene prima di tutto
  const bleedingNow = p.bleeding && !sim.inArrest() && !sim.tourniquet?.ok && !(sim.dressing && !p.bleeding.arterial);
  if (bleedingNow) {
    const b = first(
      !did('compressione_diretta') && step('compressione_diretta', 'Emorragia massiva: prima di tutto comprimi la ferita.'),
      p.bleeding!.arterial && step('tourniquet', 'La compressione non basta: tourniquet 5–7 cm a monte della ferita, mai su un’articolazione.'),
    );
    if (b) return b;
  }

  // ── coscienza
  if (!did('coscienza')) {
    const c = step('coscienza', 'Valuta la coscienza: chiamalo ad alta voce e toccagli le spalle.');
    if (c) return c;
  }

  // ── ritorno del circolo: si sospendono le compressioni
  if (!sim.inArrest() && sim.cpr.active) {
    const r = step('stop_rcp', 'Segni di vita: interrompi le compressioni e rivaluta subito il respiro.');
    if (r) return r;
  }

  // ── arresto cardiaco: BLSD
  if (sim.inArrest()) {
    const aed = sim.aed;
    const shockPending = aed.phase === 'carica' || aed.phase === 'pronto';
    if (aed.phase === 'analisi') return { text: 'Il DAE sta analizzando il ritmo: nessuno tocchi il paziente.' };
    // RCP fatta dall'equipaggio (un astante che comprime va sostituito)
    const crewCpr = sim.cpr.active && sim.cpr.by !== 'astante';
    const child = p.age < 18;
    // shock in arrivo: viene prima di tutto, comprese le compressioni (dopo «Via tutti!» nessuno riprende a comprimere)
    if (shockPending) {
      const clear = aed.clearCalledAt !== null && aed.clearCalledAt >= aed.phaseAt && !sim.cpr.active;
      const s = first(
        !clear && step('allontanatevi', 'Shock consigliato: «Via tutti!», nessuno deve toccare il paziente.'),
        clear && aed.phase === 'carica' && { text: 'Il DAE si sta caricando: nessuno tocchi il paziente, tra poco premi Shock.' },
        clear && aed.phase === 'pronto' && { text: 'Nessuno tocca il paziente: premi Shock nel pannello del DAE.' },
      );
      if (s) return s;
    }
    return first(
      sc.role === 'laico' && !did('chiama_112') && step('chiama_112', 'Non risponde: chiama subito il 112 in vivavoce.'),
      sc.role === 'laico' && step('manda_dae', 'Manda qualcuno a prendere il DAE più vicino.'),
      !crewCpr && !did('apri_vie_aeree', 'sublussazione') && step('apri_vie_aeree', 'Non risponde: apri le vie aeree, capo esteso e mento sollevato.'),
      !crewCpr && !did('gas', 'polso_carotideo') && step('gas', 'Respira normalmente? Guarda, ascolta e senti per non più di 10 secondi.'),
      proto === 'pbls' && !crewCpr && !did('aspira') && sim.has('aspiratore') && step('aspira', 'Nel lattante con bronchiolite il muco ostruisce: aspira prima di ventilare.'),
      (proto === 'pbls' || proto === 'annegamento') && !crewCpr && !did('ventilazioni_iniziali') && step('ventilazioni_iniziali', 'Arresto da mancanza di ossigeno: prima 5 ventilazioni di soccorso.'),
      !crewCpr && step('rcp', sim.cpr.active ? 'Date il cambio a chi sta comprimendo: inizia l’equipaggio.' : 'Non respira normalmente: inizia subito le compressioni toraciche.'),
      child && crewCpr && sc.role !== 'laico' && sim.cpr.ratio !== '15:2' && { text: 'Bambino: con un equipaggio addestrato il rapporto è 15:2. Impostalo nel pannello della RCP.', cprRatio: '15:2' as const },
      sim.has('dae') && aed.phase === 'spento' && step('dae_accendi', 'Accendi il DAE mentre si continua a comprimere.'),
      sim.has('dae') && !aed.pads && step('dae_piastre', child && p.weightKg < 25 ? 'Applica le piastre in posizione antero-posteriore, modalità pediatrica.' : 'Applica le piastre del DAE sul torace nudo.'),
      sim.has('pallone') && crewCpr && !did('pallone') && step('pallone', 'Ventila con il pallone autoespansibile durante la RCP.'),
      (sim.bvm || sim.cpr.ventilation === 'pallone') && sim.has('ossigeno') && !sim.o2 && step('ossigeno', 'Collega l’ossigeno ad alti flussi al pallone: reservoir a 15 L/min.'),
      !sim.protocol && { text: 'In alto dichiara il protocollo che stai applicando.', protocol: true },
      sc.role !== 'laico' && !sim.report && step('comunica', 'Aggiorna la SORES: arresto cardiaco, RCP e DAE in corso.'),
      sim.cpr.active && sc.crew > 1 && sim.t - sim.cpr.compressorSince >= 110 && step('cambio_compressore', 'Sono quasi 2 minuti: cambio del compressore.'),
      sim.msaOnScene && step('consegna', 'L’équipe avanzata è arrivata: passa le consegne continuando la RCP.'),
      sim.cpr.active && sim.t - sim.cpr.compressorSince < 80 && sim.aedFetchAt === null && (!sim.has('dae') || (!!aed.pads && aed.pads !== 'errata')) && step('attendi', 'Continua la RCP: 100–120 compressioni al minuto, profonde 5–6 cm, pause al minimo. Prosegui fino alla prossima analisi o all’arrivo dei soccorsi.'),
      { text: 'Continua la RCP: 100–120 compressioni al minuto, profonde 5–6 cm, pause al minimo.' },
    );
  }

  const respiroInefficace = p.airway !== 'ostruzione_completa' && (p.breathing === 'assente' || p.breathing === 'agonico' || ((p.breathing === 'bradipnoico' || p.breathing === 'superficiale') && p.v.rr < 8 && p.avpu !== 'A'));
  const lastFbao = ['colpi_dorsali', 'compressioni_addominali', 'compressioni_toraciche_lattante'].map((id) => ({ id, t: sim.doneAt.get(id)?.slice(-1)[0] ?? -1 })).sort((a, b) => b.t - a.t)[0];
  const fineCrisi = sim.flags.fineCrisi === undefined ? null : Number(sim.flags.fineCrisi);
  const gasDopoCrisi = fineCrisi !== null && (sim.doneAt.get('gas') ?? []).some((t) => t >= fineCrisi);

  return first(
    // ── urgenze immediate
    p.airway === 'ostruzione_completa' && p.avpu !== 'A' && !sim.cpr.active && step('rcp', 'Ha perso coscienza con l’ostruzione: a terra e subito compressioni toraciche.'),
    !!sim.flags.corpoVisibile && !sim.flags.corpoRimosso && !did('ispeziona_bocca') && step('ispeziona_bocca', 'Prima di ventilare guarda in bocca.'),
    !!sim.flags.corpoVisibile && !sim.flags.corpoRimosso && step('rimuovi_corpo_estraneo', 'Il corpo estraneo è visibile: rimuovilo, un solo tentativo.'),
    proto.startsWith('fbao') && p.airway === 'ostruzione_parziale' && p.avpu === 'A' && step('incoraggia_tosse', 'Ostruzione parziale, riesce a tossire: incoraggialo a tossire.'),
    proto.startsWith('fbao') &&
      p.airway === 'ostruzione_completa' &&
      (p.age < 1
        ? lastFbao.id === 'colpi_dorsali' && lastFbao.t >= 0
          ? step('compressioni_toraciche_lattante', 'Ostruzione completa nel lattante: ora 5 compressioni toraciche.')
          : step('colpi_dorsali', 'Ostruzione completa nel lattante: 5 colpi dorsali, poi 5 compressioni toraciche.')
        : lastFbao.id === 'colpi_dorsali' && lastFbao.t >= 0
          ? step('compressioni_addominali', 'Ostruzione completa: ora 5 compressioni addominali.')
          : step('colpi_dorsali', 'Ostruzione completa: 5 colpi interscapolari, poi 5 compressioni addominali.')),
    sc.trauma && !sim.immob.has('mils') && step('mils', 'Dinamica ad alta energia: stabilizza subito il capo in posizione neutra.'),
    p.look.helmet && step('rimuovi_casco', 'Il casco integrale impedisce di gestire le vie aeree: rimuovilo in due.'),
    p.bleeding && sim.tourniquet?.ok && sc.role !== 'laico' && !sim.report && step('comunica', 'Emorragia fermata: riferisci subito alla SORES, con l’ora del tourniquet.'),
    p.seizing && !did('proteggi_crisi') && step('proteggi_crisi', 'Crisi in corso: proteggi il capo, allontana gli oggetti, non trattenere.'),
    p.seizing && !did('cronometra') && step('cronometra', 'Annota l’ora di inizio e cronometra la crisi.'),
    proto === 'dolore_toracico' && p.avpu === 'A' && p.position !== 'semiseduto' && p.position !== 'seduto' && step('posizione', 'Dolore toracico: fallo stare semiseduto e a riposo, non deve camminare.', 'semiseduto'),
    proto === 'anafilassi' && sim.requests.msa === undefined && step('richiedi_msa', 'Reazione allergica grave: chiedi subito il mezzo avanzato, l’adrenalina la somministra l’équipe sanitaria.'),
    proto === 'ustioni' && !did('raffredda_ustione') && step('raffredda_ustione', 'Ustione: raffredda subito con acqua corrente fresca.'),
    proto === 'colpo_calore' && !did('temperatura') && step('temperatura', 'Pelle bollente e confusione: misura la temperatura.'),
    proto === 'colpo_calore' && !did('scopri') && step('scopri', 'Togli gli indumenti in eccesso e portalo all’ombra.'),
    proto === 'colpo_calore' && !sim.cooling && !did('raffredda') && step('raffredda', 'Colpo di calore: raffreddamento attivo subito, il metodo migliore disponibile.'),
    !!sim.cooling && p.v.temp < 39 && step('stop_raffreddamento', 'La temperatura è scesa sotto i 39 °C: sospendi il raffreddamento.'),
    !!sim.cooling && sim.t - (sim.measurements.get('temperatura')?.t ?? -1e9) >= 120 && step('temperatura', 'Continua a raffreddare e ricontrolla la temperatura.'),
    !!sim.cooling && step('attendi', 'Continua il raffreddamento: si sospende quando la temperatura scende sotto i 39 °C.'),
    respiroInefficace && !did('apri_vie_aeree', 'sublussazione') && step(sc.trauma ? 'sublussazione' : 'apri_vie_aeree', 'Respira pochissimo: apri le vie aeree.'),
    respiroInefficace && !sim.bvm && sim.has('pallone') && step('pallone', 'Respiro insufficiente: ventila con il pallone autoespansibile.'),
    sim.bvm && sim.has('ossigeno') && !sim.o2 && step('ossigeno', 'Collega l’ossigeno ad alti flussi al pallone.'),
    fineCrisi !== null && !gasDopoCrisi && step('gas', 'La crisi è finita: verifica subito se respira normalmente.'),
    fineCrisi !== null && p.position !== 'laterale' && step('posizione', 'Respira ma non è cosciente: posizione laterale di sicurezza.', 'laterale'),

    // ── A: vie aeree
    (p.vomitInMouth || p.airway === 'gorgogliante') && sim.has('aspiratore') && step('aspira', 'Gorgoglio in gola: aspira le secrezioni.'),
    (p.vomitInMouth || p.airway === 'gorgogliante' || p.airway === 'russante') && p.avpu !== 'A' && !sc.trauma && p.position !== 'laterale' && step('posizione', 'Non è sveglio e respira: posizione laterale di sicurezza per proteggere le vie aeree.', 'laterale'),
    sc.trauma && p.airway === 'russante' && !did('sublussazione') && step('sublussazione', 'Russa: apri le vie aeree con la sublussazione della mandibola, senza muovere il capo.'),

    (p.avpu === 'P' || p.avpu === 'U') && sc.role !== 'laico' && sc.msa.available && !sc.msa.autoDispatched && sim.requests.msa === undefined && step('richiedi_msa', 'Risponde solo al dolore o non risponde: chiedi alla SORES il mezzo avanzato.'),

    // ── B: respiro e ossigeno
    !did('gas') && p.avpu !== 'A' && step('gas', 'Valuta il respiro: guarda, ascolta e senti.'),
    did('gas') && (p.avpu === 'P' || p.avpu === 'U') && !sc.trauma && !respiroInefficace && p.position !== 'laterale' && step('posizione', 'Non è cosciente ma respira: posizione laterale di sicurezza.', 'laterale'),
    !sim.pulseOx && sim.has('zaino') && step('saturimetro', 'Applica il saturimetro.'),
    emergenzaO2(sim) && !sim.o2 && !sim.bvm && sc.role !== 'laico' && sim.has('ossigeno') && step('ossigeno', 'Situazione critica: puoi dare subito ossigeno al 100% senza attendere la SORES, maschera con reservoir a 15 L/min. Poi riferiscilo.'),
    sim.pulseOx && !sim.o2Order && sc.role !== 'laico' && step('chiedi_ossigeno', sim.o2 ? 'Riferisci alla SORES la saturazione e l’ossigeno che hai avviato.' : 'Riferisci la saturazione alla SORES: ti dirà se dare l’ossigeno e con quale presidio.'),
    !!sim.o2Order?.device && !o2ComeIndicato(sim) && sim.has('ossigeno') && step('ossigeno', sim.o2 ? 'Adegua l’ossigeno all’indicazione della SORES.' : 'Applica l’ossigeno con il presidio e la concentrazione indicati dalla SORES.'),
    ['tachipnoico', 'dispnoico', 'sibili', 'bradipnoico', 'superficiale'].includes(p.breathing) && !did('conta_fr') && step('conta_fr', 'Respira male: conta la frequenza respiratoria.'),

    sc.dispatch.criticita === 'R' && sc.role !== 'laico' && !sim.report && sim.pulseOx && step('comunica', 'Codice rosso: aggiorna presto la SORES con quello che hai trovato.'),

    // ── C: circolo
    !did('pressione') && sim.has('zaino') && step('pressione', 'Misura la pressione arteriosa.'),
    sc.trauma && !did('cerca_emorragie') && step('cerca_emorragie', 'Cerca emorragie importanti con un rapido testa-piedi.'),
    sc.trauma && !!sim.flags.traumaBacino && !sim.immob.has('pelvica') && step('cintura_pelvica', 'Dolore al bacino dopo un trauma ad alta energia: cintura pelvica.'),

    // ── D: neurologico
    p.avpu !== 'A' && !did('pupille') && step('pupille', 'Coscienza ridotta: valuta le pupille.'),
    proto === 'ictus' && !did('cincinnati') && step('cincinnati', 'Parla male e muove poco un braccio: scala di Cincinnati.'),

    // ── anamnesi mirata
    proto === 'ictus' && !did('q_esordio') && step('q_esordio', 'Chiedi quando è stata vista bene l’ultima volta: è l’ora di esordio.'),
    proto === 'ipoglicemia' && !did('q_farmaci', 'q_pasto', 'q_testimoni') && step('q_farmaci', 'Chiedi che farmaci prende: è diabetico?'),
    proto === 'dolore_toracico' && !did('q_dolore') && step('q_dolore', 'Fatti descrivere il dolore (OPQRST).'),
    proto === 'dolore_toracico' && !did('q_esordio') && step('q_esordio', 'Chiedi quando è iniziato il dolore.'),

    // ── E: esposizione
    proto === 'ustioni' && !did('rimuovi_indumenti') && step('rimuovi_indumenti', 'Togli la maglietta bagnata d’acqua bollente.'),
    (sc.trauma || proto === 'ustioni' || p.v.temp < 36) && !sim.covered && step('telo', 'Copri con il telo isotermico per evitare l’ipotermia.'),
    proto === 'ustioni' && !did('stima_superficie') && step('stima_superficie', 'Stima l’estensione dell’ustione con la regola del palmo.'),

    // ── anamnesi generale
    sim.canTalk() && !did('q_eventi', 'q_testimoni', 'q_sintomi', 'q_dolore', 'q_farmaci') && step('q_eventi', 'Chiedi cosa è successo.'),
    !sim.canTalk() && !!sc.scene.bystanders && !did('q_testimoni') && step('q_testimoni', 'Il paziente non può rispondere: chiedi ai presenti cosa è successo.'),
    proto === 'ictus' && !did('q_farmaci') && step('q_farmaci', 'Chiedi la terapia: un anticoagulante va riferito.'),
    proto === 'ictus' && !did('q_patologie') && step('q_patologie', 'Chiedi le malattie note: diabete, aritmie.'),
    p.age < 14 && sim.canTalk() && !did('rassicura') && step('rassicura', 'Rassicura il bambino e tieni il genitore accanto a lui.'),

    // ── protocollo e SORES
    !sim.protocol && { text: 'Hai abbastanza elementi: in alto scegli il protocollo.', protocol: true },
    sc.role !== 'laico' && !sim.report && step('comunica', 'Riferisci alla SORES valutazione e parametri.'),
    sc.role !== 'laico' && !!sim.report && sc.reportKeys.some((k) => !sim.report!.items.includes(k) && sim.measurements.has(k)) && step('comunica', 'Aggiorna la SORES con i dati che non le avevi ancora riferito.'),
    proto === 'ustioni' && !did('copri_ustione') && step('copri_ustione', 'Dopo il raffreddamento copri l’ustione con la pellicola, senza stringere.'),

    // ── immobilizzazione nel trauma
    sc.trauma && !sim.immob.has('collare') && step('collare', 'Applica il collare cervicale della misura giusta.'),
    sc.trauma && !sim.immob.has('cucchiaio') && step('cucchiaio', 'Carica il paziente sulla barella a cucchiaio.'),
    sc.trauma && !sim.immob.has('materasso') && step('materasso', 'Immobilizzalo nel materassino a depressione.'),

    // ── conclusione
    sim.msaOnScene && step('consegna', 'L’équipe avanzata è arrivata: passa le consegne.'),
    sim.msaAt !== null && step('rivaluta', 'Il mezzo avanzato è in arrivo: resta con il paziente e rivalutalo.'),
    sc.role === 'laico' && step('rivaluta', 'Resta con la persona e rivalutala finché arriva l’ambulanza.'),
    step('trasporta', trasportoTesto(sim)),
  );
}
