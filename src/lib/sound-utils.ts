
// Sound utility functions for the snake game

// Sound effect types
export type SoundEffect = 
  | 'eat'
  | 'gameOver'
  | 'powerUp'
  | 'levelUp'
  | 'collision'
  | 'move'
  | 'buttonClick'
  | 'teleport';

// Sound manager class to handle all game sounds
export class SoundManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private isMuted: boolean = false;

  constructor() {
    // Initialize sounds
    this.initializeSounds();
  }

  private initializeSounds() {
    // Define sound URLs
    const soundUrls: Record<SoundEffect, string> = {
      eat: 'https://assets.codepen.io/21542/howler-push.mp3',
      gameOver: 'https://assets.codepen.io/21542/howler-sfx-lose.mp3',
      powerUp: 'https://assets.codepen.io/21542/howler-coin.mp3',
      levelUp: 'https://assets.codepen.io/21542/howler-bling.mp3',
      collision: 'https://assets.codepen.io/21542/howler-boing.mp3',
      move: 'https://assets.codepen.io/21542/howler-blip.mp3',
      buttonClick: 'https://assets.codepen.io/21542/howler-select.mp3',
      teleport: 'https://assets.codepen.io/21542/howler-panda.mp3'
    };

    // Create audio elements for each sound
    Object.entries(soundUrls).forEach(([type, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.volume = this.getVolumeForType(type as SoundEffect);
      this.sounds.set(type as SoundEffect, audio);
    });
  }

  private getVolumeForType(type: SoundEffect): number {
    // Customize volume for different sound types
    switch (type) {
      case 'move':
        return 0.2; // Low volume for movement sounds
      case 'eat':
        return 0.5;
      case 'gameOver':
        return 0.8;
      case 'levelUp':
        return 0.7;
      case 'teleport':
        return 0.6;
      case 'collision':
        return 0.5;
      default:
        return 0.6;
    }
  }

  public play(type: SoundEffect) {
    if (this.isMuted) return;

    const sound = this.sounds.get(type);
    if (sound) {
      // Clone and play for overlapping sounds
      if (type === 'eat' || type === 'move') {
        const clone = sound.cloneNode() as HTMLAudioElement;
        clone.volume = sound.volume;
        clone.play().catch(e => console.error("Error playing sound:", e));
      } else {
        // Reset and play for non-overlapping sounds
        sound.currentTime = 0;
        sound.play().catch(e => console.error("Error playing sound:", e));
      }
    }
  }

  public mute() {
    this.isMuted = true;
  }

  public unmute() {
    this.isMuted = false;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public isMutedStatus() {
    return this.isMuted;
  }
}

// Create a singleton instance for global use
export const soundManager = new SoundManager();

// Utility function to play a sound
export const playSound = (type: SoundEffect) => {
  soundManager.play(type);
};
