export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY manquante dans les variables Vercel' });

  try {
    const { messages } = req.body;
    if (!messages || !messages.length) return res.status(400).json({ error: 'Aucun message reçu' });

    const MIA_SYSTEM = `Tu es Mia, l'assistante virtuelle de ClassChat — une application de chat pour collégiens.
Réponds TOUJOURS en français, de façon claire, courte et sympa (3-5 phrases max).
Tu connais parfaitement ClassChat :
- Chat temps réel sans inscription (juste un pseudo)
- Salles avec code (ex: 406, 4eme-406)
- Messages vocaux (maintenir le bouton micro)
- Photos, GIFs, messages texte, réactions
- Messages privés (DM) avec Puissance 4
- Appels audio et vidéo de groupe
- ClassChat Studio : plateforme vidéo à /studio
- PWA : installable sur téléphone depuis Chrome/Safari
- Thèmes de couleur et mode sombre dans les réglages
- Avatars et photo de profil
Si tu ne connais pas la réponse, dis-le honnêtement et propose à l'utilisateur de contacter Lucas.
Ne parle PAS de sujets hors de ClassChat. Reste focus sur l'aide à l'application.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 400,
        messages: [
          { role: 'system', content: MIA_SYSTEM },
          ...messages
        ]
      })
    });

    const data = await response.json();
    console.log('Groq response status:', response.status);
    console.log('Groq response data:', JSON.stringify(data).slice(0, 300));

    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'Erreur Groq: '+response.status });
    const reply = data.choices?.[0]?.message?.content || 'Désolée, pas de réponse !';
    return res.status(200).json({ reply });

  } catch (e) {
    console.error('mia.js error:', e);
    return res.status(500).json({ error: e.message });
  }
}

