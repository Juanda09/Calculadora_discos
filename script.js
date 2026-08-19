/* ==========================================================
   POWERLOAD v6
   Calculadora de discos para Powerlifting

   IMPORTANTE:
   - Los DISCOS están definidos SIEMPRE en LIBRAS.
   - La barra se maneja internamente en LIBRAS.
   - El usuario puede visualizar el peso total en KG o LB.
   - NO existe inventario de discos.
========================================================== */

"use strict";


/* ==========================================================
   CONFIGURACIÓN
========================================================== */

const PLATES = [
    {
        weight: 45,
        label: "45 lb",
        className: "45"
    },
    {
        weight: 25,
        label: "25 lb",
        className: "25"
    },
    {
        weight: 10,
        label: "10 lb",
        className: "10"
    },
    {
        weight: 5,
        label: "5 lb",
        className: "5"
    },
    {
        weight: 2.5,
        label: "2.5 lb",
        className: "2-5"
    }
];


/*
 * Conversión oficial utilizada por la aplicación.
 */
const LB_TO_KG = 0.45359237;
const KG_TO_LB = 1 / LB_TO_KG;


/*
 * Estado principal.
 */
const state = {

    unit: localStorage.getItem("powerload_unit") || "kg",

    theme: localStorage.getItem("powerload_theme") || "dark",

    barWeight: 45,

    plates: {
        45: 0,
        25: 0,
        10: 0,
        5: 0,
        2.5: 0
    },

    formula: "epley",

    targetCombination: null,

    favorites: JSON.parse(
        localStorage.getItem("powerload_favorites") || "[]"
    ),

    history: JSON.parse(
        localStorage.getItem("powerload_history") || "[]"
    )

};


/* ==========================================================
   DOM
========================================================== */

const $ = (id) => document.getElementById(id);

const elements = {

    themeButton: $("themeButton"),

    kgButton: $("kgButton"),
    lbButton: $("lbButton"),

    mainWeight: $("mainWeight"),
    mainUnit: $("mainUnit"),
    secondaryWeight: $("secondaryWeight"),

    sideWeight: $("sideWeight"),
    platesWeight: $("platesWeight"),
    barDisplay: $("barDisplay"),

    saveCurrentButton: $("saveCurrentButton"),

    clearPlates: $("clearPlates"),

    leftVisual: $("leftVisual"),
    rightVisual: $("rightVisual"),

    visualPlateCount: $("visualPlateCount"),
    visualTotal: $("visualTotal"),

    platesContainer: $("platesContainer"),

    barWeight: $("barWeight"),

    targetWeight: $("targetWeight"),
    targetUnit: $("targetUnit"),
    calculateTarget: $("calculateTarget"),
    quickTargets: $("quickTargets"),

    targetResult: $("targetResult"),
    targetResultTitle: $("targetResultTitle"),
    targetAccuracy: $("targetAccuracy"),
    targetCombination: $("targetCombination"),
    targetRequested: $("targetRequested"),
    targetReal: $("targetReal"),
    targetDifference: $("targetDifference"),
    applyTarget: $("applyTarget"),

    oneRm: $("oneRm"),
    oneRmUnit: $("oneRmUnit"),
    percentage: $("percentage"),
    rmResult: $("rmResult"),
    sendRmToTarget: $("sendRmToTarget"),

    percentageGrid: $("percentageGrid"),

    estimateWeight: $("estimateWeight"),
    estimateUnit: $("estimateUnit"),
    estimateReps: $("estimateReps"),
    estimatedOneRm: $("estimatedOneRm"),
    sendEstimatedToTarget: $("sendEstimatedToTarget"),

    favoritesContainer: $("favoritesContainer"),
    clearFavorites: $("clearFavorites"),

    historyContainer: $("historyContainer"),
    clearHistory: $("clearHistory"),

    toastContainer: $("toastContainer")

};


/* ==========================================================
   UTILIDADES
========================================================== */

function round(value, decimals = 2) {

    const factor = Math.pow(10, decimals);

    return Math.round((value + Number.EPSILON) * factor) / factor;

}


function formatNumber(value, decimals = 2) {

    if (!Number.isFinite(value)) {
        return "0";
    }

    const rounded = round(value, decimals);

    return rounded
        .toFixed(decimals)
        .replace(/\.00$/, "")
        .replace(/(\.\d)0$/, "$1");

}


