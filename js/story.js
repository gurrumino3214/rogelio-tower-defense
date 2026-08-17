/**
 * ==========================================
 * SISTEMA DE HISTORIA - ROGELIO TOWER DEFENSE
 * ==========================================
 * Historia progresiva para los 50 niveles.
 * Rogelio es el villano principal y jefe final del Nivel 50.
 */

// ==========================================
// HISTORIA DE LOS 50 NIVELES
// ==========================================
const levelsStory = {
    // ==========================================
    // NIVELES 1-10: "EL COMIENZO"
    // El jugador descubre que algo extraño está ocurriendo.
    // Los ataques comienzan. Todavía NO revelar claramente a Rogelio.
    // ==========================================
    
    1: {
        title: "PRIMEROS ATQUES",
        intro: "Los primeros informes llegan desde la frontera.\nCriaturas extrañas han comenzado a aparecer.\nNadie sabe qué las está enviando...",
        outro: "Los atacantes han sido derrotados.\nPero esto es solo el comienzo."
    },
    
    2: {
        title: "LA INVASIÓN COMIENZA",
        intro: "Más enemigos cruzan la frontera.\nSu comportamiento es extraño... coordinado.\nAlguien los está dirigiendo.",
        outro: "Otra victoria, pero la amenaza persiste."
    },
    
    3: {
        title: "DEFENSA FRONTERIZA",
        intro: "Las aldeas fronterizas piden ayuda.\nLos ataques se vuelven más frecuentes.\n¿Quién está detrás de esto?",
        outro: "La frontera resiste por ahora."
    },
    
    4: {
        title: "SEÑALES DE GUERRA",
        intro: "Se han encontrado señales de organización enemiga.\nEsto no es una invasión natural.\nAlguien está planeando algo grande.",
        outro: "Los planes enemigos se retrasan, pero no se detienen."
    },
    
    5: {
        title: "EL ENEMIGO INVISIBLE",
        intro: "Los prisioneros hablan de un líder.\nNadie ha visto su rostro.\nOperan desde las sombras.",
        outro: "El enemigo invisible retrocede... por ahora."
    },
    
    6: {
        title: "TÁCTICAS OSCURAS",
        intro: "Los enemigos usan tácticas cada vez más sofisticadas.\nEstán aprendiendo de sus derrotas.\nO alguien les está enseñando.",
        outro: "Sus tácticas han fallado esta vez."
    },
    
    7: {
        title: "LA SOMBRA CRECE",
        intro: "Informes de movimientos en las tierras oscuras.\nUn ejército se está reuniendo.\nPero ¿bajo qué mando?",
        outro: "La sombra se retira, pero no desaparece."
    },
    
    8: {
        title: "MENSAJE INTERCEPTADO",
        intro: "Hemos interceptado un mensaje cifrado.\nHabla de 'El Gran Plan'.\nFirmado con un símbolo desconocido.",
        outro: "El mensaje ha sido descifrado... parcialmente."
    },
    
    9: {
        title: "PREPARATIVOS",
        intro: "Los enemigos se fortifican en las colinas.\nEstán esperando algo... o a alguien.\nLa tensión aumenta.",
        outro: "Sus fortificaciones han caído."
    },
    
    10: {
        title: "PRIMERA LÍNEA",
        intro: "La primera línea de defensa ha resistido.\nPero los ataques se intensifican.\nAlgo grande se acerca...",
        outro: "La primera línea se mantiene firme.\nPero la verdadera amenaza aún no se revela."
    },
    
    // ==========================================
    // NIVELES 11-20: "LA AMENAZA"
    // Los enemigos se vuelven más peligrosos.
    // El jugador comienza a encontrar pistas.
    // Parece que alguien está organizando los ataques.
    // ==========================================
    
    11: {
        title: "NUEVA FASE",
        intro: "Los ataques cambian de patrón.\nAhora hay coordinación entre las unidades.\nHay un estratega detrás de esto.",
        outro: "Su estratega ha sido frustrado... temporalmente."
    },
    
    12: {
        title: "COMANDANTE ENEMIGO",
        intro: "Se ha avistado a un comandante enemigo.\nLleva una capa oscura y una máscara.\nDa órdenes con autoridad absoluta.",
        outro: "El comandante ha huido. Su identidad sigue siendo un misterio."
    },
    
    13: {
        title: "DOCUMENTOS CAPTURADOS",
        intro: "Hemos capturado documentos importantes.\nMencionan 'El Señor de las Sombras'.\nUn título, no un nombre.",
        outro: "Los documentos revelan más preguntas que respuestas."
    },
    
    14: {
        title: "LA RED SE EXTIENDE",
        intro: "Espías han sido encontrados en nuestras filas.\nLa red enemiga es más grande de lo pensado.\nEstán en todas partes.",
        outro: "Los espías han sido eliminados, pero la red persiste."
    },
    
    15: {
        title: "FORTALEZA OSCURA",
        intro: "Se ha localizado una fortaleza enemiga.\nDesde allí se coordinan los ataques.\nPero el líder no está allí.",
        outro: "La fortaleza ha caído, pero el líder escapó."
    },
    
    16: {
        title: "RUMBORES DE PODER",
        intro: "Los prisioneros hablan de un poder antiguo.\nAlgo que despertó en las tierras del norte.\nUn nombre comienza a circular...",
        outro: "Los rumores se confirman: hay un poder detrás de todo."
    },
    
    17: {
        title: "LA PISTA",
        intro: "Encontramos algo extraño entre los restos del último ataque.\nAlguien está detrás de todo esto.\nY tiene un plan maestro.",
        outro: "La pista nos lleva más cerca... pero aún hay secretos."
    },
    
    18: {
        title: "EL ESTRATEGA",
        intro: "Cada batalla es más difícil.\nEl enemigo adapta sus tácticas.\nNos enfrentamos a una mente brillante.",
        outro: "Su estrategia ha fallado esta vez."
    },
    
    19: {
        title: "MOVIMIENTOS MASIVOS",
        intro: "Grandes movimientos de tropas detectados.\nSe preparan para un asalto mayor.\nEl tiempo se agota.",
        outro: "El asalto ha sido repelido, pero vendrán más."
    },
    
    20: {
        title: "PUNTO DE INFLEXIÓN",
        intro: "Hemos llegado a un punto crítico.\nLos próximos niveles decidirán el curso de la guerra.\nDebemos mantenernos fuertes.",
        outro: "Hemos sobrevivido hasta aquí.\nPero la verdadera revelación está por venir."
    },
    
    // ==========================================
    // NIVELES 21-30: "EL DESCUBRIMIENTO"
    // Comienzan a aparecer pistas mucho más claras.
    // El jugador descubre que existe alguien detrás de los ataques.
    // El nombre ROGELIO puede comenzar a aparecer progresivamente.
    // ==========================================
    
    21: {
        title: "NOMBRE EN LAS SOMBRAS",
        intro: "Un nombre aparece en los documentos capturados:\n'ROGELIO'.\n¿Es este el líder que buscamos?",
        outro: "El nombre Rogelio ahora es conocido.\nPero su rostro sigue oculto."
    },
    
    22: {
        title: "EL DESCUBRIMIENTO",
        intro: "Los prisioneros confirman: Rogelio existe.\nUn ser poderoso que controla las sombras.\nHa estado planeando esto por años.",
        outro: "Sabemos quién es nuestro enemigo."
    },
    
    23: {
        title: "LA VERDAD EMERGE",
        intro: "Rogelio no es un invasor común.\nEs un estratega maestro que ha manipulado eventos desde hace décadas.\nTodo fue planeado.",
        outro: "La verdad es más oscura de lo imaginado."
    },
    
    24: {
        title: "ORÍGENES OSCUROS",
        intro: "Investigaciones revelan el pasado de Rogelio.\nUna vez fue un aliado... antes de caer en la oscuridad.\nAhora busca venganza.",
        outro: "Su origen explica su odio, pero no lo justifica."
    },
    
    25: {
        title: "LA CAÍDA",
        intro: "Rogelio fue corrompido por poder antiguo.\nJuró destruir todo lo que una vez protegió.\nY está cumpliendo su promesa.",
        outro: "Su caída nos cuesta caro a todos."
    },
    
    26: {
        title: "REVELACIÓN",
        intro: "Ahora sabemos la verdad completa.\nRogelio comanda este ejército personalmente.\nCada ataque es parte de su plan.",
        outro: "Conocer al enemigo es el primer paso para derrotarlo."
    },
    
    27: {
        title: "CONTRAATAQUE",
        intro: "Debemos llevar la guerra a Rogelio.\nNo podemos seguir defendiéndonos.\nEs hora de atacar.",
        outro: "Su avance se detiene, pero Rogelio escapa."
    },
    
    28: {
        title: "CAZANDO AL LÍDER",
        intro: "Inteligencia indica la ubicación de Rogelio.\nEstá en las Tierras del Norte.\nPreparando algo grande.",
        outro: "Casi lo alcanzamos... pero se escabulle."
    },
    
    29: {
        title: "ACERCÁNDOSE",
        intro: "Cada victoria nos acerca a Rogelio.\nSus fuerzas se debilitan.\nPero él se vuelve más peligroso.",
        outro: "Estamos cada vez más cerca del confrontamiento."
    },
    
    30: {
        title: "MITAD DEL CAMINO",
        intro: "Hemos llegado lejos, guerrero.\nRogelio sabe que lo estamos cazando.\nY está preparando su defensa final.",
        outro: "La mitad del camino recorrida.\nLa otra mitad será la más difícil."
    },
    
    // ==========================================
    // NIVELES 31-40: "EL ENEMIGO"
    // El jugador descubre que Rogelio es el responsable.
    // La historia cambia de "¿Qué está ocurriendo?" a "Tenemos que detener a Rogelio."
    // El objetivo comienza a ser llegar hasta él.
    // ==========================================
    
    31: {
        title: "TIERRAS HOSTILES",
        intro: "Entramos en territorio controlado por Rogelio.\nCada paso es peligroso.\nSus mejores tropas nos esperan.",
        outro: "Sus tierras han sido conquistadas, paso a paso."
    },
    
    32: {
        title: "GENERAL DE ROGELIO",
        intro: "Uno de los generales de Rogelio ha caído.\nSus últimas palabras: 'Él ya sabe que vienen'.\nRogelio nos está esperando.",
        outro: "Otro general derrotado. Rogelio se queda sin defensores."
    },
    
    33: {
        title: "FORTIFICACIONES DE ROGELIO",
        intro: "Las defensas de Rogelio son formidables.\nHa tenido años para prepararse.\nPero nosotros tenemos la ventaja del destino.",
        outro: "Sus fortificaciones no pueden detenernos."
    },
    
    34: {
        title: "LA CACERÍA",
        intro: "Ya no somos presas, somos cazadores.\nRogelio es nuestra presa.\nY no descansaremos hasta capturarlo.",
        outro: "La cacería continúa. Rogelio corre."
    },
    
    35: {
        title: "TENIENTES CAÍDOS",
        intro: "Los tenientes de Rogelio caen uno a uno.\nSin ellos, su ejército se debilita.\nPero él se vuelve más desesperado.",
        outro: "Sus aliados no pueden salvarlo."
    },
    
    36: {
        title: "CAMINO HACIA ROGELIO",
        intro: "El camino hacia Rogelio se despeja.\nCada victoria es un paso más cerca.\nPodemos sentir su presencia.",
        outro: "El camino está abierto. Rogelio, prepárate."
    },
    
    37: {
        title: "GUARDIANES DE ROGELIO",
        intro: "Los guardianes personales de Rogelio nos bloquean.\nSon sus mejores guerreros.\nPero incluso ellos tienen límites.",
        outro: "Sus guardianes han caído. Nada nos separa ya de Rogelio."
    },
    
    38: {
        title: "FRONTERA FINAL",
        intro: "Hemos reached la frontera del dominio de Rogelio.\nMás allá está su territorio personal.\nEl enfrentamiento final se acerca.",
        outro: "La frontera ha sido cruzada. Rogelio, sal de tu escondite."
    },
    
    39: {
        title: "PREPARANDO EL ASALTO",
        intro: "Las fuerzas se reúnen para el asalto final.\nRogelio sabe que viene el fin.\nSe atrinchera en su fortaleza.",
        outro: "Todo está listo para el asalto final."
    },
    
    40: {
        title: "ÚLTIMA BARRERA",
        intro: "Esta es la última barrera antes de Rogelio.\nDespués de esto, solo él queda.\nEl momento casi ha llegado.",
        outro: "La última barrera ha caído.\nRogelio... es tu turno."
    },
    
    // ==========================================
    // NIVELES 41-49: "EL ASALTO FINAL"
    // El jugador se acerca al territorio de Rogelio.
    // Los enemigos son cada vez más peligrosos.
    // La historia debe crear tensión y preparar al jugador para el enfrentamiento final.
    // Cada nivel debe sentirse como un paso más hacia Rogelio.
    // ==========================================
    
    41: {
        title: "TERRITORIO DE ROGELIO",
        intro: "Has entrado en el territorio personal de Rogelio.\nSus mejores defensas están activadas.\nEste es el comienzo del fin.",
        outro: "Su territorio exterior ha sido conquistado."
    },
    
    42: {
        title: "GUARDIA ÉLITE",
        intro: "La guardia élite de Rogelio te espera.\nSon los soldados más leales.\nPrefieren morir antes que fallarle.",
        outro: "Su guardia élite ha sido eliminada."
    },
    
    43: {
        title: "TRAMPAS MORTALES",
        intro: "Rogelio ha preparado trampas por doquier.\nCada paso podría ser el último.\nPero has llegado demasiado lejos para rendirte.",
        outro: "Sus trampas no fueron suficientes."
    },
    
    44: {
        title: "COMANDANTES DE ROGELIO",
        intro: "Los comandantes directos de Rogelio defienden este sector.\nHan jurado protegerlo con sus vidas.\nHoy cumplirán ese juramento.",
        outro: "Sus comandantes han caído en batalla."
    },
    
    45: {
        title: "PUERTA INTERIOR",
        intro: "La puerta interior del dominio de Rogelio está a la vista.\nDetrás de ella, su fortaleza personal.\nEstás muy cerca.",
        outro: "La puerta interior ha sido abierta."
    },
    
    46: {
        title: "DEFENSAS FINALES",
        intro: "Las últimas defensas antes de la fortaleza de Rogelio.\nTodo lo que tiene queda aquí.\nDa tu mejor esfuerzo.",
        outro: "Sus defensas finales han sido superadas."
    },
    
    47: {
        title: "PATIOS DE ROGELIO",
        intro: "Has llegado a los patios de la fortaleza de Rogelio.\nPuedes ver su torre en la distancia.\nEl enfrentamiento es inminente.",
        outro: "Los patios son tuyos. La torre es lo único que queda."
    },
    
    48: {
        title: "TORRE DE ROGELIO",
        intro: "La torre de Rogelio se alza ante ti.\nEs el último obstáculo.\nDespués de esto... él.",
        outro: "La torre exterior ha caído. Solo queda la cámara del trono."
    },
    
    49: {
        title: "ANTESALA DEL DESTINO",
        intro: "Estás en la antesala de la cámara de Rogelio.\nPuedes sentir su poder oscuro.\nRespira profundo, guerrero.\nEste es el momento.",
        outro: "La puerta se abre. Rogelio te espera.\nEs hora del enfrentamiento final."
    },
    
    // ==========================================
    // NIVEL 50: "EL JEFE FINAL"
    // Este es el enfrentamiento final contra ROGELIO.
    // Debe existir una presentación especial del jefe.
    // ==========================================
    
    50: {
        title: "ROGELIO - JEFE FINAL",
        intro: "Has llegado hasta mí...\n\nROGELIO\n\nJEFE FINAL\n\nDespués de 49 niveles de batalla,\nfinalmente te enfrentas al responsable\nde toda esta destrucción.\n\nDerrota a Rogelio y termina esta guerra.",
        outro: "¡ROGELIO HA SIDO DERROTADO!\n\nDespués de todo lo ocurrido,\nla amenaza finalmente ha terminado.\n\nHas completado la campaña.\n\n¡GRACIAS POR JUGAR!"
    }
};

