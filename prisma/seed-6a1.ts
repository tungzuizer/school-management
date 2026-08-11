import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const studentsData = [
  { studentCode: "3450957028", name: "Bùi Thái An", dob: "2014-08-30", gender: "MALE", phone: "0947145789", fatherName: "Bùi Văn Thái", fatherJob: "Kinh doanh", fatherBirthYear: 1988, motherName: "Nguyễn Hồng Hạnh", motherJob: "Giáo viên" },
  { studentCode: "3551354405", name: "Phạm Nhật Phúc An", dob: "2014-07-24", gender: "MALE", phone: "0974449638", fatherName: "Phạm Nhật Trường", fatherJob: "Tự do", fatherBirthYear: 1977, motherName: "Lương Thị Hải Yến", motherJob: "Tự do" },
  { studentCode: "3550238798", name: "Trần Đức An", dob: "2014-05-11", gender: "MALE", phone: "0988218867", fatherName: "Trần Khắc Hùng", fatherJob: "Công nhân", fatherBirthYear: 1983, motherName: "Lê Thị Hương", motherJob: "Công nhân" },
  { studentCode: "3550960333", name: "Đào Thị Quỳnh Anh", dob: "2014-09-14", gender: "FEMALE", phone: "0919606396", fatherName: "Đào Văn Đức", fatherJob: "Công nhân", fatherBirthYear: 1984, motherName: "Lê Thị Thủy", motherJob: "Công nhân" },
  { studentCode: "3529151140", name: "Đinh Trí Anh", dob: "2014-09-20", gender: "MALE", phone: "0913838112", fatherName: "Đinh Trọng Phương", fatherJob: "Bác sĩ", fatherBirthYear: 1981, motherName: "Trần Thị Huyền Trang", motherJob: "Dược sĩ" },
  { studentCode: "3790183416", name: "Hoàng Quỳnh Anh", dob: "2014-05-21", gender: "FEMALE", phone: "0981988935", fatherName: "Hoàng Văn Tuấn", fatherJob: "Công an", fatherBirthYear: 1985, motherName: "Đào Thị Thuỳ Linh", motherJob: "Kế toán" },
  { studentCode: "3551357613", name: "Lương Hoàng Anh", dob: "2014-10-16", gender: "MALE", phone: "0989366329", fatherName: "Lương Quý Báu", fatherJob: "Tự do", fatherBirthYear: 1987, motherName: "Trần Thị Tám", motherJob: "Tự do" },
  { studentCode: "3790178502", name: "Nguyễn Bùi Hải Anh", dob: "2014-04-10", gender: "MALE", phone: "0988820290", fatherName: "Nguyễn Tiến Đạt", fatherJob: "Công nhân", fatherBirthYear: 1984, motherName: "Nguyễn Thị Như Loan", motherJob: "Tự do" },
  { studentCode: "3550957012", name: "Trần Châu Anh", dob: "2014-04-02", gender: "FEMALE", phone: "0982668982", fatherName: "Trần Lê Trung", fatherJob: "Công an", fatherBirthYear: 1987, motherName: "Nguyễn Thị Trang", motherJob: "Công an" },
  { studentCode: "0133728261", name: "Trần Diệu Anh", dob: "2014-04-10", gender: "FEMALE", phone: "0986197141", fatherName: "Trần Văn Đạo", fatherJob: "Bảo vệ", fatherBirthYear: 1978, motherName: "Nguyễn Thị Kim", motherJob: "Làm may" },
  { studentCode: "3790182553", name: "Nguyễn Thùy Chi", dob: "2014-09-05", gender: "FEMALE", phone: "0825873824", fatherName: "Nguyễn Lý Tưởng", fatherJob: "Công nhân", fatherBirthYear: 1975, motherName: "Nguyễn Thị Thu Hằng", motherJob: "Cán bộ" },
  { studentCode: "3551359936", name: "Trương Khánh Chi", dob: "2014-03-23", gender: "FEMALE", phone: "0917895589", fatherName: "Trương Công Trung", fatherJob: "Công nhân", fatherBirthYear: 1980, motherName: "Đỗ Thị Hồng Nhung", motherJob: "Tự do" },
  { studentCode: "3790182555", name: "Đinh Văn Cương", dob: "2014-03-11", gender: "MALE", phone: "0947781283", fatherName: "Đinh Phú Hội", fatherJob: "Lái xe", fatherBirthYear: 1982, motherName: "Phạm Thị Ái", motherJob: "Tự do" },
  { studentCode: "3790181445", name: "Hoàng Thùy Dương", dob: "2014-08-20", gender: "FEMALE", phone: "0388153335", fatherName: "Hoàng Văn Thức", fatherJob: "Kỹ sư xây dựng", fatherBirthYear: 1980, motherName: "Trần Thị Đào", motherJob: "Cán bộ" },
  { studentCode: "3790183419", name: "Nguyễn Linh Đan", dob: "2014-11-12", gender: "FEMALE", phone: "0972095209", fatherName: "Nguyễn Ngọc Sơn", fatherJob: "Viên chức", fatherBirthYear: 1983, motherName: "Đỗ Thị Thu Đông", motherJob: "Viên chức" },
  { studentCode: "3790181446", name: "Phan Huy Hoàng", dob: "2014-07-14", gender: "MALE", phone: "0982553475", fatherName: "Phan Văn Hiếu", fatherJob: "Kỹ sư", fatherBirthYear: 1989, motherName: "Đinh Thị Hương", motherJob: "Giáo viên" },
  { studentCode: "3790181448", name: "Lê Thị Việt Hương", dob: "2014-12-19", gender: "FEMALE", phone: "0827763222", fatherName: "Lê Trung Hiếu", fatherJob: "Tự do", fatherBirthYear: 1983, motherName: "Lê Thị Thêm", motherJob: "Tự do" },
  { studentCode: "3551349422", name: "Nguyễn Cao Khang", dob: "2014-05-24", gender: "MALE", phone: "0904929496", fatherName: "Nguyễn Cao Tuấn", fatherJob: "Cán bộ", fatherBirthYear: 1985, motherName: "Đỗ Thị Uyên", motherJob: "Cán bộ" },
  { studentCode: "3551352474", name: "Nguyễn Xuân Phúc Khang", dob: "2014-11-19", gender: "MALE", phone: "0886893686", fatherName: "Nguyễn Xuân Tùng", fatherJob: "Kinh doanh", fatherBirthYear: 1985, motherName: "Phạm Thị Minh Thư", motherJob: "Kinh doanh" },
  { studentCode: "3790181449", name: "Trịnh Minh Khang", dob: "2014-03-08", gender: "MALE", phone: "0982730835", fatherName: "Trịnh Ngọc Thắng", fatherJob: "Nhân viên", fatherBirthYear: 1982, motherName: "Nguyễn Thị Vượng", motherJob: "Viên chức" },
  { studentCode: "3551357585", name: "Lưu Ngân Khánh", dob: "2014-02-05", gender: "FEMALE", phone: "0395396288", fatherName: "Lưu Sơn Cao", fatherJob: "Tự Do", fatherBirthYear: 1981, motherName: "Mai Thị Lê", motherJob: "Nhân Viên" },
  { studentCode: "3790178503", name: "Đỗ Ngọc Khuê", dob: "2014-11-06", gender: "FEMALE", phone: "0916071774", fatherName: "Đỗ Ngọc Thụy", fatherJob: "Công nhân", fatherBirthYear: 1982, motherName: "Trần Thị Thu Hạnh", motherJob: "Phóng viên" },
  { studentCode: "3790178504", name: "Nguyễn Tuấn Kiệt", dob: "2014-11-30", gender: "MALE", phone: "0971630699", fatherName: "Nguyễn Quyết Mạnh", fatherJob: "Tự do", fatherBirthYear: 1983, motherName: "Lê Thị Thúy Linh", motherJob: "Nhân viên y tế" },
  { studentCode: "3790178506", name: "Nguyễn Khánh Linh", dob: "2014-11-03", gender: "FEMALE", phone: "0949675335", fatherName: "Nguyễn Văn Khánh", fatherJob: "Kỹ sư", fatherBirthYear: 1988, motherName: "Nguyễn Thị Thúy Dương", motherJob: "Kế toán" },
  { studentCode: "3551359935", name: "Nguyễn Phương Linh", dob: "2014-04-29", gender: "FEMALE", phone: "0912157168", fatherName: "Nguyễn Vũ Trường", fatherJob: "Công nhân", fatherBirthYear: 1980, motherName: "Trần Thị Thu", motherJob: "Điều dưỡng" },
  { studentCode: "3790178507", name: "Trần Hoàng Lộc", dob: "2014-10-27", gender: "MALE", phone: "0912318038", fatherName: "Trần Phi Trường", fatherJob: "Công an", fatherBirthYear: 1983, motherName: "Khổng Thị Minh Hoạt", motherJob: "Nhân viên VP" },
  { studentCode: "3551362637", name: "Đoàn Trần Nhật Minh", dob: "2014-04-27", gender: "MALE", phone: "0978149525", fatherName: "Đoàn Xuân Hòa", fatherJob: "Tự do", fatherBirthYear: 1984, motherName: "Trần Thị Minh Phương", motherJob: "Tự do" },
  { studentCode: "3551359928", name: "Hoàng Nhật Minh", dob: "2014-07-01", gender: "MALE", phone: "0374358552", fatherName: "Hoàng Quốc Hưng", fatherJob: "Kỹ sư", fatherBirthYear: 1987, motherName: "Ngô Thùy Linh", motherJob: "Nhân viên" },
  { studentCode: "3544782915", name: "Nguyễn Hà Tuấn Minh", dob: "2014-05-14", gender: "MALE", phone: "0915962866", fatherName: "Nguyễn Hà Thành", fatherJob: "Công nhân", fatherBirthYear: 1987, motherName: "Lê Thị Trang", motherJob: "Tự do" },
  { studentCode: "3790178508", name: "Nguyễn Nhật Minh", dob: "2014-01-10", gender: "MALE", phone: "0913266196", fatherName: "Nguyễn Văn Dũng", fatherJob: "Kỹ sư", fatherBirthYear: 1988, motherName: "Nguyễn Thị Tươi", motherJob: "Nhân viên" },
  { studentCode: "3551349424", name: "Hoàng Kim Ngân", dob: "2014-03-01", gender: "FEMALE", phone: "0976271729", fatherName: "Hoàng Cao Chỉnh", fatherJob: "Kỹ sư", fatherBirthYear: 1986, motherName: "Vũ Thị Kim Anh", motherJob: "Kế toán" },
  { studentCode: "3551349423", name: "Nguyễn Bảo Ngân", dob: "2014-05-23", gender: "FEMALE", phone: "0973706878", fatherName: "Nguyễn Văn Lực", fatherJob: "Kỹ sư", fatherBirthYear: 1987, motherName: "Mai Thị Hoài", motherJob: "Công an" },
  { studentCode: "3530191618", name: "Nguyễn Khánh Ngân", dob: "2014-03-04", gender: "FEMALE", phone: "0917026786", fatherName: "Nguyễn Văn Chương", fatherJob: "Công an", fatherBirthYear: 1977, motherName: "Bùi Thanh Thảo", motherJob: "Công an" },
  { studentCode: "3790178509", name: "Phùng Thị Hoàng Oanh", dob: "2014-12-02", gender: "FEMALE", phone: "0978142951", fatherName: "Phùng Quang Tuấn", fatherJob: "Giáo viên", fatherBirthYear: 1975, motherName: "Đới Thị Bình", motherJob: "Giáo viên" },
  { studentCode: "4227419074", name: "Lê Thị Mai Phương", dob: "2014-05-01", gender: "FEMALE", phone: "0919105751", fatherName: "Lê Văn Sơn", fatherJob: "Công nhân", fatherBirthYear: 1983, motherName: "Tạ Thị Lan", motherJob: "Nhân viên" },
  { studentCode: "3790178510", name: "Phạm Minh Quân", dob: "2014-03-12", gender: "MALE", phone: "0888080801", fatherName: "Phạm Minh Sĩ", fatherJob: "Tự do", fatherBirthYear: 1991, motherName: "Đặng Thị Phương Anh", motherJob: "Tự do" },
  { studentCode: "3790182558", name: "Quan Mạnh Quân", dob: "2014-01-04", gender: "MALE", phone: "0917802552", fatherName: "Quan Văn Thuận", fatherJob: "Tự do", fatherBirthYear: 1989, motherName: "Đã Mất", motherJob: "" },
  { studentCode: "3551349455", name: "Nguyễn Minh Thành", dob: "2014-04-01", gender: "MALE", phone: "0904689629", fatherName: "Nguyễn Văn Phương", fatherJob: "Kế toán", fatherBirthYear: 1985, motherName: "Nguyễn Thị Hương", motherJob: "Nhân viên" },
  { studentCode: "3790178512", name: "Vũ Minh Thành", dob: "2014-07-15", gender: "MALE", phone: "0376387586", fatherName: "Vũ Ngọc Tân", fatherJob: "Lái xe", fatherBirthYear: 1985, motherName: "Vũ Thị Tâm", motherJob: "Tự do" },
  { studentCode: "3550238820", name: "Nguyễn Phương Thảo", dob: "2014-11-12", gender: "FEMALE", phone: "0374518071", fatherName: "Nguyễn Văn Hoàn", fatherJob: "Công chức", fatherBirthYear: 1985, motherName: "Nguyễn Thị Quỳnh", motherJob: "Công chức" },
  { studentCode: "3790178511", name: "Trần Cao Thắng", dob: "2014-07-12", gender: "MALE", phone: "0975288216", fatherName: "Trần Văn Huy", fatherJob: "Kế toán", fatherBirthYear: 1982, motherName: "Vũ Thi Tuyết Nhung", motherJob: "Kế toán" },
  { studentCode: "3790178513", name: "Nguyễn Minh Thư", dob: "2014-01-17", gender: "FEMALE", phone: "0868625785", fatherName: "Nguyễn Đức Thanh", fatherJob: "Lái xe", fatherBirthYear: 1981, motherName: "Nguyễn Thị Minh Thu", motherJob: "Tự do" },
  { studentCode: "3551359921", name: "Lê Xuân Tiến", dob: "2014-09-26", gender: "MALE", phone: "0978939388", fatherName: "Lê Quang Thành", fatherJob: "Nhân viên", fatherBirthYear: 1980, motherName: "Vũ Thị Nguyệt", motherJob: "Nhân viên" },
  { studentCode: "3506435736", name: "Phạm Minh Toàn", dob: "2014-12-22", gender: "MALE", phone: "0974955899", fatherName: "Phạm Văn Nguyên", fatherJob: "Giáo viên", fatherBirthYear: 1968, motherName: "Nguyễn Thị Hạnh", motherJob: "Kế toán" },
  { studentCode: "3790178514", name: "Lê Đức Trung", dob: "2014-06-09", gender: "MALE", phone: "0978515705", fatherName: "Lê Đức Tiến", fatherJob: "Bộ dội", fatherBirthYear: 1984, motherName: "Hoàng Thị Lan Hương", motherJob: "Kế toán" },
  { studentCode: "3550957056", name: "Hà Anh Tuấn", dob: "2014-12-14", gender: "MALE", phone: "0392655031", fatherName: "Hà Ngọc Thương", fatherJob: "Bộ đội", fatherBirthYear: 1972, motherName: "Nguyễn Thị Hạnh Lâm", motherJob: "Giáo viên" },
  { studentCode: "0134549865", name: "Kiều Thụy Vân", dob: "2014-09-28", gender: "FEMALE", phone: "0987626034", fatherName: "Kiều Văn Hải", fatherJob: "Kinh doanh tự do", fatherBirthYear: 1983, motherName: "Nguyễn Thị Hiền", motherJob: "Kinh doanh tự do" },
  { studentCode: "3790178516", name: "Phùng Thị Hoàng Yến", dob: "2014-12-02", gender: "FEMALE", phone: "0978142951", fatherName: "Phùng Quang Tuấn", fatherJob: "Giáo viên", fatherBirthYear: 1975, motherName: "Đới Thị Bình", motherJob: "Giáo viên" },
];

