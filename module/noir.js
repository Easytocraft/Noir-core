import { NoirActorSheet } from "./actor-sheet.js";

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
});