"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, MapPin } from "lucide-react";
import { AISearchAssistant } from "./../../src/components/AISearchAssistant";
import { CATEGORIES } from "../../src/constants";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import Image from "next/image.js";
import { createClient } from "@supabase/supabase-js";
import { BusinessRecord } from "@/src/types/Business";

const Browse = () => {
    const [activeCategory, setActiveCategory] = useState("All");
    const [search, setSearch] = useState("");
    const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);
    const [data, setData] = useState<BusinessRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    );

    useEffect(() => {
        const fetchBusinesses = async () => {
            const { data, error } = await supabase
                .from("businesses")
                .select("*");
            if (error) {
                console.error("Error fetching businesses:", error);
            } else {
                setData(data || []);
            }
            setLoading(false);
        };
        fetchBusinesses();
    }, []);

    const filtered = data.filter((b: BusinessRecord) => {
        const matchesCategory =
            activeCategory === "All" || b.category === activeCategory;
        const matchesSearch =
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.description.toLowerCase().includes(search.toLowerCase());
        const matchesAI = aiMatchedIds === null || aiMatchedIds.includes(b.id);

        return matchesCategory && matchesSearch && matchesAI;
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search services, shops, or locations..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-lg focus:ring-2 focus:ring-secondary-500 transition-all outline-none"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setAiMatchedIds(null);
                            }}
                        />
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 flex gap-2 pb-4 overflow-x-auto no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                setAiMatchedIds(null);
                            }}
                            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                                activeCategory === cat
                                    ? "bg-secondary-600 text-white shadow-lg shadow-secondary-100"
                                    : "bg-white text-gray-500 border hover:bg-gray-50"
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 mt-10">
                <AISearchAssistant onResult={setAiMatchedIds} />

                {loading ? (
                    <div className="py-20 text-center text-gray-500">
                        Loading services from Supabase...
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold">
                                {aiMatchedIds
                                    ? "AI Recommended Results"
                                    : "Explore Services"}
                            </h2>
                            {aiMatchedIds && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setAiMatchedIds(null)}
                                    className="text-secondary-600 font-bold"
                                >
                                    Show All Again
                                </Button>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filtered.length === 0 ? (
                                <div className="col-span-full py-20 text-center">
                                    <p className="text-gray-400 font-bold text-lg italic">
                                        No results found matching your criteria.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => {
                                            setSearch("");
                                            setActiveCategory("All");
                                            setAiMatchedIds(null);
                                        }}
                                    >
                                        Clear Filters
                                    </Button>
                                </div>
                            ) : (
                                filtered.map((business: BusinessRecord) => (
                                    <Link
                                        href={`/business/${business.id}`}
                                        key={business.id}
                                        className="group"
                                    >
                                        <Card className="hover:ring-2 hover:ring-secondary-500 transition-all border-none shadow-md hover:shadow-xl">
                                            <Image
                                                src={business.logo}
                                                alt={business.name}
                                                width={200}
                                                loading="eager"
                                                height={200}
                                                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="p-6">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold text-secondary-600 uppercase tracking-widest bg-secondary-50 px-2 py-1 rounded">
                                                        {business.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold mb-2 group-hover:text-secondary-600 transition-colors">
                                                    {business.name}
                                                </h3>
                                                <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                                                    <MapPin className="w-4 h-4" />
                                                    {business.address}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                                    {business.description}
                                                </p>
                                            </div>
                                        </Card>
                                    </Link>
                                ))
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default Browse;
