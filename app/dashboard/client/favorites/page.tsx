"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, MapPin, Star } from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/src/components/ui";
import { getFavorites, removeFavorite } from "@/app/actions/favorites";
import { Favorite } from "@/src/types";

export default function FavoritesPage() {
    const { user, loading, isAuthenticated } = useAuth();
    const router = useRouter();

    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [favLoading, setFavLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated === false) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (!user) return;
        getFavorites().then(({ data }) => {
            setFavorites(data ?? []);
            setFavLoading(false);
        });
    }, [user]);

    const handleRemove = async (businessId: string) => {
        setRemoving(businessId);
        const { error } = await removeFavorite(businessId);
        if (!error) {
            setFavorites((prev) =>
                prev.filter((f) => f.business_id !== businessId),
            );
        }
        setRemoving(null);
    };

    if (loading || !user) return (
        <main className="max-w-4xl mx-auto px-6 py-12">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-100 rounded w-1/3" />
                <div className="h-48 bg-gray-100 rounded-xl" />
                <div className="h-48 bg-gray-100 rounded-xl" />
            </div>
        </main>
    );

    return (
        <main className="max-w-4xl mx-auto px-6 py-12">
            <div className="mb-8">
                <Link
                    href="/dashboard/client"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to dashboard
                </Link>
                <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6 text-red-500 fill-current" />
                    <h1 className="text-3xl font-extrabold text-gray-900">
                        My Favorites
                    </h1>
                </div>
                <p className="text-gray-500 mt-1">
                    Businesses you&apos;ve saved for quick access.
                </p>
            </div>

            {favLoading ? (
                <Card className="p-8 text-center text-sm text-gray-400">
                    Loading favorites...
                </Card>
            ) : favorites.length === 0 ? (
                <Card className="p-10 text-center border-gray-100">
                    <Heart className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 mb-2">
                        No favorites yet
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Browse businesses and tap{" "}
                        <strong>Save</strong> to add them here.
                    </p>
                    <Link href="/browse">
                        <Button className="py-3 px-6 font-bold rounded-xl shadow-lg shadow-red-100">
                            Browse Services
                        </Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {favorites.map((fav) => {
                        const biz = fav.business;
                        if (!biz) return null;
                        return (
                            <Card
                                key={fav.id}
                                className="overflow-hidden border-gray-100"
                            >
                                <div className="relative h-32 bg-red-600">
                                    <Image
                                        src={biz.logo}
                                        alt={biz.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">
                                                {biz.name}
                                            </h3>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                                                {biz.category}
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1 text-sm font-bold text-gray-700 shrink-0">
                                            <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                                            {biz.rating}
                                        </span>
                                    </div>
                                    <p className="flex items-center gap-1 text-xs text-gray-500 mb-4 truncate">
                                        <MapPin className="w-3 h-3 shrink-0" />
                                        {biz.address}
                                    </p>
                                    <div className="flex gap-2">
                                        <Link
                                            href={`/business/${biz.id}`}
                                            className="flex-1"
                                        >
                                            <Button className="w-full">
                                                Book Now
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            onClick={() =>
                                                handleRemove(biz.id)
                                            }
                                            disabled={removing === biz.id}
                                            className="px-3"
                                        >
                                            <Heart
                                                className={`w-4 h-4 ${removing === biz.id ? "opacity-40" : "fill-current text-red-400"}`}
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
