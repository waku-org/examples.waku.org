const status = document.getElementById("status");
const chat = document.getElementById("chat-area");
const messages = document.getElementById("messages");

const nickInput = document.getElementById("nick");
const textInput = document.getElementById("text");
const sendButton = document.getElementById("send");

export const initUI = () => {
  const onStatusChange = (newStatus, className) => {
    status.innerText = newStatus;
    status.className = className || "progress";
  };

  const onLoaded = () => {
    chat.style.display = "block";
  };

  const _renderMessage = (nick, text, time, validation) => {
    messages.innerHTML += `
            <li>
                (${nick})(${validation})
                <strong>${text}</strong>
                <i>[${new Date(time).toISOString()}]</i>
            </li>
        `;
  };

  const registerEvents = (events) => {
    events.onSubscribe((nick, text, time, validation) => {
      _renderMessage(nick, text, time, validation);
    });

    sendButton.addEventListener("click", async () => {
      const nick = nickInput.value;
      const text = textInput.value;

      if (!nick || !text) {
        console.log("Not sending message: missing nick or text.");
        return;
      }

      await events.onSend(nick, text);
      textInput.value = "";
    });
  };

  return {
    onLoaded,
    registerEvents,
    onStatusChange,
  };
};
