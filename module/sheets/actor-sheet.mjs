export class NoirActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["noir-sheet", "sheet", "actor"],
      template: "systems/noir-core/templates/actor/character-sheet.hbs",
      width: 820,
      height: 720,
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

    if (!this.isEditable) return;

    // Здесь позже добавим клики по маркерам и броски
  }
}