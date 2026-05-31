const API_URL = 'http://localhost:3000/produtos';

let produtosGlobais = [];
let colunaAtual = '';
let ordemAscendente = true;

let chartQtdInstance = null;
let chartValInstance = null;

/* ==========================================================================
   MÁSCARA E FORMATAÇÃO DE MOEDA (UX EM TEMPO REAL)
   ========================================================================== */
function configurarMascarasMoeda() {
    // Aplica a máscara em tempo real nos inputs de preço (cadastro e edição)
    const inputsMoeda = document.querySelectorAll('input[data-type="currency"]');
    
    inputsMoeda.forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = e.target.value.replace(/\D/g, "");
            if (valor === "") {
                e.target.value = "";
                return;
            }
            let numero = (Number(valor) / 100).toFixed(2);
            e.target.value = formatarNumeroComoMoeda(numero);
        });
    });
}

function formatarNumeroComoMoeda(valor) {
    return "R$ " + Number(valor).toFixed(2).replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
}

function converterMoedaParaFloat(textoMoeda) {
    if (!textoMoeda) return 0;
    let limpo = textoMoeda.replace("R$", "").replace(/\./g, "").replace(",", ".").trim();
    return parseFloat(limpo) || 0;
}

/* ==========================================================================
   SISTEMA COLETOR DE LOGS (PERSISTÊNCIA LOCAL PARA AUDITORIA)
   ========================================================================== */
function registarLog(mensagem) {
    let logs = JSON.parse(localStorage.getItem('stockflow_logs')) || [];
    const agora = new Date();
    const timestamp = `${agora.toLocaleDateString()} ${agora.toLocaleTimeString()}`;
    
    logs.unshift(`[${timestamp}] ${mensagem}`);
    
    // Mantém um limite saudável de até 50 registros no histórico
    if (logs.length > 50) logs.pop(); 
    localStorage.setItem('stockflow_logs', JSON.stringify(logs));
}

/* ==========================================================================
   NOTIFICAÇÕES FLUTUANTES (TOAST)
   ========================================================================== */
function mostrarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = mensagem;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('esconder');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

/* ==========================================================================
   CARREGAMENTO DE DADOS DA API DISTRIBUÍDA
   ========================================================================== */
async function carregarProdutos() {
    try {
        const resposta = await fetch(API_URL);
        produtosGlobais = await resposta.json();
        processarExibicao();
    } catch (erro) {
        console.error(erro);
        mostrarToast('Erro ao ligar com o servidor do inventário.', 'erro');
    }
}

/* ==========================================================================
   PROCESSAMENTO DA TABELA (FILTROS + BUSCA + ORDENAÇÃO)
   ========================================================================== */
function processarExibicao() {
    const termo = document.getElementById('pesquisa').value.toLowerCase();
    const categoriaSelecionada = document.getElementById('filtroCategoria').value;

    // 1. Filtragem por texto e por categoria
    let produtosFiltrados = produtosGlobais.filter(p => {
        const correspondeNome = p.nome.toLowerCase().includes(termo);
        const correspondeCategoria = categoriaSelecionada === "" || p.categoria === categoriaSelecionada;
        return correspondeNome && correspondeCategoria;
    });

    // 2. Ordenação de colunas (se houver alguma ativa)
    if (colunaAtual) {
        produtosFiltrados.sort((a, b) => {
            let valA = a[colunaAtual];
            let valB = b[colunaAtual];

            if (['id', 'quantidade', 'preco', 'estoque_minimo'].includes(colunaAtual)) {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = valA ? valA.toString().toLowerCase() : '';
                valB = valB ? valB.toString().toLowerCase() : '';
            }

            if (valA < valB) return ordemAscendente ? -1 : 1;
            if (valA > valB) return ordemAscendente ? 1 : -1;
            return 0;
        });
    }

    // 3. Atualiza a interface visual completa
    renderizarTabela(produtosFiltrados);
    atualizarDashboard(produtosGlobais);
    renderizarGraficos(produtosGlobais);
}

function ordenarPor(coluna) {
    if (colunaAtual === coluna) {
        ordemAscendente = !ordemAscendente;
    } else {
        colunaAtual = coluna;
        ordemAscendente = true;
    }

    const colunasValidas = ['id', 'nome', 'categoria', 'quantidade', 'preco', 'estoque_minimo'];
    colunasValidas.forEach(c => {
        const seta = document.getElementById(`seta-${c}`);
        if (seta) {
            if (c === coluna) {
                seta.textContent = ordemAscendente ? '▲' : '▼';
            } else {
                seta.textContent = '↕';
            }
        }
    });

    processarExibicao();
}

