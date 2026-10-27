import type { MusicTrack } from './eras/contracts';

// Keep the uploaded filenames intact. Only tracks with an MP3 appear in the player.
const files: Record<string, [string, string]> = {
  '01topnfXJFjW4iQMVAXAo8': ['70s', 'Dancing Queen.mp3'],
  '1yslmgUcM2AOkOPS4sl3QV': ['70s', 'Queen – Bohemian Rhapsody (Official Video Remastered).mp3'],
  '0yrCNC1tKhMlmtvl3sKXp3': ['70s', 'September.mp3'],
  '5r9AgnhkPQXeKG1w5rauDq': ['80s', "Guns N' Roses - Sweet Child O' Mine.mp3"],
  '5NIPsWpDjJTFBoPxCUUeXp': ['80s', "Guns'n Roses - Welcome to the Jungle ( Studio Version ) High Quality.mp3"],
  '5ChkMS8OtdzJeqyybCc9R5': ['80s', 'Billie Jean.mp3'],
  '5jVvwEH4nsTrDf2pU3IW2i': ['90s', 'De Música Ligera.mp3'],
  '1qPbGZqppFwLwcBC1JQ6Vr': ['90s', 'Wonderwall (Remastered).mp3'],
  '7MYHci3U9oUSwipkN31dsZ': ['90s', 'Nirvana - Smells Like Teen Spirit [Nevermind] [HQ Sound].mp3'],
  '60a0Rd6pjrkxjPbaKzXjfq': ['2000s', 'In the End.mp3'],
  '0BCPKOYdS2jbQ8iyB56Zns': ['2000s', 'Clocks.mp3'],
  '3ZFTkvIE7kyPt6Nu3PEa7V': ['2000s', "Shakira - Hips Don't Lie (featuring Wyclef Jean) (Official 4K Video) ft. Wyclef Jean.mp3"],
};

export function localTracks(tracks: MusicTrack[]): MusicTrack[] {
  return tracks.flatMap(track => {
    const file = files[track.spotifyId];
    return file ? [{ ...track, audioSrc: `/music/${file[0]}/${encodeURIComponent(file[1])}` }] : track.audioSrc ? [track] : [];
  });
}
