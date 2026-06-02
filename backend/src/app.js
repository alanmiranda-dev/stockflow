require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

async function registrarLog(tipo, descricao) {

    try {

        await pool.query(
            `
            INSERT INTO logs
            (
                tipo,
                descricao
            )
            VALUES
            (
                $1,
                $2
            )
            `,
            [
                tipo,
                descricao
            ]
        );

    } catch (erro) {

        console.error(
            'Erro ao registrar log:',
            erro
        );

    }

}

/* ==========================
   STATUS API
========================== */

app.get('/', async (req, res) => {

    try {

        const resultado =
            await pool.query('SELECT NOW()');

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

/* ==========================
   LISTAR PRODUTOS
========================== */

app.get('/produtos', async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT *
            FROM produtos
            ORDER BY id
            `
        );

        res.json(resultado.rows);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao buscar produtos'
        });

    }

});

/* ==========================
   CADASTRAR PRODUTO
========================== */

app.post('/produtos', async (req, res) => {

    try {

        const {
            nome,
            categoria,
            quantidade,
            preco,
            estoque_minimo
        } = req.body;

        const resultado = await pool.query(
            `
            INSERT INTO produtos
            (
                nome,
                categoria,
                quantidade,
                preco,
                estoque_minimo
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING *
            `,
            [
                nome,
                categoria,
                quantidade,
                preco,
                estoque_minimo
            ]
        );

        await registrarLog(
    'CADASTRO',
    `Produto "${nome}" cadastrado com ${quantidade} unidades`
);

        res.status(201).json(
            resultado.rows[0]
        );

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar produto'
        });

    }

});

/* ==========================
   ATUALIZAR PRODUTO
========================== */

app.put('/produtos/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            categoria,
            quantidade,
            preco,
            estoque_minimo
        } = req.body;

        const resultado = await pool.query(
            `
            UPDATE produtos
            SET
                nome = $1,
                categoria = $2,
                quantidade = $3,
                preco = $4,
                estoque_minimo = $5
            WHERE id = $6
            RETURNING *
            `,
            [
                nome,
                categoria,
                quantidade,
                preco,
                estoque_minimo,
                id
            ]
        );

        if (
            resultado.rows.length === 0
        ) {

            return res.status(404).json({
                erro: 'Produto não encontrado'
            });

        }

        await registrarLog(
    'EDIÇÃO',
    `Produto "${nome}" atualizado`
);

        res.json(resultado.rows[0]);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao atualizar produto'
        });

    }

});

/* ==========================
   EXCLUIR PRODUTO
========================== */

app.delete('/produtos/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const produto = await pool.query(
            `
            SELECT *
            FROM produtos
            WHERE id = $1
            `,
            [id]
        );

        if (produto.rows.length === 0) {

            return res.status(404).json({
                erro: 'Produto não encontrado'
            });

        }

        const nomeProduto = produto.rows[0].nome;

        await pool.query(
            `
            DELETE FROM produtos
            WHERE id = $1
            `,
            [id]
        );

        await registrarLog(
            'EXCLUSÃO',
            `Produto "${nomeProduto}" removido`
        );

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
/* ==========================
   LISTAR LOGS
========================== */

app.get('/logs', async (req, res) => {

    try {

        const resultado = await pool.query(
            `
            SELECT *
            FROM logs
            ORDER BY data_evento DESC
            `
        );

        res.json(
            resultado.rows
        );

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao buscar logs'
        });

    }

});
/* ==========================
   INICIAR SERVIDOR
========================== */

/* ==========================
   LIMPAR LOGS
========================== */

app.delete('/logs', async (req, res) => {

    try {

        await pool.query(
            `
            DELETE FROM logs
            `
        );

        res.json({
            mensagem: 'Histórico removido com sucesso'
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao limpar logs'
        });

    }

});

app.listen(process.env.PORT, () => {

    console.log(
        `Servidor rodando na porta ${process.env.PORT}`
    );

});