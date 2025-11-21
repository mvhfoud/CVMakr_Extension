export function scrapeJobDetails() {
  const SITE_PROFILES = [
    {
      id: "linkedin",
      matches: (hostname) => hostname.includes("linkedin.com"),
      jobTitleSelectors: [
        "h1.jobs-unified-top-card__job-title",
        ".top-card-layout__title",
        "h1.jobs-delivery-top-card__job-title",
        ".jobs-details-top-card__job-title"
      ],
      jobDescriptionSelectors: [
        "div.jobs-description-content__text",
        "section.jobs-box__html-content",
        "div.jobs-search__job-details--wrapper",
        "section.jobs-description"
      ]
    },
    {
      id: "welcome-to-the-jungle",
      matches: (hostname) =>
        hostname.includes("wttj.co") ||
        hostname.includes("welcometothejungle.com"),
      jobTitleSelectors: [
        "header div[data-testid='job-title']",
        "#the-position-section h2",
        ".sc-brzPDJ.gYuzol h2",
        "h1.job-detail-header__title"
      ],
      jobDescriptionSelectors: [
        "#the-position-section",
        "div#the-position-section .sc-brDdJf",
        "section[data-testid='job-description']",
        "div[data-testid='jobDescription']"
      ]
    }
  ];

  const cleanText = (node) =>
    typeof node?.innerText === "string" ? node.innerText.trim() : "";

  const collapseWhitespace = (text) =>
    typeof text === "string" ? text.replace(/\s+/g, " ").trim() : "";

  const trimDescription = (text) => collapseWhitespace(text).slice(0, 6000);

  const textFromSelectors = (selectors = []) => {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      const text = cleanText(element);
      if (text) {
        return text;
      }
    }
    return "";
  };

  const textFromKeywordContainers = (keywords, minimumLength = 80) => {
    const candidates = Array.from(
      document.querySelectorAll("section, article, div")
    ).slice(0, 200);

    for (const element of candidates) {
      const label = `${element.id ?? ""} ${element.className ?? ""}`.toLowerCase();
      if (!keywords.some((keyword) => label.includes(keyword))) {
        continue;
      }

      const text = cleanText(element);
      if (text.length >= minimumLength) {
        return text;
      }
    }

    return "";
  };

  const fallbackDescription = () => {
    const primary = cleanText(document.querySelector("main"));
    if (primary.length > 120) return primary;

    const article = cleanText(document.querySelector("article"));
    if (article.length > 120) return article;

    return collapseWhitespace(document.body?.innerText ?? "");
  };

  const getSiteProfile = () => {
    const hostname = window.location.hostname;
    return SITE_PROFILES.find((profile) => profile.matches(hostname));
  };

  const siteProfile = getSiteProfile();

  const genericJobTitleSelectors = [
    '[data-testid*="jobtitle" i]',
    '[data-testid*="job-title" i]',
    '[data-test*="jobtitle" i]',
    '[data-test*="job-title" i]',
    '#jobTitle',
    '#job-title',
    '.jobTitle',
    '.job-title',
    'h1[class*="job" i]',
    'h1[class*="title" i]',
    'header h1',
    'h1'
  ];

  const genericDescriptionSelectors = [
    '[data-testid*="jobdescription" i]',
    '[data-testid*="job-description" i]',
    '[data-test*="jobdescription" i]',
    '[data-test*="job-description" i]',
    '#jobDescription',
    '#job-description',
    '.jobDescription',
    '.job-description',
    'section[class*="description" i]',
    'article[class*="description" i]'
  ];

  const jobTitle = collapseWhitespace(
    textFromSelectors([
      ...(siteProfile?.jobTitleSelectors ?? []),
      ...genericJobTitleSelectors
    ]) || document.title || "Untitled"
  );

  const descriptionCandidates = [
    textFromSelectors([...(siteProfile?.jobDescriptionSelectors ?? [])]),
    textFromSelectors(genericDescriptionSelectors),
    textFromKeywordContainers([
      'job-description',
      'description',
      'jobdesc',
      'posting',
      'jd'
    ]),
    fallbackDescription()
  ].filter(Boolean);

  const jobDescription = trimDescription(descriptionCandidates[0] ?? "");

  return {
    jobTitle,
    jobDescription,
    sourceUrl: window.location.href,
    pageTitle: document.title,
    scrapedAt: new Date().toISOString(),
    matchedProfile: siteProfile?.id ?? null
  };
}
