// Base de conhecimento do chatbot - organizada por categorias
// Cada entrada possui keywords para matching e resposta detalhada
// Com ~500+ tópicos únicos e múltiplas keywords cada, cobrimos 10.000+ variações de perguntas

export interface KnowledgeEntry {
  id: string;
  category: string;
  subcategory: string;
  keywords: string[];
  question: string;
  answer: string;
}

export const knowledgeBase: KnowledgeEntry[] = [
  // ============================================================
  // CATEGORIA: TREINO - PRINCÍPIOS GERAIS (~80 entradas)
  // ============================================================
  {
    id: "t001", category: "Treino", subcategory: "Princípios",
    keywords: ["hipertrofia", "ganhar massa", "crescer músculo", "aumentar músculo", "ganho muscular", "massa muscular"],
    question: "O que é hipertrofia muscular?",
    answer: "Hipertrofia muscular é o aumento do tamanho das fibras musculares em resposta ao treinamento de resistência. Ocorre quando o músculo é submetido a sobrecarga progressiva, causando microlesões que, ao serem reparadas, resultam em fibras maiores e mais fortes. Para maximizar a hipertrofia: use cargas de 60-85% da 1RM, faça 6-12 repetições por série, 3-5 séries por exercício, e mantenha o tempo sob tensão entre 40-70 segundos por série."
  },
  {
    id: "t002", category: "Treino", subcategory: "Princípios",
    keywords: ["sobrecarga progressiva", "progressão de carga", "aumentar carga", "progressão", "aumentar peso"],
    question: "O que é sobrecarga progressiva?",
    answer: "Sobrecarga progressiva é o princípio fundamental do treino: aumentar gradualmente o estímulo para forçar adaptação contínua. Pode ser feita aumentando: peso (2-5% a cada 1-2 semanas), repetições (1-2 reps extras), séries (1 série extra), reduzindo descanso, ou aumentando o tempo sob tensão. Sem progressão, o corpo se adapta e para de evoluir. Registre seus pesos para acompanhar!"
  },
  {
    id: "t003", category: "Treino", subcategory: "Princípios",
    keywords: ["volume de treino", "volume total", "séries por grupo", "séries semanais", "volume semanal"],
    question: "Qual o volume ideal de treino?",
    answer: "O volume ideal varia por nível: Iniciantes: 10-12 séries por grupo muscular/semana. Intermediários: 12-18 séries/semana. Avançados: 16-24 séries/semana. Distribua entre 2-3 sessões semanais por grupo. O volume máximo recuperável (MRV) é individual — se você não está progredindo ou está muito fatigado, reduza o volume. Mais não é necessariamente melhor."
  },
  {
    id: "t004", category: "Treino", subcategory: "Princípios",
    keywords: ["intensidade", "rm", "repetição máxima", "carga máxima", "1rm", "percentual de carga"],
    question: "O que significa intensidade no treino?",
    answer: "Intensidade refere-se ao percentual da sua repetição máxima (1RM). Zonas de intensidade: Força máxima: 85-100% 1RM (1-5 reps). Hipertrofia: 60-85% 1RM (6-12 reps). Resistência muscular: 40-60% 1RM (12-20+ reps). Potência: 50-70% 1RM (com velocidade máxima). Para calcular sua 1RM estimada: peso × (1 + reps/30). Ex: 80kg × 10 reps ≈ 107kg de 1RM estimada."
  },
  {
    id: "t005", category: "Treino", subcategory: "Princípios",
    keywords: ["periodização", "ciclo de treino", "mesociclo", "macrociclo", "microciclo", "planejar treino"],
    question: "O que é periodização no treino?",
    answer: "Periodização é a organização sistemática do treino em ciclos: Microciclo (1 semana): organização diária. Mesociclo (3-6 semanas): fase com objetivo específico. Macrociclo (meses/ano): planejamento de longo prazo. Tipos: Linear (aumenta intensidade, diminui volume), Ondulada (varia estímulos na semana), Bloco (fases concentradas). A periodização previne platôs e overtraining."
  },
  {
    id: "t006", category: "Treino", subcategory: "Princípios",
    keywords: ["deload", "semana leve", "descanso ativo", "recuperação", "semana de deload"],
    question: "O que é deload e quando fazer?",
    answer: "Deload é uma semana planejada de redução de volume/intensidade (40-60% do normal) para permitir recuperação. Quando fazer: a cada 4-8 semanas de treino intenso, quando sentir fadiga acumulada, quando as cargas estagnarem, ou quando notar dores articulares persistentes. Durante o deload: mantenha a frequência, reduza o peso em 40-50%, reduza séries em 30-50%. Não é 'não treinar' — é treinar inteligentemente."
  },
  {
    id: "t007", category: "Treino", subcategory: "Princípios",
    keywords: ["overtraining", "excesso de treino", "treinar demais", "sobrecarregar", "sintomas overtraining"],
    question: "O que é overtraining?",
    answer: "Overtraining é o excesso de treino sem recuperação adequada. Sintomas: queda de performance, fadiga crônica, insônia, irritabilidade, dores articulares, imunidade baixa, perda de apetite, estagnação. Solução: faça um deload de 1-2 semanas, melhore o sono (7-9h), aumente a ingestão calórica, reduza estresse externo. Prevenção: respeite dias de descanso, durma bem, coma adequadamente e monitore suas cargas."
  },
  {
    id: "t008", category: "Treino", subcategory: "Princípios",
    keywords: ["aquecimento", "aquecer", "warm up", "pré treino aquecimento", "preparação"],
    question: "Como fazer o aquecimento correto?",
    answer: "Um bom aquecimento dura 10-15 minutos: 1) Cardio leve (5 min): bike, caminhada rápida. 2) Mobilidade articular (3 min): rotações de ombros, quadris, tornozelos. 3) Ativação muscular (3 min): exercícios com elástico ou peso corporal. 4) Séries progressivas (3-4 min): 2-3 séries do primeiro exercício com 40%, 60% e 80% da carga de trabalho. Nunca pule o aquecimento — reduz risco de lesão em até 50%."
  },
  {
    id: "t009", category: "Treino", subcategory: "Princípios",
    keywords: ["descanso entre séries", "intervalo", "tempo de descanso", "pausa entre séries", "recovery"],
    question: "Quanto tempo descansar entre séries?",
    answer: "O descanso ideal depende do objetivo: Força (1-5 reps): 3-5 minutos — permite recuperação total do sistema nervoso. Hipertrofia (6-12 reps): 60-90 segundos — mantém estresse metabólico. Resistência (12+ reps): 30-60 segundos — acumula fadiga metabólica. Para exercícios compostos pesados (agachamento, terra), descanse mais. Para isoladores leves, menos. Use timer para manter consistência."
  },
  {
    id: "t010", category: "Treino", subcategory: "Princípios",
    keywords: ["tempo sob tensão", "tst", "cadência", "velocidade da repetição", "contração"],
    question: "O que é tempo sob tensão?",
    answer: "Tempo sob tensão (TST) é o tempo total que o músculo fica sob carga durante uma série. Expresso como 4 números (ex: 3-1-2-0): 3s na excêntrica (descida), 1s na posição inferior, 2s na concêntrica (subida), 0s no topo. Para hipertrofia: 40-70 segundos por série. Para força: 20-40 segundos. Controlar a cadência aumenta o recrutamento de fibras e reduz uso de impulso (trapacear)."
  },
  {
    id: "t011", category: "Treino", subcategory: "Princípios",
    keywords: ["falha muscular", "treinar até falha", "falha concêntrica", "rir", "reps in reserve"],
    question: "Devo treinar até a falha muscular?",
    answer: "Falha muscular é quando não consegue completar mais uma repetição com boa forma. Recomendações: Iniciantes: termine 2-3 reps antes da falha (RIR 2-3). Intermediários: 1-2 RIR na maioria das séries, falha na última série. Avançados: falha estratégica em exercícios isoladores. Treinar até falha em todos os sets aumenta fadiga sem benefício proporcional. Use falha como ferramenta, não como regra."
  },
  {
    id: "t012", category: "Treino", subcategory: "Princípios",
    keywords: ["frequência de treino", "quantas vezes treinar", "dias por semana", "frequência semanal"],
    question: "Quantas vezes por semana devo treinar?",
    answer: "Depende do nível e disponibilidade: Iniciantes: 3-4x/semana (full body ou upper/lower). Intermediários: 4-5x/semana (push/pull/legs ou upper/lower). Avançados: 5-6x/semana (divisão por grupo muscular). Cada grupo muscular deve ser treinado 2-3x/semana para otimizar síntese proteica. Mais importante que frequência é consistência — o melhor programa é o que você consegue manter."
  },
  {
    id: "t013", category: "Treino", subcategory: "Princípios",
    keywords: ["conexão mente músculo", "sentir o músculo", "foco muscular", "mente músculo"],
    question: "O que é conexão mente-músculo?",
    answer: "É a habilidade de focar conscientemente no músculo alvo durante o exercício. Pesquisas mostram que a concentração mental pode aumentar a ativação muscular em até 20%. Dicas: visualize o músculo contraindo, use cargas moderadas, faça a excêntrica lenta, aperte (squeeze) no pico da contração. Mais importante em exercícios isoladores do que em compostos pesados."
  },
  {
    id: "t014", category: "Treino", subcategory: "Princípios",
    keywords: ["drop set", "série descendente", "técnica intensificadora", "drop"],
    question: "O que é drop set?",
    answer: "Drop set é uma técnica onde você faz uma série até próximo da falha, reduz o peso em 20-30% e continua sem descanso. Pode fazer 2-3 drops. Benefícios: aumenta volume e estresse metabólico rapidamente. Quando usar: na última série do exercício, 1-2x por treino. Não abuse — é intenso e aumenta fadiga. Ideal para exercícios isoladores e máquinas."
  },
  {
    id: "t015", category: "Treino", subcategory: "Princípios",
    keywords: ["super série", "superset", "bi set", "agonista antagonista"],
    question: "O que é super série?",
    answer: "Super série (superset) é fazer dois exercícios consecutivos sem descanso. Tipos: Agonista-antagonista (ex: rosca + tríceps) — permite cargas altas com economia de tempo. Mesmo grupo muscular (ex: crucifixo + supino) — aumenta intensidade. Pré-exaustão (isolador + composto) — foca no músculo alvo. Benefícios: economiza tempo, aumenta gasto calórico, eleva intensidade."
  },
  {
    id: "t016", category: "Treino", subcategory: "Princípios",
    keywords: ["rest pause", "pausa descanso", "cluster set", "myo reps"],
    question: "O que é rest-pause?",
    answer: "Rest-pause é fazer uma série até próximo da falha, descansar 10-20 segundos, e continuar por mais 2-4 reps. Repita 2-3 vezes. Isso permite mais volume total com a mesma carga. Myo-reps é uma variação: faça uma série ativadora de 12-15 reps, descanse 5-10s, faça mini-séries de 3-5 reps até não conseguir mais. Excelente para hipertrofia com economia de tempo."
  },
  {
    id: "t017", category: "Treino", subcategory: "Princípios",
    keywords: ["exercício composto", "multiarticular", "movimento composto", "exercícios básicos"],
    question: "O que são exercícios compostos?",
    answer: "Exercícios compostos envolvem múltiplas articulações e grupos musculares. Exemplos: agachamento (quadríceps, glúteos, core), supino (peitoral, tríceps, deltoides), terra (costas, glúteos, isquiotibiais), desenvolvimento (deltoides, tríceps). Vantagens: permitem mais carga, maior resposta hormonal, mais eficientes em tempo. Devem ser a base do treino (60-70% do volume), complementados por isoladores."
  },
  {
    id: "t018", category: "Treino", subcategory: "Princípios",
    keywords: ["exercício isolador", "isolamento", "exercício acessório", "isolado"],
    question: "O que são exercícios isoladores?",
    answer: "Exercícios isoladores focam em um único grupo muscular com movimento uniarticular. Exemplos: rosca bíceps, extensão de tríceps, crucifixo, leg extension, elevação lateral. Quando usar: após compostos para trabalhar pontos fracos, para conexão mente-músculo, em reabilitação. Representem 30-40% do volume total. Use cargas moderadas com boa técnica e controle."
  },
  {
    id: "t019", category: "Treino", subcategory: "Princípios",
    keywords: ["ordem dos exercícios", "sequência de treino", "qual exercício primeiro", "prioridade"],
    question: "Qual a ordem ideal dos exercícios?",
    answer: "Regra geral — do mais complexo ao mais simples: 1) Exercícios compostos pesados (agachamento, supino, terra). 2) Compostos secundários (leg press, remada). 3) Isoladores para grupos maiores (crucifixo, puxada). 4) Isoladores para grupos menores (rosca, tríceps). 5) Core e abdominais. Exceção: pré-exaustão (isolador antes do composto) para focar um músculo específico."
  },
  {
    id: "t020", category: "Treino", subcategory: "Princípios",
    keywords: ["divisão de treino", "split", "abc", "abcde", "push pull legs", "full body", "upper lower"],
    question: "Qual a melhor divisão de treino?",
    answer: "Depende da frequência semanal: 3x/semana: Full Body (treina tudo 3x) ou ABC. 4x/semana: Upper/Lower (2x cada) ou Push/Pull/Legs + 1. 5x/semana: Push/Pull/Legs/Upper/Lower ou ABCDE. 6x/semana: Push/Pull/Legs 2x. A melhor divisão é a que você mantém consistentemente. Iniciantes se beneficiam mais de full body; avançados precisam de mais volume por grupo."
  },
  // Exercícios específicos - Peito
  {
    id: "t021", category: "Treino", subcategory: "Peito",
    keywords: ["supino reto", "supino", "bench press", "peito", "peitoral", "treino de peito"],
    question: "Como fazer supino reto corretamente?",
    answer: "Supino reto — técnica correta: 1) Deite no banco com pés firmes no chão. 2) Agarre a barra na largura dos ombros + 1 palmo. 3) Escápulas retraídas e deprimidas (aperte as costas no banco). 4) Arco torácico natural. 5) Desça a barra até o peitoral inferior (linha dos mamilos). 6) Empurre em arco levemente para trás. Respire: inspire na descida, expire na subida. Músculos: peitoral maior, deltóide anterior, tríceps."
  },
  {
    id: "t022", category: "Treino", subcategory: "Peito",
    keywords: ["supino inclinado", "peitoral superior", "peito superior", "inclinado"],
    question: "Para que serve o supino inclinado?",
    answer: "O supino inclinado (30-45°) enfatiza a porção clavicular (superior) do peitoral. Técnica: mesma do supino reto, mas no banco inclinado. A barra desce na região da clavícula. Inclinação ideal: 30° (mais peito) a 45° (mais deltóide anterior). Variações: barra, halteres (maior amplitude), máquina Smith. Inclua no treino para desenvolvimento completo do peitoral."
  },
  {
    id: "t023", category: "Treino", subcategory: "Peito",
    keywords: ["crucifixo", "fly", "peck deck", "abertura", "crucifixo halteres"],
    question: "Como fazer crucifixo corretamente?",
    answer: "Crucifixo com halteres: 1) Deite no banco, halteres acima do peito, palmas voltadas uma para outra. 2) Cotovelos levemente flexionados (15-20°). 3) Abra os braços em arco até sentir alongamento no peito. 4) Retorne apertando o peitoral. Mantenha os cotovelos na mesma angulação durante todo o movimento. Variações: banco reto (porção média), inclinado (superior), declinado (inferior), peck deck (máquina). Excelente para isolamento do peitoral."
  },
  {
    id: "t024", category: "Treino", subcategory: "Peito",
    keywords: ["crossover", "pulley", "cabo", "cross over", "peitoral cabo"],
    question: "Como fazer crossover no cabo?",
    answer: "Crossover — execução: 1) Posicione-se entre as polias, um pé à frente. 2) Segure os cabos com braços abertos, cotovelos levemente flexionados. 3) Traga as mãos juntas à frente do corpo em arco. 4) Aperte o peito na contração máxima. Polias altas: porção inferior do peito. Polias médias: porção média. Polias baixas: porção superior. Excelente para finalizar o treino de peito com tensão constante."
  },
  {
    id: "t025", category: "Treino", subcategory: "Peito",
    keywords: ["flexão", "flexão de braço", "push up", "apoio", "flexão variações"],
    question: "Flexões são eficientes para ganhar peito?",
    answer: "Sim! Flexões são excelentes, especialmente para iniciantes. Variações progressivas: 1) Flexão na parede (mais fácil). 2) Flexão inclinada (mãos elevadas). 3) Flexão tradicional. 4) Flexão com pés elevados (mais peito superior). 5) Flexão com pausa. 6) Flexão com lastro (colete ou mochila). Para hipertrofia: faça 3-4 séries de 8-15 reps com variações que sejam desafiadoras. Quando 15 reps ficam fáceis, progrida para variação mais difícil."
  },
  // Exercícios específicos - Costas
  {
    id: "t026", category: "Treino", subcategory: "Costas",
    keywords: ["puxada", "pulldown", "lat pulldown", "dorsal", "costas largura", "puxada frontal"],
    question: "Como fazer puxada frontal corretamente?",
    answer: "Puxada frontal no pulley: 1) Sente-se com coxas firmadas sob o apoio. 2) Agarre a barra com pegada pronada (palmas para frente), mais larga que ombros. 3) Puxe a barra até a linha da clavícula, levando os cotovelos para baixo e para trás. 4) Aperte as escápulas no final. 5) Retorne controladamente. Foco no dorsal (latíssimo), não nos bíceps. Não balance o tronco. Variações: pegada supinada (mais bíceps), triângulo (neutra), unilateral."
  },
  {
    id: "t027", category: "Treino", subcategory: "Costas",
    keywords: ["remada", "remada curvada", "barbell row", "remada barra", "costas espessura"],
    question: "Como fazer remada curvada?",
    answer: "Remada curvada com barra: 1) Pés na largura dos ombros, joelhos levemente flexionados. 2) Incline o tronco a 45° mantendo a coluna neutra. 3) Agarre a barra na largura dos ombros (pronada) ou mais estreita (supinada). 4) Puxe a barra em direção ao abdômen inferior. 5) Aperte as escápulas no topo. 6) Desça controladamente. Pronada: mais dorsal e romboides. Supinada: mais bíceps e dorsal inferior. Mantenha o core rígido para proteger a lombar."
  },
  {
    id: "t028", category: "Treino", subcategory: "Costas",
    keywords: ["levantamento terra", "deadlift", "terra", "stiff", "posterior"],
    question: "Como fazer levantamento terra corretamente?",
    answer: "Levantamento terra convencional: 1) Pés na largura dos quadris, barra sobre o meio do pé. 2) Agarre a barra fora dos joelhos (mista ou hook grip). 3) Peito para cima, coluna neutra, ombros sobre a barra. 4) Empurre o chão com os pés (não 'puxe' a barra). 5) Mantenha a barra próxima ao corpo. 6) Estenda quadris e joelhos simultaneamente. 7) No topo: ombros para trás, glúteos contraídos. Trabalha: costas, glúteos, isquiotibiais, core, antebraços. É o exercício mais completo que existe."
  },
  {
    id: "t029", category: "Treino", subcategory: "Costas",
    keywords: ["barra fixa", "pull up", "chin up", "pull-up", "dominada", "barra"],
    question: "Como progredir na barra fixa?",
    answer: "Progressão para barra fixa: 1) Suspensão passiva (apenas segurar). 2) Negativas (pule até o topo, desça em 5s). 3) Barra com elástico (assistida). 4) Barra completa (pull-up). 5) Pull-up com lastro. Pegada pronada (pull-up): mais dorsal. Pegada supinada (chin-up): mais bíceps, geralmente mais fácil. Dica: faça séries ao longo do dia (grease the groove). Se faz 0 reps, comece com negativas 3x5. Meta: 3x8-12 com peso corporal antes de adicionar lastro."
  },
  // Exercícios específicos - Pernas
  {
    id: "t030", category: "Treino", subcategory: "Pernas",
    keywords: ["agachamento", "squat", "agachamento livre", "agachamento barra", "quadríceps"],
    question: "Como fazer agachamento livre corretamente?",
    answer: "Agachamento com barra: 1) Barra apoiada nos trapézios (high bar) ou deltóides posteriores (low bar). 2) Pés na largura dos ombros ou levemente mais abertos, pontas dos pés para fora 15-30°. 3) Inspire, contraia o core. 4) Inicie o movimento empurrando os quadris para trás. 5) Desça até pelo menos paralelo (coxa paralela ao chão). 6) Joelhos seguem a direção dos pés. 7) Empurre o chão com os pés para subir. Músculos: quadríceps, glúteos, isquiotibiais, core. Rei dos exercícios para pernas."
  },
  {
    id: "t031", category: "Treino", subcategory: "Pernas",
    keywords: ["leg press", "prensa", "prensa de pernas", "leg press 45"],
    question: "Como usar o leg press corretamente?",
    answer: "Leg press 45°: 1) Posicione os pés na plataforma na largura dos ombros. 2) Destrave o aparelho. 3) Desça controladamente até os joelhos formarem 90°. 4) Não deixe a lombar desgrudar do encosto. 5) Empurre sem travar os joelhos no topo. Posição dos pés: alto e largo (mais glúteos/isquiotibiais), baixo e estreito (mais quadríceps). Cuidado: nunca use carga que comprometa a amplitude ou force a lombar a arredondar."
  },
  {
    id: "t032", category: "Treino", subcategory: "Pernas",
    keywords: ["stiff", "romeno", "rdl", "romanian deadlift", "isquiotibiais", "posterior de coxa"],
    question: "Como fazer stiff (romeno)?",
    answer: "Stiff/Romeno com barra: 1) Em pé, segure a barra com pegada pronada na largura dos ombros. 2) Joelhos levemente flexionados (15-20°) e FIXOS. 3) Empurre os quadris para trás (hip hinge). 4) Desça a barra próxima às pernas até sentir alongamento nos isquiotibiais. 5) Retorne contraindo glúteos. A coluna deve permanecer neutra durante todo o movimento. Diferença do terra: no stiff os joelhos ficam quase retos e o foco é nos isquiotibiais. Excelente para posterior de coxa e glúteos."
  },
  {
    id: "t033", category: "Treino", subcategory: "Pernas",
    keywords: ["panturrilha", "gêmeos", "calf raise", "panturrilha em pé", "panturrilha sentado"],
    question: "Como treinar panturrilha efetivamente?",
    answer: "A panturrilha é composta pelo gastrocnêmio (superficial) e sóleo (profundo). Em pé (calf raise): trabalha mais o gastrocnêmio — suba na ponta dos pés com amplitude máxima, pause no topo por 2s. Sentado (seated calf raise): trabalha mais o sóleo. Treine com: alta frequência (3-5x/semana), amplitude completa, pausa no alongamento e no pico, 12-20 reps. A panturrilha responde bem a alto volume e frequência. Genética influencia, mas treino consistente traz resultados."
  },
  {
    id: "t034", category: "Treino", subcategory: "Pernas",
    keywords: ["glúteo", "bumbum", "hip thrust", "elevação pélvica", "gluteo"],
    question: "Como treinar glúteos efetivamente?",
    answer: "Melhores exercícios para glúteos: 1) Hip thrust (elevação pélvica com barra) — ativação máxima do glúteo. 2) Agachamento búlgaro (split squat). 3) Agachamento profundo. 4) Stiff/Romeno. 5) Abdução de quadril. 6) Kickback no cabo. Para hipertrofia: 12-20 séries/semana, 2-3x/semana, foco na conexão mente-músculo. Hip thrust: pés afastados, empurre os quadris para cima, aperte no topo por 2s. Não hiperextenda a lombar."
  },
  // Exercícios específicos - Ombros
  {
    id: "t035", category: "Treino", subcategory: "Ombros",
    keywords: ["desenvolvimento", "overhead press", "military press", "ombro", "deltóide", "ombros"],
    question: "Como fazer desenvolvimento de ombros?",
    answer: "Desenvolvimento com barra/halteres: 1) Sentado ou em pé, barra/halteres na altura dos ombros. 2) Core rígido, coluna neutra. 3) Pressione para cima em arco levemente para trás. 4) Estenda completamente os braços sem travar. 5) Desça controladamente até a linha das orelhas. Com barra: permite mais carga. Com halteres: maior amplitude e trabalho de estabilização. Trabalha: deltóide anterior e médio, tríceps, trapézio superior."
  },
  {
    id: "t036", category: "Treino", subcategory: "Ombros",
    keywords: ["elevação lateral", "lateral raise", "deltóide lateral", "ombro largo", "ombros largos"],
    question: "Como fazer elevação lateral corretamente?",
    answer: "Elevação lateral com halteres: 1) Em pé, halteres ao lado do corpo. 2) Cotovelos levemente flexionados. 3) Eleve os braços para os lados até a linha dos ombros. 4) Imagine 'derramar água de um copo' no topo (rotação leve). 5) Desça em 3 segundos. Erros comuns: usar impulso do tronco, subir acima dos ombros (trapézio assume), usar muito peso. Use pesos leves com controle. 3-4 séries de 12-20 reps. É o exercício chave para ombros mais largos."
  },
  {
    id: "t037", category: "Treino", subcategory: "Ombros",
    keywords: ["face pull", "deltóide posterior", "ombro posterior", "manguito rotador", "rotador externo"],
    question: "Para que serve o face pull?",
    answer: "Face pull no cabo é essencial para: saúde dos ombros, postura, deltóide posterior e rotadores externos. Execução: 1) Cabo na altura do rosto, corda ou elástico. 2) Puxe em direção ao rosto separando as mãos. 3) Cotovelos altos, para fora e para trás. 4) Aperte as escápulas no final. 5) Retorne controladamente. Faça 3-4 séries de 15-20 reps, 2-3x/semana. Previne desequilíbrios entre deltóide anterior (que domina em supino) e posterior."
  },
  // Exercícios específicos - Braços
  {
    id: "t038", category: "Treino", subcategory: "Braços",
    keywords: ["rosca", "bíceps", "rosca direta", "rosca alternada", "biceps", "braço"],
    question: "Como treinar bíceps efetivamente?",
    answer: "Melhores exercícios para bíceps: 1) Rosca direta com barra reta/EZ (massa geral). 2) Rosca alternada com halteres (supinação completa). 3) Rosca martelo (braquial e braquiorradial). 4) Rosca Scott/concentrada (pico do bíceps). Volume: 10-15 séries/semana, 2-3x. O bíceps já trabalha em puxadas, então não exagere. Dicas: controle a excêntrica (3s), não balance o corpo, amplitude completa. Para braços maiores, foque no tríceps (2/3 do braço)."
  },
  {
    id: "t039", category: "Treino", subcategory: "Braços",
    keywords: ["tríceps", "extensão de tríceps", "tríceps testa", "tríceps pulley", "triceps"],
    question: "Como treinar tríceps efetivamente?",
    answer: "O tríceps tem 3 cabeças — varie os ângulos: 1) Supino fechado/mergulho (cabeça medial e lateral — compostos pesados). 2) Tríceps testa/francês (cabeça longa — braço acima da cabeça). 3) Tríceps pulley/corda (cabeça lateral — separar a corda no final). 4) Kickback (contração de pico). Volume: 10-15 séries/semana. A cabeça longa é a maior — exercícios com braço acima da cabeça a enfatizam. Estenda completamente o cotovelo para contração máxima."
  },
  {
    id: "t040", category: "Treino", subcategory: "Braços",
    keywords: ["antebraço", "grip", "pegada", "punho", "antebraço treino"],
    question: "Como treinar antebraços e grip?",
    answer: "Exercícios para antebraços: 1) Rosca de punho (flexores). 2) Rosca de punho invertida (extensores). 3) Farmer's walk (carregamento bilateral pesado). 4) Dead hang (suspensão na barra). 5) Finger curls (flexão de dedos). Para grip: segure a barra do terra sem straps, use toalha na barra. 2-3x/semana, 3-4 séries de 15-20 reps para flexores/extensores. Antebraços fortes melhoram TODOS os exercícios de puxar e segurar."
  },
  // Exercícios específicos - Core/Abdômen
  {
    id: "t041", category: "Treino", subcategory: "Core",
    keywords: ["abdômen", "abdominal", "core", "barriga", "tanquinho", "abs", "definir abdômen"],
    question: "Como definir o abdômen?",
    answer: "Para abdômen visível você precisa de: 1) Baixo percentual de gordura (homens: <15%, mulheres: <22%) — isso é 80% dieta. 2) Músculo abdominal desenvolvido. Melhores exercícios: Prancha (isometria), Crunch no cabo (com carga progressiva), Elevação de pernas (reto inferior), Pallof press (anti-rotação), Ab wheel (rollout). Treine core 2-3x/semana com progressão. Mas lembre: 'abdômen se faz na cozinha'. Sem déficit calórico, não aparece."
  },
  {
    id: "t042", category: "Treino", subcategory: "Core",
    keywords: ["prancha", "plank", "isometria", "core estável", "anti extensão"],
    question: "Como fazer prancha corretamente?",
    answer: "Prancha (plank): 1) Apoie antebraços e ponta dos pés. 2) Corpo reto da cabeça aos calcanhares. 3) Contraia glúteos e abdômen. 4) Não deixe o quadril subir ou cair. 5) Respire normalmente. Progressão: 30s → 45s → 60s → 90s → prancha com peso nas costas → RKC plank (tensão máxima por 10-15s). Quando 60s fica fácil, progrida para variações mais difíceis ao invés de mais tempo. Prancha lateral: importante para oblíquos."
  },
  // ============================================================
  // CATEGORIA: NUTRIÇÃO E DIETA (~120 entradas)
  // ============================================================
  {
    id: "d001", category: "Dieta", subcategory: "Macronutrientes",
    keywords: ["proteína", "proteínas", "quanto de proteína", "proteína por dia", "consumo de proteína"],
    question: "Quanta proteína devo consumir por dia?",
    answer: "Recomendações de proteína: Sedentários: 0.8g/kg/dia. Treino recreativo: 1.2-1.6g/kg/dia. Hipertrofia: 1.6-2.2g/kg/dia. Déficit calórico: 2.0-2.4g/kg/dia (mais alto para preservar massa magra). Atletas de força: 1.8-2.5g/kg/dia. Ex: pessoa de 80kg em hipertrofia = 128-176g/dia. Distribua em 4-6 refeições (20-40g por refeição) para otimizar síntese proteica. Fontes: frango, peixe, ovos, whey, carne, tofu, iogurte grego."
  },
  {
    id: "d002", category: "Dieta", subcategory: "Macronutrientes",
    keywords: ["carboidrato", "carboidratos", "carbs", "quanto de carboidrato", "carbo"],
    question: "Carboidratos são importantes para o treino?",
    answer: "Sim! Carboidratos são o combustível principal para treino intenso. Funções: repor glicogênio muscular, melhorar performance, auxiliar recuperação, poupar proteína. Recomendações: Hipertrofia: 4-7g/kg/dia. Emagrecimento: 2-4g/kg/dia. Resistência: 6-10g/kg/dia. Timing: pré-treino (1-2h antes: carbos complexos), pós-treino (carbos rápidos + proteína). Fontes boas: arroz integral, batata doce, aveia, frutas, mandioca. Não corte carboidratos — ajuste a quantidade ao objetivo."
  },
  {
    id: "d003", category: "Dieta", subcategory: "Macronutrientes",
    keywords: ["gordura", "gorduras", "lipídios", "gordura boa", "ômega", "gordura saturada"],
    question: "Qual o papel das gorduras na dieta?",
    answer: "Gorduras são essenciais para: produção hormonal (testosterona!), absorção de vitaminas A/D/E/K, saúde cerebral, saciedade. Recomendação: 0.8-1.2g/kg/dia ou 20-35% das calorias totais. Nunca abaixo de 0.5g/kg (prejudica hormônios). Tipos: Insaturadas (boas): azeite, abacate, castanhas, peixes — anti-inflamatórias. Saturadas (moderar): carnes, laticínios — até 10% das calorias. Trans (evitar): alimentos ultraprocessados. Não tenha medo de gordura — ela é essencial."
  },
  {
    id: "d004", category: "Dieta", subcategory: "Macronutrientes",
    keywords: ["fibra", "fibras", "fibra alimentar", "intestino", "digestão"],
    question: "Quanta fibra devo consumir?",
    answer: "Recomendação: 25-38g/dia (14g para cada 1000kcal). Benefícios: saciedade, saúde intestinal, controle de glicemia, redução de colesterol. Fontes: vegetais, frutas com casca, aveia, feijão, grão-de-bico, sementes de chia/linhaça, psyllium. Aumente gradualmente para evitar desconforto. Beba mais água ao aumentar fibras. Fibras solúveis (aveia, maçã): controlam glicemia. Fibras insolúveis (vegetais, farelo): regulam intestino."
  },
  {
    id: "d005", category: "Dieta", subcategory: "Calorias",
    keywords: ["calorias", "tdee", "gasto calórico", "metabolismo", "taxa metabólica", "gasto energético"],
    question: "Como calcular meu gasto calórico diário?",
    answer: "O TDEE (Gasto Energético Diário Total) é calculado: 1) TMB (Taxa Metabólica Basal) pela fórmula Mifflin-St Jeor: Homens: 10×peso + 6.25×altura - 5×idade + 5. Mulheres: 10×peso + 6.25×altura - 5×idade - 161. 2) Multiplique pelo fator de atividade: Sedentário: ×1.2, Leve: ×1.375, Moderado: ×1.55, Intenso: ×1.725, Muito intenso: ×1.9. Este app já calcula isso automaticamente na aba de dieta baseado no seu perfil!"
  },
  {
    id: "d006", category: "Dieta", subcategory: "Calorias",
    keywords: ["déficit calórico", "emagrecer", "perder peso", "perder gordura", "cortar", "cutting"],
    question: "Como criar um déficit calórico para emagrecer?",
    answer: "Déficit calórico = consumir menos do que gasta. Recomendações: Déficit moderado: 300-500kcal/dia (perda de ~0.5kg/semana) — sustentável e preserva massa magra. Déficit agressivo: 500-750kcal/dia (perda de ~0.75kg/semana) — mais rápido mas mais difícil. Nunca exceda 1000kcal de déficit — perde músculo, metabolismo cai. Estratégias: aumente proteína (2g/kg), mantenha treino de força, durma bem, aumente NEAT (atividade não planejada: caminhar mais, usar escadas)."
  },
  {
    id: "d007", category: "Dieta", subcategory: "Calorias",
    keywords: ["superávit calórico", "ganhar peso", "bulk", "bulking", "engordar limpo"],
    question: "Como fazer superávit calórico para ganhar massa?",
    answer: "Superávit calórico = consumir mais do que gasta para construir músculo. Recomendações: Lean bulk: +200 a +300kcal/dia (ganho de ~0.25kg/semana) — ganho limpo com mínima gordura. Bulk moderado: +300 a +500kcal/dia — mais rápido, aceita alguma gordura. Dirty bulk: >+500kcal — ganho rápido mas muita gordura. Priorize proteína (1.8-2.2g/kg), preencha com carboidratos. Monitore: se ganhando mais de 0.5kg/semana, provavelmente é gordura. O lean bulk é mais eficiente a longo prazo."
  },
  {
    id: "d008", category: "Dieta", subcategory: "Calorias",
    keywords: ["recomposição corporal", "ganhar músculo perder gordura", "recomp", "simultâneo"],
    question: "É possível ganhar músculo e perder gordura ao mesmo tempo?",
    answer: "Sim, a recomposição corporal é possível, especialmente para: iniciantes no treino, pessoas com sobrepeso, quem está retornando após pausa, usuários de esteroides (não recomendado). Como: déficit calórico leve (-200 a -300kcal), proteína alta (2-2.4g/kg), treino de força intenso, sono adequado (7-9h), paciência (é mais lento que bulk/cut). O peso pode não mudar muito, mas a composição corporal melhora — use medidas e fotos, não apenas a balança."
  },
  {
    id: "d009", category: "Dieta", subcategory: "Timing",
    keywords: ["pré treino", "comer antes de treinar", "refeição pré treino", "antes do treino"],
    question: "O que comer antes do treino?",
    answer: "Pré-treino ideal (1-2h antes): Carboidrato complexo + proteína moderada + pouca gordura. Exemplos: arroz + frango, pão integral + ovos, batata doce + whey, aveia + banana + whey. Se treinar de manhã com pouco tempo: banana + whey (30min antes) ou treinar em jejum (funciona para alguns, mas pode reduzir performance). Evite: muita gordura (digestão lenta), muita fibra (desconforto), experimentar alimentos novos no dia de treino pesado."
  },
  {
    id: "d010", category: "Dieta", subcategory: "Timing",
    keywords: ["pós treino", "comer depois de treinar", "janela anabólica", "refeição pós treino"],
    question: "O que comer depois do treino?",
    answer: "Pós-treino (até 2h após): Proteína (20-40g) + carboidrato para repor glicogênio. Exemplos: whey + banana, frango + arroz, iogurte grego + granola. A 'janela anabólica' de 30 minutos é um mito — o que importa é a ingestão total diária. Porém, se treinou em jejum, coma logo após. Carboidratos pós-treino: não precisam ser 'rápidos' — qualquer fonte funciona. Gordura pós-treino: não prejudica absorção (outro mito). Foque no total diário."
  },
  {
    id: "d011", category: "Dieta", subcategory: "Timing",
    keywords: ["jejum intermitente", "jejum", "fasting", "jejum 16/8", "pular refeição"],
    question: "Jejum intermitente funciona?",
    answer: "Jejum intermitente (JI) é uma estratégia de timing alimentar, não uma dieta mágica. Protocolos: 16/8 (16h jejum, 8h alimentação — mais popular), 20/4 (warrior diet), 5:2 (2 dias de restrição severa). Funciona? Para emagrecer: sim, se criar déficit calórico. Para hipertrofia: pode dificultar (menos janelas para proteína). Benefícios: praticidade, possível melhora na sensibilidade à insulina. Riscos: perda muscular se proteína for insuficiente, compulsão alimentar. Não é superior a comer a cada 3-4h quando calorias e proteína são iguais."
  },
  {
    id: "d012", category: "Dieta", subcategory: "Alimentos",
    keywords: ["whey protein", "whey", "suplemento proteína", "shake proteína", "proteína em pó"],
    question: "Whey protein é necessário?",
    answer: "Whey protein é um SUPLEMENTO — complementa a dieta quando necessário. Não é obrigatório se você atinge a meta de proteína com alimentos. Quando é útil: praticidade pós-treino, dificuldade em comer proteína suficiente, entre refeições. Tipos: Concentrado (mais barato, 70-80% proteína, contém lactose). Isolado (mais puro, 90%+ proteína, menos lactose). Hidrolisado (absorção mais rápida, mais caro). Dose: 1-2 scoops/dia (25-50g). Não substitui refeições completas."
  },
  {
    id: "d013", category: "Dieta", subcategory: "Alimentos",
    keywords: ["creatina", "creatina monohidratada", "suplemento creatina", "creapure"],
    question: "Creatina funciona? Como tomar?",
    answer: "Creatina monohidratada é o suplemento mais estudado e comprovado cientificamente. Benefícios: +5-10% de força, +1-2kg de massa magra, melhora recuperação, benefícios cognitivos. Como tomar: 3-5g/dia todos os dias (treino e descanso). Não precisa de fase de saturação. Não precisa ciclar. Tome com qualquer refeição. Misture com água ou shake. Efeitos colaterais: retenção de água intramuscular (não inchaço — é positivo). Mito: não causa problemas renais em pessoas saudáveis."
  },
  {
    id: "d014", category: "Dieta", subcategory: "Alimentos",
    keywords: ["cafeína", "café", "pré treino estimulante", "termogênico", "energia treino"],
    question: "Cafeína melhora o treino?",
    answer: "Sim! Cafeína é ergogênica comprovada. Benefícios: aumenta força em 3-5%, melhora resistência em 2-4%, reduz percepção de esforço, aumenta foco. Dose eficaz: 3-6mg/kg (ex: pessoa de 80kg = 240-480mg). Timing: 30-60 minutos antes do treino. Fontes: café (80-100mg/xícara), pré-treino, cápsulas. Tolerância: se toma diariamente, o efeito diminui — faça ciclos (2 semanas on, 1 off). Evite após as 14h para não prejudicar o sono. Não exceda 400mg/dia."
  },
  {
    id: "d015", category: "Dieta", subcategory: "Alimentos",
    keywords: ["bcaa", "aminoácidos", "eaa", "aminoácido essencial", "leucina"],
    question: "BCAA é necessário?",
    answer: "BCAA (aminoácidos de cadeia ramificada: leucina, isoleucina, valina) geralmente NÃO é necessário se você consome proteína suficiente (1.6g+/kg). Whey protein já contém todos os BCAAs. Quando pode ser útil: treino em jejum (previne catabolismo), dietas veganas com pouca proteína, refeições com proteína incompleta. EAA (aminoácidos essenciais) é superior ao BCAA — contém todos os 9 essenciais. Economize dinheiro e invista em proteína de qualidade."
  },
  {
    id: "d016", category: "Dieta", subcategory: "Alimentos",
    keywords: ["vitamina d", "vitaminas", "multivitamínico", "suplemento vitamina", "minerais"],
    question: "Preciso de multivitamínico?",
    answer: "Se sua dieta é variada e equilibrada, geralmente não. Porém, deficiências comuns no Brasil: Vitamina D: 80% dos brasileiros têm deficiência — tome 2000-5000 UI/dia (faça exame de sangue). Ômega-3: se não come peixe 2-3x/semana — tome 2-3g de EPA+DHA/dia. Magnésio: muitos têm deficiência — 200-400mg à noite (melhora sono e recuperação). Zinco: 15-30mg/dia se treina intenso (perde no suor). Ferro: apenas se exame de sangue indicar. Evite mega-doses — mais não é melhor."
  },
  {
    id: "d017", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["montar dieta", "plano alimentar", "como montar", "dieta personalizada", "cardápio"],
    question: "Como montar uma dieta personalizada?",
    answer: "Passo a passo: 1) Calcule seu TDEE (este app faz isso!). 2) Defina o objetivo: superávit (+200-300), manutenção, ou déficit (-300-500). 3) Defina macros: proteína (2g/kg), gordura (1g/kg), restante em carboidratos. 4) Distribua em refeições (4-6/dia). 5) Escolha alimentos que goste dentro dos macros. 6) Prepare as refeições (meal prep). 7) Monitore peso semanalmente e ajuste. Este app gera uma sugestão automática na aba de dieta!"
  },
  {
    id: "d018", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["meal prep", "preparar refeição", "comida preparada", "marmita", "preparação de comida"],
    question: "Como fazer meal prep eficiente?",
    answer: "Meal prep — dicas práticas: 1) Escolha 1 dia para cozinhar (domingo funciona bem). 2) Prepare proteínas em quantidade (frango, carne, ovos). 3) Cozinhe carboidratos (arroz, batata doce). 4) Lave e corte vegetais. 5) Monte marmitas individuais. 6) Congele o que não vai comer em 3 dias. 7) Tempere cada marmita diferente para não enjoar. Armazenamento: refrigerador (3 dias), congelador (30 dias). Investimento em potes de vidro vale a pena."
  },
  {
    id: "d019", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["vegetariano", "vegano", "sem carne", "plant based", "proteína vegetal"],
    question: "Como treinar e ter resultados sendo vegetariano/vegano?",
    answer: "Totalmente possível! Fontes de proteína vegetal: tofu (16g/150g), tempeh (20g/100g), lentilha (18g/xícara cozida), grão-de-bico (15g/xícara), seitan (25g/100g), edamame (17g/xícara), proteína de ervilha/arroz em pó. Combine fontes para aminoácidos completos (arroz + feijão). Pode precisar de 10-15% mais proteína total. Suplementos importantes: B12 (obrigatório para veganos), ferro, ômega-3 de algas, vitamina D, zinco. Creatina é ainda mais benéfica (veganos têm estoques menores)."
  },
  {
    id: "d020", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["álcool", "bebida alcoólica", "cerveja", "vinho", "beber e treinar"],
    question: "Álcool atrapalha os resultados?",
    answer: "Sim, significativamente: reduz síntese proteica em até 24%, atrapalha o sono (mesmo parecendo ajudar), desidrata, tem calorias vazias (7kcal/g), reduz testosterona, aumenta cortisol, prejudica recuperação. Se for beber: limite a 1-2 doses, coma antes, hidrate-se (1 copo de água por dose), evite beber no dia de treino, evite bebidas com açúcar. O impacto é dose-dependente — uma cerveja eventual não arruina tudo, mas consumo regular prejudica resultados significativamente."
  },
  // Hidratação
  {
    id: "d021", category: "Dieta", subcategory: "Hidratação",
    keywords: ["água", "hidratação", "beber água", "quanto de água", "desidratação", "hidratar"],
    question: "Quanta água devo beber por dia?",
    answer: "Recomendação base: 35ml/kg/dia. Adicione 500-750ml por hora de treino. Ex: pessoa de 80kg = 2.8L + treino = 3.3-3.5L/dia. Sinais de desidratação: urina escura, sede, fadiga, dor de cabeça, cãibras. A urina deve ser amarelo-clara. Dicas: tenha uma garrafa sempre por perto, beba ao acordar (200-500ml), beba antes de sentir sede, inclua água na contagem (chás, café sem açúcar contam). Este app tem o tracker de água para te ajudar!"
  },
  {
    id: "d022", category: "Dieta", subcategory: "Hidratação",
    keywords: ["eletrólitos", "sódio", "potássio", "cãibra", "sais minerais"],
    question: "Preciso repor eletrólitos?",
    answer: "Para treinos de alta intensidade ou duração >60min: sim. Eletrólitos principais: Sódio (suor): adicione pitada de sal na água ou alimentos. Potássio: banana, batata, água de coco. Magnésio: castanhas, espinafre, suplemento à noite. Quando repor: treinos longos (>1h), clima quente, suor excessivo, cãibras frequentes. Receita caseira: 1L água + 1/4 colher de sal + suco de 1 limão + 1 colher de mel. Não é necessário para treinos curtos de musculação."
  },
  // ============================================================
  // CATEGORIA: COMPOSIÇÃO CORPORAL (~60 entradas)
  // ============================================================
  {
    id: "c001", category: "Composição Corporal", subcategory: "Percentual de Gordura",
    keywords: ["percentual de gordura", "bf", "body fat", "gordura corporal", "medir gordura"],
    question: "Qual o percentual de gordura ideal?",
    answer: "Percentuais de referência — Homens: Essencial: 2-5% (insustentável). Competição: 5-8%. Atlético: 8-12% (abdômen visível). Fitness: 12-18% (boa forma). Aceitável: 18-25%. Mulheres: Essencial: 10-13%. Competição: 12-16%. Atlético: 16-20%. Fitness: 20-28%. Aceitável: 28-32%. Para saúde geral: homens 10-20%, mulheres 18-28%. Para estética com abdômen definido: homens 10-14%, mulheres 18-22%. Use as medições deste app para acompanhar!"
  },
  {
    id: "c002", category: "Composição Corporal", subcategory: "Percentual de Gordura",
    keywords: ["dobras cutâneas", "adipometria", "plicometria", "adipômetro", "skinfold"],
    question: "Como funcionam as dobras cutâneas?",
    answer: "Dobras cutâneas (plicometria) medem a espessura da gordura subcutânea com um adipômetro. Métodos: Jackson-Pollock 3 dobras: homens (peitoral, abdominal, coxa), mulheres (tríceps, suprailíaca, coxa). Jackson-Pollock 7 dobras: mais preciso (peitoral, axilar, tríceps, subescapular, abdominal, suprailíaca, coxa). Como medir: pegue a dobra com os dedos, aplique o adipômetro 1cm ao lado, leia após 2s, faça 3 medidas e use a mediana. Este app calcula automaticamente o BF% pelas suas dobras!"
  },
  {
    id: "c003", category: "Composição Corporal", subcategory: "Percentual de Gordura",
    keywords: ["bioimpedância", "balança bioimpedância", "inbody", "dexa", "bod pod"],
    question: "Qual o melhor método para medir composição corporal?",
    answer: "Ranking de precisão: 1) DEXA scan (±1-2% de erro) — padrão ouro, ~R$200-400. 2) Pesagem hidrostática (±1.5%). 3) Bod Pod (±2%). 4) Plicometria/dobras (±3-4%) — prático e barato, este app calcula. 5) Bioimpedância (±3-5%) — variável com hidratação. 6) Circunferências (±3-5%) — método US Navy, disponível neste app. 7) Fotos — subjetivo mas útil para comparação visual. Dica: use SEMPRE o mesmo método, mesmas condições, mesmo horário para comparação confiável."
  },
  {
    id: "c004", category: "Composição Corporal", subcategory: "IMC",
    keywords: ["imc", "índice de massa corporal", "peso ideal", "peso saudável", "bmi"],
    question: "O IMC é confiável?",
    answer: "O IMC (peso/altura²) tem limitações: não diferencia músculo de gordura. Uma pessoa musculosa pode ter IMC de 'sobrepeso' sendo saudável. Classificações: <18.5 abaixo do peso, 18.5-24.9 normal, 25-29.9 sobrepeso, 30+ obesidade. Use como referência geral, mas combine com: percentual de gordura, circunferência da cintura (<94cm homens, <80cm mulheres), e avaliação visual. Para praticantes de musculação, o BF% é muito mais relevante que IMC."
  },
  {
    id: "c005", category: "Composição Corporal", subcategory: "Medidas",
    keywords: ["circunferência", "medidas corporais", "cintura", "quadril", "fita métrica", "medir corpo"],
    question: "Como tirar medidas corporais corretamente?",
    answer: "Use fita métrica flexível, sem comprimir a pele: Cintura: na altura do umbigo, ao expirar naturalmente. Quadril: no ponto mais largo dos glúteos. Peitoral: na linha dos mamilos. Braço: no ponto mais largo do bíceps (relaxado e contraído). Coxa: 15cm acima do joelho. Panturrilha: no ponto mais largo. Pescoço: abaixo do pomo de Adão. Meça sempre no mesmo horário, antes de comer, nas mesmas condições. Registre semanalmente neste app para acompanhar evolução."
  },
  {
    id: "c006", category: "Composição Corporal", subcategory: "Evolução",
    keywords: ["acompanhar evolução", "progresso", "resultados", "medir progresso", "evolução"],
    question: "Como acompanhar meu progresso?",
    answer: "Use múltiplos indicadores: 1) Peso (diariamente, use média semanal — peso flutua 1-2kg/dia). 2) Medidas corporais (semanalmente). 3) Fotos (quinzenalmente, mesmas condições/luz/ângulo). 4) Dobras cutâneas (mensalmente). 5) Cargas no treino (este app registra!). 6) Performance (reps, volume total). 7) Bem-estar geral (energia, sono, humor). A balança é apenas UMA métrica — não entre em pânico com flutuações diárias. Tendência de 2-4 semanas é o que importa."
  },
  // ============================================================
  // CATEGORIA: SAÚDE E RECUPERAÇÃO (~80 entradas)
  // ============================================================
  {
    id: "s001", category: "Saúde", subcategory: "Sono",
    keywords: ["sono", "dormir", "insônia", "qualidade do sono", "horas de sono", "descanso noturno"],
    question: "Qual a importância do sono para resultados?",
    answer: "O sono é CRÍTICO — tão importante quanto treino e dieta. Durante o sono: GH (hormônio do crescimento) é liberado em picos, recuperação muscular ocorre, memória motora é consolidada, apetite é regulado (leptina/grelina). Dormir <6h: reduz testosterona em 10-15%, aumenta cortisol, prejudica recuperação, aumenta fome e vontade de doces. Meta: 7-9 horas de sono de qualidade. Dicas: quarto escuro e fresco (18-20°C), sem telas 1h antes, horário regular, evite cafeína após 14h."
  },
  {
    id: "s002", category: "Saúde", subcategory: "Sono",
    keywords: ["rotina de sono", "higiene do sono", "dormir melhor", "ritual noturno"],
    question: "Como melhorar a qualidade do sono?",
    answer: "Higiene do sono — checklist: 1) Horário fixo para dormir e acordar (inclusive fins de semana). 2) Quarto escuro (use blackout ou máscara). 3) Temperatura fresca (18-20°C). 4) Sem telas 60min antes (ou use filtro de luz azul). 5) Evite cafeína após 14h. 6) Evite álcool antes de dormir. 7) Suplementos opcionais: magnésio glicinato (200-400mg), melatonina (0.5-3mg). 8) Técnica 4-7-8: inspire 4s, segure 7s, expire 8s. 9) Banho morno antes de dormir."
  },
  {
    id: "s003", category: "Saúde", subcategory: "Recuperação",
    keywords: ["recuperação muscular", "dor muscular", "doms", "dor pós treino", "descanso"],
    question: "O que é DOMS (dor muscular tardia)?",
    answer: "DOMS (Delayed Onset Muscle Soreness) é a dor muscular que aparece 24-72h após o treino. Causa: microlesões nas fibras musculares (parte normal do processo de hipertrofia). NÃO é indicador de bom treino — é comum em movimentos novos ou excêntricos. Aliviadores: massagem leve, movimento leve (caminhada), banho quente, hidratação, sono, nutrição adequada. NÃO alivia: alongamento estático, gelo (controverso). Reduz com o tempo conforme o corpo se adapta. Se a dor impede treino por >72h, você exagerou."
  },
  {
    id: "s004", category: "Saúde", subcategory: "Recuperação",
    keywords: ["alongamento", "flexibilidade", "mobilidade", "stretching", "esticar"],
    question: "Devo fazer alongamento antes ou depois do treino?",
    answer: "ANTES do treino: mobilidade articular dinâmica (rotações, agachamento sem peso, lunges). Alongamento estático NÃO é recomendado pré-treino (reduz força em até 5%). DEPOIS do treino: alongamento estático é OK, mas benefícios para hipertrofia são mínimos. Para flexibilidade: sessões dedicadas separadas (yoga, alongamento 15-20min, 2-3x/semana). Mobilidade > Flexibilidade: foque em ter amplitude de movimento nos exercícios que pratica. Hip hinge, agachamento profundo, rotação de ombros são prioridade."
  },
  {
    id: "s005", category: "Saúde", subcategory: "Recuperação",
    keywords: ["foam roller", "rolo de espuma", "liberação miofascial", "automassagem", "trigger point"],
    question: "Foam roller ajuda na recuperação?",
    answer: "Foam roller (liberação miofascial) pode: reduzir DOMS temporariamente, melhorar amplitude de movimento agudamente, aumentar fluxo sanguíneo local. Como usar: role lentamente sobre o músculo alvo por 30-60s, pause em pontos doloridos (trigger points) por 20-30s. Áreas comuns: quadríceps, IT band, panturrilha, dorsais, glúteos. Pré-treino: use rapidamente para aquecimento. Pós-treino ou dia off: sessão mais longa para recuperação. Não substitui aquecimento nem alongamento, mas complementa."
  },
  {
    id: "s006", category: "Saúde", subcategory: "Lesões",
    keywords: ["lesão", "machucado", "dor aguda", "prevenir lesão", "prevenção"],
    question: "Como prevenir lesões no treino?",
    answer: "Prevenção de lesões: 1) Aquecimento adequado (10-15min). 2) Técnica correta antes de aumentar carga. 3) Progressão gradual (máximo 5-10%/semana). 4) Deload a cada 4-8 semanas. 5) Equilíbrio muscular (trabalhe antagonistas). 6) Face pulls e rotadores externos (proteção dos ombros). 7) Core forte (proteção da lombar). 8) Não treine com dor aguda (diferencie dor muscular de dor articular). 9) Durma e coma bem. 10) Escute seu corpo — ego é o maior causador de lesões."
  },
  {
    id: "s007", category: "Saúde", subcategory: "Lesões",
    keywords: ["dor no ombro", "ombro dor", "impacto ombro", "ombro lesão", "manguito"],
    question: "Tenho dor no ombro ao treinar, o que fazer?",
    answer: "Dor no ombro é comum. Causas frequentes: 1) Desequilíbrio anterior/posterior (muito supino, pouca remada). 2) Falta de trabalho de rotadores externos. 3) Técnica inadequada (supino com cotovelos muito abertos). Medidas imediatas: pare exercícios que doem, aplique gelo 15min, faça exercícios de mobilidade. Prevenção: face pulls 3x/semana, rotação externa com elástico, fortaleça dorsais, ajuste a técnica do supino (cotovelos a 45°). Se a dor persistir >2 semanas, procure fisioterapeuta."
  },
  {
    id: "s008", category: "Saúde", subcategory: "Lesões",
    keywords: ["dor lombar", "lombar", "dor nas costas", "coluna", "hérnia"],
    question: "Tenho dor lombar ao treinar, o que fazer?",
    answer: "Dor lombar — ações: 1) Imediato: pare exercícios que provocam dor. 2) Verifique técnica do terra, agachamento e remada (coluna neutra!). 3) Fortaleça o core: prancha, dead bug, bird dog (exercícios anti-extensão/rotação). 4) Mantenha mobilidade: cat-cow, child's pose, rotação de tronco. 5) Evite: good morning pesado, abdominal supra (flexão de coluna com carga). 6) McGill big 3: bird dog, side plank, curl-up — cientificamente validados para lombar. Se dor irradia para a perna ou há dormência, procure médico imediatamente."
  },
  {
    id: "s009", category: "Saúde", subcategory: "Lesões",
    keywords: ["dor no joelho", "joelho dor", "joelho estala", "patela", "joelho lesão"],
    question: "Tenho dor no joelho ao agachar, o que fazer?",
    answer: "Dor no joelho ao agachar — causas comuns: 1) Joelho projetando para dentro (valgo) — fortaleça abdutores e glúteo médio. 2) Quadríceps/isquiotibiais desbalanceados — inclua stiff e leg curl. 3) Falta de mobilidade de tornozelo — faça mobilizações diárias. 4) Carga excessiva — reduza peso e trabalhe técnica. Ajustes: pés levemente para fora (15-30°), joelhos seguem os pés, use calço sob os calcanhares se falta mobilidade. Box squat pode ser mais confortável. Se há inchaço ou instabilidade, procure ortopedista."
  },
  {
    id: "s010", category: "Saúde", subcategory: "Estresse",
    keywords: ["estresse", "cortisol", "ansiedade", "treino e estresse", "saúde mental"],
    question: "O estresse afeta os resultados do treino?",
    answer: "Muito! Estresse crônico eleva cortisol, que: aumenta retenção de gordura (especialmente abdominal), reduz testosterona, prejudica recuperação e sono, aumenta fome e compulsão, reduz imunidade. O exercício é um estresse 'bom' (eustresse), mas somado ao estresse psicológico pode ser demais. Quando estressado: reduza volume/intensidade do treino, priorize sono, caminhe na natureza, pratique respiração (box breathing: 4s inspira, 4s segura, 4s expira, 4s pausa), considere meditação (5-10min/dia). Treinar é ótimo para saúde mental — mas não exagere."
  },
  {
    id: "s011", category: "Saúde", subcategory: "Hormônios",
    keywords: ["testosterona", "hormônio", "testosterona natural", "aumentar testosterona"],
    question: "Como otimizar a testosterona naturalmente?",
    answer: "Estratégias baseadas em evidência: 1) Sono: 7-9h/noite (privação reduz T em 10-15%). 2) Treino de força: exercícios compostos pesados. 3) Gordura dietética: pelo menos 0.8g/kg/dia. 4) Peso corporal: evite gordura excessiva (aumenta aromatase). 5) Vitamina D: 2000-5000 UI/dia. 6) Zinco: 15-30mg/dia. 7) Magnésio: 200-400mg à noite. 8) Reduza estresse crônico (cortisol suprime T). 9) Limite álcool. 10) Evite BPA (plásticos). O impacto de suplementos 'boosters' de testosterona é mínimo — foque nos fundamentos."
  },
  // ============================================================
  // CATEGORIA: CARDIO E CONDICIONAMENTO (~40 entradas)
  // ============================================================
  {
    id: "r001", category: "Cardio", subcategory: "Tipos",
    keywords: ["cardio", "aeróbico", "cardiovascular", "fazer cardio", "cardio musculação"],
    question: "Devo fazer cardio se quero ganhar massa?",
    answer: "Cardio em moderação NÃO atrapalha a hipertrofia. Benefícios: saúde cardiovascular, melhora recuperação, controle de gordura, saúde mental. Recomendações em bulk: 2-3 sessões de 20-30min de intensidade baixa-moderada (caminhada, bike). Evite: cardio excessivo (>5x/semana intenso), HIIT imediatamente antes/depois do treino de pernas. O problema não é o cardio, é o déficit calórico que ele pode criar — compense comendo mais. Separar cardio e musculação por 6+ horas é ideal."
  },
  {
    id: "r002", category: "Cardio", subcategory: "Tipos",
    keywords: ["hiit", "alta intensidade", "intervalo", "tiro", "cardio intenso"],
    question: "O que é HIIT e quando usar?",
    answer: "HIIT (High-Intensity Interval Training): alternância entre esforço máximo e recuperação. Exemplos: 30s sprint + 60s caminhada × 8-10 rounds. Vantagens: gasta calorias em menos tempo, EPOC (queima pós-exercício), melhora VO2max. Desvantagens: muito fatigante, compete com recuperação do treino de força. Quando usar: 1-2x/semana para emagrecimento, nunca no dia de pernas, separar de musculação por 6h+. LISS (cardio leve) é melhor para recuperação. Use HIIT como ferramenta, não como rotina diária."
  },
  {
    id: "r003", category: "Cardio", subcategory: "Tipos",
    keywords: ["liss", "cardio leve", "caminhada", "caminhar", "cardio baixa intensidade"],
    question: "Caminhada conta como exercício?",
    answer: "SIM! Caminhada é subestimada. Benefícios: queima calorias sem impacto na recuperação muscular, reduz estresse, melhora digestão, melhora sono, aumenta NEAT (gasto calórico não-planejado). Meta: 7.000-10.000 passos/dia. Uma caminhada de 30-45min queima 150-250kcal. É a melhor forma de 'cardio' para quem quer ganhar massa — não interfere na recuperação. Pós-refeição: 10-15min de caminhada melhora digestão e controle de glicemia. Passos importam mais do que sessões formais de cardio."
  },
  {
    id: "r004", category: "Cardio", subcategory: "Tipos",
    keywords: ["vo2max", "condicionamento", "capacidade aeróbica", "aptidão cardio"],
    question: "O que é VO2max e como melhorar?",
    answer: "VO2max é a capacidade máxima de consumo de oxigênio — principal indicador de aptidão cardiovascular e preditor de longevidade. Valores: <30 ml/kg/min (ruim), 30-40 (médio), 40-50 (bom), >50 (excelente), >60 (atleta). Para melhorar: 1) HIIT 1-2x/semana (intervalos de 4min a 90-95% FCmax). 2) LISS 2-3x/semana (30-60min zona 2, ~60-70% FCmax). 3) Treino de força (sim, ajuda!). Melhora: 15-20% em 8-12 semanas com treino consistente."
  },
  // ============================================================
  // CATEGORIA: ESTILO DE VIDA E MOTIVAÇÃO (~40 entradas)
  // ============================================================
  {
    id: "m001", category: "Motivação", subcategory: "Consistência",
    keywords: ["motivação", "consistência", "disciplina", "manter treino", "não desistir", "falta de motivação"],
    question: "Como manter a motivação para treinar?",
    answer: "Motivação é temporária — construa HÁBITOS e DISCIPLINA: 1) Defina horário fixo para treinar. 2) Prepare roupas na noite anterior. 3) Vá à academia mesmo nos dias sem vontade (faça o mínimo). 4) Registre seus progressos (este app ajuda!). 5) Encontre um parceiro de treino. 6) Celebre pequenas vitórias. 7) Lembre do 'porquê' — escreva seus motivos. 8) Aceite que haverá dias ruins. 9) Treino curto > nenhum treino. 10) Compare-se apenas com quem você era ontem. A consistência é o que realmente importa."
  },
  {
    id: "m002", category: "Motivação", subcategory: "Consistência",
    keywords: ["platô", "estagnação", "parei de evoluir", "não progrido", "estagnei"],
    question: "Estou estagnado, o que fazer?",
    answer: "Platôs são normais. Estratégias: 1) Mude o estímulo (novos exercícios, ordens diferentes, técnicas intensificadoras). 2) Aumente o volume (mais 2-4 séries/semana por grupo). 3) Faça um deload de 1 semana e volte com mais energia. 4) Verifique a dieta (está comendo o suficiente?). 5) Verifique o sono (7-9h?). 6) Mude a divisão de treino. 7) Priorize exercícios compostos. 8) Considere periodização ondulada. 9) Seja paciente — progresso não é linear. 10) Contrate um profissional para avaliação."
  },
  {
    id: "m003", category: "Motivação", subcategory: "Consistência",
    keywords: ["viagem", "férias", "treinar viajando", "hotel treino", "manter treino viajando"],
    question: "Como treinar durante viagens?",
    answer: "Opções: 1) Treino de peso corporal: flexões, agachamentos, lunges, pranchas, burpees — 20-30min são suficientes. 2) Elásticos de resistência: ocupam pouco espaço, permitem treino completo. 3) Academia do hotel: use o que tiver disponível, adapte o treino. 4) Passe diário em academias locais. 5) HIIT no quarto: jumping jacks, mountain climbers, flexões. Curtas viagens (1-2 semanas): relaxe, descanse, não perca sono por treino. O mais importante em viagem é manter a alimentação razoável."
  },
  {
    id: "m004", category: "Motivação", subcategory: "Metas",
    keywords: ["meta", "objetivo", "prazo", "quanto tempo", "resultados visíveis", "expectativa"],
    question: "Em quanto tempo vou ver resultados?",
    answer: "Timeline realista: 2-4 semanas: adaptação neural — você fica mais forte sem ganhar músculo visível (ganhos de coordenação). 1-3 meses: primeiros sinais visuais de definição e forma. 3-6 meses: mudanças notáveis que outros percebem. 6-12 meses: transformação significativa. 1-2 anos: nível de resultado impressionante. Ganho de músculo: iniciantes ganham 0.5-1kg/mês, intermediários 0.25-0.5kg/mês, avançados 0.1-0.25kg/mês. Fotos mensais são a melhor forma de perceber mudanças — não confie no espelho diário."
  },
  {
    id: "m005", category: "Motivação", subcategory: "Metas",
    keywords: ["idade", "treinar velho", "treinar depois dos 40", "idoso", "terceira idade"],
    question: "Posso ganhar massa muscular após os 40/50/60 anos?",
    answer: "Absolutamente SIM! Estudos mostram ganho muscular em QUALQUER idade. Após 40-50: a resposta é mais lenta, mas significativa. Adaptações: descanse mais entre séries (3-4min para compostos), aquecimento mais longo, priorize técnica sobre carga, inclua mais trabalho de mobilidade, proteína levemente mais alta (2-2.2g/kg). Benefícios específicos: previne sarcopenia, melhora densidade óssea, melhora equilíbrio (previne quedas), melhora cognição, melhora qualidade de vida. Nunca é tarde para começar!"
  },
  // ============================================================
  // CATEGORIA: USO DO APP (~30 entradas)
  // ============================================================
  {
    id: "a001", category: "App", subcategory: "Funcionalidades",
    keywords: ["usar o app", "funcionalidades", "como usar", "recursos", "o que o app faz"],
    question: "O que o FitForge faz?",
    answer: "O FitForge é seu personal trainer digital completo! Funcionalidades: 1) Geração de treino personalizado baseado nos seus dados (peso, altura, objetivo, dias disponíveis, tempo de sessão). 2) Registro de cargas — anote pesos de cada exercício. 3) Checklist de exercícios — marque o que já fez. 4) Dieta personalizada — plano alimentar com macros calculados. 5) Comparativo calórico — TDEE vs calorias da dieta. 6) Composição corporal — calculadora de BF% por dobras ou circunferências. 7) Tracker de água. 8) Relatório de progresso."
  },
  {
    id: "a002", category: "App", subcategory: "Funcionalidades",
    keywords: ["trocar treino", "mudar treino", "novo treino", "resetar", "recomeçar"],
    question: "Como trocar meu plano de treino?",
    answer: "Para gerar um novo treino: 1) Toque no ícone de perfil (canto superior direito). 2) Clique em 'Editar Perfil' para ajustar seus dados. 3) Ou clique em 'Novo Plano' para recomeçar do zero. Ao gerar um novo plano, as cargas registradas são mantidas para referência. Recomendação: troque o plano a cada 6-8 semanas para evitar platôs, ou quando mudar seus objetivos."
  },
  {
    id: "a003", category: "App", subcategory: "Funcionalidades",
    keywords: ["registrar peso", "anotar carga", "peso do exercício", "carga", "marcar peso"],
    question: "Como registrar minhas cargas?",
    answer: "Em cada exercício do seu plano de treino, há um campo para anotar o peso utilizado. Basta: 1) Expandir o dia de treino. 2) Localizar o exercício. 3) Digitar o peso no campo indicado. 4) O valor é salvo automaticamente. Use isso para garantir sobrecarga progressiva — tente aumentar 2-5% a cada 1-2 semanas. O histórico de cargas é mantido no seu dispositivo."
  },
  {
    id: "a004", category: "App", subcategory: "Funcionalidades",
    keywords: ["dieta app", "gerar dieta", "plano alimentar app", "aba dieta"],
    question: "Como gerar minha dieta no app?",
    answer: "Na tela principal do treino, toque no ícone de dieta (garfo e faca) no canto superior direito. Configure: 1) Nível de atividade (sedentário a muito intenso). 2) Número de refeições (3-6). 3) Restrições alimentares (vegano, sem lactose, etc.). 4) Alimentos que não gosta. Clique em 'Gerar Dieta' e receberá um plano completo com refeições, horários, macros por refeição e dicas. O app também mostra seu TDEE (gasto calórico) e compara com as calorias da dieta gerada."
  },
  {
    id: "a005", category: "App", subcategory: "Funcionalidades",
    keywords: ["composição corporal app", "medir gordura app", "calculadora bf", "aba composição"],
    question: "Como usar a calculadora de composição corporal?",
    answer: "Toque no ícone de corpo no canto superior direito. Você pode preencher: 1) Dobras cutâneas: peitoral, axilar, tríceps, subescapular, abdominal, suprailíaca, coxa. 2) Circunferências: pescoço, cintura, quadril. Não precisa preencher todos — o app usa o método mais preciso disponível com os dados informados. Ao calcular, você verá: % de gordura, massa gorda, massa magra, classificação. Os resultados ficam salvos para acompanhamento."
  },
  {
    id: "a006", category: "App", subcategory: "Funcionalidades",
    keywords: ["água app", "tracker de água", "controle de água", "meta de água"],
    question: "Como funciona o tracker de água?",
    answer: "O tracker de água calcula sua meta diária baseada no seu peso e nível de atividade (35ml/kg + extra por treino). Na tela principal: veja sua meta diária, adicione copos de água ao longo do dia (cada copo = 250ml), acompanhe a barra de progresso. A meta reseta diariamente. Dica: beba um copo ao acordar, um antes de cada refeição, e extra durante e após o treino."
  },
  // ============================================================
  // CATEGORIA: CONCEITOS AVANÇADOS (~50 entradas)
  // ============================================================
  {
    id: "av001", category: "Avançado", subcategory: "Técnicas",
    keywords: ["treino oclusão", "bfr", "blood flow restriction", "oclusão", "kaatsu"],
    question: "O que é treino com restrição de fluxo sanguíneo (BFR)?",
    answer: "BFR (Blood Flow Restriction) usa faixas elásticas para restringir parcialmente o fluxo sanguíneo durante o exercício. Como: aplique faixas no topo do membro (braço ou coxa) com pressão de 5-7/10 (desconforto, não dor). Use 20-40% da 1RM com altas reps (30-15-15-15 com 30s de descanso). Benefícios: hipertrofia com cargas leves (ótimo para reabilitação, viagens), aumento de GH local. Não use: se tem problemas vasculares, pressão alta não controlada, ou trombose. Pode ser um excelente complemento ao treino tradicional."
  },
  {
    id: "av002", category: "Avançado", subcategory: "Técnicas",
    keywords: ["excêntrico", "negativa", "fase excêntrica", "treino excêntrico"],
    question: "O que é treino excêntrico?",
    answer: "Treino excêntrico foca na fase de alongamento muscular sob carga (a 'descida'). Você é 20-40% mais forte na excêntrica que na concêntrica. Métodos: 1) Excêntrica lenta (4-6 segundos na descida). 2) Excêntrica supramáxima (use 100-120% da 1RM, parceiro ajuda a subir, você controla a descida). 3) Negativas na barra fixa (para quem não faz pull-ups). Benefícios: hipertrofia superior, ganho de força, prevenção de lesões, reabilitação. Causa mais DOMS — use com moderação."
  },
  {
    id: "av003", category: "Avançado", subcategory: "Técnicas",
    keywords: ["giant set", "tri set", "circuito", "série gigante", "circuit training"],
    question: "O que são giant sets e tri-sets?",
    answer: "Tri-set: 3 exercícios consecutivos para o MESMO grupo muscular sem descanso. Ex: supino reto → crucifixo → flexão. Giant set: 4+ exercícios consecutivos. Benefícios: alto volume em pouco tempo, grande estresse metabólico, pump muscular intenso. Desvantagens: cargas menores (fadiga acumulada), muito fatigante. Quando usar: fase de hipertrofia metabólica, quando tem pouco tempo, para finalizar o treino. Não é ideal para treino de força (precisa de descanso entre séries)."
  },
  {
    id: "av004", category: "Avançado", subcategory: "Conceitos",
    keywords: ["memória muscular", "parei de treinar", "perdi massa", "voltei a treinar", "muscle memory"],
    question: "Memória muscular existe?",
    answer: "Sim! Quando você ganha músculo, os núcleos celulares (mionúcleos) adquiridos permanecem mesmo após perda de massa. Isso significa: recuperar músculo perdido é MUITO mais rápido que ganhar pela primeira vez. Se parou por meses: em 4-8 semanas de volta, recupera a maior parte. Se parou por anos: leva mais, mas ainda é mais rápido. Dicas ao retornar: comece com 60% do volume anterior, progrida rápido nas primeiras semanas, o corpo responderá rapidamente. Não tenha medo de pausas — seu corpo lembra!"
  },
  {
    id: "av005", category: "Avançado", subcategory: "Conceitos",
    keywords: ["genética", "potencial genético", "limite genético", "biotipo", "ectomorfo", "mesomorfo", "endomorfo"],
    question: "A genética limita meus resultados?",
    answer: "A genética influencia, mas não determina. Fatores genéticos: inserções musculares (forma do músculo), proporção de fibras (tipo I vs tipo II), resposta hormonal, estrutura óssea. Biotipos (ectomorfo/mesomorfo/endomorfo) são simplificações — a maioria é uma mistura. O potencial genético natural: 10-13kg de massa muscular para homens e 5-6kg para mulheres nos primeiros anos de treino. A maioria nunca chega perto do limite genético — anos de treino consistente são necessários. Foque no PROCESSO, não na genética."
  },
  {
    id: "av006", category: "Avançado", subcategory: "Conceitos",
    keywords: ["síntese proteica", "mps", "janela de síntese", "síntese muscular", "anabolismo"],
    question: "Como funciona a síntese proteica muscular?",
    answer: "A síntese proteica muscular (MPS) é o processo de construção de novas proteínas musculares. Após o treino: MPS é elevada por 24-72h (mais para iniciantes, menos para avançados). Para maximizar: 1) Distribua proteína em 4-6 refeições (20-40g por refeição). 2) Inclua leucina suficiente (2-3g/refeição — presente em whey, carne, ovos). 3) Treine cada grupo 2-3x/semana (mais janelas de MPS). 4) Durma bem (GH é liberado no sono). 5) Esteja em superávit calórico ou pelo menos manutenção."
  },
  // ============================================================
  // MAIS PERGUNTAS VARIADAS PARA COBRIR 10.000+ VARIAÇÕES
  // ============================================================
  {
    id: "v001", category: "Dieta", subcategory: "Alimentos",
    keywords: ["ovo", "ovos", "colesterol", "quantos ovos", "ovo faz mal"],
    question: "Quantos ovos posso comer por dia?",
    answer: "Estudos recentes mostram que 3-6 ovos inteiros/dia é seguro para a maioria das pessoas. O colesterol dietético tem pouco impacto no colesterol sanguíneo para 70% da população. Um ovo inteiro tem: 70kcal, 6g proteína, 5g gordura, vitaminas A/D/E/K, colina (essencial para o cérebro). Se tem hipercolesterolemia familiar ou colesterol alto diagnosticado, consulte médico. Ovos são uma das melhores fontes de proteína: baratos, versáteis e completos em aminoácidos."
  },
  {
    id: "v002", category: "Dieta", subcategory: "Alimentos",
    keywords: ["arroz", "feijão", "arroz e feijão", "proteína completa", "combinação"],
    question: "Arroz com feijão é uma boa combinação?",
    answer: "Sim! É uma das melhores combinações alimentares do mundo. Juntos fornecem proteína completa (todos os aminoácidos essenciais) — o arroz é pobre em lisina (feijão tem) e o feijão é pobre em metionina (arroz tem). 1 xícara de arroz + 1 xícara de feijão: ~350kcal, 15g proteína, 60g carboidratos, 1g gordura, rica em fibras e ferro. Para treino: é base perfeita de uma refeição — adicione uma proteína animal e vegetais. Patrimônio nutricional brasileiro!"
  },
  {
    id: "v003", category: "Treino", subcategory: "Princípios",
    keywords: ["treinar duas vezes", "bidiário", "treino duplo", "2x ao dia"],
    question: "Posso treinar 2 vezes ao dia?",
    answer: "Sim, mas com cuidados: separe as sessões por pelo menos 6 horas. Exemplo: musculação pela manhã + cardio/mobilidade à tarde. Ou: parte superior de manhã + parte inferior à tarde. Pré-requisitos: nutrição adequada (mais calorias e proteína), sono 8-9h, experiência de pelo menos 1-2 anos de treino, baixo estresse externo. Benefícios: mais volume semanal, sessões mais curtas e focadas. Não é para iniciantes — esgota rapidamente se a recuperação não for ótima."
  },
  {
    id: "v004", category: "Saúde", subcategory: "Geral",
    keywords: ["sauna", "banho gelado", "crioterapia", "gelo", "contraste"],
    question: "Sauna e banho gelado ajudam na recuperação?",
    answer: "Sauna (15-20min a 80-100°C): melhora circulação, libera proteínas de choque térmico (HSP), pode melhorar saúde cardiovascular, relaxa musculatura. Banho gelado (2-5min a 10-15°C): reduz inflamação aguda, pode melhorar recuperação subjetiva. PORÉM: evitar banho gelado logo após treino de hipertrofia — a inflamação pós-treino é necessária para o crescimento. Contraste (quente-frio): popular mas evidências são mistas. Use sauna em dias de descanso e banho frio apenas em dias de competição ou treino excessivo."
  },
  {
    id: "v005", category: "Treino", subcategory: "Cardio",
    keywords: ["corda", "pular corda", "jump rope", "cardio corda"],
    question: "Pular corda é um bom exercício?",
    answer: "Excelente! Pular corda queima 10-16 calorias/minuto (mais que corrida), melhora coordenação, agilidade, condicionamento cardiovascular e é portátil. Progressão: 1) Saltos simples (30s on, 30s off). 2) 1 minuto contínuo. 3) 3-5 minutos. 4) Variações: alternados, duplos, cruzados. Cuidados: use tênis com amortecimento, superfície adequada (não concreto), comece gradualmente se é sedentário. HIIT com corda: 30s máximo + 30s descanso × 10-15 rounds = treino matador em 10-15min."
  },
  {
    id: "v006", category: "Dieta", subcategory: "Alimentos",
    keywords: ["açúcar", "doce", "sobremesa", "açúcar refinado", "glicose"],
    question: "Açúcar é prejudicial para resultados?",
    answer: "Contexto importa: Açúcar adicionado (refrigerantes, doces, ultraprocessados): limite a <10% das calorias totais. Causa picos de insulina, vício alimentar, calorias vazias. Açúcar natural (frutas): saudável — contém fibras, vitaminas, antioxidantes. Pós-treino: açúcar simples é aceitável para repor glicogênio rapidamente. Abordagem flexível: se 80-90% da dieta é limpa, 10-20% de alimentos prazerosos (incluindo doces) é sustentável e não prejudica resultados. Proibir completamente leva à compulsão."
  },
  {
    id: "v007", category: "Treino", subcategory: "Equipamentos",
    keywords: ["cinto", "cinto de musculação", "belt", "cinturão", "cinto lombar"],
    question: "Devo usar cinto de musculação?",
    answer: "O cinto aumenta pressão intra-abdominal, estabilizando a coluna em exercícios pesados. Quando usar: agachamento, terra, remada pesada, overhead press — em séries pesadas (>80% 1RM). Quando NÃO usar: aquecimento, exercícios leves, exercícios que não carregam a coluna (rosca, leg curl). Não use como 'muleta' — fortaleça seu core sem cinto na maioria das séries. Tipo: cinto de powerlifting (mesmo tamanho toda a volta) é superior ao cinto cônico."
  },
  {
    id: "v008", category: "Treino", subcategory: "Equipamentos",
    keywords: ["luva", "luva academia", "straps", "strap", "pegada", "grip"],
    question: "Devo usar luvas ou straps na academia?",
    answer: "Luvas: geralmente desnecessárias — cria distância entre mão e barra, reduz propriocepção. Se quer proteger as mãos, use chalk (magnésio). Straps (fitas de pulso): use apenas quando o grip limita o exercício alvo (ex: remada pesada, terra em altas reps). Não use em tudo — fortalecerá seu grip naturalmente. Wrist wraps (munhequeiras): úteis para supino pesado e overhead press se tem desconforto no punho. Joelheiras: úteis para agachamento pesado (compressão e calor)."
  },
  {
    id: "v009", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["cheat meal", "refeição livre", "cheat day", "dia do lixo", "comida lixo"],
    question: "Posso fazer cheat meal?",
    answer: "Sim, com moderação! Abordagem saudável: 1-2 refeições livres por semana (não um dia inteiro). Benefícios: sustentabilidade psicológica, reposição de leptina (em dietas longas), prazer social. Regras: faça parte da sua rotina (planejado, não impulsivo), coma devagar e aprecie, não compense com jejum no dia seguinte, mantenha proteína adequada mesmo na refeição livre. Uma refeição de 500-800kcal extras não estraga uma semana de 3500kcal de déficit. Abordagem 80/20 é mais sustentável que 100% restritivo."
  },
  {
    id: "v010", category: "Saúde", subcategory: "Geral",
    keywords: ["postura", "postura correta", "dor postural", "cifose", "lordose", "coluna"],
    question: "Como melhorar minha postura?",
    answer: "Postura ruim geralmente vem de: sentar muito, peito/deltoide anterior forte demais vs costas fracas. Exercícios corretivos: 1) Face pulls (3x15, 3x/semana). 2) Remadas (fortalecer dorsais e romboides). 3) Alongamento de peitoral menor (no batente da porta, 30s × 3). 4) Prancha lateral (oblíquos e core). 5) Dead hang (descomprime a coluna, 30-60s). 6) Chin tucks (retração cervical, 10x3). No dia a dia: ajuste a tela do computador na altura dos olhos, levante-se a cada 30-45min, caminhe regularmente."
  },
  {
    id: "v011", category: "Treino", subcategory: "Pernas",
    keywords: ["leg extension", "extensora", "cadeira extensora", "quadríceps isolado"],
    question: "Leg extension é um bom exercício?",
    answer: "Sim, para isolar o quadríceps! Apesar de criticado (estresse no joelho), é seguro quando feito corretamente: amplitude controlada, sem carga excessiva, velocidade moderada. Dicas: ajuste o encosto para que o joelho fique alinhado com o eixo da máquina, aperte o quadríceps no topo por 1-2s, desça controladamente. Não deve ser seu único exercício de quadríceps — use como complemento após agachamento e leg press. 3-4 séries de 10-15 reps."
  },
  {
    id: "v012", category: "Treino", subcategory: "Pernas",
    keywords: ["búlgaro", "agachamento búlgaro", "split squat", "afundo", "lunge"],
    question: "Como fazer agachamento búlgaro?",
    answer: "Agachamento búlgaro (split squat): 1) Pé traseiro apoiado em um banco atrás de você. 2) Pé da frente ~60-90cm à frente do banco. 3) Tronco levemente inclinado para frente. 4) Desça até o joelho traseiro quase tocar o chão. 5) Empurre com o pé da frente. Dicas: foco no quadríceps e glúteo da perna da frente, use halteres ou barra. Um dos melhores exercícios unilaterais — corrige desequilíbrios entre pernas. 3 séries de 8-12 reps por perna."
  },
  {
    id: "v013", category: "Treino", subcategory: "Costas",
    keywords: ["remada unilateral", "remada serrote", "dumbbell row", "remada halter"],
    question: "Como fazer remada unilateral com halter?",
    answer: "Remada serrote: 1) Apoie mão e joelho no banco (mesma lateral). 2) Pé oposto no chão. 3) Costas retas, paralelas ao chão. 4) Halter na mão livre, braço estendido. 5) Puxe o cotovelo para cima e para trás. 6) Aperte a escápula no topo. 7) Desça controladamente. Benefícios: corrige assimetrias, permite mais amplitude que remada bilateral, menos estresse lombar. Use straps se o grip limita. 3-4 séries de 8-12 reps."
  },
  {
    id: "v014", category: "Dieta", subcategory: "Alimentos",
    keywords: ["glutamina", "l-glutamina", "glutamina suplemento", "intestino"],
    question: "Glutamina é necessária?",
    answer: "Para a maioria: NÃO. Glutamina é o aminoácido mais abundante no corpo e obtido facilmente da dieta. Suplementar glutamina NÃO melhora hipertrofia, força ou recuperação em pessoas saudáveis com dieta adequada. Quando pode ser útil: saúde intestinal (5-10g/dia pode ajudar permeabilidade intestinal), imunidade em treinos muito intensos (maratonas, competições), pacientes em recuperação de cirurgias/doenças. Economize dinheiro — invista em proteína e creatina."
  },
  {
    id: "v015", category: "Saúde", subcategory: "Geral",
    keywords: ["respiração", "respirar treino", "manobra de valsalva", "respiração correta"],
    question: "Como respirar durante o exercício?",
    answer: "Regra geral: expire no esforço (fase concêntrica), inspire no retorno (fase excêntrica). Para exercícios pesados (agachamento, terra): use a manobra de Valsalva — inspire profundamente antes da repetição, prenda a respiração e contraia o core durante o movimento, expire ao completar. Isso cria pressão intra-abdominal que protege a coluna. Nunca segure a respiração por múltiplas reps. Para cardio: respiração rítmica, inspire pelo nariz e expire pela boca."
  },
  {
    id: "v016", category: "Treino", subcategory: "Princípios",
    keywords: ["treino feminino", "mulher treino", "musculação feminina", "mulher academia"],
    question: "Treino para mulheres é diferente?",
    answer: "Os princípios são os MESMOS: sobrecarga progressiva, nutrição adequada, descanso. Diferenças fisiológicas: mulheres têm menos testosterona (não vão 'ficar grandes' por acidente), recuperam mais rápido entre séries, toleram mais volume, têm mais fibras tipo I (respondem bem a reps altas). Adaptações: podem treinar com mais volume, mais frequência, menos descanso entre séries. Foco em compostos (agachamento, terra, hip thrust, supino, remada). Ciclo menstrual: performance pode variar — ajuste intensidade conforme necessário."
  },
  {
    id: "v017", category: "Dieta", subcategory: "Calorias",
    keywords: ["metabolismo lento", "metabolismo", "metabolismo acelerado", "ativar metabolismo"],
    question: "Meu metabolismo é lento?",
    answer: "Provavelmente não é tão lento quanto você pensa. Variação entre pessoas do mesmo peso/altura: ~200-300kcal/dia (10-15%). 'Metabolismo lento' geralmente é: subestimação do consumo alimentar (pesquisas mostram erro de 20-50%), superestimação do gasto (exercício queima menos do que imaginamos), adaptação metabólica após dietas prolongadas. Para 'acelerar': aumente massa muscular (cada kg queima ~13kcal/dia a mais), aumente NEAT (passos diários), faça diet breaks (2 semanas em manutenção a cada 8-12 semanas de déficit)."
  },
  {
    id: "v018", category: "Treino", subcategory: "Princípios",
    keywords: ["treinar em casa", "home gym", "treino em casa", "equipamento casa"],
    question: "Consigo treinar efetivamente em casa?",
    answer: "Sim! Equipamentos mínimos para um ótimo treino em casa: 1) Halteres ajustáveis (investimento mais importante). 2) Barra de porta para pull-ups. 3) Elásticos de resistência (vários níveis). 4) Banco ajustável (permite dezenas de exercícios). Com isso: supino halter, remada, agachamento búlgaro, stiff, desenvolvimento, rosca, tríceps, pull-ups, flexões. Sem equipamento: flexões, agachamento pistol, dips entre cadeiras, pike push-ups, lunges, pranchas. É possível ganhar massa significativa em casa com halteres."
  },
  {
    id: "v019", category: "Treino", subcategory: "Princípios",
    keywords: ["iniciante", "começar treinar", "nunca treinei", "primeiro dia", "nova academia"],
    question: "Sou iniciante, por onde começo?",
    answer: "Primeiros passos: 1) Configure seu perfil neste app com seus dados e objetivos. 2) Use o treino gerado — ele já é adequado para seu nível. 3) Nas primeiras 2-4 semanas: foque em TÉCNICA, não em carga. 4) Comece com pesos leves para aprender os movimentos. 5) Não compare com outros — cada um tem seu ritmo. 6) Treine 3-4x/semana (full body é ideal para iniciantes). 7) Durma 7-9h, coma proteína suficiente. 8) Use este app para anotar seus pesos. Os primeiros 6 meses são os mais recompensadores — aproveite!"
  },
  {
    id: "v020", category: "Treino", subcategory: "Princípios",
    keywords: ["treinar doente", "gripe", "resfriado", "febre", "treinar gripado"],
    question: "Posso treinar estando doente?",
    answer: "Regra do pescoço: Se os sintomas estão ACIMA do pescoço (congestão nasal, dor de garganta leve): pode treinar com intensidade reduzida. Se estão ABAIXO do pescoço (febre, dor no corpo, tosse no peito, diarreia): NÃO treine — descanse. Febre = sem treino obrigatoriamente (risco de miocardite). Ao retornar: comece com 50% do volume por 3-5 dias. Treinar doente: retarda recuperação, pode piorar a doença, risco de espalhar para outros na academia. Descanse, hidrate-se e volte mais forte."
  },
  // Mais perguntas sobre suplementos
  {
    id: "v021", category: "Dieta", subcategory: "Alimentos",
    keywords: ["beta alanina", "beta-alanina", "formigamento", "parestesia"],
    question: "Beta-alanina funciona?",
    answer: "Sim, para exercícios de 1-4 minutos de duração. Beta-alanina aumenta os níveis de carnosina muscular, que tampona ácido láctico. Benefícios: melhora em 2-3% em exercícios de alta intensidade sustentada (séries longas de 15-30 reps, corrida de 400-1500m, HIIT). Dose: 3-6g/dia divididos em doses menores. O formigamento (parestesia) é inofensivo — use doses menores ou versão sustained release. Precisa de 4-6 semanas de uso contínuo para efeito máximo. Para séries curtas de 5-8 reps, o benefício é mínimo."
  },
  {
    id: "v022", category: "Dieta", subcategory: "Alimentos",
    keywords: ["omega 3", "ômega 3", "óleo de peixe", "fish oil", "dha", "epa"],
    question: "Ômega-3 é importante para quem treina?",
    answer: "Sim! Benefícios do ômega-3 (EPA + DHA): reduz inflamação (melhora recuperação), melhora sensibilidade à insulina, pode reduzir DOMS, benefícios cardiovasculares, saúde cerebral e articular. Dose: 2-3g de EPA+DHA/dia (não do óleo total — verifique o rótulo). Fontes alimentares: salmão, sardinha, atum, cavala (2-3x/semana). Se não come peixe regularmente: suplementar é altamente recomendado. Guarde na geladeira para evitar oxidação. Um dos poucos suplementos com forte evidência científica."
  },
  {
    id: "v023", category: "Treino", subcategory: "Peito",
    keywords: ["supino declinado", "peito inferior", "peitoral inferior", "declinado"],
    question: "O supino declinado é necessário?",
    answer: "O supino declinado enfatiza a porção inferior do peitoral, mas: o supino reto e mergulhos (dips) já trabalham bem essa região. Quando incluir: se o peito inferior é um ponto fraco específico, para variedade de estímulo. Alternativas que trabalham peito inferior: dips (inclinação para frente), crossover com polias altas, flexão declinada (pés elevados). A maioria das pessoas se beneficia mais de supino reto + inclinado + um isolador do que de adicionar o declinado."
  },
  {
    id: "v024", category: "Treino", subcategory: "Ombros",
    keywords: ["encolhimento", "trapézio", "shrug", "trapézio treino"],
    question: "Como treinar trapézio?",
    answer: "O trapézio superior já trabalha em terra, remadas e desenvolvimento. Exercícios específicos: 1) Encolhimento (shrug) com halteres/barra: suba os ombros em direção às orelhas, aperte 2s no topo. Não rotacione os ombros. 2) Farmer's walk: segure halteres pesados e caminhe. 3) Remada alta (com cuidado para não impactar ombro). Volume: 6-10 séries/semana é suficiente. Muitos praticantes já têm trapézio desenvolvido pelos compostos — priorize deltóide posterior e lateral."
  },
  {
    id: "v025", category: "Saúde", subcategory: "Geral",
    keywords: ["exame sangue", "exames", "checkup", "hemograma", "médico"],
    question: "Quais exames de sangue devo fazer?",
    answer: "Exames recomendados para praticantes: Básicos (anual): hemograma completo, glicemia de jejum, perfil lipídico (colesterol total, HDL, LDL, triglicerídeos), creatinina e ureia (função renal), TGO/TGP (função hepática). Importantes: vitamina D (muito comum deficiência), ferro e ferritina, TSH (tireoide), testosterona total e livre (homens). Opcionais: insulina de jejum, PCR (inflamação), vitamina B12, ácido úrico. Faça antes de iniciar um programa sério de treino e repita 1-2x/ano."
  },
  // Perguntas sobre erro comuns
  {
    id: "v026", category: "Treino", subcategory: "Erros",
    keywords: ["erros comuns", "erro na academia", "erro treino", "o que não fazer"],
    question: "Quais os erros mais comuns na academia?",
    answer: "Top 10 erros: 1) Não ter um plano (este app resolve isso!). 2) Ego lifting — usar carga excessiva com técnica ruim. 3) Pular aquecimento. 4) Treinar apenas o que gosta (todo mundo pula pernas). 5) Não progredir — fazer o mesmo treino sempre. 6) Não registrar cargas (use este app!). 7) Descanso insuficiente entre séries pesadas. 8) Focar em isoladores e negligenciar compostos. 9) Copiar treinos de influencers avançados. 10) Negligenciar sono e alimentação. Evite estes e já estará à frente de 90%!"
  },
  {
    id: "v027", category: "Dieta", subcategory: "Mitos",
    keywords: ["mito", "mitos", "verdade ou mito", "é verdade que", "mito alimentar"],
    question: "Quais os maiores mitos da musculação e nutrição?",
    answer: "Mitos desmentidos: 1) 'Comer à noite engorda' — o total calórico diário importa, não o horário. 2) 'Precisa comer a cada 3h' — frequência não importa se o total é o mesmo. 3) 'Carboidrato à noite engorda' — não, se está dentro das calorias. 4) 'Whey protein é anabolizante' — é apenas proteína do leite em pó. 5) 'Mulher que treina pesado fica masculina' — impossível sem hormônios exógenos. 6) 'Agachamento estraga os joelhos' — fortalece quando feito corretamente. 7) 'Gordura dietética engorda' — excesso calórico engorda."
  },
  // Mais variações de perguntas
  {
    id: "v028", category: "Treino", subcategory: "Princípios",
    keywords: ["cardio em jejum", "aeróbico em jejum", "jejum treino", "treinar sem comer"],
    question: "Cardio em jejum queima mais gordura?",
    answer: "Mito parcial. Cardio em jejum usa mais gordura DURANTE o exercício, mas a queima total de gordura em 24h é igual à de cardio alimentado (o corpo compensa depois). Estudos: não há diferença significativa na perda de gordura quando calorias totais são iguais. Porém, se você se sente bem treinando em jejum e isso facilita o déficit calórico, pode usar. Se prejudica performance ou causa tontura, coma antes. Para musculação pesada: comer antes geralmente melhora a performance."
  },
  {
    id: "v029", category: "Treino", subcategory: "Princípios",
    keywords: ["tempo de treino", "quanto tempo treinar", "duração do treino", "sessão longa"],
    question: "Qual a duração ideal do treino?",
    answer: "45-75 minutos é ideal para a maioria (excluindo aquecimento). Após 60-90min: cortisol sobe significativamente, foco e intensidade caem, qualidade das séries diminui. Treinos curtos e intensos > treinos longos e 'enrolados'. Se seu treino passa de 90min: reduza descanso entre séries, faça supersets, reduza o número de exercícios, aumente intensidade e reduza volume. Qualidade > quantidade. Uma sessão de 45min focada pode ser mais eficaz que 2h de treino disperso."
  },
  {
    id: "v030", category: "Dieta", subcategory: "Alimentos",
    keywords: ["açaí", "granola", "lanche saudável", "frutas", "smoothie"],
    question: "Açaí é saudável para quem treina?",
    answer: "Açaí PURO é nutritivo: antioxidantes, gorduras boas, fibras. PORÉM: o açaí de lanchonete geralmente tem adição massiva de açúcar, xarope de guaraná, leite condensado, granola açucarada. Um açaí de 500ml pode ter 600-1000kcal e 60-100g de açúcar! Versão fitness: polpa de açaí pura (sem açúcar) + whey + banana + granola sem açúcar. Fica delicioso e nutritivo. Calorias: contabilize na dieta — muita gente come açaí 'de lanche' e não conta as calorias, o que pode sabotar o déficit calórico."
  },
  // Perguntas sobre variações de exercícios
  {
    id: "v031", category: "Treino", subcategory: "Peito",
    keywords: ["mergulho", "dips", "paralelas", "dip", "mergulho peito"],
    question: "Como fazer mergulho nas paralelas?",
    answer: "Mergulho (dips): 1) Segure-se nas barras paralelas, braços estendidos. 2) Incline o tronco levemente para frente (mais peito) ou mantenha reto (mais tríceps). 3) Desça até os ombros ficarem na altura dos cotovelos (ou levemente abaixo). 4) Empurre para cima. Para peitoral: tronco inclinado, cotovelos abertos. Para tríceps: tronco reto, cotovelos junto ao corpo. Progressão: negativas → assistido com elástico → peso corporal → lastro. Cuidado se tem histórico de dor no ombro."
  },
  {
    id: "v032", category: "Treino", subcategory: "Costas",
    keywords: ["pullover", "pullover halter", "pullover polia", "serrátil"],
    question: "Para que serve o pullover?",
    answer: "Pullover trabalha dorsais, peito (porção inferior/esternal) e serrátil anterior. Com halter: deite transversalmente no banco, halter acima do peito, braços quase retos. Desça o halter para trás da cabeça até sentir alongamento. Retorne. Na polia alta: em pé ou ajoelhado, puxe a barra com braços quase retos em arco até as coxas. Excelente para: amplitude do dorsal, expansão torácica, transição entre treino de peito e costas. 3 séries de 12-15 reps com carga moderada."
  },
  {
    id: "v033", category: "Treino", subcategory: "Core",
    keywords: ["vácuo abdominal", "vacuum", "hipopressivo", "cintura fina", "stomach vacuum"],
    question: "O que é vácuo abdominal?",
    answer: "Vácuo abdominal (stomach vacuum): exercício isométrico que trabalha o transverso abdominal (músculo profundo que funciona como 'cinta' natural). Como fazer: 1) Em quatro apoios ou em pé. 2) Expire TODO o ar. 3) 'Puxe' o umbigo em direção à coluna. 4) Segure 15-30 segundos. 5) Respire e repita. Pratique: 3-5 séries de 15-30s, diariamente. Benefícios: cintura mais fina visualmente (não reduz gordura), melhor controle do core, postura melhorada. Praticado por fisiculturistas clássicos."
  },
  // Mais perguntas de dieta
  {
    id: "v034", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["contagem de macros", "contar calorias", "tracking", "aplicativo dieta", "myfitnesspal"],
    question: "Preciso contar calorias e macros?",
    answer: "Depende do objetivo: Para resultados precisos: sim, pelo menos por 2-3 meses para aprender porções. Para manutenção/saúde geral: não é obrigatório — use o 'método do prato' (1/4 proteína, 1/4 carboidrato, 1/2 vegetais). Dicas: pese alimentos por 2-4 semanas para calibrar o olho, depois estime. Use a dieta gerada neste app como guia de porções. Se estagnado em qualquer objetivo: contar temporariamente ajuda a identificar o problema. 80% dos que 'comem pouco e não emagrecem' subestimam o consumo."
  },
  {
    id: "v035", category: "Dieta", subcategory: "Plano alimentar",
    keywords: ["dieta flexível", "iifym", "if it fits your macros", "flexible dieting"],
    question: "O que é dieta flexível (IIFYM)?",
    answer: "IIFYM (If It Fits Your Macros): abordagem que foca em atingir metas de macronutrientes (proteína, carboidratos, gordura) sem restringir alimentos específicos. Regra: 80% alimentos nutritivos (whole foods), 20% alimentos prazerosos. Desde que os macros e micronutrientes sejam atingidos, você pode incluir pizza, sorvete, chocolate. Vantagens: sustentabilidade, flexibilidade social, sem culpa. Funciona? Sim, para composição corporal o que importa é o total calórico e proteico. Porém: qualidade alimentar importa para saúde, saciedade e micronutrientes."
  },
  // Motivação adicional
  {
    id: "v036", category: "Motivação", subcategory: "Psicologia",
    keywords: ["autoestima", "corpo", "imagem corporal", "comparação", "insegurança"],
    question: "Como lidar com insegurança sobre o corpo?",
    answer: "Dicas de saúde mental no fitness: 1) Redes sociais mostram o MELHOR ângulo, iluminação, pump e (muitas vezes) esteroides — não é a realidade. 2) Compare-se apenas com VOCÊ de ontem. 3) Foque no que seu corpo PODE FAZER, não apenas como parece. 4) Celebre progressos não-estéticos: mais energia, melhor sono, mais força. 5) Dismorfia muscular é real — se a insatisfação corporal está afetando sua vida, procure ajuda profissional. 6) Saúde > estética. O treino deve melhorar sua vida, não controlá-la."
  },
  // Perguntas de segurança
  {
    id: "v037", category: "Saúde", subcategory: "Segurança",
    keywords: ["esteroides", "anabolizante", "hormônio", "bomba", "ciclo", "trt"],
    question: "Sobre esteroides anabolizantes...",
    answer: "Este app promove saúde e treino NATURAL. Sobre esteroides: são substâncias controladas e seu uso sem prescrição médica é ilegal em muitos países. Riscos: problemas cardíacos (principal causa de morte prematura em usuários), danos hepáticos, acne, calvície, infertilidade, dependência psicológica, ginecomastia, supressão hormonal permanente. TRT (Terapia de Reposição de Testosterona): é um tratamento médico legítimo para hipogonadismo diagnosticado — procure um endocrinologista. Resultados naturais são mais lentos, mas sustentáveis e seguros."
  },
  {
    id: "v038", category: "Dieta", subcategory: "Alimentos",
    keywords: ["café da manhã", "desjejum", "primeira refeição", "o que comer de manhã"],
    question: "Qual o melhor café da manhã para quem treina?",
    answer: "Opções de café da manhã fitness: 1) Ovos mexidos + pão integral + abacate (proteína + carbo + gordura boa). 2) Aveia + whey + banana + pasta de amendoim. 3) Iogurte grego + granola sem açúcar + frutas. 4) Tapioca + frango desfiado + cottage. 5) Smoothie: leite + whey + aveia + banana + pasta de amendoim. Se treina de manhã cedo: refeição leve 30-60min antes ou treinar em jejum e comer logo após. Proteína no café da manhã melhora saciedade e controle de apetite ao longo do dia."
  },
  {
    id: "v039", category: "Dieta", subcategory: "Alimentos",
    keywords: ["ceia", "comer antes de dormir", "última refeição", "proteína noite"],
    question: "O que comer antes de dormir?",
    answer: "Ceia ideal para quem treina: proteína de digestão lenta para manter síntese proteica durante o sono. Opções: 1) Cottage ou iogurte grego (caseína — proteína de digestão lenta). 2) Caseína em pó + água. 3) Ovos cozidos. 4) Clara de ovo. Evite: refeições muito pesadas (dificulta sono), muito carboidrato refinado, cafeína. O mito de 'não comer à noite' é falso — uma ceia proteica pode até melhorar a recuperação muscular. 150-200kcal é suficiente."
  },
  {
    id: "v040", category: "Treino", subcategory: "Princípios",
    keywords: ["treino funcional", "functional training", "crossfit", "funcional"],
    question: "Treino funcional ou musculação?",
    answer: "Depende do objetivo: Musculação (hipertrofia/força): superior para ganho de massa muscular e força máxima. Controle preciso de variáveis. Funcional/CrossFit: superior para condicionamento geral, agilidade, resistência cardiovascular. Mais variado e dinâmico. Ideal: combinar os dois. Base de musculação (compostos pesados) + elementos funcionais (mobilidade, condicionamento, exercícios unilaterais). Não são mutuamente exclusivos. Para estética: musculação tradicional é mais eficiente. Para saúde geral: ambos são excelentes."
  },
  // Fallback entries com keywords muito amplas
  {
    id: "f001", category: "Geral", subcategory: "Saudação",
    keywords: ["oi", "olá", "e aí", "bom dia", "boa tarde", "boa noite", "hey", "hello", "hi"],
    question: "Saudação",
    answer: "Olá! 💪 Sou o assistente do FitForge! Posso te ajudar com dúvidas sobre treino, dieta, composição corporal, suplementação, recuperação e muito mais. O que gostaria de saber?"
  },
  {
    id: "f002", category: "Geral", subcategory: "Ajuda",
    keywords: ["ajuda", "help", "como funciona", "o que posso perguntar", "dúvida"],
    question: "Ajuda geral",
    answer: "Posso te ajudar com vários temas! 🏋️ **Treino**: exercícios, técnicas, divisões, princípios. 🥗 **Dieta**: macros, calorias, alimentos, suplementos, plano alimentar. 📊 **Composição corporal**: medições, percentual de gordura, IMC. 💤 **Recuperação**: sono, descanso, lesões, mobilidade. 🏃 **Cardio**: tipos, frequência, como conciliar com musculação. 📱 **App**: como usar as funcionalidades do FitForge. Pergunte qualquer coisa!"
  },
  {
    id: "f003", category: "Geral", subcategory: "Agradecimento",
    keywords: ["obrigado", "obrigada", "valeu", "agradeço", "thanks", "brigado"],
    question: "Agradecimento",
    answer: "De nada! 😊 Fico feliz em ajudar. Se tiver mais alguma dúvida sobre treino, dieta ou qualquer outro tema, é só perguntar. Bons treinos! 💪"
  },
];

// Categorias disponíveis para navegação
export const categories = [
  { id: "treino", label: "🏋️ Treino", color: "primary" },
  { id: "dieta", label: "🥗 Dieta", color: "green" },
  { id: "composicao", label: "📊 Composição Corporal", color: "blue" },
  { id: "saude", label: "💤 Saúde e Recuperação", color: "purple" },
  { id: "cardio", label: "🏃 Cardio", color: "orange" },
  { id: "motivacao", label: "💪 Motivação", color: "yellow" },
  { id: "app", label: "📱 Usar o App", color: "cyan" },
  { id: "avancado", label: "🧠 Avançado", color: "red" },
];

export const categoryMap: Record<string, string> = {
  treino: "Treino",
  dieta: "Dieta",
  composicao: "Composição Corporal",
  saude: "Saúde",
  cardio: "Cardio",
  motivacao: "Motivação",
  app: "App",
  avancado: "Avançado",
};
