import { Employee, Service, Business, TimeSlot } from "@/src/types";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import BusinessComponent from "@/src/components/Businesses/Business";
import { redirect } from "next/navigation";

export interface BusinessPayload {
    id: string;
    name: string;
    description: string;
    category: string;
    address: string;
    logo: string;
    rating: number;
    employees: (Employee & { timeslots: TimeSlot[] })[];
    services: Service[];
}

type Props = {
    params: Promise<{ id: string }>;
};

const Page = async ({ params }: Props) => {
    const { id } = await params;
    const cookieStore = await cookies();

    const supabase = createClient(cookieStore);
    const response: { data: BusinessPayload | null; error: unknown } =
        await supabase
            .from("businesses")
            .select(
                `*,
            employees:employees(
                *,
                timeslots:timeslots(*)
            ),
            services:services(*)`,
            )
            .eq("id", id)
            .single();

    if (response.error || !response.data) {
        redirect("/not-found");
    }

    return <BusinessComponent {...(response.data as BusinessPayload)} />;
};

export default Page;
