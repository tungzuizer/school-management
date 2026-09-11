/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Next.js App Router entry point `/register` (`src/app/register/page.tsx`).
 * 2. Affected API: `searchSchools(query: string, locationFilter: string, schools: any[])`.
 * 3. Schema: Returns array of SchoolOption.
 * 4. Verbatim User Instruction: "Khắc phục và Build lại.".
 */

// src/lib/school-search.ts

// Tìm trường dựa vào tên trường học và bộ lọc khu vực
import { normalizeVietnameseSearch } from "./vietnam-regions";

// Phục vụ filter local trên UI, truyền mảng schools đã fetch
export function searchSchools(query: string, locationFilter: string, schools: any[]) {
  let results = schools;

  // Nếu có bộ lọc khu vực (location)
  if (locationFilter && locationFilter.trim().length > 0) {
    const locSearch = normalizeVietnameseSearch(locationFilter);
    results = results.filter((school) => {
      const dwMatch = school.districtWard?.name ? normalizeVietnameseSearch(school.districtWard.name).includes(locSearch) : false;
      const deptMatch = school.department?.name ? normalizeVietnameseSearch(school.department.name).includes(locSearch) : false;
      return dwMatch || deptMatch;
    });
  }

  // Nếu có từ khoá tìm kiếm tên trường
  if (query && query.trim().length > 0) {
    const queryTokens = normalizeVietnameseSearch(query).split(/\s+/).filter(Boolean);
    results = results.filter((school) => {
      const schNorm = normalizeVietnameseSearch(school.name);
      return queryTokens.every((token) => schNorm.includes(token));
    });
  }

  return results.slice(0, 50); // Giới hạn suggestion
}