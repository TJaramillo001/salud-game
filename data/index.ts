// data/index.ts
// Explicit JSON module assertions keep Turbopack happy.
import preEsLa from './packs/pre_es_la.json' assert { type: 'json' };
import nightOutEsLa from './packs/night_out_es_la.json' assert { type: 'json' };

export { preEsLa, nightOutEsLa };