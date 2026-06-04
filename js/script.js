document.addEventListener("DOMContentLoaded", () => {
  const view = document.getElementById("view");
  const grid = document.querySelector(".grid");

  const telas = {
    antesDepois: "📸 Modo comparação de imagens ativado",
    galeria: "🖼️ Abrindo galeria...",
    upload: "⬆️ Envie suas imagens aqui",
    config: "⚙️ Configurações do app",
    historico: "🕓 Histórico carregado"
  };

  // Event delegation: escuta cliques na grid inteira
  grid.addEventListener("click", (event) => {
    // Garante que pegamos o botão, mesmo se clicar no texto dentro dele
    const card = event.target.closest(".card");
    
    if (!card) return;

    const telaChave = card.dataset.tela;
    const mensagem = telas[telaChave] || "Nada aqui ainda";

    // Atualiza o conteúdo do painel
    view.innerHTML = `<p>${mensagem}</p>`;
  });
});