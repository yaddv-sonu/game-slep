import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CharacterCreator } from './characters.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x4a90e2); // Blue background like in the image

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Responsive camera setup
function updateCamera() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    camera.aspect = aspectRatio;
    
    // Adjust camera position based on aspect ratio
    if (aspectRatio < 1) {
        // Mobile/portrait mode
        camera.position.set(0, 0, 7);
    } else {
        // Desktop/landscape mode
        camera.position.set(0, 0, 5);
    }
    
    camera.updateProjectionMatrix();
}

// Initial camera setup
updateCamera();

// Power-up system
const powerUps = {
    superSlap: {
        active: false,
        duration: 5000,
        startTime: 0,
        color: 0xff0000
    },
    comboSlap: {
        active: false,
        duration: 3000,
        startTime: 0,
        color: 0x00ff00
    }
};

// Particle system for effects
const particleGeometry = new THREE.BufferGeometry();
const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particles);

// Create characters
const characterCreator = new CharacterCreator();
const employee = characterCreator.createEmployee();
const boss = characterCreator.createBoss();

// Position characters
employee.position.x = -1.5;
boss.position.x = 0.5;

scene.add(employee);
scene.add(boss);

// Add slap animation
const slapAnimation = {
    isSlapping: false,
    progress: 0,
    duration: 500,
    startTime: 0,
    power: 1
};

// Slap counter
let slapCount = 0;
const slapCountElement = document.getElementById('slapCount');

// Create sound effects
const slapSounds = {
    normal: new Audio('/slap.mp3'),
    super: new Audio('/super-slap.mp3'),
    combo: new Audio('/combo-slap.mp3')
};

// Set volume for all sounds
Object.values(slapSounds).forEach(sound => {
    sound.volume = 0.5;
    // Add error handling for each sound
    sound.addEventListener('error', (e) => {
        console.error(`Error loading ${sound.src}:`, e);
    });
    // Preload sounds
    sound.load();
});

const hurtSound = new Audio('/young-man-being-hurt-95628.mp3');
hurtSound.volume = 0.5;
hurtSound.addEventListener('error', (e) => {
    console.error('Error loading hurt sound:', e);
});
hurtSound.load();

// Function to play sounds safely
function playSound(sound) {
    if (sound) {
        try {
            sound.currentTime = 0;
            const playPromise = sound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing sound:', error);
                });
            }
        } catch (error) {
            console.error('Error with sound playback:', error);
        }
    }
}

// Game state
const gameState = {
    mode: 'normal', // normal, time, survival
    bossHealth: 100,
    maxHealth: 100,
    timeRemaining: 60,
    highScore: localStorage.getItem('highScore') || 0,
    achievements: {
        firstSlap: { unlocked: false, name: 'First Slap', description: 'Slap your boss for the first time' },
        tenSlaps: { unlocked: false, name: 'Slap Master', description: 'Slap your boss 10 times' },
        superSlapper: { unlocked: false, name: 'Super Slapper', description: 'Use a super slap' },
        comboMaster: { unlocked: false, name: 'Combo Master', description: 'Use a combo slap' },
        timeAttack: { unlocked: false, name: 'Speed Demon', description: 'Complete time attack mode' },
        survival: { unlocked: false, name: 'Survivor', description: 'Complete survival mode' }
    }
};

// Update high score display
document.getElementById('highScore').textContent = gameState.highScore;

// Initialize achievements
function initializeAchievements() {
    const achievementsList = document.getElementById('achievementsList');
    for (const [key, achievement] of Object.entries(gameState.achievements)) {
        const div = document.createElement('div');
        div.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
        div.innerHTML = `
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
        `;
        achievementsList.appendChild(div);
    }
}

// Update achievement display
function updateAchievementDisplay() {
    const achievements = document.querySelectorAll('.achievement');
    let index = 0;
    for (const [key, achievement] of Object.entries(gameState.achievements)) {
        achievements[index].className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
        index++;
    }
}

