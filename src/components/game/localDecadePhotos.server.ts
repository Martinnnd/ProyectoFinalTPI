import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { decadeOptions, type DecadeQuestion } from "./decadeQuestions";

const photoExtension = /\.(jpe?g|png|webp|avif|gif)$/i;

// Solo se importa desde la página de servidor: el navegador recibe el catálogo,
// sin acceso al sistema de archivos. En producción se descubre durante el build.
export async function getLocalDecadePhotos(
  root = join(process.cwd(), "public", "juego-decadas"),
): Promise<DecadeQuestion[]> {
  const decades = await Promise.all(
    decadeOptions.map(async (decade) => {
      try {
        const files = await readdir(join(root, String(decade)), { withFileTypes: true });
        return files
          .filter((file) => file.isFile() && photoExtension.test(file.name))
          .sort((a, b) => a.name.localeCompare(b.name, "en"))
          .map((file): DecadeQuestion => ({
            id: `local:${decade}/${file.name}`,
            image: `/juego-decadas/${decade}/${encodeURIComponent(file.name)}`,
            decade,
            source: "local",
          }));
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
        throw error;
      }
    }),
  );
  return decades.flat();
}
