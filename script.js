/* ==========================================================
   POWERLOAD v6
   Calculadora de discos para Powerlifting
   - KG / LB
   - Configuración de discos por lado
   - Visualización de barra
   - Búsqueda de combinación para un objetivo
   - Calculadora de 1RM
   - Estimador de 1RM por repeticiones
   - Favoritos
   - Historial
   - Tema claro / oscuro
   - Sin inventario: no se limita la búsqueda por disponibilidad física
========================================================== */

"use strict";

/* ==========================================================
   CONFIGURACIÓN
========================================================== */

const STORAGE_KEYS = {
    theme: "powerload_theme",
    unit: "powerload_unit",
    favorites: "powerload_favorites",
    history: "powerload_history"
};

const LB_TO_KG = 0.45359237;
const KG_TO_LB = 1 / LB_TO_KG;

/*
    Discos disponibles para calcular combinaciones.

    Importante:
    NO representan inventario físico.
    El calculador puede utilizar cualquier cantidad de estos discos.
*/
const PLATES_KG = [
    25,
    20,
    15,
    10,
    5,
    2.5,
    1.25,
    0.5
];

/*
    Para la visualización solamente usamos los tamaños
    que tienen representación gráfica en el CSS.
*/
const VISUAL_PLATES = [
    45,
    25,
    10,
    5,
    2.5
];

/*
    Pesos internos de barra.
    El value del HTML está expresado en LB.
*/
const BAR_OPTIONS = [
    {
        lb: 45,
        kg: 20.41,
        label: "45 lb"
    },
    {
        lb: 55,
        kg: 24.95,
        label: "55 lb"
    },
    {
        lb: 35,
        kg: 15.88,
        label: "35 lb"
    },
    {
        lb: 44.0924,
        kg: 20,
        label: "20 kg"
    },
    {
        lb: 33.0693,
        kg: 15,
        label: "15 kg"
    },
    {
        lb: 0,
        kg: 0,
        label: "Sin barra"
    }
];

const QUICK_TARGETS_KG = [
    60,
    80,
    100,
    120,
    140,
    160
];

const RM_PERCENTAGES = [
    0.50,
    0.55,
    0.60,
    0.65,
    0.70,
    0.75,
    0.775,
    0.80,
    0.825,
    0.85,
    0.875,
    0.90,
    0.925,
    0.95,
    1
];


/* ==========================================================
   ESTADO
========================================================== */

const state = {
    unit: "kg",
    theme: "dark",

    barKg: 20.41,

    plates: {
        25: 0,
        20: 0,
        15: 0,
        10: 0,
        5: 0,
        2.5: 0,
        1.25: 0,
        0.5: 0
    },

    formula: "epley",

    targetCombination: null,

    favorites: [],

    history: []
};


/* ==========================================================
   HELPERS DOM
========================================================== */

const $ = (id) => document.getElementById(id);

const elements = {
    body: document.body,

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

    leftVisual: $("leftVisual"),
    rightVisual: $("rightVisual"),

    visualPlateCount: $("visualPlateCount"),
    visualTotal: $("visualTotal"),

    clearPlates: $("clearPlates"),

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
    estimateReps: $("estimateReps"),
    estimateUnit: $("estimateUnit"),
    estimatedOneRm: $("estimatedOneRm"),
    sendEstimatedToTarget: $("sendEstimatedToTarget"),

    favoritesContainer: $("favoritesContainer"),
    clearFavorites: $("clearFavorites"),

    historyContainer: $("historyContainer"),
    clearHistory: $("clearHistory"),

    toastContainer: $("toastContainer")
};


/* ==========================================================
   FORMATO DE PESO
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


function kgToLb(kg) {
    return kg * KG_TO_LB;
}


function lbToKg(lb) {
    return lb * LB_TO_KG;
}


function displayWeight(kg, decimals = 2) {
    const value = state.unit === "kg"
        ? kg
        : kgToLb(kg);

    return `${formatNumber(value, decimals)} ${state.unit}`;
}


function displayWeightValue(kg, decimals = 2) {
    const value = state.unit === "kg"
        ? kg
        : kgToLb(kg);

    return formatNumber(value, decimals);
}


/* ==========================================================
   LOCAL STORAGE
========================================================== */

function loadStorage() {
    try {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

        if (savedTheme === "light" || savedTheme === "dark") {
            state.theme = savedTheme;
        }

        const savedUnit = localStorage.getItem(STORAGE_KEYS.unit);

        if (savedUnit === "kg" || savedUnit === "lb") {
            state.unit = savedUnit;
        }

        const favorites = localStorage.getItem(STORAGE_KEYS.favorites);

        if (favorites) {
            const parsed = JSON.parse(favorites);

            if (Array.isArray(parsed)) {
                state.favorites = parsed;
            }
        }

        const history = localStorage.getItem(STORAGE_KEYS.history);

        if (history) {
            const parsed = JSON.parse(history);

            if (Array.isArray(parsed)) {
                state.history = parsed;
            }
        }

    } catch (error) {
        console.warn("No fue posible cargar los datos guardados.", error);
    }
}


