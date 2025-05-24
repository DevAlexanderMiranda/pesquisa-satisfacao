// Importar Firebase diretamente dos CDNs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-app.js";
import { getAuth, signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, updateDoc, query, orderBy, where, limit } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";

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
const logoutButton = document.getElementById('logoutButton');
const userDisplayName = document.getElementById('userDisplayName');
const userMenuItem = document.querySelector('.sidebar-menu li a[href="#users"]').parentElement;
const loadingOverlay = document.getElementById('loadingOverlay');
const sidebar = document.querySelector('.sidebar');
const toggleSidebarBtn = document.querySelector('.toggle-sidebar');
const sidebarLinks = document.querySelectorAll('.sidebar-menu li a');

// Função para mostrar toast notification
function showToast(message, type = 'info', duration = 5000) {
  const toastContainer = document.getElementById('toastContainer');
  
  // Verificar se já existe uma mensagem similar
  const existingToasts = toastContainer.querySelectorAll('.toast');
  for (let existingToast of existingToasts) {
    const existingMessage = existingToast.querySelector('.toast-message').textContent;
    if (existingMessage === message) {
      console.log('Mensagem duplicada bloqueada:', message);
      return; // Não adicionar mensagem duplicada
    }
  }
  
  // Criar elemento toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Ícone do toast
  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'exclamation-circle';
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas fa-${icon}"></i>
    </div>
    <div class="toast-content">
      <p class="toast-message">${message}</p>
    </div>
  `;
  
  // Adicionar à página
  toastContainer.appendChild(toast);
  
  // Remover após o tempo especificado
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s forwards';
    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// Definição simples de papéis para usuários
const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
};

// Verificar estado de autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
  console.log("Verificando autenticação no dashboard...");
  
  // Mostrar loading overlay
  showLoadingOverlay();
  
  // Verificação simples com Firebase Auth
  auth.onAuthStateChanged(async function(user) {
    if (user) {
      console.log("Usuário está logado:", user.email);
      await setupDashboard(user);
      hideLoadingOverlay();
    } else {
      console.log("Usuário não está logado, redirecionando...");
      window.location.href = "admin.html";
    }
  });

  // Adicionar event listener para o botão de toggle do sidebar
  toggleSidebarBtn.addEventListener('click', function() {
    sidebar.classList.toggle('collapsed');
  });

  // Adicionar event listeners para os links do sidebar
  sidebarLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = this.getAttribute('href').substring(1);
      
      // Atualizar classe ativa
      document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
      });
      this.parentElement.classList.add('active');
      
      // Atualizar título do cabeçalho
      document.querySelector('.header-title h1').textContent = this.querySelector('span').textContent;
      
      // Carregar a seção correspondente
      switch(target) {
        case 'dashboard':
          loadDashboardSection();
          break;
        case 'search':
          loadSearchSection();
          break;
        case 'categories':
          loadCategoriesSection();
          break;
        case 'questions':
          loadQuestionsSection();
          break;
        case 'users':
          loadUsersSection();
          break;
        case 'reports':
          loadReportsSection();
          break;
        case 'settings':
          loadSettingsSection();
          break;
      }
    });
  });

  // Adicionar event listener global para botões
  document.addEventListener('DOMContentLoaded', function() {
    // Event listener global para capturar cliques em botões
    document.body.addEventListener('click', function(e) {
      // Verificar se o elemento clicado é um botão
      if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
        const button = e.target.tagName === 'BUTTON' ? e.target : e.target.closest('button');
        console.log("Botão clicado:", button.id || button.className || "sem id/classe", button);
      }
    });
    
    // Configurar handler específico para o botão saveQuestionsBtn
    const saveQuestionsBtn = document.getElementById('saveQuestionsBtn');
    if (saveQuestionsBtn) {
      console.log("Configurando botão saveQuestionsBtn no DOMContentLoaded");
      
      saveQuestionsBtn.addEventListener('click', function() {
        console.log("Botão saveQuestionsBtn clicado no handler global");
        
        const questionsModal = document.getElementById('questionsModal');
        const categoryId = questionsModal ? questionsModal.dataset.categoryId : null;
        
        console.log("Chamando saveQuestions com categoryId:", categoryId);
        saveQuestions(categoryId);
      });
    } else {
      console.warn("Botão saveQuestionsBtn não encontrado no DOMContentLoaded");
    }
  });
});

// Funções para mostrar e esconder o loading overlay
function showLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoadingOverlay() {
  document.getElementById('loadingOverlay').classList.remove('active');
}

// Configurar o dashboard para o usuário autenticado
async function setupDashboard(user) {
  try {
    // Tentar buscar documento do usuário, mas continuar mesmo se falhar
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Perfil do usuário:", userData.role);
        
        // Atualizar nome do usuário na interface
        if (userData.name) {
          userDisplayName.textContent = userData.name;
        } else {
          userDisplayName.textContent = user.email || "Usuário";
        }
        
        // Mostrar ou esconder menu de usuários baseado no role
        if (userData.role === ROLES.ADMIN) {
          userMenuItem.style.display = 'block';
        } else {
          userMenuItem.style.display = 'none';
        }
      } else {
        console.log("Criando documento do usuário...");
        // Criar documento para o usuário se não existir
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role: ROLES.ADMIN, // Como é a primeira vez, damos permissão de ADMIN
          createdAt: new Date().toISOString()
        });
        
        userDisplayName.textContent = user.email || "Usuário";
      }
    } catch (error) {
      console.warn("Erro ao buscar/criar dados do usuário:", error);
      // Continuar mesmo com erro
      userDisplayName.textContent = user.email || "Usuário";
    }
    
    // Carregar a seção padrão (dashboard)
    loadDashboardSection();
  } catch (error) {
    console.error("Erro ao configurar dashboard:", error);
  }
}

// Função para redirecionar para a página de login
function redirectToLogin() {
  window.location.href = "admin.html";
}

// Manipulador de logout
logoutButton.addEventListener('click', function() {
  signOut(auth).then(function() {
    console.log("Logout realizado com sucesso");
    redirectToLogin();
  }).catch(function(error) {
    console.error("Erro ao fazer logout:", error);
  });
});

// Funções para carregar cada seção
function loadDashboardSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  dashboardContent.innerHTML = `
    <div class="welcome-card">
      <h2>Bem-vindo ao Painel Administrativo</h2>
      <p>Esta é a área de administração da pesquisa de satisfação.</p>
    </div>

    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <h3>Usuários</h3>
          <p class="stat-number">1</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-poll"></i>
        </div>
        <div class="stat-info">
          <h3>Pesquisas</h3>
          <p class="stat-number">0</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <div class="stat-info">
          <h3>Relatórios</h3>
          <p class="stat-number">0</p>
        </div>
      </div>
    </div>

    <div class="recent-activity">
      <h3>Atividades Recentes</h3>
      <div class="activity-list">
        <p class="empty-state">Nenhuma atividade recente.</p>
      </div>
    </div>
  `;
}

// Nova seção de pesquisa
function loadSearchSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  dashboardContent.innerHTML = `
    <div class="section-header">
      <h2>Pesquisas de Satisfação</h2>
      <button id="createSurveyBtn" class="action-btn">
        <i class="fas fa-plus"></i> Nova Pesquisa
      </button>
    </div>
    
    <div class="surveys-container">
      <div class="surveys-filters">
        <input type="text" id="surveySearch" placeholder="Buscar pesquisas..." class="search-input">
        <select id="categoryFilter" class="role-filter">
          <option value="all">Todas as categorias</option>
          <option value="saude">Saúde</option>
          <option value="educacao">Educação</option>
          <option value="servicos">Serviços Públicos</option>
        </select>
      </div>
      
      <div class="surveys-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Categoria</th>
              <th>Participantes</th>
              <th>Data de Criação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="surveysTableBody">
            <tr>
              <td colspan="5" class="empty-message">Nenhuma pesquisa encontrada.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Seção de usuários - apenas para admins
function loadUsersSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  dashboardContent.innerHTML = `
    <div class="section-header">
      <h2>Gerenciamento de Usuários</h2>
      <button id="addUserBtn" class="action-btn">
        <i class="fas fa-plus"></i> Adicionar Usuário
      </button>
    </div>
    
    <div class="users-container">
      <div class="users-filters">
        <input type="text" id="userSearch" placeholder="Buscar usuários..." class="search-input">
        <select id="roleFilter" class="role-filter">
          <option value="all">Todos os perfis</option>
          <option value="admin">Administradores</option>
          <option value="editor">Editores</option>
          <option value="viewer">Visualizadores</option>
        </select>
      </div>
      
      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Perfil</th>
              <th>Data de Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr>
              <td colspan="5" class="loading-message">Carregando usuários...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal de Usuário -->
    <div id="userModal" class="modal hidden">
      <div class="modal-content">
        <button id="closeModal" class="close-modal">&times;</button>
        <h2>Adicionar Novo Usuário</h2>
        <form id="userForm">
          <div class="form-group">
            <label for="userName">Nome</label>
            <input type="text" id="userName" required>
          </div>
          <div class="form-group">
            <label for="userEmail">Email</label>
            <input type="email" id="userEmail" required>
          </div>
          <div class="form-group">
            <label for="userPassword">Senha</label>
            <input type="password" id="userPassword" required>
          </div>
          <div class="form-group">
            <label for="userRole">Perfil</label>
            <select id="userRole" required>
              <option value="admin">Administrador</option>
              <option value="editor">Editor</option>
              <option value="viewer">Visualizador</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" id="cancelBtn" class="cancel-btn">Cancelar</button>
            <button type="submit" class="save-btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Configurar eventos para o modal de usuário
  setupUsersEventListeners();
  
  // Carregar lista de usuários
  loadUsersList();
}

// Configure event listeners da seção de usuários
function setupUsersEventListeners() {
  const userModal = document.getElementById('userModal');
  const addUserBtn = document.getElementById('addUserBtn');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const userForm = document.getElementById('userForm');
  
  // Evento para abrir modal
  addUserBtn.addEventListener('click', () => {
    userModal.classList.remove('hidden');
    userForm.reset();
    document.getElementById('userModal').querySelector('h2').textContent = 'Adicionar Novo Usuário';
    document.getElementById('userPassword').style.display = 'block';
    document.getElementById('userPassword').previousElementSibling.style.display = 'block';
  });
  
  // Evento para fechar modal
  closeModal.addEventListener('click', () => {
    userModal.classList.add('hidden');
  });
  
  // Evento para botão cancelar
  cancelBtn.addEventListener('click', () => {
    userModal.classList.add('hidden');
  });
  
  // Evento para submissão do formulário
  userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obter o botão de salvar
    const saveBtn = userForm.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    
    // Desabilitar botão e mudar texto
    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";
    
    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const password = document.getElementById('userPassword').value;
    const role = document.getElementById('userRole').value;
    const isEditing = userForm.hasAttribute('data-edit-id');
    
    try {
      if (isEditing) {
        // Editar usuário existente
        const userId = userForm.getAttribute('data-edit-id');
        await updateDoc(doc(db, "users", userId), {
          name,
          email,
          role,
          updatedAt: new Date().toISOString()
        });
        
        // Mostrar notificação de sucesso
        showToast('Usuário atualizado com sucesso!', 'success');
      } else {
        // Criar novo usuário - abordagem que não requer login/logout
        
        // Gerar um ID único para o usuário
        const newUserId = doc(collection(db, 'users')).id;
        
        // Criar documento para o usuário no Firestore primeiro
        await setDoc(doc(db, "users", newUserId), {
          email,
          name,
          role,
          password: btoa(password), // Codificação básica apenas para armazenamento temporário
          isPasswordTemporary: true, // Indica que a senha está armazenada temporariamente
          createdAt: new Date().toISOString(),
          status: 'pending' // Status pendente até que o usuário faça o primeiro login
        });
        
        // Mostrar notificação de sucesso
        showToast(`Usuário ${name} criado com sucesso!`, 'success');
      }
      
      // Fechar modal e recarregar lista
      userModal.classList.add('hidden');
      loadUsersList();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      showToast(`Erro ao salvar usuário: ${error.message}`, 'error');
    } finally {
      // Restaurar botão
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
  
  // Configurar filtro de pesquisa
  const userSearch = document.getElementById('userSearch');
  const roleFilter = document.getElementById('roleFilter');
  
  if (userSearch) {
    userSearch.addEventListener('input', debounce(() => {
      loadUsersList();
    }, 300));
  }
  
  if (roleFilter) {
    roleFilter.addEventListener('change', () => {
      loadUsersList();
    });
  }
}

// Função para carregar lista de usuários
async function loadUsersList() {
  const usersTableBody = document.getElementById('usersTableBody');
  const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
  const roleFilter = document.getElementById('roleFilter')?.value || 'all';
  
  if (!usersTableBody) return;
  
  // Mostrar mensagem de carregamento
  usersTableBody.innerHTML = '<tr><td colspan="5" class="loading-message">Carregando usuários...</td></tr>';
  
  try {
    // Simular um pequeno atraso para mostrar o carregamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Buscar usuários diretamente do Firestore
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Filtrar usuários
    const filteredUsers = users.filter(user => {
      // Filtrar por termo de busca
      const matchesSearch = 
        user.name?.toLowerCase().includes(searchTerm) || 
        user.email?.toLowerCase().includes(searchTerm);
      
      // Filtrar por role
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
    
    if (filteredUsers.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="5" class="empty-message">Nenhum usuário encontrado.</td></tr>';
      return;
    }
    
    // Renderizar usuários
    usersTableBody.innerHTML = filteredUsers.map(user => `
      <tr data-id="${user.id}">
        <td>${user.name || ''}</td>
        <td>${user.email || ''}</td>
        <td>
          <span class="user-role-badge ${user.role}">
            ${user.role === 'admin' ? 'Administrador' : 
              user.role === 'editor' ? 'Editor' : 'Visualizador'}
          </span>
        </td>
        <td>${formatDate(user.createdAt)}</td>
        <td class="actions-cell">
          <button class="edit-btn" data-id="${user.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" data-id="${user.id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    // Adicionar event listeners para ações
    setupUserActionButtons();
    
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    usersTableBody.innerHTML = '<tr><td colspan="5" class="error-message">Erro ao carregar usuários.</td></tr>';
  }
}

