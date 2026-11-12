# Come scrivere uno scenario

Ogni scenario è un file TypeScript in `src/data/scenarios/` che esporta un oggetto `Scenario` (tipi in `src/engine/types.ts`). Dopo averlo scritto, aggiungilo all’elenco in `src/data/scenarios/index.ts` e scrivi il suo percorso ideale in `tests/scenarios.test.ts`.

## Regola d’oro

Ogni comportamento atteso, obiettivo o errore deve poggiare su una **fonte ufficiale** presente in `src/data/sources.ts`. Se una pratica varia tra Regioni, scrivilo esplicitamente («secondo il protocollo regionale») invece di trattarla come universale.

## Le parti di uno scenario

| Campo | A cosa serve |
|---|---|
| `dispatch` | Codici del DM 15/05/1992 (luogo, patologia, criticità), indirizzo, testo dell’operatore, ora della chiamata, minuti di viaggio. |
| `loadout` | Presidi `essential` (penalizzati se dimenticati) e `recommended`; `fetchTime` = secondi per tornare al mezzo. `null` per gli scenari fuori servizio. |
| `scene` | Testo di arrivo, pericoli (`hazards`, ognuno con l’azione che lo neutralizza), dinamica, presenti, eventuale DAE pubblico. |
| `patient` | Stato iniziale: AVPU, vie aeree, respiro, ritmo, parametri (`v`), cute, pupille, posizione, aspetto (`look`) per il disegno. |
| `arrest` | Se il paziente è (o andrà) in arresto: defibrillabile o no, dopo quanti shock o secondi di RCP di qualità riparte il circolo. |
| `answers` | Risposte all’anamnesi. Un testo che inizia con `[Moglie]` viene detto da un testimone. |
| `exam` | Reperti dell’esame testa-piedi, del cavo orale, del torace. |
| `protocol` / `valutazione` | Protocollo e codice di valutazione sanitaria (I0–I4) corretti o accettabili. |
| `reportKeys` | Dati che la Centrale si aspetta nel report (chiavi delle misure: `spo2`, `pa`, `glicemia`, `esordio`, `tq`…). |
| `objectives` | Obiettivi specifici con punti, criticità, spiegazione e fonti. |
| `hooks` | `onStart`, `tick` (ogni secondo simulato), `onAction` (per reperti o effetti specifici), `outcome`. |

Gli obiettivi comuni (sicurezza della scena, pericoli, guanti, presidi essenziali, protocollo, valutazione e report alla Centrale) vengono aggiunti automaticamente da `src/engine/scoring.ts`.

## Fisiologia

Il motore aggiorna ogni secondo:

- **SpO₂**: tende alla «SpO₂ in aria» (`spo2Air`) più l’effetto del presidio di ossigeno; scende se le vie aeree sono ostruite o se il respiro è assente senza ventilazione.
- **Emorragia**: perdita in mL/min ridotta da compressione, medicazione e tourniquet; frequenza, pressione e coscienza seguono la percentuale di volume perso.
- **Arresto**: tempi di no-flow e low-flow, qualità della RCP, analisi e shock del DAE, ritorno del circolo.
- **Valori intrinseci** (`sim.base`): gli scenari li modificano nel `tick` (es. temperatura nel colpo di calore, glicemia dopo lo zucchero).

## Verifica

`npm test` controlla per ogni scenario che fonti, protocolli, presidi e azioni esistano, che lo scenario regga 20 minuti senza interventi e una sequenza casuale di azioni, e che il percorso ideale raggiunga tutti gli obiettivi senza penalità.