// Unlock achievement
function unlockAchievement(key) {
    if (!gameState.achievements[key].unlocked) {
        gameState.achievements[key].unlocked = true;
        showPowerUpMessage(`Achievement Unlocked: ${gameState.achievements[key].name}!`);
        updateAchievementDisplay();
    }
}

// Update health bar
function updateHealthBar() {
    const healthBar = document.getElementById('healthBar');
    const healthPercentage = (gameState.bossHealth / gameState.maxHealth) * 100;
    healthBar.style.width = `${healthPercentage}%`;
    
    // Change color based on health
    if (healthPercentage > 60) {
        healthBar.style.backgroundColor = '#2ecc71';
    } else if (healthPercentage > 30) {
        healthBar.style.backgroundColor = '#f1c40f';
    } else {
        healthBar.style.backgroundColor = '#e74c3c';
    }
}

// Game mode selection
document.querySelectorAll('.mode-button').forEach(button => {
    button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        gameState.mode = mode;
        
        // Update active button
        document.querySelectorAll('.mode-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Reset game state
        resetGameState();
        
        // Show mode-specific UI
        document.getElementById('timer').style.display = mode === 'time' ? 'block' : 'none';
    });
});

// Reset game state
function resetGameState() {
    gameState.bossHealth = gameState.maxHealth;
    gameState.timeRemaining = 60;
    updateHealthBar();
    updateTimerDisplay();
}

// Update timer display
function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    timerElement.textContent = `Time: ${gameState.timeRemaining}s`;
}

// Handle slap damage
function applySlapDamage(power) {
    const baseDamage = 10;
    const damage = baseDamage * power;
    gameState.bossHealth = Math.max(0, gameState.bossHealth - damage);
    updateHealthBar();
    
    // Check for achievements
    if (slapCount === 1) unlockAchievement('firstSlap');
    if (slapCount === 10) unlockAchievement('tenSlaps');
    if (power === 2) unlockAchievement('superSlapper');
    if (power === 1.5) unlockAchievement('comboMaster');
    
    // Update high score
    if (slapCount > gameState.highScore) {
        gameState.highScore = slapCount;
        localStorage.setItem('highScore', gameState.highScore);
        document.getElementById('highScore').textContent = gameState.highScore;
    }
}

// Instructions panel functionality
const instructionsButton = document.getElementById('instructionsButton');
const instructionsPanel = document.getElementById('instructionsPanel');
const closeInstructions = document.querySelector('.close-instructions');

instructionsButton.addEventListener('click', () => {
    instructionsPanel.classList.add('visible');
});

closeInstructions.addEventListener('click', () => {
    instructionsPanel.classList.remove('visible');
});

// Slap mode selection
let currentSlapMode = 'normal';
const slapModeButtons = document.querySelectorAll('.slap-mode-button');

slapModeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const mode = button.dataset.mode;
        currentSlapMode = mode;
        
        // Update active button
        slapModeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Show feedback
        showPowerUpMessage(`${mode.charAt(0).toUpperCase() + mode.slice(1)} Slap Selected!`);
    });
});

// Add click event listener for slapping
const slapButton = document.getElementById('slapButton');
slapButton.addEventListener('click', () => {
    if (!slapAnimation.isSlapping) {
        slapAnimation.isSlapping = true;
        slapAnimation.startTime = Date.now();
        
        // Set power based on current slap mode
        switch (currentSlapMode) {
            case 'super':
                slapAnimation.power = 2;
                break;
            case 'combo':
                slapAnimation.power = 1.5;
                break;
            default:
                slapAnimation.power = 1;
        }
        
        // Increment slap counter
        slapCount++;
        slapCountElement.textContent = slapCount;
        
        // Apply damage
        applySlapDamage(slapAnimation.power);
        
        // Reset employee's right arm position
        const rightArm = employee.children[4];
        rightArm.rotation.z = -0.3;
        rightArm.rotation.x = 0;

        // Preload sounds
        slapSounds[currentSlapMode].load();
        hurtSound.load();
    }
});

