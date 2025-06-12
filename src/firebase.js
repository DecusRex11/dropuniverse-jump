import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCV7UnuF4-m2BoymrzctS49JuSlTrP1Sx0",
  authDomain: "dropuniverse-78d3b.firebaseapp.com",
  projectId: "dropuniverse-78d3b",
  storageBucket: "dropuniverse-78d3b.appspot.com",
  messagingSenderId: "345876881075",
  appId: "1:345876881075:web:964f9b4004fc1222b21ac6",
  measurementId: "G-16ENE2WV4E"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, addDoc, getDocs, query, orderBy, limit, where, doc, updateDoc };
