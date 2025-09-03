document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const CONST_SCOPE = `<p>Installation, commissioning, and maintenance as per agreed scope.</p>`;
    const CONST_TNC = `<ul><li>Taxes extra if applicable</li><li>Payment terms as discussed</li></ul>`;
    const CONST_WHY = `<p>Authorized partner, 10+ years experience, trusted by 50+ MWp installations.</p>`;
    
    // Form elements
    const form = document.getElementById('quotation-form');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Buttons
    const nextButtons = document.querySelectorAll('[id^="next-"]');
    const backButtons = document.querySelectorAll('[id^="back-"]');
    const clearButton = document.getElementById('clear-btn');
    const saveDraftButton = document.getElementById('save-draft');
    const previewButton = document.getElementById('preview-btn');
    const submitButton = document.querySelector('button[type="submit"]');
    const closeModalButton = document.getElementById('close-modal');
    const closePreviewButton = document.getElementById('close-preview');
    const submitQuoteButton = document.getElementById('submit-quote');
    
    // Modal
    const previewModal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    // Toast notification
    const toast = document.getElementById('success-toast');
    const toastMessage = document.getElementById('toast-message');
    
    // System details
    const systemDetailsContainer = document.getElementById('system-details-container');
    const addSystemDetailButton = document.querySelector('.add-system-detail');
    
    // Initialize form
    let currentStep = 1;
    let formData = {};
    
    // Load draft from localStorage if exists
    loadDraft();
    
    // Event Listeners
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stepNumber = parseInt(button.id.split('-')[1]);
            if (validateStep(stepNumber)) {
                saveStepData(stepNumber);
                goToStep(stepNumber + 1);
            }
        });
    });
    
    backButtons.forEach(button => {
        button.addEventListener('click', () => {
            const stepNumber = parseInt(button.id.split('-')[1]);
            goToStep(stepNumber - 1);
        });
    });
    
    clearButton.addEventListener('click', clearForm);
    saveDraftButton.addEventListener('click', saveDraft);
    previewButton.addEventListener('click', generatePreview);
    submitButton.addEventListener('click', handleSubmit);
    closeModalButton.addEventListener('click', closePreview);
    closePreviewButton.addEventListener('click', closePreview);
    submitQuoteButton.addEventListener('click', submitQuote);
    
    addSystemDetailButton.addEventListener('click', addSystemDetail);
    
    // Add event listener for removing system details
    systemDetailsContainer.addEventListener('click', function(e) {
        if (e.target.closest('.remove-system-detail')) {
            const systemDetailItem = e.target.closest('.system-detail-item');
            if (document.querySelectorAll('.system-detail-item').length > 1) {
                systemDetailItem.remove();
            } else {
                showToast('At least one system detail is required', 'error');
            }
        }
    });
    
    // Functions
    function goToStep(step) {
        // Update current step
        currentStep = step;
        
        // Hide all form steps
        formSteps.forEach(formStep => {
            formStep.classList.remove('active-step');
        });
        
        // Show current form step
        document.getElementById(`step-${step}`).classList.add('active-step');
        
        // Update progress steps
        progressSteps.forEach((progressStep, index) => {
            if (index < step) {
                progressStep.classList.add('completed-step');
            } else {
                progressStep.classList.remove('completed-step');
            }
            
            if (index === step - 1) {
                progressStep.classList.add('active-step');
            } else {
                progressStep.classList.remove('active-step');
            }
        });
    }
    
    function validateStep(step) {
        const currentFormStep = document.getElementById(`step-${step}`);
        const requiredFields = currentFormStep.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('invalid');
                isValid = false;
            } else {
                field.classList.remove('invalid');
            }
        });
        
        // Special validation for accessories (step 3)
        if (step === 3) {
            const accessories = currentFormStep.querySelectorAll('input[name="accessories"]:checked');
            if (accessories.length === 0) {
                isValid = false;
                showToast('Please select at least one accessory', 'error');
            }
        }
        
        if (!isValid) {
            showToast('Please fill in all required fields', 'error');
        }
        
        return isValid;
    }
    
    function saveStepData(step) {
        const currentFormStep = document.getElementById(`step-${step}`);
        const inputs = currentFormStep.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (!formData[input.name]) {
                    formData[input.name] = [];
                }
                if (input.checked) {
                    formData[input.name].push(input.value);
                }
            } else {
                formData[input.name] = input.value;
            }
        });
        
        // Special handling for system details (step 2)
        if (step === 2) {
            const systemDetailItems = document.querySelectorAll('.system-detail-item');
            formData.systemDetails = [];
            
            systemDetailItems.forEach(item => {
                const systemKw = item.querySelector('.system-kw').value;
                const noOfPanels = item.querySelector('.no-of-panels').value;
                const panelKw = item.querySelector('.panel-kw').value;
                
                formData.systemDetails.push({
                    systemKw,
                    noOfPanels,
                    panelKw
                });
            });
        }
    }
    
    function addSystemDetail() {
        const systemDetailItem = document.createElement('div');
        systemDetailItem.className = 'system-detail-item';
        systemDetailItem.innerHTML = `
            <div class="form-group">
                <label>System kW *</label>
                <input type="number" step="0.01" name="systemKw" class="system-kw" required>
            </div>
            <div class="form-group">
                <label>No. of Panels *</label>
                <input type="number" name="noOfPanels" class="no-of-panels" required>
            </div>
            <div class="form-group">
                <label>Panel kW *</label>
                <input type="number" step="0.01" name="panelKw" class="panel-kw" required>
            </div>
            <button type="button" class="btn remove-btn remove-system-detail">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        systemDetailsContainer.appendChild(systemDetailItem);
    }
    
    function clearForm() {
        if (confirm('Are you sure you want to clear all form data?')) {
            form.reset();
            formData = {};
            localStorage.removeItem('energyQuoteDraft');
            goToStep(1);
            showToast('Form cleared successfully');
        }
    }
    
    function saveDraft() {
        saveStepData(currentStep);
        localStorage.setItem('energyQuoteDraft', JSON.stringify(formData));
        showToast('Draft saved successfully');
    }
    
    function loadDraft() {
        const draft = localStorage.getItem('energyQuoteDraft');
        if (draft) {
            try {
                formData = JSON.parse(draft);
                
                // Populate form fields with draft data
                Object.keys(formData).forEach(key => {
                    if (key === 'systemDetails') {
                        // Handle system details separately
                        const systemDetailsContainer = document.getElementById('system-details-container');
                        systemDetailsContainer.innerHTML = '';
                        
                        formData.systemDetails.forEach(detail => {
                            const systemDetailItem = document.createElement('div');
                            systemDetailItem.className = 'system-detail-item';
                            systemDetailItem.innerHTML = `
                                <div class="form-group">
                                    <label>System kW *</label>
                                    <input type="number" step="0.01" name="systemKw" class="system-kw" value="${detail.systemKw}" required>
                                </div>
                                <div class="form-group">
                                    <label>No. of Panels *</label>
                                    <input type="number" name="noOfPanels" class="no-of-panels" value="${detail.noOfPanels}" required>
                                </div>
                                <div class="form-group">
                                    <label>Panel kW *</label>
                                    <input type="number" step="0.01" name="panelKw" class="panel-kw" value="${detail.panelKw}" required>
                                </div>
                                <button type="button" class="btn remove-btn remove-system-detail">
                                    <i class="fas fa-trash"></i>
                                </button>
                            `;
                            
                            systemDetailsContainer.appendChild(systemDetailItem);
                        });
                    } else if (Array.isArray(formData[key])) {
                        // Handle checkboxes
                        formData[key].forEach(value => {
                            const checkbox = document.querySelector(`input[name="${key}"][value="${value}"]`);
                            if (checkbox) {
                                checkbox.checked = true;
                            }
                        });
                    } else {
                        // Handle regular inputs
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = formData[key];
                        }
                    }
                });
                
                showToast('Draft loaded successfully');
            } catch (e) {
                console.error('Error loading draft:', e);
                showToast('Error loading draft', 'error');
            }
        }
    }
    
    function generatePreview() {
        if (!validateStep(currentStep)) {
            return;
        }
        
        saveStepData(currentStep);
        
        // Calculate GST and total
        const amount = parseFloat(formData.amount) || 0;
        const gstPercentage = parseFloat(formData.gstPercentage) || 0;
        const gstAmount = amount * (gstPercentage / 100);
        const totalAmount = amount + gstAmount;
        
        // Format accessories for display
        let accessoriesDisplay = '';
        if (formData.accessories && formData.accessories.length > 0) {
            accessoriesDisplay = '<ul>';
            formData.accessories.forEach(accessory => {
                accessoriesDisplay += `<li>${accessory.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`;
            });
            accessoriesDisplay += '</ul>';
        } else {
            accessoriesDisplay = '<p>No accessories selected</p>';
        }
        
        // Format system details for display
        let systemDetailsDisplay = '';
        if (formData.systemDetails && formData.systemDetails.length > 0) {
            systemDetailsDisplay = '<table class="preview-table"><thead><tr><th>System kW</th><th>No. of Panels</th><th>Panel kW</th></tr></thead><tbody>';
            formData.systemDetails.forEach(detail => {
                systemDetailsDisplay += `<tr><td>${detail.systemKw}</td><td>${detail.noOfPanels}</td><td>${detail.panelKw}</td></tr>`;
            });
            systemDetailsDisplay += '</tbody></table>';
        } else {
            systemDetailsDisplay = '<p>No system details provided</p>';
        }
        
        // Generate preview HTML
        const previewHTML = `
            <div class="preview-header">
                <h2>Lokesh Energy Quotation</h2>
                <p>Date: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="preview-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${formData.customerName || ''}</p>
                <p><strong>Email:</strong> ${formData.email || ''}</p>
                <p><strong>Contact:</strong> ${formData.contact || ''}</p>
                <p><strong>MSEDCL Consumer No:</strong> ${formData.msecdl || ''}</p>
                <p><strong>Location Pin:</strong> ${formData.locationPin || ''}</p>
                <p><strong>Address:</strong> ${formData.address || ''}</p>
            </div>
            
            <div class="preview-section">
                <h3>Project Requirements</h3>
                <p><strong>Requirement Type:</strong> ${formData.requirementType || ''}</p>
                <p><strong>Phase Selection:</strong> ${formData.phaseSelection || ''}</p>
                <h4>System Details</h4>
                ${systemDetailsDisplay}
            </div>
            
            <div class="preview-section">
                <h3>Accessories</h3>
                ${accessoriesDisplay}
            </div>
            
            <div class="preview-section">
                <h3>Financial Details</h3>
                <table class="preview-table">
                    <tr>
                        <td>Amount</td>
                        <td>₹${amount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>GST (${gstPercentage}%)</td>
                        <td>₹${gstAmount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total</strong></td>
                        <td><strong>₹${totalAmount.toFixed(2)}</strong></td>
                    </tr>
                </table>
            </div>
            
            <div class="preview-section">
                <h3>Scope of Work</h3>
                ${CONST_SCOPE}
            </div>
            
            <div class="preview-section">
                <h3>Terms & Conditions</h3>
                ${CONST_TNC}
            </div>
            
            <div class="preview-section">
                <h3>Why Choose Us</h3>
                ${CONST_WHY}
            </div>
            
            <div class="preview-section">
                <h3>Our Projects</h3>
                <div class="preview-images">
                    <div class="preview-image">
                        <img src="https://picsum.photos/seed/solar1/300/200.jpg" alt="Solar Project 1">
                    </div>
                    <div class="preview-image">
                        <img src="https://picsum.photos/seed/solar2/300/200.jpg" alt="Solar Project 2">
                    </div>
                    <div class="preview-image">
                        <img src="https://picsum.photos/seed/solar3/300/200.jpg" alt="Solar Project 3">
                    </div>
                </div>
            </div>
        `;
        
        previewContent.innerHTML = previewHTML;
        previewModal.style.display = 'block';
    }
    
    function closePreview() {
        previewModal.style.display = 'none';
    }
    
    function handleSubmit(e) {
        e.preventDefault();
        
        if (!validateStep(currentStep)) {
            return;
        }
        
        saveStepData(currentStep);
        generatePreview();
    }
    
    function submitQuote() {
        // Calculate GST and total
        const amount = parseFloat(formData.amount) || 0;
        const gstPercentage = parseFloat(formData.gstPercentage) || 0;
        const gstAmount = amount * (gstPercentage / 100);
        const totalAmount = amount + gstAmount;
        
        // Add calculated values to form data
        formData.gstAmount = gstAmount;
        formData.totalAmount = totalAmount;
        
        // Get the preview HTML
        const previewHTML = previewContent.innerHTML;
        
        // Prepare payload
        const payload = {
            html: previewHTML,
            data: formData
        };
        
        // In a real application, replace this with your actual webhook URL
        const WEBHOOK_URL = 'http://localhost:5678/webhook/0d8d38a3-d68f-4168-baf1-1f5c565f189b';
        
        // Simulate API call
        showToast('Submitting quotation...');
        
        // Simulate network delay
        setTimeout(() => {
            // This is where you would make the actual API call
            // fetch(WEBHOOK_URL, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(payload)
            // })
            // .then(response => response.json())
            // .then(data => {
            //     showToast('Quotation submitted successfully!');
            //     closePreview();
            //     clearForm();
            // })
            // .catch(error => {
            //     showToast('Error submitting quotation', 'error');
            //     console.error('Error:', error);
            // });
            
            // For demo purposes, we'll just show a success message
            showToast('Quotation submitted successfully!');
            closePreview();
            clearForm();
        }, 1500);
    }
    
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        if (type === 'error') {
            toast.style.backgroundColor = 'var(--error-color)';
        } else {
            toast.style.backgroundColor = 'var(--success-color)';
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    // Close modal when clicking outside of it
    window.addEventListener('click', function(e) {
        if (e.target === previewModal) {
            closePreview();
        }
    });
});