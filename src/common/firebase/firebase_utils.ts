import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, query, collection} from 'firebase/firestore/lite';

const prefix = "[FIREBASE_UTILS]"
const firebaseConfig = {
    apiKey: "AIzaSyAf6_nhfIvkEL8KAiNSjAS_hUz1G8Ilvq0",
    authDomain: "street-noshery.firebaseapp.com",
    projectId: "street-noshery",
    storageBucket: "street-noshery.firebasestorage.app",
    messagingSenderId: "838601906801",
    appId: "1:838601906801:web:0379e0f53a720f97da59d0",
    measurementId: "G-L72PCGF0DL"
  };

let app;
let firebaseDb;

const initializeFirebaseApp = () => {
    try {
        app = initializeApp(firebaseConfig);
        firebaseDb = getFirestore();
        return app;
    } catch (error) {
        console.log(`${prefix} (initializeFirebaseApp) Error: ${JSON.stringify(error)}`);
        throw error;
    }
}

const uploadProcessedData = (data: any, collection: string, document: string) => {

    try {
        const documentRef = doc(firebaseDb, collection, document);
        const dataUpdated = setDoc(documentRef, data);
        return dataUpdated;
    } catch (error) {
       console.log(`${prefix} (uploadProcessedData) Error: ${JSON.stringify(error)}`);
       throw error;
    }
}

const getTheData = async (collectionName: string) => {
    try {
        const collectionRef = collection(firebaseDb, collectionName);
        const q = query(collectionRef);
        const finalData = []
        const docMap = await getDocs(q);
        docMap.forEach((doc) => {
            finalData.push(doc.data())
        });
        const res = JSON.stringify(finalData)
        return JSON.parse(res);
    } catch (error) {
        console.log(`${prefix} (getTheData) Error: ${JSON.stringify(error)}`);
       throw error;
    }
}

const getFirebaseApp = async () => app;

module.exports = {
    initializeFirebaseApp,
    getFirebaseApp,
    uploadProcessedData,
    getTheData
}