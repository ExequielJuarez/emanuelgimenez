// Formulario de alta / edición de un vehículo: puntos de miles, km en 0km,
// vista previa de las fotos nuevas (con arrastrar y soltar) y aviso al salir sin guardar.
(() => {
  const { $, $$ } = window.EG;
  const { toast } = window.ADM;
  const form = $("#formVehiculo");
  if (!form) return;

  const MAX = 10;
  const MB = 4;
  const TIPOS = ["image/jpeg", "image/png", "image/webp"];

  // ── 46500 → 46.500 mientras se escribe ──────────────────
  $$("[data-miles]", form).forEach((input) => {
    input.addEventListener("input", () => {
      const solo = input.value.replace(/\D/g, "").slice(0, 10);
      input.value = solo ? Number(solo).toLocaleString("es-AR") : "";
    });
  });

  // ── 0km: los kilómetros quedan en 0 ─────────────────────
  const condicion = $("#campoCondicion");
  const grupoKm = $("#grupoKm");
  const km = $("input", grupoKm);
  function revisarKm() {
    const cero = condicion.value === "0km";
    grupoKm.classList.toggle("deshabilitado", cero);
    km.readOnly = cero;
    if (cero) km.value = "0";
  }
  condicion.addEventListener("change", revisarKm);
  revisarKm();

  // ── Fotos nuevas: vista previa y quitar antes de subir ──
  const campo = $("#campoImagenes");
  const zona = $("#zonaSubir");
  const lista = $("#fotosNuevas");
  let archivos = [];

  const actuales = () => $$("#fotosActuales .foto").filter((f) => !$(".foto__borrar input", f).checked).length;

  function sincronizar() {
    // El input de archivos se arma con la lista elegida (DataTransfer)
    const dt = new DataTransfer();
    archivos.forEach((f) => dt.items.add(f));
    campo.files = dt.files;

    lista.querySelectorAll("img").forEach((img) => URL.revokeObjectURL(img.src));
    lista.innerHTML = "";
    archivos.forEach((f, i) => {
      const li = document.createElement("li");
      li.className = "foto";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      const etiqueta = document.createElement("span");
      etiqueta.className = "foto__nueva";
      etiqueta.textContent = "Nueva";
      const quitar = document.createElement("button");
      quitar.type = "button";
      quitar.className = "foto__quitar";
      quitar.setAttribute("aria-label", `Quitar ${f.name}`);
      quitar.innerHTML = '<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
      quitar.addEventListener("click", () => { archivos.splice(i, 1); sincronizar(); });
      li.append(img, etiqueta, quitar);
      lista.append(li);
    });
    lista.hidden = archivos.length === 0;
  }

  function agregar(nuevos) {
    let descartadas = 0;
    for (const f of nuevos) {
      if (!TIPOS.includes(f.type)) { descartadas++; continue; }
      if (f.size > MB * 1024 * 1024) { toast(`«${f.name}» pesa más de ${MB} MB`, "error"); continue; }
      if (actuales() + archivos.length >= MAX) { toast(`Máximo ${MAX} fotos por vehículo`, "error"); break; }
      archivos.push(f);
    }
    if (descartadas) toast("Solo se pueden subir fotos JPG, PNG o WEBP", "error");
    sincronizar();
  }

  campo.addEventListener("change", () => agregar([...campo.files].filter((f) => !archivos.includes(f))));
  ["dragenter", "dragover"].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add("arrastrando"); }));
  ["dragleave", "drop"].forEach((ev) => zona.addEventListener(ev, () => zona.classList.remove("arrastrando")));
  zona.addEventListener("drop", (e) => { e.preventDefault(); agregar([...e.dataTransfer.files]); });

  // Si marca para borrar la portada, se pasa la portada a la primera que queda
  $$("#fotosActuales .foto__borrar input").forEach((chk) =>
    chk.addEventListener("change", () => {
      const fotos = $$("#fotosActuales .foto");
      const portada = fotos.find((f) => $(".foto__portada input", f).checked);
      if (portada && $(".foto__borrar input", portada).checked) {
        const otra = fotos.find((f) => !$(".foto__borrar input", f).checked);
        if (otra) $(".foto__portada input", otra).checked = true;
      }
    })
  );

  // ── Aviso si se va sin guardar ──────────────────────────
  let cambios = false;
  form.addEventListener("input", () => (cambios = true));
  form.addEventListener("change", () => (cambios = true));
  window.addEventListener("beforeunload", (e) => { if (cambios) e.preventDefault(); });

  // Al guardar: se desactivan los botones para no mandarlo dos veces
  form.addEventListener("submit", (e) => {
    cambios = false;
    const boton = e.submitter;
    setTimeout(() => $$("button[type=submit]", form).forEach((b) => (b.disabled = true)));
    if (boton && archivos.length) boton.lastChild.textContent = " Subiendo fotos…";
  });
})();
