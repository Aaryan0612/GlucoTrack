// scientific and therapeutic Web Audio API engine for GlucoTrack
let audioCtx = null;
let currentSource = null;
let activeOscillators = [];
let delayNode = null;
let delayFeedback = null;
let binauralLeft = null;
let binauralRight = null;
let sequencerInterval = null;
let bowlInterval = null;

// Frequencies for standard musical notes
const NOTES = {
  'E4': 329.63,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00,
  'B4': 493.88,
  'C5': 523.25,
  'D5': 587.33,
  'E5': 659.25,
  'F5': 698.46,
  'G5': 783.99,
  'A5': 880.00
};

// Song patterns: [note, duration in seconds, rest after note in seconds]
const SONGS = {
  chandTaare: [
    ['G4', 0.25, 0.05], ['G4', 0.25, 0.05], ['A4', 0.25, 0.05], ['G4', 0.25, 0.05],
    ['C5', 0.5, 0.08],  ['B4', 0.5, 0.08],  ['A4', 0.5, 0.08],  ['G4', 0.7, 0.2],
    ['A4', 0.25, 0.05], ['A4', 0.25, 0.05], ['B4', 0.25, 0.05], ['A4', 0.25, 0.05],
    ['D5', 0.5, 0.08],  ['C5', 0.5, 0.08],  ['B4', 0.5, 0.08],  ['A4', 0.7, 0.2],
    ['B4', 0.35, 0.05], ['B4', 0.35, 0.05], ['C5', 0.35, 0.05], ['D5', 0.5, 0.08],
    ['C5', 0.35, 0.05], ['B4', 0.35, 0.05], ['A4', 0.5, 0.08],  ['G4', 0.8, 0.3]
  ],
  pyarKeLiye: [
    ['E4', 0.35, 0.05], ['G4', 0.35, 0.05], ['A4', 0.35, 0.05], ['B4', 0.5, 0.08],
    ['B4', 0.35, 0.05], ['A4', 0.35, 0.05], ['G4', 0.35, 0.05], ['A4', 0.7, 0.2],
    ['A4', 0.35, 0.05], ['C5', 0.35, 0.05], ['D5', 0.35, 0.05], ['E5', 0.5, 0.08],
    ['E5', 0.35, 0.05], ['D5', 0.35, 0.05], ['C5', 0.35, 0.05], ['D5', 0.7, 0.2],
    ['B4', 0.35, 0.05], ['A4', 0.35, 0.05], ['G4', 0.35, 0.05], ['E4', 0.6, 0.1],
    ['G4', 0.35, 0.05], ['A4', 0.35, 0.05], ['B4', 0.35, 0.05], ['A4', 0.8, 0.3]
  ],
  meriChunar: [
    ['G4', 0.25, 0.05], ['B4', 0.25, 0.05], ['D5', 0.25, 0.05], ['D5', 0.25, 0.05],
    ['D5', 0.25, 0.05], ['C5', 0.25, 0.05], ['B4', 0.25, 0.05], ['C5', 0.5, 0.15],
    ['A4', 0.25, 0.05], ['C5', 0.25, 0.05], ['E5', 0.25, 0.05], ['E5', 0.25, 0.05],
    ['E5', 0.25, 0.05], ['D5', 0.25, 0.05], ['C5', 0.25, 0.05], ['D5', 0.5, 0.15],
    ['D5', 0.3, 0.05],  ['E5', 0.3, 0.05],  ['F5', 0.3, 0.05],  ['E5', 0.3, 0.05],
    ['D5', 0.3, 0.05],  ['C5', 0.3, 0.05],  ['B4', 0.4, 0.05],  ['A4', 0.6, 0.3]
  ]
};

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// Play synth melody of a song
export function playSongMelody(songId, onNotePlayed) {
  initAudio();
  stopAllAudio();

  const pattern = SONGS[songId];
  if (!pattern) return;

  let noteIndex = 0;
  
  function playNext() {
    if (noteIndex >= pattern.length) {
      noteIndex = 0; // Loop song
    }

    const [noteName, duration, rest] = pattern[noteIndex];
    const freq = NOTES[noteName];
    
    if (freq) {
      // Trigger callback for UI visualizers
      if (onNotePlayed) onNotePlayed(noteName, noteIndex);

      // Synthesize note
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      // Delay feedback (Simple Reverb)
      if (!delayNode) {
        delayNode = audioCtx.createDelay(1.0);
        delayFeedback = audioCtx.createGain();
        delayNode.delayTime.value = 0.35;
        delayFeedback.gain.value = 0.4;
        
        delayNode.connect(delayFeedback);
        delayFeedback.connect(delayNode);
        delayNode.connect(audioCtx.destination);
      }

      osc.type = 'triangle'; // Warm, flute-like tone
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      gain.connect(delayNode);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
      
      activeOscillators.push(osc);
    }

    noteIndex++;
    sequencerInterval = setTimeout(playNext, (duration + rest) * 1000);
  }

  playNext();
}

