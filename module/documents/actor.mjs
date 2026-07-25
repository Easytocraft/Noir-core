export class NoirActor extends Actor {
  /** Применение фильтра зрения в зависимости от диапазона (-5 ... +5) */
  applyScreenFilter() {
    if (!this.isOwner) return;

    // Получаем числовое значение из системы (по умолчанию 0)
    const val = Number(this.system.mindState?.value || 0);
    const body = document.body;

    // Сбрасываем предыдущие классы
    body.classList.remove("noir-filter-bw", "noir-filter-color", "noir-filter-dark");

    if (val >= 3) {
      // Кураж (+3 ... +5) — Включаем цветное зрение
      body.classList.add("noir-filter-color");
    } else if (val <= -3) {
      // Цинизм (-3 ... -5) — Включаем глубокие тени и мрак
      body.classList.add("noir-filter-dark");
    } else {
      // Нейтрал (-2 ... +2) — Стандартный Ч/Б нуар
      body.classList.add("noir-filter-bw");
    }
  }
}