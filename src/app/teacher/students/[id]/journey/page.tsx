import { notFound } from "next/navigation";
import { fetchStudentJourneyDetails } from "./actions";
import StudentJourneyDetailClient from "./journey-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Chi Tiết Hành Trình Học Sinh | Giáo Viên",
  description: "Phân tích hồi quy tuyến tính, độ biến động và quản trị can thiệp cá nhân hóa",
};

export default async function StudentJourneyPage({ params }: PageProps) {
  const { id } = await params;
  const initialData = await fetchStudentJourneyDetails(id);

  if (!initialData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <StudentJourneyDetailClient initialData={initialData} />
      </div>
    </div>
  );
}
