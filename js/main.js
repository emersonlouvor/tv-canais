let allVideos = []; 
let currentFilteredVideos = []; 
let currentIndex = 0;
const ITEMS_PER_PAGE = 9;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

function loadThemePreference() {
  const stored = localStorage.getItem('theme');
  if (stored) applyTheme(stored);
  else applyTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

async function initApp() {
  try {
    const res = await fetch('data/emersonlouvor.json');
    if (!res.ok) throw new Error('Erro ao carregar JSON');
    allVideos = await res.json();
    applySearchAndFilter(''); 
  } catch (err) {
    console.error("Erro ao carregar os vídeos:", err);
    document.getElementById('videos').innerHTML = '<p>Erro ao carregar os vídeos.</p>';
  }
}

function applySearchAndFilter(query = '') {
  if (query) {
    const lowerQuery = query.toLowerCase();
    currentFilteredVideos = allVideos.filter(v => v.title.toLowerCase().includes(lowerQuery));
  } else {
    currentFilteredVideos = shuffleArray([...allVideos]); 
  }
  currentIndex = 0; 
  renderVideos(false); 
}

function renderVideos(append = false) {
  const container = document.getElementById('videos');
  if (!append) container.innerHTML = ''; 

  const itemsToShow = currentFilteredVideos.slice(currentIndex, currentIndex + ITEMS_PER_PAGE);
  
  if (itemsToShow.length === 0 && !append) {
    container.innerHTML = '<p>Nenhum vídeo encontrado.</p>';
    updateLoadMoreButton();
    return;
  }

  const htmlString = itemsToShow.map(video => `
    <div class="video-card" tabindex="0" onclick="showVideo('${video.videoId}')" onkeypress="if(event.key === 'Enter') showVideo('${video.videoId}')">
      <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
      <div class="video-info">
        <h3>${video.title}</h3>
        <div class="meta">EMERSONLOUVOR</div>
      </div>
    </div>
  `).join('');

  container.insertAdjacentHTML('beforeend', htmlString);
  currentIndex += ITEMS_PER_PAGE;
  updateLoadMoreButton();
}

function updateLoadMoreButton() {
  const btnCarregar = document.querySelector('button[onclick="loadMore()"]');
  if (btnCarregar) {
    if (currentIndex >= currentFilteredVideos.length) {
      btnCarregar.parentElement.style.display = 'none';
    } else {
      btnCarregar.parentElement.style.display = 'block';
    }
  }
}

function loadMore() { renderVideos(true); }

function loadHome() {
  document.getElementById('homeSection').style.display = 'block';
  document.getElementById('aboutSection').style.display = 'none';
  const searchInput = document.getElementById('search');
  if (searchInput) searchInput.value = '';
  applySearchAndFilter(''); 
}

function loadAbout() {
  document.getElementById('homeSection').style.display = 'none';
  document.getElementById('aboutSection').style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
  loadThemePreference();
  initApp(); 
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      applySearchAndFilter(e.target.value);
    });
  }
});

let lastScrollTop = 0;
const header = document.getElementById('mainHeader');
window.addEventListener('scroll', () => {
  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  if (scrollTop <= 0) {
    header.classList.remove('hidden');
    lastScrollTop = scrollTop;
    return;
  }
  if (scrollTop > lastScrollTop) header.classList.add('hidden');
  else header.classList.remove('hidden');
  lastScrollTop = scrollTop;
});

window.addEventListener('click', (e) => {
  const wrapper = document.getElementById('videoPlayerWrapper');
  if (e.target === wrapper && wrapper.style.display === 'flex') closeVideo();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (document.getElementById('virtualKeyboard').style.display === 'flex') digitarVK('Sair');
    else closeVideo();
  }
});

/* ========================================================
   SISTEMA DE TECLADO VIRTUAL
======================================================== */
const layoutTeclado = [
  'A','B','C','D','E','F', 'G','H','I','J','K','L',
  'M','N','O','P','Q','R', 'S','T','U','V','W','X',
  'Y','Z','0','1','2','3', '4','5','6','7','8','9',
  'Espaço','Apagar','Buscar','Sair', '-', '_'
];

function abrirTecladoVirtual() {
  const vk = document.getElementById('virtualKeyboard');
  const grid = document.getElementById('vkGrid');
  const texto = document.getElementById('vkTexto');
  
  texto.innerText = document.getElementById('search').value;
  
  if (grid.innerHTML === '') {
    grid.innerHTML = layoutTeclado.map(tecla => `
      <button class="tecla-vk" tabindex="0" onclick="digitarVK('${tecla}')" onkeypress="if(event.key==='Enter') digitarVK('${tecla}')">${tecla}</button>
    `).join('');
  }
  
  vk.style.display = 'flex';
  setTimeout(() => document.querySelector('.tecla-vk').focus(), 100);
}