// Configurar botões de ação para cada usuário
function setupUserActionButtons() {
  // Botões de editar
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.currentTarget.getAttribute('data-id');
      
      // Salvar o ícone original e mudar para ícone de carregamento
      const iconElement = button.querySelector('i');
      const originalIcon = iconElement.className;
      iconElement.className = 'fas fa-spinner fa-spin';
      button.disabled = true;
      
      try {
        // Buscar dados do usuário
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Preencher formulário
          document.getElementById('userName').value = userData.name || '';
          document.getElementById('userEmail').value = userData.email || '';
          document.getElementById('userRole').value = userData.role || 'viewer';
          
          // Esconder campo de senha para edição
          const passwordField = document.getElementById('userPassword');
          passwordField.value = ''; // Limpar campo de senha
          passwordField.style.display = 'none';
          passwordField.previousElementSibling.style.display = 'none';
          passwordField.required = false; // Remover obrigatoriedade
          
          // Atualizar título do modal
          document.getElementById('userModal').querySelector('h2').textContent = 'Editar Usuário';
          
          // Adicionar ID do usuário ao formulário
          document.getElementById('userForm').setAttribute('data-edit-id', userId);
          
          // Abrir modal
          document.getElementById('userModal').classList.remove('hidden');
        } else {
          showToast('Usuário não encontrado', 'error');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        showToast(`Erro ao carregar dados do usuário: ${error.message}`, 'error');
      } finally {
        // Restaurar ícone original
        iconElement.className = originalIcon;
        button.disabled = false;
      }
    });
  });
  
  // Botões de excluir
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = e.currentTarget.getAttribute('data-id');
      
      if (confirm('Tem certeza que deseja excluir este usuário?')) {
        // Salvar o ícone original e mudar para ícone de carregamento
        const iconElement = button.querySelector('i');
        const originalIcon = iconElement.className;
        iconElement.className = 'fas fa-spinner fa-spin';
        button.disabled = true;
        
        try {
          // Excluir usuário do Firestore
          await deleteDoc(doc(db, "users", userId));
          
          // Recarregar a lista de usuários
          loadUsersList();
          
          showToast('Usuário excluído com sucesso!', 'success');
        } catch (error) {
          console.error('Erro ao excluir usuário:', error);
          showToast(`Erro ao excluir usuário: ${error.message}`, 'error');
          
          // Restaurar ícone original em caso de erro
          iconElement.className = originalIcon;
          button.disabled = false;
        }
      }
    });
  });
}

function loadReportsSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  dashboardContent.innerHTML = `
    <div class="section-header">
      <h2>Relatórios</h2>
    </div>
    
    <div class="reports-container">
      <p class="empty-state">Funcionalidade de relatórios em desenvolvimento.</p>
    </div>
  `;
}

function loadSettingsSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  dashboardContent.innerHTML = `
    <div class="section-header">
      <h2>Configurações</h2>
    </div>
    
    <div class="settings-container">
      <p class="empty-state">Funcionalidade de configurações em desenvolvimento.</p>
    </div>
  `;
}

// Utilitários
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return '';
  }
}

function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Função para carregar a seção de categorias
function loadCategoriesSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  dashboardContent.innerHTML = `
    <div class="section-header">
      <h2>Gerenciamento de Categorias</h2>
      <button id="addCategoryBtn" class="action-btn">
        <i class="fas fa-plus"></i> Adicionar Categoria
      </button>
    </div>
    
    <div class="users-container">
      <div class="users-table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Ordem</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="categoriesTableBody">
            <tr>
              <td colspan="4" class="loading-message">Carregando categorias...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Modal de Categoria -->
    <div id="categoryModal" class="modal hidden">
      <div class="modal-content">
        <button id="closeModal" class="close-modal">&times;</button>
        <h2>Adicionar Categoria</h2>
        <form id="categoryForm">
          <div class="form-group">
            <label for="categoryId">ID (apenas letras, números e hífens)</label>
            <input type="text" id="categoryId" pattern="[a-z0-9-]+" required>
            <small>Ex: saude, educacao, servicos-publicos</small>
          </div>
          <div class="form-group">
            <label for="categoryName">Nome</label>
            <input type="text" id="categoryName" required>
          </div>
          <div class="form-group">
            <label for="categoryOrder">Ordem</label>
            <input type="number" id="categoryOrder" min="1" required>
          </div>
          <div class="form-group">
            <label for="categoryActive">Status</label>
            <select id="categoryActive" required>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" id="cancelCategoryBtn" class="cancel-btn">Cancelar</button>
            <button type="submit" class="save-btn">Salvar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Questões -->
    <div id="questionsModal" class="modal hidden">
      <div class="modal-content modal-lg">
        <button id="closeQuestionsModal" class="close-modal">&times;</button>
        <h2>Gerenciar Questões</h2>
        <div class="category-info-header">
          <p>Categoria: <strong id="questionsCategoryName"></strong></p>
        </div>
        <div class="questions-container">
          <div class="questions-header">
            <h3>Lista de perguntas</h3>
            <span id="questionsCounter" class="questions-counter">0 pergunta(s)</span>
          </div>
          <div id="questionsList">
            <!-- Lista de questões será carregada aqui -->
          </div>
          <div class="form-group">
            <label for="newQuestion">Nova Pergunta</label>
            <div class="question-input-group">
              <input type="text" id="newQuestion" placeholder="Digite uma nova pergunta...">
              <button id="addQuestionBtn" class="add-btn"><i class="fas fa-plus"></i></button>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" id="cancelQuestionsBtn" class="cancel-btn">Fechar</button>
          <button type="button" id="saveQuestionsBtn" class="save-btn">Salvar Alterações</button>
        </div>
      </div>
    </div>

    <!-- Modal de Locais -->
    <div id="locationsModal" class="modal hidden">
      <div class="modal-content modal-lg">
        <button id="closeLocationsModal" class="close-modal">&times;</button>
        <h2>Gerenciar Locais</h2>
        <div class="category-info-header">
          <p>Categoria: <strong id="locationsCategoryName"></strong></p>
        </div>
        <div class="locations-container">
          <div id="locationsList">
            <!-- Lista de locais será carregada aqui -->
          </div>
          <div class="form-group">
            <label for="newLocation">Novo Local</label>
            <div class="location-input-group">
              <input type="text" id="newLocation" placeholder="Digite um novo local...">
              <button id="addLocationBtn" class="add-btn"><i class="fas fa-plus"></i></button>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" id="cancelLocationsBtn" class="cancel-btn">Fechar</button>
          <button type="button" id="saveLocationsBtn" class="save-btn">Salvar Alterações</button>
        </div>
      </div>
    </div>
  `;
  
  // Configurar eventos para o modal de categoria
  setupCategoriesEventListeners();
  
  // Carregar lista de categorias
  loadCategoriesList();
}

