"use client";

import { useCallback, useState } from "react";
import {
  confirmPersonnelReview,
  createPersonnelReview,
  editPersonnelReview,
  getPersonnelReviewWorkspace,
  returnPersonnelReview,
  submitPersonnelReview,
} from "@/app/admin/personnel-review/actions";

type Workspace = Awaited<ReturnType<typeof getPersonnelReviewWorkspace>>;
type Review = Workspace["reviews"][number];

function snapshotSummary(review: Review) {
  const snapshot = review.sourceSnapshot as { staff?: unknown[]; classes?: unknown[]; assignments?: unknown[]; warnings?: { message: string; classId: string }[] };
  return {
    staff: snapshot.staff?.length ?? 0,
    classes: snapshot.classes?.length ?? 0,
    assignments: snapshot.assignments?.length ?? 0,
    warnings: snapshot.warnings ?? [],
  };
}

function downloadDraft(review: Review) {
  const content = JSON.stringify({ label: "BẢN NHÁP NỘI BỘ - chưa phải phê duyệt vị trí việc làm hoặc biên chế", title: review.title, period: review.period, campus: review.campus.name, status: review.status, revision: review.revision, sourceSnapshot: review.sourceSnapshot, supplementalTasks: review.supplementalTasks, notes: review.notes, events: review.events }, null, 2);
  const url = URL.createObjectURL(new Blob([content], { type: "application/json;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `ra-soat-noi-bo-${review.period.replace(/[^a-zA-Z0-9-]/g, "-")}-${review.campusId}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReviewWorkspace({ initial }: { initial: Workspace }) {
  const [workspace, setWorkspace] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.reviews[0]?.id ?? "");
  const [notes, setNotes] = useState(initial.reviews[0]?.notes ?? "");
  const [tasks, setTasks] = useState(Array.isArray(initial.reviews[0]?.supplementalTasks) ? initial.reviews[0].supplementalTasks.join("\n") : "");
  const [reason, setReason] = useState("");
  const [newCampusId, setNewCampusId] = useState(initial.campuses[0]?.id ?? "");
  const [newPeriod, setNewPeriod] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (preferredId?: string) => {
    try {
      const data = await getPersonnelReviewWorkspace();
      setWorkspace(data);
      const selected = data.reviews.find((item) => item.id === (preferredId || selectedId)) ?? data.reviews[0];
      setSelectedId(selected?.id ?? "");
      setNotes(selected?.notes ?? "");
      setTasks(Array.isArray(selected?.supplementalTasks) ? selected.supplementalTasks.join("\n") : "");
      setReason("");
      setNewCampusId((current) => current || data.campuses[0]?.id || "");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được hồ sơ rà soát.");
    }
  }, [selectedId]);
  const review = workspace?.reviews.find((item) => item.id === selectedId);

  function selectReview(item: Review) {
    setSelectedId(item.id);
    setNotes(item.notes);
    setTasks(Array.isArray(item.supplementalTasks) ? item.supplementalTasks.join("\n") : "");
    setReason("");
  }

  async function perform(operation: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      const result = await operation();
      await load(typeof result === "string" ? result : undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thực hiện được thao tác.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8 text-slate-800">
    <header className="rounded-2xl bg-slate-900 p-6 text-white">
      <p className="text-sm uppercase tracking-widest text-sky-300">Hồ sơ nội bộ</p>
      <h1 className="mt-2 text-2xl font-bold">Rà soát công việc và nhân sự</h1>
      <p className="mt-2 text-sm text-slate-300">Dữ liệu nguồn được chụp tại lúc tạo hồ sơ. Cảnh báo là mục cần kiểm tra, không phải kết luận sai phạm hay quyết định biên chế.</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-800">{error}</div>}
    {workspace?.role === "ADMIN" && <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="font-semibold">Tạo bản rà soát cho cơ sở</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-4">
        <select aria-label="Cơ sở" className="rounded-lg border p-2" value={newCampusId} onChange={(e) => setNewCampusId(e.target.value)}>{workspace.campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select>
        <input aria-label="Kỳ rà soát" className="rounded-lg border p-2" placeholder="Kỳ rà soát, ví dụ 2026-2027" value={newPeriod} onChange={(e) => setNewPeriod(e.target.value)} />
        <input aria-label="Tên đợt" className="rounded-lg border p-2" placeholder="Tên đợt rà soát" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
        <input aria-label="Hạn hoàn thành" type="date" className="rounded-lg border p-2" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <button disabled={busy || !newCampusId} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => perform(() => createPersonnelReview({ campusId: newCampusId, period: newPeriod, title: newTitle, dueDate }))}>Tạo bản nháp</button>
    </section>}
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <nav aria-label="Danh sách hồ sơ" className="space-y-2 rounded-xl border bg-white p-3">
        <h2 className="px-2 font-semibold">Hồ sơ</h2>
        {workspace?.reviews.length === 0 && <p className="px-2 text-sm text-slate-500">Chưa có hồ sơ trong phạm vi được giao.</p>}
        {workspace?.reviews.map((item) => <button key={item.id} onClick={() => selectReview(item)} className={`w-full rounded-lg p-3 text-left text-sm ${selectedId === item.id ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50"}`}><span className="block font-semibold">{item.campus.name}</span><span>{item.period} · {item.status}</span></button>)}
      </nav>
      {review && <article className="space-y-5 rounded-xl border bg-white p-5 shadow-sm">
        <div><h2 className="text-xl font-semibold">{review.title}</h2><p className="text-sm text-slate-600">{review.campus.name} · {review.period} · Trạng thái {review.status} · Phiên bản {review.revision}</p>{review.returnReason && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-amber-900">Yêu cầu sửa: {review.returnReason}</p>}</div>
        <div className="grid gap-2 sm:grid-cols-3">{Object.entries(snapshotSummary(review)).filter(([key]) => key !== "warnings").map(([key, value]) => <div key={key} className="rounded-lg bg-slate-50 p-3"><span className="block text-xs uppercase text-slate-500">{key === "staff" ? "Nhân sự" : key === "classes" ? "Lớp" : "Phân công"}</span><strong className="text-xl">{String(value)}</strong></div>)}</div>
        <section><h3 className="font-semibold">Mục cần kiểm tra</h3>{snapshotSummary(review).warnings.length ? <ul className="mt-2 list-disc pl-5 text-sm">{snapshotSummary(review).warnings.map((warning) => <li key={warning.classId}>{warning.message} <span className="text-slate-500">(lớp ID: {warning.classId})</span></li>)}</ul> : <p className="text-sm text-slate-500">Chưa có cảnh báo từ bộ quy tắc hiện tại.</p>}</section>
        <section className="space-y-3"><label className="block font-semibold">Công việc bổ sung, mỗi dòng một việc<textarea className="mt-2 min-h-28 w-full rounded-lg border p-3 text-sm" value={tasks} onChange={(e) => setTasks(e.target.value)} disabled={workspace?.role !== "VICE_PRINCIPAL" || !["DRAFT", "RETURNED"].includes(review.status)} /></label><label className="block font-semibold">Ghi chú và giải trình<textarea className="mt-2 min-h-28 w-full rounded-lg border p-3 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={workspace?.role !== "VICE_PRINCIPAL" || !["DRAFT", "RETURNED"].includes(review.status)} /></label></section>
        <div className="flex flex-wrap gap-2">
          {workspace?.role === "VICE_PRINCIPAL" && ["DRAFT", "RETURNED"].includes(review.status) && <><button disabled={busy} className="rounded-lg bg-slate-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => perform(() => editPersonnelReview(review.id, notes, tasks))}>Lưu nháp</button><button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => perform(async () => { await editPersonnelReview(review.id, notes, tasks); await submitPersonnelReview(review.id); })}>Lưu và gửi Hiệu trưởng</button></>}
          {workspace?.role === "ADMIN" && review.status === "SUBMITTED" && <><input aria-label="Lý do trả lại" className="rounded-lg border p-2" placeholder="Lý do trả lại" value={reason} onChange={(e) => setReason(e.target.value)} /><button disabled={busy} className="rounded-lg border border-amber-600 px-4 py-2 text-amber-800 disabled:opacity-50" onClick={() => perform(() => returnPersonnelReview(review.id, reason))}>Trả lại</button><button disabled={busy} className="rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-50" onClick={() => perform(() => confirmPersonnelReview(review.id))}>Xác nhận bản rà soát</button></>}
          <button className="rounded-lg border px-4 py-2" onClick={() => downloadDraft(review)}>Tải bản nháp JSON</button>
        </div>
        <section><h3 className="font-semibold">Lịch sử</h3><ol className="mt-2 space-y-1 text-sm text-slate-600">{review.events.map((event) => <li key={event.id}>{new Date(event.createdAt).toLocaleString("vi-VN")} · {event.action} · {event.toState} · phiên bản {event.revision}{event.comment ? ` · ${event.comment}` : ""}</li>)}</ol></section>
      </article>}
    </div>
  </main>;
}