function renderizarTabela(produtos) {
    const tabela = document.getElementById('tabelaProdutos');
    tabela.innerHTML = '';

    if (produtos.length === 0) {
        tabela.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-muted);">Nenhum produto encontrado.</td></tr>`;
        return;
    }

    produtos.forEach(produto => {
        const quantidade = Number(produto.quantidade);
        const estoqueMinimo = Number(produto.estoque_minimo);

        let statusClasse = '';
        let statusTexto = '';

        // Lógica de cálculo dos Badges de Status do Estoque
        if (quantidade <= estoqueMinimo) {
            statusClasse = 'status-critico'; statusTexto = 'CRÍTICO';
        } else if (quantidade <= (estoqueMinimo * 2)) {
            statusClasse = 'status-baixo'; statusTexto = 'BAIXO';
        } else {
            statusClasse = 'status-normal'; statusTexto = 'NORMAL';
        }

        tabela.innerHTML += `
            <tr>
                <td>${produto.id}</td>
                <td><strong>${produto.nome}</strong></td>
                <td>${produto.categoria || '-'}</td>
                <td>${produto.quantidade}</td>
                <td>${formatarNumeroComoMoeda(produto.preco)}</td>
                <td>${produto.estoque_minimo}</td>
                <td><span class="${statusClasse}">${statusTexto}</span></td>
                <td>
                    <button onclick="editarProduto(${produto.id})">Editar</button>
                    <button onclick="excluirProduto(${produto.id})">Excluir</button>
                </td>
            </tr>
        `;
    });
}

/* ==========================================================================
   ATUALIZAÇÃO DE MINI-CARDS E GRÁFICOS (CHART.JS)
   ========================================================================== */
function atualizarDashboard(produtos) {
    const totalProdutos = produtos.length;
    const totalEstoque = produtos.reduce((soma, p) => soma + Number(p.quantidade), 0);
    const valorEstoque = produtos.reduce((soma, p) => soma + (Number(p.quantidade) * Number(p.preco)), 0);
    const produtosCriticos = produtos.filter(p => Number(p.quantidade) <= Number(p.estoque_minimo)).length;

    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('totalEstoque').textContent = totalEstoque;
    document.getElementById('valorEstoque').textContent = formatarNumeroComoMoeda(valorEstoque);
    document.getElementById('produtosCriticos').textContent = produtosCriticos;
}

function renderizarGraficos(produtos) {
    const categoriasMapa = { 'Periféricos': 0, 'Hardware': 0, 'Monitores': 0, 'Acessórios': 0 };
    const valoresMapa = { 'Periféricos': 0, 'Hardware': 0, 'Monitores': 0, 'Acessórios': 0 };

    produtos.forEach(p => {
        if (categoriasMapa[p.categoria] !== undefined) {
            categoriasMapa[p.categoria] += Number(p.quantidade);
            valoresMapa[p.categoria] += (Number(p.quantidade) * Number(p.preco));
        }
    });

    const labels = Object.keys(categoriasMapa);
    const isDark = document.body.classList.contains('dark-mode');
    const corTexto = isDark ? '#f8fafc' : '#1f2937';

    // Gráfico 1: Quantidade por Categoria (Doughnut)
    if (chartQtdInstance) chartQtdInstance.destroy();
    const ctxQtd = document.getElementById('graficoCategorias').getContext('2d');
    chartQtdInstance = new Chart(ctxQtd, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: Object.values(categoriasMapa), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: corTexto } } } }
    });

    // Gráfico 2: Valor Monetário em Estoque por Categoria (Barra Horizontal)
    if (chartValInstance) chartValInstance.destroy();
    const ctxVal = document.getElementById('graficoValores').getContext('2d');
    chartValInstance = new Chart(ctxVal, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Total em R$', data: Object.values(valoresMapa), backgroundColor: '#6366f1' }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: corTexto } }, y: { ticks: { color: corTexto } } }
        }
    });
}

/* ==========================================================================
   AÇÕES DO FORMULÁRIO (CADASTRO, EDIÇÃO E EXCLUSÃO)
   ========================================================================== */
