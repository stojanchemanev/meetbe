import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@/utils/supabase/client";

export async function AiSearch(query: string) {
  try {
    const supabase = createClient();
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, category, description, address");

    const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.GENAI_API_KEY;
    if (!apiKey) {
      // fallback to local keyword matching if no GenAI key
      const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      const ids = queryTokens.length
        ? (businesses ?? []).
          filter((b) => {
            const hay = `${b.name} ${b.description} ${b.category} ${b.address}`.toLowerCase();
            return queryTokens.some((t) => hay.includes(t));
          })
          .map((b) => b.id)
        : (businesses ?? []).map((b) => b.id);
      console.log('ids', ids)
      return new Response(JSON.stringify({ ids }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = `I have the following businesses: ${JSON.stringify(
      (businesses ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        cat: b.category,
        desc: b.description,
        address: b.address,
      }))
    )}. The user is asking for: "${query}". Analyze their needs and return a JSON array of business IDs that would be relevant. If none match, return an empty array.`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const matchedIds = response?.text ? JSON.parse(response.text || "[]") : [];
    console.log('matchedIds', matchedIds)
    return new Response(JSON.stringify({ ids: matchedIds }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/ai-search error:", err);
    return new Response(JSON.stringify({ ids: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}
