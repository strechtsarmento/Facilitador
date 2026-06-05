// Variáveis de estado global do módulo Antes e Depois
let transformacoes = { zoom: 1, x: 0, y: 0 };
let arrastando = false;
let inicioX = 0, inicioY = 0;
let streamLocal = null;
let fotoAntesData = "";
let fotoDepoisData = "";

function abrir(tela) {
  const view = document.getElementById("view");

  // Resetar estados ao mudar de tela
  fecharCamera();

  const telas = {
    antesDepois: `
      <div class="modulo-alinhamento">
        <h3 style="margin-top:0; color:#fff;">📸 Comparador Cirúrgico por Etapas</h3>
        
        <div id="etapa-1" class="bloco-etapa ativa">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 1</span>
            <h4>Selecione a sua foto de ANTES</h4>
          </div>
          <p class="Sub-txt">Como deseja carregar a imagem de referência antiga?</p>
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="ativarCameraCaptura('antes')">📷 Tirar Foto Agora</button>
            <label class="btn-origem label-file">
              📁 Escolher do Arquivo
              <input type="file" id="f-antes" accept="image/*" style="display:none;"/>
            </label>
          </div>
        </div>

        <div id="etapa-2" class="bloco-etapa hidden">
          <div class="topo-etapa">
            <span class="badge-etapa">Passo 2</span>
            <h4>Selecione a foto de DEPOIS e Alinhe</h4>
          </div>
          <p class="Sub-txt">Carregue a foto atual. Ela ficará por baixo do "Antes" para que possa ajustar a posição.</p>
          
          <div class="grupo-botoes-origem">
            <button class="btn-origem" onclick="ativarCameraCaptura('depois')">📷 Tirar Foto Agora</button>
            <label class="btn-origem label-file">
              📁 Escolher do Arquivo
              <input type="file" id="f-depois" accept="image/*" style="display:none;"/>
            </label>
          </div>

          <div id="painel-edicao-controles" class="hidden">
            <div class="controles-edicao">
              <div class="grupo-botoes">
                <button onclick="ajustarZoom(0.1)">🔍 Zoom +</button>
                <button onclick="ajustarZoom(-0.1)">🔍 Zoom -</button>
                <button onclick="resetarAjustes()">🔄 Resetar</button>
              </div>
              <div class="grupo-slider-opacidade">
                <label>Opacidade do Antes (Overlay):</label>
                <input type="range" id="opacidade-ajuste" min="10" max="90" value="50" />
              </div>
            </div>
          </div>
        </div>

        <div id="container-camera-nativa" class="hidden">
          <div class="camera-box-stream">
            <video id="video-stream" autoplay playsinline></video>
            <div class="target-blur"></div>
          </div>
          <button id="btn-disparar-foto" class="btn-principal verde">🔴 Capturar Frame</button>
          <button class="btn-link" onclick="fecharCamera()">Cancelar Câmera</button>
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
          <h3>↔️ Efeito Revelação Perfeito</h3>
          
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
          <button class="btn-link" style="margin-top:15px;" onclick="abrir('antesDepois')">🔄 Reiniciar Processo</button>
        </div>
      </div>
    `,
    galeria: "🖼️ <h3>Galeria</h3><p>Suas imagens salvas no banco de dados local.</p>",
    upload: "⬆️ <h3>Upload</h3><p>Envie novas fotos de progresso aqui.</p>",
    config: "⚙️ <h3>Configurações</h3><p>Ajustes do sistema do Facilitador.</p>",
    historico: "🕓 <h3>Histórico</h3><p>Suas ações recentes carregadas.</p>"
  };

  view.innerHTML = telas[tela] || `<p>Nada aqui ainda</p>`;

  if (tela === 'antesDepois') {
    inicializarListenersFicheiros();
  }
}

// Configuração inicial para capturar uploads de arquivos
function inicializarListenersFicheiros() {
  const fAntes = document.getElementById("f-antes");
  const fDepois = document.getElementById("f-depois");

  fAntes.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => { receberImagemAntes(evt.target.result); };
      r.readAsDataURL(file);
    }
  });

  fDepois.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => { receberImagemDepois(evt.target.result); };
      r.readAsDataURL(file);
    }
  });
}

