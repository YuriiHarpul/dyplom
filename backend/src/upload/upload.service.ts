import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

@Injectable()
export class UploadService {
    constructor(private prisma: PrismaService) { }

    async handleExcelUpload(filePath: string, fileName: string, fileUrl: string) {
        const buffer = fs.readFileSync(filePath);
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        let importedCount = 0;
        const parsedItems = [];

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
                    !teacherName
                )
                    continue;

                const studentNameLower = studentName.toLowerCase();
                const teacherNameLower = teacherName.toLowerCase();
                const titleLower = title.toLowerCase();

                const isStudentHeader = ['прізвище', 'імя', 'по батькові', 'студент', 'підпис', '№', 'з/п'].some(kw => studentNameLower.includes(kw));
                const isTeacherHeader = ['керівник', 'підрозділ', 'навчальн', 'структурн', 'завідувач', 'декан', 'комісія', 'викладач'].some(kw => teacherNameLower.includes(kw));
                const isTitleHeader = ['теми курсових', 'теми кваліфікаційних', 'теми магістерських', 'короткий опис завдання', 'назва теми', 'тема роботи', 'тема'].some(kw => titleLower === kw || titleLower.startsWith(kw));

                if (isStudentHeader || isTeacherHeader || isTitleHeader) {
                    continue;
                }

                let group: string | null = row[18]?.toString().trim() || null;
                if (!group && currentCourse) group = currentCourse;

                if (studentName.length < 5 || studentName.split(' ').length < 2) continue;

                // 1. Знайти або створити студента
                let student = await this.prisma.user.findFirst({ where: { name: studentName, role: 'STUDENT' } });
                if (!student) {
                    const uniqueEmail = `student_${Date.now()}_${Math.floor(Math.random()*1000)}@cnu.edu.ua`;
                    student = await this.prisma.user.create({ data: { name: studentName, group, email: uniqueEmail, password: 'password123', role: 'STUDENT' } });
                } else if (group && !student.group) {
                    student = await this.prisma.user.update({
                        where: { id: student.id },
                        data: { group },
                    });
                }

                // 2. Знайти або створити викладача
                let teacher = await this.prisma.user.findFirst({ where: { name: teacherName, role: 'TEACHER' } });
                if (!teacher) {
                    const uniqueEmail = `teacher_${Date.now()}_${Math.floor(Math.random()*1000)}@cnu.edu.ua`;
                    teacher = await this.prisma.user.create({ data: { name: teacherName, email: uniqueEmail, password: 'password123', role: 'TEACHER' } });
                }

                // 3. Зберегти або оновити проєкт
                const existingProject = await this.prisma.project.findFirst({
                    where: { studentId: student.id, title },
                });

                if (existingProject) {
                    await this.prisma.project.update({
                        where: { id: existingProject.id },
                        data: { title, teacherId: teacher.id, semester: sheetName },
                    });
                } else {
                    const newProj = await this.prisma.project.create({
                        data: {
                            title,
                            studentId: student.id,
                            teacherId: teacher.id,
                            semester: sheetName,
                            status: 'APPROVED',
                        },
                    });
                    
                    // Create chapters
                    await this.prisma.chapter.createMany({
                      data: [
                        { title: 'Розділ 1', order: 1, projectId: newProj.id },
                        { title: 'Розділ 2', order: 2, projectId: newProj.id },
                        { title: 'Розділ 3', order: 3, projectId: newProj.id },
                        { title: 'Розділ 4', order: 4, projectId: newProj.id },
                      ],
                    });
                }

                parsedItems.push({ studentName, title, teacherName, group });

                importedCount++;
            }
        }

        await this.prisma.importedFile.create({
            data: {
                fileName,
                fileUrl,
                parsedData: JSON.stringify(parsedItems),
            }
        });

        return { success: true, count: importedCount };
    }

    async saveDocument(projectId: string, fileName: string, fileUrl: string) {
        return this.prisma.projectDocument.create({
            data: {
                projectId,
                fileName,
                fileUrl,
            }
        });
    }
}
