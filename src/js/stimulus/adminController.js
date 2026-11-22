import { Controller } from "@hotwired/stimulus";

export class AdminController extends Controller {
  static targets = ["createMedia", "createMediaImage", "createMediaUrl", "createCategory", "createOption", "createOptionImage", "createOptionUrl", "editCard"];

  connect() {
    this.resetAllCards();
  }

  selectMedia(event) {
    window.location.replace(`/admin/media/${event.currentTarget.dataset.id}`);
  }

  selectCategory(event) {
    window.location.replace(`/admin/media/${event.params.media}/${event.params.category}`)
  }

  selectOption(event) {
    window.location.replace(`/admin/media/${event.params.media}/${event.params.category}/${event.params.option}`);
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

  // TODO: Check the generated frontend URL.
  // It not starting with a host prevents saving right now.
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

  uploadMediaImage(event) {
    const file = event.target.files[0];

    this.uploadImage(file, (url) => {
      this.createMediaUrlTarget.value = url;
      this.previewCreateMediaImage(url);
    });
  }

  uploadOptionImage(event) {
    const file = event.target.files[0];

    this.uploadImage(file, (url) => {
      this.createOptionUrlTarget.value = url;
      this.previewCreateOptionImage(url);
    });
  }

  uploadImage(file, preview_callback) {
    if (!file) {
      preview_callback("");
      return;
    }

    const formData = new FormData();
    formData.append('uploaded_file', file);

    fetch('/admin/api/upload', {
      method: 'POST',
      body: formData
    }).then(response => {
      if (!response.ok) {
        preview_callback("");
        throw new Error(`Upload failed! ${response.status}`);
      }

      return response.json();
    }).then(result => {
      if (!result.url) {
        return;
      }

      preview_callback(result.url);
    });
  }
}