async function main() {
  console.log("Đang khởi tạo Lớp 6A1 và 48 học sinh...");

  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: { name: "Trường THCS Chu Văn An", address: "Hà Nam" },
    });
  }

  let class6A1 = await prisma.classRoom.findFirst({ where: { name: "6A1" } });
  if (!class6A1) {
    class6A1 = await prisma.classRoom.create({
      data: {
        name: "6A1",
        gradeLevel: 6,
        schoolId: school.id,
      },
    });
  }

  const defaultPasswordHash = await bcrypt.hash("123456", 10);
  let createdCount = 0;
  let updatedCount = 0;

  for (const s of studentsData) {
    const email = `hs.${s.studentCode.toLowerCase()}@school.edu.vn`;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: s.name,
          email,
          password: defaultPasswordHash,
          role: "STUDENT",
        },
      });
    }

    const existingStudent = await prisma.student.findFirst({
      where: { OR: [{ userId: user.id }, { studentCode: s.studentCode }] },
    });

    if (existingStudent) {
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          studentCode: s.studentCode,
          classId: class6A1.id,
          dob: new Date(s.dob),
          gender: s.gender as any,
          phone: s.phone,
          ethnicity: "Kinh",
          fatherName: s.fatherName,
          fatherJob: s.fatherJob,
          fatherBirthYear: s.fatherBirthYear,
          motherName: s.motherName,
          motherJob: s.motherJob,
        },
      });
      updatedCount++;
    } else {
      await prisma.student.create({
        data: {
          userId: user.id,
          studentCode: s.studentCode,
          classId: class6A1.id,
          dob: new Date(s.dob),
          gender: s.gender as any,
          phone: s.phone,
          ethnicity: "Kinh",
          fatherName: s.fatherName,
          fatherJob: s.fatherJob,
          fatherBirthYear: s.fatherBirthYear,
          motherName: s.motherName,
          motherJob: s.motherJob,
        },
      });
      createdCount++;
    }
  }

  console.log(`Hoàn tất: Đã tạo mới ${createdCount} và cập nhật ${updatedCount} học sinh cho Lớp 6A1!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
