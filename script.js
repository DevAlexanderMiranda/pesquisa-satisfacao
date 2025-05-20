// Questions data
const questions = {
    saude: [
        "Como você avalia a comunicação e clareza das informações fornecidas pelo médico?",
        "Como você avalia a disponibilidade e atenção do enfermeiro durante o atendimento?",
        "Como você avalia a eficiência dos técnicos de saúde nos procedimentos realizados?",
        "Como você avalia a clareza das explicações fornecidas pelo médico?",
        "Como você avalia a atenção e o cuidado demonstrados pelo médico durante seu atendimento?",
        "Como você avalia a atenção e o cuidado demonstrados pela equipe de enfermagem?",
        "Como você avalia a atenção e o cuidado demonstrados pelos técnicos de saúde?",
        "Como você avalia a qualidade geral do atendimento recebido na unidade de saúde?",
        "Como você avalia a estrutura e organização da unidade de saúde?",
        "Como você avalia a limpeza e conservação do ambiente da unidade de saúde?",
        "Como você avalia a sensação de acolhimento durante seu atendimento?",
        "Como você avalia a confiança que os profissionais da unidade transmitiram durante o atendimento?",
        "Como você avalia a facilidade de acesso aos serviços da unidade de saúde?",
        "Como você avalia a agilidade no processo de atendimento como um todo?",
        "Como você avalia a capacidade dos profissionais em resolver suas necessidades de saúde?"
    ],
    educacao: [
        "Como você avalia a qualidade do ensino?",
        "Como você avalia a infraestrutura da escola?",
        "Como você avalia o material didático?",
        "Como você avalia o corpo docente?",
        "Como você avalia a merenda escolar?",
        "Como você avalia o transporte escolar?",
        "Como você avalia a segurança da escola?",
        "Como você avalia a comunicação com os pais?",
        "Como você avalia as atividades extracurriculares?",
        "Como você avalia o atendimento da secretaria?",
        "Como você avalia a biblioteca?",
        "Como você avalia os laboratórios?",
        "Como você avalia o acesso à internet?",
        "Como você avalia a inclusão de alunos especiais?",
        "Como você avalia a gestão escolar?"
    ],
    servicos: [
        "Como você avalia o atendimento na prefeitura?",
        "Como você avalia a limpeza das ruas?",
        "Como você avalia a iluminação pública?",
        "Como você avalia o transporte público?",
        "Como você avalia a manutenção das estradas?",
        "Como você avalia o serviço de coleta de lixo?",
        "Como você avalia o atendimento da polícia?",
        "Como você avalia o serviço dos bombeiros?",
        "Como você avalia o serviço de água?",
        "Como você avalia o serviço de esgoto?",
        "Como você avalia o serviço de internet?",
        "Como você avalia o serviço de telefonia?",
        "Como você avalia o serviço de energia elétrica?",
        "Como você avalia o serviço de correios?",
        "Como você avalia o serviço de cartórios?"
    ]
};

