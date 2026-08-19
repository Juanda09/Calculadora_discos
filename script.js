/* ==========================================================
   POWERLOAD v6
   Powerlifting Training Calculator

   Mejoras:
   - KG / LB consistente
   - Inventario físico
   - Objetivos con disponibilidad real
   - 1RM Epley / Brzycki / Lombardi
   - Favoritos
   - Historial
   - Toasts
   - Tema persistente
   - Responsive
========================================================== */


/* ==========================================================
   CONFIGURACIÓN
========================================================== */

const STORAGE_PREFIX = "pl-v6";

const PLATES = [
    45,
    25,
    10,
    5,
    2.5
];

const KG_PER_LB = 0.45359237;

const TARGET_TOLERANCE_LB = 0.25;

const MAX_FAVORITES = 12;

const MAX_HISTORY = 15;

const PERCENTAGES = [
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


/* ==========================================================
   VALORES PREDETERMINADOS
========================================================== */

/*
    Inventario TOTAL de discos.

    Ejemplo:
    45: 2
    significa que tienes dos discos de 45 lb,
    uno para cada lado.

    Para trabajar simétricamente:
    disponibles por lado = Math.floor(total / 2)
*/

const DEFAULT_INVENTORY = {

    45: 2,
    25: 2,
    10: 4,
    5: 4,
    2.5: 4

};


const DEFAULT_COUNTS = {

    45: 0,
    25: 0,
    10: 0,
    5: 0,
    2.5: 0

};


let unit =
    loadValue(
        "unit",
        "kg"
    );


let counts =
    normalizeCounts(
        loadValue(
            "counts",
            DEFAULT_COUNTS
        )
    );


let inventory =
    normalizeInventory(
        loadValue(
            "inventory",
            DEFAULT_INVENTORY
        )
    );


let favorites =
    normalizeArray(
        loadValue(
            "favorites",
            []
        )
    );


let history =
    normalizeArray(
        loadValue(
            "history",
            []
        )
    );


let selectedFormula = "epley";

let lastTarget = null;


/* ==========================================================
   STORAGE
========================================================== */

function loadValue(key, fallback) {

    try {

        const value =
            localStorage.getItem(
                `${STORAGE_PREFIX}-${key}`
            );

        return value !== null
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;

    }

}


function saveValue(key, value) {

    try {

        localStorage.setItem(
            `${STORAGE_PREFIX}-${key}`,
            JSON.stringify(value)
        );

    } catch {

        console.warn(
            "No se pudo guardar:",
            key
        );

    }

}


function saveData() {

    saveValue(
        "unit",
        unit
    );

    saveValue(
        "counts",
        counts
    );

    saveValue(
        "inventory",
        inventory
    );

    saveValue(
        "favorites",
        favorites
    );

    saveValue(
        "history",
        history
    );

}


/* ==========================================================
   NORMALIZACIÓN
========================================================== */

function normalizeCounts(data) {

    const result = {
        ...DEFAULT_COUNTS
    };

    PLATES.forEach(weight => {

        const value =
            Number(
                data?.[weight] ?? 0
            );

        result[weight] =
            Number.isFinite(value)
                ? Math.max(
                    0,
                    Math.floor(value)
                )
                : 0;

    });

    return result;

}


function normalizeInventory(data) {

    const result = {
        ...DEFAULT_INVENTORY
    };

    PLATES.forEach(weight => {

        const value =
            Number(
                data?.[weight] ??
                DEFAULT_INVENTORY[weight]
            );

        result[weight] =
            Number.isFinite(value)
                ? Math.max(
                    0,
                    Math.floor(value)
                )
                : DEFAULT_INVENTORY[weight];

    });

    return result;

}


function normalizeArray(value) {

    return Array.isArray(value)
        ? value
        : [];

}


/* ==========================================================
   CONVERSIONES
========================================================== */

function lbToKg(lb) {

    return lb * KG_PER_LB;

}


function kgToLb(kg) {

    return kg / KG_PER_LB;

}


/* ==========================================================
   FORMATO
========================================================== */

function cleanNumber(
    value,
    decimals = 2
) {

    if (!Number.isFinite(value)) {
        return "0";
    }

    return Number(value)
        .toFixed(decimals)
        .replace(/\.00$/, "")
        .replace(/(\.\d)0$/, "$1");

}


function formatKg(value) {

    return `${cleanNumber(value)} kg`;

}


function formatLb(value) {

    return `${cleanNumber(value)} lb`;

}


function formatWeightFromLb(lb) {

    return unit === "kg"
        ? formatKg(lbToKg(lb))
        : formatLb(lb);

}


function displayValueFromLb(lb) {

    return unit === "kg"
        ? lbToKg(lb)
        : lb;

}


/* ==========================================================
   DOM
========================================================== */

const mainWeight =
    document.getElementById(
        "mainWeight"
    );


const mainUnit =
    document.getElementById(
        "mainUnit"
    );


const secondaryWeight =
    document.getElementById(
        "secondaryWeight"
    );


const sideWeight =
    document.getElementById(
        "sideWeight"
    );


const platesWeight =
    document.getElementById(
        "platesWeight"
    );


const barDisplay =
    document.getElementById(
        "barDisplay"
    );


const barWeight =
    document.getElementById(
        "barWeight"
    );


const platesContainer =
    document.getElementById(
        "platesContainer"
    );


const inventoryContainer =
    document.getElementById(
        "inventoryContainer"
    );


const targetWeight =
    document.getElementById(
        "targetWeight"
    );


const targetUnit =
    document.getElementById(
        "targetUnit"
    );


const quickTargets =
    document.getElementById(
        "quickTargets"
    );


const targetResult =
    document.getElementById(
        "targetResult"
    );


const targetResultTitle =
    document.getElementById(
        "targetResultTitle"
    );


const targetCombination =
    document.getElementById(
        "targetCombination"
    );


const targetRequested =
    document.getElementById(
        "targetRequested"
    );


const targetReal =
    document.getElementById(
        "targetReal"
    );


const targetDifference =
    document.getElementById(
        "targetDifference"
    );


const targetAccuracy =
    document.getElementById(
        "targetAccuracy"
    );


const oneRm =
    document.getElementById(
        "oneRm"
    );


const oneRmUnit =
    document.getElementById(
        "oneRmUnit"
    );


const percentage =
    document.getElementById(
        "percentage"
    );


const rmResult =
    document.getElementById(
        "rmResult"
    );


const percentageGrid =
    document.getElementById(
        "percentageGrid"
    );


const estimatedOneRm =
    document.getElementById(
        "estimatedOneRm"
    );


const estimateWeight =
    document.getElementById(
        "estimateWeight"
    );


const estimateReps =
    document.getElementById(
        "estimateReps"
    );


const estimateUnit =
    document.getElementById(
        "estimateUnit"
    );


const favoritesContainer =
    document.getElementById(
        "favoritesContainer"
    );


const historyContainer =
    document.getElementById(
        "historyContainer"
    );


const leftVisual =
    document.getElementById(
        "leftVisual"
    );


const rightVisual =
    document.getElementById(
        "rightVisual"
    );


const visualPlateCount =
    document.getElementById(
        "visualPlateCount"
    );


const visualTotal =
    document.getElementById(
        "visualTotal"
    );


const toastContainer =
    document.getElementById(
        "toastContainer"
    );


/* ==========================================================
   TOAST
========================================================== */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    toastContainer.appendChild(
        toast
    );

    setTimeout(() => {

        toast.classList.add(
            "out"
        );

        setTimeout(() => {

            toast.remove();

        }, 220);

    }, 2800);

}


