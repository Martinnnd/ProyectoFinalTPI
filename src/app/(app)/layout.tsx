import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "../../styles.css";
import "../../themes.css";
import "../../social.css";
import "../../components/social/socialFeed.css";
import "../../components/social/hashtags.css";
import "../../components/community.css";
import "../../components/chat.css";
import "../../components/notification.css";
import "../../components/mapbox.css";
import "../../eras/70s/theme.css";
import "../../eras/80s/theme.css";
import "../../eras/90s/theme.css";
import "../../eras/2000s/theme.css";
import "../../eras/2010s/theme.css";
import "../../components/social/feedLayout.css";
import "../../components/eraTimeline.css";
import "../../components/eraScrollbars.css";
import "../../components/profileLayout.css";
import "../../components/chatTaskbar.css";
import "../../eras/70s/tvViews.css";
import "../../mobile.css";
import "../../eras/2020s/theme.css";
import "../../components/auth/guestAccess.css";

import { EraProvider } from "../../context/EraContext";
import { FollowProvider } from "../../context/FollowContext";
import { RatingsProvider } from "../../context/RatingsContext";
import AppShell from "../../components/layout/AppShell";
import { GuestAccessProvider } from "../../components/auth/GuestAccessProvider";

export const metadata: Metadata = {
  title: "Nostalgiar",
  description: "Historias, lugares y música de nuestras épocas",
};

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <EraProvider>
      <RatingsProvider>
        <FollowProvider>
          <GuestAccessProvider><AppShell>{children}</AppShell></GuestAccessProvider>
        </FollowProvider>
      </RatingsProvider>
    </EraProvider>
  );
}
