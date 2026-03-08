import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, ChevronLeft, Sparkles, Bot, User } from "lucide-react";
import { searchKnowledge, getEntriesByCategory, getPopularQuestions, getFallbackResponse } from "@/lib/chatbot-engine";
import { categories } from "@/lib/chatbot-knowledge";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "bot";
  text: string;
  timestamp: number;
}

const CHAT_HISTORY_KEY = "fitforge_chat_history";

function loadChatHistory(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(messages: Message[]) {
  // Keep last 100 messages
  const trimmed = messages.slice(-100);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
}

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [messages, open]);

  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = useCallback(() => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setShowCategories(false);
    setSelectedCategory(null);

    const userMsg: Message = { role: "user", text: q, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    // Simulate typing delay
    setIsTyping(true);
    setTimeout(() => {
      const result = searchKnowledge(q);
      const botMsg: Message = {
        role: "bot",
        text: result ? result.answer : getFallbackResponse(),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  }, [input]);

  const handleQuickQuestion = useCallback((question: string, answer: string) => {
    setShowCategories(false);
    setSelectedCategory(null);
    const now = Date.now();
    setMessages(prev => [
      ...prev,
      { role: "user", text: question, timestamp: now },
      { role: "bot", text: answer, timestamp: now + 1 },
    ]);
  }, []);

  const handleCategorySelect = useCallback((catId: string) => {
    setSelectedCategory(catId);
  }, []);

  const handleClearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  const categoryEntries = useMemo(
    () => (selectedCategory ? getEntriesByCategory(selectedCategory) : []),
    [selectedCategory]
  );
  const popular = useMemo(() => getPopularQuestions(), []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            aria-label="Abrir chat"
          >
            <MessageCircle className="w-6 h-6" />
            {messages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
                {Math.min(messages.filter(m => m.role === "bot").length, 99)}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
              <div className="flex items-center gap-2">
                {(showCategories || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      if (!selectedCategory) setShowCategories(false);
                    }}
                    className="p-1 hover:bg-primary-foreground/20 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm block leading-tight">FitForge AI</span>
                    <span className="text-[10px] opacity-80">Assistente de treino</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="px-2 py-1 text-[10px] hover:bg-primary-foreground/20 rounded-lg transition-colors opacity-70 hover:opacity-100"
                  >
                    Limpar
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm scroll-smooth">
              {messages.length === 0 && !showCategories && !selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-foreground font-semibold text-sm">Olá! Sou seu assistente fitness</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Pergunte sobre treino, dieta, composição corporal e mais.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Perguntas populares
                    </p>
                    {popular.slice(0, 5).map((e) => (
                      <motion.button
                        key={e.id}
                        whileHover={{ x: 2 }}
                        onClick={() => handleQuickQuestion(e.question, e.answer)}
                        className="block w-full text-left text-xs px-3 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors border border-transparent hover:border-border"
                      >
                        {e.question}
                      </motion.button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowCategories(true)}
                    className="w-full text-xs text-primary font-medium py-2 hover:underline flex items-center justify-center gap-1"
                  >
                    📚 Ver todos os temas
                  </button>
                </motion.div>
              )}

              {showCategories && !selectedCategory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1.5"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                    Escolha um tema
                  </p>
                  {categories.map((c) => (
                    <motion.button
                      key={c.id}
                      whileHover={{ x: 2 }}
                      onClick={() => handleCategorySelect(c.id)}
                      className="block w-full text-left text-xs px-3 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors border border-transparent hover:border-border"
                    >
                      {c.label}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1.5"
                >
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
                    {categories.find((c) => c.id === selectedCategory)?.label} — {categoryEntries.length} perguntas
                  </p>
                  {categoryEntries.map((e) => (
                    <motion.button
                      key={e.id}
                      whileHover={{ x: 2 }}
                      onClick={() => handleQuickQuestion(e.question, e.answer)}
                      className="block w-full text-left text-xs px-3 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors border border-transparent hover:border-border"
                    >
                      {e.question}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "bot" && (
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className={`text-[9px] text-muted-foreground mt-0.5 ${m.role === "user" ? "text-right" : "text-left"}`}>
                      {formatTime(m.timestamp)}
                    </span>
                  </div>
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Typing indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 items-center"
                  >
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte algo..."
                  className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
              {messages.length > 0 && !showCategories && (
                <button
                  onClick={() => setShowCategories(true)}
                  className="w-full text-xs text-muted-foreground mt-2 hover:text-primary transition-colors"
                >
                  📚 Navegar por temas
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