function formatWeight(weightLb, unit = state.unit) {

    if (!Number.isFinite(weightLb)) {
        return `0 ${unit}`;
    }

    if (unit === "kg") {

        return `${formatNumber(weightLb * LB_TO_KG, 2)} kg`;

    }

    return `${formatNumber(weightLb, 2)} lb`;

}


function toLb(value, unit) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return 0;
    }

    return unit === "kg"
        ? number * KG_TO_LB
        : number;

}


function fromLb(valueLb, unit) {

    return unit === "kg"
        ? valueLb * LB_TO_KG
        : valueLb;

}


function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ==========================================================
   TOAST
========================================================== */

function showToast(message, type = "info") {

    if (!elements.toastContainer) {
        return;
    }

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("out");

        setTimeout(() => {
            toast.remove();
        }, 220);

    }, 2800);

}


/* ==========================================================
   TEMA
========================================================== */

function applyTheme() {

    document.body.classList.toggle(
        "light",
        state.theme === "light"
    );

    if (elements.themeButton) {

        elements.themeButton.textContent =
            state.theme === "light"
                ? "☀"
                : "☾";

        elements.themeButton.title =
            state.theme === "light"
                ? "Cambiar a modo oscuro"
                : "Cambiar a modo claro";

    }

}


function toggleTheme() {

    state.theme =
        state.theme === "light"
            ? "dark"
            : "light";

    localStorage.setItem(
        "powerload_theme",
        state.theme
    );

    applyTheme();

}


/* ==========================================================
   UNIDADES
========================================================== */

function updateUnitButtons() {

    if (elements.kgButton) {

        elements.kgButton.classList.toggle(
            "active",
            state.unit === "kg"
        );

    }

    if (elements.lbButton) {

        elements.lbButton.classList.toggle(
            "active",
            state.unit === "lb"
        );

    }

}


function updateUnitLabels() {

    if (elements.mainUnit) {
        elements.mainUnit.textContent = state.unit;
    }

    if (elements.targetUnit) {
        elements.targetUnit.textContent = state.unit;
    }

    if (elements.oneRmUnit) {
        elements.oneRmUnit.textContent = state.unit;
    }

    if (elements.estimateUnit) {
        elements.estimateUnit.textContent = state.unit;
    }

}


function changeUnit(unit) {

    if (unit !== "kg" && unit !== "lb") {
        return;
    }

    state.unit = unit;

    localStorage.setItem(
        "powerload_unit",
        state.unit
    );

    updateUnitButtons();
    updateUnitLabels();
    updateQuickTargets();

    updateMainDisplay();
    calculateOneRM();
    calculateEstimatedOneRM();

}


/* ==========================================================
   BARRA
========================================================== */

function getBarWeight() {

    const value = Number(
        elements.barWeight?.value
    );

    return Number.isFinite(value)
        ? value
        : 45;

}


function getPlatesPerSideWeight() {

    let total = 0;

    Object.keys(state.plates).forEach(weight => {

        total +=
            Number(weight) *
            Number(state.plates[weight]);

    });

    return total;

}


function getTotalPlateWeight() {

    return getPlatesPerSideWeight() * 2;

}


function getCurrentTotalWeight() {

    return (
        getBarWeight() +
        getTotalPlateWeight()
    );

}


/* ==========================================================
   DISCOS
========================================================== */

function renderPlates() {

    if (!elements.platesContainer) {
        return;
    }

    elements.platesContainer.innerHTML = "";

    PLATES.forEach(plate => {

        const count =
            state.plates[plate.weight] || 0;

        const row =
            document.createElement("div");

        row.className =
            `plate-row ${count > 0 ? "has-plates" : ""}`;

        row.innerHTML = `

            <div class="plate-info">

                <div
                    class="plate-circle plate-${plate.className}"
                >
                    ${plate.weight}
                </div>

                <div>

                    <strong>
                        ${plate.label}
                    </strong>

                    <small>
                        Por lado
                    </small>

                </div>

            </div>

            <div class="counter">

                <button
                    type="button"
                    data-action="decrease"
                    data-weight="${plate.weight}"
                    aria-label="Quitar disco de ${plate.label}"
                    ${count <= 0 ? "disabled" : ""}
                >
                    −
                </button>

                <span>
                    ${count}
                </span>

                <button
                    type="button"
                    data-action="increase"
                    data-weight="${plate.weight}"
                    aria-label="Agregar disco de ${plate.label}"
                >
                    +
                </button>

            </div>

        `;

        elements.platesContainer.appendChild(row);

    });

}


