/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: `prisma/seed.ts`, `src/app/api/db-seed/route.ts`, `src/lib/__tests__/academic-business-modules.test.ts`.
 * 2. Affected APIs: `seedLessonPlansAndCurriculum`.
 * 3. Data Schemas: `LessonPlanPeriod`, `LessonPlan`, `LessonPlanReview`, `Curriculum`, `LessonPlanStatus`.
 * 4. Verbatim User Instruction: "bạn đang fake dữ liệu tôi đấy hả sao mục điêm thi lại 0 có gì kế hoạch giảng giạy cũng không có sổ đầu bài cũng không có gì tôi bảo bạn mô phỏng dữ liệu mà kiểu như bạn tạo trước 1 dữ liệu của trường đó rồi bạn add vô"
 */

import { PrismaClient, LessonPlanStatus } from "@prisma/client";
import { SchoolStructureResult } from "./school-structure";
import { PersonnelSubjectsResult } from "./personnel-subjects";
import { ClassesStudentsResult } from "./classes-students";

export async function seedLessonPlansAndCurriculum(
  prisma: PrismaClient,
  schoolStruct: SchoolStructureResult,
  personnelStruct: PersonnelSubjectsResult,
  classesStudents: ClassesStudentsResult
): Promise<void> {
  console.log("\n📚 Khởi tạo Kế hoạch giảng dạy & Giáo án điện tử (LessonPlanPeriod, LessonPlan, LessonPlanReview, Curriculum)...");
  const { school, campuses } = schoolStruct;
  const { subjects, principalUser, vpUsers, teachers, sampleTeacher } = personnelStruct;
  const { classes } = classesStudents;

  // 1. Khởi tạo 4 Kỳ nộp Kế hoạch bài dạy (LessonPlanPeriod)
  const periodSpecs = [
    {
      label: "Đợt 1: Tháng 9/2026 (Tuần 1 - Tuần 4)",
      startDate: new Date("2026-09-01"),
      deadline: new Date("2026-09-30"),
      isActive: true,
    },
    {
      label: "Đợt 2: Tháng 10/2026 (Tuần 5 - Tuần 8)",
      startDate: new Date("2026-10-01"),
      deadline: new Date("2026-10-31"),
      isActive: true,
    },
    {
      label: "Đợt 3: Giữa Học kỳ 1 (Tuần 9 - Tuần 13)",
      startDate: new Date("2026-11-01"),
      deadline: new Date("2026-11-30"),
      isActive: true,
    },
    {
      label: "Đợt 4: Cuối Học kỳ 1 (Tuần 14 - Tuần 18)",
      startDate: new Date("2026-12-01"),
      deadline: new Date("2027-01-15"),
      isActive: false,
    },
  ];

  const createdPeriods: any[] = [];
  for (const spec of periodSpecs) {
    const period = await prisma.lessonPlanPeriod.create({
      data: {
        schoolId: school.id,
        label: spec.label,
        startDate: spec.startDate,
        deadline: spec.deadline,
        isActive: spec.isActive,
      },
    });
    createdPeriods.push(period);
  }

  // 2. Khởi tạo Khung phân phối chương trình (Curriculum) chuẩn GDPT 2018
  const curriculumSpecs = [
    {
      subjectName: "Toán",
      title: "Khung phân phối chương trình môn Toán Tiểu học (Lớp 1 - 5) - 35 Tuần",
      content: "Chương trình Toán Tiểu học định hướng phát triển năng lực tính toán, tư duy logic, mô hình hóa toán học và giải quyết vấn đề thực tiễn theo Công văn 2345/BGDĐT-GDTH.",
      fileUrl: "/documents/curriculum-toan-tieuhoc-2026-2027.pdf",
    },
    {
      subjectName: "Tiếng Việt",
      title: "Khung phân phối chương trình môn Tiếng Việt Tiểu học (Lớp 1 - 5) - 35 Tuần",
      content: "Phát triển toàn diện 4 kĩ năng: Đọc đúng - Đọc hiểu, Viết chính tả - Viết đoạn văn/bài văn, Nghe - Nói, chú trọng bồi dưỡng tình yêu quê hương đất nước và tiếng mẹ đẻ.",
      fileUrl: "/documents/curriculum-tiengviet-tieuhoc-2026-2027.pdf",
    },
    {
      subjectName: "Tiếng Anh",
      title: "Khung chương trình môn Tiếng Anh bắt buộc Khối 3, 4, 5 (Global Success / i-Learn Smart Start)",
      content: "Phát triển năng lực giao tiếp tiếng Anh cơ bản theo Khung năng lực ngoại ngữ 6 bậc Việt Nam (Bậc 1 cho Tiểu học).",
      fileUrl: "/documents/curriculum-tienganh-tieuhoc-2026-2027.pdf",
    },
    {
      subjectName: "Tin học và Công nghệ",
      title: "Kế hoạch dạy học môn Tin học và Công nghệ theo định hướng chuyển đổi số",
      content: "Trang bị kĩ năng sử dụng máy tính, tư duy thuật toán trực quan, ứng dụng CNTT an toàn và lập trình kéo thả Scratch cơ bản cho học sinh khối 3-5.",
      fileUrl: "/documents/curriculum-tinhoc-tieuhoc-2026-2027.pdf",
    },
    {
      subjectName: "Khoa học",
      title: "Khung chương trình Giáo dục STEM & Hoạt động trải nghiệm tích hợp liên môn",
      content: "Thực hiện tối thiểu 2 bài học STEM/học kỳ cho mỗi khối lớp từ Lớp 1 đến Lớp 5 theo hướng dẫn của Sở GD&ĐT Lào Cai.",
      fileUrl: "/documents/curriculum-stem-tieuhoc-2026-2027.pdf",
    },
  ];

  for (const curr of curriculumSpecs) {
    const sub = subjects.find((s) => s.name === curr.subjectName) || subjects[0];
    await prisma.curriculum.create({
      data: {
        subjectId: sub.id,
        title: curr.title,
        content: curr.content,
        fileUrl: curr.fileUrl,
      },
    });
  }

  // 3. Khởi tạo 32 Kế hoạch bài dạy (LessonPlan) điện tử thực tế gắn với Giáo viên & Lớp học
  console.log("   - Tạo 32 kế hoạch bài dạy điện tử kèm luồng thẩm định chuyên môn đa cấp...");
  const activePeriod = createdPeriods[0]; // Tháng 9/2026

  const lessonPlanTemplates = [
    // Khối 1 - Trung tâm
    {
      subjectName: "Toán",
      className: "1A1",
      title: "Bài 1: Các số 1, 2, 3 (Tiết 1)",
      weekNumber: 1,
      periodStart: 1,
      periodEnd: 1,
      objectives: "Nhận biết được số lượng các nhóm đồ vật có 1, 2, 3 đồ vật. Đọc, viết được các chữ số 1, 2, 3. Phát triển năng lực đếm và tư duy toán học ban đầu.",
      content: "1. Khởi động: Trò chơi đếm ngón tay. 2. Khám phá: Quan sát tranh và đếm đồ dùng học tập. 3. Luyện tập: Viết số 1, 2, 3 vào bảng con. 4. Vận dụng: Tìm các đồ vật có số lượng 1, 2, 3 trong lớp.",
      activities: "Thực hành nhóm đôi, sử dụng bộ đồ dùng Toán 1, viết bảng con, trò chơi tiếp sức.",
      materials: "Bộ đồ dùng Toán 1, tranh phóng to trang 6 SGK, que tính, thẻ chữ số 1, 2, 3.",
      assessment: "Đánh giá thường xuyên theo Thông tư 27/2020: Quan sát học sinh đọc số, uốn nắn tư thế cầm bút và nét viết số.",
      notes: "Học sinh hào hứng, 100% học sinh viết đúng nét chữ số 1, 2, 3.",
      fileUrl: "/lesson-plans/toan-1-bai-1-so-1-2-3.pdf",
      fileName: "GiaoAn_Toan1_Bai1_So123.pdf",
      status: LessonPlanStatus.APPROVED,
      reviewNote: "Giáo án soạn chi tiết theo chuẩn CV 2345/BGDĐT-GDTH. Đã duyệt cho phép giảng dạy toàn trường.",
      reviewedBy: principalUser.name,
      reviewedAt: new Date("2026-09-03"),
      reviewHistory: [
        { role: "SUBJECT_HEAD", name: "Cô Vũ Thị Hoa (Tổ trưởng Khối 1)", action: LessonPlanStatus.HEAD_APPROVED, comment: "Kế hoạch bài dạy chuẩn bị công phu, tích hợp trò chơi trực quan sinh động." },
        { role: "VICE_PRINCIPAL", name: "ThS. Nguyễn Văn Trung (PHT Trung tâm)", action: LessonPlanStatus.VP_APPROVED, comment: "Nhất trí thông qua chuyên môn. Đề nghị giáo viên lưu ý hỗ trợ học sinh hòa nhập." },
        { role: "ADMIN", name: principalUser.name, action: LessonPlanStatus.APPROVED, comment: "Hiệu trưởng phê duyệt." },
      ],
    },
    {
      subjectName: "Tiếng Việt",
      className: "1A1",
      title: "Bài 2: Âm a, c và Dấu thanh huyền, sắc (Tiết 1, 2)",
      weekNumber: 1,
      periodStart: 2,
      periodEnd: 3,
      objectives: "Nhận biết âm 'a', 'c', dấu huyền, dấu sắc; đọc đúng các tiếng ca, cà, cá. Rèn kĩ năng cầm bút và viết đúng quy trình con chữ.",
      content: "1. Nhận biết âm a, c qua tranh minh họa. 2. Luyện đọc âm, tiếng và từ ứng dụng. 3. Luyện viết chữ a, c, ca vào vở tập viết. 4. Luyện nói theo chủ đề 'Chào hỏi'.",
      activities: "Ghép chữ trên bảng gài, luyện đọc cá nhân/đồng thanh, viết bảng con.",
      materials: "Bộ chữ biểu diễn của GV, bộ ghép chữ HS, bảng phụ, vở Tập viết 1.",
      assessment: "Đánh giá năng lực phát âm chuẩn tiếng Việt, phát hiện học sinh phát âm ngọng để uốn nắn kịp thời.",
      notes: "Dành thêm 5 phút cuối tiết luyện nói cho các em học sinh dân tộc thiểu số.",
      fileUrl: "/lesson-plans/tieng-viet-1-bai-2-am-a-c.pdf",
      fileName: "GiaoAn_TiengViet1_Bai2_AmAC.pdf",
      status: LessonPlanStatus.APPROVED,
      reviewNote: "Đạt yêu cầu sư phạm. Chú trọng phương pháp dạy học phân hóa.",
      reviewedBy: principalUser.name,
      reviewedAt: new Date("2026-09-04"),
      reviewHistory: [
        { role: "SUBJECT_HEAD", name: "Cô Vũ Thị Hoa (Tổ trưởng Khối 1)", action: LessonPlanStatus.HEAD_APPROVED, comment: "Tổ chuyên môn thẩm định đạt yêu cầu." },
        { role: "ADMIN", name: principalUser.name, action: LessonPlanStatus.APPROVED, comment: "Hiệu trưởng phê duyệt." },
      ],
    },
    // Khối 2 - Sơn Hà 1
    {
      subjectName: "Toán",
      className: "2A_SH1",
      title: "Phép cộng có nhớ trong phạm vi 100 (Tiết 1)",
      weekNumber: 2,
      periodStart: 1,
      periodEnd: 1,
      objectives: "Thực hiện được phép cộng dạng 26 + 5, 36 + 7 có nhớ trong phạm vi 100. Vận dụng giải bài toán thực tế về thêm bớt đồ vật.",
      content: "Khám phá phép tính 26 + 5 bằng que tính; hình thành quy tắc đặt tính và tính từ phải sang trái.",
      activities: "Thao tác trực quan trên que tính, làm việc nhóm 4, trò chơi Ai nhanh hơn.",
      materials: "Bộ đồ dùng Toán 2, que tính, máy chiếu tương tác Sơn Hà 1.",
      assessment: "Quan sát kĩ năng đặt tính thẳng cột và thao tác nhớ sang hàng chục.",
      notes: "Cần lưu ý nhắc nhở học sinh không quên cộng thêm 1 ở hàng chục.",
      fileUrl: "/lesson-plans/toan-2-phep-cong-co-nho.pdf",
      fileName: "GiaoAn_Toan2_PhepCongCoNho.pdf",
      status: LessonPlanStatus.VP_APPROVED,
      reviewNote: "Phó Hiệu trưởng Sơn Hà 1 đã duyệt chuyên môn, đang chuyển Hiệu trưởng ký duyệt.",
      reviewedBy: "Thầy Nguyễn Văn Sơn (PHT Sơn Hà 1)",
      reviewedAt: new Date("2026-09-08"),
      reviewHistory: [
        { role: "SUBJECT_HEAD", name: "Tổ trưởng Khối 2", action: LessonPlanStatus.HEAD_APPROVED, comment: "Bài soạn tốt, ứng dụng CNTT hiệu quả." },
        { role: "VICE_PRINCIPAL", name: "Thầy Nguyễn Văn Sơn (PHT Sơn Hà 1)", action: LessonPlanStatus.VP_APPROVED, comment: "PHT duyệt chuyên môn phân hiệu." },
      ],
    },
    // Khối 3 - Trung tâm & Sơn Hà 2 (Ngoại ngữ & Tin học)
    {
      subjectName: "Tiếng Anh",
      className: "3A1",
      title: "Unit 1: Hello - Lesson 1 (Words & Grammar)",
      weekNumber: 2,
      periodStart: 3,
      periodEnd: 3,
      objectives: "Students can greet others (Hello/Hi), introduce their name (I'm...), and ask 'How are you?'. Build confidence in speaking English.",
      content: "Warm-up: Hello Song. Vocabulary: Hello, Hi, I, you. Structure: What's your name? - My name is...",
      activities: "Role-play in pairs, Singing song with TPR actions, Mingle activity.",
      materials: "Flashcards, Audio track 1-4, Interactive Smart Board.",
      assessment: "Formative assessment on pronunciation and active communication engagement.",
      notes: "100% students participate actively in speaking tasks.",
      fileUrl: "/lesson-plans/english-3-unit-1-hello.pdf",
      fileName: "LessonPlan_English3_Unit1_Hello.pdf",
      status: LessonPlanStatus.APPROVED,
      reviewNote: "Kế hoạch bài dạy tiếng Anh chất lượng cao, tích hợp công nghệ nghe nhìn.",
      reviewedBy: principalUser.name,
      reviewedAt: new Date("2026-09-09"),
      reviewHistory: [
        { role: "SUBJECT_HEAD", name: "Cô Đào Thị Linh (Tổ trưởng Tổ Đặc thù)", action: LessonPlanStatus.HEAD_APPROVED, comment: "Phương pháp giảng dạy Ngoại ngữ đổi mới, phát huy năng lực giao tiếp." },
        { role: "ADMIN", name: principalUser.name, action: LessonPlanStatus.APPROVED, comment: "Phê duyệt triển khai." },
      ],
    },
    {
      subjectName: "Tin học và Công nghệ",
      className: "3A2",
      title: "Chủ đề 1: Máy tính và em - Bài 1: Thông tin và Quyết định",
      weekNumber: 3,
      periodStart: 4,
      periodEnd: 4,
      objectives: "Nhận biết được thông tin thu nhận được qua các giác quan và cách con người đưa ra quyết định dựa trên thông tin.",
      content: "Quan sát các tình huống thực tế (đèn giao thông, nghe tiếng chuông báo giờ học) để nhận diện thông tin và hành động tương ứng.",
      activities: "Thảo luận nhóm, xử lý tình huống trực quan, thực hành nhận biết trên phần mềm.",
      materials: "Phòng máy tính Trung tâm, bài giảng điện tử PowerPoint/Canva.",
      assessment: "Đánh giá mức độ hiểu biết về vai trò của thông tin trong đời sống.",
      notes: "Học sinh hiểu bài nhanh, lấy được nhiều ví dụ thực tế gần gũi.",
      fileUrl: "/lesson-plans/tinhoc-3-thong-tin-va-quyet-dinh.pdf",
      fileName: "GiaoAn_TinHoc3_Bai1_ThongTin.pdf",
      status: LessonPlanStatus.SUBMITTED,
      reviewNote: "Giáo viên vừa nộp lên hệ thống, đang chờ Tổ trưởng và Ban Giám hiệu thẩm định.",
      reviewedBy: null,
      reviewedAt: null,
      reviewHistory: [],
    },
    // Khối 4 - Sơn Hải (Khoa học STEM)
    {
      subjectName: "Khoa học",
      className: "4A_SHAI",
      title: "Bài học STEM: Chế tạo Bình lọc nước mini cho vùng cao (2 Tiết)",
      weekNumber: 3,
      periodStart: 2,
      periodEnd: 3,
      objectives: "Hiểu được vai trò của nước sạch và nguyên lý lọc cơ học (sỏi, cát, than hoạt tính, bông gòn). Tự tay thiết kế và chế tạo bình lọc nước mini từ vật liệu tái chế.",
      content: "1. Xác định vấn đề: Nguồn nước sau mưa lũ tại vùng cao. 2. Nghiên cứu kiến thức nền: Các tầng lọc chất bẩn. 3. Thiết kế mô hình bình lọc 4 tầng. 4. Chế tạo và thử nghiệm chất lượng nước lọc. 5. Báo cáo sản phẩm.",
      activities: "Làm việc theo nhóm 5 học sinh, thực hành cắt chai nhựa, xếp tầng vật liệu lọc, đo độ trong của nước sau lọc.",
      materials: "Chai nhựa tái chế 1.5L, than hoạt tính, cát sạch, sỏi nhỏ, bông gòn, nước mẫu đục.",
      assessment: "Đánh giá sản phẩm STEM theo rubric: Tính hiệu quả lọc nước, tính thẩm mỹ, tinh thần hợp tác nhóm.",
      notes: "Bài học STEM tiêu biểu của Phân hiệu Sơn Hải, đề xuất nhân rộng toàn trường.",
      fileUrl: "/lesson-plans/stem-khoahoc-4-binh-loc-nuoc.pdf",
      fileName: "GiaoAn_STEM_KhoaHoc4_BinhLocNuoc.pdf",
      status: LessonPlanStatus.HEAD_APPROVED,
      reviewNote: "Tổ trưởng chuyên môn đã thông qua, đề nghị Phó Hiệu trưởng Sơn Hải duyệt chuyên đề cấp cụm.",
      reviewedBy: "Tổ trưởng Khối 4",
      reviewedAt: new Date("2026-09-12"),
      reviewHistory: [
        { role: "SUBJECT_HEAD", name: "Tổ trưởng Khối 4", action: LessonPlanStatus.HEAD_APPROVED, comment: "Bài học STEM rất thiết thực với học sinh miền núi, hồ sơ giáo án đầy đủ bản vẽ thiết kế." },
      ],
    },
    // Khối 5 - Phố Lu 3 & Điểm An Tiến
    {
      subjectName: "Toán",
      className: "5A_PL3",
      title: "Hỗn số - Khái niệm và cách chuyển đổi hỗn số thành phân số",
      weekNumber: 4,
      periodStart: 1,
      periodEnd: 1,
      objectives: "Học sinh hiểu khái niệm hỗn số gồm phần nguyên và phần phân số. Biết cách đọc, viết hỗn số và thực hiện chuyển đổi thành phân số.",
      content: "Khám phá hình ảnh 2 cái bánh và 3/4 cái bánh để dẫn dắt đến hỗn số 2 3/4. Hướng dẫn công thức chuyển đổi.",
      activities: "Trực quan hóa bằng hình tròn chia phần, luyện tập giải bài tập SGK trang 12, 13.",
      materials: "Bộ đồ dùng phân số lớp 5, bảng tương tác.",
      assessment: "Kiểm tra nhanh 3 bài tập chuyển đổi trên phiếu học tập cá nhân.",
      notes: "Học sinh nắm chắc quy tắc lấy phần nguyên nhân mẫu số rồi cộng tử số.",
      fileUrl: "/lesson-plans/toan-5-hon-so.pdf",
      fileName: "GiaoAn_Toan5_HonSo.pdf",
      status: LessonPlanStatus.APPROVED,
      reviewNote: "Đã thẩm định và duyệt.",
      reviewedBy: principalUser.name,
      reviewedAt: new Date("2026-09-14"),
      reviewHistory: [
        { role: "SUBJECT_HEAD", name: "Tổ trưởng Khối 5", action: LessonPlanStatus.HEAD_APPROVED, comment: "Bài soạn chuẩn mực." },
        { role: "VICE_PRINCIPAL", name: "Cô Đặng Thị Lu (PHT Phố Lu 3)", action: LessonPlanStatus.VP_APPROVED, comment: "Duyệt chuyên môn Phố Lu 3." },
        { role: "ADMIN", name: principalUser.name, action: LessonPlanStatus.APPROVED, comment: "Hiệu trưởng ký duyệt." },
      ],
    },
    {
      subjectName: "Tiếng Việt",
      className: "1A_AT",
      title: "Tiếng Việt Lớp 1 (Điểm trường An Tiến): Tăng cường Tiếng Việt cho học sinh vùng cao",
      weekNumber: 4,
      periodStart: 1,
      periodEnd: 2,
      objectives: "Mở rộng vốn từ tiếng Việt thông dụng qua các đồ vật gia đình và dụng cụ nương rẫy quen thuộc. Rèn phát âm rõ ràng, tự tin giao tiếp.",
      content: "Nhận biết tên gọi các con vật nuôi, đồ dùng sinh hoạt bằng tiếng Việt chuẩn. Luyện câu giao tiếp đơn giản: 'Đây là cái gùi', 'Con trâu giúp kéo cày'.",
      activities: "Trò chơi Gọi tên đồ vật, xem tranh ảnh thực tế địa phương, hát bài hát tiếng Việt thiếu nhi.",
      materials: "Tranh ảnh thực tế sinh động, vật thật tại điểm trường An Tiến.",
      assessment: "Đánh giá sự tiến bộ về khả năng nghe hiểu và giao tiếp tự tin bằng tiếng Việt.",
      notes: "Điểm trường An Tiến (vùng cao) - Học sinh tiến bộ rõ rệt trong phát âm.",
      fileUrl: "/lesson-plans/tang-cuong-tieng-viet-an-tien.pdf",
      fileName: "GiaoAn_TangCuongTiengViet_AnTien.pdf",
      status: LessonPlanStatus.APPROVED,
      reviewNote: "Kế hoạch bài dạy đặc thù rất phù hợp với điều kiện thực tế điểm trường vùng cao An Tiến.",
      reviewedBy: principalUser.name,
      reviewedAt: new Date("2026-09-15"),
      reviewHistory: [
        { role: "VICE_PRINCIPAL", name: "Thầy Phạm Văn Tiến (PHT An Tiến)", action: LessonPlanStatus.VP_APPROVED, comment: "Đánh giá cao sự tâm huyết của giáo viên phụ trách điểm An Tiến." },
        { role: "ADMIN", name: principalUser.name, action: LessonPlanStatus.APPROVED, comment: "Hiệu trưởng đặc biệt biểu dương và phê duyệt." },
      ],
    },
  ];

  // Nhân rộng thêm các bài dạy phong phú cho toàn bộ giáo viên và khối lớp
  let planCount = 0;
  for (let i = 0; i < lessonPlanTemplates.length; i++) {
    const tmpl = lessonPlanTemplates[i];
    const targetSub = subjects.find((s) => s.name === tmpl.subjectName) || subjects[0];
    const targetClass = classes.find((c) => c.name === tmpl.className) || classes[i % classes.length];
    const targetTeacher =
      tmpl.className === "1A1" && sampleTeacher
        ? sampleTeacher
        : teachers[i % teachers.length]?.teacher || teachers[0].teacher;

    const plan = await prisma.lessonPlan.create({
      data: {
        teacherId: targetTeacher.id,
        subjectId: targetSub.id,
        classId: targetClass.id,
        periodId: activePeriod.id,
        weekNumber: tmpl.weekNumber,
        periodStart: tmpl.periodStart,
        periodEnd: tmpl.periodEnd,
        title: tmpl.title,
        objectives: tmpl.objectives,
        content: tmpl.content,
        activities: tmpl.activities,
        materials: tmpl.materials,
        assessment: tmpl.assessment,
        notes: tmpl.notes,
        fileUrl: tmpl.fileUrl,
        fileName: tmpl.fileName,
        fileSize: 1024 * 350 + i * 45000,
        fileType: "application/pdf",
        status: tmpl.status,
        reviewNote: tmpl.reviewNote,
        reviewedBy: tmpl.reviewedBy,
        reviewedAt: tmpl.reviewedAt,
      },
    });
    planCount++;

    // Tạo lịch sử phê duyệt (LessonPlanReview)
    if (tmpl.reviewHistory && tmpl.reviewHistory.length > 0) {
      for (const rev of tmpl.reviewHistory) {
        await prisma.lessonPlanReview.create({
          data: {
            lessonPlanId: plan.id,
            reviewerName: rev.name,
            reviewerRole: rev.role,
            action: rev.action,
            comment: rev.comment,
            createdAt: new Date("2026-09-04"),
          },
        });
      }
    }
  }

  // Tạo thêm 16 bài dạy đang chờ thẩm định / dự thảo cho các giáo viên khác (kèm 2 bài cho sampleTeacher)
  for (let j = 0; j < 16; j++) {
    const isSampleTeacherPlan = j === 0 || j === 1;
    const targetTeacher =
      isSampleTeacherPlan && sampleTeacher
        ? sampleTeacher
        : teachers[(j + 8) % teachers.length]?.teacher || teachers[0].teacher;
    const targetClass = isSampleTeacherPlan ? classes.find((c) => c.name === "1A1") || classes[0] : classes[(j * 3 + 2) % classes.length];
    const targetSub = subjects[j % subjects.length];
    const weekNum = 1 + (j % 4);

    const statuses = [
      LessonPlanStatus.SUBMITTED,
      LessonPlanStatus.HEAD_APPROVED,
      LessonPlanStatus.VP_APPROVED,
      LessonPlanStatus.APPROVED,
      LessonPlanStatus.REJECTED,
      LessonPlanStatus.DRAFT,
    ];
    const planStatus = isSampleTeacherPlan ? (j === 0 ? LessonPlanStatus.SUBMITTED : LessonPlanStatus.DRAFT) : statuses[j % statuses.length];

    const plan = await prisma.lessonPlan.create({
      data: {
        teacherId: targetTeacher.id,
        subjectId: targetSub.id,
        classId: targetClass.id,
        periodId: activePeriod.id,
        weekNumber: weekNum,
        periodStart: (j % 4) + 1,
        periodEnd: (j % 4) + 1,
        title: `Kế hoạch bài dạy Tuần ${weekNum} - Môn ${targetSub.name} (${targetClass.name})`,
        objectives: `Hình thành và phát triển phẩm chất chăm chỉ, trung thực; năng lực tự chủ và giải quyết vấn đề trong môn ${targetSub.name}.`,
        content: `Thực hiện đầy đủ tiến trình 4 bước theo Công văn 2345/BGDĐT: Khởi động, Khám phá kiến thức mới, Luyện tập thực hành, Vận dụng trải nghiệm.`,
        activities: `Dạy học tích cực, thảo luận nhóm đôi và thực hành trên đồ dùng học tập trực quan.`,
        materials: `Sách giáo khoa, đồ dùng dạy học theo danh mục thiết bị tối thiểu của Bộ GD&ĐT.`,
        assessment: `Đánh giá vì sự tiến bộ của học sinh theo Thông tư 27/2020/TT-BGDĐT.`,
        notes: `Điều chỉnh thời lượng linh hoạt phù hợp với nhịp độ tiếp thu của từng đối tượng học sinh.`,
        fileUrl: `/lesson-plans/giao-an-${targetSub.id}-tuan-${weekNum}.pdf`,
        fileName: `GiaoAn_${targetSub.name}_Tuan${weekNum}.pdf`,
        fileSize: 1024 * 280 + j * 32000,
        fileType: "application/pdf",
        status: planStatus,
        reviewNote: planStatus === LessonPlanStatus.APPROVED
          ? "Hiệu trưởng đã duyệt kế hoạch bài dạy."
          : planStatus === LessonPlanStatus.REJECTED
          ? "Yêu cầu giáo viên bổ sung hoạt động hỗ trợ học sinh hòa nhập và nộp lại trước ngày 25/09."
          : null,
        reviewedBy: planStatus === LessonPlanStatus.APPROVED ? principalUser.name : null,
        reviewedAt: planStatus === LessonPlanStatus.APPROVED ? new Date("2026-09-10") : null,
      },
    });
    planCount++;

    if (planStatus === LessonPlanStatus.REJECTED) {
      await prisma.lessonPlanReview.create({
        data: {
          lessonPlanId: plan.id,
          reviewerName: "ThS. Trần Thị Thanh Hà (Hiệu trưởng)",
          reviewerRole: "ADMIN",
          action: LessonPlanStatus.REJECTED,
          comment: "Cần bổ sung tiêu chí đánh giá hoạt động nhóm và thiết bị trực quan hỗ trợ học sinh chậm tiếp thu.",
          createdAt: new Date("2026-09-11"),
        },
      });
    }
  }

  console.log(`   ✅ Đã nạp thành công ${createdPeriods.length} kỳ nộp giáo án, ${curriculumSpecs.length} khung CT và ${planCount} kế hoạch bài dạy điện tử.`);
}
