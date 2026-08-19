import * as XLSX from "xlsx";

export interface ParsedStudentRow {
  name: string;
  studentCode?: string;
  email?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  ethnicity?: string;
  addressCurrent?: string;
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
  classId?: string;
  className?: string;
  status?: string;
  isValid: boolean;
  error?: string;
}

export interface ParsedTeacherRow {
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  degree?: string;
  isValid: boolean;
  error?: string;
}

export interface ParsedClassRow {
  name: string;
  gradeLevel: number;
  schoolName?: string;
  campusName?: string;
  homeroomTeacherEmail?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Normalizes header keys by converting to lowercase, removing accents and spaces
 */
function normalizeKey(key: string): string {
  if (!key) return "";
  return key
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Parses raw buffer (CSV/XLSX) to generic JSON object array with proper UTF-8 decoding
 */
export function parseSpreadsheetBuffer(buffer: Buffer): Record<string, any>[] {
  let workbook: XLSX.WorkBook;

  try {
    // Try reading as UTF-8 text string (for CSV / TSV from Google Sheets)
    const textContent = buffer.toString("utf-8");
    workbook = XLSX.read(textContent, { type: "string", raw: true });
  } catch {
    // Fallback to binary buffer (for native .xlsx / .xls files)
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  return rawRows;
}

/**
 * Maps raw spreadsheet rows to structured Student records with validation
 */
export function mapRowsToStudents(rawRows: Record<string, any>[]): ParsedStudentRow[] {
  return rawRows.map((row, idx) => {
    // Find matching columns by normalized key
    const getVal = (...possibleKeys: string[]) => {
      const rowKeys = Object.keys(row);
      for (const pk of possibleKeys) {
        const normPk = normalizeKey(pk);
        const matchedKey = rowKeys.find((k) => normalizeKey(k) === normPk);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]).trim();
        }
      }
      return "";
    };

    const name = getVal("name", "ho ten", "ho va ten", "ten hoc sinh", "fullname", "hoc sinh");
    const studentCode = getVal("studentcode", "ma hoc sinh", "ma hs", "code", "ma");
    const email = getVal("email", "thu dien tu", "gmail");
    const genderRaw = getVal("gender", "gioi tinh", "sex");
    const dob = getVal("dob", "ngay sinh", "birthday", "birthdate");
    const phone = getVal("phone", "so dien thoai", "sdt", "sdt phu huynh", "parentphone", "dien thoai");
    const ethnicity = getVal("ethnicity", "dan toc");
    const addressCurrent = getVal("addresscurrent", "cho o hien nay", "dia chi", "dia chi hien tai", "noi o", "address");
    const fatherName = getVal("fathername", "ho ten cha", "ten cha", "cha");
    const fatherJob = getVal("fatherjob", "nghe nghiep cha");
    const motherName = getVal("mothername", "ho ten me", "ten me", "me");
    const motherJob = getVal("motherjob", "nghe nghiep me");
    const className = getVal("classname", "ma lop", "ten lop", "lop", "lop hoc", "class");

    // Standardize gender
    let gender: string | undefined = undefined;
    if (genderRaw) {
      const gNorm = normalizeKey(genderRaw);
      if (gNorm === "nam" || gNorm === "male" || gNorm === "m") gender = "MALE";
      else if (gNorm === "nu" || gNorm === "female" || gNorm === "f") gender = "FEMALE";
      else gender = "OTHER";
    }

    let isValid = true;
    let error = "";

    if (!name) {
      isValid = false;
      error = `Dòng ${idx + 2}: Thiếu tên học sinh.`;
    }

    return {
      name,
      studentCode: studentCode || undefined,
      email: email || undefined,
      gender,
      dob: dob || undefined,
      phone: phone || undefined,
      ethnicity: ethnicity || undefined,
      addressCurrent: addressCurrent || undefined,
      fatherName: fatherName || undefined,
      fatherJob: fatherJob || undefined,
      motherName: motherName || undefined,
      motherJob: motherJob || undefined,
      className: className || undefined,
      status: "STUDYING",
      isValid,
      error: error || undefined,
    };
  });
}

/**
 * Maps raw spreadsheet rows to structured Teacher records with validation
 */
