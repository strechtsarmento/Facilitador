document.addEventListener("DOMContentLoaded", () => {
  const dashboard = document.getElementById("dashboard");
  const telaInterna = document.getElementById("tela-interna");
  const tituloInterna = document.getElementById("titulo-interna");
  const conteudoInterna = document.getElementById("conteudo-interna");
  const btnVoltar = document.getElementById("btn-voltar");
  const grid = document.querySelector(".grid");

  // Banco de conteúdos para as telas cheias
  const conteudosTelas = {
    antesDepois: {
      titulo: "📸 Comparativo Visual",
      html: `
        <p style="text-align:center; opacity:0.7;">Arraste a barra central para avaliar a mudança física de 162.5kg para 131kg.</p>
        <div class="slider-wrapper">
          <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800" alt="Depois" />
          <div class="img-antes-container">
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800" alt="Antes" />
          </div>
          <input type="range" min="0" max="100" value="50" class="slider-barra" id="slider-foto" />
          <span class="label-foto antes">Antes (162,5 kg)</span>
          <span class="label-foto depois">Depois (131 kg)</span>
        </div>
      `,
      init: () => {
        const barra = document.getElementById("slider-foto");
        const containerAntes = document.querySelector(".img-antes-container");
        if(barra && containerAntes) {
          barra.addEventListener("input", (e) => {
            containerAntes.style.width = `${e.target.value}%`;
          });
        }
      }
    },
    alimentacao: {
      titulo: "🍽️ Diário Alimentar & Macros",
      html: `<p style="opacity:0.6;">Módulo de controle de refeições (Frango, Peixe, Feijão, Saladas) em desenvolvimento...</p>`
    },
    treinos: {
      titulo: "💪 Checklist de Atividades",
      html: `<p style="opacity:0.6;">Seu cronograma semanal de Musculação e Cardio em desenvolvimento...</p>`
    },
    medidas: {
      titulo: "📈 Histórico de Medidas",
      html: `<p style="opacity:0.6;">Acompanhamento antropométrico (Cintura, Braço, Peitoral) em desenvolvimento...</p>`
    }
  };

  // Evento para abrir a tela cheia correspondente
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (!card) return;

    const chave = card.dataset.tela;
    const telaConfig = conteudosTelas[chave];

    if (telaConfig) {
      // 1. Configura os textos e o layout interno
      tituloInterna.textContent = telaConfig.titulo;
      conteudoInterna.innerHTML = telaConfig.html;

      // 2. Transiciona a visualização (Esconde o index, abre a interna)
      dashboard.classList.add("hidden");
      telaInterna.classList.remove("hidden");

      // 3. Executa inicialização interna (como ligar os listeners do slider)
      if (typeof telaConfig.init === "function") {
        telaConfig.init();
      }
      
      // Rola para o topo da página
      window.scrollTo(0, 0);
    }
  });

  // Evento para voltar à home (reverte o processo)
  btnVoltar.addEventListener("click", () => {
    telaInterna.classList.add("hidden");
    dashboard.classList.remove("hidden");
  });
});