import * as THREE from 'three';

class CharacterCreator {
    constructor() {
        this.materials = {
            skin: new THREE.MeshPhongMaterial({ color: 0xffcbb3 }),
            shirt: new THREE.MeshPhongMaterial({ color: 0xffffff }),
            suit: new THREE.MeshPhongMaterial({ color: 0x2c3e50 }),
            tie: new THREE.MeshPhongMaterial({ color: 0x34495e }),
            hair: new THREE.MeshPhongMaterial({ color: 0x3a3a3a })
        };
        
        // Initialize audio listener
        this.audioListener = new THREE.AudioListener();
        
        // Load sound effects
        this.sounds = {
            eating: new THREE.Audio(this.audioListener),
            burp: new THREE.Audio(this.audioListener),
            slap: new THREE.Audio(this.audioListener),
            impact: new THREE.Audio(this.audioListener),
            ambient: new THREE.Audio(this.audioListener)
        };
        
        // Initialize particle systems
        this.particleSystems = {
            eating: null,
            slap: null,
            impact: null
        };

        // Animation state
        this.animationState = {
            isAnimating: false,
            currentAnimation: null
        };
    }

    createEmployee() {
        const employee = new THREE.Group();

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            this.materials.skin
        );
        
        // Hair
        const hair = new THREE.Mesh(
            new THREE.BoxGeometry(0.9, 0.3, 0.7),
            this.materials.hair
        );
        hair.position.y = 0.3;
        hair.position.z = -0.1;
        
        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.5, 1.5, 32),
            this.materials.shirt
        );
        body.position.y = -1;
        
        // Tie
        const tie = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.6, 0.1),
            this.materials.tie
        );
        tie.position.y = -0.8;
        tie.position.z = 0.25;

        // Arms
        const rightArm = this.createArm(this.materials.shirt);
        rightArm.position.set(0.6, -0.7, 0);
        rightArm.rotation.z = -0.3;

        const leftArm = this.createArm(this.materials.shirt);
        leftArm.position.set(-0.6, -0.7, 0);
        leftArm.rotation.z = 0.3;

        // Add all parts to the employee group
        employee.add(head);
        employee.add(hair);
        employee.add(body);
        employee.add(tie);
        employee.add(rightArm);
        employee.add(leftArm);

        // Add bones/skeleton
        const skeleton = this.createSkeleton(employee);
        employee.add(skeleton);

        return employee;
    }

    createBoss() {
        const boss = new THREE.Group();

        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            this.materials.skin
        );
        
        // Bald head with side hair
        const sideHairLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.2, 0.5),
            this.materials.hair
        );
        sideHairLeft.position.set(-0.45, 0, 0);
        
        const sideHairRight = sideHairLeft.clone();
        sideHairRight.position.set(0.45, 0, 0);

        // Body with suit
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 1.5, 32),
            this.materials.suit
        );
        body.position.y = -1;

        // Orange tie
        const tie = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.6, 0.1),
            new THREE.MeshPhongMaterial({ color: 0xff6b31 })
        );
        tie.position.y = -0.8;
        tie.position.z = 0.25;

        // Add all parts to the boss group
        boss.add(head);
        boss.add(sideHairLeft);
        boss.add(sideHairRight);
        boss.add(body);
        boss.add(tie);

        // Add bones/skeleton
        const skeleton = this.createSkeleton(boss);
        boss.add(skeleton);

        return boss;
    }

    createArm(material) {
        const arm = new THREE.Group();
        
        const upperArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.6, 32),
            material
        );
        
        const forearm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 0.6, 32),
            material
        );
        forearm.position.y = -0.6;

        const hand = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 32, 32),
            this.materials.skin
        );
        hand.position.y = -1.2;

        arm.add(upperArm);
        arm.add(forearm);
        arm.add(hand);

        return arm;
    }

    createSkeleton(character) {
        const bones = [];
        
        // Root bone
        const rootBone = new THREE.Bone();
        rootBone.position.y = -1.5;
        
        // Spine bone
        const spineBone = new THREE.Bone();
        spineBone.position.y = 1.5;
        rootBone.add(spineBone);
        
        // Neck bone
        const neckBone = new THREE.Bone();
        neckBone.position.y = 1.0;
        spineBone.add(neckBone);
        
        // Head bone
        const headBone = new THREE.Bone();
        headBone.position.y = 0.5;
        neckBone.add(headBone);
        
        // Arm bones
        const rightShoulderBone = new THREE.Bone();
        rightShoulderBone.position.set(0.6, 0.8, 0);
        spineBone.add(rightShoulderBone);
        
        const rightElbowBone = new THREE.Bone();
        rightElbowBone.position.y = -0.6;
        rightShoulderBone.add(rightElbowBone);
        
        const leftShoulderBone = new THREE.Bone();
        leftShoulderBone.position.set(-0.6, 0.8, 0);
        spineBone.add(leftShoulderBone);
        
        const leftElbowBone = new THREE.Bone();
        leftElbowBone.position.y = -0.6;
        leftShoulderBone.add(leftElbowBone);
        
        // Create skeleton
        bones.push(rootBone);
        const skeleton = new THREE.Skeleton(bones);
        
        return rootBone;
    }

    createParticleEffect(type, position, color = 0xff6b31) {
        const particleCount = type === 'slap' ? 100 : 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            // Random velocities for particles
            velocities[i * 3] = (Math.random() - 0.5) * 0.2;
            velocities[i * 3 + 1] = Math.random() * 0.2;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: color,
            size: type === 'slap' ? 0.03 : 0.05,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.particleSystems[type] = particleSystem;
        return particleSystem;
    }

    updateParticles(type, deltaTime) {
        const particles = this.particleSystems[type];
        if (!particles) return;

        const positions = particles.geometry.attributes.position.array;
        const velocities = particles.geometry.attributes.velocity.array;

        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime;
            positions[i + 1] += velocities[i + 1] * deltaTime;
            positions[i + 2] += velocities[i + 2] * deltaTime;

            // Add gravity effect
            velocities[i + 1] -= 0.01 * deltaTime;
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    animateSlap(character, targetPosition, duration = 0.8) {
        if (this.animationState.isAnimating) return;
        this.animationState.isAnimating = true;
        this.animationState.currentAnimation = 'slap';

        const hand = character.children.find(child => child.name === 'rightArm');
        if (!hand) return;

        const startPosition = hand.position.clone();
        const windupPosition = new THREE.Vector3(
            startPosition.x + 0.5,
            startPosition.y + 0.3,
            startPosition.z
        );
        
        const timeline = new THREE.Clock();
        let phase = 'windup';
        
        const animate = () => {
            const elapsed = timeline.getElapsedTime();
            const progress = Math.min(elapsed / duration, 1);
            
            if (phase === 'windup' && progress < 0.3) {
                // Windup phase
                const windupProgress = progress / 0.3;
                hand.position.lerpVectors(startPosition, windupPosition, windupProgress);
            } else if (phase === 'windup') {
                phase = 'strike';
                timeline.start();
            } else if (phase === 'strike' && progress < 0.7) {
                // Strike phase
                const strikeProgress = (progress - 0.3) / 0.4;
                hand.position.lerpVectors(windupPosition, targetPosition, strikeProgress);
                
                // Create impact particles when hand reaches target
                if (strikeProgress > 0.95) {
                    this.sounds.slap.play();
                    this.sounds.impact.play();
                    const particles = this.createParticleEffect('slap', targetPosition, 0xff0000);
                    character.add(particles);
                }
            } else if (phase === 'strike') {
                phase = 'return';
                timeline.start();
            } else if (phase === 'return' && progress < 1) {
                // Return phase
                const returnProgress = (progress - 0.7) / 0.3;
                hand.position.lerpVectors(targetPosition, startPosition, returnProgress);
            } else {
                this.animationState.isAnimating = false;
                this.animationState.currentAnimation = null;
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    animateHandToMouth(character, duration = 1.0) {
        if (this.animationState.isAnimating) return;
        this.animationState.isAnimating = true;
        this.animationState.currentAnimation = 'eating';

        const hand = character.children.find(child => child.name === 'rightArm');
        if (!hand) return;

        const startPosition = hand.position.clone();
        const mouthPosition = new THREE.Vector3(0, 0.5, 0.5);
        
        const timeline = new THREE.Clock();
        let phase = 'approach';
        
        const animate = () => {
            const elapsed = timeline.getElapsedTime();
            const progress = Math.min(elapsed / duration, 1);
            
            if (phase === 'approach' && progress < 0.4) {
                // Approach phase
                const approachProgress = progress / 0.4;
                hand.position.lerpVectors(startPosition, mouthPosition, approachProgress);
            } else if (phase === 'approach') {
                phase = 'eating';
                this.sounds.eating.play();
                const particles = this.createParticleEffect('eating', mouthPosition);
                character.add(particles);
                timeline.start();
            } else if (phase === 'eating' && progress < 0.6) {
                // Eating phase - slight movement
                const eatingProgress = (progress - 0.4) / 0.2;
                hand.position.y = mouthPosition.y + Math.sin(eatingProgress * Math.PI * 2) * 0.05;
            } else if (phase === 'eating') {
                phase = 'return';
                this.sounds.burp.play();
                timeline.start();
            } else if (phase === 'return' && progress < 1) {
                // Return phase
                const returnProgress = (progress - 0.6) / 0.4;
                hand.position.lerpVectors(mouthPosition, startPosition, returnProgress);
            } else {
                this.animationState.isAnimating = false;
                this.animationState.currentAnimation = null;
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    loadSounds() {
        const audioLoader = new THREE.AudioLoader();
        
        // Load all sound effects
        const soundFiles = {
            eating: 'sounds/eating.mp3',
            burp: 'sounds/burp.mp3',
            slap: 'sounds/slap.mp3',
            impact: 'sounds/impact.mp3',
            ambient: 'sounds/ambient.mp3'
        };
        
        Object.entries(soundFiles).forEach(([key, path]) => {
            audioLoader.load(path, (buffer) => {
                this.sounds[key].setBuffer(buffer);
                this.sounds[key].setVolume(key === 'ambient' ? 0.2 : 0.5);
                if (key === 'ambient') {
                    this.sounds[key].setLoop(true);
                    this.sounds[key].play();
                }
            });
        });
    }

    update(deltaTime) {
        // Update all active particle systems
        Object.keys(this.particleSystems).forEach(type => {
            if (this.particleSystems[type]) {
                this.updateParticles(type, deltaTime);
            }
        });
    }
}

export { CharacterCreator }; 