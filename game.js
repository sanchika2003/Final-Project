var screen = document.querySelectorAll(".screen");
var startBtn = document.querySelector("button");
var allelem = document.querySelectorAll(".elem");
var pg = document.querySelector(".playground");
var selected = "";
var gameOverMsg = document.getElementById("game-over");
var timeDiv = document.getElementById('time-value');
var scorevalue = document.getElementById('score-value');
var timerBar = document.getElementById('timer-bar');
var timerBarContainer = document.getElementById('timer-bar-container');

var score = 0;
var sec = 0;
var gameActive = true;

// Get screen dimensions for responsive sizing
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

// Adjust difficulty settings based on screen size
var difficulty = "easy";
var round = 1;
var difficultySettings = {
    easy:   { timer: 60, imgSize: getResponsiveSize(100), spawnDelays: [1000, 1500], next: 20 },
    medium: { timer: 60, imgSize: getResponsiveSize(70),  spawnDelays: [700, 1100], next: 40 },
    hard:   { timer: 60, imgSize: getResponsiveSize(50),  spawnDelays: [400, 700], next: Infinity }
};

// Function to calculate responsive size based on screen dimensions
function getResponsiveSize(baseSize) {
    // For very small screens
    if (screenWidth < 400) {
        return baseSize * 0.6;
    }
    // For small screens
    else if (screenWidth < 600) {
        return baseSize * 0.8;
    }
    // For medium screens
    else if (screenWidth < 900) {
        return baseSize * 0.9;
    }
    // For large screens
    else {
        return baseSize;
    }
}

// Update sizes when window is resized
window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    
    // Update difficulty settings with new responsive sizes
    difficultySettings.easy.imgSize = getResponsiveSize(100);
    difficultySettings.medium.imgSize = getResponsiveSize(70);
    difficultySettings.hard.imgSize = getResponsiveSize(50);
});

var warningAudio = new Audio('10sec-countdown-bell-sound-79584.mp3');
var warningPlayed = false;

