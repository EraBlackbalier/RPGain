import type { CreateTaskPayload, TaskPriority, TaskKind } from "../models/Task";
import type { CreateBossPayload } from "../models/Boss";
import type { CreateAttributePayload } from "../models/Attribute";
import type { CreateNodeRequirementPayload } from "../models/Skill";

export interface PackageTask extends Omit<CreateTaskPayload, "session_id"> {
  title: string;
  description: string;
  types: string[];
  priority: TaskPriority;
  task_kind: TaskKind;
  xp_reward: number;
  progress_total: number;
}

export interface PackageSkillNode {
  key: string;
  name: string;
  description: string;
  icon: string;
  xp_cost: number;
  tier: number;
  parentKey?: string;
  requirements?: CreateNodeRequirementPayload[];
}

export interface PackageSkillTree {
  taskType: string;
  icon: string;
  color: string;
  nodes: PackageSkillNode[];
}

export interface CommunityPackage {
  id: string;
  title: string;
  discipline: string;
  summary: string;
  icon: string;
  color: string;
  tags: string[];
  tasks: PackageTask[];
  skillTree: PackageSkillTree;
  bosses: Omit<CreateBossPayload, "session_id">[];
  attributes: Omit<CreateAttributePayload, "session_id">[];
}

export const communityPackages: CommunityPackage[] = [
  {
    id: "exercise-foundation",
    title: "Base de Ejercicio",
    discipline: "Ejercicio",
    summary: "Rutina inicial para fuerza, cardio y movilidad con un boss semanal.",
    icon: "heart",
    color: "#22c55e",
    tags: ["salud", "rutina", "fuerza"],
    tasks: [
      {
        title: "Entrenamiento de fuerza",
        description: "Completa una sesion de cuerpo completo o tren superior/inferior.",
        types: ["ejercicio"],
        priority: "normal",
        task_kind: "endless",
        xp_reward: 18,
        progress_total: 1,
      },
      {
        title: "Cardio ligero 20 minutos",
        description: "Camina rapido, trota suave, bici o cuerda sin ir al limite.",
        types: ["ejercicio", "cardio"],
        priority: "normal",
        task_kind: "endless",
        xp_reward: 14,
        progress_total: 1,
      },
      {
        title: "Movilidad y estiramientos",
        description: "Haz movilidad de cadera, espalda, hombros y respiracion.",
        types: ["ejercicio", "movilidad"],
        priority: "low",
        task_kind: "endless",
        xp_reward: 10,
        progress_total: 1,
      },
    ],
    skillTree: {
      taskType: "ejercicio",
      icon: "heart",
      color: "#22c55e",
      nodes: [
        { key: "warmup", name: "Calentamiento Consistente", description: "Preparas articulaciones antes de entrenar.", icon: "flame", xp_cost: 20, tier: 0 },
        { key: "strength", name: "Fuerza Basica", description: "Dominas patrones de empuje, jalon, pierna y core.", icon: "sword", xp_cost: 45, tier: 1, parentKey: "warmup" },
        { key: "cardio", name: "Motor Aerobico", description: "Construyes resistencia sin quemarte.", icon: "bolt", xp_cost: 45, tier: 1, parentKey: "warmup" },
        { key: "recovery", name: "Recuperacion Activa", description: "Mejoras descanso, movilidad y prevencion de lesiones.", icon: "potion", xp_cost: 65, tier: 2, parentKey: "strength" },
      ],
    },
    bosses: [
      {
        name: "Semana de Disciplina Fisica",
        description: "Completa una semana con entrenamiento, cardio y movilidad.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 120,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 8 acciones de ejercicio", target_value: 8 },
          { requirement_type: "xp_earned", description: "Gana 140 XP en la sesion", target_value: 140 },
        ],
        rewards: [
          { reward_type: "badge", value: "Atleta Constante", description: "Badge por iniciar una rutina sostenible." },
        ],
      },
    ],
    attributes: [
      { name: "Ritmo de Entrenamiento", description: "Buff cosmetico para sesiones de ejercicio.", icon: "heart", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "programming-growth",
    title: "Programacion Practica",
    discipline: "Programacion",
    summary: "Sistema para estudiar, construir features y cerrar bugs como quests.",
    icon: "bolt",
    color: "#3b82f6",
    tags: ["codigo", "proyectos", "debug"],
    tasks: [
      { title: "Resolver un problema tecnico", description: "Practica algoritmos, refactor o una kata pequena.", types: ["programacion"], priority: "normal", task_kind: "endless", xp_reward: 16, progress_total: 1 },
      { title: "Construir una feature pequena", description: "Entrega un cambio funcional y verificable.", types: ["programacion", "proyecto"], priority: "high", task_kind: "finite", xp_reward: 45, progress_total: 3 },
      { title: "Leer documentacion tecnica", description: "Lee docs oficiales y toma una nota accionable.", types: ["programacion", "estudio"], priority: "normal", task_kind: "endless", xp_reward: 12, progress_total: 1 },
    ],
    skillTree: {
      taskType: "programacion",
      icon: "bolt",
      color: "#3b82f6",
      nodes: [
        { key: "syntax", name: "Sintaxis Clara", description: "Escribes codigo legible y consistente.", icon: "rune", xp_cost: 25, tier: 0 },
        { key: "debug", name: "Debug Metodico", description: "Reproduces, aislas y verificas errores.", icon: "eye", xp_cost: 50, tier: 1, parentKey: "syntax" },
        { key: "architecture", name: "Arquitectura Simple", description: "Separacion clara sin sobreingenieria.", icon: "tree", xp_cost: 70, tier: 2, parentKey: "debug" },
        { key: "delivery", name: "Entrega Confiable", description: "Build, pruebas y commit limpio.", icon: "check", xp_cost: 90, tier: 3, parentKey: "architecture" },
      ],
    },
    bosses: [
      {
        name: "Release sin Drama",
        description: "Cierra una feature con build, pruebas y descripcion clara.",
        icon: "skull",
        difficulty: 4,
        xp_reward: 180,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 6 tareas tecnicas", target_value: 6 },
          { requirement_type: "skill_unlocked", description: "Desbloquea una habilidad tecnica", target_value: 1 },
        ],
        rewards: [
          { reward_type: "title", value: "Ship It", description: "Titulo para una entrega terminada." },
        ],
      },
    ],
    attributes: [
      { name: "Modo Deep Work", description: "Marca de sesiones de foco tecnico.", icon: "bolt", category: "perk", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 3 },
    ],
  },
  {
    id: "english-fluency",
    title: "Ingles Diario",
    discipline: "Ingles",
    summary: "Practica vocabulario, escucha, lectura y conversacion de forma progresiva.",
    icon: "book",
    color: "#f59e0b",
    tags: ["idiomas", "speaking", "vocabulario"],
    tasks: [
      { title: "Vocabulario activo", description: "Aprende 10 palabras y usalas en frases propias.", types: ["ingles"], priority: "normal", task_kind: "endless", xp_reward: 12, progress_total: 1 },
      { title: "Listening concentrado", description: "Escucha 15 minutos y resume la idea principal.", types: ["ingles", "listening"], priority: "normal", task_kind: "endless", xp_reward: 14, progress_total: 1 },
      { title: "Speaking corto", description: "Graba o practica 3 minutos hablando de un tema.", types: ["ingles", "speaking"], priority: "high", task_kind: "endless", xp_reward: 18, progress_total: 1 },
    ],
    skillTree: {
      taskType: "ingles",
      icon: "book",
      color: "#f59e0b",
      nodes: [
        { key: "words", name: "Palabras Utiles", description: "Vocabulario frecuente con contexto.", icon: "book", xp_cost: 20, tier: 0 },
        { key: "ear", name: "Oido Afinado", description: "Reconoces ideas sin traducir todo.", icon: "eye", xp_cost: 45, tier: 1, parentKey: "words" },
        { key: "voice", name: "Voz Sin Miedo", description: "Hablas aunque no sea perfecto.", icon: "flame", xp_cost: 55, tier: 1, parentKey: "words" },
        { key: "flow", name: "Fluidez Practica", description: "Conectas escucha, lectura y conversacion.", icon: "crown", xp_cost: 85, tier: 2, parentKey: "voice" },
      ],
    },
    bosses: [
      {
        name: "Conversacion de 10 Minutos",
        description: "Sostiene una conversacion o monologo en ingles por 10 minutos.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 150,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 10 practicas de ingles", target_value: 10 },
          { requirement_type: "xp_earned", description: "Gana 120 XP total", target_value: 120 },
        ],
        rewards: [
          { reward_type: "badge", value: "English Streak", description: "Insignia por practica constante." },
        ],
      },
    ],
    attributes: [
      { name: "Oido Activo", description: "Badge para sesiones de escucha y pronunciacion.", icon: "book", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "writing-creator",
    title: "Escritura y Contenido",
    discipline: "Escritura",
    summary: "Paquete para publicar ideas, ensayos, guiones o posts sin perder ritmo.",
    icon: "scroll",
    color: "#ec4899",
    tags: ["creatividad", "contenido", "publicar"],
    tasks: [
      { title: "Borrador de 300 palabras", description: "Escribe sin editar demasiado; solo saca material.", types: ["escritura"], priority: "normal", task_kind: "endless", xp_reward: 15, progress_total: 1 },
      { title: "Editar una pieza", description: "Mejora estructura, claridad y cierre.", types: ["escritura", "edicion"], priority: "normal", task_kind: "finite", xp_reward: 35, progress_total: 2 },
      { title: "Publicar o compartir", description: "Publica, manda feedback o guarda version final.", types: ["escritura", "publicacion"], priority: "high", task_kind: "finite", xp_reward: 50, progress_total: 1 },
    ],
    skillTree: {
      taskType: "escritura",
      icon: "scroll",
      color: "#ec4899",
      nodes: [
        { key: "draft", name: "Borrador Valiente", description: "Generas paginas sin frenar por perfeccionismo.", icon: "scroll", xp_cost: 25, tier: 0 },
        { key: "structure", name: "Estructura", description: "Ordenas ideas para que respiren.", icon: "map", xp_cost: 50, tier: 1, parentKey: "draft" },
        { key: "voice", name: "Voz Propia", description: "Tu estilo se vuelve reconocible.", icon: "flame", xp_cost: 70, tier: 2, parentKey: "structure" },
        { key: "publish", name: "Publicador", description: "Cierras ciclos y muestras tu trabajo.", icon: "crown", xp_cost: 90, tier: 3, parentKey: "voice" },
      ],
    },
    bosses: [
      {
        name: "Pieza Publicada",
        description: "Termina y comparte una pieza completa.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 140,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 5 tareas de escritura", target_value: 5 },
          { requirement_type: "skill_unlocked", description: "Desbloquea una skill creativa", target_value: 1 },
        ],
        rewards: [
          { reward_type: "title", value: "Autor Constante", description: "Titulo por terminar una pieza." },
        ],
      },
    ],
    attributes: [
      { name: "Pluma Encendida", description: "Badge para mantener una rutina creativa.", icon: "scroll", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "finance-builder",
    title: "Finanzas Personales",
    discipline: "Finanzas",
    summary: "Organiza presupuesto, ahorro, aprendizaje financiero y revisiones mensuales.",
    icon: "gem",
    color: "#14b8a6",
    tags: ["dinero", "habitos", "planificacion"],
    tasks: [
      { title: "Registrar gastos del dia", description: "Anota gastos y detecta fugas pequenas.", types: ["finanzas"], priority: "normal", task_kind: "endless", xp_reward: 10, progress_total: 1 },
      { title: "Revision de presupuesto", description: "Compara plan contra realidad y ajusta categorias.", types: ["finanzas", "presupuesto"], priority: "high", task_kind: "finite", xp_reward: 40, progress_total: 3 },
      { title: "Aprender un concepto financiero", description: "Lee sobre ahorro, deuda, inversion o impuestos.", types: ["finanzas", "estudio"], priority: "normal", task_kind: "endless", xp_reward: 14, progress_total: 1 },
    ],
    skillTree: {
      taskType: "finanzas",
      icon: "gem",
      color: "#14b8a6",
      nodes: [
        { key: "track", name: "Registro Claro", description: "Sabes a donde se va tu dinero.", icon: "eye", xp_cost: 20, tier: 0 },
        { key: "budget", name: "Presupuesto Vivo", description: "Tu presupuesto se ajusta a la realidad.", icon: "map", xp_cost: 45, tier: 1, parentKey: "track" },
        { key: "saving", name: "Ahorro Automatico", description: "Separar ahorro deja de depender de voluntad.", icon: "gem", xp_cost: 65, tier: 2, parentKey: "budget" },
        { key: "invest", name: "Criterio Inversor", description: "Aprendes antes de arriesgar.", icon: "crown", xp_cost: 90, tier: 3, parentKey: "saving" },
      ],
    },
    bosses: [
      {
        name: "Cierre Financiero Mensual",
        description: "Cierra el mes con gastos revisados, presupuesto ajustado y plan de ahorro.",
        icon: "skull",
        difficulty: 4,
        xp_reward: 160,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 7 acciones financieras", target_value: 7 },
          { requirement_type: "level_reached", description: "Alcanza nivel 2", target_value: 2 },
        ],
        rewards: [
          { reward_type: "badge", value: "Tesorero", description: "Insignia por control financiero." },
        ],
      },
    ],
    attributes: [
      { name: "Control de Recursos", description: "Perk cosmetico para el inventario financiero.", icon: "gem", category: "perk", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 3 },
    ],
  },
  {
    id: "mindfulness-focus",
    title: "Foco y Mindfulness",
    discipline: "Bienestar",
    summary: "Practicas de meditacion, descanso y orden mental para sostener energia.",
    icon: "eye",
    color: "#8b5cf6",
    tags: ["foco", "meditacion", "descanso"],
    tasks: [
      { title: "Meditacion 10 minutos", description: "Respira, observa y vuelve al foco sin pelearte con la mente.", types: ["mindfulness"], priority: "normal", task_kind: "endless", xp_reward: 12, progress_total: 1 },
      { title: "Sesion de foco profundo", description: "Bloque de 25 a 50 minutos sin multitarea.", types: ["mindfulness", "foco"], priority: "high", task_kind: "endless", xp_reward: 18, progress_total: 1 },
      { title: "Cierre del dia", description: "Anota pendientes, gratitud o aprendizaje del dia.", types: ["mindfulness", "reflexion"], priority: "low", task_kind: "endless", xp_reward: 10, progress_total: 1 },
    ],
    skillTree: {
      taskType: "mindfulness",
      icon: "eye",
      color: "#8b5cf6",
      nodes: [
        { key: "breath", name: "Respiracion Base", description: "Vuelves al presente cuando te dispersas.", icon: "eye", xp_cost: 20, tier: 0 },
        { key: "focus", name: "Atencion Sostenida", description: "Proteges bloques de trabajo profundo.", icon: "bolt", xp_cost: 50, tier: 1, parentKey: "breath" },
        { key: "calm", name: "Calma Bajo Presion", description: "Respondes con mas pausa.", icon: "shield", xp_cost: 70, tier: 2, parentKey: "focus" },
        { key: "clarity", name: "Claridad Mental", description: "Cierras el dia con menos ruido interno.", icon: "crown", xp_cost: 85, tier: 3, parentKey: "calm" },
      ],
    },
    bosses: [
      {
        name: "Semana de Foco Limpio",
        description: "Mantiene meditacion, foco profundo y cierre diario durante una semana.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 130,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 9 acciones de foco o mindfulness", target_value: 9 },
          { requirement_type: "xp_earned", description: "Gana 100 XP total", target_value: 100 },
        ],
        rewards: [
          { reward_type: "title", value: "Mente Clara", description: "Titulo por sostener calma y foco." },
        ],
      },
    ],
    attributes: [
      { name: "Centro Interior", description: "Badge de bienestar y foco.", icon: "eye", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "nutrition-cooking",
    title: "Cocina y Nutricion",
    discipline: "Nutricion",
    summary: "Planifica comidas, aprende recetas base y mejora energia sin complicarte.",
    icon: "potion",
    color: "#f97316",
    tags: ["salud", "cocina", "habitos"],
    tasks: [
      { title: "Preparar comida casera", description: "Cocina una comida completa con proteina, fibra y carbohidrato util.", types: ["nutricion"], priority: "normal", task_kind: "endless", xp_reward: 14, progress_total: 1 },
      { title: "Planear menu de la semana", description: "Elige comidas simples y deja lista una lista de compras.", types: ["nutricion", "planificacion"], priority: "high", task_kind: "finite", xp_reward: 35, progress_total: 2 },
      { title: "Probar receta nueva", description: "Aprende una receta repetible y ajustala a tu gusto.", types: ["nutricion", "cocina"], priority: "normal", task_kind: "finite", xp_reward: 30, progress_total: 2 },
    ],
    skillTree: {
      taskType: "nutricion",
      icon: "potion",
      color: "#f97316",
      nodes: [
        { key: "basics", name: "Cocina Base", description: "Dominas preparaciones simples y repetibles.", icon: "potion", xp_cost: 20, tier: 0 },
        { key: "planning", name: "Menu Semanal", description: "Compras y cocinas con menos improvisacion.", icon: "map", xp_cost: 45, tier: 1, parentKey: "basics" },
        { key: "balance", name: "Plato Balanceado", description: "Construyes comidas que sostienen energia.", icon: "heart", xp_cost: 60, tier: 2, parentKey: "planning" },
        { key: "chef", name: "Chef Practico", description: "Creas variaciones sin depender de recetas exactas.", icon: "crown", xp_cost: 85, tier: 3, parentKey: "balance" },
      ],
    },
    bosses: [
      {
        name: "Semana de Comidas Reales",
        description: "Completa una semana con comida casera y menu planificado.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 135,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 8 acciones de nutricion", target_value: 8 },
          { requirement_type: "xp_earned", description: "Gana 120 XP total", target_value: 120 },
        ],
        rewards: [
          { reward_type: "badge", value: "Cocina Encendida", description: "Insignia por tomar control de tus comidas." },
        ],
      },
    ],
    attributes: [
      { name: "Despensa Inteligente", description: "Perk cosmetico para habitos de cocina.", icon: "potion", category: "perk", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "music-practice",
    title: "Practica Musical",
    discipline: "Musica",
    summary: "Entrena tecnica, oido y repertorio con sesiones cortas pero constantes.",
    icon: "music",
    color: "#06b6d4",
    tags: ["arte", "practica", "creatividad"],
    tasks: [
      { title: "Practica tecnica 20 minutos", description: "Escalas, acordes, digitacion, ritmo o calentamiento instrumental.", types: ["musica"], priority: "normal", task_kind: "endless", xp_reward: 15, progress_total: 1 },
      { title: "Entrenar oido", description: "Reconoce intervalos, acordes, ritmo o transcribe un fragmento.", types: ["musica", "oido"], priority: "normal", task_kind: "endless", xp_reward: 14, progress_total: 1 },
      { title: "Aprender una pieza", description: "Divide una cancion o pieza en secciones y practica lento.", types: ["musica", "repertorio"], priority: "high", task_kind: "finite", xp_reward: 45, progress_total: 4 },
    ],
    skillTree: {
      taskType: "musica",
      icon: "music",
      color: "#06b6d4",
      nodes: [
        { key: "rhythm", name: "Pulso Estable", description: "Tocas con ritmo y menos prisa.", icon: "clock", xp_cost: 25, tier: 0 },
        { key: "technique", name: "Tecnica Limpia", description: "El sonido mejora por control, no por fuerza.", icon: "bolt", xp_cost: 50, tier: 1, parentKey: "rhythm" },
        { key: "ear", name: "Oido Musical", description: "Reconoces relaciones y corriges afinacion.", icon: "eye", xp_cost: 65, tier: 2, parentKey: "technique" },
        { key: "performance", name: "Interpretacion", description: "Tocas piezas completas con intencion.", icon: "crown", xp_cost: 90, tier: 3, parentKey: "ear" },
      ],
    },
    bosses: [
      {
        name: "Mini Recital",
        description: "Graba o presenta una pieza completa de inicio a fin.",
        icon: "skull",
        difficulty: 4,
        xp_reward: 170,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 10 practicas musicales", target_value: 10 },
          { requirement_type: "skill_unlocked", description: "Desbloquea una habilidad musical", target_value: 1 },
        ],
        rewards: [
          { reward_type: "title", value: "Interprete", description: "Titulo por terminar una pieza musical." },
        ],
      },
    ],
    attributes: [
      { name: "Oido Afinado", description: "Badge para progreso musical constante.", icon: "music", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 3 },
    ],
  },
  {
    id: "design-drawing",
    title: "Dibujo y Diseno",
    discipline: "Diseno",
    summary: "Practica observacion, composicion, color y entregables visuales.",
    icon: "eye",
    color: "#eab308",
    tags: ["arte", "diseno", "creatividad"],
    tasks: [
      { title: "Sketch diario", description: "Dibuja formas, objetos, poses o thumbnails sin buscar perfeccion.", types: ["diseno"], priority: "normal", task_kind: "endless", xp_reward: 12, progress_total: 1 },
      { title: "Estudio de referencia", description: "Analiza una imagen y replica estructura, luz o color.", types: ["diseno", "estudio"], priority: "normal", task_kind: "endless", xp_reward: 16, progress_total: 1 },
      { title: "Terminar una pieza visual", description: "Cierra una ilustracion, mockup, poster o UI pequena.", types: ["diseno", "proyecto"], priority: "high", task_kind: "finite", xp_reward: 50, progress_total: 4 },
    ],
    skillTree: {
      taskType: "diseno",
      icon: "eye",
      color: "#eab308",
      nodes: [
        { key: "observe", name: "Ojo Entrenado", description: "Ves formas grandes antes de detalles.", icon: "eye", xp_cost: 20, tier: 0 },
        { key: "composition", name: "Composicion", description: "Ordenas jerarquia visual y balance.", icon: "map", xp_cost: 50, tier: 1, parentKey: "observe" },
        { key: "color", name: "Color Funcional", description: "Usas contraste, temperatura y paletas con intencion.", icon: "gem", xp_cost: 65, tier: 2, parentKey: "composition" },
        { key: "finish", name: "Acabado", description: "Terminas piezas sin sobrepulir eternamente.", icon: "check", xp_cost: 90, tier: 3, parentKey: "color" },
      ],
    },
    bosses: [
      {
        name: "Portfolio Piece",
        description: "Termina una pieza visual digna de mostrar.",
        icon: "skull",
        difficulty: 4,
        xp_reward: 165,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 8 ejercicios de diseno", target_value: 8 },
          { requirement_type: "skill_unlocked", description: "Desbloquea una skill visual", target_value: 1 },
        ],
        rewards: [
          { reward_type: "badge", value: "Ojo de Artista", description: "Insignia por terminar una pieza visual." },
        ],
      },
    ],
    attributes: [
      { name: "Paleta Personal", description: "Badge de progreso visual.", icon: "gem", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "reading-research",
    title: "Lectura e Investigacion",
    discipline: "Investigacion",
    summary: "Convierte lectura, notas y sintesis en conocimiento accionable.",
    icon: "book",
    color: "#a855f7",
    tags: ["lectura", "estudio", "notas"],
    tasks: [
      { title: "Leer 20 paginas", description: "Lee con atencion y marca ideas importantes.", types: ["lectura"], priority: "normal", task_kind: "endless", xp_reward: 12, progress_total: 1 },
      { title: "Tomar notas de investigacion", description: "Resume conceptos, citas utiles y preguntas abiertas.", types: ["lectura", "notas"], priority: "normal", task_kind: "endless", xp_reward: 15, progress_total: 1 },
      { title: "Crear sintesis accionable", description: "Convierte lo leido en una decision, checklist o explicacion propia.", types: ["lectura", "sintesis"], priority: "high", task_kind: "finite", xp_reward: 45, progress_total: 3 },
    ],
    skillTree: {
      taskType: "lectura",
      icon: "book",
      color: "#a855f7",
      nodes: [
        { key: "attention", name: "Lectura Atenta", description: "Lees con foco y objetivo claro.", icon: "book", xp_cost: 20, tier: 0 },
        { key: "notes", name: "Notas Utiles", description: "Capturas ideas sin copiar todo.", icon: "scroll", xp_cost: 45, tier: 1, parentKey: "attention" },
        { key: "connect", name: "Conectar Ideas", description: "Relacionas fuentes y detectas patrones.", icon: "tree", xp_cost: 70, tier: 2, parentKey: "notes" },
        { key: "teach", name: "Explicar Claro", description: "Puedes ensenar lo aprendido con tus palabras.", icon: "crown", xp_cost: 90, tier: 3, parentKey: "connect" },
      ],
    },
    bosses: [
      {
        name: "Informe de Lectura",
        description: "Produce una sintesis clara de un libro, articulo o tema.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 145,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 7 acciones de lectura", target_value: 7 },
          { requirement_type: "xp_earned", description: "Gana 110 XP total", target_value: 110 },
        ],
        rewards: [
          { reward_type: "title", value: "Archivista", description: "Titulo por convertir lectura en conocimiento." },
        ],
      },
    ],
    attributes: [
      { name: "Biblioteca Mental", description: "Perk cosmetico para notas y lectura.", icon: "book", category: "perk", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 3 },
    ],
  },
  {
    id: "home-organization",
    title: "Orden del Hogar",
    discipline: "Hogar",
    summary: "Rutinas para limpiar, ordenar, mantener espacios y reducir friccion diaria.",
    icon: "bag",
    color: "#64748b",
    tags: ["hogar", "orden", "rutina"],
    tasks: [
      { title: "Reset de 15 minutos", description: "Ordena una zona pequena con temporizador.", types: ["hogar"], priority: "normal", task_kind: "endless", xp_reward: 10, progress_total: 1 },
      { title: "Limpieza de zona critica", description: "Cocina, escritorio, ropa, bano o entrada.", types: ["hogar", "limpieza"], priority: "high", task_kind: "finite", xp_reward: 35, progress_total: 3 },
      { title: "Eliminar 5 cosas", description: "Dona, tira, archiva o reubica objetos que sobran.", types: ["hogar", "declutter"], priority: "normal", task_kind: "endless", xp_reward: 14, progress_total: 1 },
    ],
    skillTree: {
      taskType: "hogar",
      icon: "bag",
      color: "#64748b",
      nodes: [
        { key: "reset", name: "Reset Rapido", description: "Recuperas orden sin dedicar todo el dia.", icon: "clock", xp_cost: 20, tier: 0 },
        { key: "systems", name: "Sistema de Lugar", description: "Cada cosa tiene un sitio simple.", icon: "map", xp_cost: 45, tier: 1, parentKey: "reset" },
        { key: "maintenance", name: "Mantenimiento", description: "Evitas que el desorden se acumule.", icon: "shield", xp_cost: 65, tier: 2, parentKey: "systems" },
        { key: "sanctuary", name: "Base Tranquila", description: "Tu espacio apoya tu energia.", icon: "crown", xp_cost: 85, tier: 3, parentKey: "maintenance" },
      ],
    },
    bosses: [
      {
        name: "Habitacion Restaurada",
        description: "Deja una zona completa limpia, ordenada y facil de mantener.",
        icon: "skull",
        difficulty: 3,
        xp_reward: 125,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 8 acciones de hogar", target_value: 8 },
          { requirement_type: "level_reached", description: "Alcanza nivel 2", target_value: 2 },
        ],
        rewards: [
          { reward_type: "badge", value: "Base Ordenada", description: "Insignia por crear un espacio sostenible." },
        ],
      },
    ],
    attributes: [
      { name: "Espacio Claro", description: "Badge para rutinas de orden.", icon: "bag", category: "badge", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 2 },
    ],
  },
  {
    id: "business-marketing",
    title: "Negocio y Marketing",
    discipline: "Negocio",
    summary: "Valida ofertas, crea contenido, habla con clientes y mide resultados.",
    icon: "crown",
    color: "#ef4444",
    tags: ["negocio", "marketing", "ventas"],
    tasks: [
      { title: "Hablar con un cliente", description: "Pregunta por problemas, objeciones o necesidades reales.", types: ["negocio"], priority: "high", task_kind: "endless", xp_reward: 20, progress_total: 1 },
      { title: "Publicar contenido util", description: "Comparte una idea, caso, demo o aprendizaje para tu audiencia.", types: ["negocio", "marketing"], priority: "normal", task_kind: "endless", xp_reward: 16, progress_total: 1 },
      { title: "Mejorar una oferta", description: "Ajusta promesa, precio, landing, propuesta o onboarding.", types: ["negocio", "producto"], priority: "high", task_kind: "finite", xp_reward: 55, progress_total: 3 },
    ],
    skillTree: {
      taskType: "negocio",
      icon: "crown",
      color: "#ef4444",
      nodes: [
        { key: "customer", name: "Cliente Real", description: "Escuchas antes de construir de mas.", icon: "user", xp_cost: 25, tier: 0 },
        { key: "offer", name: "Oferta Clara", description: "Tu propuesta se entiende rapido.", icon: "gem", xp_cost: 55, tier: 1, parentKey: "customer" },
        { key: "channel", name: "Canal de Traccion", description: "Pruebas canales con datos, no intuicion pura.", icon: "map", xp_cost: 75, tier: 2, parentKey: "offer" },
        { key: "scale", name: "Sistema de Venta", description: "Repites lo que funciona sin improvisar cada vez.", icon: "crown", xp_cost: 100, tier: 3, parentKey: "channel" },
      ],
    },
    bosses: [
      {
        name: "Primer Sprint Comercial",
        description: "Valida una oferta con conversaciones, contenido y mejora concreta.",
        icon: "skull",
        difficulty: 5,
        xp_reward: 220,
        requirements: [
          { requirement_type: "tasks_completed", description: "Completa 9 acciones de negocio", target_value: 9 },
          { requirement_type: "skill_unlocked", description: "Desbloquea una skill de negocio", target_value: 1 },
        ],
        rewards: [
          { reward_type: "title", value: "Builder Comercial", description: "Titulo por mover una oferta al mercado." },
        ],
      },
    ],
    attributes: [
      { name: "Olfato de Mercado", description: "Perk cosmetico para validacion y ventas.", icon: "crown", category: "perk", source: "manual", effect_type: "cosmetic", effect_value: 0, rarity: 4 },
    ],
  },
];
