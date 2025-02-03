// Elements
const startBtn = document.getElementById("startRace");
const resetBtn = document.getElementById("resetBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const resultsOverlay = document.getElementById("resultsOverlay");
const closeResultsBtn = document.getElementById("closeResults");

// State
let raceInterval, timerInterval, timeRemaining, countdownInterval;
let raceFinished = false;
let finishTimes = [];
let allDogesFinished = false;

// Event Listeners
startBtn.addEventListener("click", startRace);
resetBtn.addEventListener("click", resetRace);
fullscreenBtn.addEventListener("click", toggleFullscreen);
closeResultsBtn.addEventListener("click", () => resultsOverlay.style.display = "none");

document.querySelectorAll(".keypad-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById("raceDuration");
    if (btn.id === "clearBtn") {
      input.value = "";
    } else {
      const numbers = input.value.replace(/:/g, '');
      if (numbers.length >= 4) return;
      const newValue = numbers + btn.dataset.value;
      input.value = formatDurationInput(newValue);
    }
  });
});

document.getElementById("raceDuration").addEventListener("input", (e) => {
  const numbers = e.target.value.replace(/[^\d]/g, '');
  e.target.value = formatDurationInput(numbers);
});

// Core Functions
function startRace() {
  const numDoge = parseInt(document.getElementById("numDoge").value);
  const durationInput = document.getElementById("raceDuration").value;
  
  // Parse duration
  let minutes = 0, seconds = 0;
  const parts = durationInput.split(':');
  if (parts.length === 2) {
    minutes = parseInt(parts[0]) || 0;
    seconds = parseInt(parts[1]) || 0;
  } else {
    const totalSeconds = parseInt(durationInput) || 0;
    minutes = Math.floor(totalSeconds / 60);
    seconds = totalSeconds % 60;
  }

  if (minutes < 0 || minutes > 99 || seconds < 0 || seconds > 59) {
    alert("Please enter valid minutes (0-99) and seconds (0-59)!");
    return;
  }

  const duration = minutes * 60 + seconds;
  
  if (!validateInputs(numDoge, duration)) return;

  document.getElementById("overlay").style.display = "none";
  document.querySelector(".race-container").style.display = "block";

  generateDoge(numDoge);

  // Start 5-second countdown
  let countdown = 5;
  const timerDisplay = document.getElementById("timerDisplay");
  timerDisplay.textContent = countdown.toString();

  countdownInterval = setInterval(() => {
    countdown--;
    timerDisplay.textContent = countdown.toString();

    if (countdown <= 0) {
      clearInterval(countdownInterval);
      startRaceLogic(duration); // Start race after countdown
    }
  }, 1000);
}

function generateDoge(num) {
  const track = document.getElementById("raceTrack");
  track.innerHTML = "";
  
  const dogeImages = Array.from({length: 50}, (_, i) => `doge${i+1}.png`);
  shuffleArray(dogeImages);

  // Get dimensions
  const header = document.querySelector('.race-header');
  const headerHeight = header.offsetHeight;
  const startY = headerHeight + 50; // 50px buffer below header
  const availableHeight = track.clientHeight - startY;
  const dogeHeight = 180;

  // Calculate dynamic spacing
  let spacing;
  if (num === 1) {
    spacing = 0; // Center single doge vertically
    const doge = createDogeElement(1, dogeImages[0]);
    doge.style.top = `${startY + (availableHeight - doge)/2}px`;
    track.appendChild(doge);
    return;
  } else {
    spacing = (availableHeight - dogeHeight) / (num - 1);
    spacing = Math.max(50, spacing); // Minimum 50px spacing
  }

  // Create doges with top positioning
  for (let i = 0; i < num; i++) {
    const doge = document.createElement("div");
    doge.className = "doge";
    doge.id = `doge${i+1}`;
    doge.innerHTML = `<img src="images/${dogeImages[i % 50]}" alt="Doge ${i+1}">`;
    
    // Position from top with buffer
    doge.style.top = `${startY + (spacing * i)}px`;
    doge.style.left = "0";
    
    track.appendChild(doge);
  }
}

