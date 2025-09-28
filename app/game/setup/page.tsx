// app/game/setup/page.tsx
import { redirect } from 'next/navigation';

export default function SetupIndex() {
    // Send users straight to the first step
    redirect('/game/setup/players');
}
