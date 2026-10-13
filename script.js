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
            <label id="bonus-container-${m}" class="cb-touch-label cb-za" title="Blanche dans la ZA (+5 pts)" style="visibility: hidden;">
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
        const mancheCard = scoreMancheSpan.closest('.manche-card'); 

        let billes = scoresState[m];
        let scoreManche = 0;

        mancheCard.classList.remove('manche-foul', 'manche-parfaite', 'manche-encours');

        if (checkboxBlanche.checked) {
            scoreManche = 0;
            bonusContainer.style.visibility = 'hidden';
            checkboxZa.checked = false;
            mancheCard.classList.add('manche-foul');
        } else {
            scoreManche = billes;

            if (billes === m) {
                scoreManche = scoreManche * 2;
                bonusContainer.style.visibility = 'visible';
                
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
        ajustementSlider.style.background = 'var(--accent-green)';
        ajustementTxt.style.color = 'var(--accent-green)';
        ajustementTxt.style.background = 'rgba(16, 185, 129, 0.15)';
    } else if (pourcentage < 0) {
        ajustementSlider.style.background = 'var(--accent-red)';
        ajustementTxt.style.color = 'var(--accent-red)';
        ajustementTxt.style.background = 'rgba(239, 68, 68, 0.15)';
    } else {
        ajustementSlider.style.background = '#334155'; // Gris neutre par défaut
        ajustementTxt.style.color = 'var(--accent-blue)';
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
