document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const lectureForm = document.getElementById('lectureForm');
    const audioUpload = document.getElementById('audioUpload');
    const slidesUpload = document.getElementById('slidesUpload');
    const audioFile = document.getElementById('audioFile');
    const slidesFile = document.getElementById('slidesFile');
    const generateButton = document.getElementById('generateButton');
    const menuButton = document.getElementById('menuButton');
    const settingsButton = document.getElementById('settingsButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultContainer = document.getElementById('resultContainer');
    const resultLinks = document.getElementById('resultLinks');
    
    // Settings modal elements
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsButton = document.getElementById('closeSettingsButton');
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    const resetSettingsButton = document.getElementById('resetSettingsButton');
    const themeToggle = document.getElementById('themeToggle');
    const modelSelector = document.getElementById('modelSelector');
    const customModelContainer = document.getElementById('customModelContainer');
    const customModel = document.getElementById('customModel');
    const baseUrl = document.getElementById('baseUrl');
    const whisperModel = document.getElementById('whisperModel');

    // Default settings
    const defaultSettings = {
        theme: 'light',
        modelType: 'gpt-4',
        customModel: '',
        baseUrl: ''
    };

    // Load settings from localStorage
    loadSettings();

    // Add click event listeners using traditional approach
    if (menuButton) {
        menuButton.onclick = function(e) {
            e.preventDefault();
            console.log('Menu button clicked');
            // Implement menu functionality here
            alert('Menu functionality will be implemented in a future update.');
        };
    }

    // Settings button opens the settings modal
    if (settingsButton) {
        settingsButton.onclick = function(e) {
            e.preventDefault();
            if (settingsModal) {
                settingsModal.style.display = 'block';
            }
        };
    }

    // Close settings modal when clicking the close button
    if (closeSettingsButton) {
        closeSettingsButton.onclick = function() {
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
        };
    }

    // Close settings modal when clicking outside the modal content
    window.onclick = function(event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    };

    // Save settings button
    if (saveSettingsButton) {
        saveSettingsButton.onclick = function() {
            saveSettings();
            if (settingsModal) {
                settingsModal.style.display = 'none';
            }
        };
    }

    // Reset settings button
    if (resetSettingsButton) {
        resetSettingsButton.onclick = function() {
            resetSettings();
        };
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.onchange = function() {
            const theme = themeToggle.checked ? 'dark' : 'light';
            applyTheme(theme);
        };
    }

    // Model selector change
    if (modelSelector) {
        modelSelector.onchange = function() {
            toggleCustomModelInput();
        };
    }

    // Toggle custom model input based on selection
    function toggleCustomModelInput() {
        if (modelSelector.value === 'custom') {
            customModelContainer.style.display = 'flex';
        } else {
            customModelContainer.style.display = 'none';
        }
    }

    // Set up file upload for audio
    if (audioUpload && audioFile) {
        // Click to select file
        audioUpload.onclick = function() {
            audioFile.click();
        };

        // Handle file selection
        audioFile.onchange = function() {
            if (audioFile.files.length > 0) {
                const fileName = audioFile.files[0].name;
                const fileDisplay = audioUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
            }
        };

        // Handle drag and drop
        audioUpload.ondragover = function(e) {
            e.preventDefault();
            audioUpload.style.borderColor = '#3498db';
        };

        audioUpload.ondragleave = function(e) {
            e.preventDefault();
            audioUpload.style.borderColor = '#dcdde1';
        };

        audioUpload.ondrop = function(e) {
            e.preventDefault();
            audioUpload.style.borderColor = '#dcdde1';
            
            if (e.dataTransfer.files.length > 0) {
                audioFile.files = e.dataTransfer.files;
                const fileName = e.dataTransfer.files[0].name;
                const fileDisplay = audioUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
            }
        };
    }

    // Set up file upload for slides
    if (slidesUpload && slidesFile) {
        // Click to select file
        slidesUpload.onclick = function() {
            slidesFile.click();
        };

        // Handle file selection
        slidesFile.onchange = function() {
            if (slidesFile.files.length > 0) {
                const fileName = slidesFile.files[0].name;
                const fileDisplay = slidesUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
            }
        };

        // Handle drag and drop
        slidesUpload.ondragover = function(e) {
            e.preventDefault();
            slidesUpload.style.borderColor = '#3498db';
        };

        slidesUpload.ondragleave = function(e) {
            e.preventDefault();
            slidesUpload.style.borderColor = '#dcdde1';
        };

        slidesUpload.ondrop = function(e) {
            e.preventDefault();
            slidesUpload.style.borderColor = '#dcdde1';
            
            if (e.dataTransfer.files.length > 0) {
                slidesFile.files = e.dataTransfer.files;
                const fileName = e.dataTransfer.files[0].name;
                const fileDisplay = slidesUpload.querySelector('.upload-content p');
                if (fileDisplay) {
                    fileDisplay.textContent = fileName;
                }
            }
        };
    }

    // Handle form submission
    if (lectureForm) {
        lectureForm.onsubmit = function(e) {
            e.preventDefault();
            
            // Validate form
            if (!audioFile.files.length) {
                alert('Please select an audio file');
                return false;
            }

            // Validate custom model if selected
            const settings = getSettings();
            if (settings.modelType === 'custom' && !settings.customModel.trim()) {
                alert('Please enter a custom model name or select a predefined model');
                return false;
            }

            // Show loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            // Disable generate button
            if (generateButton) {
                generateButton.disabled = true;
                generateButton.innerHTML = '<span class="icon">⏳</span> Processing...';
            }

            // Create FormData object
            const formData = new FormData(lectureForm);
            
            // Add OpenAI model and base URL from settings
            const modelName = settings.modelType === 'custom' ? settings.customModel : settings.modelType;
            formData.append('openai_model', modelName);
            formData.append('base_url', settings.baseUrl || '');
            
            console.log('Submitting form with:');
            console.log('- Whisper model:', formData.get('model'));
            console.log('- OpenAI model:', modelName);
            console.log('- Base URL:', settings.baseUrl || 'Default');
            
            // Send form data to server
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/generate', true);
            
            xhr.onload = function() {
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Re-enable generate button
                if (generateButton) {
                    generateButton.disabled = false;
                    generateButton.innerHTML = '<span class="icon">✏️</span> Generate Notes';
                }
                
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log('Response:', response);
                        
                        if (response.status === 'success') {
                            // Show result container
                            if (resultContainer) {
                                resultContainer.style.display = 'block';
                            }
                            
                            // Display result links
                            if (resultLinks) {
                                resultLinks.innerHTML = '';
                                
                                if (response.files) {
                                    const files = response.files;
                                    
                                    // Create links to generated files
                                    for (const [key, path] of Object.entries(files)) {
                                        const link = document.createElement('a');
                                        link.href = path.replace('/app', '');
                                        link.textContent = key.charAt(0).toUpperCase() + key.slice(1);
                                        link.className = 'result-link';
                                        link.download = path.split('/').pop();
                                        
                                        const linkContainer = document.createElement('div');
                                        linkContainer.className = 'result-link-container';
                                        linkContainer.appendChild(link);
                                        
                                        resultLinks.appendChild(linkContainer);
                                    }
                                }
                            }
                            
                            alert('Notes generated successfully!');
                        } else {
                            showErrorMessage('Failed to generate notes', response.message, response.traceback);
                        }
                    } catch (error) {
                        console.error('Error parsing response:', error);
                        showErrorMessage('Failed to process server response', error.message);
                    }
                } else {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        showErrorMessage('Server error: ' + xhr.status, errorResponse.message, errorResponse.traceback);
                    } catch (e) {
                        showErrorMessage('Server error: ' + xhr.status, 'Unknown server error');
                    }
                }
            };
            
            xhr.onerror = function() {
                // Hide loading indicator
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                
                // Re-enable generate button
                if (generateButton) {
                    generateButton.disabled = false;
                    generateButton.innerHTML = '<span class="icon">✏️</span> Generate Notes';
                }
                
                console.error('Request failed');
                showErrorMessage('Request failed', 'Please check your connection and try again');
            };
            
            xhr.send(formData);
            return false;
        };
    }

    // Show detailed error message
    function showErrorMessage(title, message, details) {
        console.error(title, message);
        if (details) {
            console.error('Details:', details);
        }
        
        let errorMessage = title;
        if (message) {
            errorMessage += '\n\n' + message;
        }
        
        if (details && details.includes('OpenAI API')) {
            // For OpenAI API errors, add a note about checking the API key
            errorMessage += '\n\nPlease check your OpenAI API key and model settings.';
        }
        
        alert(errorMessage);
    }

    // Settings functions
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('lecturaSettings');
            const settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;
            
            // Apply theme
            applyTheme(settings.theme);
            
            // Set theme toggle
            if (themeToggle) {
                themeToggle.checked = settings.theme === 'dark';
            }
            
            // Set model selector
            if (modelSelector) {
                if (settings.modelType === 'custom') {
                    modelSelector.value = 'custom';
                    if (customModelContainer) {
                        customModelContainer.style.display = 'flex';
                    }
                } else {
                    modelSelector.value = settings.modelType;
                    if (customModelContainer) {
                        customModelContainer.style.display = 'none';
                    }
                }
            }
            
            // Set custom model
            if (customModel) {
                customModel.value = settings.customModel || '';
            }
            
            // Set base URL
            if (baseUrl) {
                baseUrl.value = settings.baseUrl || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            resetSettings();
        }
    }

    function saveSettings() {
        try {
            const isCustomModel = modelSelector.value === 'custom';
            
            // Validate custom model if selected
            if (isCustomModel && !customModel.value.trim()) {
                alert('Please enter a custom model name');
                return;
            }
            
            const settings = {
                theme: themeToggle.checked ? 'dark' : 'light',
                modelType: modelSelector.value,
                customModel: isCustomModel ? customModel.value.trim() : '',
                baseUrl: baseUrl.value.trim()
            };
            
            localStorage.setItem('lecturaSettings', JSON.stringify(settings));
            
            // Apply theme
            applyTheme(settings.theme);
            
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings');
        }
    }

    function resetSettings() {
        try {
            localStorage.setItem('lecturaSettings', JSON.stringify(defaultSettings));
            
            // Apply theme
            applyTheme(defaultSettings.theme);
            
            // Set theme toggle
            if (themeToggle) {
                themeToggle.checked = defaultSettings.theme === 'dark';
            }
            
            // Set model selector
            if (modelSelector) {
                modelSelector.value = defaultSettings.modelType;
            }
            
            // Hide custom model input
            if (customModelContainer) {
                customModelContainer.style.display = 'none';
            }
            
            // Clear custom model
            if (customModel) {
                customModel.value = '';
            }
            
            // Clear base URL
            if (baseUrl) {
                baseUrl.value = '';
            }
            
            alert('Settings reset to defaults');
        } catch (error) {
            console.error('Error resetting settings:', error);
            alert('Failed to reset settings');
        }
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    function getSettings() {
        try {
            const savedSettings = localStorage.getItem('lecturaSettings');
            return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
        } catch (error) {
            console.error('Error getting settings:', error);
            return defaultSettings;
        }
    }
}); 