export function mapRowsToTeachers(rawRows: Record<string, any>[]): ParsedTeacherRow[] {
  return rawRows.map((row, idx) => {
    const getVal = (...possibleKeys: string[]) => {
      const rowKeys = Object.keys(row);
      for (const pk of possibleKeys) {
        const normPk = normalizeKey(pk);
        const matchedKey = rowKeys.find((k) => normalizeKey(k) === normPk);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]).trim();
        }
      }
      return "";
    };

    const name = getVal("name", "ho ten", "ho va ten", "ten giao vien", "fullname", "giao vien");
    const email = getVal("email", "thu dien tu", "gmail");
    const phone = getVal("phone", "so dien thoai", "sdt", "dien thoai");
    const specialty = getVal("specialty", "chuyen mon", "bo mon", "mon giang day");
    const degree = getVal("degree", "bang cap", "trinh do");

    let isValid = true;
    let error = "";

    if (!name) {
      isValid = false;
      error = `Dòng ${idx + 2}: Thiếu tên giáo viên.`;
    } else if (!email) {
      isValid = false;
      error = `Dòng ${idx + 2}: Thiếu email giáo viên.`;
    }

    return {
      name,
      email,
      phone: phone || undefined,
      specialty: specialty || undefined,
      degree: degree || undefined,
      isValid,
      error: error || undefined,
    };
  });
}

/**
 * Maps raw spreadsheet rows to structured Class records with validation
 */
export function mapRowsToClasses(rawRows: Record<string, any>[]): ParsedClassRow[] {
  return rawRows.map((row, idx) => {
    const getVal = (...possibleKeys: string[]) => {
      const rowKeys = Object.keys(row);
      for (const pk of possibleKeys) {
        const normPk = normalizeKey(pk);
        const matchedKey = rowKeys.find((k) => normalizeKey(k) === normPk);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]).trim();
        }
      }
      return "";
    };

    const name = getVal("name", "ten lop", "ma lop", "lop", "classname");
    const gradeLevelRaw = getVal("gradelevel", "khoi", "khoi lop", "grade");
    const schoolName = getVal("schoolname", "truong", "ten truong");
    const campusName = getVal("campusname", "phan hieu", "diem truong");
    const homeroomTeacherEmail = getVal("homeroomteacheremail", "email gvcn", "gvcn");

    let gradeLevel = parseInt(gradeLevelRaw, 10);
    if (isNaN(gradeLevel)) {
      // Try extract number from class name (e.g. 10A1 -> 10)
      const numMatch = name.match(/(\d+)/);
      if (numMatch) {
        gradeLevel = parseInt(numMatch[1], 10);
      } else {
        gradeLevel = 10; // Default
      }
    }

    let isValid = true;
    let error = "";

    if (!name) {
      isValid = false;
      error = `Dòng ${idx + 2}: Thiếu tên lớp học.`;
    }

    return {
      name,
      gradeLevel,
      schoolName: schoolName || undefined,
      campusName: campusName || undefined,
      homeroomTeacherEmail: homeroomTeacherEmail || undefined,
      isValid,
      error: error || undefined,
    };
  });
}

export interface ParsedSubjectGroupRow {
  name: string;
  headTeacherName?: string;
  subjects?: string;
  schoolName?: string;
  description?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Maps raw spreadsheet rows to structured Subject Group records with validation
 */
export function mapRowsToSubjectGroups(rawRows: Record<string, any>[]): ParsedSubjectGroupRow[] {
  return rawRows.map((row, idx) => {
    const getVal = (...possibleKeys: string[]) => {
      const rowKeys = Object.keys(row);
      for (const pk of possibleKeys) {
        const normPk = normalizeKey(pk);
        const matchedKey = rowKeys.find((k) => normalizeKey(k) === normPk);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]).trim();
        }
      }
      return "";
    };

    const name = getVal("name", "ten to", "ten to chuyen mon", "to chuyen mon", "to", "groupname");
    const headTeacherName = getVal(
      "headteachername",
      "to truong",
      "to truong chuyen mon",
      "headteacher",
      "giao vien to truong",
      "gv to truong"
    );
    const subjects = getVal("subjects", "mon hoc", "danh sach mon", "cac mon", "mon");
    const schoolName = getVal("schoolname", "truong", "ten truong");
    const description = getVal("description", "mo ta", "ghi chu");

    let isValid = true;
    let error = "";

    if (!name) {
      isValid = false;
      error = `Dòng ${idx + 2}: Thiếu tên tổ chuyên môn.`;
    }

    return {
      name,
      headTeacherName: headTeacherName || undefined,
      subjects: subjects || undefined,
      schoolName: schoolName || undefined,
      description: description || undefined,
      isValid,
      error: error || undefined,
    };
  });
}

