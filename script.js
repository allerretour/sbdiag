// ==========================================
// CONFIGURATION DES SCORES ET CONFIG DU JEU
// ==========================================
const CONFIG_SCORES = {
    malusTable: -15, // Pourcentage d'ajustement pour la table (-15%)
    malusPoche: -10, // Pourcentage d'ajustement pour la poche (-10%)
    bonusZA: 5,      // Points bonus pour la Zone d'Ajustement (ZA)
    multiplicateurMancheParfaite: 2 // Multiplicateur si toutes les billes sont rentrées
};

const manchesList = document.getElementById('manches-list');
const totalSpan = document.getElementById('total');
const finalScoreSpan = document.getElementById('final-score');

// Nouveaux éléments du DOM pour les boutons d'ajustement
const btnAjustTable = document.getElementById('btn-ajust-table');
const btnAjustPoche = document.getElementById('btn-ajust-poche');

// Variable globale pour stocker la valeur de l'ajustement en cours
let pourcentageAjustement = 0;

// Stockage centralisé des scores ET des références du DOM pour éviter les lookups répétitifs
const gameEngine = {
    scoresState: {},
    domCache: {}
};

// Récupération du nouveau sélecteur de manches
const selectManches = document.getElementById('select-manches');
let nbManchesActuel = 10; // Par défaut

// Fonction principale pour générer la grille des manches
function initialiserGrille(nbManches) {
    // On vide l'ancien contenu HTML et le cache
    manchesList.innerHTML = '';
    gameEngine.scoresState = {};
    gameEngine.domCache = {};
    nbManchesActuel = nbManches;

    for (let m = 1; m <= nbManches; m++) {
        gameEngine.scoresState[m] = 0;
        
        const div = document.createElement('div');
        div.className = 'manche-card';
        
        div.innerHTML = `
            <div class="manche-info">Manche #${m} <span>Bille: ${m}</span></div>
            <div class="counter-group-wrapper">
                <div class="billes-val main-trigger" id="val-billes-${m}">0</div>
                <div class="mini-selecteur" id="selecteur-${m}" style="display: none;">
                    <div class="selecteur-grid" id="grid-${m}"></div>
                    <button class="btn-close-selecteur">Fermer</button>
                </div>
                <div class="counter-group controls-backup" id="controls-${m}" style="display: none;">
                    <button class="btn-touch btn-moins">-</button>
                    <button class="btn-touch btn-plus">+</button>
                    <button class="btn-touch btn-max">M</button>
                </div>
            </div>
            <div class="input-cell">
                <label class="cb-touch-label cb-foul" title="Blanche empochée (0 pt)">
                    <input type="checkbox" id="blanche-${m}">
                </label>
            </div>
            <div class="input-cell">
                <label id="bonus-container-${m}" class="cb-touch-label cb-za" title="Blanche dans la ZA (+${CONFIG_SCORES.bonusZA} pts)" style="visibility: hidden;">
                    <input type="checkbox" id="za-${m}">
                </label>
            </div>
            <div class="score-manche"><span id="score-m-${m}">0</span></div>
        `;
        
        manchesList.appendChild(div);

        gameEngine.domCache[m] = {
            card: div,
            valBilles: div.querySelector(`#val-billes-${m}`),
            selecteur: div.querySelector(`#selecteur-${m}`),
            grid: div.querySelector(`#grid-${m}`),
            blanche: div.querySelector(`#blanche-${m}`),
            za: div.querySelector(`#za-${m}`),
            bonusContainer: div.querySelector(`#bonus-container-${m}`),
            scoreMancheSpan: div.querySelector(`#score-m-${m}`),
            btnMax: div.querySelector('.btn-max')
        };

        const cache = gameEngine.domCache[m];
        cache.valBilles.addEventListener('click', () => toggleSelecteur(m));
        div.querySelector('.btn-close-selecteur').addEventListener('click', () => toggleSelecteur(m));
        div.querySelector('.btn-moins').addEventListener('click', () => modifierBilles(m, -1));
        div.querySelector('.btn-plus').addEventListener('click', () => modifierBilles(m, 1));
        cache.btnMax.addEventListener('click', () => maximerBilles(m));
        cache.blanche.addEventListener('change', calculerScore);
        cache.za.addEventListener('change', calculerScore);

        genererOptionsSelecteur(m);
    }
    calculerScore();
}

// Remplacer la boucle for (m=1..10) d'origine par cet écouteur et l'appel initial :
selectManches.addEventListener('change', (e) => {
    initialiserGrille(parseInt(e.target.value));
});

// Lancement initial de la grille avec 10 manches par défaut
initialiserGrille(10);

// --- GESTION DES CASES À COCHER D'AJUSTEMENT ---
// Déclenche le calcul automatique dès qu'une case est cochée ou décochée
btnAjustTable.addEventListener('change', calculerScore);
btnAjustPoche.addEventListener('change', calculerScore);

