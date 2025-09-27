'use strict'


/*  == TO-DO SECTION ==
 - TODO:  edit inline
 - TODO:  Completed tasks are hidden from retrieve mode by default (finished). (maybe/optional and very much still debating whether to add or not) toggle to show completed.
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
const taskStats = document.getElementById("taskStats");


// variables
let tasks = []; // where tasks will be stored for now since I will add backend later
let urgencyFilter = `all`; // by default show everything
let difficultyFilter = `all`; // by default show everything
let streamline = true; // focus mode or nah, by default yes
const savedTasks = localStorage.getItem('tasks');
if(savedTasks) tasks = JSON.parse(savedTasks);


// Initialization's special area
renderTasks(); // can be called since normal functions are hoisted

// Helper functions
// function updateTaskStats() {
//     const totalCompleted = tasks.filter(task => task.status).length;
//     taskStats.textContent = `You’ve completed ${totalCompleted} tasks in total.`;
// }
function updateCompletedTasks(){
    // Note to future self: If you're wondering why I didn't use an external variable to store the amount of tasks completed, it's because we're not deleting or removing tasks that are completed so we can simply go through the array and count the amount tasks.status === true, furthermore it's much better since no extra hassle once mag migrate na to using DB.
    const finishedTasks = tasks.filter(tasks => tasks.status).length;
    taskStats.textContent = `You've completed ${finishedTasks} tasks since you first started!`;
}

function renderTasks() {
let tasksToShow = tasks.filter(task => {
        const sameUrgency = (urgencyFilter === `all` || task.urgency === urgencyFilter);
        const sameDifficulty = (difficultyFilter === `all` || task.difficulty === difficultyFilter);
        const notCompleted = !task.status;
        return notCompleted && sameUrgency && sameDifficulty;
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
    updateCompletedTasks();
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

    if (target.matches('.expand-btn')){ taskItem.classList.toggle('expanded'); return;}
    if(target.matches('.complete-checkbox')){
        console.log(`completing task: ${task.name} #${taskID}`);
        task.status = !task.status;
    }else if(target.matches('.edit-btn')){
        // TODO:  edit functionality here
        console.log(`editing task: ${task.name} #${taskID}`);
        
    }else if(target.matches('.delete-btn')){
        // maybe: add a like warning when deleting a task
        if (confirm(`Are you sure you want to delete the task: "${task.name}"?`)) {
            tasks = tasks.filter(t => t.id != taskID);
        }
    }

    saveTasks();
    renderTasks();
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