// Add keyboard controls for power-ups
document.addEventListener('keydown', (event) => {
    if (event.key === '1' && !powerUps.superSlap.active) {
        powerUps.superSlap.active = true;
        powerUps.superSlap.startTime = Date.now();
        showPowerUpMessage('Super Slap Activated!');
    } else if (event.key === '2' && !powerUps.comboSlap.active) {
        powerUps.comboSlap.active = true;
        powerUps.comboSlap.startTime = Date.now();
        showPowerUpMessage('Combo Slap Activated!');
    }
});

// Show power-up message
function showPowerUpMessage(message) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.classList.add('visible');
    setTimeout(() => {
        messageElement.classList.remove('visible');
    }, 2000);
}

// Create particles for slap effect
function createSlapParticles(position, color) {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = position.x + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.5;
        positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.5;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleMaterial.color.set(color);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update power-ups
    const currentTime = Date.now();
    if (powerUps.superSlap.active && currentTime - powerUps.superSlap.startTime > powerUps.superSlap.duration) {
        powerUps.superSlap.active = false;
    }
    if (powerUps.comboSlap.active && currentTime - powerUps.comboSlap.startTime > powerUps.comboSlap.duration) {
        powerUps.comboSlap.active = false;
    }
    
    // Update game mode specific logic
    if (gameState.mode === 'time') {
        if (gameState.timeRemaining > 0) {
            gameState.timeRemaining -= 1/60;
            updateTimerDisplay();
        } else {
            showPowerUpMessage('Time Attack Complete!');
            unlockAchievement('timeAttack');
            resetGameState();
        }
    } else if (gameState.mode === 'survival') {
        if (gameState.bossHealth <= 0) {
            showPowerUpMessage('Survival Mode Complete!');
            unlockAchievement('survival');
            resetGameState();
        }
    }
    
    // Update slap animation
    if (slapAnimation.isSlapping) {
        const elapsed = Date.now() - slapAnimation.startTime;
        const progress = Math.min(elapsed / slapAnimation.duration, 1);
        
        // Animate employee's right arm
        const rightArm = employee.children[4];
        
        if (progress < 0.5) {
            // Wind up
            rightArm.rotation.z = -0.3 - (progress * 2) * Math.PI / 2;
            rightArm.rotation.x = (progress * 2) * Math.PI / 4;
        } else {
            // Slap
            rightArm.rotation.z = -0.3 - Math.PI / 2 + ((progress - 0.5) * 2) * Math.PI;
            rightArm.rotation.x = Math.PI / 4 - ((progress - 0.5) * 2) * Math.PI / 4;
            
            // Rotate boss's head on impact
            if (progress > 0.75) {
                boss.children[0].rotation.y = ((progress - 0.75) * 4) * Math.PI / 4;
                // Play slap sound at impact
                if (progress > 0.75 && progress < 0.76) {
                    try {
                        // Play current slap mode sound
                        playSound(slapSounds[currentSlapMode]);
                        // Play hurt sound after slap sound
                        setTimeout(() => {
                            playSound(hurtSound);
                        }, 200);
                        
                        // Create particles for slap effect
                        const color = currentSlapMode === 'super' ? 0xff0000 : 
                                    currentSlapMode === 'combo' ? 0x00ff00 : 0xffffff;
                        createSlapParticles(boss.position, color);
                    } catch (error) {
                        console.error('Error with sounds:', error);
                    }
                }
            }
        }
        
        if (progress >= 1) {
            slapAnimation.isSlapping = false;
        }
    }
    
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    // Update renderer size
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update camera
    updateCamera();
    
    // Update controls
    controls.update();
}, false);

// Initialize achievements
initializeAchievements();

animate(); 