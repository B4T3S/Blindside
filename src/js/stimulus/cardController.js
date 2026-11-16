import { Controller } from "@hotwired/stimulus";
import { animate } from "animejs";

export class CardController extends Controller {

  static targets = ['front', 'back'];

  connect() {
    this.flipped = false;

    this.element.getRootNode().addEventListener('revealCharacter', (event) => {
      this.flip(event.detail.player, event.detail.hidePlayer, event.detail.guessedCorrectly);
    });
  }

  async flip(player, hidePlayer, guessedCorrectly) {
    const target = this.flipped ? this.frontTarget : this.backTarget;
    const stampTarget = this.flipped ? this.backTarget : this.frontTarget;
    const stamp = stampTarget.querySelector(`[data-card-target=${guessedCorrectly ? "guessed" : "failed"}]`);

    target.querySelector(".js-target-name").innerText = hidePlayer ? "???" : player.target;
    target.querySelector(".js-image").src = player.image;
    target.querySelector(".js-player-name").innerText = player.playerName;

    target.querySelector(".js-image").hidden = hidePlayer;
    target.querySelector(".js-self-image").hidden = !hidePlayer;

    await this._animateStamp(stamp);

    await this._animateFlip(this.element);
    this.flipped = !this.flipped;

    // Reset stamp
    stamp.style = "opacity: 0%;";

    const event = new CustomEvent('revealedCharacter', {
      bubbles: true,
    });
    const playerContainer = document.getElementById("player-container");
    playerContainer.dispatchEvent(event);
  }

  _animateStamp(stamp) {
    return new Promise((resolve) => {
      animate(stamp, {
        rotate: { from: '0deg', to: '15deg' },
        scale: { from: 1.2, to: 1 },
        opacity: { from: '0%', to: '100%' },
        duration: 200,
        ease: 'inExpo',
        onComplete: resolve
      });
    });
  }

  _animateFlip(card) {
    return new Promise((resolve) => {
      animate(card, {
        rotateY: this.flipped ? { from: '180deg', to: '360deg' } : { from: '0deg', to: '180deg' },
        scale: [1, 1.2, 1],
        duration: 1000,
        delay: 1500,
        ease: 'inOutExpo',
        onComplete: resolve
      });
    });
  }
}
