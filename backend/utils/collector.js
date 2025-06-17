const { sleep } = require("./timing");

async function collectJobLinks(page, query, pageCount) {
  const encodedQuery = encodeURIComponent(query.trim());
  const jobLinks = new Set();

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const url = `https://www.cakeresume.com/jobs?query=${encodedQuery}&page=${pageNum}`;
    console.log(`🌐 Visiting page ${pageNum}: ${url}`);
    await page.goto(url);
    await page.mouse.wheel(0, 3000);
    await sleep(2000); // wait for lazy loading

    const links = await page.$$eval(
      'a[class^="JobSearchItem_jobTitle__"]',
      (anchors) =>
        anchors.map((link) =>
          link.href.startsWith("/companies")
            ? `https://www.cakeresume.com${link.getAttribute("href")}`
            : link.href
        )
    );

    console.log(`🔗 Page ${pageNum}: Found ${links.length} job links`);
    links.forEach((link) => jobLinks.add(link));
  }

  console.log(`✅ Total unique job links collected: ${jobLinks.size}`);

  return jobLinks;
}

module.exports = {
  collectJobLinks,
};
