import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ProfileShortcuts from "./ProfileShortcuts";
import type { ProfilePresentation } from "./profileTypes";

const presentationMock: ProfilePresentation = {
  title: "Mi espacio",
  label: "Archivo personal",
  collection: "Mis recuerdos",
  map: "Mis lugares",
  footer: "Cada historia encuentra su lugar",
};

describe("ProfileShortcuts - Sección de guardados en el perfil", () => {
  it("muestra la pestaña de Recuerdos guardados en el perfil propio", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileShortcuts, {
        presentation: presentationMock,
        memoryCount: 5,
        savedCount: 2,
        activeTab: "posts",
        mapOpened: false,
        onOpenCollection: () => {},
        onOpenSaved: () => {},
        onOpenMap: () => {},
      })
    );

    expect(html).toContain("Recuerdos guardados");
    expect(html).not.toContain("Sus guardados");
  });

  it("NO muestra la pestaña de guardados bajo ningún concepto en perfiles de otros usuarios", () => {
    const html = renderToStaticMarkup(
      createElement(ProfileShortcuts, {
        author: "OtroUsuario",
        presentation: presentationMock,
        memoryCount: 5,
        savedCount: 2,
        activeTab: "posts",
        mapOpened: false,
        onOpenCollection: () => {},
        onOpenSaved: () => {}, // Incluso si se pasa callback
        onOpenMap: () => {},
      })
    );

    expect(html).not.toContain("Recuerdos guardados");
    expect(html).not.toContain("Sus guardados");
  });
});