// Trata a imagem do Antes recebida (via arquivo ou câmera)
function receberImagemAntes(dataUrl) {
  fotoAntesData = dataUrl;
  const pAntes = document.getElementById("preview-antes");
  pAntes.src = dataUrl;
  
  // Passa para a Etapa 2 ocultando a 1
  document.getElementById("etapa-1").classList.remove("ativa");
  document.getElementById("etapa-1").classList.add("hidden");
  
  document.getElementById("etapa-2").classList.remove("hidden");
  document.getElementById("etapa-2").classList.add("ativa");
}

// Trata a imagem do Depois recebida (via arquivo ou câmera)
function receberImagemDepois(dataUrl) {
  fotoDepoisData = dataUrl;
  const pDepois = document.getElementById("preview-depois");
  pDepois.src = dataUrl;

  // Mostra a mesa de alinhamento e controles de edição
  document.getElementById("area-arrastar").classList.remove("hidden");
  document.getElementById("painel-edicao-controles").classList.remove("hidden");
  document.getElementById("btn-gerar-slider").classList.remove("hidden");

  configurarArrastoMesa();
}

// Gerencia ativação da WebCam / Câmera do Telemóvel
async function ativarCameraCaptura(alvo) {
  fecharCamera(); // Segurança
  const boxCam = document.getElementById("container-camera-nativa");
  boxCam.classList.remove("hidden");

  try {
    streamLocal = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    const video = document.getElementById("video-stream");
    video.srcObject = streamLocal;

    const btnDisparar = document.getElementById("btn-disparar-foto");
    // Remove listeners antigos para evitar duplicações
    const novoBtn = btnDisparar.cloneNode(true);
    btnDisparar.parentNode.replaceChild(novoBtn, btnDisparar);

    novoBtn.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const resultadoData = canvas.toDataURL("image/jpeg");

      fecharCamera();

      if (alvo === 'antes') {
        receberImagemAntes(resultadoData);
      } else {
        receberImagemDepois(resultadoData);
      }
    });

  } catch (err) {
    alert("Não foi possível aceder à câmara do dispositivo.");
    boxCam.classList.add("hidden");
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

// Ativa listeners de toque/arrasto na mesa de edição
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
    atualizarEstilosCamada();
  };

  const pararArrasto = () => { arrastando = false; };

  areaArrastar.addEventListener("mousedown", iniciarArrasto);
  areaArrastar.addEventListener("mousemove", moverArrasto);
  window.addEventListener("mouseup", pararArrasto);

  areaArrastar.addEventListener("touchstart", iniciarArrasto, { passive: false });
  areaArrastar.addEventListener("touchmove", moverArrasto, { passive: false });
  window.addEventListener("touchend", pararArrasto);
}

function ajustarZoom(fator) {
  transformacoes.zoom += fator;
  if (transformacoes.zoom < 0.1) transformacoes.zoom = 0.1;
  atualizarEstilosCamada();
}

function resetarAjustes() {
  transformacoes = { zoom: 1, x: 0, y: 0 };
  atualizarEstilosCamada();
}

function atualizarEstilosCamada() {
  const camada = document.getElementById("container-movivel");
  if (camada) {
    camada.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;
  }
}

function consolidarSlider() {
  const containerSlider = document.getElementById("container-slider-final");
  const wrapper = document.getElementById("slider-wrapper-box");

  // O Antes vai estático para o fundo
  document.getElementById("render-antes").style.backgroundImage = `url(${fotoAntesData})`;
  
  // O Depois vai para cima aplicando as correções milimétricas feitas no container-movível
  const rDepois = document.getElementById("render-depois");
  rDepois.style.backgroundImage = `url(${fotoDepoisData})`;
  rDepois.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;

  containerSlider.classList.remove("hidden");

  // Trava largura da imagem interna para o corte limpo de revelação
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