import { NoirActor } from "./module/documents/actor.mjs";
import { NoirActorSheet } from "./module/sheets/actor-sheet.mjs";

Hooks.once("init", () => {
  console.log("Noir Core | Инициализация нуарной игровой системы (v13)...");

  // 1. Регистрируем кастомный класс Actor
  CONFIG.Actor.documentClass = NoirActor;

  // 2. Отвязываем стандартный лист Foundry и регистрируем наш кастомный NoirActorSheet
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("noir-core", NoirActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "NOIR.SheetCharacter"
  });

  console.log("Noir Core | Система и Лист Персонажа успешно загружены!");
});

// Хук для обновления CSS-фильтров зрения игрока при изменениях актера
Hooks.on("updateActor", (actor, change) => {
  if (change.system?.mindState !== undefined) {
    actor.applyScreenFilter();
  }
});