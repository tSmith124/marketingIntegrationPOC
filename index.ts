if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}

const puppeteer = require("puppeteer-extra")
const proxyChain = require("proxy-chain")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const UserAgent = require("user-agents")

puppeteer.use(StealthPlugin())

const linkedin = "https://www.linkedin.com/campaignmanager/"
const iframeSelector = "iframe[title='Login']"

const generateUserAgent = new UserAgent({ deviceCategory: "desktop" })

async function run() {
  const oldProxyUrl = `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}_country-UnitedStates@24.199.75.16:31112`

  const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl)
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--proxy-server=${newProxyUrl}`],
  })
  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      new UserAgent([/CrOS/, { deviceCategory: "desktop" }]).toString()
    )
    await page.goto(linkedin)
    await page.waitForSelector("iframe")
    const iframeElementHandle = await page.$(iframeSelector)
    const frame = await iframeElementHandle.contentFrame()
    console.log(frame)
    await page.screenshot({ path: "login.png", fullPage: true })
    await new Promise((resolve) => setTimeout(resolve, 5000))
    await frame.type("#username", "Bobs burgers", { delay: 80 })
    await frame.type("#password", "Test2Password", { delay: 75 })
    await page.screenshot({ path: "example.png", fullPage: true })
  } catch (error) {
    console.error("Jobs scrape failed", error)
  } finally {
    await browser.close()
    proxyChain.closeAnonymizedProxy(newProxyUrl, true)
  }
}

run()
