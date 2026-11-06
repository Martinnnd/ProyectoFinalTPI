import { describe, expect, it } from "vitest";
import { createNoticeStore } from "./noticeStore";

describe("notice store", () => {
  it("publishes and dismisses notices without leaking them to another app instance", () => {
    const first = createNoticeStore();
    const second = createNoticeStore();
    const observed: Array<string | null> = [];
    const unsubscribe = first.subscribe((state) => observed.push(state.notice));

    first.getState().setNotice("Recuerdo guardado.");
    expect(first.getState().notice).toBe("Recuerdo guardado.");
    expect(second.getState().notice).toBeNull();

    first.getState().setNotice(null);
    expect(observed).toEqual(["Recuerdo guardado.", null]);
    unsubscribe();
  });
});
