const manchesList = document.getElementById('manches-list');
const totalSpan = document.getElementById('total');
const finalScoreSpan = document.getElementById('final-score');
const ajustementSlider = document.getElementById('ajustement-slider');
const ajustementTxt = document.getElementById('ajustement-txt');

const scoresState = {};

// Génération dynamique des 10 manches tactiles dans le HTML
for (let m = 1; m <= 10; m++) {
    scoresState[m] = 0;
    
    const div = document.createElement('div');
    div.className = 'manche-card';
    div.innerHTML = `
        <div class="manche-info">
            Manche #${m} <span>Bille: ${m}</span>
        </div>
        <div class="counter-group-wrapper">
            <!-- Le chiffre central qui sert maintenant de bouton principal -->
            <div class="billes-val main-trigger" id="val-billes-${m}" onclick="toggleSelecteur(${m})">0</div>
            
            <!-- Mini-sélecteur contextuel masqué par défaut -->
            <div class="mini-selecteur" id="selecteur-${m}" style="display: none;">
                <div class="selecteur-grid" id="grid-${m}"></div>
                <button class="btn-close-selecteur" onclick="toggleSelecteur(${m})">Fermer</button>
            </div>

            <!-- Anciens contrôles masqués par défaut (au cas où vous voulez les garder en secours) -->
            <div class="counter-group controls-backup" id="controls-${m}" style="display: none;">
                <button class="btn-touch" onclick="modifierBilles(${m}, -1)">-</button>
                <button class="btn-touch" onclick="modifierBilles(${m}, 1)">+</button>
                <button class="btn-touch btn-max" onclick="maximerBilles(${m})">M</button>
            </div>
        </div>
        <div class="input-cell">
            <label class="cb-touch-label cb-foul" title="Blanche empochée (0 pt)">
                <input type="checkbox" id="blanche-${m}" onchange="calculerScore()">
            </label>
        </div>
        <div class="input-cell">
            <label id="bonus-container-${m}" class="cb-touch-label cb-za" title="Blanche dans la ZA (+5 pts)" style="visibility: hidden;">
                <input type="checkbox" id="za-${m}" onchange="calculerScore()">
            </label>
        </div>
        <div class="score-manche"><span id="score-m-${m}">0</span></div>
    `;
    manchesList.appendChild(div);
    
    // Génère dynamiquement les boutons du sélecteur de 0 jusqu'au maximum de la manche (m)
    genererOptionsSelecteur(m);
}



// Gestion de l'incrémentation/décrémentation des billes empochées
function modifierBilles(manche, changement) {
    let nvValeur = scoresState[manche] + changement;
    
    if (nvValeur >= 0 && nvValeur <= manche) {
        scoresState[manche] = nvValeur;
        document.getElementById(`val-billes-${manche}`).innerText = nvValeur;
        calculerScore();
    }
}

// Fonction pour basculer le compteur entre le maximum et 0
function maximerBilles(manche) {
    // Si la manche est déjà au maximum, on remet à 0, sinon on met au maximum
    if (scoresState[manche] === manche) {
        scoresState[manche] = 0;
    } else {
        scoresState[manche] = manche;
    }
    
    document.getElementById(`val-billes-${manche}`).innerText = scoresState[manche];
    calculerScore();
}



