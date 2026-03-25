import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  token: string;
  baseUrl?: string;
}

export function VerificationEmail({
  token,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.legalconnect.fr",
}: VerificationEmailProps) {
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  return (
    <Html>
      <Head />
      <Preview>Confirmez votre adresse email - LegalConnect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Bienvenue sur LegalConnect</Heading>
          <Text style={text}>
            Bonjour,
          </Text>
          <Text style={text}>
            Nous sommes ravis de vous accueillir sur LegalConnect. Pour
            finaliser la creation de votre compte et acceder a votre espace
            securise, veuillez confirmer votre adresse email en cliquant sur le
            bouton ci-dessous.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Confirmer mon email
            </Button>
          </Section>
          <Text style={text}>
            Ce lien est valable pendant 24 heures. Si vous n'avez pas cree de
            compte sur LegalConnect, vous pouvez ignorer cet email en toute
            securite.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            LegalConnect — Votre espace juridique securise
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "600" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  color: "#4a4a68",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1a1a2e",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
