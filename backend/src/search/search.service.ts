import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// CommonJS-compatible Fuse.js import (ts-node compiles to CJS)
import * as FuseLib from 'fuse.js';
const Fuse = (FuseLib as any).default ?? FuseLib;

const STOP_WORDS = new Set([
    'так', 'і', 'й', 'для', 'по', 'в', 'у', 'на', 'з', 'із',
    'до', 'від', 'при', 'або', 'та', 'це', 'то',
    'що', 'як', 'але', 'щоб', 'коли', 'між', '',
]);

const fuseOptions = {
    includeScore: true,
    includeMatches: true,
    useExtendedSearch: true,
    findAllMatches: true,
    ignoreLocation: true,
    threshold: 0.4,
    minMatchCharLength: 2,
    keys: ['title', 'student.name'],
};

@Injectable()
export class SearchService {
    constructor(private prisma: PrismaService) { }

    async search(query?: string, teacher?: string, semester?: string) {
        const whereClause: any = {};
        if (teacher) whereClause.teacher = { name: teacher };
        if (semester) whereClause.semester = semester;

        if (!query && !teacher && !semester) {
            return { results: [] };
        }

        const allProjects = await this.prisma.project.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: { student: true, teacher: true },
        });

        let finalResults: { item: any; matches: any }[] = allProjects.map((p: any) => ({
            item: p,
            matches: [],
        }));

        if (query && query.trim() !== '') {
            const fuse = new Fuse(allProjects, fuseOptions);
            const queryWords = query
                .trim()
                .split(/\s+/)
                .filter((w) => w.length >= 2 && !STOP_WORDS.has(w.toLowerCase()));

            if (queryWords.length === 0) {
                const searchResults = fuse.search(query);
                finalResults = searchResults.map((r) => ({ item: r.item, matches: r.matches }));
            } else {
                const matchCount = new Map<string, number>();
                const matchScore = new Map<string, number>();
                const itemsById = new Map<string, any>();

                for (const word of queryWords) {
                    const wordResults = fuse.search(word);
                    for (const r of wordResults) {
                        itemsById.set(r.item.id, r.item);
                        matchCount.set(r.item.id, (matchCount.get(r.item.id) ?? 0) + 1);
                        matchScore.set(r.item.id, (matchScore.get(r.item.id) ?? 0) + (r.score ?? 1));
                    }
                }

                const phraseQuery = query.trim().toLowerCase();
                const hasExactPhrase = (id: string) => {
                    const title = itemsById.get(id)?.title?.toLowerCase() ?? '';
                    return title.includes(phraseQuery);
                };

                const threshold = Math.max(1, Math.round(queryWords.length * 0.8));

                const sortByRelevance = (
                    [idA, countA]: [string, number],
                    [idB, countB]: [string, number],
                ) => {
                    const exactA = hasExactPhrase(idA) ? 1 : 0;
                    const exactB = hasExactPhrase(idB) ? 1 : 0;
                    if (exactB !== exactA) return exactB - exactA;
                    if (countB !== countA) return countB - countA;
                    return (matchScore.get(idA) ?? 1) - (matchScore.get(idB) ?? 1);
                };

                finalResults = [...matchCount.entries()]
                    .filter(([, count]) => count >= threshold)
                    .sort(sortByRelevance)
                    .map(([id]) => ({ item: itemsById.get(id)!, matches: [] }));

                if (finalResults.length === 0) {
                    const fallbackThreshold = Math.max(1, Math.round(queryWords.length * 0.67));
                    finalResults = [...matchCount.entries()]
                        .filter(([, count]) => count >= fallbackThreshold)
                        .sort(sortByRelevance)
                        .map(([id]) => ({ item: itemsById.get(id)!, matches: [] }));
                }
            }
        }

        return { results: finalResults.slice(0, 100) };
    }
}