function saveStorage() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.theme,
            state.theme
        );

        localStorage.setItem(
            STORAGE_KEYS.unit,
            state.unit
        );

        localStorage.setItem(
            STORAGE_KEYS.favorites,
            JSON.stringify(state.favorites)
        );

        localStorage.setItem(
            STORAGE_KEYS.history,
            JSON.stringify(state.history)
        );

    } catch (error) {
        console.warn("No fue posible guardar los datos.", error);
    }
}


/* ==========================================================
   TEMA
========================================================== */

function applyTheme() {
    if (state.theme === "light") {
        elements.body.classList.add("light");
        elements.themeButton.textContent = "☀";
        elements.themeButton.setAttribute(
            "aria-label",
            "Cambiar a tema oscuro"
        );
        elements.themeButton.setAttribute(
            "title",
            "Cambiar a tema oscuro"
        );
    } else {
        elements.body.classList.remove("light");
        elements.themeButton.textContent = "☾";
        elements.themeButton.setAttribute(
            "aria-label",
            "Cambiar a tema claro"
        );
        elements.themeButton.setAttribute(
            "title",
            "Cambiar a tema claro"
        );
    }
}


function toggleTheme() {
    state.theme = state.theme === "dark"
        ? "light"
        : "dark";

    applyTheme();
    saveStorage();
}


/* ==========================================================
   UNIDADES
========================================================== */

function updateUnitButtons() {
    elements.kgButton.classList.toggle(
        "active",
        state.unit === "kg"
    );

    elements.lbButton.classList.toggle(
        "active",
        state.unit === "lb"
    );
}


function updateUnitsUI() {
    elements.mainUnit.textContent = state.unit;
    elements.targetUnit.textContent = state.unit;
    elements.oneRmUnit.textContent = state.unit;
    elements.estimateUnit.textContent = state.unit;

    updateUnitButtons();

    updateMainWeight();
    updateBarStats();
    updatePercentageTable();
    updateRMResult();
    updateEstimatedRM();
    renderQuickTargets();
}


function setUnit(unit) {
    if (unit !== "kg" && unit !== "lb") {
        return;
    }

    state.unit = unit;

    updateUnitsUI();
    saveStorage();
}


/* ==========================================================
   BARRA
========================================================== */

function getBarKg() {
    return Number(state.barKg) || 0;
}


function getPlatesPerSideKg() {
    let total = 0;

    Object.entries(state.plates).forEach(
        ([weight, quantity]) => {
            total +=
                Number(weight) *
                Number(quantity || 0);
        }
    );

    return total;
}


function getTotalPlatesKg() {
    return getPlatesPerSideKg() * 2;
}


function getTotalWeightKg() {
    return getBarKg() + getTotalPlatesKg();
}


function getPlateCountPerSide() {
    return Object.values(state.plates).reduce(
        (sum, quantity) => sum + Number(quantity || 0),
        0
    );
}


function getPlateList() {
    const list = [];

    Object.entries(state.plates)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .forEach(([weight, quantity]) => {

            for (let i = 0; i < Number(quantity || 0); i++) {
                list.push(Number(weight));
            }

        });

    return list;
}


function updateMainWeight() {
    elements.mainWeight.textContent =
        displayWeightValue(getTotalWeightKg(), 2);

    elements.mainUnit.textContent =
        state.unit;

    elements.secondaryWeight.textContent =
        state.unit === "kg"
            ? `${formatNumber(kgToLb(getTotalWeightKg()), 2)} lb`
            : `${formatNumber(getTotalWeightKg(), 2)} kg`;
}


function updateBarStats() {
    const sideKg = getPlatesPerSideKg();
    const platesKg = getTotalPlatesKg();
    const totalKg = getTotalWeightKg();
    const barKg = getBarKg();

    elements.sideWeight.textContent =
        displayWeight(sideKg);

    elements.platesWeight.textContent =
        displayWeight(platesKg);

    elements.barDisplay.textContent =
        displayWeight(barKg);

    elements.visualPlateCount.textContent =
        getPlateCountPerSide();

    elements.visualTotal.textContent =
        displayWeight(totalKg);
}


function updateAllBarUI() {
    updateMainWeight();
    updateBarStats();
    renderVisualBar();
}


/* ==========================================================
   SELECTOR DE BARRA
========================================================== */

function updateBarFromSelect() {
    const value = Number(elements.barWeight.value);

    const option = BAR_OPTIONS.find(
        item => Math.abs(item.lb - value) < 0.0001
    );

    if (!option) {
        return;
    }

    state.barKg = option.kg;

    updateAllBarUI();
}


/* ==========================================================
   DISCO SELECTOR
========================================================== */

function plateClass(weight) {
    return String(weight)
        .replace(".", "-");
}


