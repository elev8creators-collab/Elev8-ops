export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = process.env.VITE_CLICKUP_TOKEN
  if (!token) return res.status(500).json({ error: 'No ClickUp token configured' })

  const { name, description, listId, priority } = req.body

  try {
    const r = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        priority: priority || 3,
        status: 'complete',
      }),
    })
    const data = await r.json()
    if (data.err) return res.status(400).json({ error: data.err })
    return res.status(200).json({ ok: true, id: data.id })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
