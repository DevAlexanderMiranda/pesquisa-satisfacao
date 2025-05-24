// Importar o Firebase
import { app, analytics } from './firebase-config.js';
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.8.0/firebase-firestore.js";

// Inicializar Firestore
const db = getFirestore(app);

// Armazenar categorias e questões carregadas do Firebase
let questions = {};
let locations = {};

// DOM Elements
const cpfInput = document.getElementById('cpf');
const nomeInput = document.getElementById('nome');
const questionsContainer = document.getElementById('questionsContainer');
const categoryButtonsContainer = document.querySelector('.category-buttons');
const locationFilter = document.getElementById('locationFilter');
const locationSelect = document.getElementById('locationSelect');
const commentSection = document.getElementById('commentSection');
const commentInput = document.getElementById('comment');
const loadingOverlay = document.getElementById('loadingOverlay');

// Options for all questions
const options = ["Ótimo", "Bom", "Regular", "Ruim", "Péssimo", "Não usa o serviço"];

// Store survey responses
let surveyResponses = JSON.parse(localStorage.getItem('surveyResponses')) || [];

// Função para mostrar overlay de carregamento
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

// Função para esconder overlay de carregamento
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Função para carregar as categorias do Firestore
async function loadCategories() {
    showLoading();
    try {
        // Limpar o container de botões de categorias
        categoryButtonsContainer.innerHTML = '';
        
        // Carregar categorias do Firestore
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        
        if (categoriesSnapshot.empty) {
            console.log('Nenhuma categoria encontrada no banco de dados');
            showCustomAlert('Nenhuma categoria encontrada. Por favor, contate o administrador.');
            return;
        }
        
        // Ordenar categorias por ordem
        const categoriesArray = [];
        categoriesSnapshot.forEach((doc) => {
            const categoryData = doc.data();
            if (categoryData.active) {
                categoriesArray.push({
                    id: doc.id,
                    name: categoryData.name,
                    order: categoryData.order || 0
                });
            }
        });
        
        // Ordenar por ordem
        categoriesArray.sort((a, b) => a.order - b.order);
        
        // Criar botões para cada categoria
        categoriesArray.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.dataset.category = category.id;
            button.textContent = category.name;
            categoryButtonsContainer.appendChild(button);
            
            // Adicionar event listener ao botão
            button.addEventListener('click', function() {
                handleCategorySelection(category.id);
            });
        });
        
        // Carregar questões e locais para cada categoria
        await loadQuestionsAndLocations(categoriesArray);
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
        showCustomAlert('Erro ao carregar categorias. Por favor, verifique sua conexão ou contate o administrador.');
    } finally {
        hideLoading();
    }
}

// Função para carregar questões e locais para cada categoria
async function loadQuestionsAndLocations(categories) {
    try {
        for (const category of categories) {
            // Carregar questões
            const questionsDoc = await getDoc(doc(db, "questions", category.id));
            if (questionsDoc.exists()) {
                questions[category.id] = questionsDoc.data().items || [];
            } else {
                questions[category.id] = [];
            }
            
            // Carregar locais
            const locationsDoc = await getDoc(doc(db, "locations", category.id));
            if (locationsDoc.exists()) {
                locations[category.id] = locationsDoc.data().items || [];
            } else {
                locations[category.id] = [];
            }
        }
        
        console.log("Questions and locations loaded:", questions, locations);
    } catch (error) {
        console.error("Erro ao carregar questões e locais:", error);
    }
}

// CPF formatting
cpfInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
    }
    
    e.target.value = value;
});

// Location select change handler
locationSelect.addEventListener('change', function() {
    if (this.value) {
        displayQuestions(this.dataset.category);
    } else {
        questionsContainer.innerHTML = '';
        commentSection.classList.add('hidden');
    }
});

// Handle category selection
function handleCategorySelection(category) {
    // Clear previous questions with a fade out effect
    questionsContainer.innerHTML = '';
    questionsContainer.style.opacity = '0';
    commentSection.classList.add('hidden');
    
    // Set the category data attribute on the select element
    locationSelect.dataset.category = category;
    
    // Check if this category has locations
    if (locations[category] && locations[category].length > 0) {
        // Reset the location filter to ensure animation triggers again
        locationFilter.style.animation = 'none';
        locationFilter.offsetHeight; // Trigger reflow
        
        // Show location filter with animation
        locationFilter.classList.remove('hidden');
        locationFilter.style.opacity = '0';
        locationFilter.style.animation = 'fadeInUp 0.5s ease forwards';
        
        // Set the appropriate placeholder text based on category
        let placeholderText = "Selecione uma opção";
        
        // Populate location options
        locationSelect.innerHTML = `<option value="">${placeholderText}</option>`;
        locations[category].forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationSelect.appendChild(option);
        });
        
        // Don't show questions yet, wait for location selection
    } else {
        // Hide location filter and show questions directly
        locationFilter.classList.add('hidden');
        displayQuestions(category);
    }
}

