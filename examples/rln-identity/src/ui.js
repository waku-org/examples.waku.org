import { renderBytes } from "./utils";

const status = document.getElementById("status");
const connectWalletButton = document.getElementById("connect");
const importKeystoreButton = document.getElementById("import");
const importFileInput = document.getElementById("import-file");
const exportKeystoreButton = document.getElementById("export");
const keystoreOptions = document.getElementById("keystore");
const keystorePassword = document.getElementById("password");
const readCredentialButton = document.getElementById("read-credential");
const registerNewCredentialButton = document.getElementById("register-new");
const currentCredentials = document.getElementById("current-credentials");

export function initUI() {
  const _renderCredential = (hash, credential) => {
    currentCredentials.innerHTML = `
      <div class="block mb-1">
        <p>Keystore hash</p>
        <code>${hash || "none"}</code>
      </div>

      <div class="block mb-1">
        <p>Membership ID</p>
        <code>${credential.membership.treeIndex || "none"}</code>
      </div>

      <div class="block mb-1">
        <p>Secret Hash</p>
        <code>${renderBytes(credential.identity.IDSecretHash)}</code>
      </div>

      <div class="block mb-1">
        <p>Commitment</p>
        <code>${renderBytes(credential.identity.IDCommitment)}</code>
      </div>

      <div class="block mb-1">
        <p>Nullifier</p>
        <code>${renderBytes(credential.identity.IDNullifier)}</code>
      </div>

      <div class="block mb-1">
        <p>Trapdoor</p>
        <code>${renderBytes(credential.identity.IDTrapdoor)}</code>
      </div>
    `;
  };

  const _renderKeystoreOptions = (options) => {
    keystoreOptions.innerHTML = `
      ${options.map((v) => `<option value=${v}>${v}</option>`)}
    `;
  };

  const registerEvents = ({
    connectWallet,
    registerCredential,
    readKeystoreOptions,
    readCredential,
    saveLocalKeystore,
    importLocalKeystore,
  }) => {
    connectWalletButton.addEventListener("click", async () => {
      await connectWallet();
      const keystoreKeys = readKeystoreOptions();
      _renderKeystoreOptions(keystoreKeys);
    });

    registerNewCredentialButton.addEventListener("click", async () => {
      const password = keystorePassword.value;

      if (!password) {
        alert("Please, input password in order to create new credentials.");
        return;
      }

      const { hash, credential } = await registerCredential(password);
      _renderCredential(hash, credential);

      const keystoreKeys = readKeystoreOptions();
      _renderKeystoreOptions(keystoreKeys);

      keystoreOptions.value = hash;
      saveLocalKeystore();
    });

    readCredentialButton.addEventListener("click", async () => {
      const password = keystorePassword.value;

      if (!password) {
        alert(
          "Please, input password in order to read credential from Keystore."
        );
        return;
      }

      const currentHash = keystoreOptions.value;

      if (!currentHash) {
        alert(
          "Please, select hash of a key in order to read credential from Keystore."
        );
        return;
      }

      const credential = await readCredential(currentHash, password);
      _renderCredential(currentHash, credential);
    });

    importFileInput.addEventListener("change", async (event) => {
      const file = event.currentTarget.files[0];

      if (!file) {
        return;
      }

      const text = await file.text();
      importLocalKeystore(text);

      const keystoreOptions = readKeystoreOptions();
      _renderKeystoreOptions(keystoreOptions);
    });

    importKeystoreButton.addEventListener("click", async () => {
      importFileInput.click();
    });

    exportKeystoreButton.addEventListener("click", () => {
      const filename = "keystore.json";
      const text = saveLocalKeystore();
      const file = new File([text], filename, {
        type: "application/json",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(file);
      link.download = filename;
      link.click();
    });
  };

  return {
    registerEvents,
    onStatusChange: (value, category = "progress") => {
      status.className = category;
      status.innerText = value;
    },
  };
}
