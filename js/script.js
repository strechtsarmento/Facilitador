// Variáveis de estado global do módulo Antes e Depois
let transformacoes = { zoom: 1, x: 0, y: 0 };
let transformacoesAntesOverlay = { zoom: 1 }; // Zoom dedicado ao overlay do Antes na câmera
let arrastando = false;
let inicioX = 0, inicioY = 0;

let streamLocal = null;
let modoCamera = "environment"; // 'environment' (traseira) ou 'user' (frontal)
let alvoAtualCamera = ""; // 'antes' ou 'depois'

let fotoAntesData = "";
let fotoDepoisData = "";

// Função para abrir o módulo em ecrã inteiro
function abrir(tela) {
  const telaInicial = document.getElementById("tela-inicial");
  const telaModulo = document.getElementById("tela-modulo");
  const tituloModulo = document.getElementById("titulo-modulo");
  const view = document.getElementById("view");

  fecharCamera();

  const titulos = {
    antesDepois: "📸 Antes e Depois Cirúrgico",
    galeria: "🖼️ Galeria de Fotos",
    upload: "⬆️ Upload de Arquivos",
    config: "⚙️ Configurações",
    historico: "🕓 Histórico de Atividades"
  };

  const telas = {
    antesDepois: `
      <div class="modulo-alinhamento">
        
        <div id="etapa-1" class="bloco-etapa ativa">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 1</span>
            <h4>Selecione a sua foto de ANTES</h4>
          </div>
          <p class="sub-txt">Como deseja carregar a imagem de referência antiga?</p>
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="abrirPainelCamera('antes')">📷 Tirar Foto</button>
            <label class="btn-origem label-file">
              📁 Escolher Arquivo
              <input type="file" id="f-antes" accept="image/*" style="display:none;"/>
            </label>
          </div>
        </div>

        <div id="etapa-2" class="bloco-etapa hidden">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 2</span>
            <h4>Selecione a foto de DEPOIS e Alinhe</h4>
          </div>
          <p class="sub-txt">Carregue a foto atual. Se optar por tirar foto, poderá ver o Antes em transparência sobre a câmera.</p>
          
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="abrirPainelCamera('depois')">📷 Tirar Foto na Posição</button>
            <label class="btn-origem label-file">
              📁 Escolher Arquivo
              <input type="file" id="f-depois" accept="image/*" style="display:none;"/>
            </label>
          </div>

          <div id="painel-edicao-controles" class="hidden">
            <div class="controles-edicao">
              <div class="grupo-botoes">
                <button onclick="ajustarZoomDepois(0.1)">🔍 Zoom Depois +</button>
                <button onclick="ajustarZoomDepois(-0.1)">🔍 Zoom Depois -</button>
                <button onclick="resetarAjustesDepois()">🔄 Resetar</button>
              </div>
              <div class="grupo-slider-opacidade">
                <label>Opacidade do Overlay (Antes):</label>
                <input type="range" id="opacidade-ajuste" min="10" max="90" value="50" />
              </div>
            </div>
          </div>
        </div>

        <div id="container-camera-nativa" class="hidden">
          <div class="camera-box-stream">
            <video id="video-stream" autoplay playsinline></video>
            
            <img id="camera-overlay-antes-guia" class="overlay-antes-camera hidden" src="" />
          </div>

          <div id="controles-overlay-live" class="controles-live-cam hidden">
            <div class="linha-controle">
              <button onclick="ajustarZoomAntesOverlay(0.1)">🔍 Zoom Antes +</button>
              <button onclick="ajustarZoomAntesOverlay(-0.1)">🔍 Zoom Antes -</button>
            </div>
            <div class="linha-controle">
              <label>Transparência:</label>
              <input type="range" id="opacidade-live-range" min="10" max="90" value="50" oninput="atualizarOpacidadeLive(this.value)" />
            </div>
          </div>

          <div class="acoes-camera-botoes">
            <button class="btn-camera-acao" onclick="alternarLenteCamera()">🔄 Virar Câmera</button>
            <button id="btn-disparar-foto" class="btn-camera-acao gatilho">🔴 Capturar</button>
          </div>
          <button class="btn-link" onclick="fecharCamera()">Cancelar</button>
        </div>

        <div class="canvas-alinhamento hidden" id="area-arrastar">
          <div id="container-movivel" class="camada-movivel" style="transform: translate(0px, 0px) scale(1);">
            <img id="preview-depois" src="" />
          </div>
          <img id="preview-antes" class="img-base-alinhamento-overlay" src="" style="opacity: 0.5;" />
        </div>

        <button id="btn-gerar-slider" class="btn-principal hidden" onclick="consolidarSlider()">
          Gerar Slider de Comparação Final ⚡
        </button>

        <div id="container-slider-final" class="hidden">
          <hr style="border-color: rgba(255,255,255,0.08); margin: 30px 0;">
          <h3>↔️ Resultado: Efeito Revelação</h3>
          
          <div class="slider-wrapper" id="slider-wrapper-box">
            <div class="slider-camada camada-antes-fundo">
              <div id="render-antes" class="img-render"></div>
            </div>
            <div class="slider-camada camada-depois-topo" id="clip-depois-container" style="width: 50%;">
              <div id="render-depois" class="img-render"></div>
            </div>
            <input type="range" min="0" max="100" value="50" class="barra-divisoria" id="controle-slider-barra" />
            <span class="etiqueta-foto a">Antes</span>
            <span class="etiqueta-foto d">Depois</span>
          </div>
          <button class="btn-link" style="margin-top:20px;" onclick="abrir('antesDepois')">🔄 Reiniciar Comparação</button>
        </div>
      </div>
    `,
    galeria: "<h3>🖼️ Sua Galeria</h3><p>Nenhuma foto salva ainda.</p>",
    upload: "<h3>⬆️ Fazer Upload</h3><p>Arraste seus arquivos para cá.</p>",
    config: "<h3>⚙️ Ajustes</h3><p>Configurações gerais da aplicação.</p>",
    historico: "<h3>🕓 Seu Histórico</h3><p>Lista de ações recentes executadas.</p>"
  };

  tituloModulo.innerText = titulos[tela] || "Módulo";
  view.innerHTML = telas[tela] || `<p>Conteúdo indisponível</p>`;
  
  telaInicial.classList.add("hidden");
  telaModulo.classList.remove("hidden");

  if (tela === 'antesDepois') {
    inicializarListenersFicheiros();
  }
}