function digitarVK(tecla) {
  const texto = document.getElementById('vkTexto');
  const searchInput = document.getElementById('search');

  if (tecla === 'Espaço') texto.innerText += ' ';
  else if (tecla === 'Apagar') texto.innerText = texto.innerText.slice(0, -1);
  else if (tecla === 'Sair') {
    document.getElementById('virtualKeyboard').style.display = 'none';
    searchInput.focus();
  } else if (tecla === 'Buscar') {
    document.getElementById('virtualKeyboard').style.display = 'none';
    searchInput.value = texto.innerText;
    applySearchAndFilter(texto.innerText);
    setTimeout(() => {
       const cards = document.querySelectorAll('.video-card');
       if(cards.length > 0) cards[0].focus();
    }, 100);
  } else {
    texto.innerText += tecla;
  }
}

/* ========================================================
   NAVEGAÇÃO POR SETAS DIRECIONAIS E GAMEPAD
======================================================== */
function moverFoco(direcao) {
  // Navegação dentro do Teclado Virtual
  if (document.getElementById('virtualKeyboard').style.display === 'flex') {
    const teclas = Array.from(document.querySelectorAll('.tecla-vk'));
    let idx = teclas.indexOf(document.activeElement);
    if (idx === -1) { teclas[0].focus(); return; }

    if (direcao === 'ArrowRight') idx++;
    if (direcao === 'ArrowLeft') idx--;
    if (direcao === 'ArrowDown') idx += 6; // Pula 1 linha (6 colunas)
    if (direcao === 'ArrowUp') idx -= 6;   // Sobe 1 linha

    if (idx >= 0 && idx < teclas.length) teclas[idx].focus();
    return; 
  }

  // Navegação no Site Principal
  const itensMenu = Array.from(document.querySelectorAll('.nav-link'));
  const searchBar = document.getElementById('search');
  const cards = Array.from(document.querySelectorAll('.video-card'));
  const btnCarregar = document.querySelector('button[onclick="loadMore()"]');
  
  const todosFocaveis = [...itensMenu, searchBar, ...cards];
  if (btnCarregar && btnCarregar.parentElement.style.display !== 'none') todosFocaveis.push(btnCarregar);

  const focadoAtual = document.activeElement;

  if (!todosFocaveis.includes(focadoAtual)) {
    itensMenu[0].focus();
    return;
  }

  const noMenuLink = itensMenu.includes(focadoAtual);
  const naBusca = focadoAtual === searchBar;
  const noCard = cards.includes(focadoAtual);
  const noBtnCarregar = focadoAtual === btnCarregar;

  if (direcao === 'ArrowRight' || direcao === 'ArrowLeft') {
    let index = todosFocaveis.indexOf(focadoAtual);
    if (direcao === 'ArrowRight') index++;
    if (direcao === 'ArrowLeft') index--;
    if (index >= 0 && index < todosFocaveis.length) {
      todosFocaveis[index].focus();
      todosFocaveis[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  if (direcao === 'ArrowDown') {
    if (noMenuLink) searchBar.focus(); // Do link pro search
    else if (naBusca) { if (cards.length > 0) cards[0].focus(); } // Da busca pro vídeo
    else if (noCard) {
      const grid = document.querySelector('.grid');
      const colunas = window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      let proximoIndex = cards.indexOf(focadoAtual) + colunas;
      if (proximoIndex < cards.length) cards[proximoIndex].focus();
      else if (btnCarregar && btnCarregar.parentElement.style.display !== 'none') btnCarregar.focus();
    }
  }

  if (direcao === 'ArrowUp') {
    if (naBusca) itensMenu[0].focus(); // Da busca pro Home
    else if (noBtnCarregar && cards.length > 0) cards[cards.length - 1].focus(); 
    else if (noCard) {
      const grid = document.querySelector('.grid');
      const colunas = window.getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      let proximoIndex = cards.indexOf(focadoAtual) - colunas;
      if (proximoIndex >= 0) cards[proximoIndex].focus();
      else searchBar.focus(); // Do primeiro vídeo sobe pra busca
    }
  }

  document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

window.addEventListener('keydown', (e) => {
  if (document.getElementById('videoPlayerWrapper').style.display === 'flex') return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    e.preventDefault(); 
    moverFoco(e.key);
  }
});

let ultimoComandoGamepad = 0;
function verificarGamepad() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  const controle = gamepads[0]; 

  if (controle) {
    const agora = Date.now();
    if (agora - ultimoComandoGamepad > 200) {
      const modalAberto = document.getElementById('videoPlayerWrapper').style.display === 'flex';
      const tecladoAberto = document.getElementById('virtualKeyboard').style.display === 'flex';

      // Botão "A"
      if (controle.buttons[0].pressed && !modalAberto) {
        const focado = document.activeElement;
        if (focado) {
          if (focado.tagName === 'INPUT') abrirTecladoVirtual(); 
          else focado.click(); 
        }
        ultimoComandoGamepad = agora;
      }

      // Botão "B"
      if (controle.buttons[1].pressed) {
        if (tecladoAberto) digitarVK('Sair');
        else if (modalAberto) closeVideo();
        ultimoComandoGamepad = agora;
      }

      // Direcionais
      if (!modalAberto) {
        const limite = 0.5; 
        let direcao = null;

        if (controle.buttons[12].pressed || controle.axes[1] < -limite) direcao = 'ArrowUp';
        else if (controle.buttons[13].pressed || controle.axes[1] > limite) direcao = 'ArrowDown';
        else if (controle.buttons[14].pressed || controle.axes[0] < -limite) direcao = 'ArrowLeft';
        else if (controle.buttons[15].pressed || controle.axes[0] > limite) direcao = 'ArrowRight';

        if (direcao) {
          moverFoco(direcao);
          ultimoComandoGamepad = agora;
        }
      }
    }
  }
  requestAnimationFrame(verificarGamepad);
}

window.addEventListener("gamepadconnected", (e) => {
  console.log("🎮 Controle conectado: ", e.gamepad.id);
  verificarGamepad();
});

/* ========================================================
   PLAYER INTELIGENTE (YOUTUBE API) - REPRODUÇÃO AUTOMÁTICA
======================================================== */

// Ano dinâmico no footer (Pode manter este)
const yearSpan = document.getElementById('currentYear');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

let ytPlayer;

// Carrega o "motor" oficial do YouTube no seu site
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Quando o motor do YouTube estiver pronto, ele cria o player na sua div
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('videoPlayer', {
    height: '100%', 
    width: '100%',
    videoId: '', // Começa vazio
    playerVars: {
      'autoplay': 1,
      'rel': 0, // Evita sugerir vídeos de canais concorrentes no final
      'modestbranding': 1
    },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

// O "Ouvido" do Player: Detecta quando o vídeo acaba
function onPlayerStateChange(event) {
  // O código '0' (YT.PlayerState.ENDED) significa que o vídeo acabou!
  if (event.data === YT.PlayerState.ENDED) {
    tocarProximoVideoAleatorio();
  }
}

// A Função da "Netflix" - Sorteia e dá o play
function tocarProximoVideoAleatorio() {
  if (allVideos && allVideos.length > 0) {
    const randomIndex = Math.floor(Math.random() * allVideos.length);
    const proximoVideo = allVideos[randomIndex];
    
    // Manda o YouTube tocar o novo vídeo sorteado imediatamente
    ytPlayer.loadVideoById(proximoVideo.videoId);
    loadAdHtml(); 
  }
}

// Carrega os anúncios de texto
async function loadAdHtml() {
  try {
    const res = await fetch('ads/dicasdasol.txt');
    if (!res.ok) throw new Error('Falha na rede');
    const html = await res.text();
    document.getElementById('adContainer').innerHTML = html;
  } catch (err) {
    console.warn('Erro ao carregar anúncio:', err);
    document.getElementById('adContainer').innerHTML = '<p style="color: gray;">Anúncio indisponível no momento.</p>';
  }
}

// Novas funções de abrir e fechar o modal
function showVideo(videoId) {
  const wrapper = document.getElementById('videoPlayerWrapper');
  const header = document.getElementById('mainHeader');
  
  wrapper.style.display = 'flex';
  if (header) header.style.display = 'none'; // Esconde o menu
  
  // Se o player já carregou, manda ele tocar o vídeo clicado
  if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
    ytPlayer.loadVideoById(videoId);
  }
  
  loadAdHtml();
}

function closeVideo() {
  const wrapper = document.getElementById('videoPlayerWrapper');
  const header = document.getElementById('mainHeader');
  
  wrapper.style.display = 'none';
  if (header) header.style.display = 'block'; // Traz o menu de volta
  
  // Manda o player parar de tocar o vídeo
  if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
    ytPlayer.stopVideo();
  }
  document.getElementById('adContainer').innerHTML = '';
}