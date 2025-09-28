'use client';

import { useRef, useState } from 'react';

type UseSwipeOpts = {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    threshold?: number; // px
};

export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 80 }: UseSwipeOpts) {
    const startX = useRef<number | null>(null);
    const [dx, setDx] = useState(0);

    function onPointerDown(e: React.PointerEvent) {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        startX.current = e.clientX;
    }

    function onPointerMove(e: React.PointerEvent) {
        if (startX.current == null) return;
        setDx(e.clientX - startX.current);
    }

    function onPointerUp() {
        if (Math.abs(dx) >= threshold) {
            dx < 0 ? onSwipeLeft?.() : onSwipeRight?.();
        }
        setDx(0);
        startX.current = null;
    }

    return { dx, bind: { onPointerDown, onPointerMove, onPointerUp } };
}
