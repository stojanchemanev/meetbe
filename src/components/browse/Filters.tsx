"use client";

import React, { useState } from "react";
import { Button, Card } from "../ui";
import { Link, MapPin, Star } from "lucide-react";
import { BusinessRecord } from "@/src/types/Business";

import Image from "next/image";

const Filters = ({ filtered }: { filtered: BusinessRecord[] }) => {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [aiMatchedIds, setAiMatchedIds] = useState<string[] | null>(null);

    return (
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
                        <Card className="hover:ring-2 hover:ring-indigo-500 transition-all border-none shadow-md hover:shadow-xl">
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
                                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded">
                                        {business.category}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
                                        <Star className="w-4 h-4 fill-current" />
                                        {business.rating}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 transition-colors">
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
    );
};

export default Filters;
