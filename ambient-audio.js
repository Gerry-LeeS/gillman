const ambientAudio = (() => {
	let audio = null;
	let playing = false;
	let fadeInterval = null;
	const maxVolume = 0.08; // Adjust this — 0.3 is subtle, 0.5 is noticeable
	const fadeStep = 0.01;
	const fadeTime = 20; // ms per step

	function init() {
		if (audio) return;
		audio = new Audio('ambient-track.mp3'); // Your file name here
		audio.loop = true;
		audio.volume = 0;
	}

	function fadeIn() {
		clearInterval(fadeInterval);
		fadeInterval = setInterval(() => {
			if (audio.volume < maxVolume - fadeStep) {
				audio.volume = Math.min(audio.volume + fadeStep, maxVolume);
			} else {
				audio.volume = maxVolume;
				clearInterval(fadeInterval);
			}
		}, fadeTime);
	}

	function fadeOut(andPause) {
		clearInterval(fadeInterval);
		fadeInterval = setInterval(() => {
			if (audio.volume > fadeStep) {
				audio.volume = Math.max(audio.volume - fadeStep, 0);
			} else {
				audio.volume = 0;
				if (andPause) audio.pause();
				clearInterval(fadeInterval);
			}
		}, fadeTime);
	}

	function toggle() {
		init();
		if (playing) {
			fadeOut(true);
			playing = false;
		} else {
			audio.play();
			fadeIn();
			playing = true;
		}
		return playing;
	}

	return {
		init,
		toggle,
		get isPlaying() {
			return playing;
		},
	};
})();
