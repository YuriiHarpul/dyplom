import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.chapter.deleteMany();
  await prisma.project.deleteMany();
  await prisma.poolTeacher.deleteMany();
  await prisma.pool.deleteMany();
  await prisma.user.deleteMany();

  // --- Адміністратор ---
  const admin = await prisma.user.create({
    data: {
      email: 'admin@cnu.edu.ua',
      password: 'password123',
      name: 'Адміністратор Системи',
      role: 'ADMIN',
    },
  });

  // --- 10 Викладачів ---
  const teachersData = [
    { email: 'teacher@cnu.edu.ua',           name: 'Микола Кузь',                  capacity: 10 },
    { email: 'kovalenko@cnu.edu.ua',         name: 'Коваленко Олег Петрович',       capacity: 8  },
    { email: 'savchenko@cnu.edu.ua',         name: 'Савченко Ірина Василівна',      capacity: 7  },
    { email: 'bondarenko@cnu.edu.ua',        name: 'Бондаренко Андрій Миколайович', capacity: 9  },
    { email: 'lysenko@cnu.edu.ua',           name: 'Лисенко Тетяна Олексіївна',    capacity: 6  },
    { email: 'melnyk@cnu.edu.ua',            name: 'Мельник Василь Іванович',       capacity: 10 },
    { email: 'shevchenko.o@cnu.edu.ua',      name: 'Шевченко Оксана Григорівна',   capacity: 8  },
    { email: 'tkachenko@cnu.edu.ua',         name: 'Ткаченко Дмитро Сергійович',   capacity: 7  },
    { email: 'marchenko@cnu.edu.ua',         name: 'Марченко Наталія Юріївна',     capacity: 9  },
    { email: 'kravchenko@cnu.edu.ua',        name: 'Кравченко Ігор Олександрович', capacity: 5  },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const teacher = await prisma.user.create({
      data: { ...t, password: 'password123', role: 'TEACHER' },
    });
    teachers.push(teacher);
  }

  // --- 10 Студентів з різних груп ---
  const studentsData = [
    { email: 'student@cnu.edu.ua',          name: 'Юрій Гарпуль',            group: 'ІПЗ-41', course: '4' },
    { email: 'petrenko.m@cnu.edu.ua',       name: 'Петренко Максим Олегович',   group: 'ІПЗ-41', course: '4' },
    { email: 'kovalchuk.a@cnu.edu.ua',      name: 'Ковальчук Аліна Іванівна',   group: 'ІПЗ-42', course: '4' },
    { email: 'sydorenko.v@cnu.edu.ua',      name: 'Сидоренко Владислав Петрович', group: 'ІПЗ-42', course: '4' },
    { email: 'moroz.o@cnu.edu.ua',          name: 'Мороз Олена Василівна',      group: 'ІПЗ-31', course: '3' },
    { email: 'karpenko.d@cnu.edu.ua',       name: 'Карпенко Денис Андрійович',  group: 'ІПЗ-31', course: '3' },
    { email: 'bondar.yu@cnu.edu.ua',        name: 'Бондар Юлія Сергіївна',      group: 'ІПЗ-32', course: '3' },
    { email: 'rudenko.r@cnu.edu.ua',        name: 'Руденко Роман Миколайович',  group: 'КІ-41',  course: '4' },
    { email: 'hrytsenko.s@cnu.edu.ua',      name: 'Гриценко Соломія Тарасівна', group: 'КІ-31',  course: '3' },
    { email: 'zaitsev.p@cnu.edu.ua',        name: 'Зайцев Павло Олексійович',   group: 'ПМ-41',  course: '4' },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.user.create({
      data: { ...s, password: 'password123', role: 'STUDENT' },
    });
    students.push(student);
  }

  // --- Пул тем ---
  const pool = await prisma.pool.create({
    data: {
      name: 'Дипломна робота 2026',
      year: 2026,
      semester: '1 семестр',
      workType: 'Дипломна робота',
      groupPatterns: 'ІПЗ-4*, КІ-4*, ПМ-4*',
    },
  });

  // Додаємо всіх викладачів до пулу
  for (const teacher of teachers) {
    await prisma.poolTeacher.create({
      data: { poolId: pool.id, teacherId: teacher.id, capacity: teacher.capacity ?? 8 },
    });
  }

  console.log(`✅ Seeded: 1 admin, ${teachers.length} teachers, ${students.length} students, 1 pool`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
