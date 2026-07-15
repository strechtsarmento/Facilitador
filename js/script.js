// =========================================================================
// VARIÁVEIS DE ESTADO GLOBAL
// =========================================================================
let transformacoes = { zoom: 1, x: 0, y: 0 }; 
let transformacoesAntesOverlay = { zoom: 1, x: 0, y: 0 }; 

let arrastando = false;
let arrastandoOverlayCam = false; 
let inicioX = 0, inicioY = 0;
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
// GESTÃO DE NAVEGAÇÃO E BOTÃO VOLTAR DO TELEFONE
// =========================================================================
window.addEventListener("popstate", (event) => {
  if (event.state && event.state.tela) {
    abrir(event.state.tela, false);
  } else {
    voltarParaMenu(false);
  }
});

function voltarParaMenu(pushHistory = true) {
  fecharCamera();
  document.getElementById("tela-inicial").classList.remove("hidden");
  document.getElementById("tela-modulo").classList.add("hidden");
  atualizarDashboard();
  if (pushHistory) {
    history.pushState(null, "", "");
  }
}

function abrir(tela, pushHistory = true) {
  fecharCamera();

  const telaInicial = document.getElementById("tela-inicial");
  const telaModulo = document.getElementById("tela-modulo");
  const tituloModulo = document.getElementById("titulo-modulo");
  const view = document.getElementById("view");

  const titulos = {
    seusDados: "📊 Seus Dados",
    antesDepois: "📸 Alinhamento Visual",
    galeria: "🖼️ Galeria de Fotos",
    upload: "⬆️ Upload de Arquivos",
    config: "⚙️ Configurações",
    historico: "🕓 Histórico de Atividades"
  };

  const telas = {
    seusDados: `
      <div class="bloco-etapa ativa">
        <div class="topo-etapa">
          <span class="badge-etapa" style="background: rgba(78, 168, 222, 0.15); color: #4ea8de;">Perfil</span>
          <h4>Informações de Progresso</h4>
        </div>
        <p class="sub-txt">Insira os seus dados para habilitar os cálculos em tempo real.</p>
        
        <div class="form-group">
          <label>Seu Peso Atual (kg):</label>
          <input type="number" id="input-peso" class="form-control" placeholder="Ex: 80.5" oninput="calcularIMC()">
        </div>
        
        <div class="form-group">
          <label>Seu Peso Alvo (kg):</label>
          <input type="number" id="input-peso-alvo" class="form-control" placeholder="Ex: 75.0">
        </div>
        
        <div class="form-group">
          <label>Altura (m):</label>
          <input type="number" id="input-altura" class="form-control" placeholder="Ex: 1.80" step="0.01" oninput="calcularIMC()">
        </div>
        
        <div id="display-imc" class="imc-display">Seu IMC: --</div>
        
        <div class="form-group" style="margin-top: 15px;">
          <label>Atividade Física Diária:</label>
          <select id="input-atividade" class="form-control">
            <option value="sedentario">Sedentário</option>
            <option value="leve">Levemente Ativo</option>
            <option value="moderado">Moderadamente Ativo</option>
            <option value="forca">Treino de Força / Musculação</option>
            <option value="intenso">Muito Ativo</option>
          </select>
        </div>

        <button class="btn-principal" style="background: #4ea8de; color: #fff;" onclick="salvarDadosPessoais()">Salvar Dados 💾</button>
      </div>
    `,
    antesDepois: `
      <div class="modulo-alinhamento">
        
        <div id="etapa-1" class="bloco-etapa ativa">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 1</span>
            <h4>Selecione a sua foto de ANTES</h4>
          </div>
          <p class="sub-txt">Como deseja carregar a imagem de referência antiga?</p>
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="abrirPainelCamera('antes')">📸 Usar Câmera</button>
            <label class="btn-origem label-file">
              📁 Escolher Arquivo
              <input type="file" id="f-antes" accept="image/*" style="display:none;" onchange="manipularArquivo(this, 'antes')"/>
            </label>
          </div>
        </div>

        <div id="etapa-1-confirmacao" class="bloco-etapa hidden">
          <div class="topo-etapa">
            <span class="badge-etapa" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">Atenção</span>
            <h4>Confirme sua foto</h4>
          </div>
          <img id="preview-antes-confirmacao" src="" style="width:100%; border-radius: 12px; margin-bottom: 15px;">
          <div class="grupo-botoes">
            <button class="btn-mini btn-reset" onclick="descartarFotoAntes()">Tirar Outra 📸</button>
            <button class="btn-mini" style="background: #04d361; color: #000;" onclick="confirmarFotoAntes()">Ficar com essa ✔️</button>
          </div>
        </div>

        <div id="etapa-2" class="bloco-etapa hidden">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 2</span>
            <h4>Selecione a foto de DEPOIS</h4>
          </div>
          <p class="sub-txt">Tire a foto atual alinhando o visor transparente.</p>
          
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="abrirPainelCamera('depois')">📸 Abrir Visor Alinhado</button>
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
              <span>Opacidade Overlay:</span>
              <input type="range" id="opacidade-live-range" min="10" max="90" value="50" oninput="atualizarOpacidadeLive(this.value)" />
            </div>
            <button class="btn-reset-cam-link" onclick="resetarAjustesAntesOverlay()">🔄 Resetar Zoom/Posição</button>
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
          Gerar Comparação Revelação ⚡
        </button>

        <div id="container-slider-final" class="hidden">
          <hr style="border-color: rgba(255,255,255,0.05); margin: 30px 0;">
          <h3>↔️ Painel de Interação Final</h3>
          
          <div class="slider-wrapper" id="slider-wrapper-box">
            <div class="slider-camada camada-antes-fundo">
              <div id="render-antes" class="img-render"></div>
            </div>
            
            <div class="slider-camada camada-depois-topo" id="clip-depois-container" style="width: 50%;">
              <div id="render-depois" class="img-render"></div>
            </div>
            
            <div class="linha-divisoria-visual" id="linha-divisoria-visual" style="left: 50%;"></div>
            
            <input type="range" min="0" max="100" value="50" class="barra-divisoria" id="controle-slider-barra" />
            
            <span class="etiqueta-foto a">Antes</span>
            <span class="etiqueta-foto d">Depois</span>
          </div>
          <button class="btn-link" onclick="abrir('antesDepois')">🔄 Nova Comparação</button>
        </div>
      </div>
    `,
    galeria: `
      <h3>🖼️ Sua Galeria</h3>
      <p class='sub-txt'>Últimas imagens salvas.</p>
      <div id="itens-galeria-local"></div>
    `,
    upload: "<h3>⬆️ Fazer Upload</h3><p class='sub-txt'>Arraste seus arquivos para cá.</p>",
    config: "<h3>⚙️ Ajustes</h3><p class='sub-txt'>Configurações gerais da aplicação.</p>",
    historico: "<h3>🕓 Seu Histórico</h3><p class='sub-txt'>Lista de ações recentes executadas.</p>"
  };

  tituloModulo.innerText = titulos[tela] || "Módulo";
  view.innerHTML = telas[tela] || `<p>Conteúdo indisponível</p>`;
  
  telaInicial.classList.add("hidden");
  telaModulo.classList.remove("hidden");
  
  if (pushHistory) {
    history.pushState({ tela: tela }, "", "");
  }

  // Inicializações Específicas
  if (tela === 'seusDados') carregarDadosPessoais();
  if (tela === 'galeria') carregarGaleriaUI();
}

