import { Application } from "@hotwired/stimulus";

import { AdminController } from "./stimulus/adminController.js";

window.Stimulus = Application.start();
Stimulus.register("admin", AdminController);
