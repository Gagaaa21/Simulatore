import type { Settings } from '../store';
import { Modal } from './Modal';
import { sfx } from '../audio';

export function SettingsModal({ settings, setSettings, onClose }: { settings: Settings; setSettings: (p: Partial<Settings>) => void; onClose: () => void }) {
  return (
    <Modal title="Impostazioni" kicker="Sirena 118" onClose={onClose} footer={<button className="btn btn-arancio" onClick={onClose}>Fatto</button>}>
      <div className="set-grid">
        <div className="set-row">
          <div>
            <p className="set-name">Modalità</p>
            <p className="set-desc">In addestramento vedi errori e suggerimenti subito; in esame solo nel debriefing.</p>
          </div>
          <div className="seg">
            <button className={settings.mode === 'addestramento' ? 'on' : ''} onClick={() => setSettings({ mode: 'addestramento' })}>
              Addestramento
            </button>
            <button className={settings.mode === 'esame' ? 'on' : ''} onClick={() => setSettings({ mode: 'esame' })}>
              Esame
            </button>
          </div>
        </div>
        <div className="set-row">
          <div>
            <p className="set-name">Volume</p>
            <p className="set-desc">Bip del saturimetro, allarmi, radio e DAE.</p>
          </div>
          <div className="set-vol">
            <label className="check">
              <input type="checkbox" id="set-sound" checked={settings.sound} onChange={(e) => setSettings({ sound: e.target.checked })} /> Audio
            </label>
            <input
              id="set-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              disabled={!settings.sound}
              onChange={(e) => setSettings({ volume: Number(e.target.value) })}
              onPointerUp={() => sfx('bip')}
              aria-label="Volume"
            />
          </div>
        </div>
        <div className="set-row">
          <div>
            <p className="set-name">Sottofondo ambientale</p>
            <p className="set-desc">Folla, traffico, televisione: il rumore del luogo della missione.</p>
          </div>
          <label className="check">
            <input type="checkbox" id="set-amb" checked={settings.ambience} onChange={(e) => setSettings({ ambience: e.target.checked })} /> Attivo
          </label>
        </div>
        <div className="set-row">
          <div>
            <p className="set-name">Voce del DAE</p>
            <p className="set-desc">Le istruzioni del defibrillatore lette ad alta voce (se il dispositivo ha una voce italiana).</p>
          </div>
          <label className="check">
            <input type="checkbox" id="set-voice" checked={settings.voice} onChange={(e) => setSettings({ voice: e.target.checked })} /> Attiva
          </label>
        </div>
        <div className="set-row">
          <div>
            <p className="set-name">Tempo reale</p>
            <p className="set-desc">Se disattivato il tempo avanza solo con le azioni, tranne durante la RCP e le fasi del DAE.</p>
          </div>
          <label className="check">
            <input type="checkbox" id="set-rt" checked={settings.realtime} onChange={(e) => setSettings({ realtime: e.target.checked })} /> Attivo
          </label>
        </div>
        <div className="set-row">
          <div>
            <p className="set-name">Dimensione del testo</p>
          </div>
          <div className="seg">
            <button className={settings.textSize === 'normale' ? 'on' : ''} onClick={() => setSettings({ textSize: 'normale' })}>
              Normale
            </button>
            <button className={settings.textSize === 'grande' ? 'on' : ''} onClick={() => setSettings({ textSize: 'grande' })}>
              Grande
            </button>
          </div>
        </div>
        <div className="set-row">
          <div>
            <p className="set-name">Animazioni</p>
            <p className="set-desc">Riduce lampeggianti, respirazione animata e transizioni.</p>
          </div>
          <div className="seg">
            <button className={settings.motion === 'piena' ? 'on' : ''} onClick={() => setSettings({ motion: 'piena' })}>
              Complete
            </button>
            <button className={settings.motion === 'ridotta' ? 'on' : ''} onClick={() => setSettings({ motion: 'ridotta' })}>
              Ridotte
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