// Background music setup
var bgMusic = new Audio('background-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.25; // Lower volume for background

var spawnInterval = null;
var rocksInterval = null;

// On page load, always show the first screen and hide the modal
window.addEventListener('DOMContentLoaded', function() {
    screen.forEach((s, i) => s.classList.remove('active'));
    screen[0].classList.add('active');
    if (modal) modal.style.display = 'none';
    bgMusic.pause();
    bgMusic.currentTime = 0;
});

startBtn.addEventListener("click", function(){
    screen.forEach((s, i) => s.classList.remove('active'));
    screen[1].classList.add('active');
    bgMusic.currentTime = 0;
    bgMusic.play();
});

allelem.forEach(function(elem){
    elem.addEventListener("click", function(){  
        if (gameActive) { 
            //selected = elem.childNodes[3].src;
            //if (!selected) return; // Don't start if no image
            let imgElement = elem.querySelector('img'); // More direct way to get the img
            if (imgElement && imgElement.src) {
                selected = imgElement.src;
            screen.forEach((s, i) => s.classList.remove('active'));
            screen[2].classList.add('active');

            score = 0;
            sec = 0;
            scorevalue.innerHTML = score;
            timeDiv.innerHTML = "0 : 0";
            gameActive = true;

            // Add initial image to the playground
            const img = createImg();
            if (img) {
                pg.appendChild(img);
                const {h, w, rot} = getRandom();
                img.style.left = w + "px";
                img.style.top = h + "px";
                img.style.rotate = rot + "deg";
                
                // Disappear after a delay
                setTimeout(() => {
                    if (pg.contains(img)) img.remove();
                }, levelSettings[currentLevel-1].disappear);
            }
            
            startTimer();
        } else {
            console.error("Could not find a valid image source in the selected element.");
            return;
        }
        }
    });
});

// --- Level system variables ---
var currentLevel = 1;
var levelSettings = [
  { timer: 30, imgSize: 100, spawnDelays: [1000, 1500], disappear: 2000 }, // Level 1
  { timer: 30, imgSize: 100, spawnDelays: [400, 600], disappear: 900 }   // Level 2: faster vanish
];

// Add a continue button to the modal (reuse modal)
if (!document.getElementById('modal-continue')) {
  var continueBtn = document.createElement('button');
  continueBtn.id = 'modal-continue';
  continueBtn.textContent = 'Continue';
  continueBtn.style.display = 'none';
  continueBtn.style.fontSize = '1.1em';
  continueBtn.style.padding = '10px 28px';
  continueBtn.style.marginTop = '10px';
  document.getElementById('gameover-box').appendChild(continueBtn);
}
var modalContinue = document.getElementById('modal-continue');

// Restore the global handler for Continue button
modalContinue.onclick = function() {
    modal.style.display = 'none';
    currentLevel = 2;
    score = 0;
    sec = 0;
    scorevalue.innerHTML = score;
    timeDiv.innerHTML = "0 : 0";
    // Do NOT reset selected, keep the same creature
    pg.innerHTML = '';
    gameActive = true;
    // Go directly to the game screen
    screen.forEach((s, i) => s.classList.remove('active'));
    screen[2].classList.add('active');
    // Add rocks for level 2
    addRocks();
    // Add initial image to the playground
    const img = createImg();
    if (img) {
        pg.appendChild(img);
        const {h, w, rot} = getRandom();
        img.style.left = w + "px";
        img.style.top = h + "px";
        img.style.rotate = rot + "deg";
        setTimeout(() => {
            if (pg.contains(img)) img.remove();
        }, levelSettings[currentLevel-1].disappear);
    }
    startTimer();
    modalContinue.style.display = 'none';
    modalLeaderboard.style.display = '';
    modalPlayAgain.style.display = '';
};

// Update createImg to use level disappear time
function createImg(){
    if (!gameActive) return null; 
    console.log("Creating image with selected:", selected); 
    var img = document.createElement("img");
    
    // Add error handling for image loading
    img.onerror = function() {
        console.error("Failed to load image:", selected);
        this.remove();
    };
    
    img.onload = function() {
        console.log("Image loaded successfully:", selected);
    };
    
    img.setAttribute("src", selected);
    img.setAttribute("alt", "Game character");
    
    // Set responsive size based on current difficulty
    var size = difficultySettings[difficulty].imgSize;
    img.style.height = size + "px";
    
    // Add both click and touch events for better device compatibility
    img.addEventListener("click", catchImg);
    img.addEventListener("touchstart", catchImg);
    
    return img;
}

function getRandom(){
    const h = Math.random() * (window.innerHeight - 200);
    const w = Math.random() * (window.innerWidth - 200);
    const rot = Math.floor(Math.random() * 360);
    return {h, w, rot};
}

// Add touch event support for mobile devices
function catchImg(event){
    if (!gameActive) return; 
    
    // Prevent default behavior for touch events
    if (event) {
        event.preventDefault();
    }

    increaseScore();
    
    // Remove the clicked/touched image
    if (this && this.parentNode) {
        this.remove();
    } else {
        // Fallback if this context is lost
        var img = document.querySelector(".playground img");
        if(img){
            img.remove();
        }
    }

    // Add new images
    addImg();
}

function increaseScore(){
    score++;
    scorevalue.innerHTML = score;
}

// Update addImg to use level spawnDelays
function addImg(){
    if (!gameActive) return; 
    let delays = levelSettings[currentLevel-1].spawnDelays;
    console.log("Current level:", currentLevel, "Selected image:", selected);
    
    // Create and add images with delays
    setTimeout(() => {
        const img = createImg();
        if (img) {
            pg.appendChild(img);
            const {h, w, rot} = getRandom();
            img.style.left = w + "px";
            img.style.top = h + "px";
            img.style.rotate = rot + "deg";
            
            // Disappear after a delay
            setTimeout(() => {
                if (pg.contains(img)) img.remove();
            }, levelSettings[currentLevel-1].disappear);
        }
    }, delays[0]);
    
    setTimeout(() => {
        const img = createImg();
        if (img) {
            pg.appendChild(img);
            const {h, w, rot} = getRandom();
            img.style.left = w + "px";
            img.style.top = h + "px";
            img.style.rotate = rot + "deg";
            
            // Disappear after a delay
            setTimeout(() => {
                if (pg.contains(img)) img.remove();
            }, levelSettings[currentLevel-1].disappear);
        }
    }, delays[1]);
}

// Add global for timer interval
var timerInterval = null;

function startTimer(){
    var total = levelSettings[currentLevel-1].timer;
    sec = total;
    timeDiv.innerHTML = `${Math.floor(sec / 60)} : ${sec % 60}`;
    timeDiv.style.color = '#fff';
    warningPlayed = false;
    // Clear any previous intervals
    if (spawnInterval) clearInterval(spawnInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    // Start spawning creatures immediately
    addImg();
    // Set up continuous spawning
    spawnInterval = setInterval(addImg, levelSettings[currentLevel-1].spawnDelays[0]);
    
    timerInterval = setInterval(function(){
        sec--;
        timeDiv.innerHTML = `${Math.floor(sec / 60)} : ${sec % 60}`;
        if (sec <= 15) {
            timeDiv.style.color = '#ff2d2d';
            timeDiv.style.fontWeight = 'bold';
            timeDiv.style.transition = 'color 0.3s';
        } else {
            timeDiv.style.color = '#fff';
            timeDiv.style.fontWeight = 'normal';
        }
        if (!warningPlayed && sec === 10) {
            warningAudio.currentTime = 0;
            warningAudio.play();
            warningPlayed = true;
        }
        // Burst of creatures in the last 5 seconds
        if (sec <= 5 && sec > 0) {
            // Add multiple creatures with proper positioning
            for (let i = 0; i < 3; i++) {
                const img = createImg();
                if (img) {
                    pg.appendChild(img);
                    const {h, w, rot} = getRandom();
                    img.style.left = w + "px";
                    img.style.top = h + "px";
                    img.style.rotate = rot + "deg";
                    
                    // Disappear after a delay
                    setTimeout(() => {
                        if (pg.contains(img)) img.remove();
                    }, levelSettings[currentLevel-1].disappear);
                }
            }
        }
        if(sec <= 0){ 
            clearInterval(timerInterval);
            timerInterval = null;
            if (spawnInterval) clearInterval(spawnInterval);
            spawnInterval = null;
            endLevel(); 
        }
    }, 1000);
}

// --- Modal/Leaderboard logic ---
const modal = document.getElementById('gameover-modal');
const modalTitle = document.getElementById('modal-title');
const modalScore = document.getElementById('modal-score');
const modalNameEntry = document.getElementById('modal-name-entry');
const modalName = document.getElementById('modal-name');
const modalSubmit = document.getElementById('modal-submit');
const modalLeaderboard = document.getElementById('modal-leaderboard');
const modalLeaderboardList = document.getElementById('modal-leaderboard-list');
const modalPlayAgain = document.getElementById('modal-play-again');

// Update leaderboard functions to use backend API
async function getLeaderboard() {
    try {
        const response = await fetch('http://localhost:3000/api/scores');
        const data = await response.json();
        // Handle both array and object with scores property
        return Array.isArray(data) ? data : (data.scores || []);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

// High Score logic
var highScoreSpan = document.getElementById('high-score');
var highScore = 0;

// Function to update high score from leaderboard
async function updateHighScore() {
    const scores = await getLeaderboard();
    if (scores && scores.length > 0) {
        const topScore = Math.max(...scores.map(s => s.score));
        highScore = topScore;
        highScoreSpan.innerText = highScore;
    } else {
        highScore = 0;
        highScoreSpan.innerText = '0';
    }
}

window.addEventListener('DOMContentLoaded', updateHighScore);

// After saving a new score, update high score if needed
async function saveLeaderboard(score, name) {
    try {
        const response = await fetch('http://localhost:3000/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, score })
        });
        const result = await response.json();
        console.log('Score saved:', result);
        // Update high score if this score is higher
        if (score > highScore) {
            highScore = score;
            highScoreSpan.innerText = highScore;
        }
        return result;
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

function showModal(score) {
    modal.style.display = 'flex';
    modalTitle.textContent = 'GAME OVER';
    modalScore.innerHTML = `Your Score: <b>${score}</b>`;
    modalNameEntry.style.display = 'block';
    modalName.value = '';
    
    modalSubmit.onclick = async function() {
        var name = modalName.value.trim() || 'Player';
        await saveLeaderboard(score, name);
        modalNameEntry.style.display = 'none';
        updateModalLeaderboard();
    };
    
    updateModalLeaderboard();
}

async function updateModalLeaderboard() {
    const scores = await getLeaderboard();
    modalLeaderboardList.innerHTML = '<h3>Leaderboard</h3>';
    if (scores && scores.length > 0) {
        scores.sort((a, b) => b.score - a.score); // Sort by score in descending order
        scores.forEach(function(entry, index) {
            var li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
            modalLeaderboardList.appendChild(li);
        });
    } else {
        var li = document.createElement('li');
        li.textContent = 'No scores yet';
        modalLeaderboardList.appendChild(li);
    }
}

modalPlayAgain.onclick = function() {
    modal.style.display = 'none';
    screen.forEach((s, i) => s.classList.remove('active'));
    screen[1].classList.add('active');
    score = 0;
    sec = 0;
    round = 1;
    difficulty = "easy";
    currentLevel = 1; // Reset to level 1
    scorevalue.innerHTML = score;
    timeDiv.innerHTML = "0 : 0";
    selected = "";
    pg.innerHTML = '';
    gameActive = true;
    bgMusic.pause();
    bgMusic.currentTime = 0;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    if (spawnInterval) clearInterval(spawnInterval);
    spawnInterval = null;
    if (rocksInterval) clearInterval(rocksInterval);
    rocksInterval = null;
};

// End of level logic
function endLevel() {
    gameActive = false;
    pg.innerHTML = '';
    if (currentLevel === 1 && score >= 35) { // Require 35 to advance
        // Level up modal
        modal.style.display = 'flex';
        modalTitle.textContent = 'LEVEL UP!';
        modalScore.innerHTML = `You caught <b>${score}</b> creatures!`;
        modalNameEntry.style.display = 'none';
        modalContinue.style.display = 'inline-block';
        modalLeaderboard.style.display = 'none';
        modalPlayAgain.style.display = 'none';
    } else {
        // Regular game over
        showModal(score);
        modalContinue.style.display = 'none';
        modalLeaderboard.style.display = '';
        modalPlayAgain.style.display = '';
    }
}
async function submitScore(playerName, score) {
    try {
        const response = await fetch('http://localhost:5000/leaderboard/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerName, score }),
        });
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}

// Function to create a rock
function createRock() {
    const rock = document.createElement('img');
    rock.className = 'rock';
    rock.src = 'rock.png';
    rock.style.position = 'absolute';
    rock.style.width = '60px';
    rock.style.height = '60px';
    rock.style.zIndex = '2';
    rock.style.left = Math.random() * (window.innerWidth - 80) + 'px';
    rock.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    rock.addEventListener('click', function() {
        score = Math.max(0, score - 1);
        scorevalue.innerHTML = score;
        rock.remove();
    });
    document.querySelector('.playground').appendChild(rock);
    setTimeout(() => {
        if (rock.parentNode) rock.remove();
    }, 2000);
}

// Function to add rocks in level 2
function addRocks() {
    // Call createRock multiple times every 2 seconds for more rocks
    if (rocksInterval) clearInterval(rocksInterval);
    rocksInterval = setInterval(() => {
        for (let i = 0; i < 3; i++) { // Increase this number for more rocks
            createRock();
        }
    }, 2000);
}