function voltarParaMenu() {
  fecharCamera();
  document.getElementById("tela-inicial").classList.remove("hidden");
  document.getElementById("tela-modulo").classList.add("hidden");
}

function inicializarListenersFicheiros() {
  const fAntes = document.getElementById("f-antes");
  const fDepois = document.getElementById("f-depois");

  if(fAntes) {
    fAntes.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const r = new FileReader();
        r.onload = (evt) => { receberImagemAntes(evt.target.result); };
        r.readAsDataURL(file);
      }
    });
  }

  if(fDepois) {
    fDepois.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const r = new FileReader();
        r.onload = (evt) => { receberImagemDepois(evt.target.result); };
        r.readAsDataURL(file);
      }
    });
  }
}

function receberImagemAntes(dataUrl) {
  fotoAntesData = dataUrl;
  document.getElementById("preview-antes").src = dataUrl;
  
  // Atualiza também a imagem que servirá de guia na câmera viva
  const overlayCam = document.getElementById("camera-overlay-antes-guia");
  if(overlayCam) overlayCam.src = dataUrl;

  document.getElementById("etapa-1").classList.remove("ativa");
  document.getElementById("etapa-1").classList.add("hidden");
  
  document.getElementById("etapa-2").classList.remove("hidden");
  document.getElementById("etapa-2").classList.add("ativa");
}

function receberImagemDepois(dataUrl) {
  fotoDepoisData = dataUrl;
  document.getElementById("preview-depois").src = dataUrl;

  document.getElementById("area-arrastar").classList.remove("hidden");
  document.getElementById("painel-edicao-controles").classList.remove("hidden");
  document.getElementById("btn-gerar-slider").classList.remove("hidden");

  configurarArrastoMesa();
}

// Prepara e abre a interface de câmera
function abrirPainelCamera(alvo) {
  alvoActualCamera = alvo;
  document.getElementById("container-camera-nativa").classList.remove("hidden");
  
  const liveControls = document.getElementById("controles-overlay-live");
  const overlayCam = document.getElementById("camera-overlay-antes-guia");

  if (alvo === 'depois' && fotoAntesData) {
    liveControls.classList.remove("hidden");
    overlayCam.classList.remove("hidden");
    transformacoesAntesOverlay = { zoom: 1 };
    atualizarEstiloOverlayLive();
  } else {
    liveControls.classList.add("hidden");
    overlayCam.classList.add("hidden");
  }

  inicializarStreamCamera();
}

// Inicia de facto o stream de vídeo respeitando o estado da lente (frontal/traseira)
async function inicializarStreamCamera() {
  if (streamLocal) {
    streamLocal.getTracks().forEach(track => track.stop());
  }

  try {
    streamLocal = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: modoCamera },
      audio: false
    });
    const video = document.getElementById("video-stream");
    video.srcObject = streamLocal;

    const btnDisparar = document.getElementById("btn-disparar-foto");
    const novoBtn = btnDisparar.cloneNode(true);
    btnDisparar.parentNode.replaceChild(novoBtn, btnDisparar);

    novoBtn.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      
      // Se for câmera frontal, espelha a imagem salva para ficar natural
      if (modoCamera === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const resultadoData = canvas.toDataURL("image/jpeg");

      fecharCamera();

      if (alvoActualCamera === 'antes') {
        receberImagemAntes(resultadoData);
      } else {
        receberImagemDepois(resultadoData);
      }
    });

  } catch (err) {
    alert("Não foi possível acessar a câmera desejada ou permissão negada.");
    document.getElementById("container-camera-nativa").classList.add("hidden");
  }
}

