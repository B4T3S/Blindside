import { Controller } from "@hotwired/stimulus";

export class AdminController extends Controller {
  connect() {
    console.log("Admin controller connected!");
  }

  selectMedia(event) {
    window.location.replace(`/admin/${event.currentTarget.dataset.id}`);
  }

  addMedia() {
    console.log("Add media clicked");
  }

  addCategory() {
    console.log("Add category clicked");
  }

  addOption() {
    console.log("Add option clicked");
  }
}
