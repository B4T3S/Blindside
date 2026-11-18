import { Controller } from "@hotwired/stimulus";

export class LobbyController extends Controller {
  static targets = ["medias", "categories", "splashart"];

  connect() {
    this.updateMedia();
  }

  updateMedia() {
    fetch(`/api/media`, {
      method: "GET"
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      this.mediasTarget.innerHTML = "";
      result.media.forEach((media) => {
        let option = document.createElement("option");
        option.value = media.id;
        option.dataset.url = media.splash_art_url;
        option.innerText = media.name;
        this.mediasTarget.append(option);
      });

      this.updateCategories();
    });
  }

  updateCategories() {
    const selectIndex = this.mediasTarget.selectedIndex;
    const selectedElement = this.mediasTarget[selectIndex]
    this.splashartTarget.style = `background-image: url("${selectedElement.dataset.url}")`;

    fetch(`/api/categories/${this.mediasTarget.value}`, {
      method: "GET"
    })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      this.categoriesTarget.innerHTML = "";

      const placeholder = document.createElement("option");
      placeholder.innerText = "Select category...";
      placeholder.value = "";
      placeholder.selected = true;
      placeholder.disabled = true;
      this.categoriesTarget.append(placeholder);

      result.forEach((category) => {
        let option = document.createElement("option");
        option.value = category.id;
        option.innerText = category.name;
        this.categoriesTarget.append(option);
      });
    });
  }
}
