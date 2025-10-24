import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { streamChat } from "@/utils/streamChat";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (input: string) => {
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantContent = "";
    const upsertAssistant = (nextChunk: string) => {
      assistantContent += nextChunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
        onError: (error) => {
          setIsLoading(false);
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
          setMessages((prev) => prev.slice(0, -1));
        },
      });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center gap-3 p-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-message">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">EduChat AI</h1>
          <p className="text-sm text-muted-foreground">Your personal learning assistant</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Welcome to EduChat AI!</h2>
              <p className="text-muted-foreground max-w-md">
                I'm here to help you understand any topic deeply and clearly. Ask me anything, and I'll
                break it down step by step!
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {[
                "Explain photosynthesis like I'm 10",
                "How does gravity actually work?",
                "What's the difference between AI and ML?",
                "Help me understand quadratic equations",
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => sendMessage(example)}
                  className="px-4 py-2 text-sm rounded-full bg-accent hover:bg-accent/80 text-accent-foreground transition-all duration-300 hover:scale-105 shadow-soft"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => <ChatMessage key={i} role={msg.role} content={msg.content} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 border-t border-border bg-card/50 backdrop-blur-sm">
        <ChatInput onSend={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};
