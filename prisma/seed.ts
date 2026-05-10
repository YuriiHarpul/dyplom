import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
      name: 'Іван Петренко (Викладач)',
      role: 'TEACHER',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@cnu.edu.ua',
      password: 'password123',
      name: 'Олена Коваленко (Студент)',
      role: 'STUDENT',
      group: 'КН-41',
      course: '4',
    },
  });

  console.log('Database seeded with:', { admin, teacher, student });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