// ==========================================
// FUNCIONES DEL SISTEMA DE HISTORIA
// ==========================================

// Obtener historia de un nivel específico
function getLevelStory(levelNum) {
    if (levelNum < 1 || levelNum > 50) {
        return {
            title: "NIVEL " + levelNum,
            intro: "Continúa la batalla...",
            outro: "Victoria obtenida."
        };
    }
    return levelsStory[levelNum] || {
        title: "NIVEL " + levelNum,
        intro: "La batalla continúa...",
        outro: "Has vencido."
    };
}

// Verificar si es el nivel final
function isFinalLevel(levelNum) {
    return levelNum === 50;
}

// Hacer disponible globalmente
window.getLevelStory = getLevelStory;
window.isFinalLevel = isFinalLevel;
window.levelsStory = levelsStory;

// ==========================================
// FUNCIONES DE DIBUJO Y MANEJO DE PANTALLA DE HISTORIA
// ==========================================

// Variables para la pantalla de historia
let storyScreenVisible = false;
let storyScreenLevel = 0;
let pendingLevel = null;

// Hacer variables disponibles globalmente para game.js
window.storyScreenVisible = storyScreenVisible;
window.pendingLevel = pendingLevel;
window.storyScreenLevel = storyScreenLevel;

// Mostrar pantalla de introducción de historia
function showStoryScreen(level) {
    pendingLevel = level;
    storyScreenLevel = level;
    storyScreenVisible = true;
    
    // Actualizar variables globales
    window.storyScreenVisible = storyScreenVisible;
    window.pendingLevel = pendingLevel;
    window.storyScreenLevel = storyScreenLevel;
    
    // Obtener historia del nivel
    const story = getLevelStory(level);
    
    console.log('[STORY] Mostrando introducción para Nivel ' + level + ': ' + story.title);
}

