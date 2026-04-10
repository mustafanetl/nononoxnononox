/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

const LOGO_URL = 'https://lnaqgtimdxlcpvfmqvyn.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Jolliday login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="48" height="48" alt="Jolliday" style={logo} />
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>
          Click the button below to log in to Jolliday. This link will expire shortly.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log In to Jolliday
        </Button>
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }
const container = { padding: '40px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#171717', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#737373', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: '#171717', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#a3a3a3', margin: '32px 0 0' }
