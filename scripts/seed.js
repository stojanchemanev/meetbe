import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ---------- HELPERS ----------
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function nextWeekday(dayOffset, hour) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
}

async function createAuthUser(email, password, name, role) {
    // Delete existing auth user if present so seed is re-runnable
    const { data: existing } = await supabase.auth.admin.listUsers();
    const existingUser = existing?.users?.find((u) => u.email === email);
    if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
    });

    if (error)
        throw new Error(
            `Auth user creation failed for ${email}: ${error.message}`,
        );
    return data.user;
}

// ---------- SEED ----------
async function seed() {
    try {
        console.log("🌱 Seeding...");

        // Clear tables in FK-safe order
        await supabase.from("appointments").delete().neq("id", "");
        await supabase.from("timeslots").delete().neq("id", "");
        await supabase.from("services").delete().neq("id", "");
        await supabase.from("employees").delete().neq("id", "");
        await supabase.from("businesses").delete().neq("id", "");
        await supabase.from("users").delete().neq("id", "");

        // ---------- AUTH USERS (real Supabase auth UIDs) ----------
        console.log("   Creating auth users...");
        const authOwner1 = await createAuthUser(
            "owner1@test.com",
            "password123",
            "Salon Owner",
            "BUSINESS",
        );
        const authOwner2 = await createAuthUser(
            "owner2@test.com",
            "password123",
            "Gym Owner",
            "BUSINESS",
        );
        const authOwner3 = await createAuthUser(
            "owner3@test.com",
            "password123",
            "Yoga Owner",
            "BUSINESS",
        );
        const authClient1 = await createAuthUser(
            "client1@test.com",
            "password123",
            "John Client",
            "CLIENT",
        );
        const authClient2 = await createAuthUser(
            "client2@test.com",
            "password123",
            "Jane Client",
            "CLIENT",
        );

        // ---------- USERS (mirror auth UIDs) ----------
        const sampleUsers = [
            {
                id: authOwner1.id,
                email: "owner1@test.com",
                name: "Salon Owner",
                role: "BUSINESS",
            },
            {
                id: authOwner2.id,
                email: "owner2@test.com",
                name: "Gym Owner",
                role: "BUSINESS",
            },
            {
                id: authOwner3.id,
                email: "owner3@test.com",
                name: "Yoga Owner",
                role: "BUSINESS",
            },
            {
                id: authClient1.id,
                email: "client1@test.com",
                name: "John Client",
                role: "CLIENT",
            },
            {
                id: authClient2.id,
                email: "client2@test.com",
                name: "Jane Client",
                role: "CLIENT",
            },
        ];

        const { data: userData, error: userError } = await supabase
            .from("users")
            .insert(sampleUsers)
            .select();
        if (userError)
            throw new Error(`Users insert failed: ${userError.message}`);

        // ---------- BUSINESSES ----------
        const sampleBusinesses = [
            {
                owner_id: authOwner1.id,
                name: "Elite Hair Studio",
                description: "Premium hair styling and coloring salon",
                category: "Beauty & Wellness",
                address: "123 Main Street, Downtown",
                logo: "https://images.unsplash.com/photo-1596464716127-f2a82ad5d27f?w=300",
                rating: 4.8,
            },
            {
                owner_id: authOwner2.id,
                name: "Fit Body Gym",
                description: "State-of-the-art fitness center",
                category: "Fitness",
                address: "456 Fitness Ave, Midtown",
                logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300",
                rating: 4.6,
            },
            {
                owner_id: authOwner3.id,
                name: "Zen Yoga Studio",
                description: "Relaxing yoga and meditation classes",
                category: "Wellness",
                address: "789 Peace Road, Uptown",
                logo: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=300",
                rating: 4.9,
            },
        ];

        const { data: businessData, error: businessError } = await supabase
            .from("businesses")
            .insert(sampleBusinesses)
            .select();
        if (businessError)
            throw new Error(
                `Businesses insert failed: ${businessError.message}`,
            );

        // ---------- EMPLOYEES ----------
        const employeesToInsert = [
            {
                business_id: businessData[0].id,
                name: "Sarah Johnson",
                role: "Senior Stylist",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
            },
            {
                business_id: businessData[1].id,
                name: "Mike Chen",
                role: "Head Trainer",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
            },
            {
                business_id: businessData[2].id,
                name: "Emma Wilson",
                role: "Yoga Instructor",
                avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
            },
        ];

        const { data: employeeData, error: employeeError } = await supabase
            .from("employees")
            .insert(employeesToInsert)
            .select();
        if (employeeError)
            throw new Error(
                `Employees insert failed: ${employeeError.message}`,
            );

        // ---------- SERVICES ----------
        const servicesToInsert = [
            {
                business_id: businessData[0].id,
                name: "Hair Cut",
                duration: 30,
                price: "$45",
                description: "Professional haircut with styling",
            },
            {
                business_id: businessData[0].id,
                name: "Hair Coloring",
                duration: 90,
                price: "$120",
                description: "Full hair coloring service",
            },
            {
                business_id: businessData[1].id,
                name: "Personal Training Session",
                duration: 60,
                price: "$75",
                description: "1-on-1 personal training",
            },
            {
                business_id: businessData[1].id,
                name: "Group Fitness Class",
                duration: 45,
                price: "$25",
                description: "Group fitness class with trainer",
            },
            {
                business_id: businessData[2].id,
                name: "Hatha Yoga Class",
                duration: 60,
                price: "$20",
                description: "Traditional Hatha yoga practice",
            },
            {
                business_id: businessData[2].id,
                name: "Meditation Session",
                duration: 45,
                price: "$15",
                description: "Guided meditation session",
            },
        ];

        const { error: serviceError } = await supabase
            .from("services")
            .insert(servicesToInsert);
        if (serviceError)
            throw new Error(`Services insert failed: ${serviceError.message}`);

        // ---------- TIMESLOTS ----------
        const timeslotsToInsert = [];

        // Salon: Sarah — 30-min slots
        const salonSlotTimes = [
            { day: 1, hour: 9, booked: true, bookedBy: authClient1.id },
            { day: 1, hour: 10, booked: false, bookedBy: null },
            { day: 1, hour: 11, booked: false, bookedBy: null },
            { day: 2, hour: 9, booked: true, bookedBy: authClient2.id },
            { day: 2, hour: 10, booked: false, bookedBy: null },
            { day: 3, hour: 9, booked: false, bookedBy: null },
            { day: 3, hour: 10, booked: false, bookedBy: null },
        ];
        for (const s of salonSlotTimes) {
            const start = nextWeekday(s.day, s.hour);
            timeslotsToInsert.push({
                id: uuidv4(),
                employee_id: employeeData[0].id,
                business_id: businessData[0].id,
                start_time: start.toISOString(),
                end_time: addMinutes(start, 30).toISOString(),
                is_booked: s.booked,
                booked_by: s.bookedBy,
            });
        }

        // Gym: Mike — 60-min slots
        const gymSlotTimes = [
            { day: 1, hour: 7, booked: true, bookedBy: authClient1.id },
            { day: 1, hour: 8, booked: false, bookedBy: null },
            { day: 2, hour: 7, booked: false, bookedBy: null },
            { day: 2, hour: 8, booked: true, bookedBy: authClient2.id },
            { day: 3, hour: 7, booked: false, bookedBy: null },
            { day: 3, hour: 9, booked: false, bookedBy: null },
        ];
        for (const s of gymSlotTimes) {
            const start = nextWeekday(s.day, s.hour);
            timeslotsToInsert.push({
                id: uuidv4(),
                employee_id: employeeData[1].id,
                business_id: businessData[1].id,
                start_time: start.toISOString(),
                end_time: addMinutes(start, 60).toISOString(),
                is_booked: s.booked,
                booked_by: s.bookedBy,
            });
        }

        // Yoga: Emma — 60-min slots
        const yogaSlotTimes = [
            { day: 1, hour: 8, booked: true, bookedBy: authClient2.id },
            { day: 1, hour: 10, booked: false, bookedBy: null },
            { day: 2, hour: 8, booked: false, bookedBy: null },
            { day: 2, hour: 10, booked: true, bookedBy: authClient1.id },
            { day: 3, hour: 8, booked: false, bookedBy: null },
            { day: 4, hour: 9, booked: false, bookedBy: null },
        ];
        for (const s of yogaSlotTimes) {
            const start = nextWeekday(s.day, s.hour);
            timeslotsToInsert.push({
                id: uuidv4(),
                employee_id: employeeData[2].id,
                business_id: businessData[2].id,
                start_time: start.toISOString(),
                end_time: addMinutes(start, 60).toISOString(),
                is_booked: s.booked,
                booked_by: s.bookedBy,
            });
        }

        const { data: timeslotData, error: timeslotError } = await supabase
            .from("timeslots")
            .insert(timeslotsToInsert)
            .select();
        if (timeslotError)
            throw new Error(
                `Timeslots insert failed: ${timeslotError.message}`,
            );

        // ---------- APPOINTMENTS ----------
        const bookedSlots = timeslotData.filter((slot) => slot.is_booked);
        const appointmentsToInsert = bookedSlots.map((slot) => ({
            id: uuidv4(),
            slot_id: slot.id,
            client_id: slot.booked_by,
            business_id: slot.business_id,
            employee_id: slot.employee_id,
            status: ["PENDING", "CONFIRMED", "CONFIRMED"][
                Math.floor(Math.random() * 3)
            ],
        }));

        const { error: appointmentError } = await supabase
            .from("appointments")
            .insert(appointmentsToInsert);
        if (appointmentError)
            throw new Error(
                `Appointments insert failed: ${appointmentError.message}`,
            );

        console.log("✅ Done!");
        console.log(`   Users:        ${sampleUsers.length}`);
        console.log(`   Businesses:   ${businessData.length}`);
        console.log(`   Employees:    ${employeeData.length}`);
        console.log(`   Services:     ${servicesToInsert.length}`);
        console.log(`   Timeslots:    ${timeslotsToInsert.length}`);
        console.log(`   Appointments: ${appointmentsToInsert.length}`);
        console.log("\n🔑 Test credentials (all passwords: password123)");
        console.log("   owner1@test.com  — Salon Owner (BUSINESS)");
        console.log("   owner2@test.com  — Gym Owner   (BUSINESS)");
        console.log("   owner3@test.com  — Yoga Owner  (BUSINESS)");
        console.log("   client1@test.com — John Client (CLIENT)");
        console.log("   client2@test.com — Jane Client (CLIENT)");
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

seed();
