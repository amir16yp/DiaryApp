// Get DOM elements
const saveButton = document.getElementById('saveEntry');
const diaryEntry = document.getElementById('diaryEntry');
const entriesContainer = document.getElementById('entries');
const themeToggle = document.getElementById('themeToggle');
const toggleIcon = themeToggle.querySelector('.toggle-icon');
const toggleText = themeToggle.querySelector('.toggle-text');

// Text direction detection functions
function detectTextDirection(text) {
    const rtlChars = /[\u0591-\u07FF\u200F\u202B\u202E\uFB1D-\uFDFD\uFE70-\uFEFC]/;
    const devanagariChars = /[\u0900-\u097F]/;
    return rtlChars.test(text) || devanagariChars.test(text) ? 'rtl' : 'ltr';
}

function detectScript(text) {
    if (/[\u0591-\u05F4]/.test(text)) return "'Noto Sans Hebrew', sans-serif";
    if (/[\u0600-\u06FF]/.test(text)) return "'Noto Sans Arabic', sans-serif";
    if (/[\u0900-\u097F]/.test(text)) return "'Noto Sans Devanagari', sans-serif";
    return "'Noto Sans', sans-serif";
}

function setTextDirection(element, text) {
    const direction = detectTextDirection(text);
    element.setAttribute('dir', direction);
    if (direction === 'rtl') {
        element.style.fontFamily = detectScript(text);
    } else {
        element.style.fontFamily = '';
    }
}

// Entry management functions
function addEntryToDOM(entry, index) {
    const entryElement = document.createElement('div');
    entryElement.classList.add('entry');
    entryElement.setAttribute('data-index', index);
    
    const date = new Date(entry.date);
    const formattedDate = new Intl.DateTimeFormat('default', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);

    const entryText = document.createElement('p');
    entryText.textContent = entry.text;
    setTextDirection(entryText, entry.text);

    entryElement.innerHTML = `
        <h3>Entry ${index + 1} - ${formattedDate}</h3>
    `;
    entryElement.appendChild(entryText);
    entryElement.innerHTML += '<button class="delete-button">Delete</button>';
    
    entriesContainer.insertBefore(entryElement, entriesContainer.firstChild);
}

function loadEntries() {
    const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    entriesContainer.innerHTML = '';
    entries.forEach((entry, index) => {
        addEntryToDOM(entry, index);
    });
}

function saveEntry() {
    const text = diaryEntry.value.trim();
    if (text === '') return;

    let entries = [];
    try {
        entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    } catch (e) {
        entries = [];
    }

    const newEntry = { 
        text, 
        date: new Date().toISOString(),
        direction: detectTextDirection(text),
        fontFamily: detectScript(text)
    };

    entries.push(newEntry);
    localStorage.setItem('diaryEntries', JSON.stringify(entries));

    addEntryToDOM(newEntry, entries.length - 1);
    diaryEntry.value = '';
    setTextDirection(diaryEntry, '');
}

function deleteEntry(index) {
    const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
    entries.splice(index, 1);
    localStorage.setItem('diaryEntries', JSON.stringify(entries));
    loadEntries();
}

// Theme management
function setTheme(isDark) {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    toggleIcon.textContent = isDark ? '🌜' : '🌞';
    toggleText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('darkMode', isDark);
}

// Message Box functionality
function showMessageBox(message, onConfirm, onCancel) {
    const overlay = document.getElementById('messageBoxOverlay');
    const text = document.getElementById('messageBoxText');
    const confirmBtn = document.getElementById('messageBoxConfirm');
    const cancelBtn = document.getElementById('messageBoxCancel');

    setTextDirection(text, message);
    text.textContent = message;
    
    overlay.classList.add('active');

    const handleConfirm = () => {
        overlay.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        onConfirm && onConfirm();
    };

    const handleCancel = () => {
        overlay.classList.remove('active');
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        onCancel && onCancel();
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            handleCancel();
        }
    }, { once: true });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    }, { once: true });
}

// Event listeners
saveButton.addEventListener('click', saveEntry);

diaryEntry.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        saveEntry();
    }
});

diaryEntry.addEventListener('input', function() {
    setTextDirection(this, this.value);
});

entriesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-button')) {
        const entryElement = e.target.parentElement;
        const index = parseInt(entryElement.getAttribute('data-index'));
        
        const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        const entry = entries[index];
        const message = entry.direction === 'rtl' ? 'האם אתה בטוח שברצונך למחוק רשומה זו?' : 'Are you sure you want to delete this entry?';
        
        showMessageBox(message, 
            () => {
                entryElement.classList.add('hidden');
                setTimeout(() => {
                    deleteEntry(index);
                }, 300);
            }
        );
    }
});

// Mobile swipe functionality
let touchStartX = 0;
let touchEndX = 0;

entriesContainer.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

entriesContainer.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe(e.target.closest('.entry'));
}, false);

function handleSwipe(entryElement) {
    const swipeLength = touchEndX - touchStartX;
    if (swipeLength < -100 && entryElement) {
        const index = parseInt(entryElement.getAttribute('data-index'));
        
        const entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        const entry = entries[index];
        const message = entry.direction === 'rtl' ? 'האם אתה בטוח שברצונך למחוק רשומה זו?' : 'Are you sure you want to delete this entry?';
        
        showMessageBox(message, 
            () => {
                entryElement.classList.add('hidden');
                setTimeout(() => {
                    deleteEntry(index);
                }, 300);
            }
        );
    }
}

// Theme toggle
themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'light';
    setTheme(isDark);
});

// Initialize
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedTheme = localStorage.getItem('darkMode');
setTheme(savedTheme !== null ? JSON.parse(savedTheme) : prefersDark);

// Load entries when the page loads
window.addEventListener('load', loadEntries);