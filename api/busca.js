import pool from '../db/pool.js';

export default async function handler(req, res) {
  const { lat, lng, raio = 5000, tipo, especialidade } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ erro: 'Latitude e longitude s\u00e3o obrigat\u00f3rios' });
  }

  try {
    let query = `
      SELECT 
        u.id,
        u.nome,
        u.endereco,
        u.telefone,
        u.horario,
        u.cep,
        u.endereco_gmaps,
        u.link_gmaps,
        ST_X(u.coordenadas) as lng,
        ST_Y(u.coordenadas) as lat,
        ST_Distance(u.coordenadas::GEOGRAPHY, ST_MakePoint($1, $2)::GEOGRAPHY) as distancia,
        COALESCE(
          STRING_AGG(DISTINCT s.nome, '; ' ORDER BY s.nome),
          ''
        ) as especialidades
      FROM unidades_saude u
      LEFT JOIN unidade_servico us2 ON u.id = us2.unidade_id
      LEFT JOIN servicos s ON us2.servico_id = s.id
    `;

    const params = [parseFloat(lng), parseFloat(lat), parseFloat(raio)];
    let conditions = [];

    if (especialidade) {
      query += ` JOIN unidade_servico usf ON u.id = usf.unidade_id AND usf.servico_id = $${params.length + 1}`;
      params.push(parseInt(especialidade));
    }

    conditions.push(`ST_DWithin(u.coordenadas::GEOGRAPHY, ST_MakePoint($1, $2)::GEOGRAPHY, $3)`);

    if (tipo) {
      conditions.push(`u.tipo_id = $${params.length + 1}`);
      params.push(parseInt(tipo));
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` GROUP BY u.id, u.nome, u.endereco, u.telefone, u.horario, u.cep, u.endereco_gmaps, u.link_gmaps, u.coordenadas`;
    query += ` ORDER BY distancia LIMIT 20`;

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);

  } catch (error) {
    console.error('Erro na busca:', error.message);
    res.status(500).json({ erro: error.message });
  }
}