// Location data
const locations = {
    saude: [
        "UBS Waldir Viana – Bairro São Benedito",
        "UBS da União – Bairro da União",
        "UBS Doutor Toda – Bairro Francesa",
        "UBS Tia Leó – Bairro Dejard Vieira",
        "UBS Dr. Aldrin Verçosa – Bairro Itaúna",
        "UBS Dom Arcângelo – Bairro Santa Rita de Cássia",
        "UBS Darlinda Ribeiro – Bairro Palmares",
        "UBS Paulo Pereira – Bairro Palmares",
        "UBS Mãe Palmira – Bairro Palmares",
        "UBS Galliani – Bairro Palmares",
        "Centro de Saúde Denizal Pereira – Bairro Palmares",
        "Centro de Saúde Irmão Francisco Galiani – Bairro Palmares",
        "Centro de Saúde Maria do Carmo – Bairro Palmares",
        "Centro de Saúde Padre Francisco Lupino – Bairro Palmares",
        "UBS Fluvial Lígia Loyola – Unidade itinerante que atende comunidades ribeirinhas"
    ],
    educacao: [
        "Escola Municipal Alberto Kimura Filho",
        "Escola Municipal Beatriz Maranhão",
        "Escola Municipal Betel",
        "Escola Municipal Boa Vista",
        "Escola Municipal Bom Jesus",
        "Escola Municipal Brito Nascimento",
        "Escola Municipal Charles Garcia",
        "Escola Municipal Claudemir Carvalho",
        "Escola Municipal Cristo Rei",
        "Escola Municipal da Paz de Parintins",
        "Escola Municipal Didel de Castro Garcia",
        "Escola Municipal Divino Espírito Santo",
        "Escola Municipal Guajarina Prestes",
        "Escola Municipal Irmã Cristine",
        "Escola Municipal Lila Maia",
        "Escola Municipal Luiz Gonzaga",
        "Escola Municipal Mércia Cardoso Coimbra",
        "Escola Municipal Minervina Reis Ferreira",
        "Escola Municipal Nossa Senhora da Saúde",
        "Escola Municipal Nossa Senhora do Desterro",
        "Escola Municipal Nossa Senhora do Perpétuo Socorro",
        "Escola Municipal Presbiteriana Missionária Sue Ann Cousar",
        "Escola Municipal Professor Manoel Nazaré Muniz",
        "Escola Municipal Santa Luzia",
        "Escola Municipal Santa Maria",
        "Escola Municipal Santo Antônio",
        "Escola Municipal São Francisco",
        "Escola Municipal São Francisco de Assis",
        "Escola Municipal São José",
        "Escola Municipal Teodoro Reis",
        "Escola Municipal Tsukasa Uyetsuka",
        "Escola Municipal Waldemira Bentes",
        "Escola Municipal Walkíria Viana Gonçalves",
        "Centro Educacional Infantil Alvorada",
        "Centro Educacional Infantil Aurora",
        "Centro Educacional Infantil Castanheira",
        "Centro Educacional Infantil Claudir Carvalho",
        "Centro Educacional Infantil Dom Arcângelo Cerqua",
        "Centro Educacional Infantil Evanilza Prestes Paixão",
        "Centro Educacional Infantil Gurilândia",
        "Centro Educacional Infantil Jaime Lobato",
        "Centro Educacional Infantil Mirinópolis",
        "Centro Educacional Infantil Novo Horizonte",
        "Centro Educacional Infantil Novo Israel",
        "Centro Educacional Infantil Palmares",
        "Centro Educacional Infantil Pequeninos de Nazaré",
        "Centro Educacional Infantil Sementinha",
        "Centro Educacional Infantil Tia Dodô",
        "Centro Educacional Nossa Senhora das Graças"
    ]
};

// Options for all questions
const options = ["Ótimo", "Bom", "Regular", "Ruim", "Péssimo", "Não usa o serviço"];

// Store survey responses
let surveyResponses = JSON.parse(localStorage.getItem('surveyResponses')) || [];

// DOM Elements
const cpfInput = document.getElementById('cpf');
const nomeInput = document.getElementById('nome');
const questionsContainer = document.getElementById('questionsContainer');
const categoryButtons = document.querySelectorAll('.category-btn');
const locationFilter = document.getElementById('locationFilter');
const locationSelect = document.getElementById('locationSelect');
const commentSection = document.getElementById('commentSection');
const commentInput = document.getElementById('comment');

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

// Category button click handler
categoryButtons.forEach(button => {
    button.addEventListener('click', function() {
        const category = this.dataset.category;
        handleCategorySelection(category);
    });
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
    if (locations[category]) {
        // Reset the location filter to ensure animation triggers again
        locationFilter.style.animation = 'none';
        locationFilter.offsetHeight; // Trigger reflow
        
        // Show location filter with animation
        locationFilter.classList.remove('hidden');
        locationFilter.style.opacity = '0';
        locationFilter.style.animation = 'fadeInUp 0.5s ease forwards';
        
        // Set the appropriate placeholder text based on category
        let placeholderText = "Selecione uma opção";
        if (category === 'saude') {
            placeholderText = "Selecione a Unidade de Saúde";
        } else if (category === 'educacao') {
            placeholderText = "Selecione a Unidade Escolar";
        }
        
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
        
        const categoryQuestions = questions[category];
        
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
    
    if (locations[selectedCategory] && !selectedLocation) {
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