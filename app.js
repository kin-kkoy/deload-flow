'use strict'


/*  == TO-DO SECTION ==
 - TODO:  Mark complete, edit inline, delete.
    - TODO:  Mark complete
        - Remove from array and then save and then increment finishedTasks
 - TODO:  Completed tasks are hidden from retrieve mode by default (toggle to show completed, optional maybe).
*/


// references to HTML elements
const taskForm = document.getElementById("taskForm")
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const retrieveTaskBtn = document.getElementById("retrieveTaskBtn");
const taskDisplay = document.getElementById("taskDisplay");
const urgencyFilterBtn = document.getElementById("sortUrgency");
const difficultyFilterBtn = document.getElementById("sortDifficulty");
const streamlineMode = document.getElementById("streamlineMode");


// variables
let tasks = []; // where tasks will be stored for now since I will add backend later
let urgencyFilter = `all`; // by default show everything
let difficultyFilter = `all`; // by default show everything
let streamline = true; // focus mode or nah, by default yes
let finishedTasks = 0; // could be stored in DB later. Somewhat of a decoration, just to feel good about the amount of tasks completed for the whole usage.
const savedTasks = localStorage.getItem('tasks');
if(savedTasks) tasks = JSON.parse(savedTasks);


// Initialization's special area
renderTasks(); // can be called since normal functions are hoisted

// Helper functions
function renderTasks() {
let tasksToShow = tasks.filter(task => {
        const sameUrgency = (urgencyFilter === `all` || task.urgency === urgencyFilter);
        const sameDifficulty = (difficultyFilter === `all` || task.difficulty === difficultyFilter);
        return sameUrgency && sameDifficulty;
    });

    console.log(`tasks to render: ${tasksToShow.length}`);

    // checking if it's empty or not will be done after filtering since the filter dropdown already has a value by default
    if (tasks.length === 0) {
        taskDisplay.innerHTML = `<p class="no-tasks-message">No tasks yet. Add one above!</p>`;
        return;
    }

    if(streamline && tasksToShow.length > 0){ tasksToShow = tasksToShow.slice(0, 1); } // show only the first element
    
    const tasksHTML = tasksToShow.map(task => {
        // >> I'll let AI do this part since it's the html stuff but beautified, my code was too plain and no design lol
    
        // Format the deadline for display
        const deadlineString = (task.deadlineDate || task.deadlineTime) 
            ? `<strong>Deadline:</strong> ${task.deadlineDate} ${task.deadlineTime}` 
            : 'No deadline set';

        return `
            <div class="task-item ${task.status ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <div class="complete-group">
                        <input type="checkbox" class="complete-checkbox" id="complete-${task.id}" ${task.status ? 'checked' : ''}>
                        <label for="complete-${task.id}" class="hidden-label">Finished</label>
                    </div>
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
                    <div class="task-actions">
                        <div class="action-buttons">
                            <button class="task-action-btn edit-btn" title="Edit Task">✏️</button>
                            <button class="task-action-btn delete-btn" title="Delete Task">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join(''); // one big string instead of looping twice just to display

    taskDisplay.innerHTML = tasksHTML;
}

function saveTasks(){ localStorage.setItem('tasks', JSON.stringify(tasks)); }

// Event listeners and the logic parts
// task contents submission
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const elements = e.target.elements;
    const task = {
        id: Date.now(), // Add a unique ID
        name: elements.taskName.value,
        urgency: elements.urgency.value,
        difficulty: elements.difficulty.value,
        deadlineDate: elements.deadlineDate.value,
        deadlineTime: elements.deadlineTime.value,
        status: false, // completed or not
    }

    if(!task.name || !task.urgency || !task.difficulty){ // i think deadline isn't really that needed
        alert(`Please input fields on name, urgency, and difficulty`);
        taskInput.value = "";
        return;
    }
    
    console.log(task);
    tasks.push(task);
    saveTasks(); // === check this later in the future, might be kinds inefficient 
    e.target.reset();
});

retrieveTaskBtn.addEventListener("click", () => renderTasks());

// event listener to expand task once the arrow button is pressed
taskDisplay.addEventListener('click', function(e) {
    // Made AI do this since not that familiar with "expanding" elements yet and it's more of a design feature. I've tweaked it a bit though since this is the general handler for each task's event
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if(!taskItem) return;

    const taskID = taskItem.dataset.id;
    const task = tasks.find(task => task.id == taskID); // not strict == since taskID is a string

    if (target.matches('.expand-btn')) taskItem.classList.toggle('expanded');
    else if(target.matches('.complete-checkbox')){
        console.log(`completing task: ${task.name} #${taskID}`);
        task.status = !task.status;
        saveTasks();
        renderTasks();
    }else if(target.matches('.edit-btn')){
        // TODO:  edit functionality here
        console.log(`editing task: ${taskItem.name} #${taskID}`);
        
    }else if(target.matches('.delete-btn')){
        // TODO:  delete functionality here
        console.log(`deleting task: ${taskItem.name} #${taskID}`);

    }
});

// filters
urgencyFilterBtn.addEventListener('change', (e) => {
    urgencyFilter = e.target.value;
    renderTasks();
});
difficultyFilterBtn.addEventListener('change', (e) => {
    difficultyFilter = e.target.value
    renderTasks();
});

streamlineMode.addEventListener('change', (e) => {
    streamline = e.target.checked;
    renderTasks();
});

