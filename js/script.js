document.addEventListener("DOMContentLoaded", () => {
  const view = document.getElementById("view");
  const grid = document.querySelector(".grid");

  // Estruturas HTML dinâmicas para cada tela
  const telas = {
    antesDepois: `
      <div class="antes-depois-container">
        <h3>📸 Comparativo de Fotos</h3>
        <p>Arraste o slider para alternar entre as fotos</p>
        
        <div class="slider-wrapper">
          <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800" alt="Depois" class="img-depois" />
          
          <div class="img-antes-container">
            <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800" alt="Antes" class="img-antes" />
          </div>
          
          <input type="range" min="0" max="100" value="50" class="slider-barra" id="slider-foto" />
          
          <span class="label-foto antes">Antes (162,5 kg)</span>
          <span class="label-foto depois">Depois (131 kg)</span>
        </div>
      </div>
    `,
    galeria: "🖼️ Em breve: Gráficos de evolução de peso e medidas.",
    upload: "⬆️ Em breve: Upload de novas fotos e pesagem diária.",
    config: "⚙️ Em breve: Diário alimentar e contagem de macros.",
    historico: "🕓 Em breve: Histórico de treinos e checklists."
  };

  // Função para ativar o comportamento arrastável do slider
  function inicializarSlider() {
    const sliderBarra = document.getElementById("slider-foto");
    const imgAntesContainer = document.querySelector(".img-antes-container");

    if (!sliderBarra || !imgAntesContainer) return;

    sliderBarra.addEventListener("input", (e) => {
      const valor = e.target.value;
      // Ajusta a largura do container da imagem da frente dinamicamente
      imgAntesContainer.style.width = `${valor}%`;
    });
  }

  // Event Delegation para os cliques nos cards
  grid.addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    if (!card) return;

    const telaChave = card.dataset.tela;
    view.innerHTML = telas[telaChave] || "<p>Nada aqui ainda</p>";

    // Se a tela escolhida for o Antes e Depois, ativa a lógica do slider
    if (telaChave === "antesDepois") {
      inicializarSlider();
    }
  });
});