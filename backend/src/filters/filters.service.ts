import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FiltersService {
    constructor(private prisma: PrismaService) { }

    async getFilters(semester?: string, teacher?: string) {
        const whereClause: any = {};
        if (semester) whereClause.semester = semester;
        if (teacher) whereClause.teacher = { name: teacher };

        const filteredProjects = await this.prisma.project.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            select: {
                semester: true,
                teacher: { select: { name: true } },
            },
        });

        const allFilteredSemesters = filteredProjects
            .map((p: any) => p.semester)
            .filter(Boolean) as string[];
        const uniqueSemesters = Array.from(new Set(allFilteredSemesters)).sort((a, b) =>
            a.localeCompare(b),
        );

        const allFilteredTeachers = filteredProjects
            .map((p: any) => p.teacher.name)
            .filter(Boolean) as string[];
        const uniqueTeachers = Array.from(new Set(allFilteredTeachers)).sort((a, b) =>
            a.localeCompare(b),
        );

        return {
            semesters: uniqueSemesters,
            teachers: uniqueTeachers,
        };
    }
}