// Configure event listeners da seção de categorias
function setupCategoriesEventListeners() {
  const categoryModal = document.getElementById('categoryModal');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelCategoryBtn');
  const categoryForm = document.getElementById('categoryForm');
  
  const questionsModal = document.getElementById('questionsModal');
  const closeQuestionsModal = document.getElementById('closeQuestionsModal');
  const cancelQuestionsBtn = document.getElementById('cancelQuestionsBtn');
  const saveQuestionsBtn = document.getElementById('saveQuestionsBtn');

  const locationsModal = document.getElementById('locationsModal');
  const closeLocationsModal = document.getElementById('closeLocationsModal');
  const cancelLocationsBtn = document.getElementById('cancelLocationsBtn');
  const saveLocationsBtn = document.getElementById('saveLocationsBtn');
  const addLocationBtn = document.getElementById('addLocationBtn');
  
  // Evento para abrir modal de categoria
  addCategoryBtn.addEventListener('click', () => {
    categoryModal.classList.remove('hidden');
    categoryForm.reset();
    document.getElementById('categoryId').disabled = false;
    document.getElementById('categoryModal').querySelector('h2').textContent = 'Adicionar Categoria';
    categoryForm.removeAttribute('data-edit-id');
  });
  
  // Evento para fechar modal de categoria
  closeModal.addEventListener('click', () => {
    categoryModal.classList.add('hidden');
  });
  
  // Evento para botão cancelar
  cancelBtn.addEventListener('click', () => {
    categoryModal.classList.add('hidden');
  });
  
  // Eventos para modal de questões
  closeQuestionsModal.addEventListener('click', () => {
    questionsModal.classList.add('hidden');
    cancelEditQuestion(); // Resetar estado de edição se estiver editando
  });

  cancelQuestionsBtn.addEventListener('click', () => {
    questionsModal.classList.add('hidden');
    cancelEditQuestion(); // Resetar estado de edição se estiver editando
  });

  // Configurar botão salvar questões de forma mais limpa
  if (saveQuestionsBtn) {
    // Limpar eventos anteriores
    saveQuestionsBtn.replaceWith(saveQuestionsBtn.cloneNode(true));
    const newSaveBtn = document.getElementById('saveQuestionsBtn');
    
    // Adicionar apenas um event listener
    newSaveBtn.addEventListener('click', function() {
      console.log("Botão Salvar Alterações clicado");
      const categoryId = questionsModal.dataset.categoryId;
      console.log("categoryId:", categoryId);
      saveQuestions(categoryId);
    });
  } else {
    console.error("ERRO: Botão saveQuestionsBtn não encontrado!");
  }

  // Eventos para modal de locais
  closeLocationsModal.addEventListener('click', () => {
    locationsModal.classList.add('hidden');
  });

  cancelLocationsBtn.addEventListener('click', () => {
    locationsModal.classList.add('hidden');
  });

  saveLocationsBtn.addEventListener('click', () => {
    saveLocations(locationsModal.dataset.categoryId);
  });

  addLocationBtn.addEventListener('click', () => {
    addNewLocation();
  });
  
  // Evento para submissão do formulário de categoria
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obter o botão de salvar
    const saveBtn = categoryForm.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    
    // Desabilitar botão e mudar texto
    saveBtn.disabled = true;
    saveBtn.textContent = "Salvando...";
    
    const categoryId = document.getElementById('categoryId').value.trim();
    const name = document.getElementById('categoryName').value.trim();
    const order = parseInt(document.getElementById('categoryOrder').value);
    const active = document.getElementById('categoryActive').value === 'true';
    const isEditing = categoryForm.hasAttribute('data-edit-id');
    
    try {
      if (isEditing) {
        // Editar categoria existente
        const editingId = categoryForm.getAttribute('data-edit-id');
        await updateDoc(doc(db, "categories", editingId), {
          name,
          order,
          active,
          updatedAt: new Date().toISOString()
        });
        
        // Mostrar notificação de sucesso
        showToast('Categoria atualizada com sucesso!', 'success');
      } else {
        // Verificar se já existe uma categoria com este ID
        const categoryDoc = await getDoc(doc(db, "categories", categoryId));
        
        if (categoryDoc.exists()) {
          showToast(`Já existe uma categoria com o ID "${categoryId}"`, 'error');
          saveBtn.disabled = false;
          saveBtn.textContent = originalText;
          return;
        }
        
        // Criar nova categoria
        await setDoc(doc(db, "categories", categoryId), {
          name,
          order,
          active,
          createdAt: new Date().toISOString()
        });

        // Criar documentos para questões e locais
        await setDoc(doc(db, "questions", categoryId), {
          items: []
        });

        await setDoc(doc(db, "locations", categoryId), {
          items: []
        });
        
        // Mostrar notificação de sucesso
        showToast(`Categoria "${name}" criada com sucesso!`, 'success');
      }
      
      // Fechar modal e recarregar lista
      categoryModal.classList.add('hidden');
      loadCategoriesList();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      showToast(`Erro ao salvar categoria: ${error.message}`, 'error');
    } finally {
      // Restaurar botão
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
}

// Função para carregar lista de categorias
async function loadCategoriesList() {
  const categoriesTableBody = document.getElementById('categoriesTableBody');
  
  if (!categoriesTableBody) return;
  
  // Mostrar mensagem de carregamento
  categoriesTableBody.innerHTML = '<tr><td colspan="4" class="loading-message">Carregando categorias...</td></tr>';
  
  try {
    // Simular um pequeno atraso para mostrar o carregamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Buscar categorias do Firestore
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const categoriesSnapshot = await getDocs(q);
    
    if (categoriesSnapshot.empty) {
      categoriesTableBody.innerHTML = '<tr><td colspan="4" class="empty-message">Nenhuma categoria encontrada.</td></tr>';
      return;
    }
    
    // Renderizar categorias
    const categoriesHtml = [];
    
    categoriesSnapshot.forEach(doc => {
      const category = doc.data();
      const categoryId = doc.id;
      
      categoriesHtml.push(`
        <tr data-id="${categoryId}">
          <td>${category.name || ''}</td>
          <td>${category.order || 0}</td>
          <td>
            <span class="user-role-badge ${category.active ? 'admin' : 'viewer'}">
              ${category.active ? 'Ativo' : 'Inativo'}
            </span>
          </td>
          <td class="actions-cell">
            <button class="action-btn manage-questions-btn" data-id="${categoryId}" data-name="${category.name}">
              <i class="fas fa-question-circle"></i>
            </button>
            <button class="action-btn manage-locations-btn" data-id="${categoryId}" data-name="${category.name}">
              <i class="fas fa-map-marker-alt"></i>
            </button>
            <button class="edit-btn edit-category-btn" data-id="${categoryId}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn delete-category-btn" data-id="${categoryId}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `);
    });
    
    categoriesTableBody.innerHTML = categoriesHtml.join('');
    
    // Adicionar event listeners para ações
    setupCategoryActionButtons();
    
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    categoriesTableBody.innerHTML = '<tr><td colspan="4" class="error-message">Erro ao carregar categorias.</td></tr>';
  }
}

// Configurar botões de ação para cada categoria
function setupCategoryActionButtons() {
  // Botões de editar
  document.querySelectorAll('.edit-category-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const categoryId = e.currentTarget.getAttribute('data-id');
      
      // Salvar o ícone original e mudar para ícone de carregamento
      const iconElement = button.querySelector('i');
      const originalIcon = iconElement.className;
      iconElement.className = 'fas fa-spinner fa-spin';
      button.disabled = true;
      
      try {
        // Buscar dados da categoria
        const categoryDoc = await getDoc(doc(db, "categories", categoryId));
        
        if (categoryDoc.exists()) {
          const categoryData = categoryDoc.data();
          
          // Preencher formulário
          document.getElementById('categoryId').value = categoryId;
          document.getElementById('categoryId').disabled = true; // Não permitir editar o ID
          document.getElementById('categoryName').value = categoryData.name || '';
          document.getElementById('categoryOrder').value = categoryData.order || 1;
          document.getElementById('categoryActive').value = categoryData.active ? 'true' : 'false';
          
          // Atualizar título do modal
          document.getElementById('categoryModal').querySelector('h2').textContent = 'Editar Categoria';
          
          // Adicionar ID da categoria ao formulário
          document.getElementById('categoryForm').setAttribute('data-edit-id', categoryId);
          
          // Abrir modal
          document.getElementById('categoryModal').classList.remove('hidden');
        } else {
          showToast('Categoria não encontrada', 'error');
        }
      } catch (error) {
        console.error('Erro ao carregar dados da categoria:', error);
        showToast(`Erro ao carregar dados da categoria: ${error.message}`, 'error');
      } finally {
        // Restaurar ícone original
        iconElement.className = originalIcon;
        button.disabled = false;
      }
    });
  });
  
  // Botões de excluir
  document.querySelectorAll('.delete-category-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const categoryId = e.currentTarget.getAttribute('data-id');
      
      if (confirm(`Tem certeza que deseja excluir esta categoria? Isso pode afetar questionários existentes.`)) {
        // Salvar o ícone original e mudar para ícone de carregamento
        const iconElement = button.querySelector('i');
        const originalIcon = iconElement.className;
        iconElement.className = 'fas fa-spinner fa-spin';
        button.disabled = true;
        
        try {
          // Excluir categoria do Firestore
          await deleteDoc(doc(db, "categories", categoryId));
          // Excluir questões
          await deleteDoc(doc(db, "questions", categoryId));
          // Excluir locais
          await deleteDoc(doc(db, "locations", categoryId));
          
          // Recarregar a lista de categorias
          loadCategoriesList();
          
          showToast('Categoria excluída com sucesso!', 'success');
        } catch (error) {
          console.error('Erro ao excluir categoria:', error);
          showToast(`Erro ao excluir categoria: ${error.message}`, 'error');
          
          // Restaurar ícone original em caso de erro
          iconElement.className = originalIcon;
          button.disabled = false;
        }
      }
    });
  });

  // Botões de gerenciar questões
  document.querySelectorAll('.manage-questions-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const categoryId = e.currentTarget.getAttribute('data-id');
      const categoryName = e.currentTarget.getAttribute('data-name');
      
      // Abrir modal de questões
      openQuestionsModal(categoryId, categoryName);
    });
  });

  // Botões de gerenciar locais
  document.querySelectorAll('.manage-locations-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
      const categoryId = e.currentTarget.getAttribute('data-id');
      const categoryName = e.currentTarget.getAttribute('data-name');
      
      // Abrir modal de locais
      openLocationsModal(categoryId, categoryName);
    });
  });
}

// Variável para controlar se o modal já está sendo aberto
let isOpeningQuestionsModal = false;

