import { useState, useEffect } from "react";
import { X, LogIn, LogOut, User, KeyRound, Loader2 } from "lucide-react";
import { getSesion, login, cerrarSesion, type UsuarioSesion } from "../api";

export default function LoginDialog({
  isOpen,
  onClose,
  onSesionChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSesionChange: () => void;
}) {
  const [sesion, setSesion] = useState<UsuarioSesion | null>(null);
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSesion(getSesion());
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, contrasena);
      setSesion(getSesion());
      onSesionChange();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    cerrarSesion();
    setSesion(null);
    onSesionChange();
    onClose();
  }

  return (
    <div
      className="dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="login-dialog-card"
        style={{
          background: "var(--surface, #222)",
          color: "var(--text, #fff)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
          padding: "1.5rem",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          border: "1px solid var(--border, #444)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.3rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={20} />
            {sesion ? "Cuenta de usuario" : "Iniciar sesión"}
          </h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {sesion ? (
          <div>
            <p style={{ margin: "0.5rem 0 1rem" }}>
              Iniciaste sesión como <strong>{sesion.username}</strong> ({sesion.email}).
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.6rem",
              }}
            >
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {error && (
              <div
                style={{
                  background: "rgba(255, 70, 70, 0.2)",
                  color: "#ff7070",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                }}
              >
                {error}
              </div>
            )}
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #555)",
                  background: "var(--input-bg, #333)",
                  color: "inherit",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border, #555)",
                  background: "var(--input-bg, #333)",
                  color: "inherit",
                }}
              />
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--muted, #aaa)" }}>
              Usá el email y la contraseña de tu cuenta.
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={loading}
                style={{ flex: 1, padding: "0.6rem" }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={loading}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.6rem",
                }}
              >
                {loading ? <Loader2 size={16} className="spin" /> : <LogIn size={16} />}
                Ingresar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

