// ===== Datos (se guardan en el navegador con localStorage) =====
const CLAVE_PRODUCTOS = "sicof_productos";
const CLAVE_CARRITO = "sicof_carrito";

const productosIniciales = [
  { id: 1, nombre: "Leche entera 1L", categoria: "Lácteos", precio: 2000, stock: 40 },
  { id: 2, nombre: "Manzana roja (kg)", categoria: "Frutas y verduras", precio: 8000, stock: 25 },
  { id: 3, nombre: "Pan de molde", categoria: "Panadería", precio: 5000, stock: 4 },
];

let productos = cargar(CLAVE_PRODUCTOS, productosIniciales);
let carrito = cargar(CLAVE_CARRITO, []);

function cargar(clave, porDefecto) {
  try {
    const dato = JSON.parse(localStorage.getItem(clave));
    return Array.isArray(dato) ? dato : porDefecto;
  } catch {
    return porDefecto;
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(productos));
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch { /* almacenamiento no disponible */ }
}

// ===== Elementos =====
const form = document.getElementById("formProducto");
const inputId = document.getElementById("productoId");
const inputNombre = document.getElementById("nombre");
const inputCategoria = document.getElementById("categoria");
const inputPrecio = document.getElementById("precio");
const inputStock = document.getElementById("cantidad");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tabla = document.getElementById("tablaProductos");
const vacio = document.getElementById("vacio");
const buscador = document.getElementById("buscador");
const contador = document.getElementById("contadorCarrito");
const toast = document.getElementById("toast");

// ===== Utilidades =====
function aviso(texto) {
  toast.textContent = texto;
  toast.classList.add("visible");
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function escapar(texto) {
  const d = document.createElement("div");
  d.textContent = texto;
  return d.innerHTML;
}

// ===== READ: mostrar productos =====
function mostrar() {
  const q = buscador.value.trim().toLowerCase();
  const lista = productos.filter(
    (p) => p.nombre.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q)
  );

  tabla.innerHTML = lista
    .map(
      (p) => `
      <tr>
        <td>${escapar(p.nombre)}</td>
        <td>${escapar(p.categoria)}</td>
        <td>${formatoCOP.format(p.precio)}</td>
        <td class="${p.stock <= 5 ? "stock-bajo" : ""}">${p.stock}</td>
        <td class="acciones">
          <button class="b-add" data-accion="carrito" data-id="${p.id}">Añadir</button>
          <button data-accion="editar" data-id="${p.id}">Editar</button>
          <button class="b-del" data-accion="eliminar" data-id="${p.id}">Eliminar</button>
        </td>
      </tr>`
    )
    .join("");

  vacio.hidden = lista.length > 0;
  contador.textContent = carrito.reduce((total, i) => total + i.cantidad, 0);
}
const formatoCOP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

// ===== CREATE y UPDATE =====
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const categoria = inputCategoria.value;
  const precio = Number(inputPrecio.value);
  const stock = Number(inputStock.value);

  if (!nombre || !categoria || inputPrecio.value === "" ||
      inputStock.value === "" || precio < 0 || stock < 0 ||
      !Number.isFinite(precio) || !Number.isInteger(stock)) {
    aviso("Completa todos los campos correctamente");
    return;
  }

  const datos = { nombre, categoria, precio, stock };

  if (inputId.value) {
    const id = Number(inputId.value);
    productos = productos.map(p =>
      p.id === id ? { ...p, ...datos } : p
    );
    aviso("Producto actualizado correctamente");
  } else {
    const nuevoId = productos.length
      ? Math.max(...productos.map(p => p.id)) + 1
      : 1;

    productos.push({ id: nuevoId, ...datos });
    aviso("Producto agregado correctamente");
  }

  guardar();
  limpiarFormulario();
  mostrar();
});
  guardar();
  limpiarFormulario();
  mostrar();
});

function limpiarFormulario() {
  form.reset();
  inputId.value = "";
  btnGuardar.textContent = "Agregar producto";
  btnCancelar.hidden = true;
}

btnCancelar.addEventListener("click", limpiarFormulario);

// ===== Acciones de la tabla: editar, eliminar, añadir al carrito =====
tabla.addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const producto = productos.find((p) => p.id === id);
  if (!producto) return;

  if (boton.dataset.accion === "editar") {
    inputId.value = producto.id;
    inputNombre.value = producto.nombre;
    inputCategoria.value = producto.categoria;
    inputPrecio.value = producto.precio;
    inputStock.value = producto.stock;
    btnGuardar.textContent = "Guardar cambios";
    btnCancelar.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
    inputNombre.focus();
  }

  if (boton.dataset.accion === "eliminar") {
    // DELETE
    if (confirm(`¿Eliminar "${producto.nombre}"?`)) {
      productos = productos.filter((p) => p.id !== id);
      carrito = carrito.filter((i) => i.id !== id);
      guardar();
      mostrar();
      aviso("Producto eliminado");
    }
  }

  if (boton.dataset.accion === "carrito") {
    const enCarrito = carrito.find((i) => i.id === id);
    const cantidadActual = enCarrito ? enCarrito.cantidad : 0;
    if (cantidadActual >= producto.stock) {
      aviso("No hay más stock disponible");
      return;
    }
    if (enCarrito) enCarrito.cantidad++;
    else carrito.push({ id, cantidad: 1 });
    guardar();
    mostrar();
    aviso(`${producto.nombre} añadido al carrito`);
  }
});

buscador.addEventListener("input", mostrar);


/* ==========================================
   SICOF - REGISTRO DE CLIENTES
   Apertura, validación y guardado de usuarios
   ========================================== */

