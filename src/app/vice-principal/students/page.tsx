"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getVPStudents } from "../actions";
import { Search, UserCheck } from "lucide-react";

type VPStudent = Awaited<ReturnType<typeof getVPStudents>>[number];

export default function VPStudentsPage() {
  const { data: session } = useSession();
  const campusId = session?.user?.campusId || "demo-campus";
  const [students, setStudents] = useState<VPStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getVPStudents(campusId);
        setStudents(data);
      } catch (err) {
        console.error("Failed to load students:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [campusId]);

  const filtered = students.filter((s) =>
    s.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentCode && s.studentCode.toLowerCase().includes(search.toLowerCase())) ||
    (s.classRoom?.name && s.classRoom.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Học sinh Phân hiệu</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách và thông tin học sinh theo học tại Phân hiệu
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã HS, lớp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Mã HS</th>
                <th className="px-4 py-3 font-medium">Họ và tên</th>
                <th className="px-4 py-3 font-medium">Lớp</th>
                <th className="px-4 py-3 font-medium">Giới tính</th>
                <th className="px-4 py-3 font-medium">SĐT</th>
                <th className="px-4 py-3 font-medium">Dân tộc</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Đang tải danh sách học sinh...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Không tìm thấy học sinh phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {s.studentCode || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {s.user.name}
                    </td>
                    <td className="px-4 py-3">
                      {s.classRoom ? (
                        <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-semibold">
                          {s.classRoom.name}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.ethnicity || "Kinh"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium">
                        Đang học
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
