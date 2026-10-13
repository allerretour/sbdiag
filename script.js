const manchesList = document.getElementById('manches-list');
const totalSpan = document.getElementById('total');
const finalScoreSpan = document.getElementById('final-score');
const ajustementSlider = document.getElementById('ajustement-slider');
const ajustementTxt = document.getElementById('ajustement-txt');

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
                <label id="bonus-container-${m}" class="cb-touch-label cb-za" title="Blanche dans la ZA (+5 pts)" style="visibility: hidden;">
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

// Écouteur sur le slider
ajustementSlider.addEventListener('change', calculerScore);


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

        // Remplacer le 10 par nbManchesActuel
		for (let m = 1; m <= nbManchesActuel; m++) {
        const cache = gameEngine.domCache[m];
        let billes = gameEngine.scoresState[m];
        let scoreManche = 0;

                // Nettoyage complet des classes d'état de la carte
        cache.card.classList.remove('manche-foul', 'manche-parfaite', 'manche-encours', 'manche-za', 'manche-zero');

        // Style du bouton max
        cache.btnMax.style.backgroundColor = (billes === m) ? 'var(--accent-blue, #3b82f6)' : '#334155';

        // Visibilité de la Zone d'Ajustement (ZA)
        if (billes === m && !cache.blanche.checked) {
            cache.bonusContainer.style.visibility = 'visible';
        } else {
            cache.bonusContainer.style.visibility = 'hidden';
            cache.za.checked = false; 
        }

        // --- CALCUL DU SCORE ET ATTRIBUTION DES COULEURS ---
        if (cache.blanche.checked) {
            scoreManche = 0;
            cache.card.classList.add('manche-foul'); // ROUGE (Faute)
        } else {
            scoreManche = billes;

            if (billes === m) {
                scoreManche *= 2;
                if (cache.za.checked) {
                    scoreManche += 5;
                    cache.card.classList.add('manche-za'); // JAUNE (ZA activé)
                } else {
                    cache.card.classList.add('manche-parfaite'); // VERT (Maximum atteint sans ZA)
                }
            } else if (scoreManche > 0) {
                cache.card.classList.add('manche-encours'); // BLANCHE (Entre 0 et Max)
            } else {
                cache.card.classList.add('manche-zero'); // GRIS PÂLE (Par défaut à 0)
            }
        }



        cache.scoreMancheSpan.textContent = scoreManche;
        scoreTotal += scoreManche;
    }


    totalSpan.textContent = scoreTotal;

    // Gestion de l'ajustement (Remplacement des styles inline par un dataset ou des classes si possible, conservé ici pour compatibilité CSS)
    const pourcentage = parseInt(ajustementSlider.value) || 0;
    ajustementTxt.textContent = pourcentage > 0 ? `+${pourcentage}%` : `${pourcentage}%`;

        // --- DYNAMISATION DU SLIDER VIA CLASSES CSS ---
    // On cible le parent commun pour appliquer l'état global
    const conteneurSlider = ajustementSlider.parentElement; 
    
    // On nettoie les anciennes classes d'état
    conteneurSlider.classList.remove('slider-positive', 'slider-negative', 'slider-neutral');

    if (pourcentage > 0) {
        conteneurSlider.classList.add('slider-positive');
    } else if (pourcentage < 0) {
        conteneurSlider.classList.add('slider-negative');
    } else {
        conteneurSlider.classList.add('slider-neutral');
    }


    const scoreFinal = Math.max(0, Math.round(scoreTotal * (1 + (pourcentage / 100))));
    finalScoreSpan.textContent = scoreFinal;
}

function genererOptionsSelecteur(manche) {
    const cache = gameEngine.domCache[manche];
    cache.grid.innerHTML = ''; 
    
    const valeurActuelle = gameEngine.scoresState[manche];
    
    // Utilisation d'un DocumentFragment pour optimiser les insertions dans le DOM
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
    
    // Ferme tous les autres sélecteurs ouverts via le cache global
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
    toggleSelecteur(manche); // Ferme le sélecteur
    calculerScore();
}

function reinitialiserPartie() {
    if (confirm("Voulez-vous vraiment remettre tous les scores et l'ajustement à zéro ?")) {
        ajustementSlider.value = 0;
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

// Fermeture des sélecteurs lors d'un clic extérieur
document.addEventListener('click', (event) => {
    if (!event.target.closest('.counter-group-wrapper')) {
        Object.keys(gameEngine.domCache).forEach(m => {
            gameEngine.domCache[m].selecteur.style.display = 'none';
        });
    }
});
