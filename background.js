const API_ENDPOINT = "http://localhost:8000/jobs";

const normalizeLanguage = (value) => (value === "en" ? "en" : "fr");

const buildRequestBody = (jobData, language) => ({
  url: jobData?.sourceUrl ?? jobData?.pageUrl ?? "",
  job_description: jobData?.jobDescription ?? "",
  language: normalizeLanguage(language)
});

const postJobToApi = async (jobData, language) => {
  if (!jobData?.jobDescription) {
    throw new Error("Missing job description from the page.");
  }

  if (!jobData?.sourceUrl) {
    throw new Error("Missing source URL for this job.");
  }

  const body = buildRequestBody(jobData, language);
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const responseText = await response.text();
  let parsed;
  try {
    parsed = responseText ? JSON.parse(responseText) : null;
  } catch {
    parsed = { raw: responseText };
  }

  if (!response.ok) {
    const errorMessage =
      parsed?.message || parsed?.detail || response.statusText || "Backend error";
    throw new Error(errorMessage);
  }

  return parsed;
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "submitJobData") {
    postJobToApi(message.payload, message.language)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});