function plateColorClass(weight) {
    return `plate-${plateClass(weight)}`;
}


function renderPlates() {
    elements.platesContainer.innerHTML = "";

    PLATES_KG.forEach(weight => {

        const quantity =
            Number(state.plates[weight] || 0);

        const row =
            document.createElement("div");

        row.className = "plate-row";

        if (quantity > 0) {
            row.classList.add("has-plates");
        }

        const info =
            document.createElement("div");

        info.className = "plate-info";

        const circle =
            document.createElement("div");

        circle.className =
            `plate-circle ${plateColorClass(weight)}`;

        circle.textContent =
            formatNumber(weight);

        const text =
            document.createElement("div");

        const strong =
            document.createElement("strong");

        strong.textContent =
            `${formatNumber(weight)} kg`;

        const small =
            document.createElement("small");

        small.textContent =
            `${formatNumber(weight * KG_TO_LB, 2)} lb`;

        const limit =
            document.createElement("span");

        limit.className = "plate-limit";

        limit.textContent =
            "Por lado";

        text.appendChild(strong);
        text.appendChild(small);
        text.appendChild(limit);

        info.appendChild(circle);
        info.appendChild(text);

        const counter =
            document.createElement("div");

        counter.className = "counter";

        const minus =
            document.createElement("button");

        minus.type = "button";
        minus.textContent = "−";
        minus.setAttribute(
            "aria-label",
            `Quitar disco de ${weight} kg`
        );

        const count =
            document.createElement("span");

        count.textContent = quantity;

        const plus =
            document.createElement("button");

        plus.type = "button";
        plus.textContent = "+";
        plus.setAttribute(
            "aria-label",
            `Agregar disco de ${weight} kg`
        );

        minus.disabled = quantity <= 0;

        minus.addEventListener(
            "click",
            () => {
                changePlate(weight, -1);
            }
        );

        plus.addEventListener(
            "click",
            () => {
                changePlate(weight, 1);
            }
        );

        counter.appendChild(minus);
        counter.appendChild(count);
        counter.appendChild(plus);

        row.appendChild(info);
        row.appendChild(counter);

        elements.platesContainer.appendChild(row);
    });
}


function changePlate(weight, amount) {
    if (!state.plates.hasOwnProperty(weight)) {
        return;
    }

    const current =
        Number(state.plates[weight] || 0);

    const next =
        Math.max(0, current + amount);

    state.plates[weight] = next;

    renderPlates();
    updateAllBarUI();
}


function clearPlates() {
    Object.keys(state.plates).forEach(weight => {
        state.plates[weight] = 0;
    });

    renderPlates();
    updateAllBarUI();

    showToast(
        "Configuración de discos limpiada.",
        "info"
    );
}


/* ==========================================================
   VISUALIZACIÓN DE LA BARRA
========================================================== */

function createVisualPlate(weight) {
    const plate =
        document.createElement("div");

    plate.className =
        `visual-plate visual-${plateClass(weight)}`;

    plate.textContent =
        formatNumber(weight);

    plate.title =
        `${formatNumber(weight)} kg`;

    return plate;
}


function renderVisualStack(container, plates) {
    container.innerHTML = "";

    /*
        La visualización utiliza los discos reales seleccionados.
        Los discos de 1.25 y 0.5 kg no tienen tamaño propio
        en el CSS original, así que se representan con una
        pequeña placa compatible.
    */

    plates.forEach(weight => {

        let visualWeight = weight;

        if (!VISUAL_PLATES.includes(weight)) {
            visualWeight = 2.5;
        }

        const plate =
            createVisualPlate(visualWeight);

        if (!VISUAL_PLATES.includes(weight)) {
            plate.textContent = formatNumber(weight);
            plate.style.height = "45px";
            plate.style.minWidth = "9px";
            plate.style.width = "9px";
            plate.style.fontSize = "4px";
        }

        container.appendChild(plate);
    });
}


function renderVisualBar() {
    const plates =
        getPlateList();

    /*
        Para que ambas caras tengan exactamente
        la misma configuración.
    */

    renderVisualStack(
        elements.leftVisual,
        [...plates]
    );

    renderVisualStack(
        elements.rightVisual,
        [...plates]
    );
}


/* ==========================================================
   COMBINACIONES DE DISCOS
========================================================== */

/*
    Busca una combinación exacta o la más cercana.

    IMPORTANTE:
    No consulta inventario.

    Se permite utilizar cualquier cantidad de discos
    disponibles en PLATES_KG.

    El objetivo se busca por LADO.
*/