/* ==========================================================
   INVENTARIO
========================================================== */

function getAvailablePerSide(
    weight
) {

    return Math.floor(
        inventory[weight] / 2
    );

}


function renderInventory() {

    inventoryContainer.innerHTML =
        "";

    PLATES.forEach(weight => {

        const item =
            document.createElement(
                "div"
            );

        item.className =
            "inventory-item";

        const className =
            String(weight)
                .replace(".", "-");

        const availablePerSide =
            getAvailablePerSide(
                weight
            );

        item.innerHTML = `

            <div
                class="inventory-color plate-${className}"
            ></div>

            <strong>
                ${weight} lb
            </strong>

            <small>
                ${cleanNumber(
                    lbToKg(weight)
                )} kg
            </small>

            <div class="inventory-counter">

                <button
                    type="button"
                    data-inventory-action="minus"
                    data-weight="${weight}"
                    aria-label="Quitar disco de ${weight} libras del inventario"
                >
                    −
                </button>

                <span>
                    ${inventory[weight]}
                </span>

                <button
                    type="button"
                    data-inventory-action="plus"
                    data-weight="${weight}"
                    aria-label="Agregar disco de ${weight} libras al inventario"
                >
                    +
                </button>

            </div>

            <small>
                ${availablePerSide} / lado
            </small>

        `;

        inventoryContainer.appendChild(
            item
        );

    });


    inventoryContainer
        .querySelectorAll(
            "[data-inventory-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                handleInventoryButton
            );

        });

}


function handleInventoryButton(
    event
) {

    const button =
        event.currentTarget;

    const weight =
        Number(
            button.dataset.weight
        );

    const action =
        button.dataset.inventoryAction;

    if (!PLATES.includes(weight)) {
        return;
    }

    if (action === "plus") {

        inventory[weight] =
            Number(
                inventory[weight] || 0
            ) + 1;

    } else {

        inventory[weight] =
            Math.max(
                0,
                Number(
                    inventory[weight] || 0
                ) - 1
            );

    }


    /*
        Si se reduce el inventario,
        también reducimos la carga actual
        si supera la disponibilidad.
    */

    const maxPerSide =
        getAvailablePerSide(
            weight
        );

    if (
        counts[weight] >
        maxPerSide
    ) {

        counts[weight] =
            maxPerSide;

        showToast(
            `Carga ajustada: no tienes suficientes discos de ${weight} lb.`,
            "warning"
        );

    }


    saveData();

    renderInventory();

    renderPlates();

    calculate();

}


