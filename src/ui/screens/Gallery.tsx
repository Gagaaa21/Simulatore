import { SCENARIOS } from '../../data/scenarios';
import { Sim } from '../../engine/engine';
import { Floor, W, H } from '../art/Floors';
import { PatientFigure } from '../art/Patient';
import { OverPatient, UnderPatient, KitIcon } from '../art/Overlays';

/** Pagina di controllo visivo (non collegata dal menu): tutti i pazienti con alcuni presidi applicati. */
function variant(sim: Sim, i: number) {
  sim.phase = 'paziente';
  const v = i % 6;
  if (v === 0) sim.pulseOx = true;
  if (v === 1) sim.o2 = { device: 'reservoir', flow: 15, since: 0 };
  if (v === 2) {
    sim.immob.add('mils');
    sim.immob.add('collare');
  }
  if (v === 3) {
    sim.aed.pads = sim.p.weightKg < 25 ? 'anteroposteriore' : 'anterolaterale';
    sim.cpr.active = sim.inArrest();
  }
  if (v === 4) sim.covered = true;
  if (v === 5) {
    sim.bvm = true;
    sim.pulseOx = true;
  }
  if (sim.scenario.id === 'emorragia-cantiere') {
    sim.tourniquet = { at: 30, region: 'gamba_dx', pos: 0.24, ok: true };
    sim.p.bloodLossMl = 1400;
  }
  if (sim.scenario.id === 'alcol' || sim.scenario.id === 'convulsioni') {
    sim.p.position = 'laterale';
    sim.o2 = { device: 'maschera', flow: 6, since: 0 };
    sim.pulseOx = true;
  }
  if (sim.scenario.id === 'trauma-moto') {
    sim.immob.add('materasso');
    sim.immob.add('pelvica');
    sim.p.look.helmet = false;
  }
}

export function Gallery() {
  return (
    <div className="page">
      <h1>Galleria pazienti</h1>
      <div className="gallery">
        {SCENARIOS.map((sc, i) => {
          const sim = new Sim(sc, 'addestramento', sc.loadout ? [...sc.loadout.essential] : []);
          sim.start();
          variant(sim, i);
          return (
            <figure key={sc.id}>
              <svg viewBox={`0 0 ${W} ${H}`} className="scene-svg">
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
                <Floor setting={sc.setting} timeOfDay={sc.timeOfDay} />
                {Array.from(sim.brought).map((k) => (
                  <KitIcon key={k} id={k} />
                ))}
                <PatientFigure p={sim.p} arrest={sim.inArrest()} cprActive={sim.cpr.active} breathingRate={0} hoverRegion={null} under={<UnderPatient sim={sim} />} over={<OverPatient sim={sim} now={0} />} />
              </svg>
              <figcaption>{sc.title}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
