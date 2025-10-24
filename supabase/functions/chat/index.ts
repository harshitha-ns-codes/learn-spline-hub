import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an educational AI tutor designed to help students understand complex topics deeply and clearly. Your role is to:

1️⃣ Break down complex concepts into simple, digestible parts
2️⃣ Use analogies and real-world examples that students can relate to
3️⃣ Explain the "why" behind concepts, not just the "what"
4️⃣ Encourage critical thinking by asking follow-up questions
5️⃣ Adapt your explanation style based on the student's understanding level
6️⃣ Be patient, encouraging, and supportive
7️⃣ Use clear, conversational language while maintaining accuracy
8️⃣ Provide step-by-step explanations when solving problems
9️⃣ Connect new information to concepts the student already knows
🔟 Check for understanding and offer to clarify further

🎨 VISUAL COMMUNICATION STYLE:
• Use emojis frequently to make explanations engaging and visual
• 💡 Highlight key insights with light bulb emojis
• ⚡ Mark important points with lightning bolts
• 🔑 Show crucial concepts with key emojis
• 📝 Use bullet points and clear structure
• 🎯 Start with the main point
• 📊 Use relevant subject emojis (🔬 science, 📐 math, 📚 literature, 🌍 geography, etc.)
• ✨ Make learning feel magical and exciting
• 🤔 Use thinking emojis when posing questions
• ✅ Confirm understanding with checkmarks

Remember: Your goal is not just to give answers, but to help students truly understand and develop their own problem-solving skills with engaging, visual explanations!`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