/* ==========================================================
   DISCOS ACTUALES
========================================================== */

function renderPlates() {

    platesContainer.innerHTML =
        "";

    PLATES.forEach(weight => {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "plate-row";

        if (
            counts[weight] > 0
        ) {

            row.classList.add(
                "has-plates"
            );

        }


        const className =
            String(weight)
                .replace(".", "-");


        const maxPerSide =
            getAvailablePerSide(
                weight
            );


        const current =
            counts[weight];


        row.innerHTML = `

            <div class="plate-info">

                <div
                    class="plate-circle plate-${className}"
                >
                    ${weight}
                </div>

                <div>

                    <strong>
                        ${weight} lb
                    </strong>

                    <small>
                        ${cleanNumber(
                            lbToKg(weight)
                        )} kg cada uno
                    </small>

                    <small class="plate-limit">
                        Máximo:
                        ${maxPerSide}
                        / lado
                    </small>

                </div>

            </div>


            <div class="counter">

                <button
                    type="button"
                    data-action="minus"
                    data-weight="${weight}"
                    aria-label="Quitar disco de ${weight} libras"
                    ${current <= 0 ? "disabled" : ""}
                >
                    −
                </button>


                <span>
                    ${current}
                </span>


                <button
                    type="button"
                    data-action="plus"
                    data-weight="${weight}"
                    aria-label="Agregar disco de ${weight} libras"
                    ${current >= maxPerSide ? "disabled" : ""}
                >
                    +
                </button>

            </div>

        `;

        platesContainer.appendChild(
            row
        );

    });


    platesContainer
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                handlePlateButton
            );

        });

}


function handlePlateButton(
    event
) {

    const button =
        event.currentTarget;

    const weight =
        Number(
            button.dataset.weight
        );

    const action =
        button.dataset.action;


    if (!PLATES.includes(weight)) {
        return;
    }


    if (action === "plus") {

        const maxPerSide =
            getAvailablePerSide(
                weight
            );

        if (
            counts[weight] >=
            maxPerSide
        ) {

            showToast(
                `No tienes más discos de ${weight} lb disponibles.`,
                "warning"
            );

            return;

        }

        counts[weight]++;

    } else {

        counts[weight] =
            Math.max(
                0,
                counts[weight] - 1
            );

    }


    saveData();

    renderPlates();

    calculate();

}


/* ==========================================================
   CALCULADORA PRINCIPAL
========================================================== */

function getCurrentLoad() {

    let perSide = 0;


    PLATES.forEach(weight => {

        perSide +=
            weight *
            Number(
                counts[weight] || 0
            );

    });


    const plates =
        perSide * 2;


    const bar =
        Number(
            barWeight.value
        );


    const total =
        plates + bar;


    return {

        perSide,
        plates,
        bar,
        total

    };

}


function calculate() {

    const load =
        getCurrentLoad();


    const totalDisplay =
        displayValueFromLb(
            load.total
        );


    mainWeight.textContent =
        cleanNumber(
            totalDisplay
        );


    mainUnit.textContent =
        unit;


    secondaryWeight.textContent =
        unit === "kg"
            ? formatLb(load.total)
            : formatKg(
                lbToKg(load.total)
            );


    sideWeight.textContent =
        formatWeightFromLb(
            load.perSide
        );


    platesWeight.textContent =
        formatWeightFromLb(
            load.plates
        );


    barDisplay.textContent =
        formatWeightFromLb(
            load.bar
        );


    renderBar();

    updateVisualSummary(
        load
    );

    saveData();

}


/* ==========================================================
   RESUMEN VISUAL
========================================================== */

function updateVisualSummary(
    load
) {

    const amount =
        PLATES.reduce(
            (total, weight) => {

                return total +
                    Number(
                        counts[weight] || 0
                    );

            },
            0
        );


    visualPlateCount.textContent =
        amount;


    visualTotal.textContent =
        formatWeightFromLb(
            load.total
        );

}


/* ==========================================================
   VISUAL DE LA BARRA
========================================================== */

function renderBar() {

    leftVisual.innerHTML =
        "";

    rightVisual.innerHTML =
        "";


    /*
        Las placas se agregan desde
        las más grandes hacia las pequeñas.
    */

    PLATES.forEach(weight => {

        const amount =
            Number(
                counts[weight] || 0
            );


        for (
            let i = 0;
            i < amount;
            i++
        ) {

            leftVisual.appendChild(
                createVisualPlate(
                    weight
                )
            );


            rightVisual.appendChild(
                createVisualPlate(
                    weight
                )
            );

        }

    });

}


