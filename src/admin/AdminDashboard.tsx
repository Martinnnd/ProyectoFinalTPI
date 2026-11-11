"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  ChevronLeft,
  FileText,
  Heart,
  LayoutDashboard,
  MessageSquareText,
  Flag,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../components/auth/AuthProvider";
import { getAdminStatistics, type AdminStatistics } from "./adminApi";
import CommentsPanel from "./CommentsPanel";
import PublicationsPanel from "./PublicationsPanel";
import UsersPanel from "./UsersPanel";
import ReportsPanel from "./ReportsPanel";
import ToastViewport from "../components/layout/ToastViewport";
import styles from "./admin.module.css";

type Section = "overview" | "publications" | "users" | "comments" | "reports";

const sections = [
  { id: "overview" as const, label: "Resumen", icon: LayoutDashboard },
  { id: "publications" as const, label: "Publicaciones", icon: FileText },
  { id: "users" as const, label: "Usuarios", icon: Users },
  { id: "comments" as const, label: "Comentarios", icon: MessageSquareText },
  { id: "reports" as const, label: "Reportes", icon: Flag },
];

export default function AdminDashboard() {
  const { session } = useAuth();
  const [section, setSection] = useState<Section>("overview");

  return (
    <div className={styles.adminRoot}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>N</span>
          <span>
            <strong>Nostalgiar</strong>
            <small>Administración</small>
          </span>
        </div>
        <nav aria-label="Secciones del panel">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={section === id ? styles.navActive : ""}
              onClick={() => setSection(id)}
            >
              <Icon aria-hidden="true" /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <Link className={styles.backLink} href="/explorar">
          <ChevronLeft aria-hidden="true" /> Volver a Nostalgiar
        </Link>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>Panel de control</span>
            <h1>{sections.find((item) => item.id === section)?.label}</h1>
          </div>
          <div className={styles.adminIdentity}>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>{session?.username}</strong>
              <small>Administrador</small>
            </span>
          </div>
        </header>

        {section === "overview" && <Overview />}
        {section === "publications" && <PublicationsPanel />}
        {section === "users" && <UsersPanel currentUserId={session!.usuarioId} />}
        {section === "comments" && <CommentsPanel />}
        {section === "reports" && <ReportsPanel />}
      </main>
      <ToastViewport />
    </div>
  );
}

function Overview() {
  const [statistics, setStatistics] = useState<AdminStatistics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getAdminStatistics(controller.signal)
      .then(setStatistics)
      .catch((reason: Error) => {
        if (!controller.signal.aborted) setError(reason.message);
      });
    return () => controller.abort();
  }, []);

  if (error) return <StateMessage error={error} />;
  if (!statistics) return <StateMessage />;
  const maxCategory = Math.max(
    ...statistics.publicacionesPorCategoria.map((item) => item.cantidad),
    1,
  );

  return (
    <div className={styles.content}>
      <section className={styles.metrics} aria-label="Indicadores generales">
        <Metric icon={Users} label="Usuarios" value={statistics.totalUsuarios} tone="green" />
        <Metric
          icon={FileText}
          label="Publicaciones"
          value={statistics.totalPublicaciones}
          tone="gold"
        />
        <Metric
          icon={Sparkles}
          label="Visibles"
          value={statistics.publicacionesVisibles}
          tone="blue"
        />
        <Metric
          icon={ShieldCheck}
          label="Moderadas"
          value={statistics.publicacionesOcultas}
          tone="red"
        />
      </section>

      <div className={styles.overviewGrid}>
        <section className={styles.panel}>
          <PanelHeading
            icon={BarChart3}
            title="Publicaciones por categoría"
            subtitle="Distribución del contenido"
          />
          <div className={styles.barChart}>
            {statistics.publicacionesPorCategoria.map((item) => (
              <div className={styles.barRow} key={item.categoria}>
                <span title={item.categoria}>{item.categoria}</span>
                <div>
                  <i style={{ width: `${(item.cantidad / maxCategory) * 100}%` }} />
                </div>
                <strong>{item.cantidad}</strong>
              </div>
            ))}
            {!statistics.publicacionesPorCategoria.length && (
              <p className={styles.empty}>Todavía no hay publicaciones.</p>
            )}
          </div>
        </section>

        <Ranking
          title="Más gustadas"
          icon={Heart}
          items={statistics.masGustadas}
          suffix="me gusta"
        />
        <Ranking
          title="Más nostalgia"
          icon={Sparkles}
          items={statistics.masPuntuadas}
          suffix="puntos"
        />
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <article className={styles.metric} data-tone={tone}>
      <span>
        <Icon />
      </span>
      <div>
        <small>{label}</small>
        <strong>{value.toLocaleString("es-AR")}</strong>
      </div>
    </article>
  );
}

function Ranking({
  title,
  icon: Icon,
  items,
  suffix,
}: {
  title: string;
  icon: typeof Heart;
  items: AdminStatistics["masGustadas"];
  suffix: string;
}) {
  return (
    <section className={styles.panel}>
      <PanelHeading icon={Icon} title={title} subtitle={`Top ${items.length || 5} publicaciones`} />
      <ol className={styles.ranking}>
        {items.map((item, index) => (
          <li key={item.publicacionId}>
            <b>{index + 1}</b>
            <span>
              <strong>{item.titulo}</strong>
              <small>@{item.autorUsername}</small>
            </span>
            <em>
              {item.cantidad} {suffix}
            </em>
          </li>
        ))}
        {!items.length && <p className={styles.empty}>No hay datos para mostrar.</p>}
      </ol>
    </section>
  );
}

function PanelHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Heart;
  title: string;
  subtitle: string;
}) {
  return (
    <header className={styles.panelHeading}>
      <span>
        <Icon />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </header>
  );
}

function StateMessage({ error }: { error?: string }) {
  return (
    <div className={styles.state} role={error ? "alert" : "status"}>
      {error ?? "Cargando información…"}
    </div>
  );
}
