"use client";

import { useEffect, useState } from "react";
import {
  getScheduleData,
  getScheduleFormData,
  createScheduleEntry,
  deleteScheduleEntry,
} from "./actions";
import Modal from "@/components/ui/Modal";
import Toast from "@/components/ui/Toast";
import { useEasyMode } from "@/lib/useEasyMode";
import { Info } from "lucide-react";

const DAY_NAMES = ["", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
const PERIOD_LABELS: Record<number, string> = {
  1: "Tiết 1 (7:00)",
  2: "Tiết 2 (7:45)",
  3: "Tiết 3 (8:30)",
  4: "Tiết 4 (9:25)",
  5: "Tiết 5 (13:00)",
  6: "Tiết 6 (13:45)",
  7: "Tiết 7 (14:30)",
  8: "Tiết 8 (15:15)",
};

type ScheduleEntry = {
  id: string;
  dayOfWeek: number;
  period: number;
  room: string | null;
  subject: { name: string };
  teacher: { user: { name: string } };
};

type ClassOption = { id: string; name: string; gradeLevel: number };
type SubjectOption = { id: string; name: string };
type TeacherOption = {
  id: string;
  user: { name: string };
  specialty: string | null;
};

export default function SchedulePage() {
  const { isEasyMode } = useEasyMode();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    period: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    subjectId: "",
    teacherId: "",
    room: "",
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(classId?: string) {
    setLoading(true);
    try {
      const [scheduleData, formOptions] = await Promise.all([
        getScheduleData(classId),
        getScheduleFormData(),
      ]);
      setClasses(scheduleData.classes);
      setSchedules(scheduleData.schedules as ScheduleEntry[]);
      setSelectedClassId(scheduleData.selectedClassId);
      setSubjects(formOptions.subjects);
      setTeachers(formOptions.teachers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleClassChange(classId: string) {
    setSelectedClassId(classId);
    const data = await getScheduleData(classId);
    setSchedules(data.schedules as ScheduleEntry[]);
  }

  function handleCellClick(day: number, period: number) {
    const existing = getEntry(day, period);
    if (existing) return; // Can't add to occupied slot
    setSelectedSlot({ day, period });
    setFormData({ subjectId: "", teacherId: "", room: "" });
    setShowModal(true);
  }

  function getEntry(day: number, period: number) {
    return schedules.find(
      (s) => s.dayOfWeek === day && s.period === period
    );
  }

  async function handleSubmit() {
    if (!selectedSlot || !formData.subjectId || !formData.teacherId) {
      setToast({ message: "Vui lòng chọn môn học và giáo viên", type: "error" });
      return;
    }

    const result = await createScheduleEntry({
      classId: selectedClassId,
      subjectId: formData.subjectId,
      teacherId: formData.teacherId,
      dayOfWeek: selectedSlot.day,
      period: selectedSlot.period,
      room: formData.room || undefined,
    });

    if (result.error) {
      setToast({ message: result.error, type: "error" });
      return;
    }

    setToast({ message: "Đã thêm tiết học", type: "success" });
    setShowModal(false);
    const data = await getScheduleData(selectedClassId);
    setSchedules(data.schedules as ScheduleEntry[]);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa tiết học này?")) return;
    await deleteScheduleEntry(id);
    setToast({ message: "Đã xóa tiết học", type: "success" });
    const data = await getScheduleData(selectedClassId);
    setSchedules(data.schedules as ScheduleEntry[]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Thời khóa biểu</h1>
        <select
          value={selectedClassId}
          onChange={(e) => handleClassChange(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} (Khối {cls.gradeLevel})
            </option>
          ))}
        </select>
      </div>

      {isEasyMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-900 text-xs shadow-sm">
          <Info className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-bold">Trợ giúp Sắp xếp Thời khóa biểu:</p>
            <p>1. Chọn Lớp học muốn xem hoặc phân lịch ở danh sách thả xuống (góc trên bên phải).</p>
            <p>2. Nhấn vào các ô trống có dấu <strong>"+"</strong> trên bảng tương ứng với Thứ và Tiết mà bạn muốn xếp lịch.</p>
            <p>3. Trong khung hiện lên, hãy chọn <strong>Môn học</strong> và <strong>Giáo viên giảng dạy</strong>, sau đó nhấn <strong>Thêm tiết học</strong>.</p>
            <p>4. Nếu muốn xóa hoặc thay đổi tiết học đã xếp, hãy đưa chuột vào ô đó và bấm nút dấu <strong>"×"</strong> màu đỏ ở góc ô.</p>
          </div>
        </div>
      )}

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
          <p className="text-4xl mb-2"></p>
          <p>Chưa có lớp học nào. Hãy tạo lớp học trước.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-blue-50">
                <th className="border p-3 text-sm font-semibold text-gray-600 w-28">
                  Tiết
                </th>
                {[2, 3, 4, 5, 6, 7].map((day) => (
                  <th
                    key={day}
                    className="border p-3 text-sm font-semibold text-gray-600"
                  >
                    {DAY_NAMES[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period} className={period === 5 ? "border-t-4 border-t-blue-200" : ""}>
                  <td className="border p-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
                    {PERIOD_LABELS[period]}
                  </td>
                  {[2, 3, 4, 5, 6, 7].map((day) => {
                    const entry = getEntry(day, period);
                    return (
                      <td
                        key={day}
                        className={`border p-1 text-center cursor-pointer transition-colors ${
                          entry
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "hover:bg-green-50"
                        }`}
                        onClick={() =>
                          entry ? undefined : handleCellClick(day, period)
                        }
                      >
                        {entry ? (
                          <div className="relative group">
                            <div className="text-sm font-semibold text-blue-700">
                              {entry.subject.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.teacher.user.name}
                            </div>
                            {entry.room && (
                              <div className="text-xs text-gray-400">
                                P.{entry.room}
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(entry.id);
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              title="Xóa"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="text-gray-300 text-lg">+</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          selectedSlot
            ? `Thêm tiết học — ${DAY_NAMES[selectedSlot.day]}, ${PERIOD_LABELS[selectedSlot.period]}`
            : "Thêm tiết học"
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Môn học *
            </label>
            <select
              value={formData.subjectId}
              onChange={(e) =>
                setFormData({ ...formData, subjectId: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Chọn môn học —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giáo viên *
            </label>
            <select
              value={formData.teacherId}
              onChange={(e) =>
                setFormData({ ...formData, teacherId: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Chọn giáo viên —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name} {t.specialty ? `(${t.specialty})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phòng học
            </label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) =>
                setFormData({ ...formData, room: e.target.value })
              }
              placeholder="VD: A101"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Thêm tiết học
            </button>
          </div>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
