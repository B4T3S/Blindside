import { Controller } from "@hotwired/stimulus";
import { animate } from "animejs";

export class CardController extends Controller {

  static targets = ['front', 'back'];

  connect() {
    this.flipped = false;

    this.element.getRootNode().addEventListener('revealCharacter', (event) => {
      this.flip(event.detail.player, event.detail.hidePlayer);
    });
  }

  flip(player, hidePlayer) {
    const target = this.flipped ? this.frontTarget : this.backTarget;

    target.querySelector(".js-target-name").innerText = hidePlayer ? "???" : player.target;
    target.querySelector(".js-image").src = player.image;
    target.querySelector(".js-player-name").innerText = player.playerName;

    target.querySelector(".js-image").hidden = hidePlayer;
    target.querySelector(".js-self-image").hidden = !hidePlayer;

    animate(this.element, {
      rotateY: this.flipped ? { from: '180deg', to: '360deg' } : { from: '0deg', to: '180deg' },
      duration: 1000
    });

    this.flipped = !this.flipped;
  }
}
