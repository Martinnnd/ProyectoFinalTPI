import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import ts from "typescript";
import postcss from "postcss";

const teams = { "70s": 1970, "80s": 1980, "90s": 1990, "2000s": 2000 };
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((item) =>
      item.isDirectory()
        ? files(path.join(dir, item.name))
        : [path.join(dir, item.name)],
    );
}
for (const [folder, year] of Object.entries(teams)) {
  const root = path.resolve("src/eras", folder);
  for (const required of [
    "index.ts",
    "theme.ts",
    "theme.css",
    "Chrome.tsx",
    "Player.tsx",
    "content.ts",
    "contract.test.ts",
  ])
    assert(
      fs.existsSync(path.join(root, required)),
      `${folder}: falta ${required}`,
    );
  for (const file of files(root)) {
    const source = fs.readFileSync(file, "utf8");
    if (/\.tsx?$/.test(file)) {
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      for (const statement of tree.statements) {
        if (
          !ts.isImportDeclaration(statement) ||
          !ts.isStringLiteral(statement.moduleSpecifier)
        )
          continue;
        const specifier = statement.moduleSpecifier.text;
        if (!specifier.startsWith(".")) continue;
        const target = path
          .resolve(path.dirname(file), specifier)
          .replaceAll("\\", "/");
        for (const other of Object.keys(teams).filter(
          (team) => team !== folder,
        ))
          assert(
            !target.includes(`/eras/${other}/`) &&
              !target.endsWith(`/eras/${other}`),
            `${file}: no importar otra epoca (${specifier})`,
          );
        assert(
          !/\/(registry|App|data|eraData|themes|storage)$/.test(target),
          `${file}: no importar el motor ni agregadores (${specifier}); usar contratos y callbacks`,
        );
      }
    }
    if (file.endsWith(".css"))
      postcss.parse(source).walkRules((rule) => {
        if (
          rule.parent.type === "atrule" &&
          /keyframes$/.test(rule.parent.name)
        )
          return;
        for (const selector of postcss.list.comma(rule.selector)) {
          assert(
            selector.includes(`.era-${year}`),
            `${file}: selector sin alcance de epoca: ${selector}`,
          );
          assert(
            !new RegExp(`\\.era-(?!${year})(1970|1980|1990|2000)`).test(
              selector,
            ),
            `${file}: selector de otro equipo`,
          );
        }
      });
  }
}
for (const file of ["src/styles.css", "src/themes.css", "src/social.css"])
  assert(
    !/\.(era|device)-(1970|1980|1990|2000)/.test(fs.readFileSync(file, "utf8")),
    `${file}: mover estilos de epoca a su carpeta`,
  );
console.log(
  "Arquitectura OK: cuatro equipos aislados, contratos y CSS por epoca.",
);
