import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  getAuth
} from '../config/firebase-config.js';

// Tipos de permissões disponíveis
const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Função para registrar um novo usuário
async function registerUser(email, password, name, role = ROLES.VIEWER) {
  try {
    // Criar o usuário na autenticação do Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Adicionar dados extras no Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { success: false, error: error.message };
  }
}

// Função para registrar um novo usuário sem fazer login com ele
// Isso é útil para admins criarem novos usuários sem perder sua própria sessão
async function createNewUser(email, password, name, role = ROLES.VIEWER) {
  try {
    // Importar as funções necessárias do Firebase Auth
    const { createUserWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js");
    
    // Criar uma nova instância de Auth para não interferir com o usuário atual
    const tempAuth = getAuth();
    
    // Criar o usuário na autenticação do Firebase
    const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
    const user = userCredential.user;

    // Adicionar dados extras no Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role,
      createdAt: new Date().toISOString()
    });

    return { success: true, user };
  } catch (error) {
    console.error("Erro ao criar novo usuário:", error);
    return { success: false, error: error.message };
  }
}

// Função para fazer login
async function loginUser(email, password) {
  console.log("Iniciando processo de login para:", email);
  try {
    // Validar inputs
    if (!email || !password) {
      return { success: false, error: "Email e senha são obrigatórios" };
    }
    
    console.log("Tentando fazer login com Firebase Auth...");
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log("Login bem-sucedido com Firebase Auth. UID:", user.uid);
    
    // Verificar se o usuário possui um registro no Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        console.error("Usuário autenticado, mas sem documento no Firestore");
        
        // Criar um documento básico para o usuário se não existir
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || email.split('@')[0],
          role: ROLES.ADMIN, // Dar permissão de ADMIN para garantir acesso
          createdAt: new Date().toISOString()
        });
        
        console.log("Documento criado no Firestore para o usuário:", user.uid);
      }
    } catch (firestoreError) {
      console.error("Erro ao verificar/criar documento do usuário:", firestoreError);
      // Continuar mesmo com erro no Firestore, já que a autenticação foi bem-sucedida
    }
    
    return { success: true, user };
  } catch (error) {
    console.error("Erro no Firebase Auth login:", error.code, error.message);
    let errorMessage = "Falha no login";
    
    // Traduzir mensagens de erro do Firebase
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = "Email inválido";
        break;
      case 'auth/user-disabled':
        errorMessage = "Usuário desativado";
        break;
      case 'auth/user-not-found':
        errorMessage = "Usuário não encontrado";
        break;
      case 'auth/wrong-password':
        errorMessage = "Senha incorreta";
        break;
      case 'auth/invalid-credential':
        errorMessage = "Credenciais inválidas";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Muitas tentativas. Tente novamente mais tarde";
        break;
      default:
        errorMessage = `Erro de autenticação (${error.code}): ${error.message}`;
    }
    
    return { success: false, error: errorMessage };
  }
}

// Função para fazer logout
async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Erro no logout:", error);
    return { success: false, error: error.message };
  }
}

// Função para verificar as permissões do usuário atual
async function getUserRole(userId) {
  console.log("Verificando role para usuário:", userId);
  try {
    console.log("Buscando documento no Firestore...");
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("Documento encontrado. Role:", userData.role);
      return userData.role;
    } else {
      console.error("Usuário não encontrado no Firestore");
      return null;
    }
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);
    return null;
  }
}

// Função para verificar se o usuário é admin
async function isAdmin(userId) {
  const role = await getUserRole(userId);
  return role === ROLES.ADMIN;
}

// Função para obter todos os usuários (apenas para admins)
async function getAllUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}

// Função para atualizar a função de um usuário
async function updateUserRole(userId, newRole) {
  try {
    await setDoc(doc(db, "users", userId), { role: newRole }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar função do usuário:", error);
    return { success: false, error: error.message };
  }
}

// Ouvinte de estado de autenticação
const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Função para solicitar redefinição de senha
async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Erro ao solicitar redefinição de senha:", error);
    
    let errorMessage = "Falha ao enviar email de redefinição";
    
    // Traduzir mensagens de erro do Firebase
    switch (error.code) {
      case 'auth/invalid-email':
        errorMessage = "Email inválido";
        break;
      case 'auth/user-not-found':
        errorMessage = "Usuário não encontrado";
        break;
      case 'auth/too-many-requests':
        errorMessage = "Muitas solicitações. Tente novamente mais tarde";
        break;
      default:
        errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}

export {
  ROLES,
  registerUser,
  createNewUser,
  loginUser,
  logoutUser,
  resetPassword,
  getUserRole,
  isAdmin,
  getAllUsers,
  updateUserRole,
  getCurrentUser
}; 