const API_URL = 'http://localhost:3000/produtos';

async function carregarProdutos() {

    const resposta = await fetch(API_URL);

    const produtos = await resposta.json();

    const tabela = document.getElementById('tabelaProdutos');

    tabela.innerHTML = '';

   produtos.forEach(produto => {

    tabela.innerHTML += `
        <tr>
            <td>${produto.id}</td>
            <td>${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td>R$ ${produto.preco}</td>
            <td>
                <button onclick="editarProduto(${produto.id})">
                    Editar
                </button>

                <button onclick="excluirProduto(${produto.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `;

});
}

document
    .getElementById('produtoForm')
    .addEventListener('submit', async (e) => {

        e.preventDefault();

        const produto = {
            nome: document.getElementById('nome').value,
            quantidade: Number(document.getElementById('quantidade').value),
            preco: Number(document.getElementById('preco').value)
        };

        await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(produto)
        });

        e.target.reset();

        carregarProdutos();
    });

carregarProdutos();

async function excluirProduto(id) {

    const confirmar = confirm(
        'Deseja realmente excluir este produto?'
    );

    if (!confirmar) {
        return;
    }

    await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });

    carregarProdutos();
}

async function editarProduto(id) {

    const nome = prompt('Novo nome:');

    const quantidade = prompt('Nova quantidade:');

    const preco = prompt('Novo preço:');

    if (!nome || !quantidade || !preco) {
        return;
    }

    await fetch(`${API_URL}/${id}`, {

        method: 'PUT',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            nome,
            quantidade: Number(quantidade),
            preco: Number(preco)
        })

    });

    carregarProdutos();
}