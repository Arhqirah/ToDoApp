document.addEventListener('DOMContentLoaded', () => {
    generateCalendar(new Date());
    loadTasks();
    setupEventListeners();
    setupSearch();
    setupCategoryFilter();
    enableDragAndDrop();

    const prevWeekButton = document.getElementById('prev-week');
    const nextWeekButton = document.getElementById('next-week');
    prevWeekButton.addEventListener('click', () => changeWeek(-1));
    nextWeekButton.addEventListener('click', () => changeWeek(1));
});


function generateCalendar(startDate) {
    if (!startDate) {
        startDate = new Date();
    }
    currentStartDate = new Date(startDate);

    const daysElement = document.getElementById("days");
    daysElement.innerHTML = "";
    let currentDate = new Date(startDate);
    // Juster startdatoen til ugens første dag (søndag i USA, mandag i de fleste europæiske lande)
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());

    // Dansk datovisningsformat for dagene
    const danskDatoFormat = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };

    for (let i = 0; i < 7; i++) {
        const dayElement = document.createElement("div");
        dayElement.className = "day";
        dayElement.setAttribute('data-date', currentDate.toISOString().split('T')[0]);

        // Brug det danske format her
        const dateElement = document.createElement("div");
        dateElement.textContent = currentDate.toLocaleDateString('da-DK', danskDatoFormat);
        dayElement.appendChild(dateElement);

        daysElement.appendChild(dayElement);
        currentDate.setDate(currentDate.getDate() + 1); // Gå til næste dag
    }
    updateWeekInfo(currentStartDate);
    highlightCurrentDay();

    enableDragAndDrop();
}

function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return weekNo;
}


function updateWeekInfo(date) {
    const weekInfoElement = document.getElementById("month-week-info");
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    const monthName = date.toLocaleString('da-DK', { month: 'long' });
    weekInfoElement.textContent = `${monthName} Uge ${weekNumber}, ${year}`;
}

function changeWeek(offset) {
    currentStartDate.setDate(currentStartDate.getDate() + offset * 7);
    generateCalendar(currentStartDate);
    loadTasks();
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => {
        addTaskToCalendar(task);
    });
}



function addTaskToCalendar(task) {
    const dayElement = document.querySelector(`.day[data-date="${task.date}"]`);
    if (dayElement) {
        const taskElement = document.createElement("div");
        taskElement.className = "task";
        taskElement.textContent = task.text;
        taskElement.id = `task-${task.id}`;
        taskElement.className = `task ${task.category}`;
        taskElement.setAttribute('draggable', true);
        taskElement.addEventListener('dragstart', handleDragStart);

        const completeButton = document.createElement("button");
        completeButton.textContent = "✓";
        completeButton.className = "complete-button";
        completeButton.onclick = () => markTaskAsComplete(task.id, taskElement);

        taskElement.appendChild(completeButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "X";
        deleteButton.className = "delete-button";
        deleteButton.onclick = () => deleteTask(task.id);
        taskElement.appendChild(deleteButton);

        if (task.note) {
            const noteElement = document.createElement("div");
            noteElement.className = "task-note";
            noteElement.textContent = task.note;
            taskElement.appendChild(noteElement);
        }

        dayElement.appendChild(taskElement);
        enableDragAndDrop();
    }
}

function markTaskAsComplete(taskId, taskElement) {

    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task => task.id === taskId);

    if (taskIndex > -1) {

        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        localStorage.setItem('tasks', JSON.stringify(tasks));

        if (tasks[taskIndex].completed) {
            taskElement.classList.add('completed');
        } else {
            taskElement.classList.remove('completed');
        }
    }
}


function setupEventListeners() {
    const newTaskForm = document.getElementById('new-task-form');
    newTaskForm.addEventListener('submit', handleNewTaskSubmit);
}

function handleNewTaskSubmit(event) {
    event.preventDefault();
    const newTaskInput = document.getElementById('new-task');
    const taskDateInput = document.getElementById('task-date');
    const taskNoteInput = document.getElementById('task-note');
    const taskText = newTaskInput.value.trim();
    const taskDate = taskDateInput.value;
    const taskNote = taskNoteInput.value.trim();
    const taskCategory = document.getElementById('task-category').value;

    if (taskText && taskDate) {
        const task = { text: taskText, date: taskDate, category: taskCategory, note: taskNote };
        addTask(task);
        newTaskInput.value = '';
        taskDateInput.value = '';
        taskNoteInput.value = '';
    }
}


function addTask(task) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    task.id = new Date().getTime();
    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    addTaskToCalendar(task);
}

function updateTask(taskId, newDetails) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if(taskIndex > -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...newDetails };
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
}

function deleteTask(taskId) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(tasks));


    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
        taskElement.remove();
    }
}
function highlightCurrentDay() {
    const today = new Date().toISOString().split('T')[0];
    const currentDayElement = document.querySelector(`.day[data-date="${today}"]`);

    if (currentDayElement) {
        currentDayElement.classList.add('glow');
    }
}

generateCalendar();
highlightCurrentDay();

function enableDragAndDrop() {
    const days = document.querySelectorAll('.day');
    days.forEach(day => {
        day.addEventListener('dragover', handleDragOver);
        day.addEventListener('drop', handleDrop);
    });
}


function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const droppedElement = document.getElementById(data);
    const dropZone = e.target;
    dropZone.appendChild(droppedElement);

}

function setupSearch() {
    const searchInput = document.getElementById('task-search');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const tasks = document.querySelectorAll('.task');
    tasks.forEach(task => {
        const taskText = task.textContent.toLowerCase();
        task.style.display = taskText.includes(searchTerm) ? '' : 'none';
    });
}

function setupCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }
}

function handleCategoryFilter(e) {
    const selectedCategory = e.target.value;
    const tasks = document.querySelectorAll('.task');
    tasks.forEach(task => {
        if (selectedCategory === 'all' || task.classList.contains(selectedCategory)) {
            task.style.display = '';
        } else {
            task.style.display = 'none';
        }
    });
    function handleNewTaskSubmit(event) {
        event.preventDefault();
        const newTaskInput = document.getElementById('new-task');
        const taskDateInput = document.getElementById('task-date');
        const taskNoteInput = document.getElementById('task-note');
        const taskText = newTaskInput.value.trim();
        const taskDate = taskDateInput.value;
        const taskNote = taskNoteInput.value.trim();
        const taskCategory = document.getElementById('task-category').value;

        if (taskText && taskDate) {
            const task = { text: taskText, date: taskDate, category: taskCategory, note: taskNote };
            addTask(task);
            newTaskInput.value = '';
            taskDateInput.value = '';
            taskNoteInput.value = ''; // Nulstil note inputfeltet
        }
    }
}
