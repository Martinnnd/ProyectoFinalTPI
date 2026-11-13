import { describe, expect, it } from "vitest";
import { createNoticeStore } from "./noticeStore";

describe("notice store", () => {
  it("publishes and dismisses notices without leaking them to another app instance", () => {
    const first = createNoticeStore();
    const second = createNoticeStore();
    const observed: number[] = [];
    const unsubscribe = first.subscribe((state) => observed.push(state.toasts.length));

    first.getState().setNotice("Recuerdo guardado.");
    expect(first.getState().toasts[0]).toMatchObject({
      message: "Recuerdo guardado.",
      type: "info",
    });
    expect(second.getState().toasts).toEqual([]);

    first.getState().setNotice(null);
    expect(observed).toEqual([1, 0]);
    unsubscribe();
  });

  it("deduplicates repeated errors and limits the visible queue", () => {
    const store = createNoticeStore();
    store.getState().showToast("Sin conexión", "error");
    store.getState().showToast("Sin conexión", "error");
    expect(store.getState().toasts).toHaveLength(1);
    expect(store.getState().toasts[0].duration).toBe(6000);

    for (const message of ["A", "B", "C"]) store.getState().showToast(message, "warning");
    expect(store.getState().toasts.map((toast) => toast.message)).toEqual(["A", "B", "C"]);
    store.getState().dismissToast(store.getState().toasts[0].id);
    expect(store.getState().toasts.map((toast) => toast.message)).toEqual(["B", "C"]);
  });
});
