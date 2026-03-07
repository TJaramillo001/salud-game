// lib/i18n/translations/en.ts — English (International / Erasmus)
import type { Translations } from './es_la';

const en: Translations = {
    language: {
        screenTitle: 'Choose your language',
        screenSubtitle: 'What language do you want to play in?',
    },
    nav: {
        features: 'Features',
        faq: 'FAQ',
        home: 'Go to homepage',
    },
    footer: {
        copyright: '© {year} Salud. Made for fun nights with friends.',
    },
    home: {
        hero: {
            subtitle: 'A fast social card game: scan, add players, pick a mode, and swipe through cards. Perfect for pre-drinks, a night out, couples, after-parties, and more.',
            ctaStart: 'Start now',
            ctaFeatures: 'See features',
            ctaCreate: 'Create game',
        },
        features: {
            players: { title: 'Add players', desc: 'Quick names, no sign-up needed. Supports 1–12 players.' },
            modes: { title: 'Game modes', desc: 'Pre-drinks, Night Out, Couples, After-party, and more.' },
            swipe: { title: 'Cards by swipe', desc: 'Smooth gestures to keep the night going.' },
        },
        faq: {
            title: 'FAQ',
            account: { q: 'Do I need an account?', a: 'Nope — just open the browser and play.' },
            offline: { q: 'Does it work offline?', a: 'The current version needs a connection. PWA is coming soon.' },
        },
    },
    setup: {
        players: {
            title: 'Add players',
            placeholder: 'Player name',
            add: 'Add',
            remove: 'Remove',
            clearAll: 'Clear all',
            continue: 'Continue',
        },
        mode: {
            title: 'Choose game mode',
            loading: 'Loading modes…',
            cards: 'Cards: {count}',
            back: 'Back',
        },
    },
    play: {
        aria: { advance: 'Advance' },
        btn: {
            end: 'End game',
            next: 'Next',
            reshuffle: 'Reshuffle deck',
            changeMode: 'Change mode',
        },
        hint: { tap: 'Tip: tap the card to advance' },
        offline: { banner: 'Offline mode: using cached content where possible.' },
        empty: {
            title: 'Could not build the deck',
            description: 'Mode {mode} generated 0 cards with the current players/conditions.',
            tipPlayers: 'Try adding more players or switching modes.',
            tipReshuffle: 'Or reshuffle with a new seed.',
            devTip: 'Tip: if you see this often, check the pack constraints.',
        },
    },
    summary: {
        title: 'Game over',
        thanks: 'Thanks for playing Salud 🍹 — Mode: {mode}!',
        btn: {
            playAgain: 'Play again',
            changeSetup: 'Change setup',
            home: 'Home',
            rate: 'Rate Salud',
        },
        rateHint: 'Your feedback helps us improve the game 🙏',
        mode: {
            unknown: 'unknown',
            pre: 'Pre-drinks',
            night_out: 'Night Out',
        },
    },
    card: {
        kind: {
            rule_on: 'New rule',
            rule_off: 'Rule ended',
            group: 'Round',
            wildcard: 'Wildcard',
            action: 'Action',
            question: 'Question',
            versus: 'Duel',
            default: 'Card',
        },
        alt: 'Alt:',
    },
    render: {
        playerA: 'Player A',
        playerB: 'Player B',
        playerC: 'Player C',
        starter: 'Anyone',
    },
    modes: {
        pre: { label: 'Pre-drinks', description: 'Warming up the engines for an unforgettable night.' },
        night_out: { label: 'Night Out', description: 'High vibes, interesting questions. Tonight we laugh.' },
        couple: { label: 'Couples', description: 'Intimate challenges and questions for couples.' },
        afterparty: { label: 'After-party', description: 'The party never ends. Cards for those who last.' },
        bar: { label: 'Bar', description: 'Special cards for bar nights.' },
    },
    bar: {
        notFound: 'Bar not found',
        notFoundDesc: 'This QR code is not valid or the bar is not available.',
        goHome: 'Go to homepage',
        badge: 'Bar special',
        landing: {
            welcome: 'Welcome to {barName}!',
            subtitle: 'Play Salud with all game modes unlocked.',
            startPlaying: "Let's play!",
            continueSession: 'Keep playing',
            newSession: 'New session',
        },
        session: {
            activeBanner: 'Playing at {barName}',
            allUnlocked: 'All modes unlocked',
            expiresIn: 'Active session — expires in {time}',
        },
        expired: {
            title: 'Bar session ended',
            description: 'Your premium access from {barName} has expired.',
            subscribe: 'Get unlimited access',
            continueFree: 'Continue with free mode',
        },
    },
    mode: {
        locked: 'Premium',
        lockedDesc: 'Scan a bar QR code or subscribe to unlock.',
        comingSoon: 'Coming soon',
    },
};

export default en;