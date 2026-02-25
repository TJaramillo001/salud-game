// lib/i18n/translations/es_la.ts — Latin American Spanish (base/fallback)

const es_la = {
    language: {
        screenTitle: 'Elige tu idioma',
        screenSubtitle: '¿En qué idioma quieren jugar?',
    },
    nav: {
        features: 'Características',
        faq: 'Preguntas frecuentes',
        home: 'Ir al inicio',
    },
    footer: {
        copyright: '© {year} Salud. Hecho para noches divertidas con amigos.',
    },
    home: {
        hero: {
            subtitle: 'Un juego social rápido: escanea, agrega jugadores, elige un modo y desliza cartas. Perfecto para pre, rumba, parejas, after y más.',
            ctaStart: 'Empezar ahora',
            ctaFeatures: 'Ver características',
            ctaCreate: 'Crear partida',
        },
        features: {
            players: { title: 'Añade jugadores', desc: 'Nombres rápidos, sin fricción. Soporta 1–12 jugadores.' },
            modes: { title: 'Modos de juego', desc: 'Pre, Rumba, Pareja, Afterparty y más.' },
            swipe: { title: 'Cartas por swipe', desc: 'Gestos fluidos para mantener el ritmo de la noche.' },
        },
        faq: {
            title: 'Preguntas frecuentes',
            account: { q: '¿Necesito cuenta?', a: 'No por ahora: juegas directo en el navegador.' },
            offline: { q: '¿Funciona offline?', a: 'La MVP requiere conexión. PWA llegará después.' },
        },
    },
    setup: {
        players: {
            title: 'Añadir jugadores',
            placeholder: 'Nombre del jugador',
            add: 'Agregar',
            remove: 'Quitar',
            clearAll: 'Borrar todos',
            continue: 'Continuar',
        },
        mode: {
            title: 'Elige modo de juego',
            loading: 'Cargando modos…',
            cards: 'Cartas: {count}',
            back: 'Atrás',
        },
    },
    play: {
        aria: { advance: 'Avanzar' },
        btn: {
            end: 'Terminar',
            next: 'Siguiente',
            reshuffle: 'Rearmar mazo',
            changeMode: 'Cambiar modo',
        },
        hint: { tap: 'Tip: toca la carta para avanzar' },
        offline: { banner: 'Modo sin conexión: usando contenido en caché cuando sea posible.' },
        empty: {
            title: 'No se pudo armar el mazo',
            description: 'El modo {mode} generó 0 cartas con los jugadores/condiciones actuales.',
            tipPlayers: 'Prueba con más jugadores o cambia el modo.',
            tipReshuffle: 'O rearmemos el mazo con una nueva semilla.',
            devTip: 'Tip: si ves esto seguido, revisa las constraints del pack.',
        },
    },
    summary: {
        title: 'Fin de la partida',
        thanks: '¡Gracias por jugar Salud 🍹 — Modo: {mode}!',
        btn: {
            playAgain: 'Jugar de nuevo',
            changeSetup: 'Cambiar modo',
            home: 'Inicio',
            rate: 'Calificar Salud',
        },
        mode: {
            unknown: 'desconocido',
            pre: 'Pre',
            night_out: 'Rumba',
        },
    },
    card: {
        kind: {
            rule_on: 'Nueva regla',
            rule_off: 'Fin de regla',
            group: 'Ronda',
            wildcard: 'Wildcard',
            action: 'Acción',
            question: 'Pregunta',
            versus: 'Duelo',
            default: 'Carta',
        },
        alt: 'Alt:',
    },
    render: {
        playerA: 'Jugador A',
        playerB: 'Jugador B',
        playerC: 'Jugador C',
        starter: 'Cualquiera',
    },
    modes: {
        pre: { label: 'Pre', description: 'Calentando los motores para una noche inolvidable.' },
        night_out: { label: 'Rumba', description: 'Vibras altas, preguntas interesantes. Esta noche nos reímos.' },
    },
};

export default es_la;
export type Translations = typeof es_la;