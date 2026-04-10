/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Jolliday'
const LOGO_URL = 'https://lnaqgtimdxlcpvfmqvyn.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface CancellationEmailProps {
  name?: string
  reason?: string
}

const CancellationEmail = ({ name, reason }: CancellationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {SITE_NAME} subscription has been canceled</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="48" height="48" alt={SITE_NAME} style={logo} />
        <Heading style={h1}>
          {name ? `${name}, we're sorry to see you go` : "We're sorry to see you go"}
        </Heading>
        <Text style={text}>
          Your {SITE_NAME} subscription has been canceled. You'll still have access to premium features until the end of your current billing period.
        </Text>
        {reason && (
          <Text style={text}>
            You told us you're leaving because: <strong>{reason}</strong>. We appreciate the feedback and will use it to improve.
          </Text>
        )}
        <Text style={text}>
          Your saved trips and data will remain in your account. You can resubscribe anytime to pick up where you left off.
        </Text>
        <Text style={footer}>
          We hope to see you again soon! — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CancellationEmail,
  subject: 'Your Jolliday subscription has been canceled',
  displayName: 'Subscription cancellation',
  previewData: { name: 'Traveler', reason: 'Not using it enough' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }
const container = { padding: '40px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#171717', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#737373', lineHeight: '1.6', margin: '0 0 20px' }
const footer = { fontSize: '13px', color: '#a3a3a3', margin: '32px 0 0' }
