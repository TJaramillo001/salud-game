import type { Pack, Card } from './types';

// TEMP DEMO CONTENT: replace with /data/packs/*.json later
const DEMO: Pack[] = [
    {
        id: 'pre',
        name: 'Pre',
        version: 1,
        cards: [
            { id: 'p1', type: 'question', text: 'Player (current): If you liked someone here, take 2 shots; else give 2.', target: { kind: 'single', strategy: 'current' } } as Card,
            { id: 'p2', type: 'scenario', text: 'Countries in Europe. First to fail takes 3 shots. Starter: current.', target: { kind: 'all' } } as Card,
            { id: 'p3', type: 'rule', text: 'New Rule: Drink with left hand only; right-hand drinkers take 2.', ruleId: 'left-hand-only' } as Card,
        ],
    },
    {
        id: 'night_out',
        name: 'Night Out',
        version: 1,
        cards: [
            { id: 'n1', type: 'question', text: 'Random player: tell a spicy story or take 2.', target: { kind: 'single', strategy: 'random' } } as Card,
            { id: 'n2', type: 'scenario', text: 'Vote: Beer or Wine. Minority drinks 1.', target: { kind: 'all' } } as Card,
        ],
    },
];

export async function listPacks(): Promise<Pack[]> {
    // Later: load JSON files or fetch from API
    return DEMO;
}

export async function getPackById(id: Pack['id']): Promise<Pack | undefined> {
    const packs = await listPacks();
    return packs.find(p => p.id === id);
}
