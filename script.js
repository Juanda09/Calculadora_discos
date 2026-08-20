/* ==========================================================
   POWERLOAD v6
   Calculadora de discos para Powerlifting

   FUNCIONES:
   - Discos estándar
   - Discos calibrados
   - KG / LB
   - Calculadora de discos
   - Objetivos rápidos
   - Calculadora de 1RM por porcentaje
   - Estimador de 1RM
   - ¿Cuántas reps necesito?
   - ¿Qué peso necesito para X reps?
   - Favoritos
   - Historial
   - Tema claro / oscuro

   IMPORTANTE:
   - Los discos se manejan internamente en LIBRAS.
   - La barra se maneja internamente en LIBRAS.
   - El usuario puede visualizar KG o LB.
========================================================== */

"use strict";


/* ==========================================================
   CONFIGURACIÓN
========================================================== */


/* ==========================================================
   DISCOS ESTÁNDAR
========================================================== */

const STANDARD_PLATES = [

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


/* ==========================================================
   DISCOS CALIBRADOS
========================================================== */

const CALIBRATED_PLATES = [

    {
        weight: 25 * 2.2046226218,
        kg: 25,
        label: "25 kg",
        className: "cal-25"
    },

    {
        weight: 20 * 2.2046226218,
        kg: 20,
        label: "20 kg",
        className: "cal-20"
    },

    {
        weight: 15 * 2.2046226218,
        kg: 15,
        label: "15 kg",
        className: "cal-15"
    },

    {
        weight: 10 * 2.2046226218,
        kg: 10,
        label: "10 kg",
        className: "cal-10"
    },

    {
        weight: 5 * 2.2046226218,
        kg: 5,
        label: "5 kg",
        className: "cal-5"
    },

    {
        weight: 2.5 * 2.2046226218,
        kg: 2.5,
        label: "2.5 kg",
        className: "cal-2-5"
    },

    {
        weight: 1.25 * 2.2046226218,
        kg: 1.25,
        label: "1.25 kg",
        className: "cal-1-25"
    },

    {
        weight: 1 * 2.2046226218,
        kg: 1,
        label: "1 kg",
        className: "cal-1"
    },

    {
        weight: 0.5 * 2.2046226218,
        kg: 0.5,
        label: "0.5 kg",
        className: "cal-0-5"
    },

    {
        weight: 0.25 * 2.2046226218,
        kg: 0.25,
        label: "0.25 kg",
        className: "cal-0-25"
    }

];


/*
 * Alias de compatibilidad.
 */
let PLATES = STANDARD_PLATES;


/* ==========================================================
   CONVERSIONES
========================================================== */

const LB_TO_KG = 0.45359237;
const KG_TO_LB = 1 / LB_TO_KG;


/* ==========================================================
   ESTADO
========================================================== */

const savedPlateMode =
    localStorage.getItem(
        "powerload_plate_mode"
    ) || "standard";


const validPlateMode =
    savedPlateMode === "calibrated"
        ? "calibrated"
        : "standard";


const state = {

    unit:
        localStorage.getItem(
            "powerload_unit"
        ) || "kg",

    theme:
        localStorage.getItem(
            "powerload_theme"
        ) || "dark",

    plateMode:
        validPlateMode,

    barWeight: 45,

    plates: {},

    platesByMode: {

        standard: {},

        calibrated: {}

    },

    /*
     * Fórmula de la calculadora tradicional.
     */
    formula: "epley",

    /*
     * Fórmula de la calculadora
     * "¿Cuántas reps necesito?"
     */
    repsFormula: "epley",

    /*
     * Fórmula de la calculadora
     * "¿Qué peso necesito para X reps?"
     */
    weightForRepsFormula: "epley",

    targetCombination: null,

    favorites: JSON.parse(
        localStorage.getItem(
            "powerload_favorites"
        ) || "[]"
    ),

    history: JSON.parse(
        localStorage.getItem(
            "powerload_history"
        ) || "[]"
    )

};


/* ==========================================================
   INICIALIZAR ESTADO DE DISCOS
========================================================== */

function createPlateState(plates) {

    const result = {};

    plates.forEach(plate => {

        result[plate.weight] = 0;

    });

    return result;
}


function initializePlateStates() {

    state.platesByMode.standard =
        createPlateState(
            STANDARD_PLATES
        );


    state.platesByMode.calibrated =
        createPlateState(
            CALIBRATED_PLATES
        );


    /*
     * Compatibilidad con versiones anteriores.
     */
    const oldPlates =
        JSON.parse(
            localStorage.getItem(
                "powerload_plates"
            ) || "null"
        );


    if (
        oldPlates &&
        typeof oldPlates === "object"
    ) {

        Object.keys(oldPlates)
            .forEach(weight => {

                const numericWeight =
                    Number(weight);


                if (
                    Number.isFinite(
                        numericWeight
                    ) &&
                    Object.prototype.hasOwnProperty.call(
                        state.platesByMode.standard,
                        numericWeight
                    )
                ) {

                    state.platesByMode
                        .standard[numericWeight] =
                        Number(
                            oldPlates[weight]
                        ) || 0;

                }

            });

    }


    state.plates =
        state.platesByMode[
        state.plateMode
        ];

}


initializePlateStates();


/* ==========================================================
   DOM
========================================================== */

const $ = id =>
    document.getElementById(id);


const elements = {

    /* ======================================================
       GENERAL
    ====================================================== */

    themeButton:
        $("themeButton"),

    kgButton:
        $("kgButton"),

    lbButton:
        $("lbButton"),


    /* ======================================================
       DISPLAY PRINCIPAL
    ====================================================== */

    mainWeight:
        $("mainWeight"),

    mainUnit:
        $("mainUnit"),

    secondaryWeight:
        $("secondaryWeight"),

    sideWeight:
        $("sideWeight"),

    platesWeight:
        $("platesWeight"),

    barDisplay:
        $("barDisplay"),


    /* ======================================================
       DISCOS
    ====================================================== */

    saveCurrentButton:
        $("saveCurrentButton"),

    clearPlates:
        $("clearPlates"),

    leftVisual:
        $("leftVisual"),

    rightVisual:
        $("rightVisual"),

    visualPlateCount:
        $("visualPlateCount"),

    visualTotal:
        $("visualTotal"),

    platesContainer:
        $("platesContainer"),

    plateMode:
        $("plateMode"),

    barWeight:
        $("barWeight"),


    /* ======================================================
       OBJETIVO
    ====================================================== */

    targetWeight:
        $("targetWeight"),

    targetUnit:
        $("targetUnit"),

    calculateTarget:
        $("calculateTarget"),

    quickTargets:
        $("quickTargets"),

    targetResult:
        $("targetResult"),

    targetResultTitle:
        $("targetResultTitle"),

    targetAccuracy:
        $("targetAccuracy"),

    targetCombination:
        $("targetCombination"),

    targetRequested:
        $("targetRequested"),

    targetReal:
        $("targetReal"),

    targetDifference:
        $("targetDifference"),

    applyTarget:
        $("applyTarget"),


    /* ======================================================
       CALCULADORA 1RM
    ====================================================== */

    oneRm:
        $("oneRm"),

    oneRmUnit:
        $("oneRmUnit"),

    percentage:
        $("percentage"),

    rmResult:
        $("rmResult"),

    sendRmToTarget:
        $("sendRmToTarget"),

    percentageGrid:
        $("percentageGrid"),


    /* ======================================================
       ESTIMADOR 1RM
    ====================================================== */

    estimateWeight:
        $("estimateWeight"),

    estimateUnit:
        $("estimateUnit"),

    estimateReps:
        $("estimateReps"),

    estimatedOneRm:
        $("estimatedOneRm"),

    sendEstimatedToTarget:
        $("sendEstimatedToTarget"),


    /* ======================================================
       CALCULADORA:
       ¿CUÁNTAS REPS NECESITO?
    ====================================================== */

    repsWeight:
        $("repsWeight"),

    repsWeightUnit:
        $("repsWeightUnit"),

    repsTarget:
        $("repsTarget"),

    repsTargetUnit:
        $("repsTargetUnit"),

    calculateRequiredReps:
        $("calculateRequiredReps"),

    requiredRepsResult:
        $("requiredRepsResult"),

    requiredReps:
        $("requiredReps"),

    requiredRepsWeight:
        $("requiredRepsWeight"),

    requiredRepsTarget:
        $("requiredRepsTarget"),

    requiredRepsEstimatedRm:
        $("requiredRepsEstimatedRm"),

    requiredRepsMessage:
        $("requiredRepsMessage"),

    sendRepsTargetToTarget:
        $("sendRepsTargetToTarget"),


    /* ======================================================
       NUEVA CALCULADORA:
       ¿QUÉ PESO NECESITO PARA X REPS?
    ====================================================== */

    weightForRepsOneRm:
        $("weightForRepsOneRm"),

    weightForRepsOneRmUnit:
        $("weightForRepsOneRmUnit"),

    weightForRepsReps:
        $("weightForReps"),

    calculateWeightForReps:
        $("calculateWeightForReps"),

    weightForRepsResult:
        $("weightForRepsResult"),

    weightForRepsResultValue:
        $("weightForRepsResultValue"),

    weightForRepsResultUnit:
        $("weightForRepsResultUnit"),

    weightForRepsReferenceRm:
        $("weightForRepsReferenceRm"),

    weightForRepsTargetRepsDisplay:
        $("weightForRepsTargetReps"),

    weightForRepsPercentage:
        $("weightForRepsPercentage"),
    /* ======================================================
       FAVORITOS
    ====================================================== */

    favoritesContainer:
        $("favoritesContainer"),

    clearFavorites:
        $("clearFavorites"),


    /* ======================================================
       HISTORIAL
    ====================================================== */

    historyContainer:
        $("historyContainer"),

    clearHistory:
        $("clearHistory"),


    /* ======================================================
       TOAST
    ====================================================== */

    toastContainer:
        $("toastContainer")

};


/* ==========================================================
   UTILIDADES
========================================================== */

function round(
    value,
    decimals = 2
) {

    const factor =
        Math.pow(
            10,
            decimals
        );


    return Math.round(
        (
            value +
            Number.EPSILON
        ) * factor
    ) / factor;

}


function formatNumber(
    value,
    decimals = 2
) {

    if (
        !Number.isFinite(value)
    ) {
        return "0";
    }


    const rounded =
        round(
            value,
            decimals
        );


    return rounded
        .toFixed(decimals)
        .replace(
            /\.00$/,
            ""
        )
        .replace(
            /(\.\d)0$/,
            "$1"
        );

}


function formatWeight(
    weightLb,
    unit = state.unit
) {

    if (
        !Number.isFinite(
            weightLb
        )
    ) {

        return `0 ${unit}`;

    }


    if (
        unit === "kg"
    ) {

        return `${formatNumber(
            weightLb *
            LB_TO_KG,
            2
        )} kg`;

    }


    return `${formatNumber(
        weightLb,
        2
    )} lb`;

}


function toLb(
    value,
    unit
) {

    const number =
        Number(value);


    if (
        !Number.isFinite(
            number
        )
    ) {
        return 0;
    }


    return unit === "kg"
        ? number * KG_TO_LB
        : number;

}


function fromLb(
    valueLb,
    unit
) {

    return unit === "kg"
        ? valueLb * LB_TO_KG
        : valueLb;

}


function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ==========================================================
   TOAST
========================================================== */

function showToast(
    message,
    type = "info"
) {

    if (
        !elements.toastContainer
    ) {
        return;
    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.textContent =
        message;


    elements.toastContainer
        .appendChild(
            toast
        );


    setTimeout(
        () => {

            toast.classList.add(
                "out"
            );


            setTimeout(
                () => {

                    toast.remove();

                },
                220
            );

        },
        2800
    );

}


/* ==========================================================
   TEMA
========================================================== */

function applyTheme() {

    document.body.classList.toggle(
        "light",
        state.theme === "light"
    );


    if (
        elements.themeButton
    ) {

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

    elements.kgButton?.classList.toggle(
        "active",
        state.unit === "kg"
    );


    elements.lbButton?.classList.toggle(
        "active",
        state.unit === "lb"
    );

}


function updateUnitLabels() {

    if (
        elements.mainUnit
    ) {

        elements.mainUnit.textContent =
            state.unit;

    }


    if (
        elements.targetUnit
    ) {

        elements.targetUnit.textContent =
            state.unit;

    }


    if (
        elements.oneRmUnit
    ) {

        elements.oneRmUnit.textContent =
            state.unit;

    }


    if (
        elements.estimateUnit
    ) {

        elements.estimateUnit.textContent =
            state.unit;

    }


    if (
        elements.repsWeightUnit
    ) {

        elements.repsWeightUnit.textContent =
            state.unit;

    }


    if (
        elements.repsTargetUnit
    ) {

        elements.repsTargetUnit.textContent =
            state.unit;

    }


    if (
        elements.weightForRepsOneRmUnit
    ) {

        elements.weightForRepsOneRmUnit.textContent =
            state.unit;

    }

}


function changeUnit(
    unit
) {

    if (
        unit !== "kg" &&
        unit !== "lb"
    ) {
        return;
    }


    state.unit =
        unit;


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

    calculateRequiredReps();

    calculateWeightForReps();

}


/* ==========================================================
   MODO DE DISCOS
========================================================== */

function getActivePlates() {

    return state.plateMode ===
        "calibrated"

        ? CALIBRATED_PLATES

        : STANDARD_PLATES;

}


function getPlateModeLabel() {

    return state.plateMode ===
        "calibrated"

        ? "calibrados"

        : "estándar";

}


function updatePlateModeSelect() {

    if (
        elements.plateMode
    ) {

        elements.plateMode.value =
            state.plateMode;

    }

}


function changePlateMode(
    mode
) {

    if (
        mode !== "standard" &&
        mode !== "calibrated"
    ) {
        return;
    }


    /*
     * Guardar configuración actual.
     */
    state.platesByMode[
        state.plateMode
    ] = {
        ...state.plates
    };


    state.plateMode =
        mode;


    /*
     * Cargar nuevo modo.
     */
    state.plates =
        state.platesByMode[
        mode
        ];


    /*
     * Crear si no existe.
     */
    if (
        !state.plates ||
        typeof state.plates !== "object"
    ) {

        state.plates =
            createPlateState(
                getActivePlates()
            );


        state.platesByMode[
            mode
        ] =
            state.plates;

    }


    localStorage.setItem(
        "powerload_plate_mode",
        state.plateMode
    );


    if (
        mode === "standard"
    ) {

        localStorage.setItem(
            "powerload_plates",
            JSON.stringify(
                state.plates
            )
        );

    }


    PLATES =
        getActivePlates();


    state.targetCombination =
        null;


    renderPlates();

    updateVisualBar();

    updateMainDisplay();


    showToast(
        `Modo de discos ${getPlateModeLabel()} activado.`,
        "info"
    );

}


/* ==========================================================
   BARRA
========================================================== */

function getBarWeight() {

    const value =
        Number(
            elements.barWeight?.value
        );


    return Number.isFinite(value)
        ? value
        : 45;

}


function getPlatesPerSideWeight() {

    let total = 0;


    Object.keys(
        state.plates
    ).forEach(
        weight => {

            total +=
                Number(weight) *
                Number(
                    state.plates[
                    weight
                    ]
                );

        }
    );


    return total;

}


function getTotalPlateWeight() {

    return (
        getPlatesPerSideWeight() *
        2
    );

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

    if (
        !elements.platesContainer
    ) {
        return;
    }


    PLATES =
        getActivePlates();


    elements.platesContainer
        .innerHTML = "";


    PLATES.forEach(
        plate => {

            const count =
                state.plates[
                plate.weight
                ] || 0;


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                `plate-row ${count > 0
                    ? "has-plates"
                    : ""
                }`;


            row.innerHTML = `

                <div class="plate-info">

                    <div
                        class="plate-circle plate-${plate.className}"
                    >
                        ${state.plateMode ===
                    "calibrated"
                    ? plate.kg
                    : plate.weight
                }
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


            elements.platesContainer
                .appendChild(
                    row
                );

        }
    );

}


function changePlate(
    weight,
    amount
) {

    const current =
        state.plates[
        weight
        ] || 0;


    const next =
        Math.max(
            0,
            current + amount
        );


    state.plates[
        weight
    ] =
        next;


    state.platesByMode[
        state.plateMode
    ] = {
        ...state.plates
    };


    if (
        state.plateMode ===
        "standard"
    ) {

        localStorage.setItem(
            "powerload_plates",
            JSON.stringify(
                state.plates
            )
        );

    }


    renderPlates();

    updateVisualBar();

    updateMainDisplay();

}


/* ==========================================================
   VISUALIZACIÓN DE BARRA
========================================================== */

function createVisualPlate(
    plate
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        `visual-plate visual-${plate.className}`;


    element.title =
        `${plate.label} por lado`;


    element.textContent =
        state.plateMode ===
            "calibrated"

            ? plate.kg

            : plate.weight;


    return element;

}


function renderVisualStack(
    container
) {

    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    PLATES.forEach(
        plate => {

            const count =
                state.plates[
                plate.weight
                ] || 0;


            for (
                let i = 0;
                i < count;
                i++
            ) {

                container.appendChild(
                    createVisualPlate(
                        plate
                    )
                );

            }

        }
    );

}


function updateVisualBar() {

    renderVisualStack(
        elements.leftVisual
    );


    renderVisualStack(
        elements.rightVisual
    );


    const count =
        Object.values(
            state.plates
        ).reduce(
            (
                sum,
                value
            ) =>
                sum +
                Number(value),
            0
        );


    const total =
        getCurrentTotalWeight();


    if (
        elements.visualPlateCount
    ) {

        elements.visualPlateCount.textContent =
            count;

    }


    if (
        elements.visualTotal
    ) {

        elements.visualTotal.textContent =
            formatWeight(
                total
            );

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
        fromLb(
            total,
            state.unit
        );


    const sideValue =
        fromLb(
            platesPerSide,
            state.unit
        );


    const platesTotalValue =
        fromLb(
            platesPerSide * 2,
            state.unit
        );


    const barValue =
        fromLb(
            bar,
            state.unit
        );


    if (
        elements.mainWeight
    ) {

        elements.mainWeight.textContent =
            formatNumber(
                mainValue,
                2
            );

    }


    if (
        elements.mainUnit
    ) {

        elements.mainUnit.textContent =
            state.unit;

    }


    if (
        elements.secondaryWeight
    ) {

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


    if (
        elements.sideWeight
    ) {

        elements.sideWeight.textContent =
            `${formatNumber(
                sideValue,
                2
            )} ${state.unit}`;

    }


    if (
        elements.platesWeight
    ) {

        elements.platesWeight.textContent =
            `${formatNumber(
                platesTotalValue,
                2
            )} ${state.unit}`;

    }


    if (
        elements.barDisplay
    ) {

        elements.barDisplay.textContent =
            `${formatNumber(
                barValue,
                2
            )} ${state.unit}`;

    }

}


/* ==========================================================
   LIMPIAR DISCOS
========================================================== */

function clearPlates() {

    Object.keys(
        state.plates
    ).forEach(
        weight => {

            state.plates[
                weight
            ] = 0;

        }
    );


    state.platesByMode[
        state.plateMode
    ] = {
        ...state.plates
    };


    if (
        state.plateMode ===
        "standard"
    ) {

        localStorage.setItem(
            "powerload_plates",
            JSON.stringify(
                state.plates
            )
        );

    }


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

    if (
        state.unit === "kg"
    ) {

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

    if (
        !elements.quickTargets
    ) {
        return;
    }


    elements.quickTargets.innerHTML =
        "";


    getQuickTargets()
        .forEach(
            value => {

                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.textContent =
                    `${value} ${state.unit}`;


                button.addEventListener(
                    "click",
                    () => {

                        if (
                            elements.targetWeight
                        ) {

                            elements.targetWeight.value =
                                value;

                        }


                        findTarget();

                    }
                );


                elements.quickTargets
                    .appendChild(
                        button
                    );

            }
        );

}


/* ==========================================================
   COMBINACIONES DE DISCOS
========================================================== */

/* ==========================================================
   COMBINACIONES DE DISCOS (CORREGIDA)
========================================================== */

function findBestPlateCombination(
    requiredPerSideLb
) {

    requiredPerSideLb =
        Math.max(
            0,
            Number(
                requiredPerSideLb
            ) || 0
        );


    const plates =
        getActivePlates();


    const isCalibrated =
        state.plateMode ===
        "calibrated";


    /*
     * IMPORTANTE:
     * Los discos calibrados son valores "limpios" en KG
     * (25, 20, 15, 10, 5, 2.5...). Si convertimos todo a
     * libras antes de calcular, el redondeo rompe esa
     * relación limpia y el algoritmo puede terminar
     * buscando una combinación "exacta" en libras que en
     * la práctica requiere una cantidad absurda de discos.
     *
     * Por eso, cuando el modo es calibrado, hacemos el
     * cálculo directamente en KG (la unidad nativa de esos
     * discos) y solo convertimos el resultado final de
     * vuelta a libras para mantener el resto de la app
     * funcionando igual.
     */

    const nativeRequiredPerSide =
        isCalibrated
            ? requiredPerSideLb * LB_TO_KG
            : requiredPerSideLb;


    /*
     * Precisión de 0.01 en la unidad nativa.
     */
    const SCALE = 100;


    const targetUnits =
        Math.round(
            nativeRequiredPerSide *
            SCALE
        );


    const denominations =
        plates.map(
            plate => {

                const nativeValue =
                    isCalibrated
                        ? plate.kg
                        : plate.weight;


                return Math.max(
                    1,
                    Math.round(
                        nativeValue *
                        SCALE
                    )
                );

            }
        );


    /*
     * Protección contra objetivos
     * absurdamente grandes.
     */
    const MAX_TARGET_UNITS =
        1000000;


    const safeTargetUnits =
        Math.min(
            targetUnits,
            MAX_TARGET_UNITS
        );


    const dp =
        new Array(
            safeTargetUnits + 1
        ).fill(null);


    dp[0] = {

        count: 0,

        combo:
            new Array(
                plates.length
            ).fill(0)

    };


    for (
        let total = 1;
        total <= safeTargetUnits;
        total++
    ) {

        let best = null;


        denominations.forEach(
            (
                denomination,
                index
            ) => {

                if (
                    total >= denomination &&
                    dp[
                    total -
                    denomination
                    ]
                ) {

                    const previous =
                        dp[
                        total -
                        denomination
                        ];


                    const candidate = {

                        count:
                            previous.count +
                            1,

                        combo:
                            [
                                ...previous.combo
                            ]

                    };


                    candidate.combo[
                        index
                    ]++;


                    if (
                        !best ||
                        candidate.count <
                        best.count
                    ) {

                        best =
                            candidate;

                    }

                }

            }
        );


        dp[total] =
            best;

    }


    let result =
        dp[
        safeTargetUnits
        ];


    /*
     * Buscar la combinación más cercana
     * cuando no existe exacta.
     */
    if (!result) {

        let closest =
            null;


        for (
            let i =
                safeTargetUnits;
            i >= 0;
            i--
        ) {

            if (
                dp[i]
            ) {

                closest =
                    dp[i];

                break;

            }

        }


        result =
            closest || {

                count: 0,

                combo:
                    new Array(
                        plates.length
                    ).fill(0)

            };

    }


    const combination = {};


    plates.forEach(
        (
            plate,
            index
        ) => {

            combination[
                plate.weight
            ] =
                result.combo[
                index
                ] || 0;

        }
    );


    const actualPerSideNative =
        plates.reduce(
            (
                sum,
                plate,
                index
            ) => {

                const nativeValue =
                    isCalibrated
                        ? plate.kg
                        : plate.weight;


                return sum +
                    nativeValue *
                    result.combo[index];

            },
            0
        );


    /*
     * Convertimos de vuelta a libras (unidad interna
     * del resto de la app) solo si calculamos en KG.
     */
    const actualPerSide =
        isCalibrated
            ? actualPerSideNative * KG_TO_LB
            : actualPerSideNative;


    return {

        combination,

        requestedPerSide:
            requiredPerSideLb,

        actualPerSide,

        differencePerSide:
            actualPerSide -
            requiredPerSideLb,

        totalPlateWeight:
            actualPerSide * 2

    };

}



/* ==========================================================
   ENCONTRAR OBJETIVO
========================================================== */

function findTarget() {

    if (
        !elements.targetWeight
    ) {
        return;
    }


    const inputValue =
        Number(
            elements.targetWeight.value
        );


    if (
        !Number.isFinite(
            inputValue
        ) ||
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
        targetLb -
        barLb;


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
        realTotal -
        targetLb;


    state.targetCombination = {

        ...result,

        targetLb,

        barLb,

        realTotal,

        difference,

        plateMode:
            state.plateMode

    };


    displayTargetResult(
        state.targetCombination
    );

}


/* ==========================================================
   MOSTRAR RESULTADO OBJETIVO
========================================================== */

function displayTargetResult(
    result
) {

    if (
        !elements.targetResult
    ) {
        return;
    }


    elements.targetResult
        .classList.remove(
            "hidden"
        );


    const absoluteDifference =
        Math.abs(
            result.difference
        );


    let accuracyClass =
        "exact";


    let accuracyText =
        "EXACTO";


    if (
        absoluteDifference >
        0.01
    ) {

        if (
            absoluteDifference <=
            (
                state.plateMode ===
                    "calibrated"
                    ? 1
                    : 2.5
            )
        ) {

            accuracyClass =
                "close";

            accuracyText =
                "CERCANO";

        } else {

            accuracyClass =
                "unavailable";

            accuracyText =
                "APROXIMADO";

        }

    }


    if (
        elements.targetAccuracy
    ) {

        elements.targetAccuracy.className =
            `accuracy ${accuracyClass}`;


        elements.targetAccuracy.textContent =
            accuracyText;

    }


    if (
        elements.targetResultTitle
    ) {

        elements.targetResultTitle.textContent =
            accuracyText ===
                "EXACTO"

                ? "Combinación recomendada"

                : "Mejor combinación disponible";

    }


    if (
        elements.targetCombination
    ) {

        elements.targetCombination.innerHTML =
            "";


        PLATES.forEach(
            plate => {

                const count =
                    result.combination[
                    plate.weight
                    ] || 0;


                if (
                    count <= 0
                ) {
                    return;
                }


                const chip =
                    document.createElement(
                        "div"
                    );


                chip.className =
                    "plate-chip";


                chip.textContent =
                    `${count} × ${plate.label}`;


                elements.targetCombination
                    .appendChild(
                        chip
                    );

            }
        );


        if (
            elements.targetCombination
                .children.length === 0
        ) {

            const chip =
                document.createElement(
                    "div"
                );


            chip.className =
                "plate-chip";


            chip.textContent =
                "Sin discos";


            elements.targetCombination
                .appendChild(
                    chip
                );

        }

    }


    if (
        elements.targetRequested
    ) {

        elements.targetRequested.textContent =
            formatWeight(
                result.targetLb
            );

    }


    if (
        elements.targetReal
    ) {

        elements.targetReal.textContent =
            formatWeight(
                result.realTotal
            );

    }


    if (
        elements.targetDifference
    ) {

        const sign =
            result.difference > 0
                ? "+"
                : "";


        elements.targetDifference.textContent =
            `${sign}${formatWeight(
                result.difference
            )}`;

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


    if (
        result.plateMode &&
        result.plateMode !==
        state.plateMode
    ) {

        changePlateMode(
            result.plateMode
        );

    }


    Object.keys(
        state.plates
    ).forEach(
        weight => {

            state.plates[
                weight
            ] =
                result.combination[
                weight
                ] || 0;

        }
    );


    state.platesByMode[
        state.plateMode
    ] = {
        ...state.plates
    };


    if (
        state.plateMode ===
        "standard"
    ) {

        localStorage.setItem(
            "powerload_plates",
            JSON.stringify(
                state.plates
            )
        );

    }


    renderPlates();

    updateVisualBar();

    updateMainDisplay();


    addHistory({

        weight:
            result.realTotal,

        plates:
        {
            ...state.plates
        },

        bar:
            result.barLb,

        plateMode:
            state.plateMode

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
   FÓRMULAS DE 1RM
========================================================== */

function calculateOneRMValue(
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


    if (
        reps === 1
    ) {

        return weight;

    }


    switch (
    formula
    ) {

        case "brzycki":

            /*
             * Fórmula Brzycki.
             */
            if (
                reps >= 37
            ) {

                return weight;

            }


            return (
                weight *
                (
                    36 /
                    (
                        37 -
                        reps
                    )
                )
            );


        case "lombardi":

            return (
                weight *
                Math.pow(
                    reps,
                    0.10
                )
            );


        case "epley":

        default:

            return (
                weight *
                (
                    1 +
                    reps / 30
                )
            );

    }

}


/* ==========================================================
   INVERSA DE 1RM
   PESO + 1RM → REPS
========================================================== */

function calculateRequiredRepsValue(
    weight,
    targetOneRm,
    formula
) {

    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(targetOneRm) ||
        weight <= 0 ||
        targetOneRm <= 0
    ) {

        return 0;

    }


    /*
     * Si el peso ya representa o supera
     * el objetivo, usamos 1 repetición.
     */
    if (
        targetOneRm <= weight
    ) {

        return 1;

    }


    let reps = 0;


    switch (
    formula
    ) {

        case "brzycki":

            reps =
                37 -
                (
                    36 *
                    weight /
                    targetOneRm
                );

            break;


        case "lombardi":

            reps =
                Math.pow(
                    targetOneRm /
                    weight,
                    10
                );

            break;


        case "epley":

        default:

            reps =
                30 *
                (
                    targetOneRm /
                    weight -
                    1
                );

            break;

    }


    if (
        !Number.isFinite(reps) ||
        reps <= 0
    ) {

        return 0;

    }


    return Math.ceil(
        reps
    );

}


/* ==========================================================
   INVERSA:
   1RM + REPS → PESO
========================================================== */

function calculateWeightForRepsValue(
    oneRm,
    reps,
    formula
) {

    if (
        !Number.isFinite(oneRm) ||
        !Number.isFinite(reps) ||
        oneRm <= 0 ||
        reps <= 0
    ) {

        return 0;

    }


    /*
     * Una repetición equivale al 1RM.
     */
    if (
        reps === 1
    ) {

        return oneRm;

    }


    let weight = 0;


    switch (
    formula
    ) {

        case "brzycki":

            /*
             *
             * 1RM = peso × 36 / (37 - reps)
             *
             * peso = 1RM × (37 - reps) / 36
             *
             */

            if (
                reps >= 37
            ) {

                return 0;

            }


            weight =
                oneRm *
                (
                    37 -
                    reps
                ) /
                36;

            break;


        case "lombardi":

            /*
             *
             * 1RM = peso × reps^0.10
             *
             * peso = 1RM / reps^0.10
             *
             */

            weight =
                oneRm /
                Math.pow(
                    reps,
                    0.10
                );

            break;


        case "epley":

        default:

            /*
             *
             * 1RM =
             * peso × (1 + reps / 30)
             *
             *
             * peso =
             * 1RM / (1 + reps / 30)
             *
             */

            weight =
                oneRm /
                (
                    1 +
                    reps / 30
                );

            break;

    }


    if (
        !Number.isFinite(weight) ||
        weight <= 0
    ) {

        return 0;

    }


    return weight;

}


/* ==========================================================
   CALCULADORA 1RM POR PORCENTAJE
========================================================== */

function calculateOneRM() {

    const input =
        Number(
            elements.oneRm?.value
        );


    const percentage =
        Number(
            elements.percentage?.value
        );


    if (
        !Number.isFinite(input) ||
        input <= 0 ||
        !Number.isFinite(
            percentage
        )
    ) {

        if (
            elements.rmResult
        ) {

            elements.rmResult.textContent =
                `0 ${state.unit}`;

        }


        renderPercentageGrid(
            0
        );


        return;

    }


    const oneRmLb =
        toLb(
            input,
            state.unit
        );


    const resultLb =
        oneRmLb *
        percentage;


    if (
        elements.rmResult
    ) {

        elements.rmResult.textContent =
            formatWeight(
                resultLb
            );

    }


    renderPercentageGrid(
        oneRmLb
    );

}


/* ==========================================================
   TABLA DE PORCENTAJES
========================================================== */

function renderPercentageGrid(
    oneRmLb
) {

    if (
        !elements.percentageGrid
    ) {
        return;
    }


    elements.percentageGrid.innerHTML =
        "";


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
        Number(
            elements.percentage?.value
        ) || 0;


    percentages.forEach(
        percent => {

            const cell =
                document.createElement(
                    "div"
                );


            cell.className =
                "percentage-cell";


            if (
                Math.abs(
                    percent / 100 -
                    selected
                ) < 0.0001
            ) {

                cell.classList.add(
                    "active"
                );

            }


            const valueLb =
                oneRmLb > 0

                    ? oneRmLb *
                    (
                        percent /
                        100
                    )

                    : 0;


            cell.innerHTML = `

                <span>
                    ${percent}%
                </span>

                <strong>
                    ${formatWeight(
                valueLb
            )}
                </strong>

            `;


            cell.addEventListener(
                "click",
                () => {

                    if (
                        elements.percentage
                    ) {

                        elements.percentage.value =
                            String(
                                percent /
                                100
                            );

                    }


                    calculateOneRM();

                }
            );


            elements.percentageGrid
                .appendChild(
                    cell
                );

        }
    );

}


/* ==========================================================
   ESTIMADOR DE 1RM
========================================================== */

function calculateEstimatedOneRM() {

    const weight =
        Number(
            elements.estimateWeight?.value
        );


    const reps =
        Number(
            elements.estimateReps?.value
        );


    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(reps) ||
        weight <= 0 ||
        reps < 1
    ) {

        if (
            elements.estimatedOneRm
        ) {

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


    const estimatedLb =
        calculateOneRMValue(
            weightLb,
            reps,
            state.formula
        );


    if (
        elements.estimatedOneRm
    ) {

        elements.estimatedOneRm.textContent =
            formatWeight(
                estimatedLb
            );

    }


    return estimatedLb;

}


/* ==========================================================
   CALCULADORA:
   ¿CUÁNTAS REPS NECESITO?
========================================================== */

function calculateRequiredReps() {

    if (
        !elements.repsWeight ||
        !elements.repsTarget
    ) {

        return 0;

    }


    const weight =
        Number(
            elements.repsWeight.value
        );


    const target =
        Number(
            elements.repsTarget.value
        );


    if (
        !Number.isFinite(weight) ||
        !Number.isFinite(target) ||
        weight <= 0 ||
        target <= 0
    ) {

        if (
            elements.requiredRepsResult
        ) {

            elements.requiredRepsResult
                .classList.add(
                    "hidden"
                );

        }


        return 0;

    }


    const weightLb =
        toLb(
            weight,
            state.unit
        );


    const targetLb =
        toLb(
            target,
            state.unit
        );


    const reps =
        calculateRequiredRepsValue(
            weightLb,
            targetLb,
            state.repsFormula
        );


    if (
        !Number.isFinite(reps) ||
        reps <= 0
    ) {

        showToast(
            "No se pudo calcular las repeticiones.",
            "warning"
        );


        return 0;

    }


    const estimatedLb =
        calculateOneRMValue(
            weightLb,
            reps,
            state.repsFormula
        );


    if (
        elements.requiredReps
    ) {

        elements.requiredReps.textContent =
            reps;

    }


    if (
        elements.requiredRepsWeight
    ) {

        elements.requiredRepsWeight.textContent =
            formatWeight(
                weightLb
            );

    }


    if (
        elements.requiredRepsTarget
    ) {

        elements.requiredRepsTarget.textContent =
            formatWeight(
                targetLb
            );

    }


    if (
        elements.requiredRepsEstimatedRm
    ) {

        elements.requiredRepsEstimatedRm.textContent =
            formatWeight(
                estimatedLb
            );

    }


    if (
        elements.requiredRepsMessage
    ) {

        const difference =
            estimatedLb -
            targetLb;


        if (
            Math.abs(
                difference
            ) <=
            targetLb * 0.01
        ) {

            elements.requiredRepsMessage.textContent =
                `Con ${reps} repeticiones, ` +
                `el 1RM estimado sería aproximadamente ` +
                `${formatWeight(
                    estimatedLb
                )}.`;

        } else if (
            difference > 0
        ) {

            elements.requiredRepsMessage.textContent =
                `Con ${reps} repeticiones, ` +
                `la estimación supera ligeramente ` +
                `el objetivo.`;

        } else {

            elements.requiredRepsMessage.textContent =
                `La estimación queda por debajo ` +
                `del objetivo.`;

        }

    }


    if (
        elements.requiredRepsResult
    ) {

        elements.requiredRepsResult
            .classList.remove(
                "hidden"
            );

    }


    return reps;

}


/* ==========================================================
   CALCULADORA:
   ¿QUÉ PESO NECESITO PARA X REPS?
========================================================== */

/* ==========================================================
   CALCULADORA:
   ¿QUÉ PESO NECESITO PARA X REPS? (CORREGIDA)
========================================================== */

function calculateWeightForReps() {

    if (
        !elements.weightForRepsOneRm ||
        !elements.weightForRepsReps
    ) {

        return 0;

    }


    const oneRm =
        Number(
            elements.weightForRepsOneRm.value
        );


    const reps =
        Number(
            elements.weightForRepsReps.value
        );


    if (
        !Number.isFinite(oneRm) ||
        !Number.isFinite(reps) ||
        oneRm <= 0 ||
        reps <= 0
    ) {

        if (
            elements.weightForRepsResult
        ) {

            elements.weightForRepsResult
                .classList.add(
                    "hidden"
                );

        }


        return 0;

    }


    /*
     * Límite práctico.
     *
     * Brzycki deja de ser válido a partir
     * de 37 repeticiones.
     */
    if (
        state.weightForRepsFormula ===
        "brzycki" &&
        reps >= 37
    ) {

        showToast(
            "Brzycki no es válida para 37 reps o más.",
            "warning"
        );


        if (
            elements.weightForRepsResult
        ) {

            elements.weightForRepsResult
                .classList.add(
                    "hidden"
                );

        }


        return 0;

    }


    const oneRmLb =
        toLb(
            oneRm,
            state.unit
        );


    const weightLb =
        calculateWeightForRepsValue(
            oneRmLb,
            reps,
            state.weightForRepsFormula
        );


    if (
        !Number.isFinite(
            weightLb
        ) ||
        weightLb <= 0
    ) {

        showToast(
            "No se pudo calcular el peso.",
            "warning"
        );


        return 0;

    }


    const weightDisplay =
        fromLb(
            weightLb,
            state.unit
        );


    if (
        elements.weightForRepsResultValue
    ) {

        elements.weightForRepsResultValue.textContent =
            formatNumber(
                weightDisplay,
                2
            );

    }


    if (
        elements.weightForRepsResultUnit
    ) {

        elements.weightForRepsResultUnit.textContent =
            state.unit;

    }


    if (
        elements.weightForRepsReferenceRm
    ) {

        elements.weightForRepsReferenceRm.textContent =
            formatWeight(
                oneRmLb
            );

    }


    if (
        elements.weightForRepsTargetRepsDisplay
    ) {

        elements.weightForRepsTargetRepsDisplay.textContent =
            reps;

    }


    if (
        elements.weightForRepsPercentage
    ) {

        const percent =
            (
                weightLb /
                oneRmLb
            ) * 100;


        elements.weightForRepsPercentage.textContent =
            `${formatNumber(
                percent,
                1
            )}%`;

    }


    if (
        elements.weightForRepsMessage
    ) {

        elements.weightForRepsMessage.textContent =
            `Para un 1RM estimado de ` +
            `${formatWeight(
                oneRmLb
            )}, el peso aproximado para ` +
            `${reps} repetición${reps === 1
                ? ""
                : "es"
            } sería ` +
            `${formatWeight(
                weightLb
            )}.`;

    }


    if (
        elements.weightForRepsResult
    ) {

        elements.weightForRepsResult
            .classList.remove(
                "hidden"
            );

    }


    return weightLb;

}


/* ==========================================================
   FÓRMULA DE REPS
========================================================== */

function setRepsFormula(
    formula
) {

    if (
        formula !== "epley" &&
        formula !== "brzycki" &&
        formula !== "lombardi"
    ) {

        return;

    }


    state.repsFormula =
        formula;


    document
        .querySelectorAll(
            ".reps-formula-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset
                        .repsFormula ===
                    formula
                );

            }
        );


    calculateRequiredReps();

}


/* ==========================================================
   FÓRMULA:
   ¿QUÉ PESO NECESITO?
========================================================== */

function setWeightForRepsFormula(
    formula
) {

    if (
        formula !== "epley" &&
        formula !== "brzycki" &&
        formula !== "lombardi"
    ) {

        return;

    }


    state.weightForRepsFormula =
        formula;


    document
        .querySelectorAll(
            ".weight-for-reps-formula-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset
                        .weightForRepsFormula ===
                    formula
                );

            }
        );


    calculateWeightForReps();

}


/* ==========================================================
   ENVIAR 1RM AL OBJETIVO
========================================================== */

function sendRmToTarget() {

    const input =
        Number(
            elements.oneRm?.value
        );


    const percentage =
        Number(
            elements.percentage?.value
        );


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
        oneRmLb *
        percentage;


    const targetValue =
        fromLb(
            targetLb,
            state.unit
        );


    if (
        elements.targetWeight
    ) {

        elements.targetWeight.value =
            round(
                targetValue,
                2
            );

    }


    findTarget();


    elements.targetWeight
        ?.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


    showToast(
        "Carga enviada al objetivo.",
        "success"
    );

}


/* ==========================================================
   ENVIAR 1RM ESTIMADO AL OBJETIVO
========================================================== */

function sendEstimatedToTarget() {

    const estimatedLb =
        calculateEstimatedOneRM();


    if (
        !Number.isFinite(
            estimatedLb
        ) ||
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


    if (
        elements.targetWeight
    ) {

        elements.targetWeight.value =
            round(
                targetValue,
                2
            );

    }


    findTarget();


    elements.targetWeight
        ?.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


    showToast(
        "1RM estimado enviado al objetivo.",
        "success"
    );

}


/* ==========================================================
   ENVIAR OBJETIVO DE REPS
========================================================== */

function sendRepsTargetToTarget() {

    const target =
        Number(
            elements.repsTarget?.value
        );


    if (
        !Number.isFinite(
            target
        ) ||
        target <= 0
    ) {

        showToast(
            "Ingresa un 1RM objetivo válido.",
            "warning"
        );


        return;

    }


    if (
        elements.targetWeight
    ) {

        elements.targetWeight.value =
            round(
                target,
                2
            );

    }


    findTarget();


    elements.targetWeight
        ?.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


    showToast(
        "Peso objetivo enviado a la calculadora de discos.",
        "success"
    );

}


/* ==========================================================
   ENVIAR PESO DE X REPS AL OBJETIVO
========================================================== */

function sendWeightForRepsToTarget() {

    const weightLb =
        calculateWeightForReps();


    if (
        !Number.isFinite(
            weightLb
        ) ||
        weightLb <= 0
    ) {

        showToast(
            "Completa el 1RM y las repeticiones.",
            "warning"
        );


        return;

    }


    const targetValue =
        fromLb(
            weightLb,
            state.unit
        );


    if (
        elements.targetWeight
    ) {

        elements.targetWeight.value =
            round(
                targetValue,
                2
            );

    }


    findTarget();


    elements.targetWeight
        ?.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


    showToast(
        "Peso calculado enviado al objetivo.",
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
        {
            ...state.plates
        },

        plateMode:
            state.plateMode,

        date:
            new Date().toISOString()

    };

}


function saveCurrentFavorite() {

    const config =
        getCurrentConfiguration();


    const duplicate =
        state.favorites.some(
            item =>

                item.bar ===
                config.bar &&

                item.plateMode ===
                config.plateMode &&

                JSON.stringify(
                    item.plates
                ) ===
                JSON.stringify(
                    config.plates
                )
        );


    if (
        duplicate
    ) {

        showToast(
            "Esta configuración ya está guardada.",
            "warning"
        );


        return;

    }


    state.favorites.unshift(
        config
    );


    state.favorites =
        state.favorites.slice(
            0,
            20
        );


    localStorage.setItem(
        "powerload_favorites",
        JSON.stringify(
            state.favorites
        )
    );


    renderFavorites();


    showToast(
        "Configuración guardada en favoritos.",
        "success"
    );

}


function renderFavorites() {

    if (
        !elements.favoritesContainer
    ) {
        return;
    }


    elements.favoritesContainer
        .innerHTML =
        "";


    if (
        state.favorites.length === 0
    ) {

        elements.favoritesContainer.innerHTML =
            `
            <div class="empty">
                No tienes configuraciones guardadas.
            </div>
            `;


        return;

    }


    state.favorites.forEach(
        (
            favorite,
            index
        ) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "favorite-item";


            const platesText =
                getCombinationText(
                    favorite.plates,
                    favorite.plateMode
                );


            const modeText =
                favorite.plateMode ===
                    "calibrated"

                    ? "Calibrados"

                    : "Estándar";


            item.innerHTML = `

                <div>

                    <div class="item-weight">
                        ${formatWeight(
                favorite.weight
            )}
                    </div>

                    <div class="item-detail">
                        ${escapeHTML(
                platesText
            )}
                    </div>

                    <div class="item-detail">
                        ${modeText}
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
                .appendChild(
                    item
                );

        }
    );

}


function loadFavorite(
    index
) {

    const favorite =
        state.favorites[
        index
        ];


    if (!favorite) {
        return;
    }


    const mode =
        favorite.plateMode ===
            "calibrated"

            ? "calibrated"

            : "standard";


    if (
        state.plateMode !==
        mode
    ) {

        changePlateMode(
            mode
        );

    }


    state.barWeight =
        Number(
            favorite.bar
        ) || 45;


    if (
        elements.barWeight
    ) {

        elements.barWeight.value =
            String(
                state.barWeight
            );

    }


    const available =
        getActivePlates();


    const newPlates =
        createPlateState(
            available
        );


    Object.keys(
        newPlates
    ).forEach(
        weight => {

            newPlates[
                weight
            ] =
                Number(
                    favorite
                        .plates?.[
                    weight
                    ]
                ) || 0;

        }
    );


    state.plates =
        newPlates;


    state.platesByMode[
        mode
    ] = {
        ...state.plates
    };


    renderPlates();

    updateVisualBar();

    updateMainDisplay();


    showToast(
        "Favorito aplicado.",
        "success"
    );

}


function deleteFavorite(
    index
) {

    if (
        !state.favorites[
        index
        ]
    ) {
        return;
    }


    state.favorites.splice(
        index,
        1
    );


    localStorage.setItem(
        "powerload_favorites",
        JSON.stringify(
            state.favorites
        )
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

function getCombinationText(
    plates,
    mode = state.plateMode
) {

    const parts = [];


    const available =
        mode === "calibrated"

            ? CALIBRATED_PLATES

            : STANDARD_PLATES;


    available.forEach(
        plate => {

            const count =
                Number(
                    plates?.[
                    plate.weight
                    ]
                ) || 0;


            if (
                count > 0
            ) {

                parts.push(
                    `${count}×${plate.label}`
                );

            }

        }
    );


    return parts.length
        ? parts.join(
            " + "
        )
        : "Sin discos";

}


function addHistory(
    config
) {

    const entry = {

        weight:
            config.weight,

        bar:
            config.bar,

        plates:
        {
            ...config.plates
        },

        plateMode:
            config.plateMode ||
            state.plateMode,

        date:
            new Date().toISOString()

    };


    state.history.unshift(
        entry
    );


    state.history =
        state.history.slice(
            0,
            30
        );


    localStorage.setItem(
        "powerload_history",
        JSON.stringify(
            state.history
        )
    );


    renderHistory();

}


function renderHistory() {

    if (
        !elements.historyContainer
    ) {
        return;
    }


    elements.historyContainer
        .innerHTML =
        "";


    if (
        state.history.length === 0
    ) {

        elements.historyContainer.innerHTML =
            `
            <div class="empty">
                No hay configuraciones en el historial.
            </div>
            `;


        return;

    }


    state.history.forEach(
        (
            entry,
            index
        ) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "history-item";


            const date =
                new Date(
                    entry.date
                );


            const dateText =
                Number.isNaN(
                    date.getTime()
                )

                    ? ""

                    : date.toLocaleString(
                        "es-CO",
                        {
                            day:
                                "2-digit",

                            month:
                                "2-digit",

                            hour:
                                "2-digit",

                            minute:
                                "2-digit"
                        }
                    );


            const modeText =
                entry.plateMode ===
                    "calibrated"

                    ? "Calibrados"

                    : "Estándar";


            item.innerHTML = `

                <div>

                    <div class="item-weight">
                        ${formatWeight(
                entry.weight
            )}
                    </div>

                    <div class="item-detail">

                        ${escapeHTML(
                getCombinationText(
                    entry.plates,
                    entry.plateMode
                )
            )}

                        · ${modeText}

                        ${dateText
                    ? ` · ${dateText}`
                    : ""
                }

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
                .appendChild(
                    item
                );

        }
    );

}


function loadHistory(
    index
) {

    const entry =
        state.history[
        index
        ];


    if (!entry) {
        return;
    }


    const mode =
        entry.plateMode ===
            "calibrated"

            ? "calibrated"

            : "standard";


    if (
        state.plateMode !==
        mode
    ) {

        changePlateMode(
            mode
        );

    }


    state.barWeight =
        Number(
            entry.bar
        ) || 45;


    if (
        elements.barWeight
    ) {

        elements.barWeight.value =
            String(
                state.barWeight
            );

    }


    const available =
        getActivePlates();


    const newPlates =
        createPlateState(
            available
        );


    Object.keys(
        newPlates
    ).forEach(
        weight => {

            newPlates[
                weight
            ] =
                Number(
                    entry
                        .plates?.[
                    weight
                    ]
                ) || 0;

        }
    );


    state.plates =
        newPlates;


    state.platesByMode[
        mode
    ] = {
        ...state.plates
    };


    renderPlates();

    updateVisualBar();

    updateMainDisplay();


    showToast(
        "Configuración del historial aplicada.",
        "success"
    );

}


function deleteHistory(
    index
) {

    if (
        !state.history[
        index
        ]
    ) {
        return;
    }


    state.history.splice(
        index,
        1
    );


    localStorage.setItem(
        "powerload_history",
        JSON.stringify(
            state.history
        )
    );


    renderHistory();


    showToast(
        "Registro eliminado.",
        "info"
    );

}


function clearHistory() {

    if (
        state.history.length === 0
    ) {
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

    if (
        !elements.platesContainer
    ) {
        return;
    }


    elements.platesContainer
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (!button) {
                    return;
                }


                const weight =
                    Number(
                        button.dataset.weight
                    );


                if (
                    !Number.isFinite(
                        weight
                    )
                ) {
                    return;
                }


                const action =
                    button.dataset.action;


                if (
                    action ===
                    "increase"
                ) {

                    changePlate(
                        weight,
                        1
                    );

                }


                if (
                    action ===
                    "decrease"
                ) {

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

    if (
        !elements.favoritesContainer
    ) {
        return;
    }


    elements.favoritesContainer
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (!button) {
                    return;
                }


                const index =
                    Number(
                        button.dataset.index
                    );


                if (
                    !Number.isInteger(
                        index
                    )
                ) {
                    return;
                }


                if (
                    button.dataset.action ===
                    "load"
                ) {

                    loadFavorite(
                        index
                    );

                }


                if (
                    button.dataset.action ===
                    "delete"
                ) {

                    deleteFavorite(
                        index
                    );

                }

            }
        );

}


/* ==========================================================
   EVENTOS — HISTORIAL
========================================================== */

function setupHistoryEvents() {

    if (
        !elements.historyContainer
    ) {
        return;
    }


    elements.historyContainer
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button"
                    );


                if (!button) {
                    return;
                }


                const index =
                    Number(
                        button.dataset.index
                    );


                if (
                    !Number.isInteger(
                        index
                    )
                ) {
                    return;
                }


                if (
                    button.dataset.action ===
                    "load"
                ) {

                    loadHistory(
                        index
                    );

                }


                if (
                    button.dataset.action ===
                    "delete"
                ) {

                    deleteHistory(
                        index
                    );

                }

            }
        );

}


/* ==========================================================
   ENTER — UTILIDAD
========================================================== */

function setupEnter(
    element,
    callback
) {

    element?.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                callback();

            }

        }
    );

}


/* ==========================================================
   EVENTOS GENERALES
========================================================== */

function setupEvents() {

    /* ======================================================
       TEMA
    ====================================================== */

    elements.themeButton
        ?.addEventListener(
            "click",
            toggleTheme
        );


    /* ======================================================
       UNIDADES
    ====================================================== */

    elements.kgButton
        ?.addEventListener(
            "click",
            () =>
                changeUnit(
                    "kg"
                )
        );


    elements.lbButton
        ?.addEventListener(
            "click",
            () =>
                changeUnit(
                    "lb"
                )
        );


    /* ======================================================
       DISCOS
    ====================================================== */

    elements.clearPlates
        ?.addEventListener(
            "click",
            clearPlates
        );


    elements.plateMode
        ?.addEventListener(
            "change",
            () => {

                changePlateMode(
                    elements
                        .plateMode
                        .value
                );

            }
        );


    elements.barWeight
        ?.addEventListener(
            "change",
            () => {

                state.barWeight =
                    getBarWeight();


                updateMainDisplay();

                updateVisualBar();

            }
        );


    /* ======================================================
       OBJETIVO
    ====================================================== */

    elements.calculateTarget
        ?.addEventListener(
            "click",
            findTarget
        );


    elements.applyTarget
        ?.addEventListener(
            "click",
            applyTargetConfiguration
        );


    /* ======================================================
       FAVORITOS
    ====================================================== */

    elements.saveCurrentButton
        ?.addEventListener(
            "click",
            saveCurrentFavorite
        );


    elements.clearFavorites
        ?.addEventListener(
            "click",
            clearFavorites
        );


    /* ======================================================
       HISTORIAL
    ====================================================== */

    elements.clearHistory
        ?.addEventListener(
            "click",
            clearHistory
        );


    /* ======================================================
       CALCULADORA 1RM
    ====================================================== */

    elements.oneRm
        ?.addEventListener(
            "input",
            calculateOneRM
        );


    elements.percentage
        ?.addEventListener(
            "change",
            calculateOneRM
        );


    elements.sendRmToTarget
        ?.addEventListener(
            "click",
            sendRmToTarget
        );


    /*
     * Fórmulas de 1RM.
     */
    document
        .querySelectorAll(
            ".formula-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const formula =
                            button.dataset.formula;


                        if (
                            formula !==
                            "epley" &&
                            formula !==
                            "brzycki" &&
                            formula !==
                            "lombardi"
                        ) {

                            return;

                        }


                        state.formula =
                            formula;


                        document
                            .querySelectorAll(
                                ".formula-button"
                            )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item.dataset
                                            .formula ===
                                        formula
                                    );

                                }
                            );


                        calculateEstimatedOneRM();

                    }
                );

            }
        );


    /* ======================================================
       ESTIMADOR 1RM
    ====================================================== */

    elements.estimateWeight
        ?.addEventListener(
            "input",
            calculateEstimatedOneRM
        );


    elements.estimateReps
        ?.addEventListener(
            "input",
            calculateEstimatedOneRM
        );


    elements.sendEstimatedToTarget
        ?.addEventListener(
            "click",
            sendEstimatedToTarget
        );


    /* ======================================================
       CALCULADORA:
       ¿CUÁNTAS REPS?
    ====================================================== */

    elements.repsWeight
        ?.addEventListener(
            "input",
            calculateRequiredReps
        );


    elements.repsTarget
        ?.addEventListener(
            "input",
            calculateRequiredReps
        );


    elements.calculateRequiredReps
        ?.addEventListener(
            "click",
            calculateRequiredReps
        );


    elements.sendRepsTargetToTarget
        ?.addEventListener(
            "click",
            sendRepsTargetToTarget
        );


    /*
     * Fórmulas de la calculadora inversa.
     */
    document
        .querySelectorAll(
            ".reps-formula-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        setRepsFormula(
                            button.dataset
                                .repsFormula
                        );

                    }
                );

            }
        );


    /* ======================================================
       CALCULADORA:
       ¿QUÉ PESO PARA X REPS?
    ====================================================== */

    elements.weightForRepsOneRm
        ?.addEventListener(
            "input",
            calculateWeightForReps
        );


    elements.weightForRepsReps
        ?.addEventListener(
            "input",
            calculateWeightForReps
        );


    elements.calculateWeightForReps
        ?.addEventListener(
            "click",
            calculateWeightForReps
        );


    elements.sendWeightForRepsToTarget
        ?.addEventListener(
            "click",
            sendWeightForRepsToTarget
        );


    /*
     * Fórmulas de la nueva calculadora.
     */
    document
        .querySelectorAll(
            ".weight-for-reps-formula-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        setWeightForRepsFormula(
                            button.dataset
                                .weightForRepsFormula
                        );

                    }
                );

            }
        );


    /* ======================================================
       ENTER — OBJETIVO
    ====================================================== */

    setupEnter(
        elements.targetWeight,
        findTarget
    );


    /* ======================================================
       ENTER — 1RM
    ====================================================== */

    setupEnter(
        elements.oneRm,
        calculateOneRM
    );


    /* ======================================================
       ENTER — ESTIMADOR
    ====================================================== */

    setupEnter(
        elements.estimateWeight,
        calculateEstimatedOneRM
    );


    setupEnter(
        elements.estimateReps,
        calculateEstimatedOneRM
    );


    /* ======================================================
       ENTER — REPS
    ====================================================== */

    setupEnter(
        elements.repsWeight,
        calculateRequiredReps
    );


    setupEnter(
        elements.repsTarget,
        calculateRequiredReps
    );


    /* ======================================================
       ENTER — PESO PARA REPS
    ====================================================== */

    setupEnter(
        elements.weightForRepsOneRm,
        calculateWeightForReps
    );


    setupEnter(
        elements.weightForRepsReps,
        calculateWeightForReps
    );


    /* ======================================================
       SISTEMAS
    ====================================================== */

    setupPlateEvents();

    setupFavoriteEvents();

    setupHistoryEvents();

}


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

function initialize() {

    /* ======================================================
       TEMA
    ====================================================== */

    applyTheme();


    /* ======================================================
       UNIDAD
    ====================================================== */

    updateUnitButtons();

    updateUnitLabels();


    /* ======================================================
       MODO DE DISCOS
    ====================================================== */

    updatePlateModeSelect();


    PLATES =
        getActivePlates();


    state.plates =
        state.platesByMode[
        state.plateMode
        ];


    /* ======================================================
       BARRA
    ====================================================== */

    state.barWeight =
        getBarWeight();


    /* ======================================================
       DISCOS
    ====================================================== */

    renderPlates();


    /* ======================================================
       VISUAL
    ====================================================== */

    updateVisualBar();


    /* ======================================================
       HERO
    ====================================================== */

    updateMainDisplay();


    /* ======================================================
       OBJETIVOS
    ====================================================== */

    updateQuickTargets();


    /* ======================================================
       1RM
    ====================================================== */

    calculateOneRM();


    /* ======================================================
       ESTIMADOR 1RM
    ====================================================== */

    calculateEstimatedOneRM();


    /* ======================================================
       CALCULADORA DE REPS
    ====================================================== */

    setRepsFormula(
        "epley"
    );


    /* ======================================================
       CALCULADORA DE PESO PARA REPS
    ====================================================== */

    setWeightForRepsFormula(
        "epley"
    );


    /* ======================================================
       FAVORITOS
    ====================================================== */

    renderFavorites();


    /* ======================================================
       HISTORIAL
    ====================================================== */

    renderHistory();


    /* ======================================================
       EVENTOS
    ====================================================== */

    setupEvents();

}


/* ==========================================================
   ARRANQUE
========================================================== */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();

}