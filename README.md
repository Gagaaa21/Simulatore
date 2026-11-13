# Sirena 118

Simulatore di scenari di soccorso sanitario extraospedaliero per la formazione dei **soccorritori del 118**, volontari e dipendenti, e del personale sanitario degli **eventi e dei concerti**.

Ricevi la missione dalla Centrale Operativa, scegli i presidi da portare, valuta la sicurezza della scena e il paziente, decidi il protocollo e agisci. Il paziente reagisce in tempo reale; alla fine una scheda di intervento confronta ogni scelta con le linee guida ufficiali, citando la fonte.

> Strumento didattico. Non sostituisce i corsi certificati (BLSD, PBLSD, PTC, formazione regionale per soccorritori) né i protocolli della tua Centrale Operativa. In un’emergenza reale chiama il **112**.

## Cosa contiene

| Modulo | Descrizione |
|---|---|
| **Missioni** | 18 scenari: territorio 118, concerti ed eventi, interventi fuori servizio. Vista dall’alto del paziente in stile «sala operatoria», monitor dei parametri, DAE con voce, RCP, ossigeno, tourniquet, immobilizzazione, comunicazione con la Centrale. |
| **Allenamento RCP** | Ritmo 100–120/min con metronomo, rapporti 30:2 e 15:2, statistiche sulle pause. |
| **Maxi-emergenza** | Triage START e JumpSTART di 14 feriti dopo una calca all’uscita di un concerto. |
| **Pianifica un evento** | Livello di rischio (Allegato A1) e risorse con l’algoritmo di Maurer (Allegato A2) dell’Accordo Stato-Regioni 2014. |
| **Protocolli** | Algoritmi, numeri chiave ed errori frequenti; codici del 118 (DM 15/05/1992); aspetti legali. |
| **Fonti** | Bibliografia di ogni regola usata dal simulatore. |

Due modalità: **Addestramento** (errori e suggerimenti in tempo reale, con la fonte) ed **Esame** (nessun aiuto durante la missione, tutto nel debriefing).

### Scenari

| Scenario | Ambito | Protocollo |
|---|---|---|
| Crollo sul divano | ACR a domicilio, RCP già avviata dalla moglie | BLSD adulto |
| Il boccone di troppo | Soffocamento al ristorante | Disostruzione adulto |
| Non è da lui | Ipoglicemia in diabetico | Ipoglicemia |
| Le parole sbagliate | Ictus con afasia, paziente anticoagulata | Sospetto ictus |
| Un peso sul petto | Infarto che evolve in fibrillazione ventricolare | Dolore toracico |
| Silenzio nel seggiolone | Soffocamento in un lattante | Disostruzione pediatrica |
| Il respiro di Sara | Arresto ipossico in un lattante con bronchiolite | PBLSD pediatrico |
| Il disco della smerigliatrice | Emorragia arteriosa in cantiere | Emorragia massiva |
| Parcheggio del palazzetto | Sovradosaggio da oppioidi | Oppioidi |
| Dal pontile | Annegamento, arresto ipossico | Annegamento |
| Il fiato che manca | BPCO, ossigeno titolato 88–92% | Dispnea |
| Incrocio, ore 23 | Trauma maggiore da moto | Trauma maggiore |
| Crisi in transenna | Crisi convulsiva al concerto | Crisi convulsiva |
| Ballava fino a un attimo fa | ACR nel pogo con respiro «quasi normale» (ERC 2025) | BLSD adulto |
| Mezzogiorno sotto il palco | Colpo di calore da sforzo | Colpo di calore |
| La salsa sbagliata | Anafilassi allo stand gastronomico | Anafilassi |
| L’ultima vodka | Intossicazione alcolica in una minorenne | Intossicazione |
| Alla cassa 4 | Fuori servizio: ACR al supermercato con DAE pubblico | BLSD adulto |

## Fonti principali

- European Resuscitation Council, **Guidelines 2025**: Adult BLS, Paediatric Life Support, First Aid (Resuscitation 2025;215 Suppl 1).
- **DM 15 maggio 1992** – codifica degli interventi di emergenza (codici luogo, patologia, criticità, valutazione sanitaria).
- **Accordo Conferenza Unificata 5 agosto 2014** (Rep. Atti 91/CU) – soccorso sanitario negli eventi e algoritmo di Maurer.
- **ISS – Linea guida sul trauma maggiore** (Sistema Nazionale Linee Guida).
- **Legge 116/2021** e Legge 120/2001 sui defibrillatori; art. 593 c.p.
- BTS 2017 (ossigenoterapia), ESC 2023 (sindromi coronariche acute), AHA/ASA 2019 (ictus), Cincinnati Prehospital Stroke Scale, START/JumpSTART, LICE.

L’elenco completo, con riferimenti bibliografici, è nella schermata **Fonti** e in `src/data/sources.ts`.

## Avvio

Serve Node.js 20 o successivo.

```bash
npm install
npm run dev        # sviluppo su http://localhost:5173
npm test           # 60 test: integrità dei dati e percorsi ideali di ogni scenario
npm run build      # build statica in dist/
npm run build:artifact   # pagina HTML unica in dist-artifact/sirena-118.html
```

La build in `dist/` è un sito statico: si può aprire con qualsiasi web server. Il workflow `.github/workflows/deploy.yml` la pubblica su **GitHub Pages** a ogni push sul ramo `main` (in GitHub: *Settings → Pages → Source: GitHub Actions*).

## Comandi in missione

| Tasto | Azione |
|---|---|
| `/` | Cerca un’azione |
| `P` | Pausa |
| `Spazio` | Compressione (quando comprimi tu) |
| `V` | Ventilazione |
| `Invio` | Shock, quando il DAE è pronto |

Si può anche cliccare direttamente sul corpo del paziente o sui presidi appoggiati a terra.

## Struttura del codice

```
src/
  engine/          motore: fisiologia, tempo, DAE, RCP, azioni, punteggio
  data/            fonti, codici 118, presidi, protocolli, scenari, triage, eventi
  ui/              React: schermate, componenti, disegni SVG della scena
  styles/          design system (token, tipografia) e stili
tests/             test del motore, degli scenari e delle tabelle ufficiali
```

Per aggiungere uno scenario vedi [docs/scenari.md](docs/scenari.md).

## Licenza dei contenuti

Le linee guida citate appartengono ai rispettivi autori; il simulatore ne riporta solo i contenuti essenziali con il riferimento alla fonte.
