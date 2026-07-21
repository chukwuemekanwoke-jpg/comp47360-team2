const {
  benchmarkAvgCheck,
  computeCheckAmount,
  parsePartySize,
  parseRevpashWindow,
} = require("../utils/revpash");

describe("revpash utils", () => {
  it("computes cuisine and neighborhood benchmark checks", () => {
    expect(benchmarkAvgCheck("american", "Midtown")).toBe(52.8);
    expect(benchmarkAvgCheck("french", null)).toBe(85);
  });

  it("computes discounted check totals", () => {
    expect(computeCheckAmount(2, 50, 20)).toBe(80);
    expect(computeCheckAmount(4, 68, 0)).toBe(272);
  });

  it("defaults and validates party size", () => {
    expect(parsePartySize(undefined)).toBe(2);
    expect(parsePartySize(4)).toBe(4);
    expect(() => parsePartySize(0)).toThrow(/partySize/);
  });

  it("parses revpash windows", () => {
    expect(parseRevpashWindow()).toBe("today");
    expect(parseRevpashWindow("week")).toBe("week");
    expect(() => parseRevpashWindow("year")).toThrow(/window/);
  });
});
