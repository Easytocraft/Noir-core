import { NoirActor } from "./module/documents/actor.mjs";
import { NoirActorSheet } from "./module/sheets/actor-sheet.mjs";

Hooks.once("init", () => {
  console.log("Noir Core | Инициализация...");

  CONFIG.Actor.documentClass = NoirActor;

  // Отвязываем старые листы
  Actors.unregisterSheet("core", ActorSheet);

  // Регистрируем наш лист
  Actors.registerSheet("noir-core", NoirActorSheet, {
    types: ["character"],
    makeDefault: true,
    label: "Noir Sheet"
  });
});