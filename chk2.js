const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetSchoolId = 'cmt8l9puu000do2pg1cka2t7v';
  const gradeLevel = 8;

  const andConditions = [];
  if (targetSchoolId) {
    andConditions.push({
      OR: [
        { classRoom: { schoolId: targetSchoolId } },
        { user: { schoolId: targetSchoolId } },
      ],
    });
  }
  if (gradeLevel) {
    andConditions.push({ classRoom: { gradeLevel: Number(gradeLevel) } });
  }

  const result = await prisma.student.findMany({
    where: { AND: andConditions },
    include: {
      user: { select: { id: true, name: true, email: true } },
      classRoom: {
        select: {
          id: true,
          name: true,
          gradeLevel: true,
          school: { select: { id: true, name: true } },
        },
      },
      group: { select: { id: true, name: true } },
    },
  });

  console.log('QueryResult count:', result.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
