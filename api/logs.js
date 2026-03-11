import pool from '../db/pool.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { endereco, bairro, especialidade, tipo, distancia, totalResultados } = req.body;

  try {
    await pool.query(
      `INSERT INTO busca_logs 
       (endereco, bairro, especialidade, tipo_estabelecimento, distancia_maxima, resultados_encontrados)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [endereco, bairro, especialidade, tipo, distancia, totalResultados]
    );
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Falha ao salvar log' });
  }
}
