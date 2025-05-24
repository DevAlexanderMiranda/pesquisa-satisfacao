// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-analytics.js";

// Configuração do Firebase - usando a mesma configuração do admin-dashboard.js
const firebaseConfig = {
  apiKey: "AIzaSyCtNLfOJD4CRwkv9juSmUh7IYatwYlp4Wk",
  authDomain: "pesquisa-cgmp.firebaseapp.com",
  projectId: "pesquisa-cgmp",
  storageBucket: "pesquisa-cgmp.firebasestorage.app",
  messagingSenderId: "119370101321",
  appId: "1:119370101321:web:c51d32c3e2164514034598",
  measurementId: "G-64QV87VNP3"
};

// Inicializar Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app); 