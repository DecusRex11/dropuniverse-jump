import ASSETS from '../assets.js';
import ANIMATION from '../animation.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.centreX;
        this.centreY;
        this.pathY;
        this.pathOffset = 0;
        this.pathOffsetTarget = 0;
        this.pathOffsetMax = 100;
        this.pathHeight = 300;
        this.pathHeightTarget = 300;
        this.pathHeightMin = 50;
        this.pathHeightMax = 200;

        this.score = 0;
        this.distance = 0;
        this.distanceMax = 200;
        this.flyVelocity = -300;
        this.backgroundSpeed = 2.1;
        this.coinDistance = 100;
        this.coinDistanceMax = 5000000;
        this.spikeDistance = 0;
        this.spikeDistanceMax = 700;

        this.gameStarted = false;
    }

create() {
    this.centreX = this.scale.width * 0.5;
    this.centreY = this.scale.height * 0.5;
    this.pathHeight = this.pathHeightMax;

    this.background1 = this.add.image(0, 0, 'background').setOrigin(0);
    this.background2 = this.add.image(this.background1.width, 0, 'background').setOrigin(0);

    this.tutorialText = this.add.text(this.centreX, this.centreY, 'Tap to fly!', {
        fontFamily: 'Arial Black', fontSize: 42, color: '#ffffff',
        stroke: '#000000', strokeThickness: 8, align: 'center'
    }).setOrigin(0.5);

    // Inicializar la puntuación a 0 para que siempre empiece desde cero
    this.score = 0;

    this.scoreText = this.add.text(this.centreX, 50, 'Score: 0', {
        fontFamily: 'Arial Black', fontSize: 28, color: '#ffffff',
        stroke: '#000000', strokeThickness: 8, align: 'center'
    }).setOrigin(0.5).setDepth(100);

    this.initAnimations();
    this.initPlayer();
    this.initInput();
    this.initPhysics();
}

