export type QuestionType = 'question' | 'scenario' | 'rule';

export type Target =
    | { kind: 'all' }
    | { kind: 'single'; strategy: 'current' | 'random' | 'next' };

export interface CardBase {
    id: string;
    type: QuestionType;
    text: string;
    minPlayers?: number;
    nsfw?: boolean;
}

export interface RuleCard extends CardBase {
    type: 'rule';
    ruleId: string;
    params?: Record<string, any>;
}

export interface PromptCard extends CardBase {
    type: 'question' | 'scenario';
    target: Target;
    starter?: 'random' | 'current';
}

export type Card = RuleCard | PromptCard;

export interface Pack {
    id: 'pre' | 'night_out' | 'couple' | 'afterparty' | 'hot_sexy';
    name: string;
    version: number;
    cards: Card[];
}