function mettreAJourDesignBoutons() {
    if (pourcentageAjustement === 0) {
        btnAjustTable.classList.remove('is-active');
        btnAjustPoche.classList.remove('is-active');
    }
}

function modifierBilles(manche, changement) {
    let nvValeur = gameEngine.scoresState[manche] + changement;
    if (nvValeur >= 0 && nvValeur <= manche) {
        gameEngine.scoresState[manche] = nvValeur;
        gameEngine.domCache[manche].valBilles.textContent = nvValeur;
        calculerScore();
    }
}

function maximerBilles(manche) {
    const actuel = gameEngine.scoresState[manche];
    gameEngine.scoresState[manche] = (actuel === manche) ? 0 : manche;
    gameEngine.domCache[manche].valBilles.textContent = gameEngine.scoresState[manche];
    calculerScore();
}

function calculerScore() {
    let scoreTotal = 0;

    for (let m = 1; m <= nbManchesActuel; m++) {
        const cache = gameEngine.domCache[m];
        let billes = gameEngine.scoresState[m];
        let scoreManche = 0;

        cache.card.classList.remove('manche-foul', 'manche-parfaite', 'manche-encours', 'manche-za', 'manche-zero');
        cache.btnMax.style.backgroundColor = (billes === m) ? 'var(--accent-blue, #3b82f6)' : '#334155';

        if (billes === m && !cache.blanche.checked) {
            cache.bonusContainer.style.visibility = 'visible';
        } else {
            cache.bonusContainer.style.visibility = 'hidden';
            cache.za.checked = false; 
        }

        if (cache.blanche.checked) {
            scoreManche = 0;
            cache.card.classList.add('manche-foul'); 
        } else {
            scoreManche = billes;

            if (billes === m) {
                // Utilisation du multiplicateur de la configuration
                scoreManche *= CONFIG_SCORES.multiplicateurMancheParfaite;
                if (cache.za.checked) {
                    // Utilisation du bonus ZA configuré
                    scoreManche += CONFIG_SCORES.bonusZA;
                    cache.card.classList.add('manche-za'); 
                } else {
                    cache.card.classList.add('manche-parfaite'); 
                }
            } else if (scoreManche > 0) {
                cache.card.classList.add('manche-encours'); 
            } else {
                cache.card.classList.add('manche-zero'); 
            }
        }

        cache.scoreMancheSpan.textContent = scoreManche;
        scoreTotal += scoreManche;
    }

    totalSpan.textContent = scoreTotal;

    // --- CALCUL DU CUMUL DES MALUS (Utilise les variables configurées) ---
    let totalMalus = 0;
    if (btnAjustTable.checked) totalMalus += CONFIG_SCORES.malusTable;
    if (btnAjustPoche.checked) totalMalus += CONFIG_SCORES.malusPoche;

    // Application du pourcentage cumulé au score final
    const scoreFinal = Math.max(0, Math.round(scoreTotal * (1 + (totalMalus / 100))));
    finalScoreSpan.textContent = scoreFinal;
}

function genererOptionsSelecteur(manche) {
    const cache = gameEngine.domCache[manche];
    cache.grid.innerHTML = ''; 
    
    const valeurActuelle = gameEngine.scoresState[manche];
    const fragment = document.createDocumentFragment();
    
    for (let i = 0; i <= manche; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-select-val';
        btn.textContent = i;
        
        if (i === valeurActuelle) {
            btn.classList.add('is-active');
        }
        
        btn.addEventListener('click', () => selectionnerValeur(manche, i));
        fragment.appendChild(btn);
    }
    cache.grid.appendChild(fragment);
}

function toggleSelecteur(manche) {
    const cache = gameEngine.domCache[manche];
    const estMasque = cache.selecteur.style.display === 'none';
    
    Object.keys(gameEngine.domCache).forEach(m => {
        gameEngine.domCache[m].selecteur.style.display = 'none';
    });
    
    if (estMasque) {
        genererOptionsSelecteur(manche);
        cache.selecteur.style.display = 'block';
    }
}

function selectionnerValeur(manche, valeur) {
    gameEngine.scoresState[manche] = valeur;
    gameEngine.domCache[manche].valBilles.textContent = valeur;
    toggleSelecteur(manche); 
    calculerScore();
}

function reinitialiserPartie() {
    if (confirm("Voulez-vous vraiment remettre tous les scores et l'ajustement à zéro ?")) {
        btnAjustTable.checked = false;
        btnAjustPoche.checked = false;
        
        for (let m = 1; m <= nbManchesActuel; m++) {
            gameEngine.scoresState[m] = 0;
            const cache = gameEngine.domCache[m];
            cache.valBilles.textContent = 0;
            cache.blanche.checked = false;
            cache.za.checked = false;
        }
        calculerScore();
    }
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('.counter-group-wrapper')) {
        Object.keys(gameEngine.domCache).forEach(m => {
            gameEngine.domCache[m].selecteur.style.display = 'none';
        });
    }
});
