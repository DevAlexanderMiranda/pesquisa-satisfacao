// Importar Firebase diretamente dos CDNs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, query, where, collection, updateDoc } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";

// Configuração do Firebase - copiada do firebase-config.js
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Elementos DOM
const loginForm = document.getElementById('loginForm');
const loginErrorMsg = document.createElement('div');
loginErrorMsg.className = 'error-message';
loginForm.appendChild(loginErrorMsg);
const loadingOverlay = document.getElementById('loadingOverlay');

// Funções para controlar o loading overlay
function showLoadingOverlay() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoadingOverlay() {
  loadingOverlay.classList.add('hidden');
}

// Inicialmente esconder o loading overlay
hideLoadingOverlay();

// Verificar estado de autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  console.log("Verificando autenticação...");
  
  // Verificar se o usuário já está logado
  auth.onAuthStateChanged(function(user) {
    if (user) {
      console.log("Usuário já está logado:", user.email);
      showLoadingOverlay();
      window.location.href = "admin-dashboard.html";
    } else {
      console.log("Usuário não está logado");
      hideLoadingOverlay();
    }
  });
});

// Função para verificar usuários com senha temporária
async function checkTemporaryUser(email, password) {
  try {
    console.log("Verificando usuário temporário:", email);
    // Buscar usuário no Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email), where("isPasswordTemporary", "==", true));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log("Encontrado usuário temporário");
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Verificar se a senha armazenada corresponde
      if (btoa(password) === userData.password) {
        console.log("Senha temporária válida");
        
        // Criar usuário no Firebase Auth
        await createUserWithEmailAndPassword(auth, email, password);
        
        // Atualizar documento para remover a senha temporária
        await updateDoc(doc(db, "users", userDoc.id), {
          password: null,
          isPasswordTemporary: false,
          status: 'active',
          updatedAt: new Date().toISOString()
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Erro ao verificar usuário temporário:", error);
    return false;
  }
}

// Manipulador de Login - Versão simplificada
loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const emailInput = loginForm.querySelector('input[type="email"]');
  const passwordInput = loginForm.querySelector('input[type="password"]');
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  console.log("Tentando login com:", email);
  loginErrorMsg.textContent = '';
  
  // Validação básica
  if (!email || !password) {
    loginErrorMsg.textContent = "Por favor, preencha todos os campos.";
    return;
  }
  
  // Mostrar o loading overlay
  showLoadingOverlay();
  
  // Desabilitar botão durante login
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando...";
  
  try {
    // Primeiro, verificar se é um usuário com senha temporária
    const isTemporaryUser = await checkTemporaryUser(email, password);
    
    if (isTemporaryUser) {
      console.log("Usuário temporário ativado, realizando login");
      // Usuário foi registrado pelo método acima, agora faça login normalmente
    }
    
    // Login simples e direto
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login bem-sucedido!");
    window.location.href = "admin-dashboard.html";
  } catch (error) {
    console.error("Erro de login:", error.code, error.message);
    
    // Esconder loading overlay em caso de erro
    hideLoadingOverlay();
    
    // Mensagem de erro amigável
    if (error.code === 'auth/invalid-credential' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/user-not-found') {
      loginErrorMsg.textContent = "Email ou senha incorretos.";
    } else {
      loginErrorMsg.textContent = "Erro ao fazer login: " + error.message;
    }
    
    // Destacar campos com erro
    emailInput.classList.add('error-input');
    passwordInput.classList.add('error-input');
  } finally {
    // Restaurar botão
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Esqueci minha senha (simplificado)
const forgotForm = document.getElementById('forgotForm');
const forgotErrorMsg = document.createElement('div');
forgotErrorMsg.className = 'error-message';
forgotForm.appendChild(forgotErrorMsg);

forgotForm.addEventListener('submit', function(e) {
  e.preventDefault();
  alert("Funcionalidade em desenvolvimento");
  
  // Voltar para login
  window.showSignIn();
}); 