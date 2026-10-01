import { useId } from "react";

/** Vector reconstruction of the supplied N/hourglass, with separate sand layers. */
export default function HourglassLogo() {
  const id = useId().replace(/:/g, "");
  return <svg className="hourglass-logo" viewBox="0 0 360 400" fill="none" aria-hidden="true">
    <defs><clipPath id={`${id}-sand`}><path d="M56 143C139 155 196 206 203 232C171 289 119 313 56 318Z M305 85C236 86 183 119 166 174C200 213 250 249 305 274Z"/></clipPath></defs>
    <g clipPath={`url(#${id}-sand)`} fill="#bead70"><path className="logo-sand-left" d="M45 135H208V330H45Z"/><path className="logo-sand-right" d="M160 74H317V282H160Z"/></g>
    <path d="M34 320V87L323 320V87" stroke="#9c6816" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 87C11 74 21 63 34 63 M323 63C336 63 347 74 347 87" stroke="#dfcb91" strokeWidth="1.5" opacity=".8"/>
  </svg>;
}
