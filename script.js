/* ==========================================================
   POWERLOAD v5
   Calculadora de Powerlifting
========================================================== */


/* ==========================================================
   CONFIGURACIÓN
========================================================== */

const PLATES = [45, 25, 10, 5, 2.5];

const KG_PER_LB = 0.45359237;


const DEFAULT_COUNTS = {

    45: 0,
    25: 0,
    10: 0,
    5: 0,
    2.5: 0

};


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


let unit =
    localStorage.getItem("pl-v5-unit") || "kg";


let counts =
    loadJSON(
        "pl-v5-counts",
        DEFAULT_COUNTS
    );


let favorites =
    loadJSON(
        "pl-v5-favorites",
        []
    );


let history =
    loadJSON(
        "pl-v5-history",
        []
    );


let lastTarget = null;


/* ==========================================================
   NORMALIZAR DATOS
========================================================== */

function normalizeCounts(data) {

    const normalized = {
        ...DEFAULT_COUNTS
    };


    PLATES.forEach(weight => {

        const value =
            Number(
                data?.[weight] ?? 0
            );


        normalized[weight] =
            Number.isFinite(value)
                ? Math.max(0, Math.floor(value))
                : 0;

    });


    return normalized;

}


counts =
    normalizeCounts(counts);


/* ==========================================================
   HELPERS
========================================================== */

function loadJSON(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);


        return value
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;

    }

}


function saveData() {

    localStorage.setItem(
        "pl-v5-counts",
        JSON.stringify(counts)
    );


    localStorage.setItem(
        "pl-v5-favorites",
        JSON.stringify(favorites)
    );


    localStorage.setItem(
        "pl-v5-history",
        JSON.stringify(history)
    );


    localStorage.setItem(
        "pl-v5-unit",
        unit
    );

}


function lbToKg(lb) {

    return lb * KG_PER_LB;

}


function kgToLb(kg) {

    return kg / KG_PER_LB;

}


