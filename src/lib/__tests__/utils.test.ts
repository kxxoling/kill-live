import { describe, expect, it } from "vitest";
import { cn, formatFileSize } from "../utils";

describe("cn", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", false && "hidden")).toBe("base");
  });

  it("should merge tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500B");
  });

  it("should format 0 bytes", () => {
    expect(formatFileSize(0)).toBe("0B");
  });

  it("should format kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1KB");
  });

  it("should format megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1MB");
  });

  it("should format gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1GB");
  });

  it("should format fractional sizes", () => {
    expect(formatFileSize(1536)).toBe("1.5KB");
  });
});
