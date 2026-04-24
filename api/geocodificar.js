import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { endereco } = req.query;

  if (!endereco) {
    return res.status(400).json({ erro: 'Endereço obrigatório' });
  }

  const apiKey = process.env.LOCATIONIQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ erro: 'Chave LOCATIONIQ_API_KEY não configurada' });
  }

  const url = `https://us1.locationiq.com/v1/search?key=${apiKey}&q=${encodeURIComponent(endereco)}&format=json&countrycodes=br&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        erro: data.error || data.message || 'Erro na API do LocationIQ'
      });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ erro: 'Endereço não encontrado' });
    }

    const location = data[0];

    if (!location.lat || !location.lon) {
      return res.status(500).json({ erro: 'Coordenadas inválidas retornadas pela API' });
    }

    return res.status(200).json({
      lat: Number(location.lat),
      lng: Number(location.lon)
    });
  } catch (error) {
    console.error('Erro na geocodificação:', error);
    return res.status(500).json({ erro: 'Falha interna no servidor' });
  }
}