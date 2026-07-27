export class NoirActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["noir-sheet", "sheet", "actor"],
      template: "systems/noir-core/templates/actor/character-sheet.hbs",
      width: 1180,
      height: 820,
      resizable: true
    });
  }

  /** @override */
  async getData(options) {
    const context = await super.getData(options);
    const actorData = this.actor.toObject(false);

    context.system = actorData.system;
    context.flags = actorData.flags;

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Переключение вкладок (Основное / Предметы / Эффекты / Заметки)
    html.find(".noir-tab").click(this._onTabClick.bind(this));

    if (!this.isEditable) return;

    // Клик по ячейке маркера (здоровье/стресс/истощение) переключает её вкл/выкл
    html.find(".pill").click(this._onPillClick.bind(this));

    // Клик по характеристике - бросок 1d12 + модификатор в чат
    html.find(".stat-card.rollable").click(this._onStatRoll.bind(this));
  }

  _onTabClick(event) {
    event.preventDefault();
    const tab = event.currentTarget.dataset.tab;
    const form = $(event.currentTarget).closest("form");

    form.find(".noir-tab").removeClass("active");
    event.currentTarget.classList.add("active");

    const oldPanel = form.find(".tab-panel").not(".hidden");
    const newPanel = form.find(`.tab-panel[data-tab-panel="${tab}"]`);

    if (oldPanel.is(newPanel) || !newPanel.length) return;

    // "Переворот страницы" - старая страница уезжает влево, новая появляется справа
    oldPanel.addClass("tab-page-out");
    setTimeout(() => {
      oldPanel.addClass("hidden").removeClass("tab-page-out");

      newPanel.removeClass("hidden").addClass("tab-page-in");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => newPanel.removeClass("tab-page-in"));
      });
    }, 220);
  }

  async _onPillClick(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const path = el.dataset.path;
    const index = Number(el.dataset.index);
    if (!path) return;

    const current = foundry.utils.getProperty(this.actor, path) ?? [];
    const updated = [...current];
    updated[index] = !updated[index];

    await this.actor.update({ [path]: updated });
  }

  async _onStatRoll(event) {
    event.preventDefault();
    const card = event.currentTarget;
    const statKey = card.dataset.stat;
    const label = card.querySelector(".stat-label")?.textContent ?? statKey;
    const value = Number(foundry.utils.getProperty(this.actor, `system.stats.${statKey}.value`) ?? 0);

    const roll = await new Roll(`1d12 + @mod`, { mod: value }).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Проверка: ${label}`
    });
  }
}
