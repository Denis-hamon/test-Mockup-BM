import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  name?: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Bienvenue sur LegalConnect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Bienvenue sur LegalConnect</Heading>
          <Text style={text}>
            {name ? `Bonjour ${name},` : "Bonjour,"}
          </Text>
          <Text style={text}>
            Nous sommes ravis de vous accueillir sur LegalConnect, votre espace
            juridique securise. Notre plateforme a ete concue pour simplifier et
            securiser la relation entre avocats et clients.
          </Text>
          <Text style={text}>
            Vos donnees sont protegees par un chiffrement de bout en bout,
            garantissant que seuls vous et votre avocat pouvez acceder aux
            informations echangees.
          </Text>
          <Text style={text}>
            N'hesitez pas a explorer votre espace et a decouvrir toutes les
            fonctionnalites mises a votre disposition.
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

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