// Abrir modal de questões
async function openQuestionsModal(categoryId, categoryName, editQuestionIndex = null) {
  // Evitar múltiplas execuções simultâneas
  if (isOpeningQuestionsModal) {
    console.log("Modal de questões já está sendo aberto, ignorando nova chamada");
    return;
  }
  
  isOpeningQuestionsModal = true;
  
  const questionsModal = document.getElementById('questionsModal');
  const questionsList = document.getElementById('questionsList');
  const questionsCategoryName = document.getElementById('questionsCategoryName');
  
  console.log("Abrindo modal de questões para categoria:", categoryId, categoryName);
  
  // Garantir que o ID da categoria é definido corretamente
  if (!categoryId) {
    console.error("ID de categoria não fornecido para modal de questões");
    showToast("Erro: ID de categoria não fornecido", 'error');
    return;
  }
  
  // Salvar o ID da categoria no modal
  questionsModal.dataset.categoryId = categoryId;
  
  // Confirmar que o dataset foi definido corretamente
  console.log("Dataset definido:", questionsModal.dataset);
  
  // Mostrar nome da categoria
  questionsCategoryName.textContent = categoryName;
  
  // Assegurar que os botões de fechar funcionam
  const closeQuestionsModal = document.getElementById('closeQuestionsModal');
  const cancelQuestionsBtn = document.getElementById('cancelQuestionsBtn');
  
  // Remover listeners anteriores para evitar duplicação
  const newCloseModal = closeQuestionsModal.cloneNode(true);
  if (closeQuestionsModal.parentNode) {
    closeQuestionsModal.parentNode.replaceChild(newCloseModal, closeQuestionsModal);
  }
  
  const newCancelBtn = cancelQuestionsBtn.cloneNode(true);
  if (cancelQuestionsBtn.parentNode) {
    cancelQuestionsBtn.parentNode.replaceChild(newCancelBtn, cancelQuestionsBtn);
  }
  
  // Adicionar novos listeners
  newCloseModal.addEventListener('click', () => {
    questionsModal.classList.add('hidden');
    cancelEditQuestion();
  });
  
  newCancelBtn.addEventListener('click', () => {
    questionsModal.classList.add('hidden');
    cancelEditQuestion();
  });
  
  // Adicionar instruções claras no topo do modal
  const questionsContainer = document.querySelector('.questions-container');
  
  // Remove instruções anteriores se existirem
  const oldInstructions = document.querySelector('.modal-instructions');
  if (oldInstructions) {
    oldInstructions.remove();
  }
  
  const instructionsDiv = document.createElement('div');
  instructionsDiv.className = 'modal-instructions';
  instructionsDiv.innerHTML = `
    <ol class="instruction-steps">
      <li><span class="step-number">1</span> Digite sua pergunta no campo abaixo</li>
      <li><span class="step-number">2</span> Clique em "Salvar Alterações" para confirmar</li>
    </ol>
  `;
  
  // Inserir as instruções no início do container
  if (questionsContainer) {
    questionsContainer.insertBefore(instructionsDiv, questionsContainer.firstChild);
  }
  
  // Mostrar mensagem de carregamento
  questionsList.innerHTML = '<div class="loading-message">Carregando questões...</div>';
  
  try {
    // MÉTODO SIMPLIFICADO: Buscar da coleção questions
    console.log("Buscando perguntas da categoria:", categoryId);
    const questionsDoc = await getDoc(doc(db, "questions", categoryId));
    
    let questions = [];
    if (questionsDoc.exists()) {
      const questionsData = questionsDoc.data();
      console.log("Dados obtidos do Firestore:", questionsData);
      if (questionsData.items && Array.isArray(questionsData.items)) {
        questions = questionsData.items;
      }
    } else {
      console.log("Documento não encontrado, criando um vazio");
      // Criar documento vazio
      await setDoc(doc(db, "questions", categoryId), {
        items: [],
        createdAt: new Date().toISOString()
      });
    }
    
    console.log("Perguntas encontradas:", questions.length);
    
    // Exibir as perguntas
    if (questions.length === 0) {
      questionsList.innerHTML = '<div class="empty-message">Nenhuma pergunta cadastrada para esta categoria.</div>';
    } else {
      // Renderizar questões
      questionsList.innerHTML = '';
      
      questions.forEach((question, index) => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        questionItem.setAttribute('draggable', 'true');
        questionItem.innerHTML = `
          <div class="question-content">
            <span class="question-number">${index + 1}.</span>
            <span class="question-text">${question}</span>
          </div>
          <div class="question-actions">
            <button class="edit-question-btn" data-index="${index}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn delete-question-btn" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        questionsList.appendChild(questionItem);
      });
      
      // Adicionar event listeners para botões de excluir
      document.querySelectorAll('.delete-question-btn').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
            deleteQuestion(index);
          }
        });
      });
      
      // Adicionar event listeners para botões de editar
      document.querySelectorAll('.edit-question-btn').forEach(button => {
        button.addEventListener('click', function() {
          const index = parseInt(this.getAttribute('data-index'));
          editQuestion(index);
        });
      });
      
      // Configurar drag and drop para reordenar perguntas
      setupDragAndDropForQuestions();
    }
    
    // Atualizar contador de perguntas
    updateQuestionCounter();
    
    // Mostrar modal
    questionsModal.classList.remove('hidden');
    
    // Se um índice de pergunta específico foi passado, editar essa pergunta
    if (editQuestionIndex !== null) {
      // Esperar um pouco para garantir que os elementos já estão renderizados
      setTimeout(() => {
        const editButtons = document.querySelectorAll('.edit-question-btn');
        if (editQuestionIndex < editButtons.length) {
          editButtons[editQuestionIndex].click();
        }
      }, 100);
    }
    
    // Configurar o input para tecla enter
    const newQuestionInput = document.getElementById('newQuestion');
    if (newQuestionInput) {
      // Permitir salvar com a tecla enter
      newQuestionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim().length > 0) {
          e.preventDefault();
          saveQuestions(questionsModal.dataset.categoryId);
        }
      });
    }
    
    // Verificar se o botão de salvar está corretamente configurado
    const saveQuestionsBtn = document.getElementById('saveQuestionsBtn');
    console.log("Botão saveQuestionsBtn após abrir modal:", saveQuestionsBtn);
    
    // Garantir que o evento de clique esteja corretamente configurado
    saveQuestionsBtn.onclick = function() {
      console.log("Clique direto no botão salvar");
      saveQuestions(questionsModal.dataset.categoryId);
    };
  } catch (error) {
    console.error('Erro ao carregar questões:', error);
    showToast(`Erro ao carregar questões: ${error.message}`, 'error');
  } finally {
    // Liberar a proteção para futuras aberturas
    isOpeningQuestionsModal = false;
  }
}

// Configurar drag and drop para reordenar perguntas
function setupDragAndDropForQuestions() {
  const questionItems = document.querySelectorAll('.question-item');
  const questionsList = document.getElementById('questionsList');
  
  // Verificar se já existe configuração de drag and drop
  if (questionsList.dataset.dragSetup === 'true') {
    console.log('Drag and drop já configurado, pulando...');
    return;
  }
  
  let draggedItem = null;
  
  questionItems.forEach(item => {
    // Verificar se já tem listeners configurados
    if (item.dataset.dragListeners === 'true') {
      return;
    }
    
    // Marcar como configurado
    item.dataset.dragListeners = 'true';
    
    // Evento quando começa a arrastar
    item.addEventListener('dragstart', function() {
      draggedItem = this;
      setTimeout(() => this.classList.add('dragging'), 0);
    });
    
    // Evento quando termina de arrastar
    item.addEventListener('dragend', function() {
      this.classList.remove('dragging');
      draggedItem = null;
      
      // Atualizar índices apenas uma vez
      setTimeout(() => {
        updateQuestionIndices();
      }, 100);
    });
    
    // Permitir que o item seja alvo de drop
    item.addEventListener('dragover', function(e) {
      e.preventDefault();
    });
    
    // Quando o item entra na área de outro item
    item.addEventListener('dragenter', function(e) {
      e.preventDefault();
      if (this !== draggedItem) this.classList.add('drag-over');
    });
    
    // Quando o item sai da área de outro item
    item.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });
    
    // Quando solta o item em outro item
    item.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      
      if (this !== draggedItem) {
        // Obter o índice do item sobre o qual estamos soltando
        const allItems = [...document.querySelectorAll('.question-item')];
        const dropIndex = allItems.indexOf(this);
        const dragIndex = allItems.indexOf(draggedItem);
        
        // Reposicionar o item arrastado
        if (dropIndex < dragIndex) {
          questionsList.insertBefore(draggedItem, this);
        } else {
          questionsList.insertBefore(draggedItem, this.nextElementSibling);
        }
      }
    });
  });
  
  // Marcar como configurado
  questionsList.dataset.dragSetup = 'true';
}

// Atualizar índices das perguntas após reordenação
function updateQuestionIndices() {
  document.querySelectorAll('.question-item').forEach((item, index) => {
    item.querySelector('.question-number').textContent = `${index + 1}.`;
    item.querySelector('.delete-question-btn').setAttribute('data-index', index);
    if (item.querySelector('.edit-question-btn')) {
      item.querySelector('.edit-question-btn').setAttribute('data-index', index);
    }
  });
  
  // Atualizar contador com debounce
  clearTimeout(window.updateCounterTimeout);
  window.updateCounterTimeout = setTimeout(() => {
    updateQuestionCounter();
  }, 100);
}

// Atualizar contador de perguntas
function updateQuestionCounter() {
  const questionCount = document.querySelectorAll('.question-item').length;
  const counterElement = document.getElementById('questionsCounter');
  
  if (counterElement) {
    // Verificar se o contador já está correto para evitar atualizações desnecessárias
    const currentText = counterElement.textContent;
    const newText = `${questionCount} pergunta(s)`;
    
    if (currentText !== newText) {
      counterElement.textContent = newText;
    }
  }
}

// Editar questão
function editQuestion(index) {
  const questionItems = document.querySelectorAll('.question-item');
  
  if (index >= 0 && index < questionItems.length) {
    const questionItem = questionItems[index];
    const questionText = questionItem.querySelector('.question-text').textContent;
    const newQuestionInput = document.getElementById('newQuestion');
    
    // Preencher o input com o texto da pergunta
    newQuestionInput.value = questionText;
    newQuestionInput.focus();
    
    // Marcar que estamos editando
    newQuestionInput.dataset.editIndex = index;
    
    // Destacar a pergunta que está sendo editada
    questionItems.forEach(item => item.classList.remove('editing'));
    questionItem.classList.add('editing');
    
    // Mudar a mensagem de ajuda e destacar o botão salvar
    const formHelper = document.querySelector('.form-helper');
    if (formHelper) {
      formHelper.textContent = "Edite a pergunta acima e clique em 'Salvar Alterações' para atualizar";
      formHelper.classList.add('highlight');
    }
    
    // Destacar o botão de salvar
    const saveQuestionsBtn = document.getElementById('saveQuestionsBtn');
    if (saveQuestionsBtn) {
      saveQuestionsBtn.classList.add('highlight-btn');
      saveQuestionsBtn.textContent = "Salvar Edição";
    }
  }
}

// Cancelar edição de questão
function cancelEditQuestion() {
  const newQuestionInput = document.getElementById('newQuestion');
  
  if (newQuestionInput.dataset.editIndex) {
    const index = parseInt(newQuestionInput.dataset.editIndex);
    const questionItems = document.querySelectorAll('.question-item');
    
    // Remover destaque da pergunta que estava sendo editada
    if (index >= 0 && index < questionItems.length) {
      questionItems[index].classList.remove('editing');
    }
  }
  
  // Limpar campo e resetar botões
  newQuestionInput.value = '';
  newQuestionInput.removeAttribute('data-edit-index');
  
  // Resetar a mensagem de ajuda
  const formHelper = document.querySelector('.form-helper');
  if (formHelper) {
    formHelper.textContent = "Digite sua pergunta acima e clique em 'Salvar Alterações'";
    formHelper.classList.remove('highlight');
  }
  
  // Resetar texto do botão salvar
  const saveQuestionsBtn = document.getElementById('saveQuestionsBtn');
  if (saveQuestionsBtn) {
    saveQuestionsBtn.classList.remove('highlight-btn');
    saveQuestionsBtn.textContent = "Salvar Alterações";
  }
  
  // Focar no input
  newQuestionInput.focus();
}

// Excluir questão
function deleteQuestion(index) {
  const questionItems = document.querySelectorAll('.question-item');
  
  if (index >= 0 && index < questionItems.length) {
    // Animar a remoção
    const itemToRemove = questionItems[index];
    itemToRemove.classList.add('removing');
    
    setTimeout(() => {
      // Remover o item da lista
      itemToRemove.remove();
      
      // Atualizar os números e índices
      updateQuestionIndices();
      
      // Se não houver mais questões, mostrar mensagem vazia
      if (document.querySelectorAll('.question-item').length === 0) {
        document.getElementById('questionsList').innerHTML = '<div class="empty-message">Nenhuma pergunta cadastrada.</div>';
      }
      
      // Se estivéssemos editando este item, cancelar a edição
      const newQuestionInput = document.getElementById('newQuestion');
      if (newQuestionInput.dataset.editIndex && parseInt(newQuestionInput.dataset.editIndex) === index) {
        cancelEditQuestion();
      }
      
      // Atualizar contador
      updateQuestionCounter();
    }, 300); // Tempo para a animação
  }
}

// Função para testar a conexão com o Firestore
async function testFirestoreConnection() {
  try {
    console.log("Testando conexão com Firestore...");
    
    // Tentar adicionar um documento de teste
    const testCollectionRef = collection(db, "test_connection");
    const docRef = await addDoc(testCollectionRef, {
      timestamp: new Date().toISOString(),
      test: "Teste de conexão"
    });
    
    console.log("Documento de teste criado com sucesso:", docRef.id);
    return true;
  } catch (error) {
    console.error("Erro ao testar conexão com Firestore:", error);
    return false;
  }
}

// Salvar questões - versão corrigida para não misturar categorias
async function saveQuestions(categoryId) {
  // Mostrar notificação de início
  showToast("Verificando perguntas...", "info");
  console.log("Iniciando salvamento para categoria:", categoryId);
  
  try {
    // Verificar se há uma nova pergunta no campo de entrada
    const newQuestionInput = document.getElementById('newQuestion');
    const newQuestionText = newQuestionInput ? newQuestionInput.value.trim() : '';
    const isEditing = newQuestionInput && newQuestionInput.dataset.editIndex;
    
    // 1. Obter todas as perguntas atuais do DOM
    const questions = [];
    document.querySelectorAll('#questionsList .question-item').forEach(item => {
      const questionText = item.querySelector('.question-text').textContent;
      if (questionText && questionText.trim()) {
        questions.push(questionText.trim());
      }
    });
    
    // Se estamos editando uma pergunta
    if (isEditing) {
      const editIndex = parseInt(newQuestionInput.dataset.editIndex);
      if (editIndex >= 0 && editIndex < questions.length && newQuestionText) {
        // Substituir a pergunta que está sendo editada
        questions[editIndex] = newQuestionText;
        // Limpar o estado de edição
        newQuestionInput.removeAttribute('data-edit-index');
        newQuestionInput.value = '';
      }
    }
    // Se há texto no campo de entrada e não estamos editando, adicionar à lista
    else if (newQuestionText) {
      questions.push(newQuestionText);
      // Limpar o campo após pegar o valor
      newQuestionInput.value = '';
    }
    
    console.log("Perguntas coletadas:", questions);
    
    // Verificar se há perguntas para salvar
    if (questions.length === 0) {
      showToast("Nenhuma pergunta para salvar. Digite uma pergunta no campo abaixo.", "error");
      return false;
    }
    
    // Mostrar que estamos salvando
    showToast(`Salvando ${questions.length} pergunta(s)...`, "info");
    
    // 2. Testar a conexão com o Firestore primeiro
    const isConnected = await testFirestoreConnection();
    if (!isConnected) {
      throw new Error("Não foi possível conectar ao Firestore");
    }
    
    // 3. Salvar as perguntas diretamente no documento da categoria
    await setDoc(doc(db, "questions", categoryId), {
      items: questions,
      updatedAt: new Date().toISOString()
    }, { merge: false }); // Usar merge: false para substituir completamente
    
    console.log("Perguntas salvas com sucesso:", questions);
    
    // 4. Sucesso no método principal
    showToast(`${questions.length} pergunta(s) salva(s) com sucesso!`, 'success');
    
    // 5. Recarregar a interface para mostrar as perguntas salvas
    const headerTitle = document.querySelector('.header-title h1');
    if (headerTitle && headerTitle.textContent === "Perguntas") {
      loadQuestionsSection();
    } else {
      // Se não estiver na seção de perguntas, recarregar as perguntas no modal
      openQuestionsModal(categoryId, document.getElementById('questionsCategoryName').textContent);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar perguntas:", error);
    showToast(`Erro ao salvar: ${error.message}`, 'error');
    return false;
  }
}

// Abrir modal de locais
async function openLocationsModal(categoryId, categoryName) {
  const locationsModal = document.getElementById('locationsModal');
  const locationsList = document.getElementById('locationsList');
  const locationsCategoryName = document.getElementById('locationsCategoryName');
  
  // Salvar o ID da categoria no modal
  locationsModal.dataset.categoryId = categoryId;
  
  // Mostrar nome da categoria
  locationsCategoryName.textContent = categoryName;
  
  // Mostrar mensagem de carregamento
  locationsList.innerHTML = '<div class="loading-message">Carregando locais...</div>';
  
  try {
    // Buscar locais do Firestore
    const locationsDoc = await getDoc(doc(db, "locations", categoryId));
    
    if (locationsDoc.exists()) {
      const locationsData = locationsDoc.data();
      const locations = locationsData.items || [];
      
      if (locations.length === 0) {
        locationsList.innerHTML = '<div class="empty-message">Nenhum local cadastrado.</div>';
      } else {
        // Renderizar locais
        locationsList.innerHTML = '';
        
        locations.forEach((location, index) => {
          const locationItem = document.createElement('div');
          locationItem.className = 'location-item';
          locationItem.innerHTML = `
            <div class="location-content">
              <span class="location-number">${index + 1}.</span>
              <span class="location-text">${location}</span>
            </div>
            <button class="delete-btn delete-location-btn" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          `;
          locationsList.appendChild(locationItem);
        });
        
        // Adicionar event listeners para botões de excluir
        document.querySelectorAll('.delete-location-btn').forEach(button => {
          button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteLocation(index);
          });
        });
      }
      
      // Mostrar modal
      locationsModal.classList.remove('hidden');
    } else {
      // O documento não existe, vamos criá-lo
      try {
        await setDoc(doc(db, "locations", categoryId), {
          items: [],
          createdAt: new Date().toISOString()
        });
        
        showToast('Documento de locais criado para a categoria', 'success');
        
        // Mostrar interface para categoria sem locais
        locationsList.innerHTML = '<div class="empty-message">Nenhum local cadastrado.</div>';
        
        // Mostrar modal
        locationsModal.classList.remove('hidden');
        
      } catch (createError) {
        console.error('Erro ao criar documento de locais:', createError);
        showToast(`Erro ao criar documento de locais: ${createError.message}`, 'error');
      }
    }
  } catch (error) {
    console.error('Erro ao carregar locais:', error);
    showToast(`Erro ao carregar locais: ${error.message}`, 'error');
  }
}

// Adicionar novo local
function addNewLocation() {
  const newLocationInput = document.getElementById('newLocation');
  const locationText = newLocationInput.value.trim();
  
  if (!locationText) {
    showToast('Digite um local para adicionar', 'error');
    return;
  }
  
  const locationsList = document.getElementById('locationsList');
  const locationCount = document.querySelectorAll('.location-item').length;
  
  const locationItem = document.createElement('div');
  locationItem.className = 'location-item';
  locationItem.innerHTML = `
    <div class="location-content">
      <span class="location-number">${locationCount + 1}.</span>
      <span class="location-text">${locationText}</span>
    </div>
    <button class="delete-btn delete-location-btn" data-index="${locationCount}">
      <i class="fas fa-trash"></i>
    </button>
  `;
  
  // Limpar mensagem vazia se existir
  const emptyMessage = locationsList.querySelector('.empty-message');
  if (emptyMessage) {
    locationsList.innerHTML = '';
  }
  
  locationsList.appendChild(locationItem);
  
  // Adicionar event listener para o botão de excluir
  locationItem.querySelector('.delete-location-btn').addEventListener('click', function() {
    const index = parseInt(this.getAttribute('data-index'));
    deleteLocation(index);
  });
  
  // Limpar campo de input
  newLocationInput.value = '';
  
  // Focar no input
  newLocationInput.focus();
}

// Excluir local
function deleteLocation(index) {
  const locationItems = document.querySelectorAll('.location-item');
  
  if (index >= 0 && index < locationItems.length) {
    // Remover o item da lista
    locationItems[index].remove();
    
    // Atualizar os números e índices
    document.querySelectorAll('.location-item').forEach((item, i) => {
      item.querySelector('.location-number').textContent = `${i + 1}.`;
      item.querySelector('.delete-location-btn').setAttribute('data-index', i);
    });
    
    // Se não houver mais locais, mostrar mensagem vazia
    if (document.querySelectorAll('.location-item').length === 0) {
      document.getElementById('locationsList').innerHTML = '<div class="empty-message">Nenhum local cadastrado.</div>';
    }
  }
}

// Salvar locais
async function saveLocations(categoryId) {
  const saveBtn = document.getElementById('saveLocationsBtn');
  const originalText = saveBtn.textContent;
  
  // Desabilitar botão e mudar texto
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";
  
  try {
    // Coletar todos os locais
    const locations = [];
    document.querySelectorAll('.location-item').forEach(item => {
      const locationText = item.querySelector('.location-text').textContent;
      locations.push(locationText);
    });
    
    // Salvar no Firestore
    await setDoc(doc(db, "locations", categoryId), {
      items: locations,
      updatedAt: new Date().toISOString()
    });
    
    showToast('Locais salvos com sucesso!', 'success');
    
    // Fechar modal
    document.getElementById('locationsModal').classList.add('hidden');
  } catch (error) {
    console.error('Erro ao salvar locais:', error);
    showToast(`Erro ao salvar locais: ${error.message}`, 'error');
  } finally {
    // Restaurar botão
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Adicionar loadQuestionsSection no bloco de funções
function loadQuestionsSection() {
  const dashboardContent = document.querySelector('.dashboard-content');
  
  // Mostrar overlay de carregamento
  showLoadingOverlay();
  
  dashboardContent.innerHTML = `
    <div class="section-header">
      <h2>Gerenciamento de Perguntas</h2>
      <div class="section-actions">
        <select id="categoryFilter" class="category-filter">
          <option value="all">Todas as categorias</option>
        </select>
        <button id="exportQuestionsBtn" class="action-btn">
          <i class="fas fa-file-export"></i> Exportar
        </button>
      </div>
    </div>
    
    <div class="questions-management">
      <div class="questions-panel">
        <div id="allQuestionsContainer" class="all-questions-container">
          <div class="loading-message">Carregando categorias e perguntas...</div>
        </div>
      </div>
    </div>
  `;
  
  // Carregar todas as categorias e suas perguntas
  loadAllCategoriesAndQuestions();
}

// Função para carregar todas as categorias e suas perguntas
async function loadAllCategoriesAndQuestions() {
  const allQuestionsContainer = document.getElementById('allQuestionsContainer');
  const categoryFilter = document.getElementById('categoryFilter');
  
  try {
    // Buscar todas as categorias
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const categoriesSnapshot = await getDocs(q);
    
    if (categoriesSnapshot.empty) {
      allQuestionsContainer.innerHTML = '<div class="empty-message">Nenhuma categoria encontrada.</div>';
      hideLoadingOverlay();
      return;
    }
    
    // Armazenar todas as categorias e suas perguntas
    const categoriesData = [];
    categoryFilter.innerHTML = '<option value="all">Todas as categorias</option>';
    
    // Coletar todas as categorias
    categoriesSnapshot.forEach(doc => {
      const category = doc.data();
      const categoryId = doc.id;
      
      // Adicionar ao array de categorias
      categoriesData.push({
        id: categoryId,
        name: category.name,
        order: category.order || 0,
        active: category.active || false
      });
      
      // Adicionar ao filtro de categorias
      categoryFilter.innerHTML += `
        <option value="${categoryId}">${category.name}</option>
      `;
    });
    
    // Ordenar categorias
    categoriesData.sort((a, b) => a.order - b.order);
    
    // Buscar perguntas para cada categoria
    const allCategoriesHTML = [];
    
    for (const category of categoriesData) {
      // Buscar perguntas da categoria
      const questionsDoc = await getDoc(doc(db, "questions", category.id));
      
      let questionsHTML = '';
      
      if (questionsDoc.exists()) {
        const questionsData = questionsDoc.data();
        const questions = questionsData.items || [];
        
        if (questions.length === 0) {
          questionsHTML = '<div class="empty-message">Nenhuma pergunta cadastrada para esta categoria.</div>';
        } else {
          // Renderizar perguntas da categoria
          questionsHTML = '<div class="category-questions-list">';
          
          questions.forEach((question, index) => {
            questionsHTML += `
              <div class="question-item" data-category="${category.id}" data-index="${index}">
                <div class="question-content">
                  <span class="question-number">${index + 1}.</span>
                  <span class="question-text">${question}</span>
                </div>
                <div class="question-actions">
                  <button class="edit-question-btn" data-category="${category.id}" data-index="${index}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="delete-btn delete-question-btn" data-category="${category.id}" data-index="${index}">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            `;
          });
          
          questionsHTML += '</div>';
        }
      } else {
        // O documento não existe, vamos criá-lo
        try {
          await setDoc(doc(db, "questions", category.id), {
            items: [],
            createdAt: new Date().toISOString()
          });
          
          console.log(`Documento de questões criado para a categoria: ${category.name}`);
          questionsHTML = '<div class="empty-message">Nenhuma pergunta cadastrada para esta categoria.</div>';
        } catch (createError) {
          console.error(`Erro ao criar documento de questões para ${category.name}:`, createError);
          questionsHTML = '<div class="error-message">Erro ao criar documento de questões.</div>';
        }
      }
      
      // Adicionar categoria e suas perguntas ao HTML
      const statusBadgeClass = category.active ? 'admin' : 'viewer';
      const statusText = category.active ? 'Ativo' : 'Inativo';
      
      allCategoriesHTML.push(`
        <div class="category-section" data-category="${category.id}">
          <div class="category-header">
            <h3 class="category-name">${category.name}</h3>
            <span class="category-badge user-role-badge ${statusBadgeClass}">${statusText}</span>
            <div class="category-actions">
              <button class="add-to-category-btn action-btn" data-category="${category.id}" data-name="${category.name}">
                <i class="fas fa-plus"></i> Adicionar Pergunta
              </button>
            </div>
          </div>
          <div class="category-questions">
            ${questionsHTML}
          </div>
        </div>
      `);
    }
    
    // Renderizar todas as categorias e suas perguntas
    allQuestionsContainer.innerHTML = allCategoriesHTML.join('');
    
    // Adicionar eventos para os botões
    setupQuestionsEventListeners();
    
  } catch (error) {
    console.error('Erro ao carregar categorias e perguntas:', error);
    allQuestionsContainer.innerHTML = '<div class="error-message">Erro ao carregar categorias e perguntas. Por favor, tente novamente.</div>';
  } finally {
    hideLoadingOverlay();
  }
}