function findBestCombination(targetPerSideKg) {

    const target =
        round(targetPerSideKg, 2);

    if (target <= 0) {
        return null;
    }

    /*
        Escalamos a décimas para evitar problemas
        de precisión con números decimales.
    */

    const SCALE = 100;

    const targetInt =
        Math.round(target * SCALE);

    const plateInts =
        PLATES_KG.map(weight => ({
            weight,
            value: Math.round(weight * SCALE)
        }))
        .sort((a, b) => b.value - a.value);

    /*
        DP:
        dp[valor] = combinación con menor cantidad
        de discos para alcanzar ese valor.
    */

    const dp = new Array(targetInt + 1);

    dp[0] = [];

    for (let current = 0; current <= targetInt; current++) {

        if (!dp[current]) {
            continue;
        }

        for (const plate of plateInts) {

            const next =
                current + plate.value;

            if (next > targetInt) {
                continue;
            }

            const candidate =
                [...dp[current], plate.weight];

            if (
                !dp[next] ||
                candidate.length < dp[next].length
            ) {
                dp[next] = candidate;
            }
        }
    }

    if (dp[targetInt]) {

        return {
            exact: true,
            perSide: target,
            actualPerSide: target,
            difference: 0,
            plates: normalizeCombination(
                dp[targetInt]
            )
        };
    }

    /*
        Si no existe una combinación exacta,
        buscamos la más cercana.

        Permitimos una diferencia máxima
        de 1 kg por lado.
    */

    let best = null;

    const MAX_DIFFERENCE =
        Math.round(1 * SCALE);

    for (
        let difference = 1;
        difference <= MAX_DIFFERENCE;
        difference++
    ) {

        const lower =
            targetInt - difference;

        const upper =
            targetInt + difference;

        const candidates = [];

        if (
            lower >= 0 &&
            dp[lower]
        ) {
            candidates.push({
                value: lower,
                plates: dp[lower]
            });
        }

        /*
            Para valores superiores al objetivo,
            necesitamos calcularlos de forma separada.
        */

        const upperCombination =
            findCombinationUpTo(
                upper,
                plateInts
            );

        if (upperCombination) {
            candidates.push({
                value: upper,
                plates: upperCombination
            });
        }

        if (candidates.length > 0) {

            candidates.sort(
                (a, b) => {

                    const diffA =
                        Math.abs(targetInt - a.value);

                    const diffB =
                        Math.abs(targetInt - b.value);

                    if (diffA !== diffB) {
                        return diffA - diffB;
                    }

                    return (
                        a.plates.length -
                        b.plates.length
                    );
                }
            );

            const winner =
                candidates[0];

            const actual =
                winner.value / SCALE;

            return {
                exact: false,
                perSide: target,
                actualPerSide: actual,
                difference: round(
                    actual - target,
                    2
                ),
                plates: normalizeCombination(
                    winner.plates
                )
            };
        }
    }

    return null;
}


function findCombinationUpTo(targetInt, plateInts) {

    const dp =
        new Array(targetInt + 1);

    dp[0] = [];

    for (
        let current = 0;
        current <= targetInt;
        current++
    ) {

        if (!dp[current]) {
            continue;
        }

        for (const plate of plateInts) {

            const next =
                current + plate.value;

            if (next > targetInt) {
                continue;
            }

            const candidate =
                [...dp[current], plate.weight];

            if (
                !dp[next] ||
                candidate.length < dp[next].length
            ) {
                dp[next] = candidate;
            }
        }
    }

    /*
        Busca el valor más cercano al objetivo.
    */

    for (
        let value = targetInt;
        value >= 0;
        value--
    ) {
        if (dp[value]) {
            return dp[value];
        }
    }

    return null;
}


function normalizeCombination(plates) {

    const result = {};

    PLATES_KG.forEach(weight => {
        result[weight] = 0;
    });

    plates.forEach(weight => {

        if (result.hasOwnProperty(weight)) {
            result[weight]++;
        }

    });

    return result;
}


function combinationTotal(combination) {

    return Object.entries(combination)
        .reduce(
            (total, [weight, quantity]) => {
                return total +
                    Number(weight) *
                    Number(quantity || 0);
            },
            0
        );
}


function combinationToArray(combination) {

    const array = [];

    Object.entries(combination)
        .sort(
            (a, b) =>
                Number(b[0]) - Number(a[0])
        )
        .forEach(([weight, quantity]) => {

            for (
                let i = 0;
                i < Number(quantity || 0);
                i++
            ) {
                array.push(Number(weight));
            }

        });

    return array;
}


/* ==========================================================
   OBJETIVO
========================================================== */

function getTargetKg() {

    const value =
        Number(elements.targetWeight.value);

    if (!Number.isFinite(value) || value <= 0) {
        return null;
    }

    return state.unit === "kg"
        ? value
        : lbToKg(value);
}


