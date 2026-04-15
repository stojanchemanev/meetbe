import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

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

async function clearTables() {
    const tables = [
        "appointments",
        "timeslots",
        "services",
        "employees",
        "businesses",
        "users",
    ];
    for (const table of tables) {
        const { error } = await supabase
            .from(table)
            .delete()
            .not("id", "is", null);
        if (error)
            throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
}

// Fetch existing auth users once, delete matches, then create fresh
async function createAuthUsers(usersToCreate) {
    const { data: existing, error } = await supabase.auth.admin.listUsers();
    if (error) throw new Error(`Failed to list auth users: ${error.message}`);

    const existingByEmail = new Map(existing.users.map((u) => [u.email, u.id]));

    const created = {};
    for (const { email, password, name, role } of usersToCreate) {
        if (existingByEmail.has(email)) {
            await supabase.auth.admin.deleteUser(existingByEmail.get(email));
        }
        const { data, error: createError } =
            await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { name, role },
            });
        if (createError)
            throw new Error(
                `Auth user creation failed for ${email}: ${createError.message}`,
            );
        created[email] = data.user;
    }
    return created;
}

// ---------- SEED ----------
async function seed() {
    try {
        console.log("🌱 Seeding...");

        await clearTables();

        // ---------- AUTH USERS ----------
        console.log("   Creating auth users...");
        const authUsers = await createAuthUsers([
            {
                email: "owner1@test.com",
                password: "P@ssw0rd",
                name: "Salon Owner",
                role: "BUSINESS",
            },
            {
                email: "owner2@test.com",
                password: "P@ssw0rd",
                name: "Gym Owner",
                role: "BUSINESS",
            },
            {
                email: "owner3@test.com",
                password: "P@ssw0rd",
                name: "Yoga Owner",
                role: "BUSINESS",
            },
            {
                email: "client1@test.com",
                password: "P@ssw0rd",
                name: "John Client",
                role: "CLIENT",
            },
            {
                email: "client2@test.com",
                password: "password123",
                name: "Jane Client",
                role: "CLIENT",
            },
        ]);

        const [owner1, owner2, owner3, client1, client2] = [
            authUsers["owner1@test.com"],
            authUsers["owner2@test.com"],
            authUsers["owner3@test.com"],
            authUsers["client1@test.com"],
            authUsers["client2@test.com"],
        ];

        // ---------- USERS (mirror auth UIDs) ----------
        const { error: userError } = await supabase.from("users").insert([
            {
                id: owner1.id,
                email: "owner1@test.com",
                name: "Salon Owner",
                role: "BUSINESS",
            },
            {
                id: owner2.id,
                email: "owner2@test.com",
                name: "Gym Owner",
                role: "BUSINESS",
            },
            {
                id: owner3.id,
                email: "owner3@test.com",
                name: "Yoga Owner",
                role: "BUSINESS",
            },
            {
                id: client1.id,
                email: "client1@test.com",
                name: "John Client",
                role: "CLIENT",
            },
            {
                id: client2.id,
                email: "client2@test.com",
                name: "Jane Client",
                role: "CLIENT",
            },
        ]);
        if (userError)
            throw new Error(`Users insert failed: ${userError.message}`);

        // ---------- BUSINESSES ----------
        const { data: businesses, error: businessError } = await supabase
            .from("businesses")
            .insert([
                {
                    owner_id: owner1.id,
                    name: "Elite Hair Studio",
                    description: "Premium hair styling and coloring salon",
                    category: "Beauty & Wellness",
                    address: "123 Main Street, Downtown",
                    logo: "https://images.unsplash.com/photo-1596464716127-f2a82ad5d27f?w=300",
                    rating: 4.8,
                },
                {
                    owner_id: owner2.id,
                    name: "Fit Body Gym",
                    description: "State-of-the-art fitness center",
                    category: "Fitness",
                    address: "456 Fitness Ave, Midtown",
                    logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300",
                    rating: 4.6,
                },
                {
                    owner_id: owner3.id,
                    name: "Zen Yoga Studio",
                    description: "Relaxing yoga and meditation classes",
                    category: "Wellness",
                    address: "789 Peace Road, Uptown",
                    logo: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=300",
                    rating: 4.9,
                },
            ])
            .select();
        if (businessError)
            throw new Error(
                `Businesses insert failed: ${businessError.message}`,
            );

        const [salon, gym, yoga] = businesses;

        // ---------- EMPLOYEES ----------
        const { data: employees, error: employeeError } = await supabase
            .from("employees")
            .insert([
                {
                    business_id: salon.id,
                    name: "Sarah Johnson",
                    role: "Senior Stylist",
                    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
                },
                {
                    business_id: gym.id,
                    name: "Mike Chen",
                    role: "Head Trainer",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
                },
                {
                    business_id: yoga.id,
                    name: "Emma Wilson",
                    role: "Yoga Instructor",
                    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300",
                },
            ])
            .select();
        if (employeeError)
            throw new Error(
                `Employees insert failed: ${employeeError.message}`,
            );

        const [sarah, mike, emma] = employees;

        // ---------- SERVICES ----------
        const { error: serviceError } = await supabase.from("services").insert([
            {
                business_id: salon.id,
                name: "Hair Cut",
                duration: 30,
                price: "$45",
                description: "Professional haircut with styling",
            },
            {
                business_id: salon.id,
                name: "Hair Coloring",
                duration: 90,
                price: "$120",
                description: "Full hair coloring service",
            },
            {
                business_id: gym.id,
                name: "Personal Training",
                duration: 60,
                price: "$75",
                description: "1-on-1 personal training",
            },
            {
                business_id: gym.id,
                name: "Group Fitness Class",
                duration: 45,
                price: "$25",
                description: "Group fitness class with trainer",
            },
            {
                business_id: yoga.id,
                name: "Hatha Yoga Class",
                duration: 60,
                price: "$20",
                description: "Traditional Hatha yoga practice",
            },
            {
                business_id: yoga.id,
                name: "Meditation Session",
                duration: 45,
                price: "$15",
                description: "Guided meditation session",
            },
        ]);
        if (serviceError)
            throw new Error(`Services insert failed: ${serviceError.message}`);

        // ---------- TIMESLOTS ----------
        const timeslots = [
            // Salon — Sarah — 30-min slots
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 1,
                hour: 9,
                duration: 30,
                booked: true,
                bookedBy: client1.id,
            },
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 1,
                hour: 10,
                duration: 30,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 1,
                hour: 11,
                duration: 30,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 2,
                hour: 9,
                duration: 30,
                booked: true,
                bookedBy: client2.id,
            },
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 2,
                hour: 10,
                duration: 30,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 3,
                hour: 9,
                duration: 30,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: sarah.id,
                business_id: salon.id,
                day: 3,
                hour: 10,
                duration: 30,
                booked: false,
                bookedBy: null,
            },
            // Gym — Mike — 60-min slots
            {
                employee_id: mike.id,
                business_id: gym.id,
                day: 1,
                hour: 7,
                duration: 60,
                booked: true,
                bookedBy: client1.id,
            },
            {
                employee_id: mike.id,
                business_id: gym.id,
                day: 1,
                hour: 8,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: mike.id,
                business_id: gym.id,
                day: 2,
                hour: 7,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: mike.id,
                business_id: gym.id,
                day: 2,
                hour: 8,
                duration: 60,
                booked: true,
                bookedBy: client2.id,
            },
            {
                employee_id: mike.id,
                business_id: gym.id,
                day: 3,
                hour: 7,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: mike.id,
                business_id: gym.id,
                day: 3,
                hour: 9,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            // Yoga — Emma — 60-min slots
            {
                employee_id: emma.id,
                business_id: yoga.id,
                day: 1,
                hour: 8,
                duration: 60,
                booked: true,
                bookedBy: client2.id,
            },
            {
                employee_id: emma.id,
                business_id: yoga.id,
                day: 1,
                hour: 10,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: emma.id,
                business_id: yoga.id,
                day: 2,
                hour: 8,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: emma.id,
                business_id: yoga.id,
                day: 2,
                hour: 10,
                duration: 60,
                booked: true,
                bookedBy: client1.id,
            },
            {
                employee_id: emma.id,
                business_id: yoga.id,
                day: 3,
                hour: 8,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
            {
                employee_id: emma.id,
                business_id: yoga.id,
                day: 4,
                hour: 9,
                duration: 60,
                booked: false,
                bookedBy: null,
            },
        ].map(({ day, hour, duration, booked, bookedBy, ...rest }) => {
            const start = nextWeekday(day, hour);
            return {
                ...rest,
                start_time: start.toISOString(),
                end_time: addMinutes(start, duration).toISOString(),
                is_booked: booked,
                booked_by: bookedBy,
            };
        });

        const { data: timeslotData, error: timeslotError } = await supabase
            .from("timeslots")
            .insert(timeslots)
            .select();
        if (timeslotError)
            throw new Error(
                `Timeslots insert failed: ${timeslotError.message}`,
            );

        // ---------- APPOINTMENTS ----------
        const statuses = [
            "PENDING",
            "CONFIRMED",
            "CONFIRMED",
            "PENDING",
            "CONFIRMED",
            "CONFIRMED",
        ];
        const appointments = timeslotData
            .filter((slot) => slot.is_booked)
            .map((slot, i) => ({
                slot_id: slot.id,
                client_id: slot.booked_by,
                business_id: slot.business_id,
                employee_id: slot.employee_id,
                status: statuses[i % statuses.length],
            }));

        const { error: appointmentError } = await supabase
            .from("appointments")
            .insert(appointments);
        if (appointmentError)
            throw new Error(
                `Appointments insert failed: ${appointmentError.message}`,
            );

        console.log("✅ Done!");
        console.log(`   Users:        5`);
        console.log(`   Businesses:   ${businesses.length}`);
        console.log(`   Employees:    ${employees.length}`);
        console.log(`   Services:     6`);
        console.log(`   Timeslots:    ${timeslots.length}`);
        console.log(`   Appointments: ${appointments.length}`);
        console.log("\n🔑 Test credentials (all passwords: password123)");
        console.log("   owner1@test.com  — Salon Owner (BUSINESS)");
        console.log("   owner2@test.com  — Gym Owner   (BUSINESS)");
        console.log("   owner3@test.com  — Yoga Owner  (BUSINESS)");
        console.log("   client1@test.com — John Client (CLIENT)");
        console.log("   client2@test.com — Jane Client (CLIENT)");
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

seed();