// Configurar eventos para os botões na seção de perguntas
function setupQuestionsEventListeners() {
  // Evento para filtrar categorias
  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', function() {
      const selectedCategory = this.value;
      const categorySections = document.querySelectorAll('.category-section');
      
      categorySections.forEach(section => {
        if (selectedCategory === 'all' || section.dataset.category === selectedCategory) {
          section.style.display = 'block';
        } else {
          section.style.display = 'none';
        }
      });
    });
  }
  
  // Evento para botões de adicionar pergunta à categoria
  document.querySelectorAll('.add-to-category-btn').forEach(button => {
    button.addEventListener('click', function() {
      const categoryId = this.getAttribute('data-category');
      const categoryName = this.getAttribute('data-name');
      
      openQuestionsModal(categoryId, categoryName);
    });
  });
  
  // Evento para botões de editar pergunta
  document.querySelectorAll('.edit-question-btn').forEach(button => {
    button.addEventListener('click', function() {
      const categoryId = this.getAttribute('data-category');
      const index = parseInt(this.getAttribute('data-index'));
      const categoryName = document.querySelector(`.category-section[data-category="${categoryId}"] .category-name`).textContent;
      
      openQuestionsModal(categoryId, categoryName, index);
    });
  });
  
  // Evento para botões de excluir pergunta
  document.querySelectorAll('.delete-question-btn').forEach(button => {
    button.addEventListener('click', async function() {
      if (!confirm('Tem certeza que deseja excluir esta pergunta?')) return;
      
      const categoryId = this.getAttribute('data-category');
      const index = parseInt(this.getAttribute('data-index'));
      
      try {
        // Buscar questões da categoria
        const questionsDoc = await getDoc(doc(db, "questions", categoryId));
        
        if (questionsDoc.exists()) {
          const questionsData = questionsDoc.data();
          const questions = [...(questionsData.items || [])];
          
          // Remover a pergunta
          if (index >= 0 && index < questions.length) {
            questions.splice(index, 1);
            
            // Salvar no Firestore
            await setDoc(doc(db, "questions", categoryId), {
              items: questions,
              updatedAt: new Date().toISOString()
            });
            
            showToast('Pergunta excluída com sucesso!', 'success');
            
            // Recarregar a seção
            loadQuestionsSection();
          }
        } else {
          showToast('Categoria de perguntas não encontrada', 'error');
        }
      } catch (error) {
        console.error('Erro ao excluir pergunta:', error);
        showToast(`Erro ao excluir pergunta: ${error.message}`, 'error');
      }
    });
  });
  
  // Evento para exportar perguntas
  const exportBtn = document.getElementById('exportQuestionsBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportAllQuestions);
  }
}

