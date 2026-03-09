// lib/i18n/translations/it.ts — Italian
import type { Translations } from './es_la';

const it: Translations = {
    language: {
        screenTitle: 'Scegli la tua lingua',
        screenSubtitle: 'In che lingua volete giocare?',
    },
    nav: {
        features: 'Caratteristiche',
        faq: 'Domande frequenti',
        home: 'Vai alla home',
    },
    footer: {
        copyright: '© {year} Salud. Fatto per notti divertenti con gli amici.',
    },
    home: {
        hero: {
            subtitle: 'Un gioco sociale veloce: inquadra, aggiungi giocatori, scegli una modalità e scorri le carte. Perfetto per il pre-party, la serata, le coppie e altro ancora.',
            ctaStart: 'Inizia ora',
            ctaFeatures: 'Vedi caratteristiche',
            ctaCreate: 'Crea partita',
        },
        features: {
            players: { title: 'Aggiungi giocatori', desc: 'Nomi veloci, senza registrazione. Supporta 1–12 giocatori.' },
            modes: { title: 'Modalità di gioco', desc: 'Pre-party, Serata, Coppia, After e altro.' },
            swipe: { title: 'Carte con swipe', desc: 'Gesti fluidi per mantenere il ritmo della serata.' },
        },
        faq: {
            title: 'Domande frequenti',
            account: { q: 'Serve un account?', a: 'No: giochi direttamente nel browser.' },
            offline: { q: 'Funziona offline?', a: 'La versione iniziale richiede connessione. PWA arriverà presto.' },
        },
    },
    setup: {
        players: {
            title: 'Aggiungi giocatori',
            placeholder: 'Nome del giocatore',
            add: 'Aggiungi',
            remove: 'Rimuovi',
            clearAll: 'Cancella tutti',
            continue: 'Continua',
        },
        mode: {
            title: 'Scegli la modalità di gioco',
            loading: 'Caricamento modalità…',
            cards: 'Carte: {count}',
            back: 'Indietro',
        },
    },
    play: {
        aria: { advance: 'Avanza' },
        btn: {
            end: 'Termina',
            next: 'Prossima',
            reshuffle: 'Rimescola',
            changeMode: 'Cambia modalità',
        },
        hint: { tap: 'Suggerimento: tocca la carta per andare avanti' },
        offline: { banner: 'Offline: uso dei contenuti in cache quando possibile.' },
        empty: {
            title: 'Impossibile creare il mazzo',
            description: 'La modalità {mode} ha generato 0 carte con i giocatori/condizioni attuali.',
            tipPlayers: 'Prova con più giocatori o cambia modalità.',
            tipReshuffle: 'Oppure rimescola con un nuovo seme.',
            devTip: 'Suggerimento: se vedi questo spesso, controlla i vincoli del mazzo.',
        },
    },
    summary: {
        title: 'Fine della partita',
        thanks: 'Grazie per aver giocato a Salud 🍹 — Modalità: {mode}!',
        btn: {
            playAgain: 'Gioca ancora',
            changeSetup: 'Cambia modalità',
            home: 'Home',
            rate: 'Valuta Salud',
        },
        rateHint: 'Il tuo feedback ci aiuta a migliorare il gioco 🙏',
        mode: {
            unknown: 'sconosciuto',
            pre: 'Pre-party',
            night_out: 'Serata fuori',
        },
    },
    card: {
        kind: {
            rule_on: 'Nuova regola',
            rule_off: 'Regola terminata',
            group: 'Round',
            wildcard: 'Jolly',
            action: 'Azione',
            question: 'Domanda',
            versus: 'Duello',
            default: 'Carta',
        },
        alt: 'Alt:',
    },
    render: {
        playerA: 'Giocatore A',
        playerB: 'Giocatore B',
        playerC: 'Giocatore C',
        starter: 'Chiunque',
    },
    modes: {
        pre: { label: 'Pre-party', description: 'Scaldiamo i motori per una notte indimenticabile.' },
        night_out: { label: 'Serata fuori', description: 'Atmosfera alta, domande interessanti. Stanotte si ride.' },
        couple: { label: 'Coppia', description: 'Sfide e domande intime per coppie.' },
        afterparty: { label: 'After-party', description: 'La festa non finisce. Carte per chi resiste.' },
        bar: { label: 'Bar', description: 'Carte speciali per serate al bar.' },
    },
    bar: {
        notFound: 'Bar non trovato',
        notFoundDesc: 'Questo codice QR non è valido o il bar non è disponibile.',
        goHome: 'Vai alla home',
        badge: 'Speciale del bar',
        landing: {
            welcome: 'Benvenuto da {barName}!',
            subtitle: 'Gioca a Salud con tutte le modalità sbloccate.',
            startPlaying: 'Giochiamo!',
            continueSession: 'Continua a giocare',
            newSession: 'Nuova sessione',
        },
        session: {
            activeBanner: 'Stai giocando da {barName}',
            allUnlocked: 'Tutte le modalità sbloccate',
            expiresIn: 'Sessione attiva — scade tra {time}',
        },
        expired: {
            title: 'Sessione del bar terminata',
            description: 'Il tuo accesso premium da {barName} è scaduto.',
            subscribe: 'Accesso illimitato',
            continueFree: 'Continua con la modalità gratuita',
        },
    },
    mode: {
        locked: 'Premium',
        lockedDesc: 'Scansiona un QR del bar o abbonati per sbloccare.',
        comingSoon: 'Prossimamente',
        password: {
            title: 'Inserisci la password',
            placeholder: 'Password',
            submit: 'Sblocca',
            error: 'Password errata',
        },
    },
};

export default it;