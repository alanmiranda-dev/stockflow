const API_URL = 'http://localhost:3000/produtos';

let produtosGlobais = [];

/* ==========================
   CARREGAR PRODUTOS
========================== */

async function carregarProdutos() {

    try {

        const resposta = await fetch(API_URL);

        produtosGlobais = await resposta.json();

        renderizarTabela(produtosGlobais);

        atualizarDashboard(produtosGlobais);

    } catch (erro) {

        console.error(erro);

        alert('Erro ao carregar produtos.');

    }

}

/* ==========================
   RENDERIZAR TABELA
========================== */

function renderizarTabela(produtos) {

    const tabela =
        document.getElementById('tabelaProdutos');

    tabela.innerHTML = '';

    produtos.forEach(produto => {

        const quantidade =
            Number(produto.quantidade);

        const estoqueMinimo =
            Number(produto.estoque_minimo);

        let statusClasse = '';
        let statusTexto = '';

        if (quantidade <= estoqueMinimo) {

            statusClasse = 'status-critico';
            statusTexto = 'CRÍTICO';

        } else if (
            quantidade <= (estoqueMinimo * 2)
        ) {

            statusClasse = 'status-baixo';
            statusTexto = 'BAIXO';

        } else {

            statusClasse = 'status-normal';
            statusTexto = 'NORMAL';

        }

        tabela.innerHTML += `
            <tr>

                <td>${produto.id}</td>

                <td>${produto.nome}</td>

                <td>${produto.categoria || '-'}</td>

                <td>${produto.quantidade}</td>

                <td>
                    R$ ${Number(produto.preco).toFixed(2)}
                </td>

                <td>
                    ${produto.estoque_minimo}
                </td>

                <td>
                    <span class="${statusClasse}">
                        ${statusTexto}
                    </span>
                </td>

                <td>

                    <button
                        onclick="editarProduto(${produto.id})"
                    >
                        Editar
                    </button>

                    <button
                        onclick="excluirProduto(${produto.id})"
                    >
                        Excluir
                    </button>

                </td>

            </tr>
        `;

    });

}

/* ==========================
   DASHBOARD
========================== */

function atualizarDashboard(produtos) {

    const totalProdutos =
        produtos.length;

    const totalEstoque =
        produtos.reduce(
            (soma, p) =>
                soma + Number(p.quantidade),
            0
        );

    const valorEstoque =
        produtos.reduce(
            (soma, p) =>
                soma +
                (
                    Number(p.quantidade) *
                    Number(p.preco)
                ),
            0
        );

    const produtosCriticos =
        produtos.filter(p =>
            Number(p.quantidade)
            <=
            Number(p.estoque_minimo)
        ).length;

    document.getElementById(
        'totalProdutos'
    ).textContent =
        totalProdutos;

    document.getElementById(
        'totalEstoque'
    ).textContent =
        totalEstoque;

    document.getElementById(
        'valorEstoque'
    ).textContent =
        `R$ ${valorEstoque.toFixed(2)}`;

    document.getElementById(
        'produtosCriticos'
    ).textContent =
        produtosCriticos;

}

/* ==========================
   CADASTRAR PRODUTO
========================== */

document
    .getElementById('produtoForm')
    .addEventListener(
        'submit',
        async (e) => {

            e.preventDefault();

            const produto = {

                nome:
                    document.getElementById(
                        'nome'
                    ).value,

                categoria:
                    document.getElementById(
                        'categoria'
                    ).value,

                quantidade:
                    Number(
                        document.getElementById(
                            'quantidade'
                        ).value
                    ),

                preco:
                    Number(
                        document.getElementById(
                            'preco'
                        ).value
                    ),

                estoque_minimo:
                    Number(
                        document.getElementById(
                            'estoqueMinimo'
                        ).value
                    )

            };

            try {

                await fetch(
                    API_URL,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify(produto)
                    }
                );

                e.target.reset();

                carregarProdutos();

            } catch (erro) {

                console.error(erro);

                alert(
                    'Erro ao cadastrar produto.'
                );

            }

        }
    );

/* ==========================
   EXCLUIR
========================== */

async function excluirProduto(id) {

    const confirmar =
        confirm(
            'Deseja realmente excluir este produto?'
        );

    if (!confirmar) {
        return;
    }

    try {

        await fetch(
            `${API_URL}/${id}`,
            {
                method: 'DELETE'
            }
        );

        carregarProdutos();

    } catch (erro) {

        console.error(erro);

        alert(
            'Erro ao excluir produto.'
        );

    }

}

/* ==========================
   ABRIR MODAL
========================== */

function editarProduto(id) {

    const produto =
        produtosGlobais.find(
            p => p.id === id
        );

    if (!produto) return;

    document.getElementById(
        'editId'
    ).value =
        produto.id;

    document.getElementById(
        'editNome'
    ).value =
        produto.nome;

    document.getElementById(
        'editCategoria'
    ).value =
        produto.categoria || '';

    document.getElementById(
        'editQuantidade'
    ).value =
        produto.quantidade;

    document.getElementById(
        'editPreco'
    ).value =
        produto.preco;

    document.getElementById(
        'editEstoqueMinimo'
    ).value =
        produto.estoque_minimo;

    document.getElementById(
        'modalEditar'
    ).style.display =
        'flex';

}

/* ==========================
   FECHAR MODAL
========================== */

function fecharModal() {

    document.getElementById(
        'modalEditar'
    ).style.display =
        'none';

}

/* ==========================
   SALVAR EDIÇÃO
========================== */

async function salvarEdicao() {

    const id =
        document.getElementById(
            'editId'
        ).value;

    const produto = {

        nome:
            document.getElementById(
                'editNome'
            ).value,

        categoria:
            document.getElementById(
                'editCategoria'
            ).value,

        quantidade:
            Number(
                document.getElementById(
                    'editQuantidade'
                ).value
            ),

        preco:
            Number(
                document.getElementById(
                    'editPreco'
                ).value
            ),

        estoque_minimo:
            Number(
                document.getElementById(
                    'editEstoqueMinimo'
                ).value
            )

    };

    try {

        await fetch(
            `${API_URL}/${id}`,
            {

                method: 'PUT',

                headers: {
                    'Content-Type':
                        'application/json'
                },

                body:
                    JSON.stringify(produto)

            }
        );

        fecharModal();

        carregarProdutos();

    } catch (erro) {

        console.error(erro);

        alert(
            'Erro ao atualizar produto.'
        );

    }

}

/* ==========================
   PESQUISA
========================== */

document
    .getElementById('pesquisa')
    .addEventListener(
        'input',
        (e) => {

            const termo =
                e.target.value
                    .toLowerCase();

            const filtrados =
                produtosGlobais.filter(
                    produto =>
                        produto.nome
                            .toLowerCase()
                            .includes(
                                termo
                            )
                );

            renderizarTabela(
                filtrados
            );

        }
    );

/* ==========================
   INICIAR
========================== */

carregarProdutos();