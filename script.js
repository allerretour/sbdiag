// ==========================================
// CONFIGURATION DES SCORES ET CONFIG DU JEU
// ==========================================
const CONFIG_SCORES = {
    malusTable: -15, // Pourcentage d'ajustement pour la table (-15%)
    malusPoche: -10, // Pourcentage d'ajustement pour la poche (-10%)
    bonusZA: 5,      // Points bonus pour la Zone d'Ajustement (ZA)
    multiplicateurMancheParfaite: 2 // Multiplicateur si toutes les billes sont rentrées
};

// Génère un ID unique pour cet onglet s'il n'existe pas déjà
if (!sessionStorage.getItem('game_tab_id')) {
    sessionStorage.setItem('game_tab_id', 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
}
const LOCAL_STORAGE_KEY = sessionStorage.getItem('game_tab_id');


const manchesList = document.getElementById('manches-list');
const totalSpan = document.getElementById('total');
const finalScoreSpan = document.getElementById('final-score');

// Nouveaux éléments du DOM pour les boutons d'ajustement
const btnAjustTable = document.getElementById('btn-ajust-table');
const btnAjustPoche = document.getElementById('btn-ajust-poche');

// Stockage centralisé des scores ET des références du DOM pour éviter les lookups répétitifs
const gameEngine = {
    scoresState: {},
    domCache: {}
};

// Récupération du nouveau sélecteur de manches
const selectManches = document.getElementById('select-manches');
let nbManchesActuel = 10; // Par défaut

function initialiserGrille(nbManches) {
    manchesList.innerHTML = '';
    gameEngine.scoresState = {};
    gameEngine.domCache = {};
    nbManchesActuel = nbManches;

    for (let m = 1; m <= nbManches; m++) {
        gameEngine.scoresState[m] = null; // <-- État initial à null
        
        const div = document.createElement('div');
        div.className = 'manche-card';
        
        div.innerHTML = `
            <div class="manche-info">Manche #${m} <span>${m} Bille(s)</span></div>
            <div class="counter-group-wrapper">
                <div class="billes-val main-trigger" id="val-billes-${m}">-</div>
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
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Vide l'ancienne sauvegarde pour éviter les conflits de taille de grille
    initialiserGrille(parseInt(e.target.value));
});

function chargerPartieOuInitialiser() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            nbManchesActuel = data.nbManches;
            selectManches.value = nbManchesActuel;
            
            btnAjustTable.checked = data.ajustTable;
            btnAjustPoche.checked = data.ajustPoche;
            
            // 1. Reconstruire la grille visuelle vide
            initialiserGrille(nbManchesActuel);
            
            // 2. Restaurer l'état complet de chaque manche
            for (let m = 1; m <= nbManchesActuel; m++) {
                const mancheSaved = data.manchesData[m];
                if (mancheSaved) {
                    // Restaure le score dans le moteur de jeu
                    gameEngine.scoresState[m] = mancheSaved.scoreBrut;
                    
                    // Restaure l'état des cases à cocher dans le DOM
                    const cache = gameEngine.domCache[m];
                    cache.blanche.checked = mancheSaved.blanche;
                    cache.za.checked = mancheSaved.za;
                    
                    if (mancheSaved.scoreBrut !== null) {
                        cache.valBilles.textContent = mancheSaved.scoreBrut;
                    }
                }
            }
            
            // 3. Recalculer pour appliquer les styles, les totaux et la logique métier
            calculerScore();
            return;
        } catch (e) {
            console.error("Erreur lors du chargement de la sauvegarde", e);
        }
    }
    
    initialiserGrille(10);
}

// Remplace l'ancien appel "initialiserGrille(10);"
chargerPartieOuInitialiser();

// --- GESTION DES CASES À COCHER D'AJUSTEMENT ---
// Déclenche le calcul automatique dès qu'une case est cochée ou décochée
btnAjustTable.addEventListener('change', calculerScore);
btnAjustPoche.addEventListener('change', calculerScore);


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
    
    // Initialisation des compteurs de statistiques
    let totalBillesEmpochees = 0;
    let totalManchesParfaites = 0;
    let totalZA = 0;
    let totalFautes = 0;

    for (let m = 1; m <= nbManchesActuel; m++) {
        const cache = gameEngine.domCache[m];
        let scoreBrut = gameEngine.scoresState[m]; 
        let billes = scoreBrut === null ? 0 : scoreBrut; 
        let scoreManche = 0;

        // =================================================================================
        // 1. RÈGLE DE L'ORDRE CHRONOLOGIQUE
        // Une manche est accessible uniquement si c'est la première (m===1) 
        // OU si la manche précédente (m-1) a déjà été remplie (différente de null)
        // =================================================================================
        const estAccessible = (m === 1) || (gameEngine.scoresState[m - 1] !== null);

        if (!estAccessible) {
            gameEngine.scoresState[m] = null;
            scoreBrut = null;
            cache.card.style.pointerEvents = 'none';   // Bloque tous les clics (boutons, sélecteurs, checkbox)
            cache.card.style.opacity = '0.4';          // Effet visuel de verrouillage
        } else {
            cache.card.style.pointerEvents = 'auto';
            cache.card.style.opacity = '1';
        }

        // =================================================================================
        // 2. RÈGLE DU BOUTON FAUTE (F)
        // Disponible uniquement si un nombre de billes (même 0) a été choisi
        // =================================================================================
        if (scoreBrut === null) {
            cache.blanche.checked = false;                     // Décoche en cas de retour à zéro
            cache.blanche.disabled = true;                     // Bloque l'input HTML
            cache.blanche.parentElement.style.opacity = '0.3'; // Rendu visuel désactivé
            cache.blanche.parentElement.style.cursor = 'not-allowed';
        } else {
            cache.blanche.disabled = false;                    // Active l'input HTML
            cache.blanche.parentElement.style.opacity = '1';   // Rendu visuel normal
            cache.blanche.parentElement.style.cursor = 'pointer';
        }

        // Met à jour l'affichage de la bulle principale (tiret si null, sinon le chiffre)
        cache.valBilles.textContent = scoreBrut === null ? '-' : scoreBrut;

        cache.card.classList.remove('manche-foul', 'manche-parfaite', 'manche-encours', 'manche-za', 'manche-zero');
        cache.btnMax.style.backgroundColor = (scoreBrut === m) ? 'var(--accent-blue, #3b82f6)' : '#334155';

        if (scoreBrut === m && !cache.blanche.checked) {
            cache.bonusContainer.style.visibility = 'visible';
        } else {
            cache.bonusContainer.style.visibility = 'hidden';
            cache.za.checked = false; 
        }

        // STATISTIQUE : Cumul des billes empochées (si la manche a débuté, même s'il y a faute)
        if (scoreBrut !== null) {
            totalBillesEmpochees += billes;
        }

        if (cache.blanche.checked) {
            scoreManche = 0;
            cache.card.classList.add('manche-foul'); 
            
            // STATISTIQUE : Faute commise
            totalFautes++; 
        } else {
            scoreManche = billes;

            if (scoreBrut === null) {
                // État initial non choisi : Thème neutre par défaut
                cache.card.classList.add('manche-zero'); 
                scoreManche = '-'; // <-- On force l'affichage du tiret pour le total de la manche
            } else if (scoreBrut === m) {
                scoreManche *= CONFIG_SCORES.multiplicateurMancheParfaite;
                if (cache.za.checked) {
                    scoreManche += CONFIG_SCORES.bonusZA;
                    cache.card.classList.add('manche-za'); 
                    
                    // STATISTIQUE : ZA obtenue
                    totalZA++;
                } else {
                    cache.card.classList.add('manche-parfaite'); 
                }
                
                // STATISTIQUE : Manche parfaite
                totalManchesParfaites++;
            } else {
                // N'importe quel chiffre choisi (y compris le 0) active la manche en cours
                cache.card.classList.add('manche-encours'); 
            }
        }

        // On affiche le score calculé ou le tiret si la manche n'est pas commencée
        cache.scoreMancheSpan.textContent = scoreManche;
        
        // Pour le cumul global, on ajoute 0 si scoreManche vaut '-'
        scoreTotal += (scoreManche === '-') ? 0 : scoreManche;
    }

        // --- Calcul existant du score final ---
    let totalMalus = 0;
    if (btnAjustTable.checked) totalMalus += CONFIG_SCORES.malusTable; //
    if (btnAjustPoche.checked) totalMalus += CONFIG_SCORES.malusPoche; //

    const scoreFinal = Math.max(0, Math.round(scoreTotal * (1 + (totalMalus / 100)))); //

    // --- AJOUT/MODIFICATION : Gestion de l'astérisque si une case est cochée ---
    if (btnAjustTable.checked || btnAjustPoche.checked) {
        finalScoreSpan.textContent =  scoreFinal + '*';
    } else {
        finalScoreSpan.textContent = scoreFinal;
    }

    // --- Suite existante des statistiques ---
    document.getElementById('stat-billes').textContent = totalBillesEmpochees; //
    document.getElementById('stat-parfaites').textContent = totalManchesParfaites; //
    document.getElementById('stat-za').textContent = totalZA; //
    document.getElementById('stat-fautes').textContent = totalFautes; //

    // NOUVELLES TUILES DE SCORE
    document.getElementById('stat-score-brut').textContent = scoreTotal; //
    document.getElementById('stat-score-net').textContent = scoreFinal; //

        // === BLOC DE SAUVEGARDE MIS À JOUR ===
    const manchesData = {};
    for (let m = 1; m <= nbManchesActuel; m++) {
        const cache = gameEngine.domCache[m];
        manchesData[m] = {
            scoreBrut: gameEngine.scoresState[m],
            blanche: cache ? cache.blanche.checked : false,
            za: cache ? cache.za.checked : false
        };
    }

    const dataToSave = {
        nbManches: nbManchesActuel,
        manchesData: manchesData, // Sauvegarde les billes + les cases à cocher
        ajustTable: btnAjustTable.checked,
        ajustPoche: btnAjustPoche.checked
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
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
    // SÉCURITÉ : Empêche d'ouvrir le sélecteur si la manche précédente n'est pas remplie
    if (manche > 1 && gameEngine.scoresState[manche - 1] === null) {
        return;
    }

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
            gameEngine.scoresState[m] = null;
            const cache = gameEngine.domCache[m];
            cache.valBilles.textContent = '-';
            cache.blanche.checked = false;
            cache.za.checked = false;
        }

        // AJOUT : Nettoie le localStorage pour cet onglet
        localStorage.removeItem(LOCAL_STORAGE_KEY);

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


// --- GESTION DU BOUTON ENVOYER ---
document.getElementById('btn-envoyer').addEventListener('click', () => {
    // 1. Demander le nom
    let nom = prompt("Veuillez entrer votre Nom :");
    
    // Si l'utilisateur clique sur Annuler ou laisse vide
    if (nom === null) return; 
    nom = nom.trim();
    if (nom === "") {
        alert("Le nom est obligatoire pour continuer.");
        return;
    }

    // 2. Demander l'adresse courriel
    let courriel = prompt("Veuillez entrer votre Adresse courriel :");
    
    // Si l'utilisateur clique sur Annuler ou laisse vide
    if (courriel === null) return;
    courriel = courriel.trim();
    if (courriel === "") {
        alert("L'adresse courriel est obligatoire pour continuer.");
        return;
    }

    // 3. Demander le numéro de match (Code de 4 lettres)
    let numeroMatch = prompt("Veuillez entrer le code de match (4 lettres) :");
    
    // Si l'utilisateur clique sur Annuler ou laisse vide
    if (numeroMatch === null) return;
    numeroMatch = numeroMatch.trim();
    
    // VALIDATION PAR ENTIERS ET LONGUEUR (Évite le bug d'affichage de la Regex)
    // On vérifie si la longueur est différente de 4 OU si la chaîne contient autre chose que des lettres
    const estValide = numeroMatch.length === 4 && [...numeroMatch.toLowerCase()].every(char => char >= 'a' && char <= 'z');
    
    if (!estValide) {
        alert("Le code de match doit être composé d'exactement 4 lettres.");
        return;
    }

    // Optionnel : Convertir le code en majuscules pour uniformiser l'affichage
    numeroMatch = numeroMatch.toUpperCase();

    // 4. Récupération du score net actuel pour validation
    const scoreFinal = document.getElementById('final-score').textContent;

    // Affichage de la confirmation du succès
    alert(`Merci ${nom} !\nVos informations ont été enregistrées avec succès.\nMatch # : ${numeroMatch}\nCourriel : ${courriel}\nScore Net : ${scoreFinal}`);
    
    // TODO: Vous pouvez ajouter ici une requête Fetch/Ajax si vous devez envoyer ces données à un serveur.
});