document.getElementById('produtoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const produto = {
        nome: document.getElementById('nome').value.trim(),
        categoria: document.getElementById('categoria').value,
        quantidade: Number(document.getElementById('quantidade').value),
        preco: converterMoedaParaFloat(document.getElementById('preco').value),
        estoque_minimo: Number(document.getElementById('estoqueMinimo').value)
    };

    if (!produto.nome || produto.quantidade < 0 || produto.preco < 0 || produto.estoque_minimo < 0) {
        mostrarToast('Valores inválidos detectados.', 'aviso');
        return;
    }

    try {
        const resposta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });
        if (!resposta.ok) throw new Error();

        e.target.reset();
        mostrarToast('Produto cadastrado com sucesso!');
        registarLog(`NOVO PRODUTO: "${produto.nome}" adicionado com estoque inicial de ${produto.quantidade} unidades.`);
        carregarProdutos();
    } catch (erro) {
        mostrarToast('Falha ao tentar inserir o produto.', 'erro');
    }
});

async function excluirProduto(id) {
    const produtoAlvo = produtosGlobais.find(p => p.id === id);
    const nomeProduto = produtoAlvo ? produtoAlvo.nome : `ID ${id}`;
    
    if (!confirm(`Deseja realmente eliminar o produto "${nomeProduto}" permanentemente?`)) return;

    try {
        const resposta = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!resposta.ok) throw new Error();

        mostrarToast('Produto removido com sucesso.', 'aviso');
        registarLog(`PRODUTO REMOVIDO: "${nomeProduto}" (ID: ${id}) foi excluído do inventário.`);
        carregarProdutos();
    } catch (erro) {
        mostrarToast('Não foi possível excluir o item.', 'erro');
    }
}

function editarProduto(id) {
    const produto = produtosGlobais.find(p => p.id === id);
    if (!produto) return;

    // Popula os campos internos do modal de edição
    document.getElementById('editId').value = produto.id;
    document.getElementById('editNome').value = produto.nome;
    document.getElementById('editCategoria').value = produto.categoria || '';
    document.getElementById('editQuantidade').value = produto.quantidade;
    document.getElementById('editPreco').value = formatarNumeroComoMoeda(produto.preco);
    document.getElementById('editEstoqueMinimo').value = produto.estoque_minimo;

    document.getElementById('modalEditar').style.display = 'flex';
}

function fecharModal() { 
    document.getElementById('modalEditar').style.display = 'none'; 
}

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('modalEditar')) fecharModal();
});

async function salvarEdicao(e) {
    if (e && e.preventDefault) e.preventDefault();

    const id = document.getElementById('editId').value;
    const produtoAntigo = produtosGlobais.find(p => p.id == id);

    const produto = {
        nome: document.getElementById('editNome').value.trim(),
        categoria: document.getElementById('editCategoria').value,
        quantidade: Number(document.getElementById('editQuantidade').value),
        preco: converterMoedaParaFloat(document.getElementById('editPreco').value),
        estoque_minimo: Number(document.getElementById('editEstoqueMinimo').value)
    };

    try {
        const resposta = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });
        if (!resposta.ok) throw new Error();

        fecharModal();
        mostrarToast('Dados atualizados com sucesso!');
        
        let diffQtd = "";
        if (produtoAntigo && produtoAntigo.quantidade !== produto.quantidade) {
            diffQtd = ` (Estoque alterado de ${produtoAntigo.quantidade} para ${produto.quantidade})`;
        }
        registarLog(`PRODUTO EDITADO: "${produto.nome}" atualizado via painel de edição${diffQtd}.`);
        carregarProdutos();
    } catch (erro) {
        mostrarToast('Erro ao atualizar o produto.', 'erro');
    }
}

// Configuração dos Event Listeners do painel principal
document.getElementById('editProdutoForm').addEventListener('submit', salvarEdicao);
document.getElementById('pesquisa').addEventListener('input', processarExibicao);
document.getElementById('filtroCategoria').addEventListener('change', processarExibicao);

/* ==========================================================================
   GERENCIAMENTO DE INTERRUPTOR DO MODO ESCURO
   ========================================================================== */
const btnTema = document.getElementById('btnTema');

if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark-mode');
    if (btnTema) btnTema.textContent = '☀️ Modo Claro';
}

if (btnTema) {
    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        btnTema.textContent = isDark ? '☀️ Modo Claro' : '🌙 Modo Escuro';
        localStorage.setItem('tema', isDark ? 'dark' : 'light');
        if (produtosGlobais.length > 0) renderizarGraficos(produtosGlobais);
    });
}

/* ==========================================================================
   INICIALIZAÇÃO DA APLICAÇÃO
   ========================================================================== */
configurarMascarasMoeda();
carregarProdutos();