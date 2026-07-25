/**
 * Кастомный класс Актера системы Noir
 */
export class NoirActor extends Actor {

  /** Применение фильтра зрения в зависимости от диапазона (-5 ... +5) */
  applyScreenFilter() {
    if (!this.isOwner) return;

    const val = Number(this.system.mindState?.value || 0);
    const body = document.body;

    body.classList.remove("noir-filter-bw", "noir-filter-color", "noir-filter-dark");

    if (val >= 3) {
      body.classList.add("noir-filter-color");
    } else if (val <= -3) {
      body.classList.add("noir-filter-dark");
    } else {
      body.classList.add("noir-filter-bw");
    }
  }
}