function changePlate(weight, amount) {

    const current =
        state.plates[weight] || 0;

    const next =
        Math.max(0, current + amount);

    state.plates[weight] = next;

    renderPlates();
    updateVisualBar();
    updateMainDisplay();

}


/* ==========================================================
   VISUALIZACIÓN DE LA BARRA
========================================================== */

function createVisualPlate(plate) {

    const element =
        document.createElement("div");

    element.className =
        `visual-plate visual-${plate.className}`;

    element.title =
        `${plate.label} por lado`;

    element.textContent =
        plate.weight;

    return element;

}


function renderVisualStack(container) {

    if (!container) {
        return;
    }

    container.innerHTML = "";

    /*
     * Los discos se dibujan desde los más pesados
     * hacia los más pequeños.
     */
    PLATES.forEach(plate => {

        const count =
            state.plates[plate.weight] || 0;

        for (let i = 0; i < count; i++) {

            container.appendChild(
                createVisualPlate(plate)
            );

        }

    });

}


function updateVisualBar() {

    renderVisualStack(elements.leftVisual);
    renderVisualStack(elements.rightVisual);

    const count =
        Object.values(state.plates)
            .reduce(
                (sum, value) => sum + Number(value),
                0
            );

    const total =
        getCurrentTotalWeight();

    if (elements.visualPlateCount) {

        elements.visualPlateCount.textContent =
            count;

    }

    if (elements.visualTotal) {

        elements.visualTotal.textContent =
            formatWeight(total);

    }

}


/* ==========================================================
   DISPLAY PRINCIPAL
========================================================== */

function updateMainDisplay() {

    const total =
        getCurrentTotalWeight();

    const platesPerSide =
        getPlatesPerSideWeight();

    const bar =
        getBarWeight();

    const mainValue =
        fromLb(total, state.unit);

    const sideValue =
        fromLb(platesPerSide, state.unit);

    const platesTotalValue =
        fromLb(platesPerSide * 2, state.unit);

    const barValue =
        fromLb(bar, state.unit);


    if (elements.mainWeight) {

        elements.mainWeight.textContent =
            formatNumber(mainValue, 2);

    }

    if (elements.mainUnit) {

        elements.mainUnit.textContent =
            state.unit;

    }

    if (elements.secondaryWeight) {

        const otherUnit =
            state.unit === "kg"
                ? "lb"
                : "kg";

        elements.secondaryWeight.textContent =
            formatWeight(
                total,
                otherUnit
            );

    }

    if (elements.sideWeight) {

        elements.sideWeight.textContent =
            `${formatNumber(sideValue, 2)} ${state.unit}`;

    }

    if (elements.platesWeight) {

        elements.platesWeight.textContent =
            `${formatNumber(platesTotalValue, 2)} ${state.unit}`;

    }

    if (elements.barDisplay) {

        elements.barDisplay.textContent =
            `${formatNumber(barValue, 2)} ${state.unit}`;

    }

}


/* ==========================================================
   LIMPIAR DISCOS
========================================================== */

function clearPlates() {

    Object.keys(state.plates).forEach(weight => {

        state.plates[weight] = 0;

    });

    renderPlates();
    updateVisualBar();
    updateMainDisplay();

    showToast(
        "Configuración de discos limpiada.",
        "info"
    );

}


/* ==========================================================
   OBJETIVOS RÁPIDOS
========================================================== */

function getQuickTargets() {

    if (state.unit === "kg") {

        return [
            60,
            80,
            100,
            120,
            140,
            160,
            180,
            200
        ];

    }

    return [
        135,
        180,
        225,
        275,
        315,
        365,
        405,
        455
    ];

}


function updateQuickTargets() {

    if (!elements.quickTargets) {
        return;
    }

    elements.quickTargets.innerHTML = "";

    getQuickTargets().forEach(value => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.textContent =
            `${value} ${state.unit}`;

        button.addEventListener(
            "click",
            () => {

                if (elements.targetWeight) {

                    elements.targetWeight.value =
                        value;

                }

                findTarget();

            }
        );

        elements.quickTargets.appendChild(button);

    });

}


/* ==========================================================
   COMBINACIONES DE DISCOS
========================================================== */

/*
 * Genera combinaciones de discos por lado.
 *
 * IMPORTANTE:
 * Los discos SIEMPRE están en LIBRAS.
 *
 * No existe inventario:
 * cualquier cantidad de discos es válida.
 */

