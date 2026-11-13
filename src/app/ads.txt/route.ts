import { adSensePublisherId } from "../../adSense";

export function GET() {
  if (!adSensePublisherId) return new Response(null, { status: 404 });

  return new Response(`google.com, ${adSensePublisherId.slice(3)}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
