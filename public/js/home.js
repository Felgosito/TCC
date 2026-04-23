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

async function obterCoordenadasPorEndereco(endereco) {
  const response = await fetch(`/api/geocodificar?endereco=${encodeURIComponent(endereco)}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.erro || 'Falha na requisi\u00e7\u00e3o');
  }
  const data = await response.json();
  if (!data.lat || !data.lng) throw new Error('Coordenadas inv\u00e1lidas');
  return data;
}

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
      <span>\u26a0\ufe0f</span>
      <div>Endere\u00e7o incompleto. Inclua o <strong>bairro ou n\u00famero</strong> ap\u00f3s uma v\u00edrgula.<br>
      <em>Exemplo: Rua das Flores, <strong>Bairro Centro</strong>, S\u00e3o Lu\u00eds</em></div>
    `;
    inputEndereco.after(aviso);
    resultsContainer.innerHTML = '';
    return;
  }

  document.getElementById('endereco').classList.remove('input-erro');
  const avisoAnterior = document.querySelector('.aviso-endereco');
  if (avisoAnterior) avisoAnterior.remove();

  resultsContainer.innerHTML = '<div class="loading">Buscando unidades pr\u00f3ximas...</div>';

  try {
    const coords = await obterCoordenadasPorEndereco(endereco);
    const params = new URLSearchParams({
      lat: coords.lat, lng: coords.lng, raio,
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

function exibirResultados(unidades) {
  const container = document.querySelector('.results-container');
  container.innerHTML = '';

  unidades.forEach(unidade => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const enderecoExibido = unidade.endereco_gmaps || unidade.endereco || 'Endere\u00e7o n\u00e3o dispon\u00edvel';
    const distanciaKm = (unidade.distancia / 1000).toFixed(1);

    // Especialidades como tags (m\u00e1ximo 4, depois mostra "+N")
    let tagsHtml = '';
    if (unidade.especialidades) {
      const lista = unidade.especialidades.split(';').map(e => e.trim()).filter(Boolean);
      const visiveis = lista.slice(0, 4);
      const extras = lista.length - visiveis.length;
      tagsHtml = `
        <div class="especialidades-tags">
          ${visiveis.map(e => `<span class="tag-esp">${e}</span>`).join('')}
          ${extras > 0 ? `<span class="tag-esp tag-mais">+${extras}</span>` : ''}
        </div>`;
    }

    const botaoMaps = unidade.link_gmaps
      ? `<a class="btn-maps" href="${unidade.link_gmaps}" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Ver no Google Maps
        </a>`
      : '';

    card.innerHTML = `
      <div class="card-header">
        <h3>${unidade.nome}</h3>
        <span class="distance">${distanciaKm}&nbsp;km</span>
      </div>
      <div class="card-body">
        <p class="address">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${enderecoExibido}
        </p>
        <div class="card-info">
          ${unidade.telefone ? `
          <p class="info-linha">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.64 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${unidade.telefone}
          </p>` : ''}
          ${unidade.horario ? `
          <p class="info-linha">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${unidade.horario}
          </p>` : ''}
        </div>
        ${tagsHtml}
        ${botaoMaps}
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosDosBancos();
  const formBusca = document.getElementById('form-busca');
  if (formBusca) formBusca.addEventListener('submit', buscarUnidades);
  else console.error('Elemento #form-busca n\u00e3o encontrado!');
});
