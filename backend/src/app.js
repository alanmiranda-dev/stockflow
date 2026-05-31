require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT NOW()');

    res.json({
      projeto: 'StockFlow',
      status: 'online',
      banco: 'conectado',
      horario_banco: resultado.rows[0].now
    });

  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      projeto: 'StockFlow',
      status: 'erro',
      banco: 'desconectado'
    });
  }
});

app.get('/produtos', async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT * FROM produtos ORDER BY id'
    );

    res.json(resultado.rows);

  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao buscar produtos'
    });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});