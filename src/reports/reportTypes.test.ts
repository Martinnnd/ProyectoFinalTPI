import { describe, expect, it } from "vitest";
import { actionsForTarget, reportTarget } from "./reportTypes";

describe("actionsForTarget", () => {
  it("permite ocultar solamente publicaciones", () => {
    expect(actionsForTarget(reportTarget.publication)).toContain(1);
    expect(actionsForTarget(reportTarget.comment)).not.toContain(1);
    expect(actionsForTarget(reportTarget.chatMessage)).not.toContain(1);
    expect(actionsForTarget(reportTarget.profile)).not.toContain(1);
  });

  it("no ofrece eliminar contenido para perfiles", () => {
    expect(actionsForTarget(reportTarget.profile)).toEqual([0, 3, 4]);
  });
});