function calculateTarget() {

    const targetKg =
        getTargetKg();

    if (targetKg === null) {

        showToast(
            "Ingresa un peso objetivo válido.",
            "error"
        );

        return;
    }

    const barKg =
        getBarKg();

    const platesNeededKg =
        targetKg - barKg;

    if (platesNeededKg < 0) {

        showToast(
            "El objetivo es menor que el peso de la barra.",
            "warning"
        );

        showTargetUnavailable(
            targetKg,
            "El objetivo es menor que la barra."
        );

        return;
    }

    /*
        El peso que deben aportar los discos
        se divide entre ambos lados.
    */

    const perSide =
        platesNeededKg / 2;

    const combination =
        findBestCombination(perSide);

    if (!combination) {

        showTargetUnavailable(
            targetKg,
            "No se encontró una combinación válida."
        );

        return;
    }

    state.targetCombination = {
        targetKg,
        barKg,
        combination,
        perSideTarget: perSide,
        perSideActual: combination.actualPerSide
    };

    renderTargetResult();
}


function showTargetUnavailable(targetKg, reason) {

    elements.targetResult.classList.remove("hidden");

    elements.targetResultTitle.textContent =
        "Sin combinación";

    elements.targetAccuracy.textContent =
        "NO DISPONIBLE";

    elements.targetAccuracy.className =
        "accuracy unavailable";

    elements.targetCombination.innerHTML = "";

    const message =
        document.createElement("div");

    message.className = "plate-chip";

    message.textContent = reason;

    elements.targetCombination.appendChild(message);

    elements.targetRequested.textContent =
        displayWeight(targetKg);

    elements.targetReal.textContent =
        "-";

    elements.targetDifference.textContent =
        "-";

    elements.applyTarget.disabled = true;

    elements.applyTarget.style.opacity = ".4";

    state.targetCombination = null;
}


function renderTargetResult() {

    const result =
        state.targetCombination;

    if (!result) {
        return;
    }

    elements.targetResult.classList.remove("hidden");

    const combination =
        result.combination;

    const actualTotal =
        result.barKg +
        combination.actualPerSide * 2;

    const difference =
        actualTotal -
        result.targetKg;

    elements.targetResultTitle.textContent =
        result.combination.exact
            ? "Combinación exacta"
            : "Combinación más cercana";

    if (result.combination.exact) {

        elements.targetAccuracy.textContent =
            "EXACTO";

        elements.targetAccuracy.className =
            "accuracy exact";

    } else {

        elements.targetAccuracy.textContent =
            "CERCANO";

        elements.targetAccuracy.className =
            "accuracy close";
    }

    renderCombinationChips(
        combination.plates
    );

    elements.targetRequested.textContent =
        displayWeight(result.targetKg);

    elements.targetReal.textContent =
        displayWeight(actualTotal);

    const differenceText =
        difference === 0
            ? "0"
            : `${difference > 0 ? "+" : ""}${displayWeight(
                Math.abs(difference)
            )}`;

    elements.targetDifference.textContent =
        difference === 0
            ? "0"
            : `${difference > 0 ? "+" : "-"}${displayWeight(
                Math.abs(difference)
            )}`;

    elements.applyTarget.disabled = false;
    elements.applyTarget.style.opacity = "1";
}


function renderCombinationChips(combination) {

    elements.targetCombination.innerHTML = "";

    const array =
        combinationToArray(combination);

    if (array.length === 0) {

        const chip =
            document.createElement("div");

        chip.className = "plate-chip";

        chip.textContent =
            "Sin discos";

        elements.targetCombination.appendChild(chip);

        return;
    }

    array.forEach(weight => {

        const chip =
            document.createElement("div");

        chip.className = "plate-chip";

        chip.textContent =
            `${formatNumber(weight)} kg`;

        elements.targetCombination.appendChild(chip);
    });
}


function applyTarget() {

    const result =
        state.targetCombination;

    if (!result) {
        return;
    }

    state.plates =
        normalizeCombination(
            combinationToArray(
                result.combination.plates
            )
        );

    renderPlates();
    updateAllBarUI();

    addHistory({
        weightKg: getTotalWeightKg(),
        barKg: getBarKg(),
        plates: { ...state.plates }
    });

    showToast(
        "Configuración aplicada.",
        "success"
    );

    document
        .querySelector(".bar-card")
        ?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
}


/* ==========================================================
   OBJETIVOS RÁPIDOS
========================================================== */

function renderQuickTargets() {

    elements.quickTargets.innerHTML = "";

    QUICK_TARGETS_KG.forEach(targetKg => {

        const button =
            document.createElement("button");

        button.type = "button";

        const display =
            state.unit === "kg"
                ? `${formatNumber(targetKg)} kg`
                : `${formatNumber(
                    kgToLb(targetKg),
                    1
                )} lb`;

        button.textContent = display;

        button.addEventListener(
            "click",
            () => {

                elements.targetWeight.value =
                    state.unit === "kg"
                        ? formatNumber(targetKg)
                        : formatNumber(
                            kgToLb(targetKg),
                            1
                        );

                calculateTarget();
            }
        );

        elements.quickTargets.appendChild(button);
    });
}


/* ==========================================================
   1RM
========================================================== */