function findBestPlateCombination(
    requiredPerSideLb
) {

    requiredPerSideLb =
        Math.max(
            0,
            Number(requiredPerSideLb) || 0
        );


    /*
     * Los discos se trabajan en incrementos de 2.5 lb.
     */
    const roundedTarget =
        Math.round(
            requiredPerSideLb / 2.5
        ) * 2.5;


    /*
     * Conversión a unidades de 2.5 lb.
     */
    const targetUnits =
        Math.round(
            roundedTarget / 2.5
        );


    const denominations = [
        18, // 45 lb
        10, // 25 lb
        4,  // 10 lb
        2,  // 5 lb
        1   // 2.5 lb
    ];


    /*
     * Programación dinámica para encontrar
     * la combinación con menor cantidad de discos.
     */
    const dp =
        new Array(targetUnits + 1)
            .fill(null);

    dp[0] = {
        count: 0,
        combo: [0, 0, 0, 0, 0]
    };


    for (
        let total = 1;
        total <= targetUnits;
        total++
    ) {

        let best = null;

        denominations.forEach(
            (denomination, index) => {

                if (
                    total >= denomination &&
                    dp[total - denomination]
                ) {

                    const previous =
                        dp[total - denomination];

                    const candidate = {

                        count:
                            previous.count + 1,

                        combo:
                            [...previous.combo]

                    };

                    candidate.combo[index]++;


                    if (
                        !best ||
                        candidate.count < best.count
                    ) {

                        best = candidate;

                    }

                }

            }
        );


        dp[total] = best;

    }


    const result =
        dp[targetUnits] || {
            count: 0,
            combo: [0, 0, 0, 0, 0]
        };


    const combination = {

        45: result.combo[0],
        25: result.combo[1],
        10: result.combo[2],
        5: result.combo[3],
        2.5: result.combo[4]

    };


    const actualPerSide =
        Object.keys(combination)
            .reduce(
                (sum, weight) =>
                    sum +
                    Number(weight) *
                    combination[weight],
                0
            );


    return {

        combination,

        requestedPerSide: requiredPerSideLb,

        actualPerSide,

        differencePerSide:
            actualPerSide - requiredPerSideLb,

        totalPlateWeight:
            actualPerSide * 2

    };

}


/* ==========================================================
   ENCONTRAR OBJETIVO
========================================================== */

function findTarget() {

    if (!elements.targetWeight) {
        return;
    }

    const inputValue =
        Number(elements.targetWeight.value);


    if (
        !Number.isFinite(inputValue) ||
        inputValue <= 0
    ) {

        showToast(
            "Ingresa un peso objetivo válido.",
            "error"
        );

        return;

    }


    const targetLb =
        toLb(
            inputValue,
            state.unit
        );


    const barLb =
        getBarWeight();


    const requiredPlateTotal =
        targetLb - barLb;


    /*
     * No puede existir un peso de discos negativo.
     */
    const requiredPerSide =
        Math.max(
            0,
            requiredPlateTotal / 2
        );


    const result =
        findBestPlateCombination(
            requiredPerSide
        );


    const realTotal =
        barLb +
        result.totalPlateWeight;


    const difference =
        realTotal - targetLb;


    state.targetCombination = {

        ...result,

        targetLb,

        barLb,

        realTotal,

        difference

    };


    displayTargetResult(
        state.targetCombination
    );

}


function displayTargetResult(result) {

    if (!elements.targetResult) {
        return;
    }


    elements.targetResult.classList.remove(
        "hidden"
    );


    const absoluteDifference =
        Math.abs(result.difference);


    let accuracyClass =
        "exact";

    let accuracyText =
        "EXACTO";


    if (absoluteDifference > 0.01) {

        if (absoluteDifference <= 2.5) {

            accuracyClass = "close";

            accuracyText = "CERCANO";

        } else {

            accuracyClass = "unavailable";

            accuracyText = "APROXIMADO";

        }

    }


    if (elements.targetAccuracy) {

        elements.targetAccuracy.className =
            `accuracy ${accuracyClass}`;

        elements.targetAccuracy.textContent =
            accuracyText;

    }


    if (elements.targetResultTitle) {

        elements.targetResultTitle.textContent =
            accuracyText === "EXACTO"
                ? "Combinación recomendada"
                : "Mejor combinación disponible";

    }


    if (elements.targetCombination) {

        elements.targetCombination.innerHTML = "";

        PLATES.forEach(plate => {

            const count =
                result.combination[plate.weight] || 0;

            if (count <= 0) {
                return;
            }


            const chip =
                document.createElement("div");

            chip.className =
                "plate-chip";

            chip.textContent =
                `${count} × ${plate.label}`;

            elements.targetCombination
                .appendChild(chip);

        });


        if (
            elements.targetCombination
                .children.length === 0
        ) {

            const chip =
                document.createElement("div");

            chip.className =
                "plate-chip";

            chip.textContent =
                "Sin discos";

            elements.targetCombination
                .appendChild(chip);

        }

    }


    if (elements.targetRequested) {

        elements.targetRequested.textContent =
            formatWeight(
                result.targetLb
            );

    }


    if (elements.targetReal) {

        elements.targetReal.textContent =
            formatWeight(
                result.realTotal
            );

    }


    if (elements.targetDifference) {

        const sign =
            result.difference > 0
                ? "+"
                : "";

        elements.targetDifference.textContent =
            `${sign}${formatWeight(result.difference)}`;

    }

}


