/* ═══════════════════════════════════════════════════════════════
   ambient-audio.js — Procedural Underwater Soundscape
   
   A rich, evolving underwater ambience generated via Web Audio API.
   No external audio files needed. Layers:
     1. Deep tonal drone (multiple detuned oscillators)
     2. Slow tidal movement (LFOs modulating volume + pitch)
     3. Distant whale-like calls (slow pitch sweeps)
     4. Bubble textures (filtered noise bursts)
     5. Pressure hum (very low sub-bass)
   
   Usage: Include this script, then call:
     ambientAudio.init()   — once, on first user click
     ambientAudio.toggle() — toggle on/off
     ambientAudio.isPlaying — boolean state
   ═══════════════════════════════════════════════════════════════ */

const ambientAudio = (() => {
	let ctx = null;
	let masterGain = null;
	let isPlaying = false;
	let initialized = false;
	let schedulerInterval = null;

	function init() {
		if (initialized) return;
		ctx = new (window.AudioContext || window.webkitAudioContext)();
		masterGain = ctx.createGain();
		masterGain.gain.value = 0;
		masterGain.connect(ctx.destination);

		// ── Layer 1: Deep Drone (detuned sine cluster) ──
		const droneGain = ctx.createGain();
		droneGain.gain.value = 0.15;
		droneGain.connect(masterGain);

		const droneFreqs = [48, 55, 72, 82.5, 110, 147];
		const droneVolumes = [0.15, 0.12, 0.06, 0.08, 0.04, 0.02];

		droneFreqs.forEach((freq, i) => {
			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.value = freq;

			// Slight random detune for richness
			osc.detune.value = (Math.random() - 0.5) * 8;

			const g = ctx.createGain();
			g.gain.value = droneVolumes[i];

			// Individual slow LFO for each voice
			const lfo = ctx.createOscillator();
			lfo.type = 'sine';
			lfo.frequency.value = 0.03 + Math.random() * 0.05;
			const lfoGain = ctx.createGain();
			lfoGain.gain.value = droneVolumes[i] * 0.3;
			lfo.connect(lfoGain);
			lfoGain.connect(g.gain);
			lfo.start();

			osc.connect(g);
			g.connect(droneGain);
			osc.start();
		});

		// ── Layer 2: Sub-bass pressure hum ──
		const subOsc = ctx.createOscillator();
		subOsc.type = 'sine';
		subOsc.frequency.value = 30;
		const subGain = ctx.createGain();
		subGain.gain.value = 0.08;

		const subLfo = ctx.createOscillator();
		subLfo.type = 'sine';
		subLfo.frequency.value = 0.02;
		const subLfoGain = ctx.createGain();
		subLfoGain.gain.value = 5; // modulate pitch slightly
		subLfo.connect(subLfoGain);
		subLfoGain.connect(subOsc.frequency);
		subLfo.start();

		subOsc.connect(subGain);
		subGain.connect(masterGain);
		subOsc.start();

		// ── Layer 3: Filtered noise (water texture) ──
		const noiseLength = 4 * ctx.sampleRate;
		const noiseBuffer = ctx.createBuffer(2, noiseLength, ctx.sampleRate);
		for (let ch = 0; ch < 2; ch++) {
			const data = noiseBuffer.getChannelData(ch);
			for (let i = 0; i < noiseLength; i++) {
				data[i] = Math.random() * 2 - 1;
			}
		}

		const noise = ctx.createBufferSource();
		noise.buffer = noiseBuffer;
		noise.loop = true;

		// Bandpass for underwater muffled quality
		const noiseBP = ctx.createBiquadFilter();
		noiseBP.type = 'bandpass';
		noiseBP.frequency.value = 400;
		noiseBP.Q.value = 0.8;

		// LFO on filter frequency for movement
		const noiseLfo = ctx.createOscillator();
		noiseLfo.type = 'sine';
		noiseLfo.frequency.value = 0.07;
		const noiseLfoGain = ctx.createGain();
		noiseLfoGain.gain.value = 200;
		noiseLfo.connect(noiseLfoGain);
		noiseLfoGain.connect(noiseBP.frequency);
		noiseLfo.start();

		const noiseGain = ctx.createGain();
		noiseGain.gain.value = 0.012;

		noise.connect(noiseBP);
		noiseBP.connect(noiseGain);
		noiseGain.connect(masterGain);
		noise.start();

		// ── Layer 4: Whale-like calls (scheduled pitch sweeps) ──
		function scheduleWhaleCall() {
			if (!isPlaying) return;

			const now = ctx.currentTime;
			const duration = 3 + Math.random() * 4;
			const startFreq = 120 + Math.random() * 80;
			const endFreq = startFreq + (Math.random() - 0.5) * 60;

			const osc = ctx.createOscillator();
			osc.type = 'sine';
			osc.frequency.setValueAtTime(startFreq, now);
			osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.6);
			osc.frequency.exponentialRampToValueAtTime(
				startFreq * 0.8,
				now + duration,
			);

			const g = ctx.createGain();
			g.gain.setValueAtTime(0, now);
			g.gain.linearRampToValueAtTime(0.015, now + duration * 0.15);
			g.gain.setValueAtTime(0.015, now + duration * 0.5);
			g.gain.linearRampToValueAtTime(0, now + duration);

			// Slight reverb-like effect via delay
			const delay = ctx.createDelay();
			delay.delayTime.value = 0.3;
			const delayGain = ctx.createGain();
			delayGain.gain.value = 0.3;

			const lp = ctx.createBiquadFilter();
			lp.type = 'lowpass';
			lp.frequency.value = 300;

			osc.connect(g);
			g.connect(lp);
			lp.connect(masterGain);
			g.connect(delay);
			delay.connect(delayGain);
			delayGain.connect(lp);

			osc.start(now);
			osc.stop(now + duration + 0.5);

			// Schedule next call
			const nextDelay = 8000 + Math.random() * 15000;
			setTimeout(scheduleWhaleCall, nextDelay);
		}

		// ── Layer 5: Bubble bursts (random filtered noise pops) ──
		function scheduleBubble() {
			if (!isPlaying) return;

			const now = ctx.currentTime;
			const bubbleLen = 0.05 + Math.random() * 0.15;

			const bufLen = Math.ceil(bubbleLen * ctx.sampleRate);
			const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
			const data = buf.getChannelData(0);
			for (let i = 0; i < bufLen; i++) {
				data[i] = Math.random() * 2 - 1;
			}

			const src = ctx.createBufferSource();
			src.buffer = buf;

			const bp = ctx.createBiquadFilter();
			bp.type = 'bandpass';
			bp.frequency.value = 1500 + Math.random() * 3000;
			bp.Q.value = 5 + Math.random() * 10;

			const g = ctx.createGain();
			g.gain.setValueAtTime(0, now);
			g.gain.linearRampToValueAtTime(0.008 + Math.random() * 0.01, now + 0.01);
			g.gain.linearRampToValueAtTime(0, now + bubbleLen);

			src.connect(bp);
			bp.connect(g);
			g.connect(masterGain);
			src.start(now);

			const nextDelay = 200 + Math.random() * 2000;
			setTimeout(scheduleBubble, nextDelay);
		}

		// Start the scheduled layers when playing
		function startScheduled() {
			setTimeout(scheduleWhaleCall, 3000 + Math.random() * 5000);
			setTimeout(scheduleBubble, 500);
		}

		// Store the starter function
		ctx._startScheduled = startScheduled;

		initialized = true;
	}

	function toggle() {
		if (!initialized) init();

		isPlaying = !isPlaying;

		if (isPlaying) {
			if (ctx.state === 'suspended') ctx.resume();
			masterGain.gain.setTargetAtTime(0.7, ctx.currentTime, 0.8);
			ctx._startScheduled();
		} else {
			masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
		}

		return isPlaying;
	}

	return {
		init,
		toggle,
		get isPlaying() {
			return isPlaying;
		},
	};
})();
