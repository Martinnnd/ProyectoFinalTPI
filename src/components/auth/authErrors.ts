export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AuthError";
  }
}

type ApiProblem = {
  mensaje?: string;
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

const fieldNames: Record<string, string> = {
  username: "username",
  email: "email",
  contrasena: "contrasena",
};

function normalizeField(field: string): string {
  const normalized = field
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return fieldNames[normalized] ?? normalized;
}

export async function toAuthError(response: Response): Promise<AuthError> {
  const problem = (await response.json().catch(() => null)) as ApiProblem | null;
  const fields: Record<string, string> = {};

  if (problem?.errors) {
    for (const [field, messages] of Object.entries(problem.errors)) {
      if (messages.length) fields[normalizeField(field)] = messages[0];
    }
  }

  const firstFieldError = Object.values(fields)[0];
  const fallback =
    response.status === 401
      ? "Email o contraseña incorrectos."
      : response.status === 409
        ? "Ya existe una cuenta registrada con ese email."
        : `No se pudo completar la solicitud (${response.status}).`;

  return new AuthError(
    problem?.mensaje ?? problem?.detail ?? firstFieldError ?? problem?.title ?? fallback,
    response.status,
    fields,
  );
}
