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
    Img,
    Preview,
    Row,
    Column,
} from "@react-email/components";

interface CapacityNotificationProps {
    businessName: string;
    clientName: string;
    upgradeUrl?: string;
}

export default function CapacityNotification({
    businessName = "Your Business",
    clientName = "A client",
    upgradeUrl = "https://meetme.app/pricing",
}: CapacityNotificationProps) {
    return (
        <Html>
            <Head />
            <Preview>
                {clientName} tried to book at {businessName} — client limit reached
            </Preview>
            <Body style={body}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Text style={logo}>meetme</Text>
                    </Section>

                    {/* Alert banner */}
                    <Section style={alertBanner}>
                        <Text style={alertText}>
                            ⚠️ Client limit reached
                        </Text>
                    </Section>

                    {/* Main content */}
                    <Section style={content}>
                        <Heading style={heading}>
                            Someone tried to book — but couldn&apos;t.
                        </Heading>

                        <Text style={paragraph}>
                            Hi there,{" "}
                            <strong>{clientName}</strong> tried to book an
                            appointment at <strong>{businessName}</strong> but
                            was unable to complete their booking.
                        </Text>

                        <Text style={paragraph}>
                            Your Free plan allows up to{" "}
                            <strong>10 unique clients</strong>. You&apos;ve
                            reached that limit, which means new clients
                            can&apos;t book with you right now.
                        </Text>

                        {/* Stats box */}
                        <Section style={statsBox}>
                            <Row>
                                <Column style={statCol}>
                                    <Text style={statNumber}>10 / 10</Text>
                                    <Text style={statLabel}>Clients used</Text>
                                </Column>
                                <Column style={statDivider} />
                                <Column style={statCol}>
                                    <Text style={statNumberRed}>0</Text>
                                    <Text style={statLabel}>Slots remaining</Text>
                                </Column>
                            </Row>
                        </Section>

                        <Text style={paragraph}>
                            Upgrade to the <strong>Growth plan</strong> to
                            accept unlimited clients and make sure you never
                            miss a booking again.
                        </Text>

                        <Button style={button} href={upgradeUrl}>
                            Upgrade to Growth →
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    {/* What they see */}
                    <Section style={content}>
                        <Text style={subheading}>
                            What {clientName} saw
                        </Text>
                        <Section style={clientMessageBox}>
                            <Text style={clientMessageText}>
                                &ldquo;{businessName} isn&apos;t accepting new clients at the moment. We&apos;ve let them know you&apos;re interested — they&apos;ll reach out to you as soon as a spot opens up.&rdquo;
                            </Text>
                        </Section>
                        <Text style={hint}>
                            Consider reaching out to {clientName} directly to
                            arrange their booking while you upgrade.
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            MeetMe · You&apos;re receiving this because you own
                            a business on MeetMe.
                        </Text>
                        <Text style={footerText}>
                            <a href={upgradeUrl} style={footerLink}>
                                Upgrade now
                            </a>{" "}
                            · Unsubscribe
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    backgroundColor: "#dc2626",
    padding: "20px 32px",
};

const logo: React.CSSProperties = {
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px",
};

const alertBanner: React.CSSProperties = {
    backgroundColor: "#fef2f2",
    padding: "12px 32px",
    borderBottom: "1px solid #fecaca",
};

const alertText: React.CSSProperties = {
    color: "#991b1b",
    fontSize: "13px",
    fontWeight: "700",
    margin: 0,
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

const statsBox: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "16px 24px",
    margin: "20px 0",
};

const statCol: React.CSSProperties = {
    textAlign: "center",
    padding: "0 16px",
};

const statDivider: React.CSSProperties = {
    width: "1px",
    backgroundColor: "#e5e7eb",
};

const statNumber: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: "800",
    color: "#111827",
    margin: "0 0 4px",
};

const statNumberRed: React.CSSProperties = {
    ...statNumber,
    color: "#dc2626",
};

const statLabel: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: 0,
};

const button: React.CSSProperties = {
    backgroundColor: "#dc2626",
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

const subheading: React.CSSProperties = {
    fontSize: "12px",
    fontWeight: "800",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    margin: "0 0 12px",
};

const clientMessageBox: React.CSSProperties = {
    backgroundColor: "#f9fafb",
    borderLeft: "3px solid #e5e7eb",
    borderRadius: "0 8px 8px 0",
    padding: "12px 16px",
    margin: "0 0 16px",
};

const clientMessageText: React.CSSProperties = {
    fontSize: "13px",
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: "1.6",
    margin: 0,
};

const hint: React.CSSProperties = {
    fontSize: "13px",
    color: "#9ca3af",
    margin: 0,
};

const footer: React.CSSProperties = {
    padding: "20px 32px 28px",
    textAlign: "center",
};

const footerText: React.CSSProperties = {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "0 0 4px",
};

const footerLink: React.CSSProperties = {
    color: "#dc2626",
    textDecoration: "none",
};