function createVisualPlate(
    weight
) {

    const plate =
        document.createElement(
            "div"
        );


    const className =
        String(weight)
            .replace(".", "-");


    plate.className =
        `visual-plate visual-${className}`;


    plate.textContent =
        weight;


    plate.title =
        `${weight} lb / ${cleanNumber(
            lbToKg(weight)
        )} kg`;


    return plate;

}


/* ==========================================================
   UNIDADES
========================================================== */

document
    .getElementById("kgButton")
    .addEventListener(
        "click",
        () => setUnit("kg")
    );


document
    .getElementById("lbButton")
    .addEventListener(
        "click",
        () => setUnit("lb")
    );


function setUnit(
    newUnit
) {

    if (
        !["kg", "lb"].includes(
            newUnit
        )
    ) {

        return;

    }


    unit =
        newUnit;


    document
        .getElementById("kgButton")
        .classList.toggle(
            "active",
            unit === "kg"
        );


    document
        .getElementById("lbButton")
        .classList.toggle(
            "active",
            unit === "lb"
        );


    targetUnit.textContent =
        unit;


    oneRmUnit.textContent =
        unit;


    estimateUnit.textContent =
        unit;


    renderQuickTargets();

    updateOneRm();

    estimateOneRm();

    calculate();

    saveData();

}


/* ==========================================================
   BARRA
========================================================== */

barWeight.addEventListener(
    "change",
    () => {

        calculate();

    }
);


/* ==========================================================
   LIMPIAR DISCOS
========================================================== */

document
    .getElementById("clearPlates")
    .addEventListener(
        "click",
        () => {

            const hasPlates =
                Object.values(
                    counts
                ).some(
                    value => value > 0
                );


            if (!hasPlates) {

                showToast(
                    "La barra ya está limpia.",
                    "info"
                );

                return;

            }


            if (
                !confirm(
                    "¿Quieres quitar todos los discos de la barra?"
                )
            ) {

                return;

            }


            counts =
                {
                    ...DEFAULT_COUNTS
                };


            saveData();

            renderPlates();

            calculate();


            showToast(
                "Barra limpiada.",
                "success"
            );

        }
    );


/* ==========================================================
   OBJETIVOS RÁPIDOS
========================================================== */

function renderQuickTargets() {

    quickTargets.innerHTML =
        "";


    const targetsKg = [
        60,
        70,
        80,
        90,
        100,
        120,
        140
    ];


    targetsKg.forEach(
        kg => {

            const value =
                unit === "kg"
                    ? kg
                    : Math.round(
                        kgToLb(kg)
                    );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.textContent =
                cleanNumber(value);


            button.dataset.target =
                value;


            button.addEventListener(
                "click",
                () => {

                    targetWeight.value =
                        value;

                    calculateTarget();

                }
            );


            quickTargets.appendChild(
                button
            );

        }
    );

}


/* ==========================================================
   CALCULAR OBJETIVO
========================================================== */

document
    .getElementById("calculateTarget")
    .addEventListener(
        "click",
        calculateTarget
    );


targetWeight.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            calculateTarget();

        }

    }
);


function calculateTarget() {

    const input =
        Number(
            targetWeight.value
        );


    if (
        !Number.isFinite(input) ||
        input <= 0
    ) {

        showTargetError(
            "Introduce un peso objetivo válido."
        );

        return;

    }


    const targetLb =
        unit === "kg"
            ? kgToLb(input)
            : input;


    const bar =
        Number(
            barWeight.value
        );


    const discLoad =
        targetLb - bar;


    if (
        discLoad < -TARGET_TOLERANCE_LB
    ) {

        showTargetError(
            "El objetivo es menor que el peso de la barra."
        );

        return;

    }


    const targetPerSide =
        Math.max(
            0,
            discLoad / 2
        );


    const result =
        findBestCombination(
            targetPerSide
        );


    if (!result) {

        showTargetError(
            "No existe una combinación posible con tu inventario actual."
        );

        return;

    }


    const actualTotal =
        result.perSide * 2 +
        bar;


    const difference =
        actualTotal -
        targetLb;


    lastTarget = {

        counts:
            result.counts,

        total:
            actualTotal,

        bar

    };


    renderTarget(
        targetLb,
        actualTotal,
        difference,
        result.counts
    );

}


/* ==========================================================
   ALGORITMO DE DISCOS
========================================================== */

