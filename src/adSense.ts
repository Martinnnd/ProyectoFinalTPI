const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID?.trim();

export const adSensePublisherId =
  publisherId && /^ca-pub-\d{16}$/.test(publisherId) ? publisherId : undefined;

export const adSenseSlots = {
  feed: process.env.NEXT_PUBLIC_ADSENSE_FEED_SLOT?.trim(),
  memory: process.env.NEXT_PUBLIC_ADSENSE_MEMORY_SLOT?.trim(),
};
