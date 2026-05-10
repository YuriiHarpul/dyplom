import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiService {
  constructor(private prisma: PrismaService) { }

  // --- Auth ---
  async login(body: any) {
    const { email, password } = body;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      throw new BadRequestException('Невірний email або пароль');
    }
    return user; // Return full user info (role, name, id)
  }

  async register(body: any) {
    const { email, password, name, group, course } = body;
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Користувач з такою поштою вже існує');
    }
    return this.prisma.user.create({
      data: {
        email,
        password,
        name,
        role: 'STUDENT',
        group,
        course,
      },
    });
  }

  // --- Users ---
  async getUsers(role?: string) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: { 
        id: true, name: true, email: true, role: true, group: true, course: true, capacity: true,
        _count: { select: { teacherProjects: true } },
        studentProject: {
          select: {
            teacher: { select: { id: true, name: true } }
          }
        }
      },
    });
  }

  async changeRole(userId: string, newRole: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: newRole as any },
    });
  }

  async assignTeacher(studentId: string, teacherId: string) {
    return this.prisma.project.upsert({
      where: { studentId },
      update: { teacherId },
      create: {
        studentId,
        teacherId,
        title: 'Тему не обрано',
        status: 'PENDING',
      },
    });
  }

  // --- Projects ---
  async getProjects(userId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.project.findMany({ include: { student: true, teacher: true, chapters: true } });
    }
    if (role === 'TEACHER') {
      return this.prisma.project.findMany({ where: { teacherId: userId }, include: { student: true, teacher: true, chapters: true } });
    }
    if (role === 'STUDENT') {
      return this.prisma.project.findUnique({ where: { studentId: userId }, include: { student: true, teacher: true, chapters: true } });
    }
    return [];
  }

  async createProjectRequest(studentId: string, title: string, teacherId: string) {
    return this.prisma.project.create({
      data: {
        studentId,
        teacherId,
        title,
        status: 'PENDING',
      },
    });
  }

  async approveProject(projectId: string) {
    const project = await this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'APPROVED' },
    });

    // Generate 4 chapters
    await this.prisma.chapter.createMany({
      data: [
        { title: 'Розділ 1', order: 1, projectId: project.id },
        { title: 'Розділ 2', order: 2, projectId: project.id },
        { title: 'Розділ 3', order: 3, projectId: project.id },
        { title: 'Розділ 4', order: 4, projectId: project.id },
      ],
    });

    return project;
  }

  async rejectProject(projectId: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'REJECTED' },
    });
  }

  async requestTitleChange(projectId: string, proposedTitle: string) {
    return this.prisma.project.update({
      where: { id: projectId },
      data: { proposedTitle },
    });
  }

  async approveTitleChange(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || !project.proposedTitle) throw new NotFoundException();

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        title: project.proposedTitle,
        proposedTitle: null,
      },
    });
  }

  // --- Chapters ---
  async submitChapter(chapterId: string) {
    return this.prisma.chapter.update({
      where: { id: chapterId },
      data: { status: 'SUBMITTED' },
    });
  }

  async approveChapter(chapterId: string) {
    return this.prisma.chapter.update({
      where: { id: chapterId },
      data: { status: 'APPROVED' },
    });
  }

  async reworkChapter(chapterId: string) {
    return this.prisma.chapter.update({
      where: { id: chapterId },
      data: { status: 'REWORK' },
    });
  }
}
