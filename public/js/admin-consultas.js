// Consultas: cambiar el estado, guardar la nota interna y borrar.
(() => {
  const { $$ } = window.EG;
  const { toast, pedir, confirmar, contadorConsultas } = window.ADM;

  const actualizar = (id, datos) => pedir(`/admin/consultas/${id}`, { metodo: "PATCH", datos });

  // Estado (nueva / contactado / cerrada)
  document.addEventListener("change", async (e) => {
    const sel = e.target.closest("[data-estado]");
    if (!sel) return;
    const card = sel.closest("[data-id]");
    const r = await actualizar(card.dataset.id, { estado: sel.value });
    if (!r.ok) return toast(r.mensaje || "No se pudo guardar", "error");
    card.className = `consulta consulta--${r.estado}`;
    sel.className = `estado-select estado-select--${r.estado}`;
    contadorConsultas(r.nuevas);
    toast("Estado actualizado");
  });

  // Al tocar "WhatsApp" en una consulta nueva, pasa sola a "contactado"
  document.addEventListener("click", async (e) => {
    const link = e.target.closest("[data-contactar]");
    if (!link) return;
    const card = link.closest("[data-id]");
    const sel = card.querySelector("[data-estado]");
    if (sel.value !== "nueva") return;
    sel.value = "contactado";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
  });

  // Nota interna: se guarda sola al dejar de escribir
  $$("[data-nota]").forEach((t) => {
    let espera;
    let ultimo = t.value;
    const guardar = async () => {
      if (t.value === ultimo) return;
      const card = t.closest("[data-id]");
      const r = await actualizar(card.dataset.id, { nota: t.value });
      if (!r.ok) return toast(r.mensaje || "No se pudo guardar la nota", "error");
      ultimo = t.value;
      t.classList.add("guardado");
      setTimeout(() => t.classList.remove("guardado"), 1200);
    };
    t.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(guardar, 900); });
    t.addEventListener("blur", () => { clearTimeout(espera); guardar(); });
  });

  // Borrar
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-borrar-consulta]");
    if (!btn) return;
    const card = btn.closest("[data-id]");
    const nombre = card.querySelector(".consulta__nombre").textContent;
    if (!(await confirmar(`Se va a borrar la consulta de ${nombre}. No se puede deshacer.`))) return;
    card.classList.add("borrando");
    const r = await pedir(`/admin/consultas/${card.dataset.id}`, { metodo: "DELETE" });
    if (!r.ok) {
      card.classList.remove("borrando");
      return toast("No se pudo borrar", "error");
    }
    card.remove();
    contadorConsultas(r.nuevas);
    toast("Consulta eliminada");
  });
})();
