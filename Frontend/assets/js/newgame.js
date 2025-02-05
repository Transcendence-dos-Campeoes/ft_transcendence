function waitgame() {

    const loadingOverlay = new LoadingOverlay();

    try{
        loadingOverlay.show();
        const currentUser = localStorage.getItem("username");

        socket.send(
            JSON.stringify({
              type: "waiting_game",
              from: currentUser,
            })
        );

        awaitModal = new MessageModal(MessageType.AWAIT);
        awaitModal.show(`Waiting for other player to join...`, "Awaiting").then((accept) => {
            if (!accept) {
                socket.send(
                    JSON.stringify({
                    type: "close_await",
                    from: currentUser,
                    })
                );
                renderElement('overview');
            }
        });
    }
    catch (error) {
        console.error("Error loading element:", error);
    } finally {
        loadingOverlay.hide();
    }
}