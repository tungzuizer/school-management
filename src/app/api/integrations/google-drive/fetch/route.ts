import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchGoogleDriveBuffer, parseGoogleDriveUrl } from "@/lib/google-drive";
import {
  parseSpreadsheetBuffer,
  mapRowsToStudents,
  mapRowsToTeachers,
  mapRowsToClasses,
  mapRowsToSubjectGroups,
  mapRowsToSchedules,
} from "@/lib/excel-parser";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Bạn cần đăng nhập để thực hiện thao tác này." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { driveUrl, targetType } = body;

    if (!driveUrl || typeof driveUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp đường dẫn tệp Google Drive." },
        { status: 400 }
      );
    }

    const driveInfo = parseGoogleDriveUrl(driveUrl);
    if (!driveInfo) {
      return NextResponse.json(
        { success: false, error: "Đường dẫn Google Drive không đúng định dạng." },
        { status: 400 }
      );
    }

    // Fetch binary/CSV buffer from Google Drive
    const { buffer, isSheet } = await fetchGoogleDriveBuffer(driveUrl);

    // If importing Evidence file (binary document like PDF, DOCX, etc.)
    if (targetType === "EVIDENCE") {
      return NextResponse.json({
        success: true,
        targetType,
        isSheet,
        fileId: driveInfo.fileId,
        sizeBytes: buffer.length,
        message: "Tệp Google Drive đã được xác thực thành công.",
      });
    }

    // Parse spreadsheet rows
    const rawRows = parseSpreadsheetBuffer(buffer);
    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tệp Google Sheet không chứa dữ liệu hoặc tiêu đề không được định dạng đúng.",
        },
        { status: 422 }
      );
    }

    let parsedData: any[] = [];
    if (targetType === "TEACHERS") {
      parsedData = mapRowsToTeachers(rawRows);
    } else if (targetType === "CLASSES") {
      parsedData = mapRowsToClasses(rawRows);
    } else if (targetType === "SUBJECT_GROUPS") {
      parsedData = mapRowsToSubjectGroups(rawRows);
    } else if (targetType === "SCHEDULES") {
      parsedData = mapRowsToSchedules(rawRows);
    } else {
      // Default: STUDENTS
      parsedData = mapRowsToStudents(rawRows);
    }

    const totalRows = parsedData.length;
    const validRows = parsedData.filter((r) => r.isValid).length;
    const invalidRows = totalRows - validRows;
    const errors = parsedData.filter((r) => !r.isValid).map((r) => r.error);

    return NextResponse.json({
      success: true,
      fileId: driveInfo.fileId,
      targetType,
      totalRows,
      validRows,
      invalidRows,
      errors,
      data: parsedData,
    });
  } catch (err: any) {
    console.error("Google Drive Fetch Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Đã xảy ra lỗi khi đọc dữ liệu từ Google Drive.",
      },
      { status: 500 }
    );
  }
}
