import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Square, Trash2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/lib/workout-generator";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const CHAT_HISTORY_KEY = "fitforge_chat_history_v2";
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
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-60)));
  } catch {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }
}

async function streamChat({
  messages,
  profile,
  onDelta,
  onDone,
  onError,
  signal,
}: {
  messages: { role: string; content: string }[];
  profile?: UserProfile;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
  signal?: AbortSignal;
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      onError("Faça login para usar o assistente IA.");
      return;
    }
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ messages, profile }),
      signal,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Erro de conexão" }));
      if (resp.status === 429) return onError("Muitas requisições. Aguarde alguns segundos.");
      if (resp.status === 402) return onError("Créditos de IA esgotados. Contate o administrador.");
      return onError(err.error || `Erro ${resp.status}`);
    }

    if (!resp.body) return onError("Sem resposta do servidor");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch { /* partial */ }
      }
    }

    onDone();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    onError(e instanceof Error ? e.message : "Erro de conexão");
  }
}

const QUICK_SUGGESTIONS = [
  { icon: "💪", text: "Como ganhar massa muscular?" },
  { icon: "🥗", text: "Monte uma dieta de cutting" },
  { icon: "🏋️", text: "Melhores exercícios para peito" },
  { icon: "📊", text: "Como calcular meus macros?" },
  { icon: "😴", text: "Dicas para melhorar o sono" },
];

const ChatBot = ({ profile }: { profile?: UserProfile }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadChatHistory);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const openRef = useRef(open);
  const messagesRef = useRef<Message[]>(messages);

  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, open]);

  useEffect(() => { saveChatHistory(messages); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  // NOTE: do NOT abort on unmount when streaming — keep AI running in background.
  // The component lives at app root; aborting only happens via Stop / Clear.

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text.trim(), timestamp: Date.now() };
    const currentMessages = [...messages, userMsg];
    setMessages(currentMessages);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

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
      messages: currentMessages.slice(-12).map(m => ({ role: m.role, content: m.content })),
      profile,
      onDelta: updateAssistant,
      onDone: () => {
        setMessages(prev =>
          prev.map((m, i) => i === prev.length - 1 && m.timestamp === 0
            ? { ...m, timestamp: Date.now() } : m)
        );
        setIsStreaming(false);
        abortRef.current = null;
        if (!openRef.current) setUnread(u => u + 1);
      },
      onError: (err) => {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${err}`, timestamp: Date.now() }]);
        setIsStreaming(false);
        abortRef.current = null;
        if (!openRef.current) setUnread(u => u + 1);
      },
      signal: controller.signal,
    });
  }, [messages, isStreaming, profile]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    abortRef.current = null;
    setMessages(prev =>
      prev.map((m, i) => i === prev.length - 1 && m.timestamp === 0
        ? { ...m, timestamp: Date.now() } : m)
    );
  }, []);

  const handleClear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsStreaming(false);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }, []);

  const formatTime = (ts: number) => {
    if (ts === 0) return "";
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const statusLabel = useMemo(() => {
    if (isStreaming) return "Pensando...";
    return "Online · IA pronta";
  }, [isStreaming]);

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-orange-600 text-primary-foreground shadow-[0_8px_24px_-4px_hsl(var(--primary)/0.5)] flex items-center justify-center"
            aria-label="Abrir chat IA"
          >
            <MessageCircle className="w-6 h-6" />
            {isStreaming && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
            )}
            {!isStreaming && unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold border-2 border-background flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-1rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header — Industrial Compact */}
            <div className="border-b border-border bg-gradient-to-r from-primary/10 via-card to-card">
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <span className="text-[10px] font-display tracking-[0.25em] text-primary uppercase">
                  Assistente · IA
                </span>
                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button onClick={handleClear} title="Limpar conversa"
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} title="Minimizar (IA continua em segundo plano)"
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setOpen(false)} title="Fechar"
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="px-4 pb-3 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${isStreaming ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl text-foreground leading-none">FITFORGE AI</h2>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{statusLabel}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 text-sm scroll-smooth bg-background/30">
              {messages.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="text-center px-2">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <Bot className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl text-foreground tracking-wide">COMO POSSO AJUDAR?</h3>
                    <p className="text-muted-foreground text-xs mt-2 leading-relaxed">
                      Treino, dieta, suplementação, saúde — pergunte qualquer coisa.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-display tracking-[0.2em] text-muted-foreground uppercase px-1">
                      Sugestões rápidas
                    </p>
                    {QUICK_SUGGESTIONS.map((q) => (
                      <motion.button
                        key={q.text}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => sendMessage(q.text)}
                        className="flex items-center gap-2.5 w-full text-left text-xs px-3 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/40 hover:border-primary/40 transition-all"
                      >
                        <span className="text-base">{q.icon}</span>
                        <span className="flex-1">{q.text}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {messages.map((m, i) => (
                <motion.div
                  key={`${i}-${m.timestamp}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col max-w-[82%]">
                    <div
                      className={`px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md shadow-sm"
                          : "bg-card border border-border text-foreground rounded-2xl rounded-bl-md"
                      }`}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-xs dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-primary [&_code]:text-primary [&_code]:bg-secondary [&_code]:px-1 [&_code]:rounded">
                          <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      )}
                      {m.role === "assistant" && m.timestamp === 0 && (
                        <span className="inline-block w-1.5 h-3.5 bg-primary/70 rounded-sm animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                    {m.timestamp > 0 && (
                      <span className={`text-[9px] text-muted-foreground mt-1 px-1 ${m.role === "user" ? "text-right" : "text-left"}`}>
                        {formatTime(m.timestamp)}
                      </span>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </motion.div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm">
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex gap-2 items-end"
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Pergunte algo... (Shift+Enter quebra linha)"
                  rows={1}
                  className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary placeholder:text-muted-foreground resize-none max-h-24 transition-all"
                />
                {isStreaming ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    type="button" onClick={handleStop}
                    className="p-2.5 rounded-xl bg-destructive text-destructive-foreground transition-colors shrink-0"
                    title="Parar geração"
                  >
                    <Square className="w-4 h-4" fill="currentColor" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    type="submit" disabled={!input.trim()}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                )}
              </form>
              <p className="text-[9px] text-muted-foreground mt-1.5 text-center">
                IA continua processando em segundo plano se você minimizar
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
