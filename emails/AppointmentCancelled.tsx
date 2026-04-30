import * as React from "react";
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Heading,
    Text,
    Button,
    Hr,
    Preview,
} from "@react-email/components";

interface AppointmentCancelledProps {
    clientName: string;
    businessName: string;
    serviceName: string;
    slotDate: string;
    slotTime: string;
    cancellationReason?: string;
    dashboardUrl?: string;
}

export default function AppointmentCancelled({
    clientName = "there",
    businessName = "the business",
    serviceName = "a service",
    slotDate = "",
    slotTime = "",
    cancellationReason,
    dashboardUrl = "https://meetme.app/dashboard/appointments",
}: AppointmentCancelledProps) {
    return (
        <Html>
            <Head />
            <Preview>
                Your appointment at {businessName} has been cancelled
            </Preview>
            <Body style={body}>
                <Container style={container}>
                    <Section style={header}>
                        <Text style={logo}>meetme</Text>
                    </Section>

                    <Section style={content}>
                        <Heading style={heading}>
                            Appointment Cancelled
                        </Heading>

                        <Text style={paragraph}>
                            Hi <strong>{clientName}</strong>, unfortunately
                            your appointment at{" "}
                            <strong>{businessName}</strong> has been cancelled.
                        </Text>

                        <Section style={detailsBox}>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Service</span>
                                <span style={detailValue}>{serviceName}</span>
                            </Text>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Date</span>
                                <span style={detailValue}>{slotDate}</span>
                            </Text>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Time</span>
                                <span style={detailValue}>{slotTime}</span>
                            </Text>
                        </Section>

                        {cancellationReason && (
                            <Section style={reasonBox}>
                                <Text style={reasonLabel}>Reason</Text>
                                <Text style={reasonText}>
                                    {cancellationReason}
                                </Text>
                            </Section>
                        )}

                        <Text style={paragraph}>
                            You&apos;re welcome to book a new appointment at a
                            different time.
                        </Text>

                        <Button style={button} href={dashboardUrl}>
                            Book Again →
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            MeetMe · You&apos;re receiving this because you
                            booked an appointment on MeetMe.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

const body: React.CSSProperties = {
    backgroundColor: "#f4f4f5",
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: 0,
    padding: 0,
};

const container: React.CSSProperties = {
    maxWidth: "560px",
    margin: "40px auto",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
};

const header: React.CSSProperties = {
    backgroundColor: "#6b7280",
    padding: "20px 32px",
};

const logo: React.CSSProperties = {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px",
};

const content: React.CSSProperties = {
    padding: "28px 32px",
};

const heading: React.CSSProperties = {
    fontSize: "22px",
    fontWeight: "800",
    color: "#111827",
    margin: "0 0 16px",
    lineHeight: "1.3",
};

const paragraph: React.CSSProperties = {
    fontSize: "15px",
    color: "#4b5563",
    lineHeight: "1.6",
    margin: "0 0 16px",
};

const detailsBox: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "16px 20px",
    margin: "20px 0",
};

const detailRow: React.CSSProperties = {
    fontSize: "14px",
    color: "#374151",
    margin: "0 0 8px",
    display: "flex",
};

const detailLabel: React.CSSProperties = {
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    fontSize: "11px",
    letterSpacing: "0.05em",
    minWidth: "70px",
    display: "inline-block",
};

const detailValue: React.CSSProperties = {
    fontWeight: "600",
    color: "#111827",
};

const reasonBox: React.CSSProperties = {
    backgroundColor: "#fafafa",
    borderLeft: "3px solid #d1d5db",
    borderRadius: "0 8px 8px 0",
    padding: "12px 16px",
    margin: "0 0 20px",
};

const reasonLabel: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: "0 0 4px",
};

const reasonText: React.CSSProperties = {
    fontSize: "14px",
    color: "#374151",
    lineHeight: "1.5",
    margin: 0,
};

const button: React.CSSProperties = {
    backgroundColor: "#374151",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    padding: "12px 28px",
    borderRadius: "10px",
    textDecoration: "none",
    display: "inline-block",
    margin: "8px 0 0",
};

const hr: React.CSSProperties = {
    border: "none",
    borderTop: "1px solid #f3f4f6",
    margin: "0",
};

const footer: React.CSSProperties = {
    padding: "20px 32px 28px",
    textAlign: "center",
};

const footerText: React.CSSProperties = {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "0",
};
