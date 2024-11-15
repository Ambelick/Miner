// ============= VARIABLES GLOBALES =============
// Contadores para cada tipo de figura
let squareCount = 0;        // Contador de cuadrados
let circleCount = 0;        // Contador de círculos
let triangleCount = 0;      // Contador de triángulos
let isProcessing = false;   // Bandera que indica si hay un proceso en curso

// Referencias a elementos del DOM
const claw = document.getElementById('claw');                  // Garra mecánica
const figureHolder = document.getElementById('figureHolder');  // Contenedor de la figura en la garra
const productionLine = document.getElementById('productionLine'); // Línea de producción/banda transportadora
const processingQueue = [];  // Cola de procesamiento para las figuras

// ============= FUNCIONES DE ARRASTRE (DRAG & DROP) =============

/**
 * Permite que un elemento sea soltado en la zona
 * Previene el comportamiento predeterminado del navegador
 * @param {DragEvent} event - Evento de arrastre
 */
function allowDrop(event) {
    event.preventDefault();
}

/**
 * Maneja el inicio del arrastre de una figura
 * Guarda el ID de la figura y añade clase visual
 * @param {DragEvent} event - Evento de inicio de arrastre
 */
function drag(event) {
    event.dataTransfer.setData("figureId", event.target.id);  // Guarda el ID de la figura
    event.target.classList.add('grabbing');                    // Añade efecto visual de agarre
}

/**
 * Maneja el fin del arrastre
 * Elimina los efectos visuales de arrastre
 * @param {DragEvent} event - Evento de fin de arrastre
 */
function dragEnd(event) {
    event.target.classList.remove('grabbing');  // Elimina efecto visual de agarre
}

/**
 * Maneja el evento de soltar una figura en la línea de producción
 * Crea un clon de la figura y lo añade a la cola de procesamiento
 * @param {DragEvent} event - Evento de soltar
 */
async function drop(event) {
    event.preventDefault();
    // Obtiene el ID de la figura arrastrada
    const figureId = event.dataTransfer.getData("figureId");
    // Obtiene la figura original
    const originalFigure = document.getElementById(figureId);
    // Crea un clon de la figura
    const figure = originalFigure.cloneNode(true);
    
    // Añade la figura a la cola de procesamiento
    processingQueue.push({ figure, figureId });
    
    // Si no hay procesamiento en curso, inicia uno nuevo
    if (!isProcessing) {
        processQueue();
    }
}

// ============= SISTEMA DE PROCESAMIENTO =============

/**
 * Procesa la cola de figuras de manera secuencial
 * Maneja la lógica principal de la línea de producción
 */
async function processQueue() {
    // Si no hay elementos en la cola, termina el procesamiento
    if (processingQueue.length === 0) {
        isProcessing = false;
        return;
    }
    
    isProcessing = true;
    // Obtiene la primera figura de la cola
    const { figure, figureId } = processingQueue[0];
    
    // Configura la posición inicial de la figura en la línea
    figure.style.position = "absolute";
    figure.style.left = "20px";
    figure.style.top = "20px";
    productionLine.appendChild(figure);
    
    // Secuencia de procesamiento
    await moveFigureToPickup(figure);              // Mueve la figura al punto de recogida
    await processAndClassifyFigure(figure, figureId); // Procesa y clasifica la figura
    
    // Elimina la figura procesada de la cola
    processingQueue.shift();
    
    // Continúa con la siguiente figura
    processQueue();
}

/**
 * Mueve una figura hasta el punto de recogida en la banda transportadora
 * @param {HTMLElement} figure - Elemento DOM de la figura
 * @returns {Promise} Promesa que se resuelve cuando la figura llega al punto de recogida
 */
