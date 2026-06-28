export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const token = process.env.VITE_CLICKUP_TOKEN
  if (!token) return res.status(500).json({ error: 'No ClickUp token' })
  const { name, description, listId, priority } = req.body
  try {
    const r = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, priority, status: 'complete' }),
    })
    const data = await r.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
