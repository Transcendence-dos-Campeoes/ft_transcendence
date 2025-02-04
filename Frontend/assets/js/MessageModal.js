const MessageType = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

class MessageModal {
  constructor(type = MessageType.ERROR) {
    if (!Object.values(MessageType).includes(type)) {
      throw new Error(`Invalid message type: ${type}`);
    }
    this.type = type;
    this.modal = null;
    this.bsModal = null;
    this.createModal();
  }

  createModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.setAttribute("tabindex", "-1");

    const isSuccess = this.type === "success";
    const titleClass = isSuccess ? "text-success" : "text-danger";
    const title = isSuccess ? "Success" : "Error";

    modal.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content bg-dark text-white border-secondary">
                  <div class="modal-header border-secondary">
                      <h5 class="modal-title ${titleClass}">${title}</h5>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body"></div>
              </div>
          </div>
      `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.bsModal = new bootstrap.Modal(modal);
  }

  show(message) {
    this.modal.querySelector(".modal-body").innerHTML = message;
    this.bsModal.show();
  }

  hide() {
    this.bsModal.hide();
  }
}
