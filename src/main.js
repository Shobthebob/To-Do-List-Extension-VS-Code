document.addEventListener('DOMContentLoaded', () => {

  const todoList = document.getElementById('todo-list');
  const newTaskInput = document.getElementById('new-task-input');
  const addTaskButton = document.getElementById('add-task-button');

  function addTask(taskText) {
    const taskItem = document.createElement('li');
    taskItem.innerHTML = `
      <input type="checkbox" class="done-chkbx">
      <span>${taskText}</span>
      <button class="delete-btn">Delete</button>
    `;
    todoList.appendChild(taskItem);
    taskItem.scrollIntoView({ behavior: 'smooth' });
  }

  function deleteTask(taskItem) {
    todoList.removeChild(taskItem);
  }

  function toggleTaskDone(checkbox) {
    const taskSpan = checkbox.nextElementSibling;
    if (checkbox.checked) {
      taskSpan.style.textDecoration = 'line-through';
      taskSpan.style.color = '#777';
    } else {
      taskSpan.style.textDecoration = 'none';
      taskSpan.style.color = '#ccc';
    }
  }

  function handleAddTask() {
    if (newTaskInput.value.trim() !== '') {
      addTask(newTaskInput.value.trim());
      newTaskInput.value = '';
    }
  }

  newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  });

  addTaskButton.addEventListener('click', handleAddTask);

  todoList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      deleteTask(e.target.closest('li'));
    } else if (e.target.type === 'checkbox') {
      toggleTaskDone(e.target);
    }
  });
});
