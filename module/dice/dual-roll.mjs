export class NoirDualRoll {
  /**
   * Выполнение броска дуальности
   * @param {Actor} actor - Персонаж, совершающий бросок
   * @param {string} statKey - Ключ характеристики (strength, agility и т.д.)
   */
  static async makeRoll(actor, statKey) {
    const statVal = Number(actor.system.stats[statKey]?.value || 0);
    let mindVal = Number(actor.system.mindState?.value || 0);
    const exhaustion = Number(actor.system.exhaustion?.value || 0);

    // 1. ПРОВЕРКА НА 4-Й УРОВЕНЬ ИСТОЩЕНИЯ (Легендарный Передоз)
    if (exhaustion >= 4) {
      ui.notifications.warn(`${actor.name} совершает ПОСЛЕДНЕЕ ДЕЙСТВИЕ перед передозировкой!`);
      
      const content = `
        <div class="noir-roll-card roll-crisis">
          <div class="card-header">💀 ЛЕГЕНДАРНЫЙ ПОСЛЕДНИЙ РЫВОК</div>
          <div class="card-footer">
            <b>Гарантированный критический успех!</b><br>
            <i>Персонаж совершает немыслимое и мгновенно умирает от передозировки.</i>
          </div>
        </div>
      `;
      
      await actor.update({ "system.health.value": 0 });
      return ChatMessage.create({ user: game.user.id, speaker: ChatMessage.getSpeaker({ actor }), content });
    }

    // 2. ГАРАНТИРОВАННЫЙ КРИТ ПРИ МАКСИМАЛЬНОМ КУРАЖЕ (+5)
    if (mindVal >= 5) {
      await actor.update({ "system.mindState.value": 0 });
      actor.applyScreenFilter();

      const content = `
        <div class="noir-roll-card roll-courage">
          <div class="card-header">🟡 ПОЛНЫЙ КУРАЖ (+5)</div>
          <div class="card-footer"><b>Гарантированный Критический Успех!</b> Шкала сброшена к Нейтралу (0).</div>
        </div>
      `;
      return ChatMessage.create({ user: game.user.id, speaker: ChatMessage.getSpeaker({ actor }), content });
    }

    // 3. ГАРАНТИРОВАННЫЙ ПРОВАЛ ПРИ МАКСИМАЛЬНОМ ЦИНИЗМЕ (-5)
    if (mindVal <= -5) {
      await actor.update({ "system.mindState.value": 0 });
      actor.applyScreenFilter();

      const content = `
        <div class="noir-roll-card roll-bottom">
          <div class="card-header">⚫ ГЛУБОКИЙ ЦИНИЗМ (-5)</div>
          <div class="card-footer"><b>Гарантированный Критический Провал!</b> Шкала сброшена к Нейтралу (0).</div>
        </div>
      `;
      return ChatMessage.create({ user: game.user.id, speaker: ChatMessage.getSpeaker({ actor }), content });
    }

    // 4. СТАНДАРТНЫЙ БРОСОК: 1d12 (Кураж) + 1d12 (Дно) + Модификатор
    const modString = statVal >= 0 ? `+ ${statVal}` : `- ${Math.abs(statVal)}`;
    const roll = await new Roll(`1d12 + 1d12 ${modString}`).evaluate();

    const courageDice = roll.dice[0].results[0].result;
    const bottomDice = roll.dice[1].results[0].result;

    let outcomeTitle = "";
    let outcomeDesc = "";
    let cssClass = "";

    // Сравнение костей и сдвиг шкалы
    if (courageDice === bottomDice) {
      outcomeTitle = "⚠️ КРИЗИС (Дубли)";
      outcomeDesc = "Черный юмор судьбы / Внутренний надлом. Происходит нечто неожиданное!";
      cssClass = "roll-crisis";
    } else if (courageDice > bottomDice) {
      outcomeTitle = "🟡 ПРЕОБЛАДАЕТ КУРАЖ";
      outcomeDesc = "Успех с блеском и азартом. Шкала сдвигается к Куражу (+1).";
      cssClass = "roll-courage";
      
      // Авто-сдвиг шкалы к Куражу
      mindVal = Math.min(5, mindVal + 1);
      await actor.update({ "system.mindState.value": mindVal });
      actor.applyScreenFilter();
    } else {
      outcomeTitle = "⚫ ПРЕОБЛАДАЕТ ДНО";
      outcomeDesc = "Город берет свое. Шкала сдвигается к Цинизму (-1).";
      cssClass = "roll-bottom";

      // Авто-сдвиг шкалы к Цинизму
      mindVal = Math.max(-5, mindVal - 1);
      await actor.update({ "system.mindState.value": mindVal });
      actor.applyScreenFilter();
    }

    const modDisplay = statVal >= 0 ? `+${statVal}` : `${statVal}`;

    const chatContent = `
      <div class="noir-roll-card ${cssClass}">
        <div class="card-header">${outcomeTitle}</div>
        <div class="dice-container" style="display:flex; justify-content:space-around; margin:8px 0; font-weight:bold;">
          <span style="color:#d4af37;">Кураж: <b>${courageDice}</b></span> | 
          <span style="color:#666;">Дно: <b>${bottomDice}</b></span> | 
          <span>Мод: <b>${modDisplay}</b></span>
        </div>
        <div class="roll-total" style="font-size:1.2rem; text-align:center; font-weight:bold;">Итого: ${roll.total}</div>
        <div class="card-footer" style="font-size:0.85rem; margin-top:6px; text-align:center;">${outcomeDesc}</div>
      </div>
    `;

    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: `<b>Проверка: ${statKey.toUpperCase()}</b>`,
      content: chatContent
    });
  }
}