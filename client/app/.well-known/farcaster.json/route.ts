export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER || '',
      payload: process.env.FARCASTER_PAYLOAD || '',
      signature: process.env.FARCASTER_SIGNATURE || '',
    },
    frame: {
      version: '1',
      name: 'Treasure Hunt',
      subtitle: 'Base Mini App',
      description: 'A multiplayer treasure hunting game on Base',
      screenshotUrls: [],
      iconUrl: `${URL}/placeholder-logo.png`,
      splashImageUrl: `${URL}/placeholder.jpg`,
      splashBackgroundColor: '#1e293b',
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: 'game',
      tags: ['game', 'treasure', 'multiplayer', 'base'],
      heroImageUrl: `${URL}/detailed-buenos-aires-city-map-with-all-streets-av.png`,
      tagline: 'Find the treasure in Buenos Aires!',
      ogTitle: 'Treasure Hunt - Base Mini App',
      ogDescription: 'A multiplayer treasure hunting game on Base',
      ogImageUrl: `${URL}/simplified-buenos-aires-map-with-key-landmarks-on.png`,
      noindex: false,
    },
  })
}
