import { CLASS_LIST, RACE_LIST, CLASS_DATA, RACE_DATA } from "../data/classes-races.mjs";

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

    // Списки для выпадающих меню класса/расы на листе
    context.classList = CLASS_LIST;
    context.raceList = RACE_LIST;

    // Данные выбранного класса/расы - способности и расовая черта
    // подставляются на лист автоматически, без ручного ввода
    context.classInfo = CLASS_DATA[actorData.system.biography?.class] ?? null;
    context.raceInfo = RACE_DATA[actorData.system.biography?.race] ?? null;

    return context;
  }

  /** @override */
  _getHeaderButtons() {
    const buttons = super._getHeaderButtons();
    buttons.unshift({
      label: "Прокачать",
      class: "noir-level-up",
      icon: "fas fa-angles-up",
      onclick: () => this._onLevelUpClick()
    });
    return buttons;
  }

  _onLevelUpClick() {
    const hasClass = !!this.actor.system.biography?.class;

    // Персонаж ещё не создан (класс не выбран) - вместо повышения уровня
    // открываем мастер создания
    if (!hasClass) {
      this._openCreationDialog();
      return;
    }

    const level = this.actor.system.level ?? 1;
    if (level >= 5) {
      ui.notifications.info("Максимальный уровень персонажа (5) уже достигнут.");
      return;
    }

    Dialog.confirm({
      title: "Повышение уровня",
      content: `<p>Повысить персонажа с ${level} до ${level + 1} уровня?</p>
                 <p style="font-size:12px;color:#888;">Выбор новых способностей за уровень для этого набора классов
                 ещё не прописан — пока только счётчик уровня. Скажите, когда будут готовы способности по уровням,
                 и сюда добавится выбор конкретных умений.</p>`,
      yes: async () => {
        await this.actor.update({ "system.level": level + 1 });
        ui.notifications.info(`${this.actor.name} повышен до ${level + 1} уровня.`);
      },
      defaultYes: true
    });
  }

  _openCreationDialog() {
    const raceOptions = RACE_LIST.map(r => `<option value="${r}">${r}</option>`).join("");
    const classOptions = CLASS_LIST.map(c => `<option value="${c}">${c}</option>`).join("");

    const content = `
      <form class="noir-creation-form">
        <div class="form-group">
          <label>Раса</label>
          <select name="race">${raceOptions}</select>
        </div>
        <div class="form-group">
          <label>Класс</label>
          <select name="class">${classOptions}</select>
        </div>
        <div class="form-group">
          <label>Стартовое снаряжение</label>
          <textarea name="equipment" rows="3" placeholder="Револьвер, потрёпанный плащ, фляга..."></textarea>
        </div>
        <p style="font-size:11px;color:#888;">
          Полноценный учёт предметов как отдельных записей появится позже, когда будет готова
          система типов предметов (оружие, снаряжение) — пока это просто текстовое описание.
        </p>
      </form>`;

    new Dialog({
      title: `Создание персонажа: ${this.actor.name}`,
      content,
      buttons: {
        create: {
          icon: '<i class="fas fa-check"></i>',
          label: "Создать",
          callback: async (html) => {
            const form = html[0].querySelector(".noir-creation-form");
            const race = form.querySelector('[name="race"]').value;
            const cls = form.querySelector('[name="class"]').value;
            const equipment = form.querySelector('[name="equipment"]').value;

            await this.actor.update({
              "system.biography.race": race,
              "system.biography.class": cls,
              "system.biography.equipment": equipment,
              "system.level": 1
            });
            ui.notifications.info(`${this.actor.name} создан: ${cls}, ${race}.`);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Отмена"
        }
      },
      default: "create",
      options: { classes: ["noir-dialog"] }
    }).render(true);
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
