import type { Metadata } from "next";
import Link from "next/link";
import styles from "./privacidad.module.css";

export const metadata: Metadata = {
  title: "Política de privacidad | Nostalgiar",
  description: "Cómo Nostalgiar usa y protege los datos personales y cómo ejercer tus derechos.",
};

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.policy}>
        <Link className={styles.home} href="/">
          ← Volver a Nostalgiar
        </Link>
        <h1>Política de privacidad</h1>
        <p>
          Esta política explica qué datos usa Nostalgiar para que puedas explorar el mapa, compartir
          recuerdos y participar en la comunidad.
        </p>

        <section>
          <h2>Qué datos usamos y para qué</h2>
          <ul>
            <li>
              <strong>Cuenta y perfil.</strong> Para crear una cuenta te pedimos un nombre de
              usuario, un correo y una contraseña. Los usamos para identificar tu cuenta y
              permitirte iniciar sesión. La contraseña se guarda como un hash. También podés agregar
              una foto y otros datos al perfil de forma opcional.
            </li>
            <li>
              <strong>Recuerdos y actividad.</strong> Guardamos el contenido que compartís, como
              textos, fechas, lugares, fotos, videos, comentarios y etiquetas. También usamos tus
              interacciones, como los seguimientos y los recuerdos que aparecen en tu feed, para
              mostrarte recomendaciones y notificaciones. Los recuerdos generales pueden verse
              públicamente junto con tu nombre de usuario.
            </li>
            <li>
              <strong>Mensajes y grupos.</strong> Procesamos los mensajes que enviás para
              entregarlos a sus destinatarios, y tu participación en grupos para gestionar el acceso
              y mostrarte sus publicaciones.
            </li>
            <li>
              <strong>Ubicación.</strong> El mapa puede pedirte permiso para usar la ubicación de tu
              dispositivo. Si la autorizás, podemos usarla para ubicarte en el mapa y enviarla al
              servidor al publicar un recuerdo para evaluar logros relacionados con el lugar. El
              punto que elegís para el recuerdo forma parte de la publicación. Podés cambiar el
              permiso desde la configuración del navegador.
            </li>
          </ul>
          <p>
            Podés explorar el mapa sin crear una cuenta. Para publicar, comentar o enviar mensajes
            necesitás registrarte.
          </p>
        </section>

        <section>
          <h2>Proveedores y servicios externos</h2>
          <p>
            Usamos proveedores de alojamiento y almacenamiento para operar el sitio. Los archivos y
            las fotos de perfil que subís pueden alojarse en Cloudinary. El mapa y la búsqueda de
            lugares pueden consultar servicios como OpenStreetMap, Mapbox y Photon. Los contenidos
            de YouTube y Spotify se cargan desde sus respectivos servicios.
          </p>
          <p>
            Si elegís importar una foto de Google Photos, Google te pide autorización para la
            selección y Nostalgiar recibe la foto que elegiste. Si está habilitado el análisis
            automático de recuerdos, podemos enviar el título, la descripción y la fecha del
            recuerdo a Google Gemini para sugerir vínculos con acontecimientos históricos.
          </p>
          <p>
            Podemos registrar información técnica de las solicitudes y de los errores para
            diagnosticar fallas y medir el rendimiento del sitio.
          </p>
        </section>

        <section>
          <h2>Cookies y publicidad</h2>
          <p>
            Usamos una cookie para mantener tu sesión y el almacenamiento del navegador para
            recordar preferencias, como la época que estabas explorando. Podés gestionar o borrar
            estos datos desde el navegador. Si eliminás la cookie de sesión, tendrás que volver a
            iniciar sesión.
          </p>
          <p>
            Nostalgiar usa Google AdSense para mostrar anuncios. Al prestar ese servicio, Google y
            otros proveedores publicitarios pueden instalar y leer cookies o utilizar balizas web,
            direcciones IP y otros identificadores para seleccionar y medir anuncios. La
            personalización depende de tus preferencias y del consentimiento aplicable.
          </p>
          <p>
            Consultá{" "}
            <a href="https://policies.google.com/technologies/partner-sites?hl=es">
              cómo usa Google los datos de sus sitios asociados
            </a>{" "}
            y administrá tus preferencias en{" "}
            <a href="https://myadcenter.google.com/?hl=es">Mi centro de anuncios de Google</a>.
          </p>
        </section>

        <section>
          <h2>Tus derechos y cómo contactarnos</h2>
          <p>
            Podés actualizar tu perfil y editar o eliminar tus propios recuerdos desde la web. Para
            consultar qué datos tenemos sobre vos o solicitar su rectificación, actualización o
            supresión, escribinos a{" "}
            <a href="mailto:contacto@nostalgiar.com">contacto@nostalgiar.com</a>. Podemos pedirte
            que acredites tu identidad para proteger los datos de tu cuenta.
          </p>
          <p>
            También podés consultar{" "}
            <a href="https://www.argentina.gob.ar/aaip/datospersonales/derechos">
              cómo ejercer tus derechos ante la Agencia de Acceso a la Información Pública
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
