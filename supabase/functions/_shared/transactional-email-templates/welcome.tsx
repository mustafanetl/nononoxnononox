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
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Jolliday'
const LOGO_URL = 'https://lnaqgtimdxlcpvfmqvyn.supabase.co/storage/v1/object/public/email-assets/logo.png'

interface WelcomeEmailProps {
  name?: string
}

const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — let's plan your next adventure! ✈️</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} width="48" height="48" alt={SITE_NAME} style={logo} />
        <Heading style={h1}>
          {name ? `Hey ${name}, welcome! 🎉` : 'Welcome to Jolliday! 🎉'}
        </Heading>
        <Text style={text}>
          You're all set! Jolliday is your AI-powered travel companion that creates personalized trip plans in seconds.
        </Text>
        <Section style={featureBox}>
          <Text style={featureTitle}>Here's what you can do:</Text>
          <Text style={featureItem}>✈️ Plan trips with AI in natural conversation</Text>
          <Text style={featureItem}>🏨 Get real hotel & flight recommendations</Text>
          <Text style={featureItem}>🗺️ View your itinerary on an interactive map</Text>
          <Text style={featureItem}>📋 Export and share your trip plans</Text>
        </Section>
        <Button style={button} href="https://nononoxnononox.lovable.app/chat">
          Start Planning a Trip
        </Button>
        <Text style={footer}>
          Happy travels! — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to Jolliday — your AI travel companion ✈️',
  displayName: 'Welcome email',
  previewData: { name: 'Traveler' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }
const container = { padding: '40px 25px' }
const logo = { margin: '0 0 24px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#171717', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#737373', lineHeight: '1.6', margin: '0 0 20px' }
const featureBox = { backgroundColor: '#f5f5f5', borderRadius: '12px', padding: '20px', margin: '0 0 24px' }
const featureTitle = { fontSize: '14px', fontWeight: '600' as const, color: '#171717', margin: '0 0 12px' }
const featureItem = { fontSize: '14px', color: '#525252', lineHeight: '1.8', margin: '0' }
const button = { backgroundColor: '#171717', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 24px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#a3a3a3', margin: '32px 0 0' }
