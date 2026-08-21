import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  url?: string
  message?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const { planId } = req.body || {}

  // Check for Clerk server key — if not present, return helpful message.
  const CLERK_SECRET = process.env.CLERK_API_KEY || process.env.CLERK_SECRET_KEY || process.env.CLERK_JWT
  if (!CLERK_SECRET) {
    return res.status(501).json({
      message:
        'Clerk server-side billing is not configured. Set your Clerk secret key in the environment and implement a server-side call to create a billing/checkout session. Received planId: ' +
        (planId || 'none'),
    })
  }

  // Placeholder: when Clerk billing is configured, call Clerk server API here to create a billing/checkout session
  // and return { url } to redirect the user to the Clerk-hosted checkout/billing portal.

  // For safety we do not call external APIs without explicit configuration here.
  return res.status(200).json({ message: 'Billing configured but server-side implementation not yet added.' })
}
