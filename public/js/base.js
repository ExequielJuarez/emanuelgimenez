// Comportamiento común a todas las páginas: menú del celular, modales,
// "Consultar con asesor" (formulario + WhatsApp) y link activo del menú.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ── Bloqueo del scroll de fondo (cuenta cuántas capas hay abiertas) ──
  let capas = 0;
  const bloquearScroll = (si) => {
    capas = Math.max(0, capas + (si ? 1 : -1));
    document.body.classList.toggle("sin-scroll", capas > 0);
  };

  // ═════════ MODALES ═════════
  const abiertos = [];
  const enfocables = 'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

  function abrirModal(modal) {
    if (!modal || !modal.hidden) return;
    modal._volverA = document.activeElement;
    modal.hidden = false;
    bloquearScroll(true);
    abiertos.push(modal);
    requestAnimationFrame(() => modal.classList.add("visible"));
    const caja = $(".modal__caja", modal);
    if (caja) caja.scrollTop = 0;
    // Foco en el primer campo (en celular no, para que no salte el teclado)
    const primero = window.matchMedia("(hover: hover)").matches ? $("input:not([type=hidden]), textarea", modal) : null;
    (primero || $("[data-cerrar]", modal))?.focus({ preventScroll: true });
  }

  function cerrarModal(modal, { devolverFoco = true } = {}) {
    if (!modal || modal.hidden) return;
    modal.classList.remove("visible");
    const i = abiertos.indexOf(modal);
    if (i >= 0) abiertos.splice(i, 1);
    bloquearScroll(false);
    setTimeout(() => (modal.hidden = true), 200);
    if (devolverFoco && modal._volverA && document.contains(modal._volverA)) modal._volverA.focus({ preventScroll: true });
  }

  // Cerrar: botón [data-cerrar], clic en el fondo oscuro o tecla Esc
  document.addEventListener("click", (e) => {
    const cerrar = e.target.closest("[data-cerrar]");
    if (cerrar) return cerrarModal(cerrar.closest(".modal"));
    if (e.target.classList.contains("modal")) cerrarModal(e.target);
  });
  document.addEventListener("keydown", (e) => {
    const modal = abiertos[abiertos.length - 1];
    if (e.key === "Escape") {
      if (modal) cerrarModal(modal);
      else if (drawer?.classList.contains("abierto")) cerrarMenu();
      return;
    }
    // Mantener el Tab dentro del modal abierto
    if (e.key === "Tab" && modal) {
      const lista = $$(enfocables, modal).filter((el) => el.offsetParent !== null);
      if (!lista.length) return;
      const [primero, ultimo] = [lista[0], lista[lista.length - 1]];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });

  // ═════════ MENÚ DEL CELULAR ═════════
  const drawer = $("#drawer");
  const fondo = $("#drawerFondo");
  const btnMenu = $("#btnMenu");

  function abrirMenu() {
    fondo.hidden = false;
    drawer.inert = false;
    drawer.setAttribute("aria-hidden", "false");
    btnMenu.setAttribute("aria-expanded", "true");
    bloquearScroll(true);
    requestAnimationFrame(() => {
      fondo.classList.add("visible");
      drawer.classList.add("abierto");
    });
    $("#drawerCerrar")?.focus({ preventScroll: true });
  }
  function cerrarMenu() {
    if (!drawer.classList.contains("abierto")) return;
    fondo.classList.remove("visible");
    drawer.classList.remove("abierto");
    drawer.inert = true;
    drawer.setAttribute("aria-hidden", "true");
    btnMenu.setAttribute("aria-expanded", "false");
    bloquearScroll(false);
    setTimeout(() => (fondo.hidden = true), 250);
  }
  if (drawer && btnMenu) {
    btnMenu.addEventListener("click", abrirMenu);
    fondo.addEventListener("click", cerrarMenu);
    $("#drawerCerrar")?.addEventListener("click", cerrarMenu);
    // Tocar un link o botón del menú lo cierra
    drawer.addEventListener("click", (e) => { if (e.target.closest("a, [data-asesor]")) cerrarMenu(); });
    // Si se agranda la pantalla (girar la tablet) se cierra solo
    window.matchMedia("(min-width: 900px)").addEventListener("change", (m) => m.matches && cerrarMenu());
  }

  // ═════════ CONSULTAR CON ASESOR ═════════
  const modalAsesor = $("#modalAsesor");
  const form = $("#formAsesor");
  const listo = $("#asesorListo");
  const aviso = $("#asesorAviso");

  function limpiarErrores() {
    $$(".campo", form).forEach((c) => c.classList.remove("con-error"));
    $$("[data-error]", form).forEach((el) => (el.textContent = ""));
    aviso.hidden = true;
  }
  function mostrarError(campo, texto) {
    const el = $(`[data-error="${campo}"]`, form);
    if (el) {
      el.textContent = texto;
      el.closest(".campo")?.classList.add("con-error");
    }
  }

  // Cualquier botón con data-asesor="motivo" abre el formulario con ese motivo
  function abrirAsesor(motivo, vehiculo = "") {
    $("#asesorMotivo").textContent = motivo;
    $("#asesorMotivoInput").value = motivo;
    $("#asesorVehiculoInput").value = vehiculo || "";
    form.hidden = false;
    listo.hidden = true;
    limpiarErrores();
    abrirModal(modalAsesor);
  }
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-asesor]");
    if (!btn) return;
    e.preventDefault();
    abrirAsesor(btn.dataset.asesor || "Asesoramiento Comercial", btn.dataset.vehiculo);
  });

  // Validación rápida en el navegador (el servidor vuelve a validar)
  function validar() {
    limpiarErrores();
    let ok = true;
    const nombre = form.nombre.value.trim();
    const tel = form.telefono.value.trim();
    if (!nombre) { mostrarError("nombre", "Escribí tu nombre"); ok = false; }
    if (!tel) { mostrarError("telefono", "Dejanos un teléfono"); ok = false; }
    else if (!/^[0-9 +()-]{6,20}$/.test(tel)) { mostrarError("telefono", "Revisá el número (solo números, espacios o guiones)"); ok = false; }
    if (!ok) $(".con-error input, .con-error textarea", form)?.focus();
    return ok;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validar()) return;
      const enviar = $('button[type="submit"]', form);
      enviar.disabled = true;
      try {
        const r = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const datos = await r.json().catch(() => ({}));
        if (!r.ok || !datos.ok) {
          Object.entries(datos.errores || {}).forEach(([campo, err]) => mostrarError(campo, err.msg));
          if (!datos.errores) { aviso.textContent = datos.mensaje || "No pudimos enviar la consulta. Probá de nuevo."; aviso.hidden = false; }
          return;
        }
        form.reset();
        form.hidden = true;
        listo.hidden = false;
        $("[data-cerrar]", listo)?.focus({ preventScroll: true });
      } catch {
        aviso.textContent = "No hay conexión. Probá de nuevo o escribinos por WhatsApp.";
        aviso.hidden = false;
      } finally {
        enviar.disabled = false;
      }
    });

    // "Iniciar chat por WhatsApp": abre el chat con el motivo ya escrito
    $("#asesorWhatsapp").addEventListener("click", () => {
      const nombre = form.nombre.value.trim() || "un cliente";
      const motivo = $("#asesorMotivoInput").value;
      const nota = form.mensaje.value.trim();
      const texto = `Hola ${form.dataset.concesionaria}! Soy ${nombre}, quiero consultar con un asesor por: ${motivo}${nota ? ". " + nota : ""}`;
      window.open(`https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
    });
  }

  // ═════════ LINK ACTIVO DEL MENÚ SEGÚN LA SECCIÓN VISIBLE ═════════
  const links = $$(".nav a");
  const secciones = links.map((a) => $(a.hash)).filter(Boolean);
  if (secciones.length && "IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("activo", a.hash === "#" + en.target.id));
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    secciones.forEach((s) => obs.observe(s));
  }

  window.EG = { $, $$, abrirModal, cerrarModal, abrirAsesor };
})();
