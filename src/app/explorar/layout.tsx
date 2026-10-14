import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "../../styles.css";
import "../../themes.css";
import "../../social.css";
import "../../components/social/socialFeed.css";
import "../../components/social/hashtags.css";
import "../../components/community.css";
import "../../components/chat.css";
import "../../components/mapbox.css";
import "../../eras/70s/theme.css";
import "../../eras/80s/theme.css";
import "../../eras/90s/theme.css";
import "../../eras/2000s/theme.css";
import "../../mobile.css";
import "../../components/social/feedLayout.css";
import "../../components/eraTimeline.css";
import "../../components/eraScrollbars.css";
import "../../components/profileLayout.css";
import "../../components/chatTaskbar.css";
import "../../eras/70s/tvViews.css";

export const metadata: Metadata = {
  title: "Explorar | Nostalgiar",
};

export default function ExploreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
