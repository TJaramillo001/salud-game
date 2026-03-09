// lib/i18n/translations/es_eu.ts — Spain Spanish (Erasmus/Salamanca)
import type { Translations } from './es_la';

const es_eu: Translations = {
    language: {
        screenTitle: 'Elige tu idioma',
        screenSubtitle: '¿En qué idioma queréis jugar?',
    },
    nav: {
        features: 'Características',
        faq: 'Preguntas frecuentes',
        home: 'Ir al inicio',
    },
    footer: {
        copyright: '© {year} Salud. Hecho para noches locas con amigos.',
    },
    home: {
        hero: {
            subtitle: 'Un juego social rápido: escanea, añade jugadores, elige un modo y pasa las cartas. Perfecto para el pre, la rumba, parejas, el after y más.',
            ctaStart: 'Empezar ahora',
            ctaFeatures: 'Ver características',
            ctaCreate: 'Crear partida',
        },
        features: {
            players: { title: 'Añade jugadores', desc: 'Nombres rápidos, sin registro. Compatible con 1–12 jugadores.' },
            modes: { title: 'Modos de juego', desc: 'Pre, Salida, Pareja, After y más.' },
            swipe: { title: 'Cartas por swipe', desc: 'Gestos fluidos para no perder el ritmo de la noche.' },
        },
        faq: {
            title: 'Preguntas frecuentes',
            account: { q: '¿Necesito cuenta?', a: 'No: juegas directamente en el navegador.' },
            offline: { q: '¿Funciona sin conexión?', a: 'La versión inicial necesita conexión. PWA llegará pronto.' },
        },
    },
    setup: {
        players: {
            title: 'Añadir jugadores',
            placeholder: 'Nombre del jugador',
            add: 'Añadir',
            remove: 'Quitar',
            clearAll: 'Borrar todos',
            continue: 'Continuar',
        },
        mode: {
            title: 'Elige el modo de juego',
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
            reshuffle: 'Remezclar baraja',
            changeMode: 'Cambiar modo',
        },
        hint: { tap: 'Consejo: toca la carta para avanzar' },
        offline: { banner: 'Sin conexión: usando contenido en caché cuando sea posible.' },
        empty: {
            title: 'No se pudo crear la baraja',
            description: 'El modo {mode} generó 0 cartas con los jugadores/condiciones actuales.',
            tipPlayers: 'Prueba con más jugadores o cambia el modo.',
            tipReshuffle: 'O barajemos de nuevo con una semilla nueva.',
            devTip: 'Consejo: si ves esto seguido, revisa las restricciones del mazo.',
        },
    },
    summary: {
        title: 'Fin de la partida',
        thanks: '¡Gracias por jugar a Salud 🍹 — Modo: {mode}!',
        btn: {
            playAgain: 'Jugar de nuevo',
            changeSetup: 'Cambiar modo',
            home: 'Inicio',
            rate: 'Valorar Salud',
        },
        rateHint: 'Tu opinión nos ayuda a mejorar el juego 🙏',
        mode: {
            unknown: 'desconocido',
            pre: 'Pre',
            night_out: 'Salida nocturna',
        },
    },
    card: {
        kind: {
            rule_on: 'Nueva regla',
            rule_off: 'Fin de regla',
            group: 'Ronda',
            wildcard: 'Comodín',
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
        pre: { label: 'Pre', description: 'Calentando motores para una noche que no olvidaréis.' },
        night_out: { label: 'Salida nocturna', description: 'Vibras altas, preguntas interesantes. Esta noche nos reímos.' },
        couple: { label: 'Pareja', description: 'Retos y preguntas íntimas para parejas.' },
        afterparty: { label: 'Afterparty', description: 'La fiesta no acaba. Cartas para los que aguantan.' },
        bar: { label: 'Bar', description: 'Cartas especiales para noches de bar.' },
    },
    bar: {
        notFound: 'Bar no encontrado',
        notFoundDesc: 'Este código QR no es válido o el bar no está disponible.',
        goHome: 'Ir al inicio',
        badge: 'Especial del bar',
        landing: {
            welcome: '¡Bienvenido a {barName}!',
            subtitle: 'Jugad a Salud con todos los modos desbloqueados.',
            startPlaying: '¡A jugar!',
            continueSession: 'Seguir jugando',
            newSession: 'Nueva sesión',
        },
        session: {
            activeBanner: 'Jugando en {barName}',
            allUnlocked: 'Todos los modos desbloqueados',
            expiresIn: 'Sesión activa — expira en {time}',
        },
        expired: {
            title: 'Sesión del bar terminada',
            description: 'Tu acceso premium de {barName} ha expirado.',
            subscribe: 'Acceso ilimitado',
            continueFree: 'Seguir con modo gratis',
        },
    },
    mode: {
        locked: 'Premium',
        lockedDesc: 'Escanea un QR de bar o suscríbete para desbloquear.',
        comingSoon: 'Próximamente',
        password: {
            title: 'Introduce la contraseña',
            placeholder: 'Contraseña',
            submit: 'Desbloquear',
            error: 'Contraseña incorrecta',
        },
    },
};

export default es_eu;