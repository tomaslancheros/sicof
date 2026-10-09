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
const inputStock = document.getElementById("stock");
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

  const datos = {
    nombre: inputNombre.value.trim(),
    categoria: inputCategoria.value,
    precio: parseFloat(inputPrecio.value),
    stock: parseInt(inputStock.value, 10),
  };

  if (!datos.nombre || isNaN(datos.precio) || isNaN(datos.stock)) {
    aviso("Completa todos los campos con valores válidos");
    return;
  }

  if (inputId.value) {
    // UPDATE
    const id = Number(inputId.value);
    productos = productos.map((p) => (p.id === id ? { ...p, ...datos } : p));
    aviso("Producto actualizado");
  } else {
    // CREATE
    const nuevoId = productos.length ? Math.max(...productos.map((p) => p.id)) + 1 : 1;
    productos.push({ id: nuevoId, ...datos });
    aviso("Producto agregado");
  }

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

document.getElementById("btnRegistro").addEventListener("click", (e) => {
  e.preventDefault();
  aviso("El registro de usuarios estará disponible pronto");
});

mostrar();
