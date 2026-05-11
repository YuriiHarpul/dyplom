/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshtein(a: string, b: string): number {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
        Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[a.length][b.length];
}

/**
 * A simple Porter-like stemmer for Ukrainian.
 * Improved to handle common noun/adj/verb suffixes.
 */
export function stemUkrainian(word: string): string {
    word = word.toLowerCase().replace(/['ʼ]/g, '').replace(/ь$/, '');
    
    if (word.length <= 3) return word;

    const patterns = [
        // Step 1: Longest suffixes first
        /(ивними|івськими|івською|івський|івська|івське|івську|ованого|ованому|ованим|ованих|ованими)$/,
        /(анням|енням|інню|янню|цями|цями|ями|ами|ицями|ицями|ання|ення)$/,
        /(ськими|ськой|ською|ськи|ську|ськи)$/,
        // Step 2: Medium suffixes
        /(ими|іми|ого|ому|им|ім|их|іх|ах|ях|ів|ій|ий|ій|а|я|е|є|о|у|и|і|й)$/,
        /(ити|іти|яти|увати|ювати|ти)$/,
    ];

    let stemmed = word;
    for (const p of patterns) {
        const next = stemmed.replace(p, '');
        // Do not over-stem: root must be at least 3 chars
        if (next.length >= 3) {
            stemmed = next;
            break;
        }
    }

    return stemmed;
}

const STOP_WORDS = new Set(['для', 'про', 'над', 'під', 'при', 'через', 'його', 'її', 'їх', 'було', 'вона', 'воно', 'вони']);

export function getSearchTokens(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^а-яіїєґa-z0-9]+/i)
        .filter(w => w.length >= 2 && !STOP_WORDS.has(w))
        .map(w => stemUkrainian(w));
}

export function calculateSearchScore(text: string, query: string): number {
    const queryNorm = query.toLowerCase().trim();
    if (!queryNorm) return 1;

    const queryWords = queryNorm.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
    const queryStems = queryWords.map(w => stemUkrainian(w));
    if (queryStems.length === 0) return 1;

    const textNorm = text.toLowerCase();
    const textTokens = getSearchTokens(text);

    let score = 0;
    let matches = 0;

    if (textNorm.includes(queryNorm)) score += 100;

    for (const qStem of queryStems) {
        const hasMatch = textTokens.some(tToken => {
            // Exact stem match or strong prefix/suffix match
            if (tToken === qStem) return true;
            if (tToken.length > 4 && qStem.length > 4) {
                // Only match if one is a significant prefix of another (min 4 chars)
                if (tToken.startsWith(qStem) || qStem.startsWith(tToken)) return true;
            }
            return false;
        });
        if (hasMatch) {
            matches++;
            score += 10;
        }
    }

    // High precision: Require ALL words to match for queries up to 3 words.
    // For longer queries, require at least 70% match.
    const threshold = queryStems.length <= 3 ? queryStems.length : Math.ceil(queryStems.length * 0.7);
    return matches >= threshold ? score : 0;
}

/**
 * Smart highlighting that understands Ukrainian stems.
 */
export function getHighlightParts(text: string, query: string) {
    if (!text || !query.trim()) return [{ text, highlight: false }];

    const queryStems = getSearchTokens(query);
    if (queryStems.length === 0) return [{ text, highlight: false }];

    const parts: { text: string; highlight: boolean }[] = [];
    
    // Split by non-word characters but keep them
    const tokens = text.split(/([^а-яіїєґa-z0-9]+)/i);

    for (const token of tokens) {
        if (!token.trim()) {
            parts.push({ text: token, highlight: false });
            continue;
        }

        const tokenStem = stemUkrainian(token);
        const isMatch = queryStems.some(qStem => {
            if (tokenStem === qStem || tokenStem.startsWith(qStem) || qStem.startsWith(tokenStem)) return true;
            if (qStem.length > 4 && tokenStem.length > 4) {
                const dist = levenshtein(qStem, tokenStem);
                if (dist === 1) return true;
            }
            return false;
        });

        if (isMatch) {
            parts.push({ text: token, highlight: true });
        } else {
            parts.push({ text: token, highlight: false });
        }
    }

    return parts;
}