// Continuar desde pantalla de historia al juego
function continueFromStory() {
    if (pendingLevel !== null) {
        currentLevel = pendingLevel;
        pendingLevel = null;
        storyScreenVisible = false;
        
        // Actualizar variables globales
        window.storyScreenVisible = storyScreenVisible;
        window.pendingLevel = pendingLevel;
        window.storyScreenLevel = storyScreenLevel;
        
        // Iniciar el juego desde el menú
        if (typeof startGameFromMenu === 'function') {
            startGameFromMenu();
        }
    }
}

// Dibujar pantalla de historia
function drawStoryScreen() {
    if (!storyScreenVisible) return;
    
    // Verificar que canvas y ctx estén disponibles
    if (typeof canvas === 'undefined' || typeof ctx === 'undefined') {
        console.error('[STORY] canvas o ctx no están disponibles');
        return;
    }
    
    const story = getLevelStory(storyScreenLevel);
    
    // Fondo semi-transparente
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Borde decorativo
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
    
    // Título del nivel
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NIVEL ' + storyScreenLevel, canvas.width / 2, canvas.height / 2 - 180);
    
    // Título de la historia
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('"' + story.title + '"', canvas.width / 2, canvas.height / 2 - 120);
    
    // Texto de introducción
    ctx.fillStyle = '#cccccc';
    ctx.font = '24px Arial, sans-serif';
    ctx.textAlign = 'center';
    
    // Dividir el texto en líneas
    const introLines = story.intro.split('\n');
    const lineHeight = 36;
    const totalHeight = introLines.length * lineHeight;
    let startY = canvas.height / 2 - 60 - (totalHeight / 2);
    
    for (let i = 0; i < introLines.length; i++) {
        ctx.fillText(introLines[i], canvas.width / 2, startY + (i * lineHeight));
    }
    
    // Botón CONTINUAR
    const btnWidth = 250;
    const btnHeight = 50;
    const btnX = canvas.width / 2 - btnWidth / 2;
    const btnY = canvas.height / 2 + 100;
    
    // Efecto hover
    const mouseX = mouseState ? mouseState.x : 0;
    const mouseY = mouseState ? mouseState.y : 0;
    const isHovering = mouseX >= btnX && mouseX <= btnX + btnWidth && 
                       mouseY >= btnY && mouseY <= btnY + btnHeight;
    
    ctx.fillStyle = isHovering ? '#ffd700' : '#8B4513';
    ctx.fillRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.strokeRect(btnX, btnY, btnWidth, btnHeight);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONTINUAR', canvas.width / 2, btnY + 32);
}

