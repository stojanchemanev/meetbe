import { Business, Employee } from "./types";

export const MOCK_BUSINESSES: Business[] = [
    {
        id: "b1",
        ownerId: "u2",
        name: "The Sharp Blade Barbers",
        description:
            "Premium grooming for the modern gentleman. We specialize in classic cuts and hot towel shaves.",
        category: "Barber",
        address: "123 Style Ave, New York, NY",
        logo: "https://picsum.photos/seed/barber/200/200",
        rating: 4.8,
    },
    {
        id: "b2",
        ownerId: "u3",
        name: "Glow Up Spa",
        description:
            "Rejuvenate your skin and soul with our luxury facials and massage therapy.",
        category: "Spa & Wellness",
        address: "456 Serenity Dr, Los Angeles, CA",
        logo: "https://picsum.photos/seed/spa/200/200",
        rating: 4.9,
    },
    {
        id: "b3",
        ownerId: "u4",
        name: "Iron Forge Fitness",
        description:
            "Personal training and group sessions focused on strength and longevity.",
        category: "Fitness",
        address: "789 Muscle Rd, Chicago, IL",
        logo: "https://picsum.photos/seed/gym/200/200",
        rating: 4.7,
    },
];

export const MOCK_EMPLOYEES: Employee[] = [
    {
        id: "e1",
        businessId: "b1",
        name: "James Wilson",
        role: "Master Barber",
        avatar: "https://i.pravatar.cc/150?u=e1",
    },
    {
        id: "e2",
        businessId: "b1",
        name: "Sarah Miller",
        role: "Stylist",
        avatar: "https://i.pravatar.cc/150?u=e2",
    },
    {
        id: "e3",
        businessId: "b2",
        name: "Elena Rodriguez",
        role: "Esthetician",
        avatar: "https://i.pravatar.cc/150?u=e3",
    },
    {
        id: "e4",
        businessId: "b3",
        name: "Marcus Kane",
        role: "Head Coach",
        avatar: "https://i.pravatar.cc/150?u=e4",
    },
];

export const MOCK_SERVICES: Service[] = [
    // Barber Services
    {
        id: "s1",
        businessId: "b1",
        name: "Classic Haircut",
        duration: 45,
        price: "$45",
        description: "Consultation, cut, and style.",
    },
    {
        id: "s2",
        businessId: "b1",
        name: "Hot Towel Shave",
        duration: 30,
        price: "$35",
        description: "Traditional straight razor shave.",
    },
    {
        id: "s3",
        businessId: "b1",
        name: "Beard Trim",
        duration: 20,
        price: "$25",
        description: "Shape and trim your beard.",
    },

    // Spa Services
    {
        id: "s4",
        businessId: "b2",
        name: "Deep Tissue Massage",
        duration: 60,
        price: "$120",
        description: "Intensive therapy for muscle tension.",
    },
    {
        id: "s5",
        businessId: "b2",
        name: "Hydrating Facial",
        duration: 50,
        price: "$95",
        description: "Restore moisture and glow.",
    },

    // Fitness Services
    {
        id: "s6",
        businessId: "b3",
        name: "Personal Training",
        duration: 60,
        price: "$80",
        description: "1-on-1 coaching session.",
    },
    {
        id: "s7",
        businessId: "b3",
        name: "Consultation",
        duration: 30,
        price: "Free",
        description: "Fitness assessment and goal setting.",
    },
];

export const CATEGORIES = [
    "All",
    "Barber",
    "Spa & Wellness",
    "Fitness",
    "Medical",
    "Beauty",
];