// Display questions for selected category
function displayQuestions(category) {
    // Clear previous questions with a fade out effect
    questionsContainer.style.opacity = '0';
    
    // Wait for fade out to complete before showing new questions
    setTimeout(() => {
        questionsContainer.innerHTML = '';
        questionsContainer.style.opacity = '1';
        
        const categoryQuestions = questions[category] || [];
        
        if (categoryQuestions.length === 0) {
            questionsContainer.innerHTML = '<p class="empty-state">Nenhuma pergunta encontrada para esta categoria.</p>';
            return;
        }
        
        categoryQuestions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <h3>${index + 1}. ${question}</h3>
                <div class="options">
                    ${options.map(option => `
                        <label class="option">
                            ${option}
                            <input type="radio" name="question${index}" value="${option}">
                            <span class="checkmark"></span>
                        </label>
                    `).join('')}
                </div>
            `;
            
            questionsContainer.appendChild(questionDiv);
        });
        
        // Show comment section with animation
        commentSection.classList.remove('hidden');
        commentSection.style.opacity = '0';
        commentSection.style.animation = 'fadeInUp 0.5s ease forwards';
        commentSection.style.animationDelay = '1.5s';
        
        // Move the comment section into the questions container
        questionsContainer.appendChild(commentSection);
        
        // Add submit button with animation
        const submitButton = document.createElement('button');
        submitButton.className = 'category-btn';
        submitButton.textContent = 'Enviar Pesquisa';
        submitButton.style.marginTop = '1rem';
        submitButton.style.opacity = '0';
        submitButton.style.animation = 'fadeInUp 0.5s ease forwards';
        submitButton.style.animationDelay = '1.6s';
        submitButton.addEventListener('click', submitSurvey);
        questionsContainer.appendChild(submitButton);
    }, 300); // Wait 300ms for fade out
}

function showCustomAlert(message) {
    const alertDialog = document.getElementById('customAlert');
    const alertMessage = document.getElementById('alertMessage');
    const alertButton = document.getElementById('alertButton');
    const alertContent = document.querySelector('.custom-alert-content');
    
    alertMessage.textContent = message;
    alertDialog.classList.remove('hidden');
    
    // Function to close the alert
    const closeAlert = () => {
        alertDialog.classList.add('hidden');
        // Remove event listeners
        document.removeEventListener('keydown', handleEscKey);
        alertDialog.removeEventListener('click', handleOutsideClick);
    };
    
    // Handle ESC key press
    const handleEscKey = (event) => {
        if (event.key === 'Escape') {
            closeAlert();
        }
    };
    
    // Handle click outside the alert content
    const handleOutsideClick = (event) => {
        if (event.target === alertDialog) {
            closeAlert();
        }
    };
    
    // Add event listeners
    document.addEventListener('keydown', handleEscKey);
    alertDialog.addEventListener('click', handleOutsideClick);
    
    // Button click handler
    alertButton.onclick = closeAlert;
}

// Update the submitSurvey function to use custom alert
function submitSurvey() {
    const nome = nomeInput.value.trim();
    const cpf = cpfInput.value.trim();
    
    if (!nome || !cpf) {
        showCustomAlert('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const selectedCategory = locationSelect.dataset.category;
    const selectedLocation = locationSelect.value;
    
    if (locations[selectedCategory] && locations[selectedCategory].length > 0 && !selectedLocation) {
        showCustomAlert('Por favor, selecione uma unidade.');
        return;
    }
    
    const responses = {};
    let allQuestionsAnswered = true;
    
    document.querySelectorAll('.question').forEach((questionDiv, index) => {
        const selectedOption = questionDiv.querySelector(`input[name="question${index}"]:checked`);
        if (!selectedOption) {
            allQuestionsAnswered = false;
            return;
        }
        responses[questions[selectedCategory][index]] = selectedOption.value;
    });
    
    if (!allQuestionsAnswered) {
        showCustomAlert('Por favor, responda todas as perguntas.');
        return;
    }
    
    const surveyResponse = {
        nome,
        cpf,
        category: selectedCategory,
        location: selectedLocation || null,
        responses,
        comment: commentInput.value,
        timestamp: new Date().toISOString()
    };
    
    surveyResponses.push(surveyResponse);
    localStorage.setItem('surveyResponses', JSON.stringify(surveyResponses));
    
    showCustomAlert('Pesquisa enviada com sucesso!');
    nomeInput.value = '';
    cpfInput.value = '';
    locationSelect.value = '';
    commentInput.value = '';
    questionsContainer.innerHTML = '';
    commentSection.classList.add('hidden');
    locationFilter.classList.add('hidden');
}

// Iniciar carregando categorias quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
});