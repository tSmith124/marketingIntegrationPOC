if (process.env.NODE_ENV !== "production") {
  require("dotenv").config()
}

import puppeteer from "puppeteer-extra"
const proxyChain = require("proxy-chain")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const UserAgent = require("user-agents")
const OTPAuth = require("otpauth")

puppeteer.use(StealthPlugin())

const sf = "https://login.salesforce.com/"
const iframeSelector = "iframe[title='Login']"

const generateUserAgent = new UserAgent({ deviceCategory: "desktop" })

async function run() {
  const oldProxyUrl = `http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}_country-UnitedStates@24.199.75.16:31112`

  const newProxyUrl = await proxyChain.anonymizeProxy(oldProxyUrl)
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--proxy-server=${newProxyUrl}`],
  })
  try {
    const page = await browser.newPage()
    await page.setUserAgent(
      new UserAgent([/CrOS/, { deviceCategory: "desktop" }]).toString()
    )

    let totp = new OTPAuth.TOTP({
      digits: 6,
      period: 30,
      secret: process.env.SF_SECRET,
    })

    await page.goto(sf)
    await page.screenshot({ path: "login.png", fullPage: true })
    await new Promise((resolve) => setTimeout(resolve, 4000))
    await page.locator("input[name='username']").fill(process.env.SF_EMAIL!)
    await page.locator("input[name='pw']").fill(process.env.SF_PASSWPORD!)
    await page.locator("input[name='Login']").click()
    let token1 = totp.generate()
    console.log(token1)
    //await new Promise((resolve) => setTimeout(resolve, 20000))

    //await frame?.type("#password", "Test2Password", { delay: 75 })
    //await page.screenshot({ path: "example.png", fullPage: true })
    let token2 = totp.generate()
    console.log(token2)

    await page
      .locator("input[name='tc']")
      .fill(`${token1 != token2 ? token2 : token1}`)

    await page.locator("input[value='Verify']").click()

    //await page.screenshot({ path: "sfAuth.png", fullPage: true })

    await new Promise((resolve) => setTimeout(resolve, 15000))
    await page.screenshot({ path: "sfAccess.png", fullPage: true })
  } catch (error) {
    console.error("Jobs scrape failed", error)
  } finally {
    await browser.close()
    proxyChain.closeAnonymizedProxy(newProxyUrl, true)
  }
}

run()
