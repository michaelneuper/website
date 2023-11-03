// Add copy button to <pre> blocks
function addCopyButton() {
  const codeBlocks = document.querySelectorAll("pre");
  codeBlocks.forEach((codeBlock) => {
    const copyButton = document.createElement("button");
    copyButton.innerHTML = "Copy";
    copyButton.classList.add("copyButton");
    copyButton.addEventListener("click", () => {
      const textToCopy = codeBlock.innerText.trim();
      copyToClipboard(textToCopy);
    });
    codeBlock.appendChild(copyButton);
  });
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Text copied to clipboard:", text);
    })
    .catch((err) => {
      console.error("Failed to copy: ", err);
    });
}

addCopyButton();