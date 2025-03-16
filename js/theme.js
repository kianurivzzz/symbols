// Функция для переключения темы
function toggleTheme() {
	const body = document.body;
	const isDarkTheme = body.classList.contains('dark-theme');

	if (isDarkTheme) {
		body.classList.remove('dark-theme');
		localStorage.setItem('theme', 'light');
	} else {
		body.classList.add('dark-theme');
		localStorage.setItem('theme', 'dark');
	}
}

// Функция для установки темы при загрузке страницы
function setInitialTheme() {
	const savedTheme = localStorage.getItem('theme');
	const prefersDarkScheme = window.matchMedia(
		'(prefers-color-scheme: dark)'
	).matches;

	if (savedTheme === 'dark' || (savedTheme === null && prefersDarkScheme)) {
		document.body.classList.add('dark-theme');
	}
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
	// Установка начальной темы
	setInitialTheme();

	// Добавление обработчика для кнопки переключения темы
	const themeToggle = document.getElementById('theme-toggle');
	if (themeToggle) {
		themeToggle.addEventListener('click', toggleTheme);
	}
});
