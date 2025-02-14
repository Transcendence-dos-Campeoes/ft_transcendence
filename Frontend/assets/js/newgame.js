async function waitgame() {

    const loadingOverlay = new LoadingOverlay();
    // const authenticated = await isAuthenticated();
    // if (!authenticated) {
    //   console.log("User not authenticated, redirecting to login page.");
    //   renderPage('login');
    // }

    try {
        loadingOverlay.show();
        const currentUser = localStorage.getItem("username");

        socket.send(
            JSON.stringify({
                type: "waiting_game",
                from: currentUser,
            })
        );

        awaitModal = new MessageModal(MessageType.AWAIT);
        readyModal = new MessageModal(MessageType.READY);
        giveUpModal = new MessageModal( );

        awaitModal.show(`Waiting for other player to join...`, "Awaiting").then((accept) => {
            if (!accept) {
                socket.send(
                    JSON.stringify({
                        type: "close_await",
                        from: currentUser,
                    })
                );
                renderPage('home');
            }
            else if (accept) {
                readyModal.show(`Playing against ${data.opponent}`, "Ready?").then((accept) => {
                    if (!accept) {
                        socket.send(
                            JSON.stringify({
                                type: "close_await",
                                from: currentUser,
                                game_group: data.game_group,
                            })
                        );
                        giveUpModal.show(`You gave up`, "Loss by forfeit")
                        renderElement('overview');
                    }
                    else
                    {
                        if (data.type != 'end_game')
                            socket.send(
                                JSON.stringify({
                                    type: 'random_ready',
                                    user: localStorage.getItem("username"),
                                    from: data.from,
                                    game_group: data.game_group,
                                    player: data.player,
                                    player1: data.player1,
                                    player2: data.player2,
                                })
                            );
                    }
                });
            }
        });
        socket.addEventListener('message', function (event) {
            const data = JSON.parse(event.data);
            if (data.type === 'random_game') {
                awaitModal.hide();
                awaitModal.resolve(true);
            }
            if (data.type === 'end_game')
            {
                readyModal.hide();
                readyModal.resolve(true);
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