import { useState } from 'react';
import type { Sim } from '../../engine/engine';
import type { BodyRegion } from '../../engine/types';
import type { EquipmentId } from '../../data/equipment';
import { EQUIPMENT } from '../../data/equipment';
import { ACTION_LIST } from '../../engine/actions';
import { Floor, W, H } from '../art/Floors';
import { PatientFigure, REGION_LABEL } from '../art/Patient';
import { KitIcon, OverPatient, UnderPatient } from '../art/Overlays';
import { ActionButton } from './ActionPanel';

const KIT_ACTIONS: Partial<Record<EquipmentId, string[]>> = {
  zaino: ['saturimetro', 'pressione', 'glicemia', 'temperatura', 'pupille', 'telo', 'guedel'],
  dae: ['dae_accendi', 'dae_piastre', 'allontanatevi'],
  ossigeno: ['ossigeno'],
  pallone: ['pallone', 'ventilazioni_iniziali'],
  aspiratore: ['aspira'],
  kit_emorragie: ['tourniquet', 'medicazione'],
  collari: ['collare'],
  cucchiaio: ['cucchiaio'],
  materasso: ['materasso'],
  tavola: ['tavola'],
  steccobende: ['steccobende'],
  cintura_pelvica: ['cintura_pelvica'],
  kit_raffreddamento: ['raffredda'],
};

type Menu = { title: string; ids: string[]; x: number; y: number } | null;

export function Scene({ sim, onAction }: { sim: Sim; onAction: (id: string) => void }) {
  const [hover, setHover] = useState<BodyRegion | null>(null);
  const [menu, setMenu] = useState<Menu>(null);
  const p = sim.p;
  const inScene = sim.phase === 'scena';
  const kits = Array.from(sim.brought);

  const openRegion = (r: BodyRegion, x: number, y: number) => {
    if (inScene) return;
    const ids = ACTION_LIST.filter((a) => a.regions?.includes(r) && (a.visible ? a.visible(sim) : true)).map((a) => a.id);
    setMenu({ title: REGION_LABEL[r], ids, x, y });
  };
  const openKit = (id: EquipmentId, e: React.MouseEvent) => {
    if (inScene) return;
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement;
    const r = svg?.getBoundingClientRect();
    const ids = (KIT_ACTIONS[id] ?? []).filter((aid) => {
      const a = ACTION_LIST.find((x) => x.id === aid);
      return a && (a.visible ? a.visible(sim) : true);
    });
    if (!ids.length) return;
    setMenu({ title: EQUIPMENT[id].name, ids, x: e.clientX - (r?.left ?? 0), y: e.clientY - (r?.top ?? 0) });
  };

  const rr = sim.inArrest() ? 0 : p.breathing === 'assente' ? 0 : p.v.rr;
  const busy = sim.busy;
  const prog = busy ? Math.min(1, (sim.t - busy.start) / Math.max(1, busy.end - busy.start)) : 0;

  return (
    <div className={`scene${inScene ? ' scene-far' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="scene-svg" role="img" aria-label="Vista dall’alto della scena e del paziente">
        <defs>
          <filter id="sfoca" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7d774" />
            <stop offset="0.35" stopColor="#c9a23c" />
            <stop offset="0.6" stopColor="#f3e19a" />
            <stop offset="1" stopColor="#b98a2a" />
          </linearGradient>
        </defs>
        <Floor setting={sim.scenario.setting} timeOfDay={sim.scenario.timeOfDay} />
        {!inScene &&
          kits.map((k) => (
            <g key={k} onClick={(e) => openKit(k, e)}>
              <KitIcon id={k} onClick={() => undefined} />
            </g>
          ))}
        <PatientFigure
          p={p}
          arrest={sim.inArrest()}
          cprActive={sim.cpr.active}
          breathingRate={rr}
          hoverRegion={hover}
          onRegion={openRegion}
          onHover={setHover}
          under={<UnderPatient sim={sim} />}
          over={<OverPatient sim={sim} now={sim.t} />}
        />
      </svg>

      {hover && !inScene && !menu && <div className="region-tip">{REGION_LABEL[hover]}</div>}

      {inScene && (
        <div className="scene-card">
          <p className="scene-kicker">Arrivo sul posto</p>
          <p>{sim.scenario.scene.intro}</p>
          {sim.flags.scenaValutata ? (
            <ul className="hazards">
              {sim.scenario.scene.hazards.length === 0 && <li className="safe">Nessun pericolo evidente.</li>}
              {sim.scenario.scene.hazards.map((h) => (
                <li key={h.id} className={sim.flags['fix_' + h.fixAction] ? 'fixed' : ''}>
                  {sim.flags['fix_' + h.fixAction] ? '✓ ' : '⚠ '}
                  {h.label}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Prima di toccare il paziente: è sicuro avvicinarsi?</p>
          )}
        </div>
      )}

      {menu && (
        <div className="region-menu" style={{ left: Math.min(menu.x, 9999), top: menu.y }} role="menu" aria-label={menu.title}>
          <div className="region-menu-head">
            <strong>{menu.title}</strong>
            <button className="icon-btn" onClick={() => setMenu(null)} aria-label="Chiudi">
              ✕
            </button>
          </div>
          {menu.ids.length === 0 && <p className="muted">Nessuna azione specifica.</p>}
          {menu.ids.map((id) => {
            const a = ACTION_LIST.find((x) => x.id === id)!;
            return (
              <ActionButton
                key={id}
                a={a}
                sim={sim}
                onAction={(aid) => {
                  setMenu(null);
                  onAction(aid);
                }}
              />
            );
          })}
        </div>
      )}

      {busy && (
        <div className="busy" role="status">
          <span className="busy-ff" aria-hidden="true">
            ▸▸
          </span>
          <span className="busy-label">{busy.label}</span>
          <span className="busy-bar">
            <span style={{ width: `${prog * 100}%` }} />
          </span>
        </div>
      )}
    </div>
  );
}