function findBestCombination(
    targetPerSide
) {

    /*
        Convertimos todo a unidades
        de 2.5 lb para evitar problemas
        de precisión decimal.
    */

    const targetUnits =
        Math.round(
            targetPerSide / 2.5
        );


    const values = {

        45: 18,
        25: 10,
        10: 4,
        5: 2,
        2.5: 1

    };


    const maxCounts = {};


    PLATES.forEach(
        weight => {

            maxCounts[weight] =
                getAvailablePerSide(
                    weight
                );

        }
    );


    let best = null;


    /*
        La cantidad máxima de combinaciones
        es pequeña, por lo que una búsqueda
        exhaustiva es suficiente y confiable.
    */

    for (
        let a = 0;
        a <= maxCounts[45];
        a++
    ) {

        for (
            let b = 0;
            b <= maxCounts[25];
            b++
        ) {

            for (
                let c = 0;
                c <= maxCounts[10];
                c++
            ) {

                for (
                    let d = 0;
                    d <= maxCounts[5];
                    d++
                ) {

                    for (
                        let e = 0;
                        e <= maxCounts[2.5];
                        e++
                    ) {

                        const totalUnits =
                            a * values[45] +
                            b * values[25] +
                            c * values[10] +
                            d * values[5] +
                            e * values[2.5];


                        const difference =
                            Math.abs(
                                totalUnits -
                                targetUnits
                            );


                        const plateCount =
                            a +
                            b +
                            c +
                            d +
                            e;


                        /*
                            Preferimos discos grandes
                            cuando hay empate.
                        */

                        const largePreference =
                            -(
                                a * 100 +
                                b * 50 +
                                c * 20 +
                                d * 10 +
                                e * 5
                            );


                        const current = {

                            difference,

                            plateCount,

                            largePreference,

                            perSide:
                                totalUnits *
                                2.5,

                            counts: {

                                45: a,
                                25: b,
                                10: c,
                                5: d,
                                2.5: e

                            }

                        };


                        if (
                            best === null ||

                            current.difference <
                            best.difference ||

                            (
                                current.difference ===
                                best.difference &&

                                current.plateCount <
                                best.plateCount
                            ) ||

                            (
                                current.difference ===
                                best.difference &&

                                current.plateCount ===
                                best.plateCount &&

                                current.largePreference <
                                best.largePreference
                            )
                        ) {

                            best =
                                current;

                        }

                    }

                }

            }

        }

    }


    return best;

}


/* ==========================================================
   MOSTRAR OBJETIVO
========================================================== */

function renderTarget(
    requested,
    actual,
    difference,
    combination
) {

    targetResult.classList.remove(
        "hidden"
    );


    targetResultTitle.textContent =
        "Combinación recomendada";


    targetCombination.innerHTML =
        "";


    const items = [

        [45, combination[45]],
        [25, combination[25]],
        [10, combination[10]],
        [5, combination[5]],
        [2.5, combination[2.5]]

    ];


    let totalDiscs = 0;


    items.forEach(
        ([weight, count]) => {

            for (
                let i = 0;
                i < count;
                i++
            ) {

                totalDiscs++;


                const chip =
                    document.createElement(
                        "div"
                    );


                chip.className =
                    "plate-chip";


                chip.textContent =
                    `${weight} lb`;


                chip.title =
                    `${cleanNumber(
                        lbToKg(weight)
                    )} kg`;


                targetCombination
                    .appendChild(
                        chip
                    );

            }

        }
    );


    if (
        totalDiscs === 0
    ) {

        const chip =
            document.createElement(
                "div"
            );


        chip.className =
            "plate-chip";


        chip.textContent =
            "Sin discos";


        targetCombination
            .appendChild(
                chip
            );

    }


    targetRequested.textContent =
        formatWeightFromLb(
            requested
        );


    targetReal.textContent =
        formatWeightFromLb(
            actual
        );


    if (
        Math.abs(difference) <=
        TARGET_TOLERANCE_LB
    ) {

        targetAccuracy.textContent =
            "EXACTO";


        targetAccuracy.className =
            "accuracy exact";

    } else {

        targetAccuracy.textContent =
            "APROXIMADO";


        targetAccuracy.className =
            "accuracy close";

    }


    const sign =
        difference > 0
            ? "+"
            : "";


    targetDifference.textContent =
        Math.abs(difference) < 0.01
            ? "0"
            : `${sign}${formatWeightFromLb(
                difference
            )}`;

}


/* ==========================================================
   ERROR DE OBJETIVO
========================================================== */

function showTargetError(
    message
) {

    targetResult.classList.remove(
        "hidden"
    );


    targetResultTitle.textContent =
        "No disponible";


    targetCombination.innerHTML =
        "";


    const chip =
        document.createElement(
            "div"
        );


    chip.className =
        "plate-chip";

    chip.style.color =
        "var(--danger)";

    chip.style.borderColor =
        "rgba(255,102,102,.25)";


    chip.textContent =
        `⚠ ${message}`;


    targetCombination.appendChild(
        chip
    );


    targetRequested.textContent =
        "-";


    targetReal.textContent =
        "-";


    targetDifference.textContent =
        "-";


    targetAccuracy.textContent =
        "NO DISPONIBLE";


    targetAccuracy.className =
        "accuracy unavailable";


    lastTarget = null;


    showToast(
        message,
        "error"
    );

}


/* ==========================================================
   APLICAR OBJETIVO
========================================================== */

