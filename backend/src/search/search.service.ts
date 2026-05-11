import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getSearchTokens, stemUkrainian, STOP_WORDS } from './stemmer';

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

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) { }

    async search(query?: string, teacher?: string, semester?: string) {
        const whereClause: any = {};
        if (teacher) whereClause.teacher = { name: teacher };
        if (semester) whereClause.semester = semester;

        // If no filters and no query, return empty
        if (!query && !teacher && !semester) {
            return { results: [] };
        }

        const allProjects = await this.prisma.project.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: { student: true, teacher: true },
        });

        // If no query, but filters are present - just return filtered list
        if (!query || query.trim() === '') {
            return { 
                results: allProjects.slice(0, 100).map(p => ({ item: p, score: 1 })) 
            };
        }

        const queryNorm = query.toLowerCase().trim();
        const queryWords = queryNorm.split(/\s+/).filter(w => w.length >= 2 && !STOP_WORDS.has(w));
        const queryStems = queryWords.map(w => stemUkrainian(w));

        if (queryStems.length === 0) {
            // If query consists only of stop words or is empty, but filters are present
            return { results: allProjects.slice(0, 100).map(p => ({ item: p, score: 1 })) };
        }

        const scoredResults = allProjects.map(project => {
            const titleNorm = project.title.toLowerCase();
            const titleTokens = getSearchTokens(project.title);
            
            let score = 0;
            let matchedWordsCount = 0;

            // 1. Пряме входження цілої фрази (Найвищий пріоритет)
            if (titleNorm.includes(queryNorm)) {
                score += 100;
            }

            // 2. Перевірка збігу стемів
            for (const qStem of queryStems) {
                const hasMatch = titleTokens.some(tToken => {
                    if (tToken === qStem) return true;
                    if (tToken.length > 4 && qStem.length > 4) {
                        if (tToken.startsWith(qStem) || qStem.startsWith(tToken)) return true;
                    }
                    return false;
                });
                if (hasMatch) {
                    matchedWordsCount++;
                    score += 10;
                }
            }

            // 3. Бонус за точний збіг цілих слів (не стемів)
            for (const qWord of queryWords) {
                if (titleNorm.includes(qWord)) {
                    score += 5;
                }
            }

            // 4. Штраф за різницю в довжині (щоб коротші точні збіги були вище)
            const lengthDiff = Math.abs(titleNorm.length - queryNorm.length);
            score -= (lengthDiff * 0.1);

            return {
                item: project,
                score,
                matchedWordsCount
            };
        });

        // Require ALL words to match for queries up to 3 words.
        // For longer queries, require at least 70% match.
        const threshold = queryStems.length <= 3 ? queryStems.length : Math.ceil(queryStems.length * 0.7);
        
        const filtered = scoredResults
            .filter(r => r.matchedWordsCount >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, 100);

        return {
            results: filtered.map(r => ({
                item: r.item,
                score: r.score,
                matches: [] // Для зворотної сумісності
            }))
        };
    }
}
