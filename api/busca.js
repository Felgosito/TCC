import pool from '../db/pool.js';

export default async function handler(req, res) {
  const { lat, lng, raio = 5000, tipo, especialidade } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ erro: 'Latitude e longitude s\u00e3o obrigat\u00f3rios' });
  }

  try {
    let query = `
      SELECT 
        u.nome,
        u.endereco,
        u.telefone,
        u.horario,
        u.cep,
        u.endereco_gmaps,
        u.link_gmaps,
        ST_X(u.coordenadas) as lng,
        ST_Y(u.coordenadas) as lat,
        ST_Distance(u.coordenadas::GEOGRAPHY, ST_MakePoint($1, $2)::GEOGRAPHY) as distancia
      FROM unidades_saude u
    `;

    const params = [parseFloat(lng), parseFloat(lat), parseFloat(raio)];
    let conditions = [];

    if (especialidade) {
      query += ` JOIN unidade_servico us ON u.id = us.unidade_id`;
    }

    conditions.push(`ST_DWithin(u.coordenadas::GEOGRAPHY, ST_MakePoint($1, $2)::GEOGRAPHY, $3)`);

    if (tipo) {
      conditions.push(`u.tipo_id = $${params.length + 1}`);
      params.push(parseInt(tipo));
    }
    if (especialidade) {
      conditions.push(`us.servico_id = $${params.length + 1}`);
      params.push(parseInt(especialidade));
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY distancia LIMIT 20`;

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Erro na busca:', error.message);
    // Retorna o erro real para facilitar diagn\u00f3stico
    res.status(500).json({ erro: error.message });
  }
}
