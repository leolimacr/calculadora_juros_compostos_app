export interface ContextualAction {
    id: string;
    label: string;
    route: string;
    icon?: string;
}
export declare const ACTION_REGISTRY: Record<string, ContextualAction>;
export declare class ActionManager {
    static extractActions(text: string): {
        cleanText: string;
        actions: ContextualAction[];
    };
    static getInstructionMenu(): string;
}