// =========================================================================
// MÓDULO SEUS DADOS (IMC E DASHBOARD)
// =========================================================================
function calcularIMC() {
  const peso = parseFloat(document.getElementById('input-peso').value);
  const altura = parseFloat(document.getElementById('input-altura').value);
  const display = document.getElementById('display-imc');
  
  if (peso && altura) {
    const imc = (peso / (altura * altura)).toFixed(1);
    display.innerText = `Seu IMC: ${imc}`;
  } else {
    display.innerText = "Seu IMC: --";
  }
}

function salvarDadosPessoais() {
  const dados = {
    peso: document.getElementById('input-peso').value,
    pesoAlvo: document.getElementById('input-peso-alvo').value,
    altura: document.getElementById('input-altura').value,
    atividade: document.getElementById('input-atividade').value
  };
  localStorage.setItem('seus_dados', JSON.stringify(dados));
  alert("Dados guardados com sucesso!");
  voltarParaMenu(false);
}

function carregarDadosPessoais() {
  const dados = JSON.parse(localStorage.getItem('seus_dados')) || {};
  if (dados.peso) document.getElementById('input-peso').value = dados.peso;
  if (dados.pesoAlvo) document.getElementById('input-peso-alvo').value = dados.pesoAlvo;
  if (dados.altura) document.getElementById('input-altura').value = dados.altura;
  if (dados.atividade) document.getElementById('input-atividade').value = dados.atividade;
  calcularIMC();
}

