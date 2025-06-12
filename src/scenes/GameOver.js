import { db, collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, limit } from '../firebase.js';

export class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
        this.playerNameConfirmed = false;
        this.rankingX = 50;
        this.rankingY = 50;
    }

    async create() {
        this.currentScore = this.registry.get('currentScore') || 0;
        this.bestScore = this.registry.get('bestScore') || 0;

        // Si ya hay nombre guardado, guardamos y mostramos ranking directamente
        let playerName = localStorage.getItem('playerName');
        if (playerName) {
            this.playerName = playerName;
            await this.saveOrUpdateScore(playerName, this.currentScore);
            this.showScoreTexts();
            await this.showRanking(this.rankingX, this.rankingY, playerName);
            this.showRetryButton();
            this.playerNameConfirmed = true;
        } else {
            // Pedir nombre al jugador con input HTML
            this.showScoreTexts();
            this.createNameInput();
        }
    }

    showScoreTexts() {
        const centerX = this.cameras.main.centerX;
        const bottomY = this.cameras.main.height - 40;

        // Mostrar puntuación actual centrada arriba
        this.add.text(centerX, 120, `PUNTUACIÓN: ${this.currentScore}`, {
            fontFamily: 'Arial Black',
            fontSize: 60,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Mejor puntuación abajo centro
        this.add.text(centerX, bottomY, `MI MEJOR PUNTUACIÓN: ${this.bestScore}`, {
            fontFamily: 'Arial Black',
            fontSize: 44,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
    }

    createNameInput() {
        const inputWidth = 300;
        const inputHeight = 40;

        // Obtener posición y tamaño real del canvas en la pantalla
        const canvasBounds = this.game.canvas.getBoundingClientRect();
        const centerX = canvasBounds.left + canvasBounds.width / 2;
        const centerY = canvasBounds.top + canvasBounds.height / 2;

        // Texto arriba del input centrado
        this.namePromptText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 60, 'Pon tu usuario de Instagram con el @ delante:', {
            fontFamily: 'Arial Black',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Crear input HTML
        this.htmlInput = document.createElement('input');
        this.htmlInput.type = 'text';
        this.htmlInput.id = 'playerNameInput';
        this.htmlInput.style.position = 'absolute';
        this.htmlInput.style.width = `${inputWidth}px`;
        this.htmlInput.style.height = `${inputHeight}px`;
        this.htmlInput.style.fontSize = '28px';
        this.htmlInput.style.padding = '6px 10px';
        this.htmlInput.style.borderRadius = '5px';
        this.htmlInput.style.border = '2px solid #fff';
        this.htmlInput.style.zIndex = 1000;

        // Posicionar input centrado en pantalla usando posición del canvas
        this.htmlInput.style.left = `${centerX - inputWidth / 2}px`;
        this.htmlInput.style.top = `${centerY - inputHeight / 2}px`;

        document.body.appendChild(this.htmlInput);
        this.htmlInput.focus();

        // Texto de error debajo input
        this.errorText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, '', {
            fontFamily: 'Arial Black',
            fontSize: 24,
            color: '#ff4444',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5);

        // Botón CONFIRMAR debajo input (separado 50px)
        const confirmButtonY = this.cameras.main.centerY + 100;
        this.confirmButton = this.add.text(this.cameras.main.centerX, confirmButtonY, 'CONFIRMAR', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.confirmButton.on('pointerdown', async () => {
            let playerName = this.htmlInput.value.trim();

            const forbiddenWords = ['puta', 'mierda', 'gilipollas', 'cabron', 'joder'];

            if (playerName === '') {
                this.errorText.setText('El nombre no puede estar vacío.');
                return;
            }
            if (forbiddenWords.some(word => playerName.toLowerCase().includes(word))) {
                this.errorText.setText('No están permitidos nombres obscenos.');
                return;
            }
            if (await this.isNameTaken(playerName)) {
                this.errorText.setText('Este usuario ya está registrado.');
                return;
            }

            // Nombre válido
            this.errorText.setText('');
            this.playerName = playerName;
            localStorage.setItem('playerName', playerName);

            await this.saveOrUpdateScore(playerName, this.currentScore);
            await this.showRanking(this.rankingX, this.rankingY, playerName);

            this.htmlInput.remove();
            this.namePromptText.destroy();
            this.errorText.destroy();
            this.confirmButton.destroy();

            this.showRetryButton();

            this.playerNameConfirmed = true;
        });
    }

    showRetryButton() {
        // Botón REINTENTAR centrado abajo, separado del botón confirmar o solo al centro si no hay input
        const retryY = this.cameras.main.centerY + 180;
        this.retryButton = this.add.text(this.cameras.main.centerX, retryY, 'REINTENTAR', {
            fontFamily: 'Arial Black',
            fontSize: 50,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.retryButton.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }

    async isNameTaken(name) {
        const q = query(collection(db, 'ranking'), where('name', '==', name));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }

    async saveOrUpdateScore(name, score) {
        const q = query(collection(db, 'ranking'), where('name', '==', name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();

            if (score > data.score) {
                await updateDoc(doc(db, 'ranking', docSnap.id), {
                    score: score,
                    timestamp: Date.now()
                });
            }
        } else {
            await addDoc(collection(db, 'ranking'), {
                name: name,
                score: score,
                timestamp: Date.now()
            });
        }
    }

    async showRanking(startX, startY, currentPlayerName) {
        // Obtener los primeros 30
        const topQuery = query(
            collection(db, 'ranking'),
            orderBy('score', 'desc'),
            orderBy('timestamp', 'asc'),
            limit(30)
        );
        const topSnapshot = await getDocs(topQuery);
        const topPlayers = [];

        topSnapshot.forEach(doc => {
            const data = doc.data();
            topPlayers.push({ name: data.name, score: data.score });
        });

        // Mostrar título
        this.add.text(startX, startY, '🏆 RANKING', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0, 0);

        // Mostrar TOP 30
        topPlayers.forEach((entry, i) => {
            this.add.text(startX, startY + 50 + i * 30, `TOP ${i + 1}: ${entry.name} (${entry.score})`, {
                fontFamily: 'Arial Black',
                fontSize: 28,
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0);
        });

        // Comprobar si el jugador está en el top 30
        const inTop30 = topPlayers.some(entry => entry.name === currentPlayerName);

        if (!inTop30) {
            // Obtener todo el ranking para encontrar la posición del jugador
            const fullQuery = query(
                collection(db, 'ranking'),
                orderBy('score', 'desc'),
                orderBy('timestamp', 'asc')
            );
            const fullSnapshot = await getDocs(fullQuery);

            let position = 1;
            let playerScore = 0;

            for (const doc of fullSnapshot.docs) {
                const data = doc.data();
                if (data.name === currentPlayerName) {
                    playerScore = data.score;
                    break;
                }
                position++;
            }

            // Mostrar posición del jugador fuera del top
            this.add.text(startX, startY + 50 + topPlayers.length * 30 + 30, `TU POSICIÓN: ${position}: ${currentPlayerName} (${playerScore})`, {
                fontFamily: 'Arial Black',
                fontSize: 28,
                color: '#00ffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0, 0);
        }
    }
}