// Manejar clicks en la pantalla de historia
function handleStoryClick(screenX, screenY) {
    if (!storyScreenVisible) return;
    
    // Usar window.canvas para asegurar que tenemos el canvas correcto
    if (!window.canvas) {
        console.error('[STORY] canvas no disponible');
        return;
    }
    
    const btnWidth = 250;
    const btnHeight = 50;
    const btnX = window.canvas.width / 2 - btnWidth / 2;
    const btnY = window.canvas.height / 2 + 100;
    
    console.log('[STORY CLICK] screenX:', screenX, 'screenY:', screenY, 'btnX:', btnX, 'btnY:', btnY);
    
    // Verificar click en botón CONTINUAR
    if (screenX >= btnX && screenX <= btnX + btnWidth && 
        screenY >= btnY && screenY <= btnY + btnHeight) {
        console.log('[STORY] Click en CONTINUAR detectado');
        continueFromStory();
    }
}

// Hacer disponibles globalmente
window.showStoryScreen = showStoryScreen;
window.continueFromStory = continueFromStory;
window.drawStoryScreen = drawStoryScreen;
window.handleStoryClick = handleStoryClick;
window.storyScreenVisible = storyScreenVisible;
window.pendingLevel = pendingLevel;
window.storyScreenLevel = storyScreenLevel;
