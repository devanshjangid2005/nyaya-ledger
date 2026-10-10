import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseSms, splitMessages } from "./sms.js";

const demo = readFileSync(new URL("../demo/data/ravi-sms.txt", import.meta.url), "utf8");

describe("parseSms", () => {
  it("extracts the 3 platform credits from the demo paste and skips OTP and debit", () => {
    const r = parseSms(demo, { platformHints: ["quickbite"] });
    expect(r.credits.map((c) => [c.date, c.amount, c.fromPlatform])).toEqual([
      ["2026-09-22", 5840, true],
      ["2026-09-29", 6310, true],
      ["2026-10-06", 6005, true],
    ]);
    expect(r.credits[2].payer).toBe("QUICKBITE PARTNER PVT LTD");
    expect(r.credits[2].ref).toBe("NEFT2610069902");
    expect(r.skipped.map((s) => s.reason)).toEqual(["OTP message", "not a credit"]);
  });

  it("handles other common bank formats", () => {
    const r = parseSms(
      [
        "INR 1,234.50 credited to your a/c no. XX99 on 06Oct2026 (IMPS Ref no 612345678901). -HDFC",
        "Dear Customer, your A/c X1234 is credited with ₹ 980 on 07-Oct-26 Info: UPI-ZIPRIDE. -Axis",
      ].join("\n\n"),
    );
    expect(r.credits.map((c) => [c.date, c.amount])).toEqual([
      ["2026-10-06", 1234.5],
      ["2026-10-07", 980],
    ]);
  });

  it("marks credits from other payers so the worker can untick them", () => {
    const r = parseSms("Rs 500 credited to A/c XX11 on 05-10-26 from RAMESH K. -SBI", { platformHints: ["quickbite"] });
    expect(r.credits[0].fromPlatform).toBe(false);
  });

  it("joins a single SMS that was pasted across several lines", () => {
    expect(splitMessages("Rs.100 credited\nto A/c XX1 on 01-10-26\n\nsecond")).toEqual([
      "Rs.100 credited to A/c XX1 on 01-10-26",
      "second",
    ]);
  });
});