function atualizarDashboard() {
  const dados = JSON.parse(localStorage.getItem('seus_dados')) || {};
  const text = document.getElementById('dashboard-progress-text');
  const fill = document.getElementById('dashboard-progress-fill');
  
  if (dados.peso && dados.pesoAlvo) {
    const peso = parseFloat(dados.peso);
    const alvo = parseFloat(dados.pesoAlvo);
    // Lógica simples: se o alvo é menor (perda de peso), inverte a barra
    let perc = (alvo / peso) * 100; 
    if (peso < alvo) perc = (peso / alvo) * 100; // Ganho de peso
    
    if (perc > 100) perc = 100;
    
    fill.style.width = `${perc}%`;
    text.innerText = `Progresso: ${peso}kg 🎯 Alvo: ${alvo}kg`;
  } else {
    fill.style.width = `0%`;
    text.innerText = `Preencha para calcular o seu progresso`;
  }
}

// =========================================================================
// MÓDULO GALERIA LOCAL
// =========================================================================
function salvarNaGaleriaLocal(fotoAntes, fotoDepois = null) {
  let galeria = JSON.parse(localStorage.getItem("galeria_local") || "[]");
  const novoItem = {
    id: Date.now(),
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    antes: fotoAntes,
    depois: fotoDepois
  };
  galeria.unshift(novoItem);
  localStorage.setItem("galeria_local", JSON.stringify(galeria));
}

