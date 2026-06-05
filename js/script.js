// =========================================================================
// VARIÁVEIS DE ESTADO GLOBAL (MÓDULO ANTES E DEPOIS)
// =========================================================================
let transformacoes = { zoom: 1, x: 0, y: 0 }; 
let transformacoesAntesOverlay = { zoom: 1, x: 0, y: 0 }; 

let arrastando = false;
let arrastandoOverlayCam = false; 
let inicioX = 0, inicioY = 0;

// Variáveis para o cálculo do gesto de pinça (Pinch)
let distanciaPinchInicial = 0;
let zoomInicialCam = 1;

let streamLocal = null;
let modoCamera = "environment"; 
let alvoAtualCamera = ""; 
let idAnimacaoCamera = null; 

let fotoAntesData = "";
let fotoDepoisData = "";
let imgAntesObjeto = null; 
let opacidadeLiveGlobal = 0.5;

let disparadorConfigurado = false;

// =========================================================================
// NAVEGAÇÃO ENTRE TELAS / MÓDULOS
// =========================================================================
function abrir(tela) {
  const telaInicial = document.getElementById("tela-inicial");
  const telaModulo = document.getElementById("tela-modulo");
  const tituloModulo = document.getElementById("titulo-modulo");
  const view = document.getElementById("view");

  fecharCamera();

  const titulos = {
    antesDepois: "📸 Alinhamento e Seleção Visual",
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
              <input type="file" id="f-antes" accept="image/*" style="display:none;" onchange="manipularArquivo(this, 'antes')"/>
            </label>
          </div>
        </div>

        <div id="etapa-2" class="bloco-etapa hidden">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 2</span>
            <h4>Selecione a foto de DEPOIS e Alinhe</h4>
          </div>
          <p class="sub-txt">Tire a foto atual vendo o 'Antes' mesclado no visor. Use os dedos para arrastar ou fazer pinça de zoom.</p>
          
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="abrirPainelCamera('depois')">📷 Tirar Foto na Posição</button>
            <label class="btn-origem label-file">
              📁 Escolher Arquivo
              <input type="file" id="f-depois" accept="image/*" style="display:none;" onchange="manipularArquivo(this, 'depois')"/>
            </label>
          </div>

          <div id="painel-edicao-controles" class="hidden">
            <div class="controles-edicao">
              <div class="grupo-botoes">
                <button class="btn-mini" onclick="ajustarZoomDepois(0.1)">🔍 Zoom +</button>
                <button class="btn-mini" onclick="ajustarZoomDepois(-0.1)">🔍 Zoom -</button>
                <button class="btn-mini btn-reset" onclick="resetarAjustesDepois()">🔄 Reset</button>
              </div>
              <div class="grupo-slider-opacidade">
                <label>Opacidade do Antes:</label>
                <input type="range" id="opacidade-ajuste" min="10" max="90" value="50" oninput="atualizarOpacidadeMesa(this.value)" />
              </div>
            </div>
          </div>
        </div>

        <div id="container-camera-nativa" class="hidden">
          <div class="camera-box-stream">
            <video id="video-stream" autoplay playsinline muted style="display:none;"></video>
            <canvas id="canvas-visor-live"></canvas>

            <div id="timer-display" class="timer-display-overlay hidden">5</div>
          </div>

          <div id="controles-overlay-live" class="painel-inferior-ajustes-cam hidden">
            <div class="linha-controle-slider">
              <span>Transparência do Overlay:</span>
              <input type="range" id="opacidade-live-range" min="10" max="90" value="50" oninput="atualizarOpacidadeLive(this.value)" />
            </div>
            <button class="btn-reset-cam-link" onclick="resetarAjustesAntesOverlay()">🔄 Resetar Posição e Zoom</button>
          </div>

          <div class="barra-botoes-fotografica">
            <button class="btn-circular secondary" id="btn-virar-camera" onclick="alternarLenteCamera()">🔄</button>
            <button id="btn-disparar-foto" class="btn-circular gatilho"></button>
            <button class="btn-circular secondary" id="btn-cancelar-camera" onclick="fecharCamera()">❌</button>
          </div>
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
  
  disparadorConfigurado = false;
}

function voltarParaMenu() {
  fecharCamera();
  document.getElementById("tela-inicial").classList.remove("hidden");
  document.getElementById("tela-modulo").classList.add("hidden");
}

// =========================================================================
// GESTÃO DE ARQUIVOS (UPLOAD)
// =========================================================================
function manipularArquivo(input, alvo) {
  const file = input.files[0];
  if (file) {
    const r = new FileReader();
    r.onload = (evt) => { 
      if (alvo === 'antes') {
        receberImagemAntes(evt.target.result);
      } else {
        receberImagemDepois(evt.target.result);
      }
    };
    r.readAsDataURL(file);
  }
}

function接收ImagemAntes(dataUrl) {
  // Mantida para compatibilidade interna se necessário
  receberImagemAntes(dataUrl);
}

function receberImagemAntes(dataUrl) {
  fotoAntesData = dataUrl;
  document.getElementById("preview-antes").src = dataUrl;
  
  imgAntesObjeto = new Image();
  imgAntesObjeto.src = dataUrl;

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

// =========================================================================
// CONTROLO DA CÂMERA E FLUXO LIVE VIEW
// =========================================================================
function abrirPainelCamera(alvo) {
  alvoAtualCamera = alvo;
  document.getElementById("container-camera-nativa").classList.remove("hidden");
  
  const liveControls = document.getElementById("controles-overlay-live");

  if (alvo === 'depois' && fotoAntesData) {
    liveControls.classList.remove("hidden");
    transformacoesAntesOverlay = { zoom: 1, x: 0, y: 0 }; 
  } else {
    liveControls.classList.add("hidden");
  }

  inicializarStreamCamera();
}

async function inicializarStreamCamera() {
  if (streamLocal) {
    streamLocal.getTracks().forEach(track => track.stop());
    streamLocal = null;
  }
  if (idAnimacaoCamera) {
    cancelAnimationFrame(idAnimacaoCamera);
  }

  const restricoes = {
    video: {
      facingMode: { ideal: modoCamera },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  };

  try {
    streamLocal = await navigator.mediaDevices.getUserMedia(restricoes);
    const video = document.getElementById("video-stream");
    const canvasVisor = document.getElementById("canvas-visor-live");
    const ctxVisor = canvasVisor.getContext("2d");
    
    video.srcObject = streamLocal;
    video.setAttribute("playsinline", true);
    video.setAttribute("autoplay", true);
    video.setAttribute("muted", true);
    
    video.onloadedmetadata = () => {
      canvasVisor.width = video.videoWidth || 640;
      canvasVisor.height = video.videoHeight || 480;
      
      configurarArrastoOverlayCamera(canvasVisor);
      loopRenderVisor(video, canvasVisor, ctxVisor);
    };

    video.play().catch(e => console.log("Aguardando play ativo:", e));

    const btnDisparar = document.getElementById("btn-disparar-foto");
    if (!disparadorConfigurado) {
      btnDisparar.addEventListener("click", () => {
        executarContagemRegressiva(5, () => {
          const canvasSnapshot = document.createElement("canvas");
          canvasSnapshot.width = canvasVisor.width;
          canvasSnapshot.height = canvasVisor.height;
          const ctxSnap = canvasSnapshot.getContext("2d");
          
          if (modoCamera === "user") {
            ctxSnap.translate(canvasSnapshot.width, 0);
            ctxSnap.scale(-1, 1);
          }
          ctxSnap.drawImage(video, 0, 0, canvasSnapshot.width, canvasSnapshot.height);
          const resultadoData = canvasSnapshot.toDataURL("image/jpeg", 0.95);

          fecharCamera();

          if (alvoAtualCamera === 'antes') {
            receberImagemAntes(resultadoData);
          } else {
            receberImagemDepois(resultadoData);
          }
        });
      });
      disparadorConfigurado = true;
    }

  } catch (err) {
    alert("Acesso à câmera negado. Verifique as permissões de privacidade.");
    document.getElementById("container-camera-nativa").classList.add("hidden");
  }
}

function ejecutarContagemRegressiva(segundos, callbackFinal) {
  const displayTimer = document.getElementById("timer-display");
  const btnDisparar = document.getElementById("btn-disparar-foto");
  const btnVirar = document.getElementById("btn-virar-camera");
  const btnCancelar = document.getElementById("btn-cancelar-camera");
  const liveControls = document.getElementById("controles-overlay-live");

  btnDisparar.style.pointerEvents = "none";
  btnDisparar.style.opacity = "0.3";
  if(btnVirar) btnVirar.style.visibility = "hidden";
  if(btnCancelar) btnCancelar.style.visibility = "hidden";
  if(liveControls) liveControls.style.opacity = "0"; 

  let tempoRestante = segundos;
  displayTimer.innerText = tempoRestante;
  displayTimer.classList.remove("hidden");
  displayTimer.classList.add("animar-pulso");

  const intervalo = setInterval(() => {
    tempoRestante--;
    
    if (tempoRestante <= 0) {
      clearInterval(intervalo);
      displayTimer.classList.add("hidden");
      displayTimer.classList.remove("animar-pulso");
      
      btnDisparar.style.pointerEvents = "auto";
      btnDisparar.style.opacity = "1";
      if(btnVirar) btnVirar.style.visibility = "visible";
      if(btnCancelar) btnCancelar.style.visibility = "visible";
      if(liveControls) liveControls.style.opacity = "1";
      
      callbackFinal();
    } else {
      displayTimer.innerText = tempoRestante;
      displayTimer.classList.remove("animar-pulso");
      void displayTimer.offsetWidth; 
      displayTimer.classList.add("animar-pulso");
    }
  }, 1000);
}

// =========================================================================
// SISTEMA GESTUAL MOBILE: ARRASTE (1 DEDO) E PINÇA ZOOM (2 DEDOS)
// =========================================================================
function configurarArrastoOverlayCamera(canvasElement) {
  
  const obterDistanciaTouches = (t1, t2) => {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  };

  const obterCoordenadasCanvas = (e) => {
    const rect = canvasElement.getBoundingClientRect();
    const touch = e.touches && e.touches.length ? e.touches[0] : e;
    const x = ((touch.clientX - rect.left) / rect.width) * canvasElement.width;
    const y = ((touch.clientY - rect.top) / rect.height) * canvasElement.height;
    return { x, y };
  };

  const iniciarToqueCam = (e) => {
    if (alvoAtualCamera !== 'depois') return;

    if (e.touches && e.touches.length === 2) {
      arrastandoOverlayCam = false; 
      distanciaPinchInicial = obterDistanciaTouches(e.touches[0], e.touches[1]);
      zoomInicialCam = transformacoesAntesOverlay.zoom;
    } 
    else {
      arrastandoOverlayCam = true;
      const coords = obterCoordenadasCanvas(e);
      inicioX = coords.x - transformacoesAntesOverlay.x;
      inicioY = coords.y - transformacoesAntesOverlay.y;
    }
  };

  const moverToqueCam = (e) => {
    if (e.cancelable && e.target === canvasElement) {
      e.preventDefault();
    }

    if (e.touches && e.touches.length === 2) {
      const novaDistancia = obterDistanciaTouches(e.touches[0], e.touches[1]);
      if (distanciaPinchInicial > 0) {
        const proporcaoEscala = novaDistancia / distanciaPinchInicial;
        let novoZoom = zoomInicialCam * proporcaoEscala;
        
        if (novoZoom < 0.3) novoZoom = 0.3;
        if (novoZoom > 5.0) novoZoom = 5.0;
        
        transformacoesAntesOverlay.zoom = novoZoom;
      }
    } 
    else if (arrastandoOverlayCam) {
      const coords = obterCoordenadasCanvas(e);
      transformacoesAntesOverlay.x = coords.x - inicioX;
      transformacoesAntesOverlay.y = coords.y - inicioY;
    }
  };

  const pararToqueCam = () => { 
    arrastandoOverlayCam = false; 
    distanciaPinchInicial = 0;
  };

  canvasElement.addEventListener("mousedown", iniciarToqueCam);
  canvasElement.addEventListener("mousemove", moverToqueCam);
  window.addEventListener("mouseup", pararToqueCam);

  canvasElement.addEventListener("touchstart", iniciarToqueCam, { passive: false });
  canvasElement.addEventListener("touchmove", moverToqueCam, { passive: false });
  window.addEventListener("touchend", pararToqueCam);
  canvasElement.addEventListener("touchcancel", pararToqueCam);
}

// MOTOR DE RENDERIZAÇÃO LIVE VIEW
function loopRenderVisor(video, canvas, ctx) {
  if (!streamLocal) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  if (modoCamera === "user") {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (alvoAtualCamera === 'depois' && imgAntesObjeto && imgAntesObjeto.complete) {
    ctx.save();
    ctx.globalAlpha = opacidadeLiveGlobal;

    let imgLargura = imgAntesObjeto.width;
    let imgAltura = imgAntesObjeto.height;
    let canvasLargura = canvas.width;
    let canvasAltura = canvas.height;

    let escalaProporcional = Math.max(canvasLargura / imgLargura, canvasAltura / imgAltura);
    let zoomFinal = escalaProporcional * transformacoesAntesOverlay.zoom;

    let novaLargura = imgLargura * zoomFinal;
    let novaAltura = imgAltura * zoomFinal;

    let xFinal = ((canvasLargura - novaLargura) / 2) + transformacoesAntesOverlay.x;
    let yFinal = ((canvasAltura - novaAltura) / 2) + transformacoesAntesOverlay.y;

    ctx.drawImage(imgAntesObjeto, xFinal, yFinal, novaLargura, novaAltura);
    ctx.restore();
  }

  idAnimacaoCamera = requestAnimationFrame(() => loopRenderVisor(video, canvas, ctx));
}

function alternarLenteCamera() {
  modoCamera = (modoCamera === "environment") ? "user" : "environment";
  inicializarStreamCamera();
}

function resetarAjustesAntesOverlay() {
  transformacoesAntesOverlay = { zoom: 1, x: 0, y: 0 };
}

function atualizarOpacidadeLive(valor) {
  opacidadeLiveGlobal = valor / 100;
}

function atualizarOpacidadeMesa(valor) {
  const pAntes = document.getElementById("preview-antes");
  if(pAntes) pAntes.style.opacity = valor / 100;
}

function fecharCamera() {
  if (idAnimacaoCamera) {
    cancelAnimationFrame(idAnimacaoCamera);
    idAnimacaoCamera = null;
  }
  if (streamLocal) {
    streamLocal.getTracks().forEach(track => track.stop());
    streamLocal = null;
  }
  const boxCam = document.getElementById("container-camera-nativa");
  if (boxCam) boxCam.classList.add("hidden");
}

// =========================================================================
// ARRASTAR MESA PÓS-CAPTURA
// =========================================================================
function configurarArrastoMesa() {
  const areaArrastar = document.getElementById("area-arrastar");

  const iniciarArrasto = (e) => {
    arrastando = true;
    const touch = e.touches && e.touches.length ? e.touches[0] : e;
    inicioX = touch.clientX - transformacoes.x;
    inicioY = touch.clientY - transformacoes.y;
  };

  const moverArrasto = (e) => {
    if (!arrastando) return;
    if (e.cancelable) e.preventDefault(); 
    const touch = e.touches && e.touches.length ? e.touches[0] : e;
    transformacoes.x = touch.clientX - inicioX;
    transformacoes.y = touch.clientY - inicioY;
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
  if (transformacoes.zoom < 0.4) transformacoes.zoom = 0.4;
  if (transformacoes.zoom > 4.0) transformacoes.zoom = 4.0;
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