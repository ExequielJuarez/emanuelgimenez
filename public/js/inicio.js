// Inicio: carrusel de destacados, buscador + filtros + orden, "Ver todo" y ficha de la unidad.
(() => {
  const { $, $$, abrirModal, cerrarModal, abrirAsesor } = window.EG;

  // ═════════ CARRUSEL DE DESTACADOS ═════════
  const carrusel = $("#carrusel");
  const flechas = $$("[data-carrusel]");

  function actualizarFlechas() {
    const fin = carrusel.scrollWidth - carrusel.clientWidth - 4;
    flechas.forEach((f) => {
      const dir = Number(f.dataset.carrusel);
      f.disabled = dir < 0 ? carrusel.scrollLeft <= 4 : carrusel.scrollLeft >= fin;
    });
  }
  if (carrusel) {
    flechas.forEach((f) =>
      f.addEventListener("click", () => {
        carrusel.scrollBy({ left: Number(f.dataset.carrusel) * carrusel.clientWidth * 0.85, behavior: "smooth" });
      })
    );
    // Flechas del teclado cuando el carrusel tiene el foco
    carrusel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        carrusel.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * carrusel.clientWidth * 0.85, behavior: "smooth" });
      }
    });
    let t;
    carrusel.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(actualizarFlechas, 60); }, { passive: true });
    window.addEventListener("resize", actualizarFlechas);
    actualizarFlechas();
  }

  // ═════════ BUSCADOR, FILTROS Y ORDEN ═════════
  const grilla = $("#grilla");
  const tarjetas = $$(".tarjeta", grilla);
  const vistaPrevia = Number(grilla.dataset.vistaPrevia) || 6;
  const verMas = $("#verMas");
  const sinResultados = $("#sinResultados");
  const contador = $("#contador");
  const contadorFiltros = $("#contadorFiltros");
  const btnVerTodo = $("#btnVerTodo");
  const btnVerTodoTexto = $("#btnVerTodoTexto");
  const btnFiltros = $("#btnFiltros");
  const panelFiltros = $("#panelFiltros");

  const campos = {
    texto: $("#fBuscar"),
    marca: $("#fMarca"),
    precioMin: $("#fPrecioMin"),
    precioMax: $("#fPrecioMax"),
    anioMin: $("#fAnioMin"),
    anioMax: $("#fAnioMax"),
    orden: $("#fOrden"),
  };

  let verTodo = false;

  // Quita tildes y pasa a minúsculas para buscar sin importar cómo se escriba
  const normalizar = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const numero = (v) => (v === "" || v == null ? null : Number(v));

  const ORDENES = {
    destacados: (a, b) => a.orden - b.orden,
    nuevos: (a, b) => b.anio - a.anio || a.orden - b.orden,
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
  };

  const datos = tarjetas.map((el) => ({
    el,
    orden: Number(el.dataset.orden),
    texto: normalizar(el.dataset.texto),
    marca: el.dataset.marca,
    anio: Number(el.dataset.anio),
    precio: Number(el.dataset.precio),
  }));

  function filtrosActivos() {
    return [campos.marca.value, campos.precioMin.value, campos.precioMax.value, campos.anioMin.value, campos.anioMax.value].filter((v) => v !== "").length;
  }

  function aplicar({ animar = true } = {}) {
    const texto = normalizar(campos.texto.value);
    const marca = campos.marca.value;
    const pMin = numero(campos.precioMin.value);
    const pMax = numero(campos.precioMax.value);
    const aMin = numero(campos.anioMin.value);
    const aMax = numero(campos.anioMax.value);

    const lista = datos
      .filter((v) => {
        if (texto && !texto.split(/\s+/).every((p) => v.texto.includes(p))) return false;
        if (marca && v.marca !== marca) return false;
        if (pMin !== null && v.precio < pMin) return false;
        if (pMax !== null && v.precio > pMax) return false;
        if (aMin !== null && v.anio < aMin) return false;
        if (aMax !== null && v.anio > aMax) return false;
        return true;
      })
      .sort(ORDENES[campos.orden.value] || ORDENES.destacados);

    const nFiltros = filtrosActivos();
    const hayFiltro = !!texto || nFiltros > 0;
    // Sin filtros y sin "Ver todo" se muestra solo una vista previa del stock
    const mostrarTodo = verTodo || hayFiltro;
    const visibles = mostrarTodo ? lista : lista.slice(0, vistaPrevia);

    // Reordenar y mostrar/ocultar las tarjetas (ya vienen renderizadas desde el servidor)
    const visiblesSet = new Set(visibles);
    lista.forEach((v) => grilla.appendChild(v.el));
    datos.forEach((v) => (v.el.hidden = !visiblesSet.has(v)));

    contador.textContent = lista.length;
    contadorFiltros.textContent = nFiltros;
    contadorFiltros.hidden = nFiltros === 0;
    sinResultados.hidden = lista.length > 0;
    grilla.hidden = lista.length === 0;
    verMas.hidden = mostrarTodo || lista.length <= vistaPrevia;

    if (animar) {
      grilla.classList.remove("filtrando");
      void grilla.offsetWidth;
      grilla.classList.add("filtrando");
    }
  }

  // Escribir en el buscador filtra al instante (con una pequeña espera)
  let espera;
  campos.texto.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(aplicar, 150); });
  [campos.precioMin, campos.precioMax].forEach((c) => c.addEventListener("input", () => { clearTimeout(espera); espera = setTimeout(aplicar, 250); }));
  [campos.marca, campos.anioMin, campos.anioMax, campos.orden].forEach((c) => c.addEventListener("change", () => aplicar()));

  // Botón "Buscar" / Enter: aplica y baja hasta los resultados
  $("#buscador").addEventListener("submit", (e) => {
    e.preventDefault();
    aplicar();
    campos.texto.blur(); // cierra el teclado del celular
    (grilla.hidden ? sinResultados : grilla).scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Desplegable de filtros
  btnFiltros.addEventListener("click", () => {
    const abrir = panelFiltros.hidden;
    panelFiltros.hidden = !abrir;
    btnFiltros.setAttribute("aria-expanded", String(abrir));
    if (abrir) {
      panelFiltros.classList.remove("abriendo");
      void panelFiltros.offsetWidth;
      panelFiltros.classList.add("abriendo");
    }
  });

  function limpiar() {
    Object.entries(campos).forEach(([k, c]) => (c.value = k === "orden" ? "destacados" : ""));
    aplicar();
  }
  document.addEventListener("click", (e) => { if (e.target.closest("[data-limpiar]")) limpiar(); });

  // ═════════ VER TODO / VISTA PREVIA ═════════
  function ponerVerTodo(si, { bajar = false } = {}) {
    verTodo = si;
    btnVerTodoTexto.textContent = si ? "Ver menos" : "Ver todo";
    btnVerTodo.setAttribute("aria-expanded", String(si));
    aplicar();
    if (bajar) $("#vehiculos-disp").scrollIntoView({ behavior: "smooth" });
  }
  btnVerTodo.addEventListener("click", () => ponerVerTodo(!verTodo));

  // "Ver stock", "Vehículos Disponibles" y "Ver todo el stock": abren el catálogo completo
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-ver-todo]");
    if (link) {
      e.preventDefault();
      ponerVerTodo(true, { bajar: true });
      history.replaceState(null, "", "#vehiculos-disp");
      return;
    }
    // "Inicio" y "Destacados" vuelven a la vista previa
    if (e.target.closest("[data-vista-inicio]") && verTodo) ponerVerTodo(false);
  });

  // ═════════ FICHA DE LA UNIDAD ═════════
  const fichas = JSON.parse($("#datosFichas").textContent || "{}");
  const modalFicha = $("#modalFicha");

  // Galería de fotos de la ficha
  const galeria = { fotos: [], i: 0, titulo: "" };
  function mostrarFoto(i) {
    const n = galeria.fotos.length;
    galeria.i = (i + n) % n;
    const img = $("#fichaImg");
    img.src = galeria.fotos[galeria.i];
    img.alt = `${galeria.titulo} — foto ${galeria.i + 1} de ${n}`;
    $("#fichaContador").textContent = `${galeria.i + 1} / ${n}`;
  }
  $$("[data-foto]", modalFicha).forEach((b) => b.addEventListener("click", () => mostrarFoto(galeria.i + Number(b.dataset.foto))));
  // Deslizar con el dedo sobre la foto
  let toqueX = null;
  const fotoFicha = $(".ficha__foto", modalFicha);
  fotoFicha.addEventListener("touchstart", (e) => (toqueX = e.touches[0].clientX), { passive: true });
  fotoFicha.addEventListener("touchend", (e) => {
    if (toqueX === null || galeria.fotos.length < 2) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 40) mostrarFoto(galeria.i + (dx < 0 ? 1 : -1));
    toqueX = null;
  });
  document.addEventListener("keydown", (e) => {
    if (modalFicha.hidden || galeria.fotos.length < 2) return;
    if (e.key === "ArrowRight") mostrarFoto(galeria.i + 1);
    if (e.key === "ArrowLeft") mostrarFoto(galeria.i - 1);
  });

  function abrirFicha(id) {
    const f = fichas[id];
    if (!f) return;
    galeria.fotos = f.imagenes;
    galeria.titulo = f.titulo;
    $("#fichaGaleria").hidden = f.imagenes.length < 2;
    mostrarFoto(0);
    // Precarga las demás fotos para que el cambio sea instantáneo
    f.imagenes.slice(1).forEach((u) => (new Image().src = u));
    $("#fichaEtiqueta").textContent = f.etiqueta;
    $("#fichaTitulo").textContent = f.titulo;
    $("#fichaSub").textContent = f.sub;
    $("#fichaPrecio").textContent = f.precio;
    $("#fichaKm").textContent = f.km;
    $("#fichaTrans").textContent = f.transmision;
    $("#fichaComb").textContent = f.combustible;
    $("#fichaDesc").textContent = f.descripcion;
    $("#fichaAsesor").dataset.motivo = f.motivo;
    $("#fichaAsesor").dataset.vehiculo = id;
    abrirModal(modalFicha);
  }
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-ficha]");
    if (el && !e.target.closest("[data-asesor]")) abrirFicha(el.dataset.ficha);
  });
  $("#fichaAsesor").addEventListener("click", (e) => {
    cerrarModal(modalFicha, { devolverFoco: false });
    abrirAsesor(e.currentTarget.dataset.motivo, e.currentTarget.dataset.vehiculo);
  });

  // ═════════ CLIENTES: carrusel + visor de fotos ═════════
  const listaClientes = $("#clientesLista");
  if (listaClientes) {
    $$("[data-clientes]").forEach((f) =>
      f.addEventListener("click", () =>
        listaClientes.scrollBy({ left: Number(f.dataset.clientes) * listaClientes.clientWidth * 0.9, behavior: "smooth" })
      )
    );
    const fotosClientes = JSON.parse($("#datosClientes").textContent || "[]");
    const modalCliente = $("#modalCliente");
    const visorImg = $("#visorImg");
    let actual = 0;
    const verCliente = (i) => {
      actual = (i + fotosClientes.length) % fotosClientes.length;
      const f = fotosClientes[actual];
      visorImg.src = f.url;
      visorImg.alt = f.titulo ? `Entrega a ${f.titulo}` : "Foto de cliente";
    };
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cliente]");
      if (b) { verCliente(Number(b.dataset.cliente)); abrirModal(modalCliente); }
      const v = e.target.closest("[data-visor]");
      if (v) verCliente(actual + Number(v.dataset.visor));
    });
    document.addEventListener("keydown", (e) => {
      if (modalCliente.hidden || fotosClientes.length < 2) return;
      if (e.key === "ArrowRight") verCliente(actual + 1);
      if (e.key === "ArrowLeft") verCliente(actual - 1);
    });
    let x0 = null;
    modalCliente.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
    modalCliente.addEventListener("touchend", (e) => {
      if (x0 === null || fotosClientes.length < 2) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) verCliente(actual + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  // Si se entra con /#vehiculos-disp (o desde /vehiculos) se muestra todo el stock
  if (location.hash === "#vehiculos-disp") verTodo = true, btnVerTodoTexto.textContent = "Ver menos", btnVerTodo.setAttribute("aria-expanded", "true");
  aplicar({ animar: false });
})();
