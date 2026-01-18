
// Play blast sound effect
export const playBlastSound = () => {
  try {
    // Check if AudioContext is supported
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.log("AudioContext not supported");
      return;
    }

    const audioContext = new AudioContext();
    
    // Resume audio context if it's suspended (required for user interaction)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Create a more realistic explosion sound using multiple oscillators
    const createExplosionSound = () => {
      const duration = 0.5;
      const currentTime = audioContext.currentTime;
      
      // Low frequency rumble
      const lowOsc = audioContext.createOscillator();
      const lowGain = audioContext.createGain(); // Fixed: was createGainNode()
      lowOsc.frequency.setValueAtTime(50, currentTime);
      lowOsc.frequency.exponentialRampToValueAtTime(20, currentTime + duration);
      lowGain.gain.setValueAtTime(0.3, currentTime);
      lowGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      
      // Mid frequency boom
      const midOsc = audioContext.createOscillator();
      const midGain = audioContext.createGain(); // Fixed: was createGainNode()
      midOsc.frequency.setValueAtTime(150, currentTime);
      midOsc.frequency.exponentialRampToValueAtTime(50, currentTime + duration * 0.3);
      midGain.gain.setValueAtTime(0.4, currentTime);
      midGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration * 0.5);
      
      // High frequency crack
      const highOsc = audioContext.createOscillator();
      const highGain = audioContext.createGain(); // Fixed: was createGainNode()
      highOsc.frequency.setValueAtTime(800, currentTime);
      highOsc.frequency.exponentialRampToValueAtTime(200, currentTime + duration * 0.1);
      highGain.gain.setValueAtTime(0.2, currentTime);
      highGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration * 0.2);
      
      // Connect and play
      lowOsc.connect(lowGain);
      midOsc.connect(midGain);
      highOsc.connect(highGain);
      
      lowGain.connect(audioContext.destination);
      midGain.connect(audioContext.destination);
      highGain.connect(audioContext.destination);
      
      lowOsc.start(currentTime);
      midOsc.start(currentTime);
      highOsc.start(currentTime);
      
      lowOsc.stop(currentTime + duration);
      midOsc.stop(currentTime + duration * 0.5);
      highOsc.stop(currentTime + duration * 0.2);
    };
    
    createExplosionSound();
  } catch (error) {
    console.log("Audio error:", error.message);
  }
};

// Create blast shine effect
export const createBlastShineEffect = (element) => {
  const shine = document.createElement('div');
  shine.className = 'blast-shine';
  
  element.style.position = 'relative';
  element.appendChild(shine);
  
  // Remove the shine effect after animation completes
  setTimeout(() => {
    if (shine.parentNode) {
      shine.parentNode.removeChild(shine);
    }
  }, 800);
};

// Create explosion particle effect
export const createExplosionEffect = (element) => {
  const particleCount = 8;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'explosion-particle';
    
    const angle = (360 / particleCount) * i;
    particle.style.setProperty('--angle', `${angle}deg`);
    particle.style.setProperty('--delay', `${i * 0.05}s`);
    
    element.style.position = 'relative';
    element.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 600);
  }
};
