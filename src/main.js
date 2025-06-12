import { Boot } from './scenes/Boot.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';
import { Preloader } from './scenes/Preloader.js';

// Importa firebase.js desde la carpeta src
import * as firebaseUtils from './firebase.js'; // Puedes eliminar esto si ya no lo usas directamente aquí

const config = {
    type: Phaser.AUTO,
    width: 720, // Resolución vertical típica para móvil
    height: 1280,
    parent: 'game-container',
    backgroundColor: '#028af8',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 1000 }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 720,
        height: 1280
    },
    scene: [Boot, Preloader, Game, GameOver]
};

new Phaser.Game(config);
