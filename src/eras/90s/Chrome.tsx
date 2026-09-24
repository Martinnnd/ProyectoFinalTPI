import DesktopChrome from "../shared/DesktopChrome";
import type { ChromeProps } from "../contracts";
import { theme, icons } from "./theme";
export default function Chrome(props: ChromeProps) {
  return (
    <DesktopChrome
      {...props}
      theme={theme}
      icons={icons}
      startLabel="Inicio"
      storiesLabel="Mis recuerdos"
      menuTitle="Nostalgia 95"
    />
  );
}
