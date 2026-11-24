// Fotos de clientes: título, visible, orden y borrar.
(() => {
  const { $, $$ } = window.EG;
  const { toast, pedir, confirmar } = window.ADM;

  // Muestra cuántas fotos se eligieron
  const campo = $("#campoClientes");
  campo?.addEventListener("change", () => {
    const n = campo.files.length;
    $("#elegidasClientes").textContent = n ? `${n} foto${n === 1 ? "" : "s"} elegida${n === 1 ? "" : "s"}` : "JPG, PNG o WEBP de hasta 4 MB";
  });
  $("#formClientes")?.addEventListener("submit", (e) => {
    const b = e.submitter || $("button[type=submit]", e.target);
    setTimeout(() => { b.disabled = true; b.lastChild.textContent = " Subiendo…"; });
  });

  const url = (el) => `/admin/clientes/${el.closest("[data-id]").dataset.id}`;

  // Título: se guarda al salir del campo o con Enter
  $$("[data-titulo]").forEach((input) => {
    let ultimo = input.value;
    const guardar = async () => {
      if (input.value === ultimo) return;
      const r = await pedir(url(input), { metodo: "PATCH", datos: { titulo: input.value } });
      if (!r.ok) return toast("No se pudo guardar el título", "error");
      ultimo = input.value;
      toast("Título guardado");
    };
    input.addEventListener("blur", guardar);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); input.blur(); } });
  });

  document.addEventListener("click", async (e) => {
    // Visible / oculta
    const sw = e.target.closest("[data-publicar]");
    if (sw) {
      const nuevo = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(nuevo));
      const r = await pedir(url(sw), { metodo: "PATCH", datos: { publicado: nuevo } });
      if (!r.ok) { sw.setAttribute("aria-checked", String(!nuevo)); return toast("No se pudo guardar", "error"); }
      sw.closest("[data-id]").classList.toggle("cliente-adm--oculto", !r.publicado);
      return toast(r.publicado ? "Visible en la web" : "Oculta en la web");
    }

    // Mover
    const mv = e.target.closest("[data-mover]");
    if (mv) {
      const dir = Number(mv.dataset.mover);
      const r = await pedir(`${url(mv)}/mover`, { metodo: "PATCH", datos: { direccion: dir } });
      if (!r.ok) return toast("No se pudo mover", "error");
      const li = mv.closest("[data-id]");
      if (dir < 0) li.previousElementSibling?.before(li);
      else li.nextElementSibling?.after(li);
      const items = $$("#listaClientes > li");
      items.forEach((it, i) => {
        $('[data-mover="-1"]', it).disabled = i === 0;
        $('[data-mover="1"]', it).disabled = i === items.length - 1;
      });
      return;
    }

    // Borrar
    const del = e.target.closest("[data-borrar]");
    if (del) {
      if (!(await confirmar("Se va a borrar esta foto de la sección Clientes."))) return;
      const li = del.closest("[data-id]");
      li.classList.add("borrando");
      const r = await pedir(url(del), { metodo: "DELETE" });
      if (!r.ok) { li.classList.remove("borrando"); return toast("No se pudo borrar", "error"); }
      li.remove();
      toast("Foto eliminada");
    }
  });
})();
