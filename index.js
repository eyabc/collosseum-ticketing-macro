const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';


const ALL_CODE = '3C38AB77-8D5A-5394-05B2-0172EB8E7D46';
const TEST_CODE = '4A7522CC-A84C-66A9-4696-0184CCEF246B';
// TICKET COLOSSEUM, ROMAN FORUM, PALATINE_24H
const CODES = [
  {
    name: "TICKET COLOSSEUM, ROMAN FORUM, PALATINE_24H",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=3793660E-5E3F-9172-2F89-016CB3FAD609&catalogid=B79E95CA-090E-FDA8-2364-017448FF0FA0&lang=en",
    id: '3793660E-5E3F-9172-2F89-016CB3FAD609'
  },
  {
    name: "COLOSSEUM, ROMAN FORUM AND PALATINE REGULAR ENTRANCE + COLOSSEUM ENGLISH TOUR",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=96DBBFE1-BC45-FDCB-5E1B-016CF138154A&catalogid=7049E852-9020-9834-008D-017FD631028C&lang=en",
    id: '96DBBFE1-BC45-FDCB-5E1B-016CF138154A'
  },
  {
    name: "AUDIOVIDEOGUIDE OF THE COLOSSEUM WITH TICKET COLOSSEUM, ROMAN FORUM, PALATINE_H24",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=AE8820FC-C53D-0F3E-6713-016CF6570523&catalogid=466C5A0D-1C2F-B104-2B6A-017449059F91&lang=en",
    id: 'AE8820FC-C53D-0F3E-6713-016CF6570523'
  },
  {
    name: "AUDIOGUIDE OF THE COLOSSEUM WITH TICKET COLOSSEUM, ROMAN FORUM, PALATINE, IMPERIAL FORUM_H24",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=9997D88D-FA4F-3E44-5926-016CF656C1DB&catalogid=651BBD5D-2836-278C-02D3-017B3E8BBA1E&lang=en",
    id: '9997D88D-FA4F-3E44-5926-016CF656C1DB'
  },
  {
    name: "FULL EXPERIENCE TICKET WITH ACCESS TO THE ARENA OF THE COLOSSEUM",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=3C38AB77-8D5A-5394-05B2-0172EB8E7D46&catalogid=F3CB77BD-6A43-108B-6723-0174490EB610&lang=en",
    id: '3C38AB77-8D5A-5394-05B2-0172EB8E7D46'
  },
  {
    name: "FULL EXPERIENCE TICKET WITH ACCESS TO THE ARENA AND UNDERGROUND OF THE COLOSSEUM",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=D7E12B2E-46C4-074B-5FC5-016ED579426D&catalogid=DDDA3AB3-47BC-0A49-7752-0174490F632A&lang=en",
    id: 'D7E12B2E-46C4-074B-5FC5-016ED579426D'
  },
  {
    name: "ENGLISH DIDACTIC VISIT FOR INDIVIDUALS AND FULL EXPERIENCE TICKET",
    url: "https://ecm.coopculture.it/index.php?option=com_snapp&view=event&id=490E25D6-2465-ED3A-6A13-016ED583FB68&catalogid=238D971A-D296-07C6-7A82-0174490F9C7B&lang=en",
    id: '490E25D6-2465-ED3A-6A13-016ED583FB68'
  },
];


const fetchAPI = async (code, year, month, startDate, endDate) => {
  const {id} = code
  const { data } = await axios.get(
    `https://ecm.coopculture.it/index.php?option=com_snapp&task=event.getEventsCalendar&format=raw&id=${id}&month=${month}
        &year=${year}&lang=en&_=${(new Date()).getTime()}`,
  );

  const $ = cheerio.load(data);


  const resultsArr = [];
  Object.values($('.calendar-day'))
        .filter((a, i) => {
          if (startDate > i + 1 || endDate > i)
            try {
              const f = a.attribs.style === 'background: #ceead0';
              if (f) {
                resultsArr.push(i + 1);
              }
              return f;
            } catch(e) {
              return false;
            }
        })

  return {
    ...code,
    date: resultsArr
  }


}

function createIssue(result) {

  const token = process.env.GITHUB_TOKEN;
  const body = fs.readFileSync('./resultTemplate.md', 'utf-8').replace('result_string', JSON.stringify(result, null, 2));
  const data = {
    title: new Date().toISOString(),
    body,
  };

  console.log(data);

  axios.post(`https://api.github.com/repos/eyabc/collosseum-ticketing-macro/issues`, data, {
    headers: {
      'Authorization': `token ${token}`
    }
  })
       .then((response) => {
         console.log(response.data);
       })
       .catch((error) => {
         console.error(error);
       });

}


const execute = async (year, month, startDate, endDate) => {

  const result = await Promise.all(CODES.map((item) => {
    return fetchAPI(item, year, month, startDate, endDate);
  }))

  return result.filter(item => !!item.date.length)

}

(async() => {
  const result = await execute(new Date().getFullYear(), 5, 2, 5);

  if (result.length !== 0) {
    createIssue(result);
  }
})()