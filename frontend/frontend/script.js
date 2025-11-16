class DocumentQA {
    constructor() {
        this.form = document.getElementById('qaForm');
        this.fileInput = document.getElementById('documentFile');
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.browseBtn = document.getElementById('browseBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.removeFileBtn = document.getElementById('removeFile');
        this.resultsContainer = document.getElementById('results');
        this.answersList = document.getElementById('answersList');
        this.errorContainer = document.getElementById('error');
        this.errorMessage = document.getElementById('errorMessage');
        this.submitBtn = document.getElementById('submitBtn');
        this.btnText = this.submitBtn.querySelector('.btn-text');
        this.btnLoading = this.submitBtn.querySelector('.btn-loading');
        
        this.selectedFile = null;
        this.backendUrl = 'http://localhost:10000'; // Fixed backend URL
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        
        // File upload events
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());
        
        // Drag and drop events
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
    }
    
    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('drag-over');
    }
    
    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('drag-over');
    }
    
    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }
    
    processFile(file) {
        // Validate file type
        if (file.type !== 'application/pdf') {
            this.displayError('Please select a PDF file');
            return;
        }
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            this.displayError('File size must be less than 10MB');
            return;
        }
        
        this.selectedFile = file;
        this.displayFileInfo(file);
        this.hideError();
    }
    
    displayFileInfo(file) {
        const fileSize = this.formatFileSize(file.size);
        this.fileName.innerHTML = `${file.name} <span class="file-size">(${fileSize})</span>`;
        this.fileInfo.style.display = 'flex';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    removeFile() {
        this.selectedFile = null;
        this.fileInput.value = '';
        this.fileInfo.style.display = 'none';
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const questions = document.getElementById('questions').value;
        
        // Validate inputs
        if (!this.validateInputs(questions)) {
            return;
        }
        
        this.showLoading();
        this.hideResults();
        this.hideError();
        
        try {
            const response = await this.callBackendAPI(questions);
            this.displayResults(response);
            
        } catch (error) {
            console.error('Error:', error);
            this.displayError(error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    async callBackendAPI(questions) {
        const questionList = questions.split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 0);
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('questions', JSON.stringify(questionList));
        
        const response = await fetch(`${this.backendUrl}/api/v1/hackrx/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data;
    }
    
    validateInputs(questions) {
        // Clear previous errors
        this.hideError();
        
        const errors = [];
        
        if (!this.selectedFile) {
            errors.push('Please select a PDF file');
        }
        
        if (!questions) {
            errors.push('Please enter at least one question');
        }
        
        if (errors.length > 0) {
            this.displayError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    showLoading() {
        this.submitBtn.disabled = true;
        this.btnText.style.display = 'none';
        this.btnLoading.style.display = 'inline-block';
    }
    
    hideLoading() {
        this.submitBtn.disabled = false;
        this.btnText.style.display = 'inline-block';
        this.btnLoading.style.display = 'none';
    }
    
    displayResults(data) {
        this.answersList.innerHTML = '';
        
        if (data.answers && data.answers.length > 0) {
            // Add answer count to title
            const title = this.resultsContainer.querySelector('h2');
            title.innerHTML = `📋 Answers <span class="answer-count">${data.answers.length} results</span>`;
            
            data.answers.forEach((item, index) => {
                const answerElement = this.createAnswerElement(item, index);
                this.answersList.appendChild(answerElement);
            });
            
            this.showResults();
        } else {
            this.displayError('No answers received from the server');
        }
    }
    
    createAnswerElement(item, index) {
        const div = document.createElement('div');
        div.className = 'answer-item';
        
        const question = item.question || `Question ${index + 1}`;
        const answer = item.answer || 'No answer provided';
        
        div.innerHTML = `
            <h3>${this.escapeHtml(question)}</h3>
            <p>${this.formatAnswer(answer)}</p>
        `;
        
        return div;
    }
    
    formatAnswer(answer) {
        // Convert line breaks and preserve formatting
        return this.escapeHtml(answer).replace(/\n/g, '<br>');
    }
    
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    showResults() {
        this.resultsContainer.style.display = 'block';
        this.resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    hideResults() {
        this.resultsContainer.style.display = 'none';
    }
    
    displayError(message) {
        this.errorMessage.innerHTML = message;
        this.errorContainer.style.display = 'block';
        this.errorContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    hideError() {
        this.errorContainer.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DocumentQA();
    
    // Add some sample data for testing
    const sampleQuestions = document.getElementById('questions');
    if (!sampleQuestions.value) {
        sampleQuestions.value = `What is the main purpose of this document?
What are the key terms and conditions?
How does the process work?
What are the important clauses?`;
    }
});