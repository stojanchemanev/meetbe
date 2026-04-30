import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

import { Button } from "./ui/Button";
import { MOCK_BUSINESSES } from "../../src/constants";
import { AiSearch } from "../../app/actions/ai";

export const AISearchAssistant: React.FC<{
    onResult: (matchedIds: string[] | null) => void;
}> = ({ onResult }) => {
    const [query, setQuery] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Simple local fallback: match query tokens to name/description/category
    const localFallbackSearch = (q: string) => {
        const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return [];
        return MOCK_BUSINESSES.filter((b) => {
            const hay =
                `${b.name} ${b.description} ${b.category}`.toLowerCase();
            return tokens.some((t) => hay.includes(t));
        }).map((b) => b.id);
    };

    const handleAISearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsThinking(true);
        setError(null);

        try {
            // Vite injects process.env.API_KEY at build/dev time via vite.config.ts
            // after replacement this will be a string literal in the browser build.
            // If you open index.html directly (not via Vite dev server) this may be empty.
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // Server-side API route will handle the API key; client calls the route.
            // Call our server-side API route which holds the API key in .env.local
            // const res = await fetch("@app/actions/ai", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ query }),
            // });

            const res = await AiSearch(JSON.stringify({ query }));

            if (!res.ok) {
                const matched = localFallbackSearch(query);
                onResult(matched.length ? matched : []);
                return;
            }

            const data = await res.json();
            const matchedIds = Array.isArray(data?.ids) ? data.ids : [];
            onResult(matchedIds);
        } catch (err) {
            console.error("AI Search Error:", err);
            // fallback: try a local search so the user gets something
            const fallback = localFallbackSearch(query);
            if (fallback.length > 0) {
                onResult(fallback);
            } else {
                setError(
                    "AI search is currently unavailable. Showing local results may help.",
                );
                onResult(null);
            }
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="bg-secondary-50 border border-secondary-100 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-secondary-600 animate-pulse" />
                <h3 className="font-bold text-secondary-900">
                    AI Personal Assistant
                </h3>
            </div>
            <form onSubmit={handleAISearch} className="flex gap-2">
                <input
                    type="text"
                    placeholder="e.g., 'Looking for a relaxing facial and maybe a hair touch up today'"
                    className="flex-1 px-4 py-3 rounded-xl border border-secondary-200 focus:ring-2 focus:ring-secondary-500 outline-none text-sm font-medium"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button
                    disabled={isThinking}
                    type="submit"
                    className="shrink-0 bg-secondary-600 text-white px-6"
                >
                    {isThinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        "Search with AI"
                    )}
                </Button>
            </form>
            {error && (
                <p className="text-xs text-primary-500 mt-2 font-medium">{error}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
                Tip: If AI results fail, the app will try a local keyword search
                instead.
            </p>
        </div>
    );
};
