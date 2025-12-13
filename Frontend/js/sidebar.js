// js/sidebar.js

function initSidebar(sidebarId, hamburgerId, contentUrl) {
    const sidebarElement = document.getElementById(sidebarId);
    const hamburgerBtn = document.getElementById(hamburgerId);

    if (!sidebarElement) {
        console.warn(`Sidebar element with ID "${sidebarId}" not found. Skipping initialization.`);
        return;
    }
    
    // 1. טעינת התוכן (כולל חילוץ מתוך <template>)
    async function loadSidebarContent() {
        try {
            const response = await fetch(contentUrl); 
            if (response.ok) {
                const htmlContent = await response.text();
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;
                const template = tempDiv.querySelector('#main-sidebar-template');

                if (template) {
                    const content = template.content.cloneNode(true); 
                    sidebarElement.appendChild(content); 
                } else {
                    sidebarElement.innerHTML = htmlContent;
                }
            } else {
                console.error(`Failed to load sidebar content from ${contentUrl}: ${response.status}`);
            }
        } catch (error) {
            console.error('Error fetching sidebar content:', error);
        }
    }
    
    // 2. חיבור אירוע ההמבורגר (פתיחה/סגירה)
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            sidebarElement.classList.toggle('open');
        });
    }

    // הפעלה אוטומטית של טעינת התוכן
    loadSidebarContent();
}

// הפעלת הסרגל באמצעות ה-IDs המקוריים שמוגדרים ב-task.html (או כל דף אחר)
document.addEventListener("DOMContentLoaded", () => {
    initSidebar('task-sidebar', 'hamburger-btn', 'sidebar.html');
});