/* ==========================================================
   APLICAR OBJETIVO
========================================================== */

function applyTargetConfiguration() {

    const result =
        state.targetCombination;


    if (!result) {

        showToast(
            "Primero encuentra una combinación.",
            "warning"
        );

        return;

    }


    Object.keys(state.plates).forEach(weight => {

        state.plates[weight] =
            result.combination[weight] || 0;

    });


    renderPlates();
    updateVisualBar();
    updateMainDisplay();

    addHistory({
        weight: result.realTotal,
        plates: {...state.plates},
        bar: result.barLb
    });


    showToast(
        "Configuración aplicada.",
        "success"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ==========================================================
   1RM
========================================================== */

function calculateOneRMValue(weight, reps, formula) {

    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(reps) ||
        weight <= 0 ||
        reps <= 0
    ) {

        return 0;

    }


    if (reps === 1) {
        return weight;
    }


    switch (formula) {

        case "brzycki":

            return (
                weight *
                (36 / (37 - reps))
            );


        case "lombardi":

            return (
                weight *
                Math.pow(reps, 0.10)
            );


        case "epley":

        default:

            return (
                weight *
                (1 + reps / 30)
            );

    }

}


function calculateOneRM() {

    const input =
        Number(elements.oneRm?.value);

    const percentage =
        Number(elements.percentage?.value);


    if (
        !Number.isFinite(input) ||
        input <= 0 ||
        !Number.isFinite(percentage)
    ) {

        if (elements.rmResult) {

            elements.rmResult.textContent =
                `0 ${state.unit}`;

        }

        renderPercentageGrid(0);

        return;

    }


    /*
     * El campo 1RM representa directamente el máximo.
     */
    const oneRmLb =
        toLb(
            input,
            state.unit
        );


    const resultLb =
        oneRmLb * percentage;


    if (elements.rmResult) {

        elements.rmResult.textContent =
            formatWeight(resultLb);

    }


    renderPercentageGrid(oneRmLb);

}


/* ==========================================================
   TABLA DE PORCENTAJES
========================================================== */

function renderPercentageGrid(oneRmLb) {

    if (!elements.percentageGrid) {
        return;
    }

    elements.percentageGrid.innerHTML = "";


    const percentages = [
        50,
        55,
        60,
        65,
        70,
        75,
        77.5,
        80,
        82.5,
        85,
        87.5,
        90,
        92.5,
        95,
        100
    ];


    const selected =
        Number(elements.percentage?.value) || 0;


    percentages.forEach(percent => {

        const cell =
            document.createElement("div");

        cell.className =
            "percentage-cell";


        if (
            Math.abs(
                percent / 100 - selected
            ) < 0.0001
        ) {

            cell.classList.add("active");

        }


        const valueLb =
            oneRmLb > 0
                ? oneRmLb * (percent / 100)
                : 0;


        cell.innerHTML = `

            <span>
                ${percent}%
            </span>

            <strong>
                ${formatWeight(valueLb)}
            </strong>

        `;


        cell.addEventListener(
            "click",
            () => {

                if (elements.percentage) {

                    elements.percentage.value =
                        String(percent / 100);

                }

                calculateOneRM();

            }
        );


        elements.percentageGrid
            .appendChild(cell);

    });

}


/* ==========================================================
   ESTIMADOR DE 1RM
========================================================== */

function calculateEstimatedOneRM() {

    const weight =
        Number(elements.estimateWeight?.value);

    const reps =
        Number(elements.estimateReps?.value);


    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(reps) ||
        weight <= 0 ||
        reps < 1
    ) {

        if (elements.estimatedOneRm) {

            elements.estimatedOneRm.textContent =
                `0 ${state.unit}`;

        }

        return 0;

    }


    const weightLb =
        toLb(
            weight,
            state.unit
        );


    /*
     * Epley para estimación general.
     */
    const estimatedLb =
        calculateOneRMValue(
            weightLb,
            reps,
            "epley"
        );


    if (elements.estimatedOneRm) {

        elements.estimatedOneRm.textContent =
            formatWeight(estimatedLb);

    }


    return estimatedLb;

}


