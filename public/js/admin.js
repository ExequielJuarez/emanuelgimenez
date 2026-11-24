// Panel: avisos (toast), confirmación antes de borrar y los interruptores
// "Publicado" / "Destacado" de la lista de vehículos.
(() => {
  const { $, $$, abrirModal, cerrarModal } = window.EG;

  // ── Aviso flotante ──────────────────────────────────────
  let tTimer;
  function toast(mensaje, tipo = "ok") {
    const el = $("#toast");
    el.textContent = mensaje;
    el.className = `toast toast--${tipo}`;
    requestAnimationFrame(() => el.classList.add("visible"));
    clearTimeout(tTimer);
    tTimer = setTimeout(() => el.classList.remove("visible"), 3200);
  }
  const flash = $("#flash");
  if (flash) toast(flash.dataset.mensaje, flash.dataset.tipo);

  // ── Pedido JSON al servidor: devuelve { ok, ...datos } sin tirar error ──
  async function pedir(url, { metodo = "GET", datos } = {}) {
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: { Accept: "application/json", ...(datos ? { "Content-Type": "application/json" } : {}) },
        body: datos ? JSON.stringify(datos) : undefined,
      });
      if (r.status === 401) {
        location.href = `/admin/login?volver=${encodeURIComponent(location.pathname)}`;
        return { ok: false };
      }
      const json = await r.json().catch(() => ({}));
      return { ok: r.ok && json.ok !== false, ...json };
    } catch {
      return { ok: false, mensaje: "No hay conexión. Probá de nuevo." };
    }
  }

  // ── Confirmación propia (no usa confirm() del navegador) ──
  const modalConfirmar = $("#modalConfirmar");
  let alConfirmar = null;
  function confirmar(texto, { titulo = "¿Seguro?", boton = "Eliminar" } = {}) {
    return new Promise((resolver) => {
      $("#confirmarTitulo").textContent = titulo;
      $("#confirmarTexto").textContent = texto;
      $("#confirmarSi").textContent = boton;
      alConfirmar = resolver;
      abrirModal(modalConfirmar);
      setTimeout(() => $("#confirmarSi").focus(), 50);
    });
  }
  $("#confirmarSi").addEventListener("click", () => {
    const r = alConfirmar;
    alConfirmar = null;
    cerrarModal(modalConfirmar);
    r?.(true);
  });
  // Cancelar / Esc / tocar afuera = no
  new MutationObserver(() => {
    if (modalConfirmar.hidden && alConfirmar) { alConfirmar(false); alConfirmar = null; }
  }).observe(modalConfirmar, { attributes: true, attributeFilter: ["hidden"] });

  // Formularios con data-confirmar="texto" piden confirmación antes de enviarse
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (!form.dataset.confirmar || form.dataset.confirmado) return;
    e.preventDefault();
    if (await confirmar(form.dataset.confirmar)) {
      form.dataset.confirmado = "1";
      form.closest(".auto")?.classList.add("borrando");
      form.submit();
    }
  });

  // ── Interruptores Publicado / Destacado ─────────────────
  document.addEventListener("click", async (e) => {
    const sw = e.target.closest("[data-alternar]");
    if (!sw) return;
    const fila = sw.closest("[data-id]");
    const campo = sw.dataset.alternar;
    const antes = sw.getAttribute("aria-checked") === "true";
    // Se cambia al toque y se vuelve atrás si falla
    sw.setAttribute("aria-checked", String(!antes));
    sw.setAttribute("aria-busy", "true");
    const r = await pedir(`/admin/vehiculos/${fila.dataset.id}/${campo}`, { metodo: "PATCH" });
    sw.removeAttribute("aria-busy");
    if (!r.ok) {
      sw.setAttribute("aria-checked", String(antes));
      return toast(r.mensaje || "No se pudo guardar", "error");
    }
    sw.setAttribute("aria-checked", String(r[campo]));
    fila.classList.toggle("auto--oculto", !r.publicado);
    toast(
      campo === "publicado"
        ? r.publicado ? "Publicado en la web" : "Oculto: ya no se ve en la web"
        : r.destacado ? "Agregado a Destacados" : "Quitado de Destacados"
    );
  });

  // Actualiza los contadores de consultas nuevas (menú y pestañas)
  function contadorConsultas(n) {
    $$("[data-contador-consultas]").forEach((el) => {
      el.textContent = n;
      if (el.classList.contains("adm-nav__n")) el.hidden = !n;
    });
  }

  window.ADM = { toast, pedir, confirmar, contadorConsultas };
})();