async function moveFigureToPickup(figure) {
    return new Promise(resolve => {
        let distance = 0;                          // Distancia recorrida
        const speed = 3;                           // Velocidad de movimiento
        const interval = 20;                       // Intervalo de actualización
        const pickupPoint = productionLine.offsetWidth - 100;  // Punto de recogida
        
        // Intervalo para mover la figura
        const moveRight = setInterval(() => {
            distance += speed;
            figure.style.left = distance + 'px';
            
            // Si llegó al punto de recogida, detiene el movimiento
            if (distance >= pickupPoint) {
                clearInterval(moveRight);
                resolve();
            }
        }, interval);
    });
}

/**
 * Procesa y clasifica una figura usando la garra mecánica
 * Controla toda la secuencia de clasificación
 * @param {HTMLElement} figure - Elemento DOM de la figura
 * @param {string} figureId - ID de la figura
 */
async function processAndClassifyFigure(figure, figureId) {
    // Posiciona la garra en el punto de recogida
    const productionLineWidth = productionLine.offsetWidth;
    claw.style.display = 'block';
    claw.style.left = (productionLineWidth - 100) + 'px';
    
    await wait(300);  // Espera para sincronización visual
    
    // Cierra la garra
    const leftGrip = claw.querySelector('.claw-grip.left');
    const rightGrip = claw.querySelector('.claw-grip.right');
    leftGrip.style.transform = 'rotate(-30deg)';
    rightGrip.style.transform = 'rotate(30deg)';
    
    // Mueve la figura al holder de la garra
    figure.style.transition = 'all 0.3s ease';
    figureHolder.appendChild(figure);
    figure.style.left = '0';
    figure.style.top = '0';
    
    await wait(300);
    
    // Calcula la posición del contenedor destino
    const targetContainer = document.getElementById(`${figureId}Container`);
    const containerRect = targetContainer.getBoundingClientRect();
    const productionRect = productionLine.getBoundingClientRect();
    const targetX = containerRect.left - productionRect.left + (containerRect.width / 2) - 30;
    
    // Mueve la garra al contenedor
    claw.style.transition = 'all 0.8s ease';
    claw.style.left = `${targetX}px`;
    
    await wait(800);
    
    // Destaca el contenedor destino
    targetContainer.classList.add('highlight');
    
    // Abre la garra para soltar la figura
    leftGrip.style.transform = 'rotate(0deg)';
    rightGrip.style.transform = 'rotate(0deg)';
    
    await wait(300);
    
    // Actualiza el contador y limpia
    updateCounter(figureId);
    figure.remove();
    targetContainer.classList.remove('highlight');
    
    // Resetea la garra a su posición inicial
    await wait(300);
    claw.style.display = 'none';
    claw.style.transition = 'none';
    claw.style.left = (productionLineWidth - 100) + 'px';
}

/**
 * Actualiza el contador correspondiente al tipo de figura
 * @param {string} figureId - ID de la figura
 */
function updateCounter(figureId) {
    let counter;
    // Determina qué contador actualizar según el tipo de figura
    switch(figureId) {
        case 'square':
            counter = document.getElementById('squareCount');
            squareCount++;
            counter.textContent = squareCount;
            break;
        case 'circle':
            counter = document.getElementById('circleCount');
            circleCount++;
            counter.textContent = circleCount;
            break;
        case 'triangle':
            counter = document.getElementById('triangleCount');
            triangleCount++;
            counter.textContent = triangleCount;
            break;
    }
    
    // Efecto visual de actualización
    counter.style.transform = 'scale(1.2)';
    setTimeout(() => {
        counter.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Función de utilidad para crear delays controlados
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promesa que se resuelve después del tiempo especificado
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============= CONFIGURACIÓN DE EVENT LISTENERS =============

// Configura los eventos de arrastre para todas las figuras
document.querySelectorAll('.figure').forEach(item => {
    item.addEventListener('dragstart', drag);    // Evento de inicio de arrastre
    item.addEventListener('dragend', dragEnd);   // Evento de fin de arrastre
});

// Configura los eventos de la línea de producción
productionLine.addEventListener('dragover', allowDrop);  // Permite el drop
productionLine.addEventListener('drop', drop);           // Maneja el drop