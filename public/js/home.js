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
    throw new Error(err.erro || 'Falha na requisição');
  }
  const data = await response.json();
  if (!data.lat || !data.lng) throw new Error('Coordenadas inválidas');
  return data;
}

async function buscarUnidades(e) {
  e.preventDefault();

  const sectionResults = document.getElementById('section-results');
  const endereco = document.getElementById('endereco').value.trim();
  const tipo = document.getElementById('tipo').value;
  const especialidade = document.getElementById('especialidade').value;
  const raio = document.getElementById('distancia').value;
  const resultsContainer = document.querySelector('.results-container');

  if (!endereco) {
    resultsContainer.innerHTML = '';
    sectionResults.style.display = 'none';
    sectionResults.classList.remove('visivel');
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
    sectionResults.style.display = 'none';
    sectionResults.classList.remove('visivel');
    return;
  }

  document.getElementById('endereco').classList.remove('input-erro');
  const avisoAnterior = document.querySelector('.aviso-endereco');
  if (avisoAnterior) avisoAnterior.remove();

  resultsContainer.innerHTML = '<div class="loading">Buscando unidades próximas...</div>';
  sectionResults.style.display = '';
  sectionResults.classList.add('visivel');

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

    const enderecoExibido = unidade.endereco_gmaps || unidade.endereco || 'Endereço não disponível';
    const distanciaKm = (unidade.distancia / 1000).toFixed(1);

    const temEspecialidades = unidade.especialidades &&
      unidade.especialidades.split(';').map(e => e.trim()).filter(Boolean).length > 0;

    // Monta as especialidades (ocultas por padrão, sem botão — o card inteiro expande)
    let tagsHtml = '';
    if (temEspecialidades) {
      const lista = unidade.especialidades.split(';').map(e => e.trim()).filter(Boolean);
      tagsHtml = `
        <div class="especialidades-section">
          <p class="esp-hint">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            Ver especialidades (${lista.length})
          </p>
          <div class="especialidades-tags" style="display:none;">
            ${lista.map(e => `<span class="tag-esp">${e}</span>`).join('')}
          </div>
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

    // Clique no card inteiro expande/recolhe as especialidades
    if (temEspecialidades) {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // Não interfere se clicar no botão do Google Maps
        if (e.target.closest('.btn-maps')) return;

        const tagsDiv = card.querySelector('.especialidades-tags');
        const hint = card.querySelector('.esp-hint');
        const aberto = card.classList.contains('expandido');

        if (aberto) {
          tagsDiv.style.display = 'none';
          card.classList.remove('expandido');
          hint.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            Ver especialidades (${tagsDiv.querySelectorAll('.tag-esp').length})
          `;
        } else {
          tagsDiv.style.display = 'flex';
          card.classList.add('expandido');
          hint.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            Ocultar especialidades
          `;
        }
      });
    }

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDadosDosBancos();
  const formBusca = document.getElementById('form-busca');
  if (formBusca) formBusca.addEventListener('submit', buscarUnidades);
  else console.error('Elemento #form-busca não encontrado!');
});