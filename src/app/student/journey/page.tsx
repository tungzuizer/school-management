import { fetchCurrentStudentJourney } from "./actions";
import StudentJourneyViewClient from "./journey-client";
import Link from "next/link";
import { Compass } from "lucide-react";

export const metadata = {
  title: "Hành Trình Học Tập Của Tôi | Học Sinh & Phụ Huynh",
  description: "Theo dõi quá trình tiến bộ học tập, phong độ thi cử và kế hoạch đồng hành",
};

export default async function StudentJourneyPage() {
  const initialData = await fetchCurrentStudentJourney();

  if (!initialData) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Chưa tìm thấy thông tin học sinh</h2>
        <p className="text-sm text-slate-400 mt-2 max-w-md">
          Vui lòng đăng nhập bằng tài khoản học sinh hoặc liên hệ ban giám hiệu nhà trường để được hỗ trợ đồng bộ dữ liệu.
        </p>
        <Link
          href="/"
          className="mt-6 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg"
        >
          Trở về Trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <StudentJourneyViewClient initialData={initialData} />
    </div>
  );
}