function calculateOneRM() {

    const weightInput =
        Number(elements.oneRm.value);

    const percentage =
        Number(elements.percentage.value);

    if (
        !Number.isFinite(weightInput) ||
        weightInput <= 0
    ) {
        return 0;
    }

    if (
        !Number.isFinite(percentage) ||
        percentage <= 0
    ) {
        return 0;
    }

    const weightKg =
        state.unit === "kg"
            ? weightInput
            : lbToKg(weightInput);

    return weightKg * percentage;
}


function calculateFormulaOneRM(weightKg, reps) {

    if (
        !Number.isFinite(weightKg) ||
        weightKg <= 0 ||
        !Number.isFinite(reps) ||
        reps <= 0
    ) {
        return 0;
    }

    if (reps === 1) {
        return weightKg;
    }

    switch (state.formula) {

        case "brzycki":

            /*
                1RM = peso × 36 / (37 - repeticiones)
            */

            if (reps >= 37) {
                return 0;
            }

            return (
                weightKg *
                36 /
                (37 - reps)
            );


        case "lombardi":

            /*
                1RM = peso × repeticiones^0.10
            */

            return (
                weightKg *
                Math.pow(reps, 0.10)
            );


        case "epley":
        default:

            /*
                1RM = peso × (1 + reps / 30)
            */

            return (
                weightKg *
                (1 + reps / 30)
            );
    }
}


function updateRMResult() {

    const rmKg =
        calculateOneRM();

    elements.rmResult.textContent =
        displayWeight(rmKg);
}


function setFormula(formula) {

    if (
        !["epley", "brzycki", "lombardi"]
            .includes(formula)
    ) {
        return;
    }

    state.formula = formula;

    document
        .querySelectorAll(".formula-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.formula === formula
            );

        });

    updateRMResult();
    updatePercentageTable();
}


function updatePercentageTable() {

    elements.percentageGrid.innerHTML = "";

    const oneRmInput =
        Number(elements.oneRm.value);

    let oneRmKg = 0;

    if (
        Number.isFinite(oneRmInput) &&
        oneRmInput > 0
    ) {
        oneRmKg =
            state.unit === "kg"
                ? oneRmInput
                : lbToKg(oneRmInput);
    }

    RM_PERCENTAGES.forEach(percentage => {

        const cell =
            document.createElement("div");

        cell.className =
            "percentage-cell";

        const span =
            document.createElement("span");

        span.textContent =
            `${formatNumber(percentage * 100, 1)}%`;

        const strong =
            document.createElement("strong");

        const value =
            oneRmKg > 0
                ? oneRmKg * percentage
                : 0;

        strong.textContent =
            displayWeight(value);

        cell.appendChild(span);
        cell.appendChild(strong);

        cell.addEventListener(
            "click",
            () => {

                elements.percentage.value =
                    String(percentage);

                updateRMResult();

                document
                    .querySelectorAll(
                        ".percentage-cell"
                    )
                    .forEach(item => {
                        item.classList.remove("active");
                    });

                cell.classList.add("active");
            }
        );

        elements.percentageGrid.appendChild(cell);
    });
}


function sendRMToTarget() {

    const rmKg =
        calculateOneRM();

    if (rmKg <= 0) {

        showToast(
            "Primero ingresa un 1RM válido.",
            "warning"
        );

        return;
    }

    elements.targetWeight.value =
        state.unit === "kg"
            ? formatNumber(rmKg)
            : formatNumber(
                kgToLb(rmKg),
                1
            );

    calculateTarget();

    elements.targetWeight.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    elements.targetWeight.focus();
}


/* ==========================================================
   ESTIMADOR DE 1RM
========================================================== */

function calculateEstimatedRM() {

    const weightInput =
        Number(elements.estimateWeight.value);

    const reps =
        Number(elements.estimateReps.value);

    if (
        !Number.isFinite(weightInput) ||
        weightInput <= 0
    ) {
        return 0;
    }

    if (
        !Number.isFinite(reps) ||
        reps < 1 ||
        reps > 30
    ) {
        return 0;
    }

    const weightKg =
        state.unit === "kg"
            ? weightInput
            : lbToKg(weightInput);

    return calculateFormulaOneRM(
        weightKg,
        reps
    );
}


function updateEstimatedRM() {

    const estimated =
        calculateEstimatedRM();

    elements.estimatedOneRm.textContent =
        displayWeight(estimated);
}


function sendEstimatedToTarget() {

    const estimated =
        calculateEstimatedRM();

    if (estimated <= 0) {

        showToast(
            "Ingresa un peso y número de repeticiones válidos.",
            "warning"
        );

        return;
    }

    elements.targetWeight.value =
        state.unit === "kg"
            ? formatNumber(estimated)
            : formatNumber(
                kgToLb(estimated),
                1
            );

    calculateTarget();

    elements.targetWeight.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    elements.targetWeight.focus();
}


/* ==========================================================
   FAVORITOS
========================================================== */

function getCurrentConfiguration() {

    return {
        weightKg: getTotalWeightKg(),
        barKg: getBarKg(),
        plates: { ...state.plates },
        createdAt: new Date().toISOString()
    };
}


