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
            M.${m} <span>Max: ${m}</span>
        </div>
        <div class="counter-group">
            <button class="btn-touch" onclick="modifierBilles(${m}, -1)">-</button>
            <div class="billes-val" id="val-billes-${m}">0</div>
            <button class="btn-touch" onclick="modifierBilles(${m}, 1)">+</button>
        </div>
        <div class="input-cell">
            <label class="cb-touch-label cb-foul" title="Blanche empochée (0 pt)">
                <input type="checkbox" id="blanche-${m}" onchange="calculerScore()">
            </label>
        </div>
        <div class="input-cell">
            <label id="bonus-container-${m}" class="cb-touch-label cb-za" title="Blanche dans la ZA (+5 pts)">
                <input type="checkbox" id="za-${m}" onchange="calculerScore()">
            </label>
        </div>
        <div class="score-manche"><span id="score-m-${m}">0</span></div>
    `;
    manchesList.appendChild(div);
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

// Fonction globale pour calculer les points et appliquer l'ajustement
function calculerScore() {
    let scoreTotal = 0;

    for (let m = 1; m <= 10; m++) {
        const checkboxBlanche = document.getElementById(`blanche-${m}`);
        const checkboxZa = document.getElementById(`za-${m}`);
        const bonusContainer = document.getElementById(`bonus-container-${m}`);
        const scoreMancheSpan = document.getElementById(`score-m-${m}`);

        let billes = scoresState[m];
        let scoreManche = 0;

        // Si faute (blanche empochée) : la manche retombe à 0
        if (checkboxBlanche.checked) {
            scoreManche = 0;
            bonusContainer.style.visibility = 'hidden';
            checkboxZa.checked = false;
        } else {
            scoreManche = billes;

            // Règle de la manche parfaite (doublé)
            if (billes === m) {
                scoreManche = scoreManche * 2;
                bonusContainer.style.visibility = 'visible';
                
                // Bonus Zone d'Arrivée
                if (checkboxZa.checked) {
                    scoreManche += 5;
                }
            } else {
                bonusContainer.style.visibility = 'hidden';
                checkboxZa.checked = false;
            }
        }

        scoreMancheSpan.innerText = scoreManche;
        scoreTotal += scoreManche;
    }

    // Affichage des points bruts
    totalSpan.innerText = scoreTotal;

    // Mise à jour de l'indicateur textuel de pourcentage (+ ou -)
    let pourcentage = parseInt(ajustementSlider.value) || 0;
    ajustementTxt.innerText = pourcentage > 0 ? `+${pourcentage}` : pourcentage;

    // Calcul final arrondi avec le pourcentage d'ajustement
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