// Função para exportar todas as perguntas
function exportAllQuestions() {
  try {
    const selectedCategory = document.getElementById('categoryFilter').value;
    let data = [];
    
    // Coletar perguntas de acordo com o filtro selecionado
    document.querySelectorAll('.category-section').forEach(section => {
      const categoryId = section.dataset.category;
      
      if (selectedCategory === 'all' || categoryId === selectedCategory) {
        const categoryName = section.querySelector('.category-name').textContent;
        
        section.querySelectorAll('.question-item').forEach(item => {
          const questionText = item.querySelector('.question-text').textContent;
          const questionNumber = item.querySelector('.question-number').textContent.replace('.', '');
          
          data.push({
            categoria: categoryName,
            numero: questionNumber,
            pergunta: questionText
          });
        });
      }
    });
    
    // Se não houver dados, mostrar mensagem
    if (data.length === 0) {
      showToast('Não há perguntas para exportar', 'error');
      return;
    }
    
    // Converter para CSV
    const headers = ['Categoria', 'Número', 'Pergunta'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.categoria}"`,
        row.numero,
        `"${row.pergunta.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Criar arquivo e download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'perguntas.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Perguntas exportadas com sucesso!', 'success');
  } catch (error) {
    console.error('Erro ao exportar perguntas:', error);
    showToast(`Erro ao exportar perguntas: ${error.message}`, 'error');
  }
}

 