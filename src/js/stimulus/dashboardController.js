import { Controller } from "@hotwired/stimulus";

export class DashboardController extends Controller {
    static targets = ["medias"];

    connect() {
        this.loadMedia();
    }

    loadMedia() {
        fetch(`/api/media`, {
            method: "GET"
        })
        .then((response) => {
            return response.json();
        })
        .then((result) => {
            this.mediasTarget.innerHTML = "";
            result.media.forEach((media) => {
                const button = document.importNode(document.getElementById("media-button").content, true);
                button.querySelector("button").innerText = media.name.toUpperCase();
                button.querySelector("button").dataset.id = media.id
                this.mediasTarget.append(button);
            });
        }); 
    }
}