// Short original mechanical cues, synthesized locally after a user gesture.
let context: AudioContext | undefined;
export function deviceSound(decade: number) {
  if (decade !== 1980 && decade !== 1990) return;
  try {
    context ??= new AudioContext();
    const audio = context;
    void audio
      .resume()
      .then(() => {
        const notes =
          decade === 1980
            ? [
                [0, 1900, 0.11],
                [0.07, 2800, 0.12],
                [0.24, 180, 0.08],
              ]
            : [
                [0, 130, 0.06],
                [0.1, 240, 0.05],
                [0.22, 90, 0.09],
              ];
        for (const [delay, frequency, duration] of notes) {
          const oscillator = audio.createOscillator();
          const gain = audio.createGain();
          const start = audio.currentTime + delay;
          oscillator.type = decade === 1980 ? "sine" : "triangle";
          oscillator.frequency.setValueAtTime(frequency, start);
          oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, start + duration);
          gain.gain.setValueAtTime(0.055, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          oscillator.connect(gain);
          gain.connect(audio.destination);
          oscillator.start(start);
          oscillator.stop(start + duration);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        }
      })
      .catch(() => {});
  } catch {
    /* Selection remains available when audio is unsupported. */
  }
}
