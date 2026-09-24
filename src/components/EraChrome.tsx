import type { Decade } from "../types";
import type { ChromeProps, Destination } from "../eras/contracts";
import { eraRegistry } from "../eras/registry";
export function EraIcon({
  decade,
  destination,
  size = 21,
}: {
  decade: Decade;
  destination: Destination;
  size?: number;
}) {
  const Icon = eraRegistry[decade].icons[destination];
  return <Icon size={size} aria-hidden="true" />;
}
export default function EraChrome(props: ChromeProps) {
  const Chrome = eraRegistry[props.period.decade].Chrome;
  return <Chrome {...props} />;
}
