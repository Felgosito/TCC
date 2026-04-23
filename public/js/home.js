// Função para carregar os tipos de estabelecimento e especialidades
async function carregarDadosDosBancos() {
  try {
    const resTipos = await fetch('/api/tipos');
    if (!resTipos.ok) throw new Error('Erro ao carregar tipos');
    const tipos = await resTipos.json();
    
    const resEspecialidades = await fetch('/api/especialidades');
    if (!resEspecialidades.ok) throw new Error('Erro ao carregar especialidades');
    const especialidades = await resEspecialidades.json();
    
    const tipoSelect = document.getElementById('tipo');
    tipoSelect.innerHTML = '<option value="">Todos os tipos</option>';
    tipos.forEach(tipo => {
      tipoSelect.innerHTML += `<option value="${tipo.id}">${tipo.nome}</option>`;
    });
    
    const especialidadeSelect = document.getElementById('especialidade');
    especialidadeSelect.innerHTML = '<option value="">Qualquer especialidade</option>';
    especialidades.forEach(esp => {
      especialidadeSelect.innerHTML += `<option value="${esp.id}">${esp.nome}</option>`;
    });
    
  } catch (error) {
    console.error('Falha ao carregar dados:', error);
  }
}

// Função para converter endereço em coordenadas
async function obterCoordenadasPorEndereco(endereco) {
  try {
    const response = await fetch(`/api/geocodificar?endereco=${encodeURIComponent(endereco)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.erro || 'Falha na requisição');
    }

    const data = await response.json();
    
    if (!data.lat || !data.lng) {
      throw new Error('Coordenadas inválidas');
    }

    return data;

  } catch (error) {
    console.error('Erro na geolocalização:', error);
    throw error;
  }
}

// Função principal de busca
async function buscarUnidades(e) {
  e.preventDefault();
  
  const endereco = document.getElementById('endereco').value.trim();
  const tipo = document.getElementById('tipo').value;
  const especialidade = document.getElementById('especialidade').value;
  const raio = document.getElementById('distancia').value;

  const resultsContainer = document.querySelector('.results-container');

  if (!endereco) {
    resultsContainer.innerHTML = '';
    document.getElementById('endereco').classList.add('input-erro');
    return;
  }

  if (!endereco.includes(',')) {
    const inputEndereco = document.getElementById('endereco');
    inputEndereco.classList.add('input-erro');

    const avisoAnterior = document.querySelector('.aviso-endereco');
    if (avisoAnterior) avisoAnterior.remove();

    const aviso = document.createElement('div');
    aviso.className = 'aviso-endereco';
    aviso.innerHTML = `
      <span>⚠️</span>
      <div>Endereço incompleto. Inclua o <strong>bairro ou número</strong> após uma vírgula.<br>
      <em>Exemplo: Rua das Flores, <strong>Bairro Centro</strong>, São Luís</em></div>
    `;
    inputEndereco.after(aviso);

    resultsContainer.innerHTML = '';
    return;
  }

  document.getElementById('endereco').classList.remove('input-erro');
  const avisoAnterior = document.querySelector('.aviso-endereco');
  if (avisoAnterior) avisoAnterior.remove();

  resultsContainer.innerHTML = '<div class="loading">Buscando unidades próximas...</div>';

  try {
    const coords = await obterCoordenadasPorEndereco(endereco);
    
    const params = new URLSearchParams({
      lat: coords.lat,
      lng: coords.lng,
      raio,
      ...(tipo && { tipo }),
      ...(especialidade && { especialidade })
    });

    const response = await fetch(`/api/busca?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.erro || 'Erro na busca');
    }

    const unidades = await response.json();
    
    if (unidades.length === 0) {
      resultsContainer.innerHTML = '<div class="no-results">Nenhuma unidade encontrada</div>';
      return;
    }

    exibirResultados(unidades);

  } catch (error) {
    console.error('Erro na busca:', error);
    resultsContainer.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

// Função para exibir resultados
function exibirResultados(unidades) {
  const container = document.querySelector('.results-container');
  container.innerHTML = '';

  if (unidades.length === 0) {
    container.innerHTML = '<div class="no-results">Nenhuma unidade encontrada</div>';
    return;
  }

  unidades.forEach(unidade => {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Endereço: prefere o do Google Maps, senão usa o do banco
    const enderecoExibido = unidade.endereco_gmaps || unidade.endereco || 'Endereço não disponível';

    // Distância formatada
    const distanciaKm = (unidade.distancia / 1000).toFixed(2);

    // Botão Google Maps (só aparece se tiver link)
    const botaoMaps = unidade.link_gmaps
      ? `<a class="btn-maps" href="${unidade.link_gmaps}" target="_blank" rel="noopener noreferrer">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
           Ver no Google Maps
         </a>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <h3>${unidade.nome}</h3>
        <span class="distance">${distanciaKm} km</span>
      </div>
      <div class="card-body">
        <p class="address">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${enderecoExibido}
        </p>
        <div class="details">
          ${unidade.telefone ? `<p><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${unidade.telefone}</p>` : ''}
          ${unidade.horario ? `<p><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${unidade.horario}</p>` : ''}
        </div>
        ${botaoMaps}
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosDosBancos();

  const formBusca = document.getElementById('form-busca');
  if (formBusca) {
    formBusca.addEventListener('submit', buscarUnidades);
  } else {
    console.error('Elemento #form-busca não encontrado!');
  }
});
