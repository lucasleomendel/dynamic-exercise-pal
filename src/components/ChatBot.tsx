import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const CHAT_HISTORY_KEY = "fitforge_chat_history";
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

function loadChatHistory(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChatHistory(messages: Message[]) {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-50)));
}

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: { role: string; content: string }[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
      onError(err.error || `Erro ${resp.status}`);
      return;
    }

    if (!resp.body) {
      onError("Sem resposta do servidor");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {
          // partial JSON, skip
        }
      }
    }

    // flush remaining
    if (buffer.trim()) {
      for (let raw of buffer.split("\n")) {
        if (!raw || !raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* ignore */ }
      }
    }

    onDone();
  } catch (e) {
    onError(e instanceof Error ? e.message : "Erro de conexão");
  }
}

const QUICK_SUGGESTIONS = [
  "Como ganhar massa muscular?",
  "Monte uma dieta de cutting",
  "Quais os melhores exercícios para peito?",
  "Como calcular meus macros?",
  "Dicas para melhorar o sono",
];

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [messages, open]);

  useEffect(() => { saveChatHistory(messages); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text.trim(), timestamp: Date.now() };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsStreaming(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.timestamp === 0) {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
        }
        return [...prev, { role: "assistant", content: assistantContent, timestamp: 0 }];
      });
    };

    await streamChat({
      messages: currentMessages.map(m => ({ role: m.role, content: m.content })),
      onDelta: updateAssistant,
      onDone: () => {
        setMessages(prev =>
          prev.map((m, i) => i === prev.length - 1 && m.timestamp === 0
            ? { ...m, timestamp: Date.now() }
            : m
          )
        );
        setIsStreaming(false);
      },
      onError: (err) => {
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: `❌ ${err}`, timestamp: Date.now() },
        ]);
        setIsStreaming(false);
      },
    });
  }, [messages, isStreaming]);

  const handleClear = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  const formatTime = (ts: number) => {
    if (ts === 0) return "";
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            aria-label="Abrir chat IA"
          >
            <MessageCircle className="w-6 h-6" />
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
                <div className="w-7 h-7 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-sm block leading-tight">FitForge AI</span>
                  <span className="text-[10px] opacity-80">
                    {isStreaming ? "Pensando..." : "Assistente inteligente"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={handleClear} className="px-2 py-1 text-[10px] hover:bg-primary-foreground/20 rounded-lg transition-colors opacity-70 hover:opacity-100">
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
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-foreground font-semibold text-sm">Olá! Sou o FitForge AI 🤖</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      Pergunte qualquer coisa sobre treino, dieta, suplementação e saúde. Respostas inteligentes e atualizadas!
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Sugestões</p>
                    {QUICK_SUGGESTIONS.map((q) => (
                      <motion.button
                        key={q}
                        whileHover={{ x: 2 }}
                        onClick={() => sendMessage(q)}
                        className="block w-full text-left text-xs px-3 py-2.5 rounded-xl bg-secondary/70 hover:bg-secondary transition-colors border border-transparent hover:border-border"
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[80%]">
                    <div
                      className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-xs prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      )}
                      {m.role === "assistant" && m.timestamp === 0 && (
                        <span className="inline-block w-1.5 h-4 bg-primary/60 rounded-sm animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                    {m.timestamp > 0 && (
                      <span className={`text-[9px] text-muted-foreground mt-0.5 ${m.role === "user" ? "text-right" : "text-left"}`}>
                        {formatTime(m.timestamp)}
                      </span>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
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

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background/50 backdrop-blur-sm">
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pergunte qualquer coisa..."
                  disabled={isStreaming}
                  className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-border bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary placeholder:text-muted-foreground transition-all disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 transition-opacity"
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
