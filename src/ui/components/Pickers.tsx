import { useMemo, useState } from 'react';
import type { Sim } from '../../engine/engine';
import type { BodyRegion, O2Device, Position, ProtocolId } from '../../engine/types';
import { describeO2, VENTURI_FLOW } from '../../engine/oxygen';
import { PROTOCOLS, PROTOCOL_ORDER } from '../../data/protocols';
import { Modal } from './Modal';

type Confirm = (params: Record<string, unknown>) => void;

// ───────────────────────── ossigeno
const O2_INFO: Record<O2Device, { name: string; range: [number, number]; fio2: string; desc: string }> = {
  occhialini: { name: 'Occhialini nasali', range: [1, 4], fio2: 'FiO₂ circa 24–40%', desc: 'Bassi flussi per ipossiemie lievi.' },
  maschera: { name: 'Maschera semplice', range: [5, 10], fio2: 'FiO₂ circa 40–60%', desc: 'Sotto 5 L/min si respira di nuovo la propria CO₂.' },
  venturi: { name: 'Maschera Venturi', range: [2, 15], fio2: 'Concentrazione fissa scelta con la valvola', desc: 'Concentrazione precisa: è quella che la SORES indica in percentuale.' },
  reservoir: { name: 'Maschera con reservoir', range: [10, 15], fio2: 'FiO₂ circa 60–90%', desc: 'Alte concentrazioni; il pallone deve restare gonfio.' },
};
const VENTURI_STEPS = [24, 28, 31, 35, 40, 50, 60];

export function OxygenPicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  const order = sim.o2Order;
  const [device, setDevice] = useState<O2Device>(sim.o2?.device ?? (sim.inArrest() || sim.bvm ? 'reservoir' : 'maschera'));
  const [flow, setFlow] = useState<number>(sim.o2?.flow ?? 6);
  const [fio2, setFio2] = useState<number>(sim.o2?.fio2 ?? 28);
  const info = O2_INFO[device];
  const realFlow = device === 'venturi' ? VENTURI_FLOW[fio2] : flow;
  const outOfRange = device !== 'venturi' && (flow < info.range[0] || flow > info.range[1]);
  return (
    <Modal
      title="Ossigenoterapia"
      kicker="B · Respiro"
      onClose={onCancel}
      footer={
        <>
          {sim.o2 && (
            <button className="btn" onClick={() => onConfirm({ device: null, flow: 0 })}>
              Sospendi l’ossigeno
            </button>
          )}
          <button className="btn btn-arancio" onClick={() => onConfirm({ device, flow: realFlow, ...(device === 'venturi' ? { fio2 } : {}) })}>
            {device === 'venturi' ? `Applica Venturi ${fio2}%` : `Somministra ${flow} L/min`}
          </button>
        </>
      }
    >
      {order?.device ? (
        <p className="sores-order">
          <span className="sores-tag">SORES</span>
          Indicazione: <strong>{describeO2(order.device, order.flow, order.fio2)}</strong>, obiettivo <span className="num">{order.target[0]}–{order.target[1]}%</span>.
        </p>
      ) : (sim.inArrest() || sim.bvm) ? (
        <p className="sores-order">
          <span className="sores-tag">BLSD</span>
          Ventilazione con pallone: collega l’ossigeno ad alti flussi (reservoir, 15 L/min).
        </p>
      ) : null}
      <div className="o2-devices" role="radiogroup" aria-label="Presidio">
        {(Object.keys(O2_INFO) as O2Device[]).map((d) => (
          <button
            key={d}
            role="radio"
            aria-checked={device === d}
            className={`o2-card${device === d ? ' on' : ''}`}
            onClick={() => {
              setDevice(d);
              if (d !== 'venturi') setFlow(Math.min(O2_INFO[d].range[1], Math.max(O2_INFO[d].range[0], flow)));
            }}
          >
            <span className="o2-name">{O2_INFO[d].name}</span>
            <span className="o2-range num">{d === 'venturi' ? '24–60%' : `${O2_INFO[d].range[0]}–${O2_INFO[d].range[1]} L/min`}</span>
            <span className="o2-desc">{O2_INFO[d].desc}</span>
          </button>
        ))}
      </div>
      {device === 'venturi' ? (
        <div className="flow">
          <span className="flow-label">Valvola della maschera Venturi</span>
          <div className="seg seg-wrap" role="radiogroup" aria-label="Concentrazione">
            {VENTURI_STEPS.map((v) => (
              <button key={v} role="radio" aria-checked={fio2 === v} className={fio2 === v ? 'on' : ''} onClick={() => setFio2(v)}>
                <span className="num">{v}%</span>
              </button>
            ))}
          </div>
          <p className="flow-note">
            Flussimetro a <span className="num">{VENTURI_FLOW[fio2]}</span> L/min, come riportato sulla valvola.
          </p>
        </div>
      ) : (
        <div className="flow">
          <label htmlFor="flow-slider">Flussimetro</label>
          <div className="flow-row">
            <input id="flow-slider" type="range" min={1} max={15} step={1} value={flow} onChange={(e) => setFlow(Number(e.target.value))} />
            <span className="num flow-val">{flow}</span>
            <span>L/min</span>
          </div>
          <p className={`flow-note${outOfRange ? ' warn' : ''}`}>
            {outOfRange ? `Flusso fuori dall’intervallo del presidio (${info.range[0]}–${info.range[1]} L/min).` : info.fio2}
          </p>
        </div>
      )}
      {sim.pulseOx && !sim.inArrest() && (
        <p className="muted">
          SpO₂ attuale: <strong className="num">{Math.round(sim.p.v.spo2)}%</strong>.
        </p>
      )}
    </Modal>
  );
}

