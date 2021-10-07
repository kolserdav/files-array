//@ts-check
import 'regenerator-runtime/runtime';
import { initContract, login, logout } from './utils';

import getConfig from './config';
const { networkId } = getConfig(process.env.NODE_ENV || 'development');

/////////////////// ДОБАВЛЕННЫЙ СКРИПТ ////////////////////////////////////////////////////

// ВНИМАНИЕ ts check вверху файла для чекировки типов IDE-шкой vscode по аннотациям
// он свое дело делает, но много на что местное ругается потому что jsonfig.json не настроен (остутствует)

// Урл сервера
//const SERVER_URL = 'http://localhost:3001';
const SERVER_URL = 'http://45.147.179.64';

// Ссылки на блоки HTML по селекторам
const button = document.querySelector('#send');
const input = document.querySelector('#count');
const countInfo = document.querySelector('#count-info');

/**
 * Функция запроса на сервер
 * @param {{
 *  method: 'GET' | 'POST' | 'DELETE' | 'PUT';
 *  url: string;
 *  headers?: {
 *    [name: string]: string;
 *  }
 * }} options
 * @returns {Promise<{
 *  status: number;
 *  data: [
 *    {
 *      media: string;
 *      id: number;
 *      extra: string;
 *      id: number;
 *      title: string;
 *    }
 *  ] | null | undefined;
 * }>}
 */
function requestToApi(options) {
  const { method, url, headers } = options;
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  if (headers) {
    const headerKeys = Object.keys(headers);
    for (let i = 0; headerKeys[i]; i++) {
      const headerKey = headerKeys[i];
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }
  xhr.responseType = 'json';
  xhr.send();
  return new Promise((resolve, reject) => {
    xhr.onload = function () {
      resolve({
        status: xhr.status,
        data: xhr.response,
      });
    };
    xhr.onerror = function () {
      const errMess = 'Network error';
      console.warn(errMess, xhr);
      reject(errMess);
    };
  });
}

/**
 * Устанавливает количество оставшихся элементов на страницу
 * @returns {Promise<void>}
 */
async function setAllAmount() {
  const amountRes = await requestToApi({
    method: 'GET',
    url: `${SERVER_URL}/api/v1/amount`,
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch((err) => {
    throw new Error(err);
  });
  const { status, data } = amountRes;
  if (status !== 200) {
    console.warn('Unavailable status of request', amountRes);
  }
  // Пишет число на странице
  countInfo.innerHTML = data[0].toString();
}

/**
 * Событие загрузки страницы
 */
window.onload = async () => {
  await setAllAmount();
};

/**
 * Обработка нажания на кнопу Получить
 */
button.addEventListener('click', async () => {
  const count = parseInt(input.getAttribute('value'), 10);
  const apiResult = await requestToApi({
    method: 'GET',
    url: `${SERVER_URL}/api/v1/punks/${count}`,
    headers: {
      'Content-Type': 'application/json',
    },
  }).catch((e) => {
    // Если сервер не отвечает выбрасывает исключение
    throw new Error(e);
  });
  const { status, data } = apiResult;
  // проверяет что данные получены и можно без ошибок двигаться дальше
  if (status !== 200) {
    console.warn('Unavailable status of request', apiResult);
    return;
  }
  const array = [];
  for (let i = 0; data[i]; i++) {
    const item = data[i];
    array.push(item.id);
  }
  // Результат выводит в консоль
  console.info(data, array);
  // Пишет оставшиеся
  await setAllAmount();
});
//////////КОНЕЦ ДОБАЛЕННОГО СКРИПТА//////////////////////////////////////////

// global variable used throughout
let currentGreeting;

const submitButton = document.querySelector('form button');

document.querySelector('form').onsubmit = async (event) => {
  event.preventDefault();

  // get elements from the form using their id attribute
  const { fieldset, greeting } = event.target.elements;

  // disable the form while the value gets updated on-chain
  fieldset.disabled = true;

  try {
    // make an update call to the smart contract
    await window.contract.set_greeting({
      // pass the value that the user entered in the greeting field
      message: greeting.value,
    });
  } catch (e) {
    alert(
      'Something went wrong! ' +
        'Maybe you need to sign out and back in? ' +
        'Check your browser console for more info.'
    );
    throw e;
  } finally {
    // re-enable the form, whether the call succeeded or failed
    fieldset.disabled = false;
  }

  // disable the save button, since it now matches the persisted value
  submitButton.disabled = true;

  // update the greeting in the UI
  await fetchGreeting();

  // show notification
  document.querySelector('[data-behavior=notification]').style.display = 'block';

  // remove notification again after css animation completes
  // this allows it to be shown again next time the form is submitted
  setTimeout(() => {
    document.querySelector('[data-behavior=notification]').style.display = 'none';
  }, 11000);
};

document.querySelector('input#greeting').oninput = (event) => {
  if (event.target.value !== currentGreeting) {
    submitButton.disabled = false;
  } else {
    submitButton.disabled = true;
  }
};

document.querySelector('#sign-in-button').onclick = login;
document.querySelector('#sign-out-button').onclick = logout;

// Display the signed-out-flow container
function signedOutFlow() {
  document.querySelector('#signed-out-flow').style.display = 'block';
}

// Displaying the signed in flow container and fill in account-specific data
function signedInFlow() {
  document.querySelector('#signed-in-flow').style.display = 'block';

  document.querySelectorAll('[data-behavior=account-id]').forEach((el) => {
    el.innerText = window.accountId;
  });

  // populate links in the notification box
  const accountLink = document.querySelector('[data-behavior=notification] a:nth-of-type(1)');
  accountLink.href = accountLink.href + window.accountId;
  accountLink.innerText = '@' + window.accountId;
  const contractLink = document.querySelector('[data-behavior=notification] a:nth-of-type(2)');
  contractLink.href = contractLink.href + window.contract.contractId;
  contractLink.innerText = '@' + window.contract.contractId;

  // update with selected networkId
  accountLink.href = accountLink.href.replace('testnet', networkId);
  contractLink.href = contractLink.href.replace('testnet', networkId);

  fetchGreeting();
}

// update global currentGreeting variable; update DOM with it
async function fetchGreeting() {
  currentGreeting = await contract.get_greeting({ account_id: window.accountId });
  document.querySelectorAll('[data-behavior=greeting]').forEach((el) => {
    // set divs, spans, etc
    el.innerText = currentGreeting;

    // set input elements
    el.value = currentGreeting;
  });
}

// `nearInitPromise` gets called on page load
window.nearInitPromise = initContract()
  .then(() => {
    if (window.walletConnection.isSignedIn()) signedInFlow();
    else signedOutFlow();
  })
  .catch(console.error);
