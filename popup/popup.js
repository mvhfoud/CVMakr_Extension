import { scrapeJobDetails } from "../scripts/scrapeJob.js";

const statusEl = document.getElementById("status");
const scrapeButton = document.getElementById("scrapeButton");
const languageSelect = document.getElementById("language");

const setStatus = (message, state = "idle") => {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
};

const setLoading = (isLoading) => {
  scrapeButton.disabled = isLoading;
  if (languageSelect) languageSelect.disabled = isLoading;
  scrapeButton.textContent = isLoading ? "Processing..." : "Scrape Job";
};

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("Could not determine the active tab.");
  }
  return tab.id;
};

const scrapeActiveTab = async () => {
  const tabId = await getActiveTabId();
  const [injectionResult] = await chrome.scripting.executeScript({
    target: { tabId },
    func: scrapeJobDetails,
  });

  if (!injectionResult?.result) {
    throw new Error("The page did not return any job data.");
  }

  return injectionResult.result;
};

const submitJobData = async (payload, language) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "submitJobData", payload, language }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.error ?? "Unable to reach backend."));
        return;
      }

      resolve(response);
    });
  });

const getSelectedLanguage = () => languageSelect?.value ?? "fr";

const handleScrapeClick = async () => {
  const language = getSelectedLanguage();
  setLoading(true);
  setStatus("Scraping data from this page...", "working");

  try {
    const jobData = await scrapeActiveTab();
    setStatus("Sending job to backend...", "working");
    await submitJobData(jobData, language);
    setStatus("Job sent to backend successfully!", "success");
  } catch (error) {
    console.error("CVMakr Scraper", error);
    setStatus(error.message ?? "Something went wrong.", "error");
  } finally {
    setLoading(false);
  }
};

scrapeButton?.addEventListener("click", handleScrapeClick);