function cleanNumber(
    value,
    decimals = 2
) {

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


function formatWeight(lb) {

    return unit === "kg"
        ? formatKg(lbToKg(lb))
        : formatLb(lb);

}


/* ==========================================================
   DOM
========================================================== */

const mainWeight =
    document.getElementById("mainWeight");


const mainUnit =
    document.getElementById("mainUnit");


const secondaryWeight =
    document.getElementById("secondaryWeight");


const sideWeight =
    document.getElementById("sideWeight");


const platesWeight =
    document.getElementById("platesWeight");


const barDisplay =
    document.getElementById("barDisplay");


const barWeight =
    document.getElementById("barWeight");


const platesContainer =
    document.getElementById("platesContainer");


const targetWeight =
    document.getElementById("targetWeight");


const targetUnit =
    document.getElementById("targetUnit");


const targetResult =
    document.getElementById("targetResult");


const targetCombination =
    document.getElementById("targetCombination");


const targetRequested =
    document.getElementById("targetRequested");


const targetReal =
    document.getElementById("targetReal");


const targetDifference =
    document.getElementById("targetDifference");


const targetAccuracy =
    document.getElementById("targetAccuracy");


const oneRm =
    document.getElementById("oneRm");


const percentage =
    document.getElementById("percentage");


const rmResult =
    document.getElementById("rmResult");


const percentageGrid =
    document.getElementById("percentageGrid");


const estimatedOneRm =
    document.getElementById("estimatedOneRm");


const estimateWeight =
    document.getElementById("estimateWeight");


const estimateReps =
    document.getElementById("estimateReps");


const favoritesContainer =
    document.getElementById("favoritesContainer");


const historyContainer =
    document.getElementById("historyContainer");


const leftVisual =
    document.getElementById("leftVisual");


const rightVisual =
    document.getElementById("rightVisual");


const visualPlateCount =
    document.getElementById(
        "visualPlateCount"
    );


const visualTotal =
    document.getElementById(
        "visualTotal"
    );


/* ==========================================================
   RENDER DISCOS
========================================================== */

function renderPlates() {

    platesContainer.innerHTML = "";


    PLATES.forEach(weight => {

        const row =
            document.createElement("div");


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

                </div>

            </div>


            <div class="counter">

                <button
                    type="button"
                    data-action="minus"
                    data-weight="${weight}"
                    aria-label="Quitar disco de ${weight} libras"
                >
                    −
                </button>


                <span id="count-${className}">
                    ${counts[weight]}
                </span>


                <button
                    type="button"
                    data-action="plus"
                    data-weight="${weight}"
                    aria-label="Agregar disco de ${weight} libras"
                >
                    +
                </button>

            </div>

        `;


        platesContainer.appendChild(row);

    });


    platesContainer
        .querySelectorAll("[data-action]")
        .forEach(button => {

            button.addEventListener(
                "click",
                handlePlateButton
            );

        });

}


/* ==========================================================
   BOTONES DE DISCOS
========================================================== */

function handlePlateButton(event) {

    const button =
        event.currentTarget;


    const weight =
        Number(
            button.dataset.weight
        );


    const action =
        button.dataset.action;


    if (
        !PLATES.includes(weight)
    ) {

        return;

    }


    if (
        action === "plus"
    ) {

        counts[weight] =
            Number(counts[weight] || 0) + 1;

    } else {

        counts[weight] =
            Math.max(
                0,
                Number(counts[weight] || 0) - 1
            );

    }


    /*
        IMPORTANTE:

        Antes solo se actualizaba la barra.
        El contador visual se quedaba en 0.

        Ahora renderizamos nuevamente
        los controles y la barra.
    */

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


/* ==========================================================
   CALCULATE
========================================================== */

function calculate() {

    const load =
        getCurrentLoad();


    if (
        unit === "kg"
    ) {

        mainWeight.textContent =
            cleanNumber(
                lbToKg(load.total)
            );


        mainUnit.textContent =
            "kg";


        secondaryWeight.textContent =
            formatLb(
                load.total
            );

    } else {

        mainWeight.textContent =
            cleanNumber(
                load.total
            );


        mainUnit.textContent =
            "lb";


        secondaryWeight.textContent =
            formatKg(
                lbToKg(load.total)
            );

    }


    sideWeight.textContent =
        formatWeight(
            load.perSide
        );


    platesWeight.textContent =
        formatWeight(
            load.plates
        );


    barDisplay.textContent =
        formatWeight(
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

function updateVisualSummary(load) {

    const amount =
        PLATES.reduce(
            (total, weight) =>
                total +
                Number(
                    counts[weight] || 0
                ),
            0
        );


    visualPlateCount.textContent =
        amount;


    visualTotal.textContent =
        formatWeight(
            load.total
        );

}


/* ==========================================================
   VISUAL BARRA
========================================================== */

function renderBar() {

    leftVisual.innerHTML = "";

    rightVisual.innerHTML = "";


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
                createVisualPlate(weight)
            );


            rightVisual.appendChild(
                createVisualPlate(weight)
            );

        }

    });

}


/* ==========================================================
   CREAR DISCO VISUAL
========================================================== */

function createVisualPlate(weight) {

    const plate =
        document.createElement("div");


    const className =
        String(weight)
            .replace(".", "-");


    plate.className =
        `visual-plate visual-${className}`;


    plate.textContent =
        weight;


    plate.title =
        `${weight} lb`;


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


function setUnit(newUnit) {

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


    calculate();

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

            counts =
                {
                    ...DEFAULT_COUNTS
                };


            renderPlates();

            calculate();

        }
    );


/* ==========================================================
   BUSCADOR DE OBJETIVO
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


document
    .querySelectorAll("[data-target]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                targetWeight.value =
                    button.dataset.target;


                calculateTarget();

            }
        );

    });


function calculateTarget() {

    const input =
        Number(
            targetWeight.value
        );


    if (
        !Number.isFinite(input) ||
        input <= 0
    ) {

        showTargetMessage(
            "Introduce un peso válido."
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
        discLoad < 0
    ) {

        showTargetMessage(
            "El objetivo es menor que el peso de la barra."
        );

        return;

    }


    const targetPerSide =
        discLoad / 2;


    const result =
        findBestCombination(
            targetPerSide
        );


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
            actualTotal

    };


    renderTarget(
        targetLb,
        actualTotal,
        difference,
        result.counts
    );

}


/* ==========================================================
   ENCONTRAR COMBINACIÓN
========================================================== */

function findBestCombination(
    targetPerSide
) {

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


    let best = null;


    for (
        let a = 0;
        a <= Math.ceil(
            targetUnits /
            values[45]
        ) + 2;
        a++
    ) {

        for (
            let b = 0;
            b <= Math.ceil(
                targetUnits /
                values[25]
            ) + 2;
            b++
        ) {

            for (
                let c = 0;
                c <= Math.ceil(
                    targetUnits /
                    values[10]
                ) + 2;
                c++
            ) {

                for (
                    let d = 0;
                    d <= Math.ceil(
                        targetUnits /
                        values[5]
                    ) + 2;
                    d++
                ) {

                    for (
                        let e = 0;
                        e <= Math.ceil(
                            targetUnits /
                            values[2.5]
                        ) + 2;
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
        formatWeight(
            requested
        );


    targetReal.textContent =
        formatWeight(
            actual
        );


    const tolerance =
        0.25;


    if (
        Math.abs(difference) <=
        tolerance
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

            : `${sign}${formatWeight(
                difference
            )}`;

}


/* ==========================================================
   MENSAJE DE OBJETIVO
========================================================== */

function showTargetMessage(
    message
) {

    targetResult.classList.remove(
        "hidden"
    );


    targetCombination.innerHTML = `

        <div
            class="plate-chip"
            style="
                color:var(--danger);
                border-color:rgba(255,102,102,.25);
            "
        >
            ⚠ ${message}
        </div>

    `;


    targetRequested.textContent =
        "-";


    targetReal.textContent =
        "-";


    targetDifference.textContent =
        "-";

}


/* ==========================================================
   APLICAR OBJETIVO
========================================================== */

document
    .getElementById("applyTarget")
    .addEventListener(
        "click",
        () => {

            if (
                !lastTarget
            ) {

                return;

            }


            counts =
                normalizeCounts(
                    lastTarget.counts
                );


            calculate();


            renderPlates();


            saveHistory(
                lastTarget.total,
                counts
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
        !rm ||
        rm <= 0
    ) {

        rmResult.textContent =
            "0 kg";


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
        )} kg`;


    renderPercentageTable(
        rm
    );

}


/* ==========================================================
   TABLA 1RM
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


            cell.innerHTML = `

                <span>
                    ${percent}%
                </span>

                <strong>
                    ${
                        rm > 0
                            ? `${cleanNumber(
                                rm *
                                percent /
                                100
                            )} kg`
                            : "—"
                    }
                </strong>

            `;


            cell.addEventListener(
                "click",
                () => {

                    percentage.value =
                        percent / 100;


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
                !rm ||
                rm <= 0
            ) {

                return;

            }


            const weightKg =
                rm *
                percent;


            targetWeight.value =
                unit === "kg"

                    ? cleanNumber(
                        weightKg
                    )

                    : cleanNumber(
                        kgToLb(
                            weightKg
                        )
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

    const weight =
        Number(
            estimateWeight.value
        );


    const reps =
        Number(
            estimateReps.value
        );


    if (
        !weight ||
        !reps ||
        weight <= 0 ||
        reps <= 0
    ) {

        estimatedOneRm.textContent =
            "0 kg";


        return;

    }


    /*
        Fórmula de Epley:

        1RM =
        peso ×
        (1 + reps / 30)
    */


    const result =
        weight *
        (
            1 +
            reps / 30
        );


    estimatedOneRm.textContent =
        `${cleanNumber(
            result
        )} kg`;

}


/* ==========================================================
   FAVORITOS
========================================================== */

document
    .getElementById("saveCurrentButton")
    .addEventListener(
        "click",
        saveCurrentFavorite
    );


function saveCurrentFavorite() {

    const load =
        getCurrentLoad();


    if (
        load.total <= 0
    ) {

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
            12
        );


    saveData();

    renderFavorites();

}


/* ==========================================================
   FAVORITOS
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
                        ${formatWeight(
                            item.total
                        )}
                    </div>

                    <div class="item-detail">
                        ${describeCounts(
                            item.counts
                        )}
                        · Barra:
                        ${formatWeight(
                            item.bar
                        )}
                    </div>

                </div>


                <div class="item-actions">

                    <button
                        data-load="${item.id}"
                    >
                        Usar
                    </button>


                    <button
                        class="delete"
                        data-delete="${item.id}"
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
        .forEach(button => {

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


                    if (
                        !item
                    ) {

                        return;

                    }


                    counts =
                        normalizeCounts(
                            item.counts
                        );


                    barWeight.value =
                        String(
                            item.bar
                        );


                    renderPlates();

                    calculate();


                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }
            );

        });


    favoritesContainer
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(button => {

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

                }
            );

        });

}


/* ==========================================================
   HISTORIAL
========================================================== */

function saveHistory(
    total,
    selectedCounts
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
                barWeight.value
            ),

        date:
            new Date()
                .toLocaleString(
                    "es-CO",
                    {
                        day: "2-digit",
                        month: "2-digit",
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
            15
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
                        ${formatWeight(
                            item.total
                        )}
                    </div>

                    <div class="item-detail">
                        ${describeCounts(
                            item.counts
                        )}
                        · ${item.date}
                    </div>

                </div>


                <div class="item-actions">

                    <button
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
        .forEach(button => {

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


                    if (
                        !item
                    ) {

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


                    window.scrollTo({

                        top: 0,

                        behavior: "smooth"

                    });

                }
            );

        });

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
    .getElementById("clearFavorites")
    .addEventListener(
        "click",
        () => {

            favorites = [];


            saveData();


            renderFavorites();

        }
    );


/* ==========================================================
   LIMPIAR HISTORIAL
========================================================== */

document
    .getElementById("clearHistory")
    .addEventListener(
        "click",
        () => {

            history = [];


            saveData();


            renderHistory();

        }
    );


/* ==========================================================
   TEMA
========================================================== */

document
    .getElementById("themeButton")
    .addEventListener(
        "click",
        () => {

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


            localStorage.setItem(
                "pl-v5-theme",
                isLight
                    ? "light"
                    : "dark"
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
    );


function loadTheme() {

    const theme =
        localStorage.getItem(
            "pl-v5-theme"
        );


    if (
        theme === "light"
    ) {

        document.body
            .classList
            .add(
                "light"
            );


        document
            .getElementById(
                "themeButton"
            )
            .textContent =
                "☀";

    }

}


/* ==========================================================
   INICIALIZACIÓN
========================================================== */

function init() {

    loadTheme();


    /*
        Primero renderizamos los controles
        con los datos guardados.
    */

    renderPlates();


    renderFavorites();


    renderHistory();


    renderPercentageTable(
        0
    );


    setUnit(
        unit
    );


    calculate();

}


init();