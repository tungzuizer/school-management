import { describe, expect, it } from "vitest";
import { assertReviewCampus, nextReviewStatus, parseSupplementalTasks } from "../personnel-review";
import type { TenantContext } from "../tenant";

const principal: TenantContext = { userId: "p", userName: "Principal", userRole: "ADMIN", schoolId: "school-a", isApproved: true };
const vice: TenantContext = { userId: "v", userName: "Vice", userRole: "VICE_PRINCIPAL", schoolId: "school-a", campusId: "campus-a", isApproved: true };

describe("personnel review authorization and workflow", () => {
  it("keeps both roles inside their school and vice principal inside assigned campuses", () => {
    expect(() => assertReviewCampus(principal, "school-a", "campus-b", [])).not.toThrow();
    expect(() => assertReviewCampus(principal, "school-b", "campus-b", [])).toThrow();
    expect(() => assertReviewCampus(vice, "school-a", "campus-a", ["campus-a"])).not.toThrow();
    expect(() => assertReviewCampus(vice, "school-a", "campus-b", ["campus-a"])).toThrow();
    expect(() => assertReviewCampus({ ...vice, isApproved: false }, "school-a", "campus-a", ["campus-a"])).toThrow();
  });

  it("allows only the intended state transitions and freezes confirmed records", () => {
    expect(nextReviewStatus("VICE_PRINCIPAL", "DRAFT", "SUBMIT")).toBe("SUBMITTED");
    expect(nextReviewStatus("ADMIN", "SUBMITTED", "RETURN")).toBe("RETURNED");
    expect(nextReviewStatus("VICE_PRINCIPAL", "RETURNED", "SUBMIT")).toBe("SUBMITTED");
    expect(nextReviewStatus("ADMIN", "SUBMITTED", "CONFIRM")).toBe("CONFIRMED");
    expect(() => nextReviewStatus("VICE_PRINCIPAL", "CONFIRMED", "EDIT")).toThrow();
    expect(() => nextReviewStatus("ADMIN", "CONFIRMED", "CONFIRM")).toThrow();
    expect(() => nextReviewStatus("TEACHER", "DRAFT", "SUBMIT")).toThrow();
  });

  it("rejects oversized supplemental task lists", () => {
    expect(parseSupplementalTasks(" Việc A \n\n Việc B ")).toEqual(["Việc A", "Việc B"]);
    expect(() => parseSupplementalTasks(Array(31).fill("việc").join("\n"))).toThrow();
  });
});