document
    .getElementById("applyTarget")
    .addEventListener(
        "click",
        () => {

            if (!lastTarget) {

                showToast(
                    "Primero calcula un objetivo.",
                    "warning"
                );

                return;

            }


            counts =
                normalizeCounts(
                    lastTarget.counts
                );


            barWeight.value =
                String(
                    lastTarget.bar
                );


            renderPlates();

            calculate();


            saveHistory(
                lastTarget.total,
                counts,
                lastTarget.bar
            );


            showToast(
                "Configuración aplicada correctamente.",
                "success"
            );


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );


/* ==========================================================
   1RM
========================================================== */

oneRm.addEventListener(
    "input",
    updateOneRm
);


percentage.addEventListener(
    "change",
    updateOneRm
);


document
    .querySelectorAll(
        "[data-formula]"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedFormula =
                    button.dataset.formula;


                document
                    .querySelectorAll(
                        "[data-formula]"
                    )
                    .forEach(
                        other => {

                            other.classList.toggle(
                                "active",
                                other === button
                            );

                        }
                    );


                updateOneRm();

            }
        );

    });


function calculateOneRm(
    weight,
    reps,
    formula
) {

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

            if (reps >= 37) {
                return weight;
            }

            return weight *
                (
                    36 /
                    (
                        37 - reps
                    )
                );


        case "lombardi":

            return weight *
                Math.pow(
                    reps,
                    0.10
                );


        case "epley":

        default:

            return weight *
                (
                    1 +
                    reps / 30
                );

    }

}


function updateOneRm() {

    const rm =
        Number(
            oneRm.value
        );


    const percent =
        Number(
            percentage.value
        );


    if (
        !Number.isFinite(rm) ||
        rm <= 0
    ) {

        rmResult.textContent =
            `0 ${unit}`;

        renderPercentageTable(
            0
        );

        return;

    }


    const result =
        rm * percent;


    rmResult.textContent =
        `${cleanNumber(
            result
        )} ${unit}`;


    renderPercentageTable(
        rm
    );

}


/* ==========================================================
   TABLA DE PORCENTAJES
========================================================== */

function renderPercentageTable(
    rm
) {

    percentageGrid.innerHTML =
        "";


    PERCENTAGES.forEach(
        percent => {

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "percentage-cell";


            const selected =
                Number(
                    percentage.value
                ) ===
                percent / 100;


            if (
                selected &&
                rm > 0
            ) {

                cell.classList.add(
                    "active"
                );

            }


            const result =
                rm > 0
                    ? rm * percent / 100
                    : 0;


            cell.innerHTML = `

                <span>
                    ${percent}%
                </span>

                <strong>
                    ${
                        rm > 0
                            ? `${cleanNumber(
                                result
                            )} ${unit}`
                            : "—"
                    }
                </strong>

            `;


            cell.addEventListener(
                "click",
                () => {

                    percentage.value =
                        String(
                            percent / 100
                        );


                    updateOneRm();

                }
            );


            percentageGrid
                .appendChild(
                    cell
                );

        }
    );

}


/* ==========================================================
   ENVIAR 1RM A OBJETIVO
========================================================== */

document
    .getElementById("sendRmToTarget")
    .addEventListener(
        "click",
        () => {

            const rm =
                Number(
                    oneRm.value
                );


            const percent =
                Number(
                    percentage.value
                );


            if (
                !Number.isFinite(rm) ||
                rm <= 0
            ) {

                showToast(
                    "Introduce primero un 1RM válido.",
                    "warning"
                );

                return;

            }


            const result =
                rm * percent;


            targetWeight.value =
                cleanNumber(
                    result
                );


            calculateTarget();


            targetResult.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });

        }
    );


/* ==========================================================
   ESTIMADOR 1RM
========================================================== */

estimateWeight.addEventListener(
    "input",
    estimateOneRm
);


estimateReps.addEventListener(
    "input",
    estimateOneRm
);


function estimateOneRm() {

    const weightInput =
        Number(
            estimateWeight.value
        );


    const reps =
        Number(
            estimateReps.value
        );


    if (
        !Number.isFinite(
            weightInput
        ) ||
        !Number.isFinite(reps) ||
        weightInput <= 0 ||
        reps <= 0
    ) {

        estimatedOneRm.textContent =
            `0 ${unit}`;

        return;

    }


    const weightKg =
        unit === "kg"
            ? weightInput
            : lbToKg(
                weightInput
            );


    const resultKg =
        calculateOneRm(
            weightKg,
            reps,
            selectedFormula
        );


    const result =
        unit === "kg"
            ? resultKg
            : kgToLb(
                resultKg
            );


    estimatedOneRm.textContent =
        `${cleanNumber(
            result
        )} ${unit}`;

}


/* ==========================================================
   ENVIAR ESTIMACIÓN A OBJETIVO
========================================================== */

