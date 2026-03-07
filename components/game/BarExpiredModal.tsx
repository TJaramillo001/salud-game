// components/game/BarExpiredModal.tsx
'use client';

import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/lib/i18n';

type BarExpiredModalProps = {
    barName: string;
    onContinueFree: () => void;
};

export function BarExpiredModal({ barName, onContinueFree }: BarExpiredModalProps) {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900 p-6 text-center shadow-xl">
                <div className="text-4xl mb-4">⏰</div>
                <h2 className="text-xl font-bold mb-2">{t.bar.expired.title}</h2>
                <p className="text-sm text-neutral-400 mb-6">
                    {t.bar.expired.description.replace('{barName}', barName)}
                </p>
                <div className="flex flex-col gap-3">
                    <Button onClick={onContinueFree} variant="secondary">
                        {t.bar.expired.continueFree}
                    </Button>
                </div>
            </div>
        </div>
    );
}
