import Image from "next/image";
import { Clock, Settings, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
    return (
        <main className="max-w-7xl mx-auto px-4 py-20 text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-6">
                Grow your business <br />
                <span className="text-secondary-600">without the headache.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                The all-in-one platform for local businesses to manage staff,
                availability, and bookings. Used by over 10,000 barbers, spas,
                and personal trainers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                    href="/register"
                    className="w-full sm:w-auto bg-secondary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-secondary-700 transition-all transform hover:scale-105 shadow-xl shadow-secondary-100"
                >
                    Register My Business
                </Link>
                <Link
                    href="/browse"
                    className="w-full sm:w-auto bg-white border border-gray-300 text-gray-800 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all"
                >
                    Find a Service
                </Link>
            </div>

            <div className="mt-24 grid md:grid-cols-3 gap-8 text-left">
                {[
                    {
                        title: "Multi-Tenant Architecture",
                        desc: "Separate, secure data environments for every company and client.",
                        icon: Users,
                    },
                    {
                        title: "Staff Management",
                        desc: "Manage unlimited employees with individual schedules and services.",
                        icon: Settings,
                    },
                    {
                        title: "Smart Scheduling",
                        desc: "Powerful calendar controls for businesses and easy booking for clients.",
                        icon: Clock,
                    },
                ].map((feat, i) => (
                    <div
                        key={i}
                        className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <feat.icon className="w-10 h-10 text-secondary-600 mb-4" />
                        <h3 className="text-xl font-bold mb-2">{feat.title}</h3>
                        <p className="text-gray-600">{feat.desc}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}