(() => {
  "use strict";

  // Elementos del formulario HTML
  const botonRegistro = document.getElementById("btnRegistro");
  const modalRegistro = document.getElementById("modalRegistro");
  const botonCerrar = document.getElementById("cerrarRegistro");
  const botonCancelar = document.getElementById("cancelarRegistro");
  const formulario = document.getElementById("formRegistro");

  const campoNombre = document.getElementById("registroNombre");
  const campoCorreo = document.getElementById("registroCorreo");
  const campoTelefono = document.getElementById("registroTelefono");
  const campoPassword = document.getElementById("registroPassword");
  const campoConfirmar = document.getElementById("registroConfirmar");
  const mensaje = document.getElementById("mensajeRegistro");

  const CLAVE_CLIENTES = "sicof_clientes";

  // Evitar errores si falta algún elemento del HTML
  if (
    !botonRegistro ||
    !modalRegistro ||
    !botonCerrar ||
    !botonCancelar ||
    !formulario ||
    !campoNombre ||
    !campoCorreo ||
    !campoTelefono ||
    !campoPassword ||
    !campoConfirmar ||
    !mensaje
  ) {
    console.error(
      "SICOF: No se encontró algún elemento del registro. Revisa los IDs del HTML."
    );
    return;
  }

  // Obtener los clientes guardados
  function obtenerClientes() {
    try {
      const datos = localStorage.getItem(CLAVE_CLIENTES);

      if (!datos) {
        return [];
      }

      const clientes = JSON.parse(datos);

      if (!Array.isArray(clientes)) {
        console.error("SICOF: Los datos de clientes no son válidos.");
        return null;
      }

      return clientes;
    } catch (error) {
      console.error("Error al leer los clientes:", error);
      return null;
    }
  }

  // Mostrar mensajes dentro del formulario
  function mostrarMensaje(texto, exito = false) {
    mensaje.textContent = texto;
    mensaje.classList.toggle("exito", exito);
  }

  // Abrir la ventana de registro
  function abrirRegistro(evento) {
    if (evento) {
      evento.preventDefault();
    }

    modalRegistro.hidden = false;
    modalRegistro.style.display = "grid";
    mostrarMensaje("");

    campoNombre.focus();
  }

  // Cerrar y limpiar el formulario
  function cerrarRegistro() {
    modalRegistro.hidden = true;
    modalRegistro.style.display = "none";
    formulario.reset();
    mostrarMensaje("");
  }

  // Conectar el botón Registrarse
  botonRegistro.addEventListener("click", abrirRegistro);

  // Conectar los botones para cerrar
  botonCerrar.addEventListener("click", cerrarRegistro);
  botonCancelar.addEventListener("click", cerrarRegistro);

  // Cerrar al pulsar fuera de la ventana
  modalRegistro.addEventListener("click", function (evento) {
    if (evento.target === modalRegistro) {
      cerrarRegistro();
    }
  });

  // Cerrar con la tecla Escape
  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape" && !modalRegistro.hidden) {
      cerrarRegistro();
    }
  });

  // Procesar el registro
  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();
    mostrarMensaje("");

    const nombre = campoNombre.value.trim();
    const correo = campoCorreo.value.trim().toLowerCase();
    const telefono = campoTelefono.value.trim();
    const password = campoPassword.value;
    const confirmar = campoConfirmar.value;

    // Validar campos vacíos
    if (!nombre || !correo || !telefono || !password || !confirmar) {
      mostrarMensaje("Por favor, completa todos los campos.");
      return;
    }

    // Validar correo
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!patronCorreo.test(correo)) {
      mostrarMensaje("Escribe un correo electrónico válido.");
      campoCorreo.focus();
      return;
    }

    // Validar contraseña
    if (password.length < 8) {
      mostrarMensaje("La contraseña debe tener mínimo 8 caracteres.");
      campoPassword.focus();
      return;
    }

    // Confirmar contraseña
    if (password !== confirmar) {
      mostrarMensaje("Las contraseñas no coinciden.");
      campoConfirmar.focus();
      return;
    }

    // Consultar clientes existentes
    const clientes = obtenerClientes();

    if (clientes === null) {
      mostrarMensaje("No se pudieron consultar los registros guardados.");
      return;
    }

    // Evitar registrar el mismo correo dos veces
    const correoExiste = clientes.some(function (cliente) {
      return String(cliente.correo || "").toLowerCase() === correo;
    });

    if (correoExiste) {
      mostrarMensaje("Este correo ya está registrado.");
      campoCorreo.focus();
      return;
    }

    // Crear el nuevo cliente
    const nuevoCliente = {
      id: Date.now(),
      nombre: nombre,
      correo: correo,
      telefono: telefono,
      rol: "Cliente",
      fechaRegistro: new Date().toISOString()
    };

    // Guardar el cliente
    try {
      clientes.push(nuevoCliente);

      localStorage.setItem(
        CLAVE_CLIENTES,
        JSON.stringify(clientes)
      );

      mostrarMensaje("¡Registro exitoso! Tu cuenta fue creada.", true);

      formulario.reset();

      // Cerrar la ventana después de mostrar el mensaje
      setTimeout(function () {
        cerrarRegistro();

        // Mostrar aviso si el proyecto ya tiene esta función
        if (typeof window.aviso === "function") {
          window.aviso("¡Bienvenido a SICOF! Registro exitoso.");
        }
      }, 1200);

    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      mostrarMensaje(
        "No se pudieron guardar los datos. Revisa el almacenamiento del navegador."
      );
    }
  });

  // Asegurar que la ventana empiece cerrada
  modalRegistro.hidden = true;
  modalRegistro.style.display = "none";

})();
mostrar();
