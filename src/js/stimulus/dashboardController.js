import { Controller } from "@hotwired/stimulus";
import { animate } from "animejs";

export class DashboardController extends Controller {
  static targets = ["medias", "name"];

  connect() {
    this._loadMedia();

    this.mediasTarget.addEventListener("wheel", (e) => {
      e.preventDefault();

      this._scroll(e.deltaY > 0);
    });
  }

  _loadMedia() {
    fetch(`/api/media`, {
      method: "GET",
    })
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        this.mediasTarget.innerHTML = "";
        this.medias = [];
        this.mediaIndex = 0;
        result.media.forEach((media) => {
          const button = document.importNode(
            document.getElementById("media-button").content,
            true,
          );
          button.querySelector("button").innerText = media.name.toUpperCase();
          button.querySelector("button").dataset.id = media.id;
          button.querySelector("button").dataset.url = media.splash_art_url;
          this.mediasTarget.append(button);
          this.medias.push(this.mediasTarget.querySelector(`[data-id="${media.id}"]`));
        });

        this._scroll(false);
      });
  }

  _getScrolloffset(index) {
    if (index > (this.medias.length - 1)) {
      return 0; // Scroll back to top on overflow
    }

    let height = 0;
    while (index > 0) {
      height += this.medias[index].parentNode.scrollHeight;
      index--;
    }

    return height;
  }

  _scroll(down) {
    if (down) {
      this.mediaIndex++;
    } else {
      this.mediaIndex--;
    }

    this.mediaIndex = Math.min(Math.max(this.mediaIndex, 0), this.medias.length - 1);

    this.medias.forEach((media, index) => {
      if (index == this.mediaIndex) {
        media.classList.add("weird-selected");
      } else {
        media.classList.remove("weird-selected");
      }
    });

    animate(this.mediasTarget, {
      scrollTop: this._getScrolloffset(this.mediaIndex),
      duration: 800,
      ease: 'outExpo'
    });

    this.nameTarget.innerText = this.medias[this.mediaIndex].innerText;
    this.element.style = `
      background-image: url("${this.medias[this.mediaIndex].dataset.url}");
      background-size: cover;
      backdrop-filter: blur(5) opacity(0.5);
      box-shadow: inset 0 0 5em 3em #000;
    `;
  }
}
