import 'regenerator-runtime/runtime';
const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  limit,
} = require('firebase/firestore');
import { initContract, login, logout } from './utils';

const firebaseConfig = getConfig('firebase');
const { FIRESTORE_DATABASE_NAME, FIRESTORE_COLLECTION_NAME } = firebaseConfig;

import getConfig from './config';
const { networkId } = getConfig(process.env.NODE_ENV || 'development');

/**
 * Настройки подключения к базе данных
 */
const databaseConfig = {
  projectId: FIRESTORE_DATABASE_NAME,
  databaseURL: `https://${FIRESTORE_DATABASE_NAME}.firebaseio.com`,
};
const app = initializeApp(databaseConfig);

const db = getFirestore(app);

/**
 * Получение списка из базы данных
 * @param {number} count
 * @returns {MetadataObjectType[]}
 */
async function getFromDb(count) {
  const newCol = collection(db, FIRESTORE_COLLECTION_NAME);
  const q = query(newCol, limit(count));
  const snapShot = await getDocs(q);
  const result = [];
  const array = [];
  for (let i = 0; snapShot.docs[i]; i++) {
    const item = snapShot.docs[i];
    const id = item._document.key.path.segments[6];
    const data = item.data();
    array.push(data.id);
    result.push(data);
    deleteDoc(doc(db, FIRESTORE_COLLECTION_NAME, id));
  }
  return { result, array };
}

/**
 * Обработка нажания на кнопу Получить
 */
const button = document.querySelector('#send');
const input = document.querySelector('#count');
button.addEventListener('click', async () => {
  const count = parseInt(input.value, 10);
  const { result, array } = await getFromDb(isNaN(count) ? 0 : count);
  // Результат выводит в консоль
  console.log('LOG: ', result, array);
});

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