// Synthesizes a metallic, long-decay Tibetan singing bowl strike
function triggerSingingBowl(time) {
  if (!audioCtx) return;

  // 432Hz fundamental with realistic non-harmonic overtones for singing bowl texture
  const overtones = [432, 776, 1220, 1500];
  const gains = [0.15, 0.08, 0.05, 0.03];
  const decayTime = 4.5;

  overtones.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    
    // Organc detuning for natural warmth/shimmer
    if (i > 0) {
      osc.frequency.setValueAtTime(freq + (Math.random() * 4 - 2), time);
    }

    gainNode.gain.setValueAtTime(0.001, time);
    // Strike (fast attack)
    gainNode.gain.linearRampToValueAtTime(gains[i], time + 0.06);
    // Exponential decay (long fade-out)
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + decayTime);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Reverb feedback link
    if (delayNode) {
      gainNode.connect(delayNode);
    }

    osc.start(time);
    osc.stop(time + decayTime);
    activeOscillators.push(osc);
  });
}

// Synthesize energetic & scientific meditation "Om" hum and Theta focus binaural beats
export function playMeditationOm() {
  initAudio();
  stopAllAudio();

  // 1. Scientific Binaural Beats (Theta waves @ 6Hz for focus & relaxation)
  // Higher carrier (250Hz) so it's fully audible on mobile speakers
  const oscL = audioCtx.createOscillator();
  const oscR = audioCtx.createOscillator();
  const panL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const panR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  const gainBinaural = audioCtx.createGain();

  oscL.frequency.value = 250; // 250Hz Left
  oscR.frequency.value = 256; // 256Hz Right (6Hz Binaural Theta focus)

  gainBinaural.gain.value = 0.12; // Audible yet pleasant background level

  if (panL && panR) {
    panL.pan.value = -1;
    panR.pan.value = 1;
    oscL.connect(panL);
    panL.connect(gainBinaural);
    oscR.connect(panR);
    panR.connect(gainBinaural);
  } else {
    oscL.connect(gainBinaural);
    oscR.connect(gainBinaural);
  }
  gainBinaural.connect(audioCtx.destination);
  oscL.start();
  oscR.start();
  activeOscillators.push(oscL, oscR);

  // 2. Warm resonant major chord (A3, C#4, E4, A4) representing the soulful "Om" chant
  // Frequencies: A3(216Hz), C#4(270Hz), E4(324Hz), A4(432Hz)
  const droneNotes = [216, 270, 324, 432];
  const droneOscs = [];
  
  const gainOm = audioCtx.createGain();
  const filterOm = audioCtx.createBiquadFilter();
  
  // Slowly pulse volume at 0.15Hz (~6.6 seconds per cycle) mimicking natural deep breathing
  const lfo = audioCtx.createOscillator();
  const lfoGain = audioCtx.createGain();
  lfo.frequency.value = 0.15;
  lfoGain.gain.value = 0.08;

  // Common delay feedback for spacey cathedral reverb
  if (!delayNode) {
    delayNode = audioCtx.createDelay(1.0);
    delayFeedback = audioCtx.createGain();
    delayNode.delayTime.value = 0.65;
    delayFeedback.gain.value = 0.55;
    
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayNode.connect(audioCtx.destination);
  }

  // Filter to keep the drone warm & voice-like (600Hz cut-off)
  filterOm.type = 'lowpass';
  filterOm.frequency.value = 600;
  filterOm.Q.value = 3.0;

  gainOm.gain.value = 0.18;

  lfo.connect(lfoGain);
  lfoGain.connect(gainOm.gain); // Pulse the chord drone volume

  droneNotes.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    // Alternating wave types for rich acoustic texture
    osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    
    osc.connect(filterOm);
    osc.start();
    droneOscs.push(osc);
    activeOscillators.push(osc);
  });

  filterOm.connect(gainOm);
  gainOm.connect(audioCtx.destination);
  gainOm.connect(delayNode);
  lfo.start();
  activeOscillators.push(lfo);

  // 3. Periodic Tibetan Singing Bowl Strike
  // Trigger immediate strike
  triggerSingingBowl(audioCtx.currentTime);

  // Set interval to repeat strike every 5 seconds
  bowlInterval = setInterval(() => {
    if (audioCtx && audioCtx.state !== 'suspended') {
      triggerSingingBowl(audioCtx.currentTime);
    }
  }, 5000);
}

// Stop all synth music & meditation sounds
export function stopAllAudio() {
  if (sequencerInterval) {
    clearTimeout(sequencerInterval);
    sequencerInterval = null;
  }
  if (bowlInterval) {
    clearInterval(bowlInterval);
    bowlInterval = null;
  }
  activeOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch (e) {
      // already stopped or not started
    }
  });
  activeOscillators = [];
}