/* ==========================================================
   ENVIAR 1RM AL OBJETIVO
========================================================== */

function sendRmToTarget() {

    const input =
        Number(elements.oneRm?.value);

    const percentage =
        Number(elements.percentage?.value);


    if (
        !Number.isFinite(input) ||
        input <= 0
    ) {

        showToast(
            "Ingresa un 1RM válido.",
            "warning"
        );

        return;

    }


    const oneRmLb =
        toLb(
            input,
            state.unit
        );


    const targetLb =
        oneRmLb * percentage;


    const targetValue =
        fromLb(
            targetLb,
            state.unit
        );


    if (elements.targetWeight) {

        elements.targetWeight.value =
            round(targetValue, 2);

    }


    findTarget();


    elements.targetWeight?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    showToast(
        "Carga enviada al objetivo.",
        "success"
    );

}


function sendEstimatedToTarget() {

    const estimatedLb =
        calculateEstimatedOneRM();


    if (
        !Number.isFinite(estimatedLb) ||
        estimatedLb <= 0
    ) {

        showToast(
            "Completa peso y repeticiones.",
            "warning"
        );

        return;

    }


    const targetValue =
        fromLb(
            estimatedLb,
            state.unit
        );


    if (elements.targetWeight) {

        elements.targetWeight.value =
            round(targetValue, 2);

    }


    findTarget();


    elements.targetWeight?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });


    showToast(
        "1RM estimado enviado al objetivo.",
        "success"
    );

}


/* ==========================================================
   FAVORITOS
========================================================== */

function getCurrentConfiguration() {

    return {

        weight:
            getCurrentTotalWeight(),

        bar:
            getBarWeight(),

        plates:
            {...state.plates},

        date:
            new Date().toISOString()

    };

}


function saveCurrentFavorite() {

    const config =
        getCurrentConfiguration();


    /*
     * Evitar guardar exactamente la misma configuración.
     */
    const duplicate =
        state.favorites.some(item =>
            item.bar === config.bar &&
            JSON.stringify(item.plates) ===
            JSON.stringify(config.plates)
        );


    if (duplicate) {

        showToast(
            "Esta configuración ya está guardada.",
            "warning"
        );

        return;

    }


    state.favorites.unshift(config);


    /*
     * Máximo 20 favoritos.
     */
    state.favorites =
        state.favorites.slice(0, 20);


    localStorage.setItem(
        "powerload_favorites",
        JSON.stringify(state.favorites)
    );


    renderFavorites();


    showToast(
        "Configuración guardada en favoritos.",
        "success"
    );

}


function renderFavorites() {

    if (!elements.favoritesContainer) {
        return;
    }


    elements.favoritesContainer.innerHTML = "";


    if (state.favorites.length === 0) {

        elements.favoritesContainer.innerHTML =
            `<div class="empty">
                No tienes configuraciones guardadas.
            </div>`;

        return;

    }


    state.favorites.forEach(
        (favorite, index) => {

            const item =
                document.createElement("div");

            item.className =
                "favorite-item";


            const platesText =
                getCombinationText(
                    favorite.plates
                );


            item.innerHTML = `

                <div>

                    <div class="item-weight">
                        ${formatWeight(favorite.weight)}
                    </div>

                    <div class="item-detail">
                        ${escapeHTML(platesText)}
                    </div>

                </div>

                <div class="item-actions">

                    <button
                        type="button"
                        data-action="load"
                        data-index="${index}"
                    >
                        Usar
                    </button>

                    <button
                        type="button"
                        class="delete"
                        data-action="delete"
                        data-index="${index}"
                    >
                        Eliminar
                    </button>

                </div>

            `;


            elements.favoritesContainer
                .appendChild(item);

        }
    );

}


function loadFavorite(index) {

    const favorite =
        state.favorites[index];


    if (!favorite) {
        return;
    }


    state.barWeight =
        Number(favorite.bar) || 45;


    if (elements.barWeight) {

        elements.barWeight.value =
            String(state.barWeight);

    }


    Object.keys(state.plates).forEach(weight => {

        state.plates[weight] =
            Number(
                favorite.plates?.[weight]
            ) || 0;

    });


    renderPlates();
    updateVisualBar();
    updateMainDisplay();


    showToast(
        "Favorito aplicado.",
        "success"
    );

}