function carregarGaleriaUI() {
  const container = document.getElementById("itens-galeria-local");
  if (!container) return;
  
  let galeria = JSON.parse(localStorage.getItem("galeria_local") || "[]");
  if (galeria.length === 0) {
    container.innerHTML = `<p class="sub-txt" style="text-align:center;">Nenhuma imagem salva ainda.</p>`;
    return;
  }

  container.innerHTML = galeria.map(item => `
    <div class="card-galeria-item">
      <div class="mini-grid-preview">
        <img src="${item.antes}" class="${!item.depois ? 'full' : ''}" />
        ${item.depois ? `<img src="${item.depois}" />` : ''}
      </div>
      <div class="footer-item-galeria">
        <span>📅 ${item.dataCriacao}</span>
        <button class="btn-mini btn-reset" style="flex: 0; padding: 4px 8px;" onclick="deletarItemGaleria(${item.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function deletarItemGaleria(id) {
  let galeria = JSON.parse(localStorage.getItem("galeria_local") || "[]");
  galeria = galeria.filter(item => item.id !== id);
  localStorage.setItem("galeria_local", JSON.stringify(galeria));
  carregarGaleriaUI();
}

// =========================================================================
// LÓGICA DE FOTOS E CONFIRMAÇÕES
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

function receberImagemAntes(dataUrl) {
  fotoAntesData = dataUrl;
  document.getElementById("preview-antes-confirmacao").src = dataUrl;
  
  document.getElementById("etapa-1").classList.remove("ativa");
  document.getElementById("etapa-1").classList.add("hidden");
  
  document.getElementById("etapa-1-confirmacao").classList.remove("hidden");
}

function descartarFotoAntes() {
  fotoAntesData = "";
  document.getElementById("etapa-1-confirmacao").classList.add("hidden");
  document.getElementById("etapa-1").classList.remove("hidden");
  document.getElementById("etapa-1").classList.add("ativa");
}

function confirmarFotoAntes() {
  // Salva imediatamente a foto base de "Antes" na galeria local
  salvarNaGaleriaLocal(fotoAntesData);
  
  imgAntesObjeto = new Image();
  imgAntesObjeto.src = fotoAntesData;
  document.getElementById("preview-antes").src = fotoAntesData;

  document.getElementById("etapa-1-confirmacao").classList.add("hidden");
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

    video.play();

    const btnDisparar = document.getElementById("btn-disparar-foto");
    btnDisparar.onclick = () => {
      const capturarFotoFinal = () => {
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
      };

      if (modoCamera === "user") {
        executarContagemRegressiva(5, capturarFotoFinal);
      } else {
        capturarFotoFinal();
      }
    };

  } catch (err) {
    alert("Acesso à câmera negado.");
    document.getElementById("container-camera-nativa").classList.add("hidden");
  }
}

function executarContagemRegressiva(segundos, callbackFinal) {
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

function configurarArrastoOverlayCamera(canvasElement) {
  const obterDistanciaTouches = (t1, t2) => Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  const obterCoordenadasCanvas = (e) => {
    const rect = canvasElement.getBoundingClientRect();
    const touch = e.touches && e.touches.length ? e.touches[0] : e;
    return {
      x: ((touch.clientX - rect.left) / rect.width) * canvasElement.width,
      y: ((touch.clientY - rect.top) / rect.height) * canvasElement.height
    };
  };

  const iniciarToqueCam = (e) => {
    if (alvoAtualCamera !== 'depois') return;

    if (e.touches && e.touches.length === 2) {
      arrastandoOverlayCam = false; 
      distanciaPinchInicial = obterDistanciaTouches(e.touches[0], e.touches[1]);
      zoomInicialCam = transformacoesAntesOverlay.zoom;
    } else {
      arrastandoOverlayCam = true;
      const coords = obterCoordenadasCanvas(e);
      inicioX = coords.x - transformacoesAntesOverlay.x;
      inicioY = coords.y - transformacoesAntesOverlay.y;
    }
  };

  const moverToqueCam = (e) => {
    if (e.cancelable && e.target === canvasElement) e.preventDefault();

    if (e.touches && e.touches.length === 2) {
      const novaDistancia = obterDistanciaTouches(e.touches[0], e.touches[1]);
      if (distanciaPinchInicial > 0) {
        let novoZoom = zoomInicialCam * (novaDistancia / distanciaPinchInicial);
        transformacoesAntesOverlay.zoom = Math.max(0.3, Math.min(novoZoom, 5.0));
      }
    } else if (arrastandoOverlayCam) {
      const coords = obterCoordenadasCanvas(e);
      transformacoesAntesOverlay.x = coords.x - inicioX;
      transformacoesAntesOverlay.y = coords.y - inicioY;
    }
  };

  const pararToqueCam = () => { arrastandoOverlayCam = false; distanciaPinchInicial = 0; };

  canvasElement.addEventListener("mousedown", iniciarToqueCam);
  canvasElement.addEventListener("mousemove", moverToqueCam);
  window.addEventListener("mouseup", pararToqueCam);
  canvasElement.addEventListener("touchstart", iniciarToqueCam, { passive: false });
  canvasElement.addEventListener("touchmove", moverToqueCam, { passive: false });
  window.addEventListener("touchend", pararToqueCam);
}

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
    let escala = Math.max(canvas.width / imgAntesObjeto.width, canvas.height / imgAntesObjeto.height) * transformacoesAntesOverlay.zoom;
    let nW = imgAntesObjeto.width * escala;
    let nH = imgAntesObjeto.height * escala;
    ctx.drawImage(imgAntesObjeto, ((canvas.width - nW) / 2) + transformacoesAntesOverlay.x, ((canvas.height - nH) / 2) + transformacoesAntesOverlay.y, nW, nH);
    ctx.restore();
  }
  idAnimacaoCamera = requestAnimationFrame(() => loopRenderVisor(video, canvas, ctx));
}

function alternarLenteCamera() {
  modoCamera = (modoCamera === "environment") ? "user" : "environment";
  inicializarStreamCamera();
}

function resetarAjustesAntesOverlay() { transformacoesAntesOverlay = { zoom: 1, x: 0, y: 0 }; }
function atualizarOpacidadeLive(valor) { opacidadeLiveGlobal = valor / 100; }
function atualizarOpacidadeMesa(valor) { document.getElementById("preview-antes").style.opacity = valor / 100; }

function fecharCamera() {
  if (idAnimacaoCamera) cancelAnimationFrame(idAnimacaoCamera);
  if (streamLocal) streamLocal.getTracks().forEach(track => track.stop());
  streamLocal = null;
  const boxCam = document.getElementById("container-camera-nativa");
  if (boxCam) boxCam.classList.add("hidden");
}

function configurarArrastoMesa() {
  const areaArrastar = document.getElementById("area-arrastar");
  if (!areaArrastar) return;

  let distPinchInicialMesa = 0, zoomInicialMesa = 1;

  const iniciarArrasto = (e) => {
    if (e.touches && e.touches.length === 2) {
      arrastando = false;
      distPinchInicialMesa = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      zoomInicialMesa = transformacoes.zoom;
    } else {
      arrastando = true;
      const touch = e.touches && e.touches.length ? e.touches[0] : e;
      inicioX = touch.clientX - transformacoes.x;
      inicioY = touch.clientY - transformacoes.y;
    }
  };

  const moverArrasto = (e) => {
    if (e.touches && e.touches.length === 2) {
      if (distPinchInicialMesa > 0) {
        let novaDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        transformacoes.zoom = Math.max(0.4, Math.min(zoomInicialMesa * (novaDist / distPinchInicialMesa), 4.0));
        atualizarEstilosCamadaDepois();
      }
    } else if (arrastando) {
      if (e.cancelable) e.preventDefault(); 
      const touch = e.touches && e.touches.length ? e.touches[0] : e;
      transformacoes.x = touch.clientX - inicioX;
      transformacoes.y = touch.clientY - inicioY;
      atualizarEstilosCamadaDepois();
    }
  };

  const pararArrasto = () => { arrastando = false; distPinchInicialMesa = 0; };

  areaArrastar.addEventListener("mousedown", iniciarArrasto);
  areaArrastar.addEventListener("mousemove", moverArrasto);
  window.addEventListener("mouseup", pararArrasto);
  areaArrastar.addEventListener("touchstart", iniciarArrasto, { passive: false });
  areaArrastar.addEventListener("touchmove", moverArrasto, { passive: false });
  window.addEventListener("touchend", pararArrasto);
}

function ajustarZoomDepois(fator) {
  transformacoes.zoom = Math.max(0.4, Math.min(transformacoes.zoom + fator, 4.0));
  atualizarEstilosCamadaDepois();
}

function resetarAjustesDepois() { transformacoes = { zoom: 1, x: 0, y: 0 }; atualizarEstilosCamadaDepois(); }
function atualizarEstilosCamadaDepois() {
  const camada = document.getElementById("container-movivel");
  if (camada) camada.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;
}

// SLIDER FINAL COM BOTÃO INFERIOR
function consolidarSlider() {
  const containerSlider = document.getElementById("container-slider-final");
  const wrapper = document.getElementById("slider-wrapper-box");

  document.getElementById("render-antes").style.backgroundImage = `url(${fotoAntesData})`;
  
  const rDepois = document.getElementById("render-depois");
  rDepois.style.backgroundImage = `url(${fotoDepoisData})`;
  rDepois.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;

  containerSlider.classList.remove("hidden");

  const larguraReal = wrapper.offsetWidth;
  document.querySelectorAll(".img-render").forEach(img => { img.style.width = `${larguraReal}px`; });

  const barraSlider = document.getElementById("controle-slider-barra");
  const clipDepoisContainer = document.getElementById("clip-depois-container");
  const linhaDivisoria = document.getElementById("linha-divisoria-visual");
  
  barraSlider.addEventListener("input", (e) => { 
    clipDepoisContainer.style.width = `${e.target.value}%`; 
    linhaDivisoria.style.left = `${e.target.value}%`;
  });
  
  // Rola suavemente para baixo para o utilizador ver o resultado
  containerSlider.scrollIntoView({ behavior: "smooth" });
}

// Inicializa a barra de progresso no arranque da app
window.onload = () => {
  atualizarDashboard();
};