// ───────────────────────── tourniquet
const LIMBS: { id: BodyRegion; label: string; len: number; joints: { at: number; name: string }[] }[] = [
  { id: 'braccio_dx', label: 'Braccio destro', len: 75, joints: [{ at: 0.02, name: 'spalla' }, { at: 0.47, name: 'gomito' }, { at: 0.9, name: 'polso' }] },
  { id: 'braccio_sx', label: 'Braccio sinistro', len: 75, joints: [{ at: 0.02, name: 'spalla' }, { at: 0.47, name: 'gomito' }, { at: 0.9, name: 'polso' }] },
  { id: 'gamba_dx', label: 'Gamba destra', len: 95, joints: [{ at: 0.02, name: 'anca' }, { at: 0.48, name: 'ginocchio' }, { at: 0.95, name: 'caviglia' }] },
  { id: 'gamba_sx', label: 'Gamba sinistra', len: 95, joints: [{ at: 0.02, name: 'anca' }, { at: 0.48, name: 'ginocchio' }, { at: 0.95, name: 'caviglia' }] },
];

export function TourniquetPicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  const [limb, setLimb] = useState<BodyRegion>('braccio_dx');
  const [pos, setPos] = useState<number | null>(null);
  const L = LIMBS.find((l) => l.id === limb)!;
  const wound = sim.p.bleeding && sim.p.bleeding.region === limb ? sim.p.bleeding.pos : null;
  const joint = pos !== null && L.joints.some((j) => Math.abs(j.at - pos) < 0.05);
  const x0 = 40;
  const x1 = 560;
  const toX = (p: number) => x0 + (x1 - x0) * p;
  return (
    <Modal
      title="Tourniquet"
      kicker="C · Emorragia"
      onClose={onCancel}
      wide
      footer={
        <button className="btn btn-arancio" disabled={pos === null} onClick={() => onConfirm({ region: limb, pos, joint })}>
          Stringi il tourniquet qui
        </button>
      }
    >
      <div className="seg seg-wrap" role="radiogroup" aria-label="Arto">
        {LIMBS.map((l) => (
          <button key={l.id} className={l.id === limb ? 'on' : ''} onClick={() => { setLimb(l.id); setPos(null); }}>
            {l.label}
          </button>
        ))}
      </div>
      <p className="muted">Tocca l’arto nel punto in cui vuoi applicare il laccio. A sinistra la radice dell’arto, a destra l’estremità.</p>
      <svg
        className="tq-svg"
        viewBox="0 0 600 150"
        onClick={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * 600;
          setPos(Math.max(0, Math.min(1, (x - x0) / (x1 - x0))));
        }}
        role="img"
        aria-label={`Schema dell’arto: ${L.label}`}
      >
        <path d={`M${x0} 75 L${x1} 75`} stroke={sim.p.look.skinTone} strokeWidth="46" strokeLinecap="round" />
        {L.joints.map((j) => (
          <g key={j.name}>
            <circle cx={toX(j.at)} cy="75" r="16" fill="none" stroke="#ffd84d" strokeWidth="2" strokeDasharray="4 4" />
            <text x={toX(j.at)} y="128" textAnchor="middle" fontSize="15" fill="#a7b7ca">
              {j.name}
            </text>
          </g>
        ))}
        {wound !== null && (
          <g>
            <ellipse cx={toX(wound)} cy="75" rx="18" ry="11" fill="#8d0f1b" />
            <text x={toX(wound)} y="30" textAnchor="middle" fontSize="15" fill="#ff8a8a">
              ferita
            </text>
          </g>
        )}
        {pos !== null && (
          <g>
            <rect x={toX(pos) - 7} y="44" width="14" height="62" rx="3" fill="#15171a" stroke="#ff7a1a" strokeWidth="2" />
          </g>
        )}
      </svg>
      {pos !== null && (
        <p className={`flow-note${joint ? ' warn' : ''}`}>
          {joint
            ? 'Sei sopra un’articolazione.'
            : wound !== null
              ? pos < wound
                ? `Circa ${Math.round((wound - pos) * L.len)} cm a monte della ferita.`
                : 'Sei a valle della ferita (dalla parte dell’estremità).'
              : 'Su questo arto non vedi la ferita.'}
        </p>
      )}
    </Modal>
  );
}