function deleteFavorite(index) {

    if (
        !state.favorites[index]
    ) {
        return;
    }


    state.favorites.splice(
        index,
        1
    );


    localStorage.setItem(
        "powerload_favorites",
        JSON.stringify(state.favorites)
    );


    renderFavorites();


    showToast(
        "Favorito eliminado.",
        "info"
    );

}


function clearFavorites() {

    if (
        state.favorites.length === 0
    ) {

        return;

    }


    state.favorites = [];


    localStorage.removeItem(
        "powerload_favorites"
    );


    renderFavorites();


    showToast(
        "Favoritos eliminados.",
        "info"
    );

}


/* ==========================================================
   HISTORIAL
========================================================== */

function getCombinationText(plates) {

    const parts = [];


    PLATES.forEach(plate => {

        const count =
            Number(
                plates?.[plate.weight]
            ) || 0;


        if (count > 0) {

            parts.push(
                `${count}×${plate.weight} lb`
            );

        }

    });


    return parts.length
        ? parts.join(" + ")
        : "Sin discos";

}


function addHistory(config) {

    const entry = {

        weight:
            config.weight,

        bar:
            config.bar,

        plates:
            {...config.plates},

        date:
            new Date().toISOString()

    };


    state.history.unshift(entry);


    /*
     * Máximo 30 registros.
     */
    state.history =
        state.history.slice(0, 30);


    localStorage.setItem(
        "powerload_history",
        JSON.stringify(state.history)
    );


    renderHistory();

}


function renderHistory() {

    if (!elements.historyContainer) {
        return;
    }


    elements.historyContainer.innerHTML = "";


    if (state.history.length === 0) {

        elements.historyContainer.innerHTML =
            `<div class="empty">
                No hay configuraciones en el historial.
            </div>`;

        return;

    }


    state.history.forEach(
        (entry, index) => {

            const item =
                document.createElement("div");

            item.className =
                "history-item";


            const date =
                new Date(entry.date);


            const dateText =
                Number.isNaN(date.getTime())
                    ? ""
                    : date.toLocaleString(
                        "es-CO",
                        {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );


            item.innerHTML = `

                <div>

                    <div class="item-weight">
                        ${formatWeight(entry.weight)}
                    </div>

                    <div class="item-detail">
                        ${escapeHTML(
                            getCombinationText(entry.plates)
                        )}
                        ${dateText ? ` · ${dateText}` : ""}
                    </div>

                </div>

                <div class="item-actions">

                    <button
                        type="button"
                        data-action="load"
                        data-index="${index}"
                    >
                        Usar
                    </button>

                    <button
                        type="button"
                        class="delete"
                        data-action="delete"
                        data-index="${index}"
                    >
                        Eliminar
                    </button>

                </div>

            `;


            elements.historyContainer
                .appendChild(item);

        }
    );

}


function loadHistory(index) {

    const entry =
        state.history[index];


    if (!entry) {
        return;
    }


    state.barWeight =
        Number(entry.bar) || 45;


    if (elements.barWeight) {

        elements.barWeight.value =
            String(state.barWeight);

    }


    Object.keys(state.plates).forEach(weight => {

        state.plates[weight] =
            Number(
                entry.plates?.[weight]
            ) || 0;

    });


    renderPlates();
    updateVisualBar();
    updateMainDisplay();


    showToast(
        "Configuración del historial aplicada.",
        "success"
    );

}


function deleteHistory(index) {

    if (!state.history[index]) {
        return;
    }


    state.history.splice(
        index,
        1
    );


    localStorage.setItem(
        "powerload_history",
        JSON.stringify(state.history)
    );


    renderHistory();


    showToast(
        "Registro eliminado.",
        "info"
    );

}


function clearHistory() {

    if (state.history.length === 0) {
        return;
    }


    state.history = [];


    localStorage.removeItem(
        "powerload_history"
    );


    renderHistory();


    showToast(
        "Historial eliminado.",
        "info"
    );

}


/* ==========================================================
   EVENTOS — DISCOS
========================================================== */

function setupPlateEvents() {

    if (!elements.platesContainer) {
        return;
    }


    elements.platesContainer.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest("button");


            if (!button) {
                return;
            }


            const weight =
                Number(
                    button.dataset.weight
                );


            if (!Number.isFinite(weight)) {
                return;
            }


            const action =
                button.dataset.action;


            if (action === "increase") {

                changePlate(
                    weight,
                    1
                );

            }


            if (action === "decrease") {

                changePlate(
                    weight,
                    -1
                );

            }

        }
    );

}


