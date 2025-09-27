'use strict'


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


// Helper functions / core logic
function getDaysLeft(task) {
    if (!task.deadlineDate) return null; // no deadline
    const deadline = new Date(`${task.deadlineDate}T${task.deadlineTime || "23:59"}`);
    if(isNaN(deadline)) return null;
    return (deadline - Date.now()) / 86400000; // `86400000` = milliseconds in a day
} 

function getDisplayUrgency(task) {
    if (task.autoUrgency && !task.status) {
        return dynamicUrgency(task); // fresh calculation
    }
    return task.urgency; // fallback to manual urgency
}

function dynamicUrgency(task){
    const dayGap = getDaysLeft(task);
    if (dayGap === null) return task.urgency; // fallback if no deadline tho kinda since that's the point of autoUrgency

    const {scope} = task;
    const urgentGap = 1, soonGap = 5; // 0-1 = urgent, 2-5 = soon, 5+ = later

    let multiplier = 1;
    if(scope === `medium`) multiplier = 2;
    if(scope === `big`) multiplier = 3;

    // these multiple returns feels wierd thanks to maam P lol.
    if(dayGap < 0 || dayGap <= urgentGap * multiplier) return "urgent"; // first part = negative value meaning overdue. overdue = urgent
    if(dayGap > (urgentGap * multiplier) && dayGap <= (soonGap * multiplier)) return `soon`;
    return `later`;
}

const saveTasks = () => localStorage.setItem('tasks', JSON.stringify(tasks));

function saveEdit(taskID, title){
    // if the title has whitespaces before/after then remove. Furthermore if the task's title/name is empty then do not allow
    if(!title.trim()){
        renderTasks(); // just show the tasks as if not editing/edited
        return;
    }

    const task = tasks.find(task => task.id == taskID);
    if(!task) return;

    task.name = title;
    saveTasks();
    renderTasks();
}

function updateCompletedTasks(){
    // Note to future self: If you're wondering why I didn't use an external variable to store the amount of tasks completed, it's because we're not deleting or removing tasks that are completed so we can simply go through the array and count the amount tasks.status === true, furthermore it's much better since no extra hassle once mag migrate na to using DB.
    const finishedTasks = tasks.filter(tasks => tasks.status).length;
    taskStats.textContent = `You've completed ${finishedTasks} tasks since you first started!`;
}

function renderTasks() {
    // checking if it's empty or not will be done after filtering since the filter dropdown already has a value by default
    if (tasks.length === 0) {
        taskDisplay.innerHTML = `<p class="no-tasks-message">No tasks yet. Add one above!</p>`;
        return;
    }

    let tasksToShow = tasks.filter(task => {
        // compute urgency for filtering
        const urgency = getDisplayUrgency(task);
        const sameUrgency = (urgencyFilter === `all` || urgency === urgencyFilter);
        const sameDifficulty = (difficultyFilter === `all` || task.difficulty === difficultyFilter);
        const notCompleted = !task.status;
        return notCompleted && sameUrgency && sameDifficulty;
    });

    console.log(`tasks to render: ${tasksToShow.length}`);

    if(streamline && tasksToShow.length > 0) tasksToShow = tasksToShow.slice(0, 1); // show only the first element
    
    const tasksHTML = tasksToShow.map(task => {
        // >> I'll let AI do this part since it's the html stuff but beautified, my code was too plain and no design lol

        const urgency = getDisplayUrgency(task); // live urgency value
        const daysLeft = getDaysLeft(task);

        const deadlineString = (task.deadlineDate || task.deadlineTime) 
            ? `<strong>Due ${(daysLeft >= 1) ? `in ${Math.floor(daysLeft)} days` : `Today`}!</strong>` 
            : `Take your time, there's no deadline for this.`;

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
                            <span class="category urgency-${urgency}">${urgency}</span>
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

const editTask = function(task){
    // Changing the task name to an input field
    const nameElem = task.querySelector(".task-name");
    const taskID = task.dataset.id;
    const currentNameText = nameElem.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = currentNameText;
    input.classList.add("edit-input");
    nameElem.textContent = "";
    nameElem.appendChild(input);
    input.focus(); // set focus to the title so user can type at title immediately

    // Event listeners which are used when user is done editing
    input.addEventListener("blur", () => saveEdit(taskID, input.value)); // `blur` is like when the element has lost focus na via clicking somewhere else or change tab or the like
    input.addEventListener("keydown", (e) => {
        if(e.key === "Enter") saveEdit(taskID, input.value);
        if(e.key === "Escape") saveEdit(taskID, currentNameText); // as is or revert back.
    });
};

// Event listeners and the logic parts
// task contents submission
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const {taskName, urgency, difficulty, deadlineDate, deadlineTime, autoUrgencyToggle} = e.target.elements;
    const task = {
        id: Date.now(), // "unique" ID. Temporary, maybe
        dateCreated: Date.now(),
        name: taskName.value,
        urgency: urgency.value,
        difficulty: difficulty.value,
        deadlineDate: deadlineDate.value,
        deadlineTime: deadlineTime.value,
        status: false, // completed or not
        autoUrgency: autoUrgencyToggle.checked,
        scope: `small`, // TODO:  Complete this functionality, (small, medium, big) if scope is big then dynamicUrgency changes
    }

    if(!task.name || !task.urgency || !task.difficulty){ // i think deadline isn't really that needed
        alert(`Please input fields on name, urgency, and difficulty`);
        taskInput.value = "";
        return;
    }
    
    tasks.push(task);
    saveTasks(); // === check this later in the future, might be kinds inefficient 
    renderTasks();
    e.target.reset();
});

retrieveTaskBtn.addEventListener("click", () => renderTasks());

// event listener to expand task once the arrow button is pressed
taskDisplay.addEventListener('click', function(e) {
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if(!taskItem) return;

    // temporary solution to stop rendering/saving when not changing a task's property/ies
    let taskChange = false;

    const taskID = taskItem.dataset.id;
    const task = tasks.find(task => task.id == taskID); // not strict `==` since taskID is a string

    // Made AI do the "expanding" since I'm not that familiar with that yet and it's more of a design feature.
    if (target.matches('.expand-btn')) taskItem.classList.toggle('expanded')
    else if(target.matches('.complete-checkbox')){
        taskChange = true;
        task.status = !task.status;
    }else if(target.matches('.edit-btn')) editTask(taskItem);
    else if(target.matches('.delete-btn')){
        // this is the confirmation prompt thing, neat feature
        if (confirm(`Are you sure you want to delete the task: "${task.name}"?`)) {
            taskChange = true;
            tasks = tasks.filter(t => t.id != taskID);
        }
    }

    if(taskChange){
        taskChange = false;
        saveTasks();
        renderTasks();
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

