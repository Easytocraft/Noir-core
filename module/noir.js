import { NoirActorSheet } from "./sheets/actor-sheet.mjs";

Hooks.once("init", async function () {
  console.log("Noir-Core | Initializing Noir Core System...");

  // Отключаем дефолтные листы актеров Foundry
  Actors.unregisterSheet("core", ActorSheet);

  // Регистрируем наш нуарный лист персонажа
  Actors.registerSheet("noir-core", NoirActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "NOIR.SheetClassCharacter"
  });

  // Хелпер для счётчика "активно/всего" у маркеров (здоровье/стресс/истощение)
  Handlebars.registerHelper("countActive", function (arr) {
    if (!Array.isArray(arr)) return 0;
    return arr.filter(Boolean).length;
  });
});

// Миграция: у существующих персонажей стресс мог быть сохранён с 8 ячейками
// (старая схема). Схема (template.json) теперь даёт новым персонажам 6, но
// уже созданные актёры хранят своё старое значение и не обновляются сами -
// подрезаем/дополняем до 6 один раз при готовности мира.
Hooks.once("ready", async function () {
  if (!game.user.isGM) return;

  for (const actor of game.actors) {
    if (actor.type !== "character") continue;
    const pills = actor.system.stress?.pills;
    if (!Array.isArray(pills) || pills.length === 6) continue;

    const trimmed = pills.slice(0, 6);
    while (trimmed.length < 6) trimmed.push(false);
    await actor.update({ "system.stress.pills": trimmed });
    console.log(`Noir-Core | Миграция: у "${actor.name}" стресс приведён к 6 ячейкам.`);
  }
});