/* ==========================================================
   EVENTOS — FAVORITOS
========================================================== */

function setupFavoriteEvents() {

    if (!elements.favoritesContainer) {
        return;
    }


    elements.favoritesContainer.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest("button");


            if (!button) {
                return;
            }


            const index =
                Number(
                    button.dataset.index
                );


            if (!Number.isInteger(index)) {
                return;
            }


            if (
                button.dataset.action ===
                "load"
            ) {

                loadFavorite(index);

            }


            if (
                button.dataset.action ===
                "delete"
            ) {

                deleteFavorite(index);

            }

        }
    );

}


/* ==========================================================
   EVENTOS — HISTORIAL
========================================================== */

function setupHistoryEvents() {

    if (!elements.historyContainer) {
        return;
    }


    elements.historyContainer.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest("button");


            if (!button) {
                return;
            }


            const index =
                Number(
                    button.dataset.index
                );


            if (!Number.isInteger(index)) {
                return;
            }


            if (
                button.dataset.action ===
                "load"
            ) {

                loadHistory(index);

            }


            if (
                button.dataset.action ===
                "delete"
            ) {

                deleteHistory(index);

            }

        }
    );

}


/* ==========================================================
   EVENTOS GENERALES
========================================================== */

function setupEvents() {

    elements.themeButton?.addEventListener(
        "click",
        toggleTheme
    );


    elements.kgButton?.addEventListener(
        "click",
        () => changeUnit("kg")
    );


    elements.lbButton?.addEventListener(
        "click",
        () => changeUnit("lb")
    );


    elements.clearPlates?.addEventListener(
        "click",
        clearPlates
    );


    elements.barWeight?.addEventListener(
        "change",
        () => {

            state.barWeight =
                getBarWeight();

            updateMainDisplay();
            updateVisualBar();

        }
    );


    elements.calculateTarget?.addEventListener(
        "click",
        findTarget
    );


    elements.applyTarget?.addEventListener(
        "click",
        applyTargetConfiguration
    );


    elements.saveCurrentButton?.addEventListener(
        "click",
        saveCurrentFavorite
    );


    elements.clearFavorites?.addEventListener(
        "click",
        clearFavorites
    );


    elements.clearHistory?.addEventListener(
        "click",
        clearHistory
    );


    elements.oneRm?.addEventListener(
        "input",
        calculateOneRM
    );


    elements.percentage?.addEventListener(
        "change",
        calculateOneRM
    );


    elements.sendRmToTarget?.addEventListener(
        "click",
        sendRmToTarget
    );


    elements.estimateWeight?.addEventListener(
        "input",
        calculateEstimatedOneRM
    );


    elements.estimateReps?.addEventListener(
        "input",
        calculateEstimatedOneRM
    );


    elements.sendEstimatedToTarget?.addEventListener(
        "click",
        sendEstimatedToTarget
    );


    /*
     * Enter en el objetivo.
     */
    elements.targetWeight?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                findTarget();

            }

        }
    );


    /*
     * Enter en el 1RM.
     */
    elements.oneRm?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                calculateOneRM();

            }

        }
    );


    /*
     * Enter en el estimador.
     */
    elements.estimateReps?.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                calculateEstimatedOneRM();

            }

        }
    );


    setupPlateEvents();
    setupFavoriteEvents();
    setupHistoryEvents();

}


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

function initialize() {

    /*
     * Tema.
     */
    applyTheme();


    /*
     * Unidad.
     */
    updateUnitButtons();
    updateUnitLabels();


    /*
     * Barra.
     */
    state.barWeight =
        getBarWeight();


    /*
     * Discos.
     */
    renderPlates();


    /*
     * Visual.
     */
    updateVisualBar();


    /*
     * Hero.
     */
    updateMainDisplay();


    /*
     * Objetivos rápidos.
     */
    updateQuickTargets();


    /*
     * 1RM.
     */
    calculateOneRM();


    /*
     * Estimador.
     */
    calculateEstimatedOneRM();


    /*
     * Favoritos e historial.
     */
    renderFavorites();
    renderHistory();


    /*
     * Eventos.
     */
    setupEvents();

}


/* ==========================================================
   ARRANQUE
========================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();

}