import { 
  auth, 
  db, 
  doc, 
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc
} from '../config/firebase-config.js';

import {
  ROLES,
  getAllUsers,
  updateUserRole,
  getCurrentUser,
  isAdmin,
  logoutUser
} from '../auth/auth-service.js';

// Elementos DOM
const adminPanel = document.getElementById('adminPanel');
const container = document.getElementById('container');
const usersList = document.getElementById('usersList');
const logoutButton = document.getElementById('logoutButton');

// Verificar estado de autenticação ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  await checkAdminStatus();
});

// Verificar se o usuário é admin e mostrar o painel apropriado
async function checkAdminStatus() {
  const user = await getCurrentUser();
  
  if (user) {
    const admin = await isAdmin(user.uid);
    
    if (admin) {
      // Mostrar o painel de admin e esconder o login
      container.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      // Carregar a lista de usuários
      loadUsers();
    } else {
      // Manter no login e mostrar mensagem (já feito no admin-auth.js)
      adminPanel.classList.add('hidden');
      container.classList.remove('hidden');
    }
  } else {
    // Se não estiver logado, mostrar tela de login
    adminPanel.classList.add('hidden');
    container.classList.remove('hidden');
  }
}

// Carregar todos os usuários
async function loadUsers() {
  const users = await getAllUsers();
  renderUsers(users);
}

// Renderizar a lista de usuários
function renderUsers(users) {
  usersList.innerHTML = '';
  
  if (users.length === 0) {
    usersList.innerHTML = '<p>Nenhum usuário encontrado.</p>';
    return;
  }
  
  users.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'user-item';
    userElement.dataset.id = user.id;
    
    const roleClass = user.role === ROLES.ADMIN 
      ? 'admin' 
      : user.role === ROLES.EDITOR 
        ? 'editor' 
        : '';
    
    userElement.innerHTML = `
      <div class="user-info">
        <span class="name">${user.name}</span>
        <span class="email">${user.email}</span>
        <span class="role ${roleClass}">${user.role}</span>
      </div>
      <div class="user-actions">
        <button class="edit-role-btn" data-id="${user.id}">Editar Permissão</button>
        <button class="delete-user-btn" data-id="${user.id}">Excluir</button>
      </div>
    `;
    
    usersList.appendChild(userElement);
  });
  
  // Adicionar eventos aos botões
  addButtonEventListeners();
}

// Adicionar listeners aos botões de ação
function addButtonEventListeners() {
  // Botões editar permissão
  document.querySelectorAll('.edit-role-btn').forEach(button => {
    button.addEventListener('click', handleEditRole);
  });
  
  // Botões excluir usuário
  document.querySelectorAll('.delete-user-btn').forEach(button => {
    button.addEventListener('click', handleDeleteUser);
  });
}

// Manipulador para editar permissão
async function handleEditRole(e) {
  const userId = e.target.dataset.id;
  const userItem = document.querySelector(`.user-item[data-id="${userId}"]`);
  const roleSpan = userItem.querySelector('.role');
  
  // Verificar se já está em modo de edição
  if (userItem.querySelector('.role-selector')) {
    return;
  }
  
  // Criar seletor de permissão
  const currentRole = roleSpan.textContent;
  const roleSelector = document.createElement('select');
  roleSelector.className = 'role-selector';
  
  // Adicionar opções
  Object.values(ROLES).forEach(role => {
    const option = document.createElement('option');
    option.value = role;
    option.textContent = role;
    option.selected = role === currentRole;
    roleSelector.appendChild(option);
  });
  
  // Substituir o span pelo seletor
  roleSpan.parentNode.replaceChild(roleSelector, roleSpan);
  
  // Adicionar botão de salvar
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Salvar';
  saveButton.className = 'edit-role-btn';
  saveButton.addEventListener('click', async () => {
    const newRole = roleSelector.value;
    
    // Atualizar no Firebase
    const result = await updateUserRole(userId, newRole);
    
    if (result.success) {
      // Atualizar na UI
      const newRoleSpan = document.createElement('span');
      newRoleSpan.className = `role ${newRole === ROLES.ADMIN ? 'admin' : newRole === ROLES.EDITOR ? 'editor' : ''}`;
      newRoleSpan.textContent = newRole;
      
      roleSelector.parentNode.replaceChild(newRoleSpan, roleSelector);
      saveButton.remove();
      
      // Recarregar lista para refletir alterações
      loadUsers();
    }
  });
  
  e.target.parentNode.appendChild(saveButton);
  e.target.style.display = 'none';
}

// Manipulador para excluir usuário
async function handleDeleteUser(e) {
  const userId = e.target.dataset.id;
  
  // Confirmar antes de excluir
  if (!confirm('Tem certeza que deseja excluir este usuário?')) {
    return;
  }
  
  try {
    // Excluir do Firestore (não exclui do Auth, apenas do banco de dados)
    await deleteDoc(doc(db, "users", userId));
    
    // Atualizar UI
    const userItem = document.querySelector(`.user-item[data-id="${userId}"]`);
    userItem.remove();
    
    // Adicionar mensagem de sucesso temporária
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Usuário excluído com sucesso!';
    usersList.insertBefore(successMessage, usersList.firstChild);
    
    setTimeout(() => {
      successMessage.remove();
    }, 3000);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    alert("Erro ao excluir usuário: " + error.message);
  }
}

// Manipulador de logout
logoutButton.addEventListener('click', async () => {
  await logoutUser();
  // Voltar para tela de login
  adminPanel.classList.add('hidden');
  container.classList.remove('hidden');
});

// Inicializar a verificação de status de admin
checkAdminStatus(); 