# Deload Flow - Task Management App

A simple but powerful task management application to help you deload your mind and focus on what's important.

## Features

- **Create & Manage Tasks**: Add tasks with names, urgency, difficulty, and optional deadlines.
- **Persistent Storage**: Your tasks are automatically saved in your browser's local storage.
- **Dynamic Task Display**: View your tasks in a clean, organized list.
- **Filtering System**: Easily filter tasks by their urgency or difficulty.
- **Streamline Mode**: A focus mode to show only the most immediate task.
- **Task Lifecycle**: Mark tasks as complete, edit their names, or delete them.
- **Auto-Urgency Calculation**: Let the app automatically adjust a task's urgency based on its deadline.
- **Task Statistics**: Keep track of your productivity with a completed task counter.


## Getting Started

### Prerequisites
- Node.js installed on your system
- Database configured in the backend (see backend `.env` file)

### Running the Application

#### Backend (API Server)
```bash
cd deload-flow-backend
npm install
npm run dev
```
The backend will run on `http://localhost:3000`

#### Frontend (Task Manager Interface)
```bash
cd Deload-Flow
npm install
npm start
```
The frontend will run on `http://localhost:5500`

### Usage
1. Start the backend server first
2. Start the frontend server
3. Open your browser to `http://localhost:5500`
4. Create an account or login to sync your tasks to the database
5. Without authentication, tasks will be saved locally in your browser

## Fixing CUD Operations (Create, Update, Delete)

If you're experiencing issues where tasks aren't persisting to the database, here's how to fix the frontend-backend communication:

### Problem
The frontend was only updating local storage without calling the backend API for Create, Update, and Delete operations.

### Solution

#### 1. Add Missing API Methods
Add these methods to your `api` object in `app.js`:

```javascript
const api = {
    // ...existing methods...
    
    async addTask(task) {
        return apiFetch("/todo", {
            method: "POST",
            body: JSON.stringify(task),
        });
    },
    
    async updateTask(id, updates) {
        return apiFetch(`/todo/${id}`, {
            method: "PUT", 
            body: JSON.stringify(updates),
        });
    },
    
    async deleteTask(id) {
        return apiFetch(`/todo/${id}`, {
            method: "DELETE",
        });
    },
};
```

#### 2. Update Task Creation
Replace the task form submission handler to call the backend:

```javascript
taskForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const { taskName, urgency, difficulty, deadlineDate, deadlineTime, autoUrgencyToggle } = e.target.elements;
    const newTask = {
        name: (taskName?.value || "").trim(),
        urgency: urgency?.value || "later",
        difficulty: difficulty?.value || "Easy",
        deadlineDate: deadlineDate?.value || "",
        deadlineTime: deadlineTime?.value || "",
        autoUrgency: Boolean(autoUrgencyToggle?.checked),
        scope: "small",
    };

    if (!newTask.name || !newTask.urgency || !newTask.difficulty) {
        alert("Please input fields on name, urgency, and difficulty");
        return;
    }

    try {
        if (state.token) {
            await api.addTask(newTask);
            await refreshTasksFromBackend();
        } else {
            // Fallback to local storage
            const localTask = {
                ...newTask,
                id: cryptoId(),
                dateCreated: new Date().toISOString(),
                status: false,
            };
            state.tasks.push(localTask);
            saveTasks();
            renderTasks();
        }
        e.target.reset();
    } catch (error) {
        console.error("Failed to add task:", error);
        alert("Failed to add task. Please try again.");
    }
});
```

#### 3. Update Task Operations
Replace the task display click handler to include backend calls:

```javascript
taskDisplay?.addEventListener("click", async function (e) {
    const target = e.target;
    const taskItem = target.closest(".task-item");
    if (!taskItem) return;

    const taskID = taskItem.dataset.id;
    const task = state.tasks.find((t) => String(t.id) === String(taskID));
    if (!task) return;

    try {
        if (target.matches(".complete-checkbox")) {
            const newStatus = !task.status;
            
            if (state.token) {
                await api.updateTask(taskID, { completed: newStatus });
                await refreshTasksFromBackend();
            } else {
                task.status = newStatus;
                saveTasks();
                renderTasks();
            }
        } 
        else if (target.matches(".delete-btn")) {
            if (confirm(`Are you sure you want to delete the task: "${task.name}"?`)) {
                if (state.token) {
                    await api.deleteTask(taskID);
                    await refreshTasksFromBackend();
                } else {
                    state.tasks = state.tasks.filter((t) => String(t.id) !== String(taskID));
                    saveTasks();
                    renderTasks();
                }
            }
        }
    } catch (error) {
        console.error("Task operation failed:", error);
        alert("Operation failed. Please try again.");
    }
});
```

#### 4. Add Helper Function
Add this function to refresh tasks from the backend:

```javascript
async function refreshTasksFromBackend() {
    try {
        const data = await api.getTasks();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        state.tasks = list.map((t) => ({
            id: t.id ?? cryptoId(),
            name: t.name ?? "Untitled",
            urgency: t.urgency ?? "later",
            difficulty: t.difficulty ?? "Easy",
            deadlineDate: t.deadlineDate ?? "",
            deadlineTime: t.deadlineTime ?? "",
            status: Boolean(t.completed ?? t.status),
            autoUrgency: Boolean(t.autoUrgency),
            scope: t.scope ?? "small",
            dateCreated: t.dateCreated ?? new Date().toISOString(),
        }));
        renderTasks();
    } catch (error) {
        console.error("Failed to refresh tasks:", error);
    }
}
```

### Key Changes
- Added backend API calls for create, update, and delete operations
- Added error handling for failed API calls
- Maintained fallback to local storage when not authenticated
- Added task refresh after successful backend operations

## To-Do
TBD: To be decided

- Add "?" information functionality to explain autoUrgency
- Edit functionality = includes editing of urgency (if not autoUrgent) and deadline
- Implement a "scope" property (small, medium, big) to influence the auto-urgency calculation; small = standard calculation, medium = slightly bigger time frame calculation, big = large time frame calculation.
- (TBD) Add a description field for tasks to allow for more detailed notes.
- (TBD cause I still see no point) Add a toggle to show/hide completed tasks from the main view.
------ Bigger Plans ------
- React from time to time