// Função do Botão Virar Câmera
function alternarLenteCamera() {
  modoCamera = (modoCamera === "environment") ? "user" : "environment";
  if (streamLocal) {
    inicializarStreamCamera();
  }
}

// Ajustes do Zoom do Antes DURANTE o visor de câmera aberto
function ajustarZoomAntesOverlay(fator) {
  transformacoesAntesOverlay.zoom += fator;
  if (transformacoesAntesOverlay.zoom < 0.2) transformacoesAntesOverlay.zoom = 0.2;
  atualizarEstiloOverlayLive();
}

function atualizarOpacidadeLive(valor) {
  const overlayCam = document.getElementById("camera-overlay-antes-guia");
  if (overlayCam) overlayCam.style.opacity = valor / 100;
}

function atualizarEstiloOverlayLive() {
  const overlayCam = document.getElementById("camera-overlay-antes-guia");
  if (overlayCam) {
    overlayCam.style.transform = `scale(${transformacoesAntesOverlay.zoom})`;
  }
}

function fecharCamera() {
  if (streamLocal) {
    streamLocal.getTracks().forEach(track => track.stop());
    streamLocal = null;
  }
  const boxCam = document.getElementById("container-camera-nativa");
  if (boxCam) boxCam.classList.add("hidden");
}

// Movimentação manual livre pós-captura na Mesa de Trabalho
function configurarArrastoMesa() {
  const areaArrastar = document.getElementById("area-arrastar");
  const opacidadeRange = document.getElementById("opacidade-ajuste");
  const pAntes = document.getElementById("preview-antes");

  opacidadeRange.addEventListener("input", (e) => {
    pAntes.style.opacity = e.target.value / 100;
  });

  const iniciarArrasto = (e) => {
    arrastando = true;
    const clienteX = e.clientX || e.touches[0].clientX;
    const clienteY = e.clientY || e.touches[0].clientY;
    inicioX = clienteX - transformacoes.x;
    inicioY = clienteY - transformacoes.y;
  };

  const moverArrasto = (e) => {
    if (!arrastando) return;
    e.preventDefault(); 
    const clienteX = e.clientX || e.touches[0].clientX;
    const clienteY = e.clientY || e.touches[0].clientY;
    transformacoes.x = clienteX - inicioX;
    transformacoes.y = clienteY - inicioY;
    atualizarEstilosCamadaDepois();
  };

  const pararArrasto = () => { arrastando = false; };

  areaArrastar.addEventListener("mousedown", iniciarArrasto);
  areaArrastar.addEventListener("mousemove", moverArrasto);
  window.addEventListener("mouseup", pararArrasto);

  areaArrastar.addEventListener("touchstart", iniciarArrasto, { passive: false });
  areaArrastar.addEventListener("touchmove", moverArrasto, { passive: false });
  window.addEventListener("touchend", pararArrasto);
}

function ajustarZoomDepois(fator) {
  transformacoes.zoom += fator;
  if (transformacoes.zoom < 0.1) transformacoes.zoom = 0.1;
  atualizarEstilosCamadaDepois();
}

function resetarAjustesDepois() {
  transformacoes = { zoom: 1, x: 0, y: 0 };
  atualizarEstilosCamadaDepois();
}

function atualizarEstilosCamadaDepois() {
  const camada = document.getElementById("container-movivel");
  if (camada) {
    camada.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;
  }
}

function consolidarSlider() {
  const containerSlider = document.getElementById("container-slider-final");
  const wrapper = document.getElementById("slider-wrapper-box");

  document.getElementById("render-antes").style.backgroundImage = `url(${fotoAntesData})`;
  
  const rDepois = document.getElementById("render-depois");
  rDepois.style.backgroundImage = `url(${fotoDepoisData})`;
  rDepois.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;

  containerSlider.classList.remove("hidden");

  const larguraReal = wrapper.offsetWidth;
  document.querySelectorAll(".img-render").forEach(img => {
    img.style.width = `${larguraReal}px`;
  });

  const barraSlider = document.getElementById("controle-slider-barra");
  const clipDepoisContainer = document.getElementById("clip-depois-container");

  barraSlider.addEventListener("input", (e) => {
    clipDepoisContainer.style.width = `${e.target.value}%`;
  });
}