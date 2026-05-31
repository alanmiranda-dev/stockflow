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

app.post('/produtos', async (req, res) => {
  try {

    const { nome, quantidade, preco } = req.body;

    const resultado = await pool.query(
      `
      INSERT INTO produtos (nome, quantidade, preco)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [nome, quantidade, preco]
    );

    res.status(201).json(resultado.rows[0]);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao cadastrar produto'
    });

  }
});

app.put('/produtos/:id', async (req, res) => {
  try {

    const { id } = req.params;
    const { nome, quantidade, preco } = req.body;

    const resultado = await pool.query(
      `
      UPDATE produtos
      SET nome = $1,
          quantidade = $2,
          preco = $3
      WHERE id = $4
      RETURNING *
      `,
      [nome, quantidade, preco, id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado'
      });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao atualizar produto'
    });

  }
});

app.delete('/produtos/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const resultado = await pool.query(
      `
      DELETE FROM produtos
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        erro: 'Produto não encontrado'
      });
    }

    res.json({
      mensagem: 'Produto removido com sucesso'
    });

  } catch (erro) {

    console.error(erro);

    res.status(500).json({
      erro: 'Erro ao remover produto'
    });

  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT}`);
});