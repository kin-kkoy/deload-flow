'use strict'

// references to HTML elements
const taskForm = document.getElementById("taskForm")
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const retrieveTaskBtn = document.getElementById("retrieveTaskBtn");
const taskDisplay = document.getElementById("taskDisplay");
const urgencyFilterBtn = document.getElementById("sortUrgency");
const difficultyFilterBtn = document.getElementById("sortDifficulty");


// variables
let tasks = []; // where tasks will be stored for now since I will add backend later
let urgencyFilter = `all`; // by default show everything
let difficultyFilter = `all`; // by default show everything


// Helper functions
function renderTasks() {
    if (tasks.length === 0) {
        taskDisplay.innerHTML = `<p class="no-tasks-message">No tasks yet. Add one above!</p>`;
        return;
    }

    const tasksToShow = tasks.filter(task => {
        const sameUrgency = (urgencyFilter === `all` || task.urgency === urgencyFilter);
        const sameDifficulty = (difficultyFilter === `all` || task.difficulty === difficultyFilter);
        return sameUrgency && sameDifficulty;
    });

    const tasksHTML = tasksToShow.map(task => {
        // >> I'll let AI do this part since it's the html stuff but beautified, my code was too plain and no design lol
    
        // Format the deadline for display
        const deadlineString = (task.deadlineDate || task.deadlineTime) 
            ? `<strong>Deadline:</strong> ${task.deadlineDate} ${task.deadlineTime}` 
            : 'No deadline set';

            return `
                <div class="task-item">
                    <div class="task-header">
                        <div class="task-summary">
                            <span class="task-name">${task.name}</span>
                            <div class="task-categories">
                                <span class="category urgency-${task.urgency}">${task.urgency}</span>
                                <span class="category difficulty-${task.difficulty}">${task.difficulty}</span>
                            </div>
                        </div>
                        <button class="expand-btn">❯</button>
                    </div>
                    <div class="task-details">
                        <p>${deadlineString}</p>
                        <!-- A description could be added here in the future -->
                    </div>
                </div>
            `;
    }).join('');

    taskDisplay.innerHTML = tasksHTML;
}


// Event listeners and the logic parts
// task contents submission
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const elements = e.target.elements;
    const task = {
        name: elements.taskName.value,
        urgency: elements.urgency.value,
        difficulty: elements.difficulty.value,
        deadlineDate: elements.deadlineDate.value,
        deadlineTime: elements.deadlineTime.value,
    }

    if(!task.name || !task.urgency || !task.difficulty){ // i think deadline isn't really that needed
        alert(`Please input fields on name, urgency, and difficulty`);
        taskInput.value = "";
        return;
    }
    
    console.log(task);
    tasks.push(task)
    e.target.reset();
});

retrieveTaskBtn.addEventListener("click", () => {
    renderTasks();
});

// event listener to expand task once the arrow button is pressed
taskDisplay.addEventListener('click', function(e) {
    // Made AI do this since not that familiar with "expanding" elements yet
    const expandBtn = e.target.closest('.expand-btn');
    if (expandBtn) {
        const taskItem = expandBtn.closest('.task-item');
        taskItem.classList.toggle('expanded');
    }
});

// filters
urgencyFilterBtn.addEventListener('change', (e) => urgencyFilter = e.target.value);
difficultyFilterBtn.addEventListener('change', (e) => difficultyFilter = e.target.value);