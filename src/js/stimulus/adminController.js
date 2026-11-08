import { Controller } from "@hotwired/stimulus";

export class AdminController extends Controller {
  static targets = ["createMedia", "createMediaImage", "createCategory", "createOption", "createOptionImage", "editCard"];

  connect() {
    this.resetAllCards();
  }

  selectMedia(event) {
    window.location.replace(`/admin/${event.currentTarget.dataset.id}`);
  }

  selectCategory(event) {
    window.location.replace(`/admin/${event.params.media}/${event.params.category}`)
  }

  selectOption(event) {
    window.location.replace(`/admin/${event.params.media}/${event.params.category}/${event.params.option}`);
  }

  addMedia() {
    this.hideAllEditCards();
    this.resetCreateMedia();
    this.createMediaTarget.hidden = false;
  }

  addCategory() {
    this.hideAllEditCards();
    this.resetCreateCategory();
    this.createCategoryTarget.hidden = false;
  }

  addOption() {
    this.hideAllEditCards();
    this.resetCreateOption();
    this.createOptionTarget.hidden = false;
  }

  updateCreateMediaImage(event) {
    const url = event.target.value;
    this.previewCreateMediaImage(url);
  }

  updateCreateOptionImage(event) {
    const url = event.target.value;
    this.previewCreateOptionImage(url);
  }

  previewCreateMediaImage(url) {
    this.createMediaImageTarget.hidden = !url;
    this.createMediaImageTarget.src = url;
  }

  previewCreateOptionImage(url) {
    this.createOptionImageTarget.hidden = !url;
    this.createOptionImageTarget.src = url;
  }

  hideAllEditCards() {
    this.editCardTargets.forEach(element => element.hidden = true);
  }

  resetCreateMedia() {
    this.createMediaTarget.querySelectorAll("input:not(.exclude)").forEach(element => element.value = "");
  }

  resetCreateCategory() {
    this.createCategoryTarget.querySelectorAll("input:not(.exclude)").forEach(element => element.value = "");
  }

  resetCreateOption() {
    this.createOptionTarget.querySelectorAll("input:not(.exclude)").forEach(element => element.value = "");
  }

  resetAllCards() {
    this.resetCreateMedia();
    this.resetCreateCategory();
    this.resetCreateOption();
  }
}
