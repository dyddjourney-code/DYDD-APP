import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
// Use the existing protected network transport without exposing its credentials.
const proxy=process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
export async function launchReviewBrowser(){
 return puppeteer.launch({
  args:[...chromium.args.filter(a=>!["--single-process","--disable-web-security"].includes(a)),
    ...(proxy?["--proxy-server="+proxy.protocol+"//"+proxy.hostname+":"+proxy.port,"--proxy-bypass-list=localhost;127.0.0.1"]:[])],
  executablePath:await chromium.executablePath(),headless:true,acceptInsecureCerts:!!proxy
 });
}
export async function authenticateReviewPage(page){
 if(proxy?.username)await page.authenticate({username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)});
}
