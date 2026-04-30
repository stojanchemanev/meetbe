"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";

const Page = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        company: "",
        message: "",
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        // Simulate submission — replace with your actual API call
        await new Promise((r) => setTimeout(r, 1000));
        setSubmitted(true);
        setSubmitting(false);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-24">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6">
                    Let&apos;s talk{" "}
                    <span className="text-primary-600 italic font-medium">
                        enterprise.
                    </span>
                </h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto font-medium">
                    Tell us about your business and we&apos;ll put together a
                    custom plan that works for you.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Contact info */}
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Get in touch
                        </h2>
                        <p className="text-gray-500 leading-relaxed">
                            Our sales team is ready to help you find the right
                            plan for your multi-location business. Expect a
                            response within one business day.
                        </p>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center shrink-0">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                    Email
                                </p>
                                <p className="text-gray-900 font-semibold">
                                    sales@meetme.app
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                    Phone
                                </p>
                                <p className="text-gray-900 font-semibold">
                                    +1 (800) 123-4567
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                    Headquarters
                                </p>
                                <p className="text-gray-900 font-semibold">
                                    San Francisco, CA
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <Card className="p-8 shadow-xl border-gray-100">
                    {submitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Message sent!
                            </h3>
                            <p className="text-gray-500">
                                We&apos;ll be in touch within one business day.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                                        Name
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Jane Smith"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                                        Company
                                    </label>
                                    <input
                                        name="company"
                                        value={form.company}
                                        onChange={handleChange}
                                        placeholder="Acme Salons"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="jane@acme.com"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    placeholder="Tell us about your business, number of locations, and what you need..."
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={submitting}
                                className="w-full py-4 text-md font-bold rounded-xl"
                            >
                                {submitting ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Page;