function saveCurrentFavorite() {

    const configuration =
        getCurrentConfiguration();

    if (configuration.weightKg <= 0) {

        showToast(
            "No hay una configuración para guardar.",
            "warning"
        );

        return;
    }

    const favorite = {
        id: Date.now(),
        ...configuration
    };

    state.favorites.unshift(favorite);

    /*
        Máximo 20 favoritos.
    */

    state.favorites =
        state.favorites.slice(0, 20);

    saveStorage();
    renderFavorites();

    showToast(
        "Configuración guardada en favoritos.",
        "success"
    );
}


function renderFavorites() {

    elements.favoritesContainer.innerHTML = "";

    if (state.favorites.length === 0) {

        const empty =
            document.createElement("div");

        empty.className = "empty";

        empty.textContent =
            "Todavía no tienes cargas guardadas.";

        elements.favoritesContainer.appendChild(empty);

        return;
    }

    state.favorites.forEach(favorite => {

        const item =
            document.createElement("div");

        item.className = "favorite-item";

        const information =
            document.createElement("div");

        const weight =
            document.createElement("div");

        weight.className = "item-weight";

        weight.textContent =
            displayWeight(
                Number(favorite.weightKg)
            );

        const detail =
            document.createElement("div");

        detail.className = "item-detail";

        detail.textContent =
            getPlateDescription(
                favorite.plates
            );

        information.appendChild(weight);
        information.appendChild(detail);

        const actions =
            document.createElement("div");

        actions.className = "item-actions";

        const useButton =
            document.createElement("button");

        useButton.type = "button";
        useButton.textContent = "Usar";

        useButton.addEventListener(
            "click",
            () => {

                loadConfiguration(
                    favorite
                );

                showToast(
                    "Favorito aplicado.",
                    "success"
                );
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "Eliminar";
        deleteButton.className = "delete";

        deleteButton.addEventListener(
            "click",
            () => {

                deleteFavorite(
                    favorite.id
                );
            }
        );

        actions.appendChild(useButton);
        actions.appendChild(deleteButton);

        item.appendChild(information);
        item.appendChild(actions);

        elements.favoritesContainer.appendChild(item);
    });
}


function deleteFavorite(id) {

    state.favorites =
        state.favorites.filter(
            item => item.id !== id
        );

    saveStorage();
    renderFavorites();

    showToast(
        "Favorito eliminado.",
        "info"
    );
}


function clearFavorites() {

    if (state.favorites.length === 0) {
        return;
    }

    state.favorites = [];

    saveStorage();
    renderFavorites();

    showToast(
        "Favoritos eliminados.",
        "info"
    );
}


/* ==========================================================
   HISTORIAL
========================================================== */

function addHistory(configuration) {

    const item = {
        id: Date.now(),
        ...configuration,
        createdAt: new Date().toISOString()
    };

    state.history.unshift(item);

    /*
        Guardamos solamente las últimas 20
        configuraciones.
    */

    state.history =
        state.history.slice(0, 20);

    saveStorage();
    renderHistory();
}


function renderHistory() {

    elements.historyContainer.innerHTML = "";

    if (state.history.length === 0) {

        const empty =
            document.createElement("div");

        empty.className = "empty";

        empty.textContent =
            "Todavía no hay configuraciones en el historial.";

        elements.historyContainer.appendChild(empty);

        return;
    }

    state.history.forEach(item => {

        const historyItem =
            document.createElement("div");

        historyItem.className =
            "history-item";

        const information =
            document.createElement("div");

        const weight =
            document.createElement("div");

        weight.className = "item-weight";

        weight.textContent =
            displayWeight(
                Number(item.weightKg)
            );

        const detail =
            document.createElement("div");

        detail.className = "item-detail";

        detail.textContent =
            getPlateDescription(
                item.plates
            );

        information.appendChild(weight);
        information.appendChild(detail);

        const actions =
            document.createElement("div");

        actions.className =
            "item-actions";

        const useButton =
            document.createElement("button");

        useButton.type = "button";
        useButton.textContent = "Usar";

        useButton.addEventListener(
            "click",
            () => {

                loadConfiguration(item);

                showToast(
                    "Configuración del historial aplicada.",
                    "success"
                );
            }
        );

        actions.appendChild(useButton);

        historyItem.appendChild(information);
        historyItem.appendChild(actions);

        elements.historyContainer.appendChild(
            historyItem
        );
    });
}


function clearHistory() {

    if (state.history.length === 0) {
        return;
    }

    state.history = [];

    saveStorage();
    renderHistory();

    showToast(
        "Historial eliminado.",
        "info"
    );
}


/* ==========================================================
   CARGAR CONFIGURACIÓN
========================================================== */

function loadConfiguration(configuration) {

    if (!configuration) {
        return;
    }

    if (Number.isFinite(Number(configuration.barKg))) {
        state.barKg =
            Number(configuration.barKg);
    }

    Object.keys(state.plates).forEach(weight => {

        state.plates[weight] =
            Number(
                configuration.plates?.[weight] || 0
            );
    });

    syncBarSelect();

    renderPlates();
    updateAllBarUI();
}


function syncBarSelect() {

    const target =
        BAR_OPTIONS.find(
            option =>
                Math.abs(
                    option.kg - state.barKg
                ) < 0.02
        );

    if (target) {
        elements.barWeight.value =
            String(target.lb);
    }
}


/* ==========================================================
   DESCRIPCIÓN DE CONFIGURACIÓN
========================================================== */

function getPlateDescription(plates) {

    if (!plates) {
        return "Sin discos";
    }

    const parts = [];

    Object.entries(plates)
        .sort(
            (a, b) =>
                Number(b[0]) - Number(a[0])
        )
        .forEach(([weight, quantity]) => {

            const amount =
                Number(quantity || 0);

            if (amount > 0) {

                parts.push(
                    `${amount}×${formatNumber(weight)} kg`
                );
            }
        });

    if (parts.length === 0) {
        return "Sin discos";
    }

    return parts.join(" · ");
}


/* ==========================================================
   TOAST
========================================================== */

function showToast(
    message,
    type = "info",
    duration = 2800
) {

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    elements.toastContainer.appendChild(
        toast
    );

    window.setTimeout(
        () => {

            toast.classList.add("out");

            window.setTimeout(
                () => {
                    toast.remove();
                },
                220
            );

        },
        duration
    );
}


/* ==========================================================
   VALIDACIÓN DE INPUTS
========================================================== */

function sanitizeNumberInput(input) {

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        () => {

            if (
                input.value !== "" &&
                Number(input.value) < 0
            ) {
                input.value = "0";
            }
        }
    );
}


/* ==========================================================
   EVENTOS
========================================================== */

function bindEvents() {

    /* Tema */

    elements.themeButton.addEventListener(
        "click",
        toggleTheme
    );


    /* Unidades */

    elements.kgButton.addEventListener(
        "click",
        () => setUnit("kg")
    );

    elements.lbButton.addEventListener(
        "click",
        () => setUnit("lb")
    );


    /* Barra */

    elements.barWeight.addEventListener(
        "change",
        updateBarFromSelect
    );


    elements.clearPlates.addEventListener(
        "click",
        clearPlates
    );


    /* Guardar */

    elements.saveCurrentButton.addEventListener(
        "click",
        saveCurrentFavorite
    );


    /* Objetivo */

    elements.calculateTarget.addEventListener(
        "click",
        calculateTarget
    );


    elements.targetWeight.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {
                event.preventDefault();
                calculateTarget();
            }
        }
    );


    elements.applyTarget.addEventListener(
        "click",
        applyTarget
    );


    /* 1RM */

    elements.oneRm.addEventListener(
        "input",
        () => {

            updateRMResult();
            updatePercentageTable();

        }
    );


    elements.percentage.addEventListener(
        "change",
        updateRMResult
    );


    elements.sendRmToTarget.addEventListener(
        "click",
        sendRMToTarget
    );


    /* Fórmulas */

    document
        .querySelectorAll(".formula-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    setFormula(
                        button.dataset.formula
                    );

                }
            );

        });


    /* Estimador */

    elements.estimateWeight.addEventListener(
        "input",
        updateEstimatedRM
    );


    elements.estimateReps.addEventListener(
        "input",
        updateEstimatedRM
    );


    elements.sendEstimatedToTarget.addEventListener(
        "click",
        sendEstimatedToTarget
    );


    /* Favoritos */

    elements.clearFavorites.addEventListener(
        "click",
        clearFavorites
    );


    /* Historial */

    elements.clearHistory.addEventListener(
        "click",
        clearHistory
    );


    /* Validaciones */

    sanitizeNumberInput(
        elements.targetWeight
    );

    sanitizeNumberInput(
        elements.oneRm
    );

    sanitizeNumberInput(
        elements.estimateWeight
    );
}


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

function initialize() {

    loadStorage();

    applyTheme();

    /*
        Sincronizamos el selector de barra
        con el valor inicial.
    */

    syncBarSelect();

    /*
        Inicializamos botones de fórmula.
    */

    document
        .querySelectorAll(".formula-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.formula ===
                state.formula
            );

        });

    renderPlates();

    renderVisualBar();

    renderQuickTargets();

    renderFavorites();

    renderHistory();

    updateUnitsUI();

    updateAllBarUI();

    updateRMResult();

    updatePercentageTable();

    updateEstimatedRM();

    /*
        El resultado de objetivo comienza oculto.
    */

    elements.targetResult.classList.add(
        "hidden"
    );

    elements.applyTarget.disabled = true;
    elements.applyTarget.style.opacity = ".4";

    /*
        Eventos al final para evitar problemas
        durante la construcción inicial.
    */

    bindEvents();
}


/* ==========================================================
   ARRANQUE
========================================================== */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();

}