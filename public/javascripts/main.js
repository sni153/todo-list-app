class Model {
  constructor() { }

  // CREATE TODO
  async addTodo(todoInfo) {
    try {
      let init = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: todoInfo,
      }
      let response = await fetch('/api/todos/', init)
      if (response.ok) {
        this.onTodoListChangedAdd();
      } else {
        alert(`Could not add todo due to: ${response.statusText}`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // READ
  async getTodos() {
    try {
      let response = await fetch('/api/todos');
      if (response.ok) {
        let todos = await response.json();
        this.addDueDate(todos);
        return todos;
      } else {
        alert('An error occurred while attempting to retrieve all todos.')
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  // Helper function - adds due_date property to each todo
  addDueDate(todos) {
    todos.forEach(todo => {
      let { month, year } = todo;
      if (!month || !year) {
        todo.due_date = 'No Due Date';
      } else {
        year = year.slice(2);
        todo.due_date = `${month}/${year}`;
      }
    })
  }

  // READ 
  async getTodo(id) {
    try {
      let response = await fetch(`/api/todos/${id}`);
      if (response.ok) {
        let todo = await response.json();
        return todo;
      } else {
        alert(`An error occurred while attempting to retrieve todo ${id}.`)
      }
    }
    catch (error) {
      console.log(error);
    }
  }

   async getTodosByTime(time) {
    let todos = await this.getTodos();
    return todos.filter(todo => {
      return todo.due_date === time;
    })
  }

  // FILTER BY DATE
  async getTodosByDate(month, year) {
    let todos = await this.getTodos();
    return todos.filter(todo => {
      return todo.month === month && todo.year.slice(2) === year;
    })
  }

  // UPDATE
  async editTodo(id, todoInfo) {
    try {
      let init = {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: todoInfo,
      }
      let response = await fetch(`/api/todos/${id}`, init);
      if (response.ok) {
        this.onTodoListChanged();
      } else {
        alert(`There was an error with your request to edit todo ${id}.`)
      }
    } catch (error) {
      console.log(error);
    }
  }

  // DELETE
  async deleteTodo(id) {
    try {
      let init = {
        method: 'DELETE',
        body: id,
      }
      let response = await fetch(`/api/todos/${id}`, init);
      if (response.ok) {
        this.onTodoListChanged();
      } else {
        alert(`There was an error with your request to delete todo ${id}`)
      }
    } catch (error) {
      console.log(error);
    }
  }

  bindTodoListChanged(callback) {
    this.onTodoListChanged = callback;
  }

  bindTodoListChangedAdd(callback) {
    this.onTodoListChangedAdd = callback;
  }
}

class View {
  constructor() {
    // DOM Elements
    this.body = document.querySelector('body');
    this.id;
    this.title;
    this.dataTitle;
    this.dataTotal;
    this.time;

    // Handlebars
    this.templates = this.createTemplates();
    this.registerPartialsAndHelpers();
  }
  createTemplates() {
    const templates = {};
    document.querySelectorAll("script[type='text/x-handlebars']").forEach(tmpl => {
      templates[tmpl["id"]] = Handlebars.compile(tmpl["innerHTML"]);
    });
    return templates;
  }
  registerPartialsAndHelpers() {
    let partials = document.querySelectorAll("[data-type=partial]")
    partials.forEach(tmpl => {
      Handlebars.registerPartial(tmpl["id"], tmpl["innerHTML"]);
    });
  }

  displayTodos(todos, selectedTodos = this.sortTodosByCompletion(todos.slice()), title, data) {
    // let defaultTodos = this.sortTodosByCompletion(todos.slice());
    let todosSortedByDate = this.sortTodosByDueDate(todos.slice());
    let doneTodos = this.getDoneTodos(todos.slice());
    let doneTodosBySortedByDate = this.sortTodosByDueDate(doneTodos.slice());
    console.log('displayTodos', todos)

    this.body.innerHTML = this.templates.main_template({
      todos: todos,  // All Todos Count
      done: doneTodos,   // Completed Count
      selected: selectedTodos,
      todos_by_date: this.convertTodosToObj(todosSortedByDate),
      done_todos_by_date: this.convertTodosToObj(doneTodosBySortedByDate),
      current_section: {title: title, data: data }
    });
    // debugger
    View.prototype.sidebar = document.querySelector('#sidebar');
    View.prototype.newTodo = document.querySelector("label[for=new_item]")
    View.prototype.modalLayer = document.querySelector('#modal_layer');
    View.prototype.formModal = document.querySelector('#form_modal');
    View.prototype.form = document.querySelector('form');
    View.prototype.formTitle = document.querySelector('#form_title');
    View.prototype.title = document.querySelector('#title');
    View.prototype.$day = $('#day');
    View.prototype.$month = $('#month');
    View.prototype.$year = $('#year');
    View.prototype.description = document.querySelector('#description');
    View.prototype.completeButton = document.querySelector('button[name="complete"]');
    View.prototype.time = document.querySelector('#items header dl dt time').textContent;
  }

  convertTodosToObj(todos) {
    let obj = {};
    todos.forEach(todo => {
      if (!obj[todo.due_date]) {
        obj[todo.due_date] = [todo];
      } else {
        obj[todo.due_date].push(todo);
      }
    })
    return obj;
  }

  getDoneTodos(todos) {
    return todos.filter(todo => todo.completed);
  }

  sortTodosByDueDate(todos) {
    return todos.sort((a, b) => a.year - b.year);
  }

  sortTodosByCompletion(todos) {
    return todos.sort((a, b) => a.completed - b.completed);
  }

  showModal() {
    this.modalLayer.style.display = 'block';
    this.formModal.style.display = 'block';
  }

  closeModal() {
    this.modalLayer.style.display = 'none';
    this.formModal.style.display = 'none';
    this.form.reset();
  }

  populateModal(todo) {
    this.formTitle.textContent = 'Edit Todo';
    let { title, day, month, year, description } = todo;
    this.title.value = title;
    this.$day.val(`${day}`);
    this.$month.val(`${month}`);
    this.$year.val(`${year}`);
    this.description.value = description;
  }

  bindAdd(handler) {
    document.addEventListener('click', event => {
      let plusSign = document.querySelector('img[alt="Add Todo Item"]');
      if (plusSign === event.target || event.target.textContent === 'Add new to do') {
        this.time = this.dataTitle;
        this.dataTitle = document.querySelector('#items header dl dt time').textContent;
        this.dataTotal = document.querySelector('#items header dl dd').textContent;
        handler();
        this.showModal();
      } else if (!event.target.closest("#form_modal")) {
        this.closeModal();
      }
    })
  }

  bindEdit(handler) {
    document.addEventListener('click', event => {
      if (event.target.classList.contains('edit')) {
        let label = event.target.textContent;
        let dueDate = label.split('- ')[1];
        this.time = dueDate;
        this.id = Number(event.target.closest('tr').dataset.id);
        handler(this.id);
      }
    })
  }

  bindCheckBox(handler) {
    document.addEventListener('click', event => {
      if (event.target.classList.contains('check') || event.target.children[0].getAttribute('type') === 'checkbox') {
        this.id = Number(event.target.closest('tr').dataset.id);
        handler(this.id);
      }
    })
  }

  bindCompleteButton(handler) {
    document.addEventListener('click', event => {
      let formTitle = document.querySelector('#form_title').textContent;
      if (formTitle === 'Edit Todo' && event.target === this.completeButton) {
        handler(this.id)
      } else if (formTitle === 'Add Todo' && event.target === this.completeButton) {
        alert('Cannot mark as complete as item has not been created yet!');
      }
    })
  }

  bindSubmit(handler) {
    document.addEventListener('submit', event => {
      event.preventDefault();
      handler(this.id);
    })
  }

  bindDelete(handler) {
    document.addEventListener('click', event => {
      // debugger
      if (event.target.classList.contains('delete') || event.target.getAttribute('src') === 'images/trash.png') {
        this.dataTitle = document.querySelector('#sidebar header dl dt').textContent;
        this.time = document.querySelector('#sidebar header dl dt').textContent;
        this.dataTotal = document.querySelector('#sidebar header dl dd').textContent;
        let id = event.target.closest('tr').dataset.id;
        handler(id);
      }
    })
  }

  bindMonths(monthsHandler) {
    document.addEventListener('click', event => {
      try {
        if (event.target.hasAttribute('data-title') ||
          event.target.parentElement.parentElement.hasAttribute('data-title')) {
          let title = event.target.getAttribute('data-title') || event.target.parentElement.parentElement.getAttribute('data-title');
          let data = event.target.getAttribute('data-total') || event.target.parentElement.parentElement.getAttribute('data-total');
          this.dataTitle = title;
          this.dataTotal = data;
          let month;
          let year;
          if (title === 'No Due Date') {
            month = "";
            year = "";
            monthsHandler(month, year, title, data);
          }
          // See if the title has date in the format of MM/YY 
          else if (title.match(/^\d{2}\/\d{2}$/)) {
            let dates = title.split('/');
            month = dates[0];
            year = dates[1];
            monthsHandler(month, year, title, data);
          }
        }
      } catch(error) {}
    })
  }

  bindAllTodos(allTodosHandler) {
    document.addEventListener('click', event => {
      if (event.target.id === 'all_todos' || event.target.textContent === "All Todos") {
        allTodosHandler();
      }
    })
  }

  bindCompleted(handleDoneTodos) {
    document.addEventListener('click', event => {
      if (event.target.id === 'all_done_header' || event.target.textContent === 'Completed') {
        handleDoneTodos();
      }
    })
  }

  getFormJSON() {
    let form = new FormData(document.querySelector('form'));
    let formJSON = JSON.stringify(Object.fromEntries(form));
    return formJSON;
  }

  createFromData(todo) {
    let formData = new FormData();
    Object.keys(todo).forEach(key => formData.append(key, todo[key]));
    return formData;
  }

  getFormDataToggleCompletion(todo) {
    let formData = this.createFromData(todo);
    let completed = formData.get('completed');
    if (completed === 'true') {
      formData.set('completed', 'false');
    } else {
      formData.set('completed', 'true');
    }
    return formData;
  }

  validateInput() {
    if (this.titleValueMissing() || this.titlePatternMismatch()) {
      alert('You must enter a title at least 3 alphanumeric characters consecutively long.');
    }
  }

  titleValueMissing() {
    return this.title.validity.valueMissing;
  }
  titlePatternMismatch() {
    return this.title.validity.patternMismatch;
  }
}

class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;

    // Explicit this binding
    this.model.bindTodoListChanged(this.onTodoListChanged);   // TODO LIST CHANGED AFTER EDIT/DELETE
    this.model.bindTodoListChangedAdd(this.handleAllTodos);   // TODO LIST CHANGED AFTER ADD
    this.view.bindAdd(this.handleAdd);                        // ADD
    this.view.bindEdit(this.handleEdit);                      // EDIT
    this.view.bindSubmit(this.handleSubmit);                  // SUBMIT
    this.view.bindDelete(this.handleDelete);                  // DELETE 
    this.view.bindCompleteButton(this.handleCompleteButton);  // COMPLETE BUTTON
    this.view.bindMonths(this.handleMonths);       // TODOS BY MONTH SIDEBAR
    this.view.bindAllTodos(this.handleAllTodos);   // ALL TODOS SIDEBAR
    this.view.bindCompleted(this.handleDoneTodos); // COMPLETED TODOS SIDEBAR
    this.view.bindCheckBox(this.handleCheckBox);

    // Display initial todos
    this.handleAllTodos();
    // this.onTodoListChanged();
  }

  onTodoListChanged = async () => {
    // debugger
    // this.view.time = document.querySelector('#sidebar header dl dt').textContent;
    // this.viewDataTitle = document.querySelector('#sidebar header dl dt').textContent;
    // this.view.dataTotal = document.querySelector('#sidebar header dl dd').textContent;
    
    let todos = await this.model.getTodos();
    let doneTodos = await this.view.getDoneTodos(todos);
    let selectedTodos;
    if (this.view.time === 'All Todos') {
      selectedTodos = todos;
      this.view.dataTotal = selectedTodos.length;
    } else if (this.view.time === 'Completed') {
      selectedTodos = doneTodos;
      this.view.dataTotal = selectedTodos.length;
    } else {
      selectedTodos = await this.model.getTodosByTime(this.view.time);
      this.view.dataTotal = selectedTodos.length;
    }
    this.view.displayTodos(todos, selectedTodos, this.view.dataTitle, this.view.dataTotal);
  }

  onTodoListChangedAdd = async () => {
    let todos = await this.model.getTodos();
    this.view.displayTodos(todos, todos, this.view.dataTitle, this.view.dataTotal);
  }

  handleCheckBox = async (id) => {
    let todo = await this.model.getTodo(id);
    let toggledFormData = this.view.getFormDataToggleCompletion(todo);
    let formJSON = JSON.stringify(Object.fromEntries(toggledFormData));
    this.model.editTodo(id, formJSON);
  }

  handleAdd = () => {
    this.view.formTitle.textContent = 'Add Todo';
    this.view.form.reset();
  }

  handleEdit = async (id) => {
    let todo = await this.model.getTodo(id);
    this.view.showModal();
    this.view.populateModal(todo);
  }

  handleDelete = (id) => {
    this.model.deleteTodo(id);
  }

  handleMonths = async (month, year, title, data) => {
    let todos = await this.model.getTodos();
    let todosByMonth = await this.model.getTodosByDate(month, year);
    this.view.displayTodos(todos, todosByMonth, title, data);
  }

  handleAllTodos = async () => {
    let todos = await this.model.getTodos();
    this.view.dataTitle = 'All Todos';
    this.view.dataTotal = todos.length;
    this.view.displayTodos(todos, this.view.sortTodosByCompletion(todos), this.view.dataTitle, this.view.dataTotal);
  }

  handleDoneTodos = async () => {
    let todos = await this.model.getTodos();
    let doneTodos = this.view.getDoneTodos(todos);
    let title = 'Completed';
    let data = doneTodos.length;
    this.view.displayTodos(todos, doneTodos, title, data);
  }

  handleCompleteButton = async (id) => {
    let form = new FormData(document.querySelector('form'));
    // mark the todo being edited to true
    form.set('completed', 'true')
    let formJSON = JSON.stringify(Object.fromEntries(form));
    this.model.editTodo(id, formJSON);
    this.view.closeModal();
  }

  handleSubmit = (id) => {
    this.view.validateInput();
    let form = document.querySelector('form');
    let formIsValid = form.checkValidity();
    if (formIsValid) {
      let formTitle = this.view.formTitle.textContent;
      let formJSON = this.view.getFormJSON();
      if (formTitle === 'Edit Todo') {
        this.model.editTodo(id, formJSON)
      } else if (formTitle === 'Add Todo') {
        this.model.addTodo(formJSON)
      }
      this.view.form.reset();
      this.view.closeModal();
    }
  }
}

const app = new Controller(new Model(), new View());