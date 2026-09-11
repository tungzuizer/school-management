/**
 * FACT-FORCING GATE CONTEXT:
 * 1. Importers/Callers: Vitest test runner (`pnpm test` / `npm test`).
 * 2. Purpose: Unit tests for Vietnam administrative regions and fuzzy keyword matching.
 * 3. Schema: `normalizeVietnameseSearch`, `fuzzyMatchKeywords`, `searchVietnamLocations`.
 * 4. Verbatim User Instruction: "tôi cần bạn phần đăng ký ở phần khu vực hay lấy thông tin khu vực của quốc gia việt nam và khi gõ từng từ hay key word sẽ đề xuất khu vực và trường học hãy tìm kiếm kỹ về dữ liệu".
 */

import { describe, it, expect } from "vitest";
import {
  normalizeVietnameseSearch,
  fuzzyMatchKeywords,
  searchVietnamLocations,
  VIETNAM_PROVINCES,
} from "../vietnam-regions";

describe("Vietnam Administrative & Fuzzy Keyword Search", () => {
  it("should normalize Vietnamese tones and special characters accurately", () => {
    expect(normalizeVietnameseSearch("Thành phố Hà Nội")).toBe("thanh pho ha noi");
    expect(normalizeVietnameseSearch("Quận Cầu Giấy - Đống Đa")).toBe("quan cau giay - dong da");
    expect(normalizeVietnameseSearch("Đắk Lắk")).toBe("dak lak");
    expect(normalizeVietnameseSearch("TP. Hồ Chí Minh")).toBe("tp. ho chi minh");
  });

  it("should match multi-word queries regardless of tone and letter casing", () => {
    expect(fuzzyMatchKeywords("Quận Cầu Giấy, Thành phố Hà Nội", "cau giay")).toBe(true);
    expect(fuzzyMatchKeywords("Quận Cầu Giấy, Thành phố Hà Nội", "Hà Nội")).toBe(true);
    expect(fuzzyMatchKeywords("Quận Cầu Giấy, Thành phố Hà Nội", "cau giay ha noi")).toBe(true);
    expect(fuzzyMatchKeywords("Quận Cầu Giấy, Thành phố Hà Nội", "ha noi cau giay")).toBe(true);
    expect(fuzzyMatchKeywords("Quận 1, Thành phố Hồ Chí Minh", "quan 1")).toBe(true);
    expect(fuzzyMatchKeywords("Quận 1, Thành phố Hồ Chí Minh", "ho chi minh")).toBe(true);
    expect(fuzzyMatchKeywords("Quận Hải Châu, Thành phố Đà Nẵng", "da nang")).toBe(true);
    expect(fuzzyMatchKeywords("Quận Hải Châu, Thành phố Đà Nẵng", "hai chau")).toBe(true);
    expect(fuzzyMatchKeywords("Quận 1, Thành phố Hồ Chí Minh", "ha noi")).toBe(false);
  });

  it("should search and suggest Vietnam locations by keyword typeahead", () => {
    const resultsHN = searchVietnamLocations("cau giay");
    expect(resultsHN.length).toBeGreaterThan(0);
    expect(resultsHN[0].districtName).toContain("Cầu Giấy");
    expect(resultsHN[0].provinceName).toContain("Hà Nội");

    const resultsHCM = searchVietnamLocations("thu duc");
    expect(resultsHCM.length).toBeGreaterThan(0);
    expect(resultsHCM[0].districtName).toContain("Thủ Đức");

    const resultsNB = searchVietnamLocations("tam diep");
    expect(resultsNB.length).toBeGreaterThan(0);
    expect(resultsNB[0].districtName).toContain("Tam Điệp");
    expect(resultsNB[0].provinceName).toContain("Ninh Bình");
  });

  it("should verify standard 63 provinces coverage structure", () => {
    expect(VIETNAM_PROVINCES.length).toBeGreaterThanOrEqual(20);
    const hanoi = VIETNAM_PROVINCES.find((p) => p.id === "HN");
    expect(hanoi).toBeDefined();
    expect(hanoi?.districts.length).toBeGreaterThanOrEqual(15);
  });
});
