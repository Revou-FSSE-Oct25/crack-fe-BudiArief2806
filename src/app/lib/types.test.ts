import { describe, expect, it } from "vitest";

import { bookingStatusLabel, getPrescriptionTemplate, stageLabel } from "./types";

describe("type helpers", () => {
  it("maps stage labels correctly", () => {
    expect(stageLabel("STADIUM_1")).toBe("Stadium 1");
    expect(stageLabel("STADIUM_2")).toBe("Stadium 2");
    expect(stageLabel("STADIUM_3")).toBe("Stadium 3");
  });

  it("maps booking status labels correctly", () => {
    expect(bookingStatusLabel("PENDING")).toBe("Pending");
    expect(bookingStatusLabel("CONFIRMED")).toBe("Dikirim ke Dokter");
    expect(bookingStatusLabel("REVIEWED_BY_DOCTOR")).toBe("Sudah Direview Dokter");
    expect(bookingStatusLabel("COMPLETED")).toBe("Selesai");
  });

  it("returns diabetes prescription templates", () => {
    const stage1 = getPrescriptionTemplate("Diabetes", "STADIUM_1");
    const stage2 = getPrescriptionTemplate("Diabetes", "STADIUM_2");
    const stage3 = getPrescriptionTemplate("Diabetes", "STADIUM_3");

    expect(stage1.items[0]).toContain("Metformin");
    expect(stage2.items).toHaveLength(3);
    expect(stage3.notes).toContain("Rujuk");
  });

  it("returns stroke prescription templates", () => {
    const stage1 = getPrescriptionTemplate("Stroke", "STADIUM_1");
    const stage2 = getPrescriptionTemplate("Stroke", "STADIUM_2");
    const stage3 = getPrescriptionTemplate("Stroke", "STADIUM_3");

    expect(stage1.items[0]).toContain("Citicoline");
    expect(stage2.items.some((item) => item.includes("Aspirin"))).toBe(true);
    expect(stage3.notes).toContain("rawat inap");
  });

  it("returns generic prescription templates for umum specialty", () => {
    const stage1 = getPrescriptionTemplate("Umum", "STADIUM_1");
    const stage2 = getPrescriptionTemplate("Umum", "STADIUM_2");
    const stage3 = getPrescriptionTemplate("Umum", "STADIUM_3");

    expect(stage1.items[0]).toContain("Paracetamol");
    expect(stage2.items[1]).toContain("Omeprazole");
    expect(stage3.notes).toContain("pemeriksaan lanjutan");
  });
});