// Fonction globale pour calculer les points et appliquer l'ajustement
function calculerScore() {
    let scoreTotal = 0;

    for (let m = 1; m <= 10; m++) {
        const checkboxBlanche = document.getElementById(`blanche-${m}`);
        const checkboxZa = document.getElementById(`za-${m}`);
        const bonusContainer = document.getElementById(`bonus-container-${m}`);
        const scoreMancheSpan = document.getElementById(`score-m-${m}`);
        const mancheCard = scoreMancheSpan.closest('.manche-card'); 

        let billes = scoresState[m];
        let scoreManche = 0;

        mancheCard.classList.remove('manche-foul', 'manche-parfaite', 'manche-encours');

        const btnMax = mancheCard.querySelector('.btn-max');
        if (scoresState[m] === m) {
            btnMax.style.backgroundColor = 'var(--accent-blue, #3b82f6)';
        } else {
            btnMax.style.backgroundColor = '#334155'; // Couleur neutre par défaut
        }

        // CONDITION CORRIGÉE : ZA visible UNIQUEMENT si le max est atteint ET qu'il n'y a pas de faute (blanche)
        if (billes === m && !checkboxBlanche.checked) {
            bonusContainer.style.visibility = 'visible';
        } else {
            bonusContainer.style.visibility = 'hidden';
            checkboxZa.checked = false; // Décoche automatiquement si les conditions ne sont plus remplies
        }

        // Calcul du score de la manche
        if (checkboxBlanche.checked) {
            scoreManche = 0;
            mancheCard.classList.add('manche-foul');
        } else {
            scoreManche = billes;

            if (billes === m) {
                scoreManche = scoreManche * 2;
                
                if (checkboxZa.checked) {
                    scoreManche += 5;
                    mancheCard.classList.add('manche-parfaite');
                } else if (scoreManche > 0) {
                    mancheCard.classList.add('manche-encours');
                }
            } else if (scoreManche > 0) {
                mancheCard.classList.add('manche-encours');
            }
        }

        scoreMancheSpan.innerText = scoreManche;
        scoreTotal += scoreManche;
    }

    totalSpan.innerText = scoreTotal;

    let pourcentage = parseInt(ajustementSlider.value) || 0;
    ajustementTxt.innerText = pourcentage > 0 ? `+${pourcentage}%` : `${pourcentage}%`;

    // --- DYNAMISATION DE LA COULEUR DU SLIDER ---
    if (pourcentage > 0) {
        ajustementSlider.style.backgroundColor = 'var(--accent-green, #10b981)';
        ajustementTxt.style.color = 'var(--accent-green, #10b981)';
        ajustementTxt.style.background = 'rgba(16, 185, 129, 0.15)';
    } else if (pourcentage < 0) {
        ajustementSlider.style.backgroundColor = 'var(--accent-red, #ef4444)';
        ajustementTxt.style.color = 'var(--accent-red, #ef4444)';
        ajustementTxt.style.background = 'rgba(239, 68, 68, 0.15)';
    } else {
        ajustementSlider.style.backgroundColor = '#334155'; 
        ajustementTxt.style.color = 'var(--accent-blue, #3b82f6)';
        ajustementTxt.style.background = 'rgba(59, 130, 246, 0.15)';
    }

    let multiplicateur = 1 + (pourcentage / 100);
    let scoreFinal = Math.round(scoreTotal * multiplicateur);

    if (scoreFinal < 0) scoreFinal = 0;
    finalScoreSpan.innerText = scoreFinal;
}





// Réinitialisation complète de la grille de jeu
function reinitialiserPartie() {
    if (confirm("Voulez-vous vraiment remettre tous les scores et l'ajustement à zéro ?")) {
        ajustementSlider.value = 0;
        for (let m = 1; m <= 10; m++) {
            scoresState[m] = 0;
            document.getElementById(`val-billes-${m}`).innerText = 0;
            document.getElementById(`blanche-${m}`).checked = false;
            document.getElementById(`za-${m}`).checked = false;
        }
        calculerScore();
    }
}


// Génère les boutons du mini-sélecteur avec uniquement le score actuel allumé
function genererOptionsSelecteur(manche) {
    const grid = document.getElementById(`grid-${manche}`);
    grid.innerHTML = ''; // Reset de la grille
    
    let valeurActuelle = scoresState[manche];
    
    for (let i = 0; i <= manche; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn-select-val';
        btn.innerText = i;
        
        // Uniquement le chiffre du pointage de la manche s'allume
        if (i === valeurActuelle) {
            btn.classList.add('is-active');
        }
        
        btn.onclick = function() {
            selectionnerValeur(manche, i);
        };
        grid.appendChild(btn);
    }
}


// Ouvre ou ferme le mini-sélecteur pour une manche donnée
function toggleSelecteur(manche) {
    const selecteur = document.getElementById(`selecteur-${manche}`);
    const estMasque = selecteur.style.display === 'none';
    
    // Ferme tous les autres sélecteurs ouverts
    document.querySelectorAll('.mini-selecteur').forEach(el => el.style.display = 'none');
    
    if (estMasque) {
        // IMPORTANT : On regénère les options pour appliquer la surbrillance au chiffre actuel
        genererOptionsSelecteur(manche);
        selecteur.style.display = 'block';
    } else {
        selecteur.style.display = 'none';
    }
}

// Assigne la valeur choisie depuis le sélecteur
function selectionnerValeur(manche, valeur) {
    scoresState[manche] = valeur;
    document.getElementById(`val-billes-${manche}`).innerText = valeur;
    
    // Ferme le sélecteur après sélection
    toggleSelecteur(manche);
    
    // Recalcule le score global et met à jour l'interface
    calculerScore();
}


// Optionnel : Fermer les sélecteurs si on clique en dehors de la carte de manche
document.addEventListener('click', function(event) {
    if (!event.target.closest('.counter-group-wrapper')) {
        document.querySelectorAll('.mini-selecteur').forEach(el => el.style.display = 'none');
    }
});

