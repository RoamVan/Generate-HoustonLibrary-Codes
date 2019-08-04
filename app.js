const app = require('express')();
const puppeteer = require('puppeteer')
const fakeInfoGenerator = 'https://www.fakeaddressgenerator.com/World_Address/get_us_address/city/Houston'
const HoustonLibrary = 'https://halan.sdp.sirsi.net/client/en_US/hou/search/registration/$N?pc=SYMWS_HOUSTON'

app.post('/generate', async (req,res)=> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  })

  const page = await browser.newPage()
  await page.goto(fakeInfoGenerator, { waitUntil: 'networkidle0', timeout: false }) // wait until page load
  // get name, color from the page dom
  // split both values into an array of words
  const info = await page.evaluate(() => {
    let basicInfoTitles = Array.from(document.querySelectorAll('table tr td span')).map(x => x.innerHTML)
    let basicInfoValues = Array.from(document.querySelectorAll('table tr td strong')).map(x => x.innerHTML)

    let titles = Array.from(document.querySelectorAll('div>.col-md-4>span')).map(x => x.innerText)
    let values = Array.from(document.querySelectorAll('div>.col-md-8>strong>input')).map(x => x.value)
    let address = {}
    let basicInfo = {}

    for(let i=0; i<=basicInfoTitles.length; i++) {
      basicInfo[basicInfoTitles[i]] = basicInfoValues[i]
    }
    for(let i=0; i<=titles.length; i++) {
      address[titles[i]] = values[i]
    }

    return {...address, ...basicInfo}
  })

  await page.goto(HoustonLibrary, { waitUntil: 'networkidle0', timeout: false }) // wait until page load

  const randomPIN = await page.evaluate( info => {
    const splitName = info['Full Name'].split('&nbsp;')
    const firstName = splitName[0]
    const lastName = splitName[2]
    const randomPIN = Math.round(Math.random()* 32201);

    document.querySelector('input.FIRST_NAME').value = firstName
    document.querySelector('input.LAST_NAME').value = lastName
    document.querySelector('input.LAST_NAME').value = lastName
    document.querySelector('input.BIRTH_DATE').value = info['Birthday']
    document.querySelector('input.ADDRESS').value = info['Street']
    document.querySelector('input.CITY').value = info['City']
    document.querySelector('input.STATE').value = info['State']
    document.querySelector('input.ZIP').value = info['Zip Code']
    document.querySelector('input.PHONE_NUMBER').value = info['Phone Number']
    document.querySelector('input.EMAIL_ADDRESS#confirmField1').value = `hoda${randomPIN}@gmail.com`
    document.querySelector('input.EMAIL_ADDRESS#confirmField2').value = `hoda${randomPIN}@gmail.com`
    document.querySelector('#pwdField1').value = randomPIN
    document.querySelector('#pwdField2').value = randomPIN
    document.querySelector('#registrationSubmit').click();
    
    return randomPIN
  }, info)

  await page.waitForSelector('.postRegistration p')
  
  const libraryCode = await page.evaluate(()=> document.querySelector('.postRegistration p').innerText.split(' ')[5].trim().replace('.',''))

  res.status(200).send({randomPIN, code: Number(libraryCode)})
 })

app.listen(3000, ()=> console.log('app started on 3000'))