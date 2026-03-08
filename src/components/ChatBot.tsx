import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, ChevronLeft } from "lucide-react";
import { searchKnowledge, getEntriesByCategory, getPopularQuestions, getFallbackResponse } from "@/lib/chatbot-engine";
import { categories } from "@/lib/chatbot-knowledge";

interface Message {
  role: "user" | "bot";
  text: string;
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setShowCategories(false);
    setSelectedCategory(null);

    const userMsg: Message = { role: "user", text: q };
    const result = searchKnowledge(q);
    const botMsg: Message = {
      role: "bot",
      text: result ? result.answer : getFallbackResponse(),
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const handleQuickQuestion = (question: string, answer: string) => {
    setShowCategories(false);
    setSelectedCategory(null);
    setMessages(prev => [...prev, { role: "user", text: question }, { role: "bot", text: answer }]);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
  };

  const categoryEntries = selectedCategory ? getEntriesByCategory(selectedCategory) : [];
  const popular = getPopularQuestions();

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Abrir chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              {(showCategories || selectedCategory) && (
                <button onClick={() => { setSelectedCategory(null); if (!selectedCategory) setShowCategories(false); }} className="p-1 hover:bg-primary-foreground/20 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span className="font-bold text-sm">FitForge Assistente</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-primary-foreground/20 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
            {messages.length === 0 && !showCategories && !selectedCategory && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-center text-xs">Olá! Pergunte sobre treino, dieta, composição corporal e mais.</p>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Perguntas populares:</p>
                  {popular.slice(0, 5).map(e => (
                    <button
                      key={e.id}
                      onClick={() => handleQuickQuestion(e.question, e.answer)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                      {e.question}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowCategories(true)}
                  className="w-full text-xs text-primary font-medium py-2 hover:underline"
                >
                  📚 Ver todos os temas
                </button>
              </div>
            )}

            {showCategories && !selectedCategory && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Escolha um tema:</p>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCategorySelect(c.id)}
                    className="block w-full text-left text-xs px-3 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {selectedCategory && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  {categories.find(c => c.id === selectedCategory)?.label} — {categoryEntries.length} perguntas
                </p>
                {categoryEntries.map(e => (
                  <button
                    key={e.id}
                    onClick={() => handleQuickQuestion(e.question, e.answer)}
                    className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {e.question}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <form
              onSubmit={e => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte algo..."
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            {messages.length > 0 && (
              <button
                onClick={() => setShowCategories(true)}
                className="w-full text-xs text-muted-foreground mt-2 hover:text-primary"
              >
                📚 Navegar por temas
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
