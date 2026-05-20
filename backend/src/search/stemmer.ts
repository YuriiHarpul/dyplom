/**
 * A simple Porter-like stemmer for Ukrainian.
 * Improved to handle common noun/adj/verb suffixes.
 */
export function stemUkrainian(word: string): string {
    word = word.toLowerCase().replace(/['ʼ]/g, '').replace(/ь$/, '');

    if (word.length <= 3) return word;

    const patterns = [
        /(ивними|івськими|івською|івський|івська|івське|івську|ованого|ованому|ованим|ованих|ованими)$/,
        /(анням|енням|інню|янню|цями|цями|ями|ами|ицями|ицями|ання|ення)$/,
        /(ськими|ськой|ською|ськи|ську|ськи)$/,
        /(ими|іми|ого|ому|им|ім|их|іх|ах|ях|ів|ій|ий|ій|а|я|е|є|о|у|и|і|й)$/,
        /(ити|іти|яти|увати|ювати|ти)$/,
    ];

    let stemmed = word;
    for (const p of patterns) {
        const next = stemmed.replace(p, '');
        if (next.length >= 3) {
            stemmed = next;
            break;
        }
    }

    return stemmed;
}

export const STOP_WORDS = new Set(['для', 'про', 'над', 'під', 'при', 'через', 'його', 'її', 'їх', 'було', 'вона', 'воно', 'вони']);

export function getSearchTokens(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^а-яіїєґa-z0-9]+/i)
        .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
        .map(w => stemUkrainian(w));
}
