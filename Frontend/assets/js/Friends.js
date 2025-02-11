class FriendSystem {
  constructor() {
    this.inviteForm = document.getElementById("inviteForm");
    this.pendingList = document.getElementById("pendingInvitesList");
    this.friendsList = document.getElementById("friendsList");
    this.setupEventListeners();
    this.loadPendingInvites();
    this.loadFriends();
    socket.send(JSON.stringify({type: "update_lobby"}));
  }

  setupEventListeners() {
    this.inviteForm.addEventListener("submit", (e) => this.handleInvite(e));
  }

  async loadFriends() {
    const loadingOverlay = new LoadingOverlay();
    try {
      loadingOverlay.show();
      const response = await fetch(`${window.location.origin}/api/users/friends/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      const friends = await response.json();
      this.renderFriends(friends);
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      loadingOverlay.hide();
    }
  } 

  async loadPendingInvites() {
    const loadingOverlay = new LoadingOverlay();
    try {
      loadingOverlay.show();
      const response = await fetch(`${window.location.origin}/api/users/invites/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });
      const invites = await response.json();
      this.renderPendingInvites(invites);
    } catch (error) {
      console.error("Error loading invites:", error);
    } finally {
      loadingOverlay.hide();
    }
  }

  async handleInvite(e) {
    e.preventDefault();
    const username = document.getElementById("friendUsername").value;
    const loadingOverlay = new LoadingOverlay();
    try {
      loadingOverlay.show();
      const response = await fetch(
        `${window.location.origin}/api/users/invite/create/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
          body: JSON.stringify({ receiver: username }),
        }
      );
      if (response.ok) {
        this.inviteForm.reset();
        // Show success message
      }
    } catch (error) {
      console.error("Error sending invite:", error);
    } finally {
      loadingOverlay.hide();
    }
  }

  async handleInviteResponse(id, action) {
    const loadingOverlay = new LoadingOverlay();
    try {
      loadingOverlay.show();
      await fetch(`${window.location.origin}/api/users/invite/update/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          friend_request_id: id,
          action: action,
        }),
      });
      this.loadPendingInvites();
      if (action === "accept") {
        this.loadFriends();
        socket.send(JSON.stringify({type: "update_lobby"}));
      }
    } catch (error) {
      console.error("Error responding to invite:", error);
    } finally {
      loadingOverlay.hide();
    }
  }

  async removeFriend(friendId) {
    const loadingOverlay = new LoadingOverlay();
    try {
      loadingOverlay.show();
      const response = await fetch(
        `${window.location.origin}/api/users/friend/delete/${friendId}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );
      if (response.ok) {
        this.loadFriends();
        socket.send(JSON.stringify({type: "update_lobby"}));
      }
    } catch (error) {
      console.error("Error removing friend:", error);
    } finally {
      loadingOverlay.hide();
    }
  }

  renderPendingInvites(invites) {
    this.pendingList.innerHTML = "";
    const template = document.getElementById("inviteTemplate");

    invites.forEach((invite) => {
      const element = template.content.cloneNode(true);
      element.querySelector(".username").textContent = invite.requester;

      element.querySelector(".accept-btn").onclick = () =>
        this.handleInviteResponse(invite.id, "accept");
      element.querySelector(".decline-btn").onclick = () =>
        this.handleInviteResponse(invite.id, "decline");

      this.pendingList.appendChild(element);
    });
  }

  renderFriends(friends) {
    this.friendsList.innerHTML = "";
    const template = document.getElementById("friendTemplate");

    friends.forEach((friend) => {
      const element = template.content.cloneNode(true);
      element.querySelector(".username").textContent = friend.username;

      element.querySelector(".remove-friend-btn").onclick = () =>
        this.removeFriend(friend.id);

      this.friendsList.appendChild(element);
    });
  }
}
