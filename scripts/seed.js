import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ---------- USERS ----------
const sampleUsers = [
    {
        id: uuidv4(),
        email: "owner1@test.com",
        name: "Salon Owner",
        role: "BUSINESS",
    },
    {
        id: uuidv4(),
        email: "owner2@test.com",
        name: "Gym Owner",
        role: "BUSINESS",
    },
    {
        id: uuidv4(),
        email: "owner3@test.com",
        name: "Yoga Owner",
        role: "BUSINESS",
    },
    {
        id: uuidv4(),
        email: "client1@test.com",
        name: "John Client",
        role: "CLIENT",
    },
];

// ---------- BUSINESSES ----------
const sampleBusinesses = [
    {
        owner_id: sampleUsers[0].id,
        name: "Elite Hair Studio",
        description: "Premium hair styling and coloring salon",
        category: "Beauty & Wellness",
        address: "123 Main Street, Downtown",
        logo: "https://images.unsplash.com/photo-1596464716127-f2a82ad5d27f?w=300",
        rating: 4.8,
    },
    {
        owner_id: sampleUsers[1].id,
        name: "Fit Body Gym",
        description: "State-of-the-art fitness center",
        category: "Fitness",
        address: "456 Fitness Ave, Midtown",
        logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300",
        rating: 4.6,
    },
    {
        owner_id: sampleUsers[2].id,
        name: "Zen Yoga Studio",
        description: "Relaxing yoga and meditation classes",
        category: "Wellness",
        address: "789 Peace Road, Uptown",
        logo: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=300",
        rating: 4.9,
    },
];

// ---------- EMPLOYEES ----------
const sampleEmployees = [
    {
        business_id: "",
        name: "Sarah Johnson",
        role: "Senior Stylist",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
    },
    {
        business_id: "",
        name: "Mike Chen",
        role: "Head Trainer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
    },
    {
        business_id: "",
        name: "Emma Wilson",
        role: "Yoga Instructor",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
    },
];

// ---------- SERVICES ----------
const sampleServices = [
    {
        business_id: "",
        name: "Hair Cut",
        duration: 30,
        price: "$45",
        description: "Professional haircut with styling",
    },
    {
        business_id: "",
        name: "Hair Coloring",
        duration: 90,
        price: "$120",
        description: "Full hair coloring service",
    },
    {
        business_id: "",
        name: "Personal Training Session",
        duration: 60,
        price: "$75",
        description: "1-on-1 personal training",
    },
    {
        business_id: "",
        name: "Group Fitness Class",
        duration: 45,
        price: "$25",
        description: "Group fitness class with trainer",
    },
    {
        business_id: "",
        name: "Hatha Yoga Class",
        duration: 60,
        price: "$20",
        description: "Traditional Hatha yoga practice",
    },
    {
        business_id: "",
        name: "Meditation Session",
        duration: 45,
        price: "$15",
        description: "Guided meditation session",
    },
];

// ---------- SEED ----------
async function seed() {
    try {
        console.log("🌱 Seeding...");

        await supabase.from("services").delete().neq("id", "");
        await supabase.from("employees").delete().neq("id", "");
        await supabase.from("businesses").delete().neq("id", "");
        await supabase.from("users").delete().neq("id", "");

        // USERS
        const { data: userData } = await supabase
            .from("users")
            .insert(sampleUsers)
            .select();

        // BUSINESSES
        const { data: businessData } = await supabase
            .from("businesses")
            .insert(sampleBusinesses)
            .select();

        // EMPLOYEES
        const employeesToInsert = [
            { ...sampleEmployees[0], business_id: businessData[0].id },
            { ...sampleEmployees[1], business_id: businessData[1].id },
            { ...sampleEmployees[2], business_id: businessData[2].id },
        ];

        await supabase.from("employees").insert(employeesToInsert);

        // SERVICES
        const servicesToInsert = [
            { ...sampleServices[0], business_id: businessData[0].id },
            { ...sampleServices[1], business_id: businessData[0].id },
            { ...sampleServices[2], business_id: businessData[1].id },
            { ...sampleServices[3], business_id: businessData[1].id },
            { ...sampleServices[4], business_id: businessData[2].id },
            { ...sampleServices[5], business_id: businessData[2].id },
        ];

        await supabase.from("services").insert(servicesToInsert);

        console.log("✅ Done!");
    } catch (err) {
        console.error("❌ Error:", err);
    }
}

seed();
