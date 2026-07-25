/**
 * Основной класс для листа Актера системы Noir
 */
export class NoirActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["noir-sheet", "sheet", "actor"],
      template: "systems/noir-core/templates/actor/character-sheet.hbs",
      width: 720,
      height: 750,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "primary" }]
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    // Использование this.actor.system наиболее надежно в v13
    context.system = this.actor.system; 
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // 1. Броски Характеристик (D12) при клике на карточку
    html.find('.stat-card.rollable').click(this._onRollStat.bind(this));

    // 2. Интерактивные Маркеры (Пули HP, Круги Стресса, Капсулы Препаратов)
    html.find('.pills .pill').click(this._onPillClick.bind(this));

    // 3. Смена Ментального Состояния (Слайдер) - для визуального эффекта
    html.find('.mind-slider').change(event => this._onMindStateChange(event, html));
    
    // Применим фильтр экрана с защитой от undefined
    const mindValue = this.actor.system?.mindState?.value ?? 0;
    this._applyVisualFilter(mindValue, html);
  }

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

  /**
   * Кидает D12 + Модификатор Характеристики в чат
   */
  async _onRollStat(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const statKey = element.dataset.stat;
    const stat = this.actor.system.stats[statKey];

    if (!stat) return;

    // Формула броска Noir: 1d12 + значение
    const formula = `1d12 + ${stat.value}`;
    const roll = await new Roll(formula).evaluate();

    // Отправляем красивый бросок в чат
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `Бросок характеристики: <b>${stat.label}</b>`
    });
  }

  /**
   * Клик по маркеру (HP, Стресс, Препараты) - меняет значение data.value
   */
  async _onPillClick(event) {
    event.preventDefault();
    const pill = event.currentTarget;
    const index = parseInt(pill.dataset.index);
    
    const pillsContainer = pill.closest('.pills');
    const systemPath = this._getSystemPathFromPills(pillsContainer);
    
    if (!systemPath) return;

    const newValue = index + 1;
    const currentValue = foundry.utils.getProperty(this.actor, `${systemPath}.value`);
    const finalValue = (currentValue === newValue) ? index : newValue;

    await this.actor.update({ [`${systemPath}.value`]: finalValue });
  }

  /**
   * Обработчик изменения слайдера Ментального состояния
   */
  _onMindStateChange(event, html) {
    const value = parseInt(event.target.value);
    this._applyVisualFilter(value, html);
  }

  // --- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ---

  /**
   * Применяет CSS фильтры к экрану Foundry в зависимости от Цинизма/Куража
   */
  _applyVisualFilter(value, html) {
    const body = document.body;
    
    body.classList.remove('noir-filter-cynicism', 'noir-filter-courage', 'noir-filter-neutral');

    if (value <= -3) {
      body.classList.add('noir-filter-cynicism');
    } else if (value >= 3) {
      body.classList.add('noir-filter-courage');
    } else {
      body.classList.add('noir-filter-neutral');
    }
  }

  /**
   * Определяет путь к данным системных ресурсов по классу элемента
   */
  _getSystemPathFromPills(pillsContainer) {
    if (!pillsContainer) return null;
    if (pillsContainer.classList.contains('health-pills')) return 'system.health';
    if (pillsContainer.classList.contains('stress-pills')) return 'system.stress';
    if (pillsContainer.classList.contains('exhaustion-pills')) return 'system.exhaustion';
    return null;
  }
}