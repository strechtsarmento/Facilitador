document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("dashboard");
  const telaInterna = document.getElementById("tela-interna");
  const tituloInterna = document.getElementById("titulo-interna");
  const conteudoInterna = document.getElementById("conteudo-interna");
  const btnVoltar = document.getElementById("btn-voltar");
  const grid = document.querySelector(".grid");

  let streamLocal = null; // Guarda a câmera ativa para poder fechar depois

  // Configurações das Telas Cheias internas
  const conteudosTelas = {
    antesDepois: {
      titulo: "📸 Alinhamento Visivo Completo",
      html: `
        <p style="text-align:center; opacity:0.7; margin-bottom: 15px;">
          Adicione uma imagem de base e use a opacidade para alinhar a nova captura com precisão de contornos.
        </p>

        <div class="controles-alinhamento">
          <div class="campo-upload">
            <label>1️⃣ Carregar Foto Base (Antes):</label>
            <input type="file" id="upload-antes" accept="image/*" />
          </div>
          <div class="campo-upload">
            <label>2️⃣ Opacidade da Foto Fantasma: <span id="val-opacidade">50%</span></label>
            <input type="range" id="range-opacidade" min="0" max="100" value="50" />
          </div>
        </div>

        <div class="camera-box">
          <video id="webcam" autoplay playsinline></video>
          <img id="img-overlay" class="hidden" alt="Overlay Fantasma" />
          <canvas id="canvas-foto" class="hidden"></canvas>
        </div>

        <div class="botoes-camera">
          <button id="btn-ligar-camera" class="btn-acao azul">Ativar Câmera</button>
          <button id="btn-capturar" class="btn-acao verde hidden">📸 Tirar Foto Atual</button>
        </div>

        <div id="resultado-captura" class="hidden" style="margin-top:25px; text-align:center;">
          <h3>⚡ Nova Foto Alinhada com Sucesso!</h3>
          <img id="img-depois-final" src="" style="max-width:100%; max-height:400px; border-radius:12px; border:2px solid #10b981;" />
          <p style="font-size:0.85rem; opacity:0.6; margin-top:5px;">Esta imagem foi salva como seu "Depois".</p>
        </div>

        <button id="btn-limpar-fotos" class="btn-limpar">Resetar Imagens Salvas</button>
      `,
      init: () => {
        const uploadAntes = document.getElementById("upload-antes");
        const rangeOpacidade = document.getElementById("range-opacidade");
        const valOpacidade = document.getElementById("val-opacidade");
        const imgOverlay = document.getElementById("img-overlay");
        const video = document.getElementById("webcam");
        const canvas = document.getElementById("canvas-foto");
        const btnLigar = document.getElementById("btn-ligar-camera");
        const btnCapturar = document.getElementById("btn-capturar");
        const resultadoCaptura = document.getElementById("resultado-captura");
        const imgDepoisFinal = document.getElementById("img-depois-final");
        const btnLimpar = document.getElementById("btn-limpar-fotos");

        // Tenta buscar imagem do Antes salva localmente
        const fotoSalva = localStorage.getItem("foto-antes");
        if (fotoSalva) {
          imgOverlay.src = fotoSalva;
          imgOverlay.classList.remove("hidden");
        }

        // Recupera também a última tirada (Se houver)
        const ultimaFotoDepois = localStorage.getItem("foto-depois");
        if (ultimaFotoDepois) {
          imgDepoisFinal.src = ultimaFotoDepois;
          resultadoCaptura.classList.remove("hidden");
        }

        // Listener de upload do "Antes"
        uploadAntes.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              imgOverlay.src = event.target.result;
              imgOverlay.classList.remove("hidden");
              localStorage.setItem("foto-antes", event.target.result);
            };
            reader.readAsDataURL(file);
          }
        });

        // Controle do slider de opacidade
        rangeOpacidade.addEventListener("input", (e) => {
          const valor = e.target.value;
          valOpacidade.textContent = `${valor}%`;
          imgOverlay.style.opacity = valor / 100;
        });

        // Evento de disparo e ativação da Webcam
        btnLigar.addEventListener("click", async () => {
          try {
            streamLocal = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: "environment" }, // Força a câmera traseira no smartphone
              audio: false
            });
            video.srcObject = streamLocal;
            btnLigar.classList.add("hidden");
            btnCapturar.classList.remove("hidden");
          } catch (err) {
            alert("Acesso negado ou câmera indisponível.");
            console.error(err);
          }
        });

        // Captura o frame e gera o JPEG final
        btnCapturar.addEventListener("click", () => {
          if (!streamLocal) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL("image/jpeg");
          imgDepoisFinal.src = dataUrl;
          resultadoCaptura.classList.remove("hidden");
          
          localStorage.setItem("foto-depois", dataUrl);

          // Desliga o hardware da câmera
          streamLocal.getTracks().forEach(track => track.stop());
          btnLigar.classList.remove("hidden");
          btnCapturar.classList.add("hidden");
        });

        // Limpa tudo
        btnLimpar.addEventListener("click", () => {
          localStorage.removeItem("foto-antes");
          localStorage.removeItem("foto-depois");
          imgOverlay.src = "";
          imgOverlay.classList.add("hidden");
          imgDepoisFinal.src = "";
          resultadoCaptura.classList.add("hidden");
        });
      }
    },
    alimentacao: {
      titulo: "🍽️ Diário Alimentar & Macros",
      html: `<p style="opacity:0.6; text-align:center;">Painel para inserção de porções (Frango, feijão, vegetais) em desenvolvimento.</p>`
    },
    treinos: {
      titulo: "💪 Checklist de Treinos",
      html: `<p style="opacity:0.6; text-align:center;">Seu cronograma de treinos semanais (Musculação e Cardio) em breve.</p>`
    },
    medidas: {
      titulo: "📈 Histórico de Medidas",
      html: `<p style="opacity:0.6; text-align:center;">Gráficos de progresso para medidas antropométricas e peso em breve.</p>`
    }
  };

  // Escuta os cliques na Grid para abrir as seções em tela cheia
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    const chave = card.dataset.tela;
    const config = conteudosTelas[chave];

    if (config) {
      tituloInterna.textContent = config.titulo;
      conteudoInterna.innerHTML = config.html;

      dashboard.classList.add("hidden");
      telaInterna.classList.remove("hidden");

      if (typeof config.init === "function") {
        config.init();
      }
      window.scrollTo(0, 0);
    }
  });

  // Botão de Voltar à página inicial
  btnVoltar.addEventListener("click", () => {
    // Se o usuário voltar com a câmera ativa, desliga ela antes de sair
    if (streamLocal) {
      streamLocal.getTracks().forEach(track => track.stop());
      streamLocal = null;
    }
    telaInterna.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });
});