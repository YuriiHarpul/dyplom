import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as xlsx from 'xlsx';

@Injectable()
export class UploadService {
    constructor(private prisma: PrismaService) { }

    async handleExcelUpload(buffer: Buffer) {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let importedCount = 0;

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            let currentCourse: string | null = null;

            for (const row of data) {
                const rowStr = JSON.stringify(row);

                const magisterYearMatch = rowStr.match(/(\d)(-(?:го)?)? (року навчання|курсу) магістратури/i);
                const magisterGenericMatch = rowStr.match(/магістр/i);
                const courseMatch =
                    rowStr.match(/(\d)(-(?:го)?)? курсу/i) || rowStr.match(/(\d)\s*курсу/i);

                if (magisterYearMatch && magisterYearMatch[1]) {
                    currentCourse = `${magisterYearMatch[1]} курс магістратури`;
                } else if (magisterGenericMatch && (!courseMatch || !courseMatch[1])) {
                    currentCourse = 'Магістратура';
                } else if (courseMatch && courseMatch[1]) {
                    currentCourse = `${courseMatch[1]} курс`;
                }

                if (!row || row.length < 4) continue;

                const studentName = row[1]?.toString().trim();
                const title = row[2]?.toString().trim();
                const teacherName = row[3]?.toString().trim();

                if (
                    !studentName ||
                    !title ||
                    !teacherName ||
                    studentName.includes('Прізвище') ||
                    title.includes('Теми курсових') ||
                    title.includes('Теми кваліфікаційних') ||
                    title.includes('Теми магістерських')
                )
                    continue;

                let group: string | null = row[18]?.toString().trim() || null;
                if (!group && currentCourse) group = currentCourse;

                if (studentName.length < 5 || studentName.split(' ').length < 2) continue;

                // 1. Знайти або створити студента
                let student = await this.prisma.student.findFirst({ where: { name: studentName } });
                if (!student) {
                    student = await this.prisma.student.create({ data: { name: studentName, group } });
                } else if (group && !student.group) {
                    student = await this.prisma.student.update({
                        where: { id: student.id },
                        data: { group },
                    });
                }

                // 2. Знайти або створити викладача
                let teacher = await this.prisma.teacher.findFirst({ where: { name: teacherName } });
                if (!teacher) {
                    teacher = await this.prisma.teacher.create({ data: { name: teacherName } });
                }

                // 3. Зберегти або оновити проєкт
                const existingProject = await this.prisma.project.findUnique({
                    where: { studentId: student.id },
                });

                if (existingProject) {
                    await this.prisma.project.update({
                        where: { id: existingProject.id },
                        data: { title, teacherId: teacher.id, semester: sheetName },
                    });
                } else {
                    await this.prisma.project.create({
                        data: {
                            title,
                            studentId: student.id,
                            teacherId: teacher.id,
                            semester: sheetName,
                        },
                    });
                }

                importedCount++;
            }
        }

        return { success: true, count: importedCount };
    }
}
