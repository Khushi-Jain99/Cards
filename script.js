/**
 * presentation.js - Interactive Game Logic for Sound Memory Deck
 */

class SoundMemoryGame {
    constructor() {
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.isPlaying = false;
        this.isWaitingForPlayer = false;

        // Audio Context initialization
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // DOM Elements
        this.cards = document.querySelectorAll('.game-card');
        this.startBtn = document.getElementById('start-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.levelEl = document.getElementById('level-val');
        this.statusEl = document.getElementById('status-text');

        this.init();
    }

    init() {
        this.startBtn.addEventListener('click', () => this.startGame());
        this.resetBtn.addEventListener('click', () => this.resetGame());

        this.cards.forEach((card, index) => {
            card.addEventListener('click', () => this.handleCardClick(card, index));
        });
    }

    playSound(frequency) {
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.type = 'triangle'; // Softer, more piano-like than 'sine'
        oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }

    async playSequence() {
        this.isWaitingForPlayer = false;
        this.statusEl.textContent = "Watch carefully...";
        this.statusEl.style.color = "var(--primary)";

        for (const index of this.sequence) {
            await this.highlightCard(index);
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        this.isWaitingForPlayer = true;
        this.statusEl.textContent = "Your turn!";
        this.statusEl.style.color = "#10b981";
    }

    async highlightCard(index) {
        const card = this.cards[index];
        const freq = parseFloat(card.dataset.note);
        
        this.playSound(freq);
        card.classList.add('active');
        
        return new Promise(resolve => {
            setTimeout(() => {
                card.classList.remove('active');
                resolve();
            }, 400);
        });
    }

    startGame() {
        if (this.isPlaying) return;
        
        // Resume audio context if suspended (browser security)
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        this.isPlaying = true;
        this.sequence = [];
        this.level = 1;
        this.startNextRound();
    }

    startNextRound() {
        this.playerSequence = [];
        this.levelEl.textContent = this.level;
        
        // Add random card to sequence
        const randomIndex = Math.floor(Math.random() * this.cards.length);
        this.sequence.push(randomIndex);
        
        setTimeout(() => this.playSequence(), 800);
    }

    handleCardClick(card, index) {
        if (!this.isWaitingForPlayer) return;

        const freq = parseFloat(card.dataset.note);
        this.playSound(freq);
        
        card.classList.add('clicked', 'active');
        setTimeout(() => card.classList.remove('clicked', 'active'), 150);

        this.playerSequence.push(index);
        this.checkInput();
    }

    checkInput() {
        const currentIdx = this.playerSequence.length - 1;
        
        if (this.playerSequence[currentIdx] !== this.sequence[currentIdx]) {
            this.gameOver();
            return;
        }

        if (this.playerSequence.length === this.sequence.length) {
            this.statusEl.textContent = "Correct!";
            this.level++;
            setTimeout(() => this.startNextRound(), 1000);
        }
    }

    gameOver() {
        this.statusEl.textContent = "Wrong sequence!";
        this.statusEl.style.color = "#ef4444";
        this.isPlaying = false;
        this.isWaitingForPlayer = false;

        // Visual feedback for error
        this.cards.forEach(card => card.classList.add('error'));
        setTimeout(() => {
            this.cards.forEach(card => card.classList.remove('error'));
        }, 500);
    }

    resetGame() {
        this.isPlaying = false;
        this.isWaitingForPlayer = false;
        this.sequence = [];
        this.playerSequence = [];
        this.level = 1;
        this.levelEl.textContent = "1";
        this.statusEl.textContent = "Ready";
        this.statusEl.style.color = "var(--text-muted)";
        this.cards.forEach(card => card.classList.remove('active', 'error'));
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    new SoundMemoryGame();
});
