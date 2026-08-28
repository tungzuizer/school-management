const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tanXa = await prisma.student.findMany({
    where: { classRoom: { schoolId: 'cmt8l9puu000do2pg1cka2t7v' } },
    include: { classRoom: true }
  });
  const tanXaGrades = {};
  tanXa.forEach(s => {
    const g = s.classRoom?.gradeLevel;
    tanXaGrades[g] = (tanXaGrades[g] || 0) + 1;
  });
  console.log('Tan Xa Grades breakdown:', tanXaGrades);

  // Check all schools and all grades
  const allStudents = await prisma.student.findMany({
    include: { classRoom: { include: { school: true } } }
  });

  const breakdown = {};
  allStudents.forEach(s => {
    const schoolName = s.classRoom?.school?.name || 'No School';
    const grade = s.classRoom?.gradeLevel || 'No Grade';
    if (!breakdown[schoolName]) breakdown[schoolName] = {};
    breakdown[schoolName][grade] = (breakdown[schoolName][grade] || 0) + 1;
  });
  console.log('All Students breakdown:', JSON.stringify(breakdown, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
