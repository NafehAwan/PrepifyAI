---
name: awesome-design
description: Library of 84 ready-made DESIGN.md files describing real brands' design systems (colours, type, spacing, components) — e.g. Stripe, Apple, Linear, Notion, Vercel, Spotify, Airbnb, Claude, Supabase. Use when the user wants a site or app to look like a named brand, asks for a DESIGN.md, or wants design-system inspiration to pick from.
---

# Awesome Design (DESIGN.md library)

From [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) (MIT, see LICENSE).
Each brand has `designs/<brand>/DESIGN.md` (the design system) and a `README.md`.

Brands: 1win airbnb airtable aljazeera apple binance bmw bmw-m bugatti cal claude clay clickhouse cohere coinbase composio cursor dell-1996 dji elevenlabs expo ferrari figma framer hashicorp hp ibm intercom jobright kraken lamborghini linear.app lovable mastercard mercury meta minimax mintlify miro mistral.ai mongodb mydealz nerdwallet nike nintendo-2001 notion nvidia ollama opencode.ai oracle oura pinterest playstation posthog raycast renault replicate resend revolut runwayml sanity sap sentry shopify slack spacex spotify starbucks stripe supabase superhuman tesla theverge together.ai uber vercel vodafone voltagent warp webflow wired wise x.ai zapier

## How to use

1. If the user named a brand, open `designs/<brand>/DESIGN.md`. If they described a mood
   instead ("calm", "fintech", "playful"), skim the READMEs of a few candidates and suggest
   two or three with a one-line reason each — let the user choose.
2. To adopt one for a project, copy its DESIGN.md to the project root (or wherever the
   project keeps its design spec). Don't overwrite an existing DESIGN.md without asking.
3. Treat the file's tokens (hex colours, font families, sizes, radii, shadows) as exact
   values, and its prose as guidance. Apply it through the project's existing theme/token
   files rather than hard-coding values in many places.
4. These describe real companies' brands: use them as inspiration for layout, rhythm and
   type, but don't copy another company's logo, name or trademarked assets into a product.