document
    .getElementById(
        "sendEstimatedToTarget"
    )
    .addEventListener(
        "click",
        () => {

            const weight =
                Number(
                    estimateWeight.value
                );


            const reps =
                Number(
                    estimateReps.value
                );


            if (
                !Number.isFinite(weight) ||
                !Number.isFinite(reps) ||
                weight <= 0 ||
                reps <= 0
            ) {

                showToast(
                    "Introduce peso y repeticiones válidos.",
                    "warning"
                );

                return;

            }


            const weightKg =
                unit === "kg"
                    ? weight
                    : lbToKg(weight);


            const estimatedKg =
                calculateOneRm(
                    weightKg,
                    reps,
                    selectedFormula
                );


            const result =
                unit === "kg"
                    ? estimatedKg
                    : kgToLb(
                        estimatedKg
                    );


            targetWeight.value =
                cleanNumber(
                    result
                );


            calculateTarget();


            targetResult.scrollIntoView({

                behavior: "smooth",

                block: "center"

            });

        }
    );


/* ==========================================================
   FAVORITOS
========================================================== */

document
    .getElementById(
        "saveCurrentButton"
    )
    .addEventListener(
        "click",
        saveCurrentFavorite
    );


function areCountsEqual(
    first,
    second
) {

    return PLATES.every(
        weight =>
            Number(
                first?.[weight] || 0
            ) ===
            Number(
                second?.[weight] || 0
            )
    );

}


function saveCurrentFavorite() {

    const load =
        getCurrentLoad();


    if (
        load.total <= 0
    ) {

        showToast(
            "No hay una carga válida para guardar.",
            "warning"
        );

        return;

    }


    const duplicate =
        favorites.some(
            item =>

                Number(
                    item.bar
                ) ===
                Number(
                    load.bar
                ) &&

                areCountsEqual(
                    item.counts,
                    counts
                )
        );


    if (duplicate) {

        showToast(
            "Esta configuración ya está en favoritos.",
            "info"
        );

        return;

    }


    const item = {

        id:
            Date.now(),

        total:
            load.total,

        counts: {
            ...counts
        },

        bar:
            load.bar,

        date:
            new Date()
                .toLocaleString(
                    "es-CO",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

    };


    favorites.unshift(
        item
    );


    favorites =
        favorites.slice(
            0,
            MAX_FAVORITES
        );


    saveData();

    renderFavorites();


    showToast(
        "✓ Carga guardada en favoritos.",
        "success"
    );

}


/* ==========================================================
   RENDER FAVORITOS
========================================================== */

function renderFavorites() {

    favoritesContainer.innerHTML =
        "";


    if (
        favorites.length === 0
    ) {

        favoritesContainer.innerHTML = `

            <div class="empty">
                No tienes cargas favoritas todavía.
            </div>

        `;

        return;

    }


    favorites.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "favorite-item";


            row.innerHTML = `

                <div>

                    <div class="item-weight">
                        ${formatWeightFromLb(
                            item.total
                        )}
                    </div>

                    <div class="item-detail">
                        ${describeCounts(
                            item.counts
                        )}
                        · Barra:
                        ${formatWeightFromLb(
                            item.bar
                        )}
                        · ${item.date || ""}
                    </div>

                </div>


                <div class="item-actions">

                    <button
                        type="button"
                        data-load="${item.id}"
                    >
                        Usar
                    </button>


                    <button
                        type="button"
                        class="delete"
                        data-delete="${item.id}"
                        aria-label="Eliminar favorito"
                    >
                        ×
                    </button>

                </div>

            `;


            favoritesContainer
                .appendChild(
                    row
                );

        }
    );


    favoritesContainer
        .querySelectorAll(
            "[data-load]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.load
                            );


                        const item =
                            favorites.find(
                                x =>
                                    x.id === id
                            );


                        if (!item) {
                            return;
                        }


                        counts =
                            normalizeCounts(
                                item.counts
                            );


                        if (
                            item.bar !== undefined
                        ) {

                            barWeight.value =
                                String(
                                    item.bar
                                );

                        }


                        renderPlates();

                        calculate();


                        showToast(
                            "Favorito aplicado.",
                            "success"
                        );


                        window.scrollTo({

                            top: 0,

                            behavior: "smooth"

                        });

                    }
                );

            }
        );


    favoritesContainer
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.delete
                            );


                        favorites =
                            favorites.filter(
                                x =>
                                    x.id !== id
                            );


                        saveData();

                        renderFavorites();


                        showToast(
                            "Favorito eliminado.",
                            "success"
                        );

                    }
                );

            }
        );

}


/* ==========================================================
   HISTORIAL
========================================================== */

