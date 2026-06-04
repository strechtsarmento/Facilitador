// Variáveis globais para controlar o estado da transformação da foto "Depois"
let transformacoes = { zoom: 1, x: 0, y: 0 };
let arrastando = false;
let inicioX = 0, inicioY = 0;

function abrir(tela) {
  const view = document.getElementById("view");

  const telas = {
    antesDepois: `
      <div class="modulo-alinhamento">
        <h3 style="margin-top:0; color:#fff;">📸 Mesa de Alinhamento e Comparação</h3>
        <p style="font-size:0.9rem; opacity:0.7; margin-bottom:20px;">
          1. Carregue as duas fotos. <br>
          2. Clique e arraste na imagem (ou use os botões) para alinhar os contornos do "Depois" sobre o "Antes". <br>
          3. Clique em Gerar Slider para ver o efeito de revelação.
        </p>
        
        <div class="controles-arquivos">
          <div class="campo-foto">
            <label>1️⃣ Foto Base (Antes):</label>
            <input type="file" id="f-antes" accept="image/*" />
          </div>
          <div class="campo-foto">
            <label>2️⃣ Foto Atual (Depois):</label>
            <input type="file" id="f-depois" accept="image/*" />
          </div>
        </div>

        <div class="controles-edicao">
          <div class="grupo-botoes">
            <button onclick="ajustarZoom(0.1)">🔍 Zoom +</button>
            <button onclick="ajustarZoom(-0.1)">🔍 Zoom -</button>
            <button onclick="resetarAjustes()">🔄 Resetar</button>
          </div>
          <div class="grupo-slider-opacidade">
            <label>Opacidade do Alinhamento:</label>
            <input type="range" id="opacidade-ajuste" min="10" max="90" value="50" />
          </div>
        </div>

        <div class="canvas-alinhamento" id="area-arrastar">
          <img id="preview-antes" class="img-base-alinhamento" src="" style="display:none;" />
          
          <div id="container-movivel" class="camada-movivel" style="transform: translate(0px, 0px) scale(1); opacity: 0.5;">
            <img id="preview-depois" src="" style="display:none;" />
          </div>
        </div>

        <button id="btn-gerar-slider" class="btn-principal" onclick="consolidarSlider()" disabled>
          Gerar Slider de Comparação ⚡
        </button>

        <div id="container-slider-final" class="hidden">
          <hr style="border-color: rgba(255,255,255,0.08); margin: 30px 0;">
          <h3>↔️ Efeito Revelação (Imagens Fixas)</h3>
          
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
    configurarMesaAlinhamento();
  }
}

function configurarMesaAlinhamento() {
  const fAntes = document.getElementById("f-antes");
  const fDepois = document.getElementById("f-depois");
  const pAntes = document.getElementById("preview-antes");
  const pDepois = document.getElementById("preview-depois");
  const opacidadeRange = document.getElementById("opacidade-ajuste");
  const containerMovivel = document.getElementById("container-movivel");
  const areaArrastar = document.getElementById("area-arrastar");

  fAntes.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => { 
        pAntes.src = evt.target.result; 
        pAntes.style.display = "block"; 
        verificarImagensCarregadas(); 
      };
      r.readAsDataURL(file);
    }
  });

  fDepois.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (evt) => { 
        pDepois.src = evt.target.result; 
        pDepois.style.display = "block"; 
        verificarImagensCarregadas(); 
      };
      r.readAsDataURL(file);
    }
  });

  opacidadeRange.addEventListener("input", (e) => {
    containerMovivel.style.opacity = e.target.value / 100;
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

// CORRIGIDO: Variável pDepois estava como pLater inviabilizando a ativação do botão
function verificarImagensCarregadas() {
  const pAntes = document.getElementById("preview-antes").src;
  const pDepois = document.getElementById("preview-depois").src;
  const btn = document.getElementById("btn-gerar-slider");
  
  if (pAntes && pDepois && pAntes !== "" && pDepois !== "") {
    btn.disabled = false;
  }
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
  const pAntes = document.getElementById("preview-antes").src;
  const pDepois = document.getElementById("preview-depois").src;
  const containerSlider = document.getElementById("container-slider-final");
  const wrapper = document.getElementById("slider-wrapper-box");

  // Injeta o "Antes" estático no fundo
  document.getElementById("render-antes").style.backgroundImage = `url(${pAntes})`;
  
  // Injeta o "Depois" na camada de topo e aplica o alinhamento calibrado
  const rDepois = document.getElementById("render-depois");
  rDepois.style.backgroundImage = `url(${pDepois})`;
  rDepois.style.transform = `translate(${transformacoes.x}px, ${transformacoes.y}px) scale(${transformacoes.zoom})`;

  containerSlider.classList.remove("hidden");

  // Força o tamanho interno da imagem a bater exatamente com o tamanho real renderizado do wrapper (evita bugs no mobile)
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