update() {
    if (!this.gameStarted) return;

    // Aumentar distancias para generar elementos
    this.distance += this.backgroundSpeed;
    this.coinDistance += this.backgroundSpeed;
    this.spikeDistance += this.backgroundSpeed;

    if (this.distance > this.distanceMax) {
        this.distance -= this.distanceMax;
        this.randomPath();
    }

    if (this.coinDistance > this.coinDistanceMax) {
        this.coinDistance -= this.coinDistanceMax;
        this.addCoin();
    }

    if (this.spikeDistance > this.spikeDistanceMax) {
        this.spikeDistance -= this.spikeDistanceMax;
        this.addSpike();
    }

    // Mover monedas
    this.coinGroup.getChildren().forEach(coin => {
        coin.x -= this.backgroundSpeed;
        coin.refreshBody();
    });

    // Mover obstáculos sin repetir grupos
    const movedGroups = new Set();

    this.obstacleGroup.getChildren().forEach(obstacle => {
        // Si es parte de un grupo ya movido, saltar para no moverlo dos veces
        if (obstacle.groupRef && movedGroups.has(obstacle.groupRef)) return;

        if (obstacle.groupRef) {
            // Mover todos los elementos del grupo
            obstacle.groupRef.forEach(part => {
                part.x -= this.backgroundSpeed;
                part.refreshBody();
            });
            movedGroups.add(obstacle.groupRef);
        } else {
            // Caso raro: mover individualmente si no tiene grupo
            obstacle.x -= this.backgroundSpeed;
            obstacle.refreshBody();
        }
    });

    // Comprobar puntuación y destrucción solo en caps inferiores
    this.obstacleGroup.getChildren().forEach(obstacle => {
        if (!obstacle.isCap) return;

        // Si salió de pantalla, destruir todo el grupo
        if (obstacle.x + obstacle.displayWidth < 0) {
            if (obstacle.groupRef) {
                obstacle.groupRef.forEach(part => part.destroy());
            } else {
                obstacle.destroy();
            }
            return;
        }

        // Si el jugador pasó el obstáculo y aún no se contabilizó
        if (!obstacle.passed && this.player.x > obstacle.x + obstacle.displayWidth) {
            obstacle.passed = true;
            this.score++;
            this.scoreText.setText(`Score: ${this.score}`);
        }
    });

    this.updatePath();
}




    randomPath() {
        this.pathOffsetTarget = Phaser.Math.RND.between(-this.pathOffsetMax, this.pathOffsetMax);
        this.pathHeightTarget = Phaser.Math.RND.between(this.pathHeightMin, this.pathHeightMax);
    }

    updatePath() {
        const d1 = this.pathOffsetTarget - this.pathOffset;
        const d2 = this.pathHeightTarget - this.pathHeight;

        this.pathOffset += d1 * 0.01;
        this.pathHeight += d2 * 0.01;

        this.pathY = this.centreY + this.pathOffset;
    }

    initAnimations() {
        this.anims.create({
            key: ANIMATION.bat.key,
            frames: this.anims.generateFrameNumbers(ANIMATION.bat.texture),
            frameRate: ANIMATION.bat.frameRate,
            repeat: ANIMATION.bat.repeat
        });

        this.anims.create({
            key: ANIMATION.coin.key,
            frames: this.anims.generateFrameNumbers(ANIMATION.coin.texture),
            frameRate: ANIMATION.coin.frameRate,
            repeat: ANIMATION.coin.repeat
        });
    }

    initPhysics() {
        this.obstacleGroup = this.add.group();
        this.coinGroup = this.add.group();

        this.physics.add.overlap(this.player, this.obstacleGroup, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    }

    initPlayer() {
        this.player = this.physics.add.sprite(200, this.centreY, ASSETS.spritesheet.bat.key)
            .setDepth(100)
            .setCollideWorldBounds(true);
        this.player.anims.play(ANIMATION.bat.key, true);
    }

    initInput() {
        this.physics.pause();
        this.input.once('pointerdown', () => {
            this.startGame();
        });
    }

    startGame() {
        this.gameStarted = true;
        this.physics.resume();
        this.input.on('pointerdown', () => {
            this.fly();
        });

        this.fly();
        this.tutorialText.setVisible(false);
    }

    addCoin() {
        const coin = this.physics.add.staticSprite(this.scale.width + 50, this.pathY, ASSETS.spritesheet.coin.key);
        coin.anims.play(ANIMATION.coin.key, true);
        this.coinGroup.add(coin);
    }

addSpike() {
    const spikeX = this.scale.width + 50;
    const gapHeight = 280;

    const spikeBodyOriginalHeight = this.textures.get('spikes_body').getSourceImage().height;
    const spikeCapOriginalHeight = this.textures.get('spikes_cap').getSourceImage().height;

    const minGapY = gapHeight / 2 + spikeCapOriginalHeight;
    const maxGapY = this.scale.height - gapHeight / 2 - spikeCapOriginalHeight;
    const gapY = Phaser.Math.Between(minGapY, maxGapY);

    const spikeTopBodyHeight = gapY - gapHeight / 2 - spikeCapOriginalHeight;
    const spikeBottomBodyHeight = this.scale.height - (gapY + gapHeight / 2) - spikeCapOriginalHeight;

    // --- Spike TOP ---
    const spikeTopBody = this.physics.add.staticSprite(spikeX, 0, 'spikes_body')
        .setOrigin(0.5, 0)
        .setScale(1, spikeTopBodyHeight / spikeBodyOriginalHeight);

    const spikeTopCapY = spikeTopBody.y + spikeBodyOriginalHeight * spikeTopBody.scaleY;
    const spikeTopCap = this.physics.add.staticSprite(spikeX, spikeTopCapY, 'spikes_cap')
        .setOrigin(0.5, 0)
        .setFlipY(true);

    // --- Spike BOTTOM ---
    const spikeBottomBodyY = this.scale.height - spikeBottomBodyHeight;
    const spikeBottomBody = this.physics.add.staticSprite(spikeX, spikeBottomBodyY, 'spikes_body')
        .setOrigin(0.5, 0)
        .setScale(1, spikeBottomBodyHeight / spikeBodyOriginalHeight);

    const spikeBottomCap = this.physics.add.staticSprite(spikeX, spikeBottomBodyY, 'spikes_cap')
        .setOrigin(0.5, 1);

    // Marcar el cap inferior para puntuación
    spikeBottomCap.isCap = true;
    spikeBottomCap.passed = false;

    // Crear referencia común de grupo para mover y destruir todos juntos
    const groupRef = [spikeTopBody, spikeTopCap, spikeBottomBody, spikeBottomCap];
    groupRef.forEach(part => part.groupRef = groupRef);

    // Añadir al grupo global
    this.obstacleGroup.add(spikeTopBody);
    this.obstacleGroup.add(spikeTopCap);
    this.obstacleGroup.add(spikeBottomBody);
    this.obstacleGroup.add(spikeBottomCap);
}


fly() {
    const impulse = -500;  // velocidad fija hacia arriba en cada click
    this.player.setVelocityY(impulse);
}


    hitObstacle(player, obstacle) {
        this.gameStarted = false;
        this.physics.pause();

        this.tweens.add({
            targets: this.player,
            scale: 3,
            alpha: 0,
            duration: 1000,
            ease: Phaser.Math.Easing.Expo.Out
        });

        this.GameOver();
    }

    collectCoin(player, coin) {
        coin.destroy();
        //this.score++;
        //this.scoreText.setText(`Score: ${this.score}`);
    }

// Dentro de Game.js, en tu clase Game, reemplaza el método GameOver por este:

GameOver() {
    // Guarda la puntuación actual y la mejor en el registry
    const currentScore = this.score || 0;
    const bestScore = Math.max(currentScore, this.registry.get('bestScore') || 0);

    this.registry.set('currentScore', currentScore);
    this.registry.set('bestScore', bestScore);

    // Después de un retraso, cambia a la escena GameOver
    this.time.delayedCall(2000, () => {
        this.scene.start('GameOver');
    });
}

}
