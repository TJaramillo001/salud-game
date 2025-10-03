// data/index.ts
// Explicit JSON module assertions keep Turbopack happy.
import pre from './packs/pre.json' assert { type: 'json' };
// If you add more packs later, import them the same way:
// import nightOut from './packs/night_out.json' assert { type: 'json' };

export { pre /*, nightOut */ };