function saveHistory(
    total,
    selectedCounts,
    selectedBar
) {

    const entry = {

        id:
            Date.now(),

        total,

        counts:
            normalizeCounts(
                selectedCounts
            ),

        bar:
            Number(
                selectedBar
            ),

        date:
            new Date()
                .toLocaleString(
                    "es-CO",
                    {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

    };


    history.unshift(
        entry
    );


    history =
        history.slice(
            0,
            MAX_HISTORY
        );


    saveData();

    renderHistory();

}


/* ==========================================================
   RENDER HISTORIAL
========================================================== */

function renderHistory() {

    historyContainer.innerHTML =
        "";


    if (
        history.length === 0
    ) {

        historyContainer.innerHTML = `

            <div class="empty">
                Todavía no hay levantamientos registrados.
            </div>

        `;

        return;

    }


    history.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "history-item";


            row.innerHTML = `

                <div>

                    <div class="item-weight">
                        ${formatWeightFromLb(
                            item.total
                        )}
                    </div>

                    <div class="item-detail">

                        ${describeCounts(
                            item.counts
                        )}

                        · Barra:
                        ${formatWeightFromLb(
                            item.bar || 0
                        )}

                        · ${item.date}

                    </div>

                </div>


                <div class="item-actions">

                    <button
                        type="button"
                        data-history-load="${item.id}"
                    >
                        Usar
                    </button>

                </div>

            `;


            historyContainer
                .appendChild(
                    row
                );

        }
    );


    historyContainer
        .querySelectorAll(
            "[data-history-load]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset
                                    .historyLoad
                            );


                        const item =
                            history.find(
                                x =>
                                    x.id === id
                            );


                        if (!item) {
                            return;
                        }


                        counts =
                            normalizeCounts(
                                item.counts
                            );


                        if (
                            item.bar !== undefined
                        ) {

                            barWeight.value =
                                String(
                                    item.bar
                                );

                        }


                        renderPlates();

                        calculate();


                        showToast(
                            "Configuración del historial aplicada.",
                            "success"
                        );


                        window.scrollTo({

                            top: 0,

                            behavior: "smooth"

                        });

                    }
                );

            }
        );

}


/* ==========================================================
   DESCRIBIR COMBINACIÓN
========================================================== */

function describeCounts(
    selected
) {

    const result = [];


    PLATES.forEach(
        weight => {

            const count =
                Number(
                    selected?.[weight] || 0
                );


            if (
                count > 0
            ) {

                result.push(
                    `${weight}×${count}`
                );

            }

        }
    );


    return result.length
        ? result.join(" · ")
        : "Sin discos";

}


/* ==========================================================
   LIMPIAR FAVORITOS
========================================================== */

document
    .getElementById(
        "clearFavorites"
    )
    .addEventListener(
        "click",
        () => {

            if (
                favorites.length === 0
            ) {

                showToast(
                    "No hay favoritos para eliminar.",
                    "info"
                );

                return;

            }


            if (
                !confirm(
                    "¿Quieres eliminar todos los favoritos?"
                )
            ) {

                return;

            }


            favorites = [];


            saveData();

            renderFavorites();


            showToast(
                "Favoritos eliminados.",
                "success"
            );

        }
    );


/* ==========================================================
   LIMPIAR HISTORIAL
========================================================== */

document
    .getElementById(
        "clearHistory"
    )
    .addEventListener(
        "click",
        () => {

            if (
                history.length === 0
            ) {

                showToast(
                    "No hay historial para eliminar.",
                    "info"
                );

                return;

            }


            if (
                !confirm(
                    "¿Quieres eliminar todo el historial?"
                )
            ) {

                return;

            }


            history = [];


            saveData();

            renderHistory();


            showToast(
                "Historial eliminado.",
                "success"
            );

        }
    );


/* ==========================================================
   TEMA
========================================================== */

document
    .getElementById(
        "themeButton"
    )
    .addEventListener(
        "click",
        toggleTheme
    );


function toggleTheme() {

    document.body
        .classList
        .toggle(
            "light"
        );


    const isLight =
        document.body
            .classList
            .contains(
                "light"
            );


    saveValue(
        "theme",
        isLight
            ? "light"
            : "dark"
    );


    updateThemeButton();


    showToast(
        isLight
            ? "Tema claro activado."
            : "Tema oscuro activado.",
        "info"
    );

}


function updateThemeButton() {

    const isLight =
        document.body
            .classList
            .contains(
                "light"
            );


    document
        .getElementById(
            "themeButton"
        )
        .textContent =
            isLight
                ? "☀"
                : "☾";

}


function loadTheme() {

    const theme =
        loadValue(
            "theme",
            "dark"
        );


    if (
        theme === "light"
    ) {

        document.body
            .classList
            .add(
                "light"
            );

    }


    updateThemeButton();

}


/* ==========================================================
   VALIDACIÓN DEL INVENTARIO
========================================================== */

function validateCurrentCounts() {

    let changed = false;


    PLATES.forEach(
        weight => {

            const max =
                getAvailablePerSide(
                    weight
                );


            if (
                counts[weight] >
                max
            ) {

                counts[weight] =
                    max;

                changed = true;

            }

        }
    );


    if (changed) {

        showToast(
            "La carga fue ajustada según tu inventario.",
            "warning"
        );

    }

}


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

function init() {

    loadTheme();


    validateCurrentCounts();


    renderInventory();


    renderPlates();


    renderFavorites();


    renderHistory();


    renderQuickTargets();


    renderPercentageTable(
        0
    );


    setUnit(
        unit
    );


    calculate();


    saveData();

}


init();