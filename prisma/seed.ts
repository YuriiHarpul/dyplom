import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.chapter.deleteMany();
  await prisma.project.deleteMany();
  await prisma.poolTeacher.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.user.deleteMany(); // Clear existing

  const admin = await prisma.user.create({
    data: {
      email: 'admin@cnu.edu.ua',
      password: 'password123',
      name: 'Адміністратор Системи',
      role: 'ADMIN',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@cnu.edu.ua',
      password: 'password123',
      name: 'Микола Кузь(Викладач)',
      role: 'TEACHER',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@cnu.edu.ua',
      password: 'password123',
      name: 'Юрій Гарпуль (Студент)',
      role: 'STUDENT',
      group: 'ІПЗ-41',
      course: '4',
    },
  });

  const pool = await prisma.pool.create({
    data: {
      name: 'Курсова робота 2026',
      year: 2026,
      semester: '1 півріччя',
      workType: 'Курсова робота',
      groupPatterns: 'ІПЗ-4*',
    },
  });

  await prisma.poolTeacher.create({
    data: {
      poolId: pool.id,
      teacherId: teacher.id,
      capacity: 10,
    },
  });

  console.log('Database seeded with:', { admin, teacher, student, pool });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