// ───────────────────────── raffreddamento
export function CoolingPicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  const kit = sim.has('kit_raffreddamento');
  const vasca = !!sim.flags.vascaDisponibile;
  const opts = [
    { id: 'immersione', name: 'Immersione in acqua fredda', desc: 'Dal collo in giù, acqua a 1–26 °C. È il metodo più rapido.', ok: vasca, why: 'Serve una vasca o un contenitore con acqua fredda.' },
    { id: 'taco', name: 'Telo con acqua e ghiaccio (TACO)', desc: 'Il paziente avvolto in un telo impermeabile con acqua e ghiaccio, che si fa oscillare.', ok: kit, why: 'Serve il kit raffreddamento.' },
    { id: 'impacchi', name: 'Ghiaccio e teli bagnati', desc: 'Ghiaccio su collo, ascelle e inguine; teli bagnati sul corpo.', ok: kit, why: 'Serve il kit raffreddamento.' },
    { id: 'ventilazione', name: 'Nebulizzazione e ventilazione', desc: 'Acqua nebulizzata sulla cute e ventilazione: utile ma più lento.', ok: true, why: '' },
  ];
  return (
    <Modal title="Raffreddamento attivo" kicker="E · Esposizione" onClose={onCancel}>
      <div className="opt-list">
        {opts.map((o) => (
          <button key={o.id} className="opt" disabled={!o.ok} onClick={() => onConfirm({ method: o.id })}>
            <span className="opt-name">{o.name}</span>
            <span className="opt-desc">{o.ok ? o.desc : o.why}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ───────────────────────── posizione
const POSITIONS: { id: Position; name: string; desc: string }[] = [
  { id: 'supino', name: 'Supino', desc: 'Sulla schiena, su un piano rigido.' },
  { id: 'semiseduto', name: 'Semiseduto', desc: 'Schienale a 30–45°.' },
  { id: 'seduto', name: 'Seduto', desc: 'Schiena eretta, gambe giù.' },
  { id: 'laterale', name: 'Laterale di sicurezza', desc: 'Sul fianco, testa estesa, gamba superiore flessa.' },
];
export function PositionPicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  return (
    <Modal title="Posizione del paziente" kicker="Trattamenti" onClose={onCancel}>
      <div className="opt-grid">
        {POSITIONS.map((p) => (
          <button key={p.id} className={`opt${sim.p.position === p.id ? ' on' : ''}`} onClick={() => onConfirm({ pos: p.id })}>
            <span className="opt-name">{p.name}</span>
            <span className="opt-desc">{p.desc}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ───────────────────────── piastre DAE
export function PadsPicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  const [ped, setPed] = useState(false);
  const small = sim.p.weightKg < 25;
  const opts = [
    { id: 'anterolaterale', name: 'Antero-laterale', desc: 'Una sotto la clavicola destra accanto allo sterno, l’altra sul fianco sinistro sotto l’ascella.' },
    { id: 'anteroposteriore', name: 'Antero-posteriore', desc: 'Una al centro del torace subito a sinistra dello sterno, l’altra sulla schiena tra le scapole.' },
    { id: 'errata', name: 'Entrambe sul petto, vicine', desc: 'Le due piastre affiancate sulla parte alta del torace.' },
  ];
  return (
    <Modal
      title="Piastre del DAE"
      kicker="C · Defibrillazione"
      onClose={onCancel}
      footer={
        small ? (
          <label className="check">
            <input type="checkbox" id="ped" checked={ped} onChange={(e) => setPed(e.target.checked)} /> Attiva la modalità pediatrica (chiave o piastre pediatriche)
          </label>
        ) : undefined
      }
    >
      <p className="muted">Torace scoperto e asciutto. Scegli dove applicare le piastre.</p>
      <div className="opt-list">
        {opts.map((o) => (
          <button key={o.id} className="opt" onClick={() => onConfirm({ pos: o.id, pediatric: ped })}>
            <span className="opt-name">{o.name}</span>
            <span className="opt-desc">{o.desc}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ───────────────────────── comunicazione alla SORES
export function CentralePicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  const meas = useMemo(() => Array.from(sim.measurements.values()), [sim]);
  const [items, setItems] = useState<string[]>([]);
  const toggle = (k: string) => setItems((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));
  return (
    <Modal
      title="Riferisci alla SORES"
      kicker="Radio · SORES FVG"
      onClose={onCancel}
      wide
      footer={
        <button className="btn btn-arancio" onClick={() => onConfirm({ items })}>
          Trasmetti
        </button>
      }
    >
      <p className="muted">Riferisci la valutazione ABCDE e i parametri rilevati. Il codice di rientro e la destinazione li assegna la SORES in base a quello che trasmetti.</p>
      <h3 className="mini-h">Dati da trasmettere</h3>
      {meas.length === 0 ? (
        <p className="muted">Non hai ancora rilevato parametri: la SORES riceverà solo la chiamata di aggiornamento.</p>
      ) : (
        <div className="meas-list">
          {meas.map((m) => (
            <label key={m.key} className={`meas${items.includes(m.key) ? ' on' : ''}`}>
              <input type="checkbox" id={`m-${m.key}`} checked={items.includes(m.key)} onChange={() => toggle(m.key)} />
              <span className="meas-l">{m.label}</span>
              <span className="meas-v num">{m.value}</span>
            </label>
          ))}
          <button className="btn btn-small" onClick={() => setItems(meas.map((m) => m.key))}>
            Seleziona tutti
          </button>
        </div>
      )}
    </Modal>
  );
}

// ───────────────────────── trasporto
export function TransportPicker({ sim, onConfirm, onCancel }: { sim: Sim; onConfirm: Confirm; onCancel: () => void }) {
  const [mode, setMode] = useState('barella');
  const [pos, setPos] = useState<Position>(sim.p.position === 'in_piedi' ? 'seduto' : sim.p.position);
  const modes = [
    { id: 'barella', name: 'Barella', desc: 'Paziente sdraiato o semiseduto.', ok: true },
    { id: 'sedia', name: 'Sedia portantina', desc: 'Per scale e spazi stretti; il paziente resta seduto.', ok: sim.has('sedia') },
    { id: 'piedi', name: 'Cammina fino all’ambulanza', desc: 'Accompagnato, a piedi.', ok: true },
  ];
  return (
    <Modal
      title="Carico e trasporto"
      kicker="SORES"
      onClose={onCancel}
      footer={
        <button className="btn btn-arancio" onClick={() => onConfirm({ mode, pos })}>
          Partenza
        </button>
      }
    >
      <h3 className="mini-h">Come lo porti all’ambulanza</h3>
      <div className="opt-list">
        {modes.map((m) => (
          <button key={m.id} className={`opt${mode === m.id ? ' on' : ''}`} disabled={!m.ok} onClick={() => setMode(m.id)}>
            <span className="opt-name">{m.name}</span>
            <span className="opt-desc">{m.ok ? m.desc : 'Non l’hai portata con te.'}</span>
          </button>
        ))}
      </div>
      <h3 className="mini-h">Posizione durante il trasporto</h3>
      <div className="seg seg-wrap">
        {POSITIONS.map((p) => (
          <button key={p.id} className={pos === p.id ? 'on' : ''} onClick={() => setPos(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      {!sim.report && <p className="flow-note warn">Non hai ancora riferito la valutazione alla SORES.</p>}
    </Modal>
  );
}

// ───────────────────────── scelta del protocollo
export function ProtocolPicker({ current, onConfirm, onCancel }: { current: ProtocolId | null; onConfirm: (id: ProtocolId) => void; onCancel: () => void }) {
  const [sel, setSel] = useState<ProtocolId | null>(current);
  const fams = Array.from(new Set(PROTOCOL_ORDER.map((id) => PROTOCOLS[id].family)));
  return (
    <Modal
      title="Quale protocollo applichi?"
      kicker="Decisione"
      onClose={onCancel}
      wide
      footer={
        <button className="btn btn-arancio" disabled={!sel} onClick={() => sel && onConfirm(sel)}>
          Applica questo protocollo
        </button>
      }
    >
      <p className="muted">Scegli in base ai reperti raccolti. Puoi cambiare idea, ma conta la prima scelta.</p>
      {fams.map((f) => (
        <div key={f} className="proto-fam">
          <h3 className="mini-h">{f}</h3>
          <div className="proto-grid">
            {PROTOCOL_ORDER.filter((id) => PROTOCOLS[id].family === f).map((id) => (
              <button key={id} className={`proto${sel === id ? ' on' : ''}`} onClick={() => setSel(id)} aria-pressed={sel === id}>
                <span className="proto-name">{PROTOCOLS[id].name}</span>
                <span className="proto-sum">{PROTOCOLS[id].summary}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
