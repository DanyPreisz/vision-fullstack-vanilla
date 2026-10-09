import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const board = document.querySelector("#board");
const form = document.querySelector("#card-form");
const formError = document.querySelector("#form-error");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/cards");
  document.querySelector("#done").textContent = data.done;
  board.innerHTML = "";
  data.cards.forEach((card) => {
    const tile = document.createElement("article");
    tile.className = `tile${card.done ? " done" : ""}`;
    if (card.photo) {
      const img = document.createElement("img");
      img.src = card.photo;
      img.alt = card.title;
      tile.append(img);
    }
    const title = document.createElement("strong");
    title.textContent = card.title;
    const note = document.createElement("p");
    note.textContent = card.note;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "ghost";
    toggle.textContent = card.done ? "Hecho" : "Pendiente";
    toggle.addEventListener("click", async () => { await api(`/api/cards/${card.id}/done`, { method: "POST" }); await refresh(); });
    const del = document.createElement("button");
    del.type = "button";
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/cards/${card.id}`, { method: "DELETE" }); await refresh(); });
    const row = document.createElement("div");
    row.className = "row";
    row.append(toggle, del);
    tile.append(title, note, row);
    board.append(tile);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/cards", { method: "POST", body: JSON.stringify({ title: document.querySelector("#title").value.trim(), note: document.querySelector("#note").value.trim(), photo: document.querySelector("#photo").value.trim() }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
