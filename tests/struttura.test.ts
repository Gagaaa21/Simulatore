import { describe, expect, it } from 'vitest';
import { ACTION_LIST, SECTION_ORDER } from '../src/engine/actions';
import { ALGORITMI, isAsk, type AlgoNode } from '../src/data/algoritmi';
import { PROTOCOL_ORDER } from '../src/data/protocols';

describe('pannello delle azioni', () => {
  it('ogni trattamento ha una sezione valida', () => {
    for (const a of ACTION_LIST.filter((x) => x.group === 'trattamenti' || x.group === 'valutazione')) {
      expect(a.section && SECTION_ORDER.includes(a.section), a.id).toBe(true);
    }
  });
  it('parametri vitali tutti nella scheda Parametri', () => {
    for (const id of ['saturimetro', 'pressione', 'conta_fr', 'polso_radiale', 'trc', 'temperatura', 'pupille']) {
      expect(ACTION_LIST.find((a) => a.id === id)?.group, id).toBe('parametri');
    }
  });
});

describe('algoritmi dei protocolli', () => {
  const count = (ns: AlgoNode[]): number => ns.reduce((n, x) => n + 1 + (isAsk(x) ? count(x.si) + count(x.no) : 0), 0);
  for (const id of PROTOCOL_ORDER) {
    it(id, () => {
      const a = ALGORITMI[id];
      expect(a).toBeDefined();
      expect(count(a.nodes)).toBeGreaterThanOrEqual(4);
      expect(a.nodes.some(isAsk), `${id}: almeno una domanda`).toBe(true);
      expect(a.tu.length).toBeGreaterThan(0);
      expect(a.equipe.length).toBeGreaterThan(0);
    });
  }
});