function startRaceLogic(duration) {
  const doges = document.querySelectorAll(".doge");
  const timerDisplay = document.getElementById("timerDisplay");
  
  // Reset state
  timeRemaining = duration;
  finishTimes = [];
  allDogesssFinished = false;
  raceFinished = false;
  timerDisplay.textContent = formatTime(timeRemaining);
  
  // Store doge movement states
  const dogeStates = Array.from(doges).map(() => ({
    currentPosition: 0,
    currentSpeed: 0.5 + Math.random() * 1.5, // More randomization
    lastUpdateTime: Date.now(),
    finished: false
  }));

  // Race calculations
  const trackWidth = document.querySelector(".race-track").clientWidth;
  const baseSpeedPerMs = (trackWidth - 180) / (duration * 1000);

  // Timer
  const startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    timeRemaining = duration - Math.floor(elapsed / 1000);
    timerDisplay.textContent = formatTime(timeRemaining);
    
    if (timeRemaining <= 0 && !allDogessFinished) {
      clearInterval(timerInterval);
      checkAllFinished(doges, dogeStates);
    }
  }, 100);

  // Doges movement
  raceInterval = setInterval(() => {
    const now = Date.now();
    
    doges.forEach((doge, i) => {
      if (dogeStates[i].finished) return;
      
      const state = dogeStates[i];
      const deltaTime = now - state.lastUpdateTime;
      
      // More dynamic speed changes
      if (Math.random() < 0.2) {
        // 20% chance to reverse direction when changing speed
        const reverseChance = 0.2; // 20% chance of negative speed
        const speed = 0.3 + Math.random() * 2.0;
        state.currentSpeed = Math.random() < reverseChance ? -speed : speed;
      }
      
      const distanceMoved = baseSpeedPerMs * state.currentSpeed * deltaTime;
      state.currentPosition += distanceMoved;
      
      if (state.currentPosition >= trackWidth - 180) {
        state.currentPosition = trackWidth - 180;
        state.finished = true;
        finishTimes.push({
          id: doge.id,
          time: (Date.now() - startTime) / 1000,
          element: doge
        });
        
        if (!raceFinished) {
          raceFinished = true;
          timerDisplay.textContent = "00:00";
        }
      }

      doge.style.left = `${state.currentPosition}px`;
      state.lastUpdateTime = now;
    });

    // Check if all doges finished
    if (finishTimes.length === doges.length) {
      allDogessFinished = true;
      endRace();
    }
  }, 16);
}

function endRace() {
  clearInterval(raceInterval);
  clearInterval(timerInterval);
  
  // Sort results
  finishTimes.sort((a, b) => a.time - b.time);
  
  // Show results overlay
  showResults(finishTimes);
}

function showResults(results) {
  const podiumImages = document.querySelectorAll('.podium-img');
  const leaderboardBody = document.querySelector('#leaderboardTable tbody');
  
  // Clear previous results
  leaderboardBody.innerHTML = '';
  
  // Set podium images
  podiumImages[0].src = results[0].element.querySelector('img').src;
  podiumImages[1].src = results[1].element.querySelector('img').src;
  podiumImages[2].src = results[2].element.querySelector('img').src;
  
  // Populate leaderboard with all results
  results.forEach((result, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${result.id.replace('doge', 'Doge ')}</td>
      <td>${result.time.toFixed(2)}s</td>
    `;
    leaderboardBody.appendChild(row);
  });

  // Show results overlay
  resultsOverlay.style.display = 'flex';
}

// Helper Functions
function validateInputs(doges, duration) {
  if (isNaN(doges) || doges < 1 || doges > 100) {
    alert("Please enter between 1-50 doges!");
    return false;
  }
  if (duration < 1) {
    alert("Duration must be at least 1 second!");
    return false;
  }
  return true;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function resetRace() {
  clearInterval(raceInterval);
  clearInterval(timerInterval);
  clearInterval(countdownInterval); // Clear countdown interval
  document.getElementById("overlay").style.display = "flex";
  document.querySelector(".race-container").style.display = "none";
  resultsOverlay.style.display = "none";
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

function formatDurationInput(numbers) {
  if (numbers.length <= 2) return numbers;
  return numbers.substring(0, 2) + ':' + numbers.substring(2, 4);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function checkAllFinished(doges, dogeStates) {
  allDogesFinished = dogeStates.every(state => state.finished);
  if (!allDogesFinished) {
    // Continue updating positions until all doges finish
    requestAnimationFrame(() => checkAllFinished(doges, dogeStates));
  }
}
