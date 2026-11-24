// Animasi level di konsol (exp masuk ke piala, bar penuh meledak, LEVEL UP!, lalu LV baru) dimainkan sesudah layar
// "KAMU MENCAPAI" diketuk. Layar yang sedang tampil saat itu bisa konsol WELCOME, jadi datanya disimpan di sini dan
// baru dimainkan begitu baris status LV benar-benar tampil di konsol (sesudah WELCOME diketuk).
let tertunda = null
const KADALUARSA = 5 * 60 * 1000

export function simpanAnimLevel(data) {
  tertunda = { ...data, waktu: Date.now() }
}
export function lihatAnimLevel() {
  return tertunda && Date.now() - tertunda.waktu < KADALUARSA ? tertunda : null
}
export function habisAnimLevel() {
  tertunda = null
}
