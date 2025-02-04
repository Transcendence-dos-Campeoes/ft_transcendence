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
    const isError = this.type === "error";
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
                  ${!isError ? `
                  <div class="modal-footer border-secondary">
                      <span class="timer"></span>
                      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                      <button type="button" class="btn btn-primary">Accept</button>
                  </div>` : ''}
              </div>
          </div>
      `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.bsModal = new bootstrap.Modal(modal);

    if (!isError) { 
      this.modal.querySelector('.btn-primary').addEventListener('click', () => this.handleAccept());
      this.modal.querySelector('.btn-secondary').addEventListener('click', () => this.handleCancel());
    }
  }

  show(message, title = null) {
    this.modal.querySelector(".modal-body").innerHTML = message;
    const titleElement = this.modal.querySelector(".modal-title");
    const footerElement = this.modal.querySelector(".modal-footer");
    const timerElement = this.modal.querySelector(".timer");
    if (title) {
      titleElement.innerHTML = title;
      titleElement.className = "modal-title"; // Reset class to default
      if (title === "Invite Sent") {
        footerElement.querySelector('.btn-primary').style.display = 'none';
      } else {
        footerElement.querySelector('.btn-primary').style.display = 'inline-block';
      }
    } else {
      const isSuccess = this.type === "success";
      const isError = this.type === "error";
      titleElement.className = isSuccess ? "modal-title text-success" : "modal-title text-danger";
      titleElement.innerHTML = isSuccess ? "Success" : "Error";
      if (!isError) {
        footerElement.querySelector('.btn-primary').style.display = 'inline-block';
      }
    }
    this.bsModal.show();

    if (!this.type === MessageType.ERROR) {
      let timeLeft = 30;
      timerElement.innerHTML = `Time left: ${timeLeft}s`;
      this.timer = setInterval(() => {
        timeLeft -= 1;
        timerElement.innerHTML = `Time left: ${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(this.timer);
          this.resolve(false);
          this.hide();
        }
      }, 1000);
    }

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  hide() {
    this.bsModal.hide();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  handleAccept() {
    this.resolve(true);
    this.hide();
  }

  handleCancel() {
    this.resolve(false);
    this.hide();
  }

}

class DeclineModal extends MessageModal {
  createModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.setAttribute("tabindex", "-1");

    modal.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content bg-dark text-white border-secondary">
                  <div class="modal-header border-secondary">
                      <h5 class="modal-title text-danger">Invite Rejected</h5>
                      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body"></div>
                  <div class="modal-footer border-secondary">
                      <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                  </div>
              </div>
          </div>
      `;

    document.body.appendChild(modal);
    this.modal = modal;
    this.bsModal = new bootstrap.Modal(modal);

    this.modal.querySelector('.btn-primary').addEventListener('click', () => this.hide());
  }

  show(message, title = null) {
    this.modal.querySelector(".modal-body").innerHTML = message;
    this.bsModal.show();
  }
}