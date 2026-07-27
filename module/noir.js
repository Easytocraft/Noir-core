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