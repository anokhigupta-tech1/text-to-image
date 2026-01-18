const themeToggle = document.querySelector(".theme-toggle");
const promptform = document.querySelector(".prompt-form");
const promptinput = document.querySelector(".prompt-input");
const promptbtn = document.querySelector(".prompt-btn");

const modelselect = document.getElementById("model-select");
const countselect = document.getElementById("count-select");
const ratioselect = document.getElementById("ratio-select");

const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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";

const ExamplePrompts = [
  "A powerful wizard casting magic, glowing effects, fantasy art",
  "A dragon flying above ancient ruins, epic fantasy scene, cinematic lighting",
  "A mysterious forest with glowing lights, magical atmosphere"
];



// download
const downloadImage = (src, filename = "ai-image.png") => {
  const link = document.createElement("a");
  link.href = src;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


/* ================= THEME ================= */

(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);

  document.body.classList.toggle("dark-theme", isDarkTheme);

  const icon = themeToggle?.querySelector("i");
  if (icon) {
    icon.className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
})();

const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");

  const icon = themeToggle?.querySelector("i");
  if (icon) {
    icon.className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
};

/* ================= IMAGE SIZE ================= */

const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [w, h] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(w * h);

  let width = Math.round(w * scaleFactor);
  let height = Math.round(h * scaleFactor);

  // must be multiple of 16
  width = Math.floor(width / 16) * 16;
  height = Math.floor(height / 16) * 16;

  return { width, height };
};



/* ================= API CALL ================= */

const generateImage = async (
  selectedModel,
  imageCount,
  aspectRatio,
  promptText
) => {
  const MODEL_URL = "https://router.huggingface.co/nscale/v1/images/generations";
  const { width, height } = getImageDimensions(aspectRatio);

  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    const imgCard = document.querySelector(`#img-card-${i}`);
    const imgEl = imgCard.querySelector(".result-img");
    const statusBox = imgCard.querySelector(".status-container");

    try {
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: promptText,
          width,
          height,
          response_format: "b64_json",
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      const base64 = data.data[0].b64_json;

       imgEl.src = `data:image/png;base64,${base64}`;

      imgEl.onload = () => {
        imgCard.classList.remove("loading");
        statusBox.remove();

        const downloadBtn = imgCard.querySelector(".img-download-btn");
        downloadBtn.addEventListener("click", () => {
          downloadImage(imgEl.src, `ai-image-${i + 1}.png`);
        });
      };

    } catch (error) {
      console.error("Image generation error:", error);
      statusBox.innerHTML = `<p class="status-text">Failed</p>`;
    }
  });

  await Promise.allSettled(imagePromises);
};





/* ================= UI CARDS ================= */

const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  gridGallery.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    gridGallery.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio:${aspectRatio.replace("/", " / ")}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
        <img class="result-img" />
         <div class="img-overlay">
                    <button class="img-download-btn" title="Download">
                        <i class="fa-solid fa-download"></i>
                    </button>
                </div>
      </div>
    `;
  }

  generateImage(selectedModel, imageCount, aspectRatio, promptText);
};

/* ================= FORM ================= */

const handleFormSubmit = (e) => {
  e.preventDefault();

  const promptText = promptinput.value.trim();
  if (!promptText) return;

  const selectedModel = modelselect.value;
  const imageCount = parseInt(countselect.value) || 1;
  const aspectRatio = ratioselect.value || "1/1";

  createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

/* ================= RANDOM PROMPT ================= */

promptbtn.addEventListener("click", () => {
  const randomIndex = Math.floor(Math.random() * ExamplePrompts.length);
  promptinput.value = ExamplePrompts[randomIndex];
  promptinput.focus();
});

/* ================= EVENTS ================= */

promptform.addEventListener("submit", handleFormSubmit);
themeToggle?.addEventListener("click", toggleTheme); 