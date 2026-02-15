import { knowledgeBase, KnowledgeEntry, categoryMap } from "./chatbot-knowledge";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(/\s+/).filter(t => t.length > 2);
}

interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

export function searchKnowledge(query: string): KnowledgeEntry | null {
  const normalizedQuery = normalize(query);
  const tokens = tokenize(query);

  if (tokens.length === 0) return null;

  const scored: ScoredEntry[] = [];

  for (const entry of knowledgeBase) {
    let score = 0;

    // Exact keyword match (highest priority)
    for (const kw of entry.keywords) {
      const nkw = normalize(kw);
      if (normalizedQuery.includes(nkw)) {
        score += 10 + nkw.length;
      }
    }

    // Token match against keywords
    for (const token of tokens) {
      for (const kw of entry.keywords) {
        const nkw = normalize(kw);
        if (nkw.includes(token)) score += 3;
        if (token.includes(nkw)) score += 3;
      }
    }

    // Token match against question
    const nq = normalize(entry.question);
    for (const token of tokens) {
      if (nq.includes(token)) score += 2;
    }

    // Token match against subcategory
    const nsub = normalize(entry.subcategory);
    for (const token of tokens) {
      if (nsub.includes(token)) score += 1;
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.length > 0 ? scored[0].entry : null;
}

export function getEntriesByCategory(categoryKey: string): KnowledgeEntry[] {
  const categoryName = categoryMap[categoryKey];
  if (!categoryName) return [];
  return knowledgeBase.filter(e => e.category === categoryName);
}

export function getPopularQuestions(): KnowledgeEntry[] {
  const ids = ["t001", "d001", "d005", "c001", "s001", "t030", "d012", "d013", "a001", "m001"];
  return ids.map(id => knowledgeBase.find(e => e.id === id)!).filter(Boolean);
}

export function getFallbackResponse(): string {
  return "Desculpe, não encontrei uma resposta específica para essa pergunta. Tente reformular ou escolha uma categoria abaixo para navegar pelos temas disponíveis. Posso te ajudar com treino, dieta, composição corporal, saúde, cardio e muito mais! 💪";
}
