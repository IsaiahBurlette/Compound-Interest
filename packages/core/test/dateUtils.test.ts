import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  formatPeriodLabel,
  generateUpcomingPeriodStarts,
  getMonthRange,
  getWeekRange,
  shiftPeriod,
} from "../src/dateUtils";

describe("dateUtils", () => {
  it("computes a Monday-start week range", () => {
    // 2026-07-22 is a Wednesday
    const { start, end } = getWeekRange("2026-07-22", 1);
    expect(start).toBe("2026-07-20");
    expect(end).toBe("2026-07-26");
  });

  it("computes a Sunday-start week range", () => {
    const { start, end } = getWeekRange("2026-07-22", 0);
    expect(start).toBe("2026-07-19");
    expect(end).toBe("2026-07-25");
  });

  it("computes a month range", () => {
    const { start, end } = getMonthRange("2026-02-14");
    expect(start).toBe("2026-02-01");
    expect(end).toBe("2026-02-28");
  });

  it("handles month range in a leap year", () => {
    const { end } = getMonthRange("2028-02-14");
    expect(end).toBe("2028-02-29");
  });

  it("addMonths clamps to shorter months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
  });

  it("addDays crosses month/year boundaries", () => {
    expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
  });

  it("shiftPeriod moves weekly and monthly periods", () => {
    expect(shiftPeriod("2026-07-20", "weekly", 2)).toBe("2026-08-03");
    expect(shiftPeriod("2026-07-01", "monthly", 3)).toBe("2026-10-01");
  });

  it("generates upcoming monthly period starts for advance budgeting", () => {
    const starts = generateUpcomingPeriodStarts("2026-07-22", "monthly", 3);
    expect(starts).toEqual(["2026-07-01", "2026-08-01", "2026-09-01"]);
  });

  it("generates upcoming weekly period starts", () => {
    const starts = generateUpcomingPeriodStarts("2026-07-22", "weekly", 3, 1);
    expect(starts).toEqual(["2026-07-20", "2026-07-27", "2026-08-03"]);
  });

  it("formats period labels", () => {
    expect(formatPeriodLabel(getMonthRange("2026-07-22"), "monthly")).toBe("Jul 2026");
    expect(formatPeriodLabel(getWeekRange("2026-07-22", 1), "weekly")).toBe("Jul 20 – Jul 26, 2026");
  });
});
