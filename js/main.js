// DOM Elements
const textarea = document.querySelector('#textarea');
const statsElements = {
	symbolsWithSpaces: document.querySelector('#symbols-spaces'),
	symbolsNoSpaces: document.querySelector('#symbols-no-spaces'),
	wordCount: document.querySelector('#word-count'),
	paragraphCount: document.querySelector('#paragraph-count'),
	sentenceCount: document.querySelector('#sentence-count'),
	avgSentenceLength: document.querySelector('#avg-sentence-length'),
	uniqueWords: document.querySelector('#unique-words'),
	readabilityScore: document.querySelector('#readability-score'),
	topWordsList: document.querySelector('#top-words-list'),
};
const clearButton = document.querySelector('#clearButton');
const copyButton = document.querySelector('#copyButton');
const downloadButton = document.querySelector('#downloadButton');
const advancedStatsToggle = document.querySelector('#advanced-stats-toggle');
const advancedStatsSection = document.querySelector('#advanced-stats');

// DOM Elements for sharing
const shareButtons = {
	vk: document.querySelector('#share-vk'),
	telegram: document.querySelector('#share-telegram'),
	twitter: document.querySelector('#share-twitter'),
	generateImage: document.querySelector('#generate-image'),
};

// Объявляем переменные для режима фокусировки
let focusModeButton;
let focusMode;
let focusModeClose;
let focusModeTextarea;
let focusModeWordCount;
let focusModeCharCount;

// Объявляем переменные для текстовых инструментов
let textCaseUpperButton;
let textCaseLowerButton;
let textCaseTitleButton;
let textCleanSpacesButton;
let textTrimButton;
let textSearchReplaceButton;
let textTransliterateButton;
let searchReplacePanel;
let searchReplaceClose;
let searchInput;
let replaceInput;
let searchButton;
let replaceButton;
let replaceAllButton;

// Объявляем переменные для таймера
let timerDisplay;
let timerSettingsButton;
let timerSettings;
let timerSettingsClose;
let timerPresets;
let timerCustomInput;
let timerApply;
let timerStart;
let timerPause;
let timerReset;

// History management
const MAX_HISTORY_ITEMS = 10;
let textHistory = [];
let currentHistoryIndex = -1;
let isRestoringFromHistory = false;

// Timer variables
let timerMinutes = 25;
let timerSeconds = 0;
let timerInterval = null;
let timerRunning = false;

// Search variables
let searchResults = [];
let currentSearchIndex = -1;

// Create toast element
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);

// Show toast message
function showToast(message, duration = 2000) {
	toast.textContent = message;
	toast.classList.add('show');
	setTimeout(() => toast.classList.remove('show'), duration);
}

// Animate value change
function animateValue(element) {
	element.classList.add('animate');
	setTimeout(() => element.classList.remove('animate'), 300);
}

// Count paragraphs in text
function countParagraphs(text) {
	if (!text.trim()) return 0;
	// Split by double newlines and filter out empty paragraphs
	return text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
}

// Count sentences in text
function countSentences(text) {
	if (!text.trim()) return 0;
	// Match sentences ending with ., !, ? and followed by space or end of string
	// This is a simplified approach and might not catch all edge cases
	const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g);
	return sentences ? sentences.length : 0;
}

// Calculate average sentence length in words
function calculateAvgSentenceLength(text, sentenceCount) {
	if (!text.trim() || sentenceCount === 0) return 0;
	const wordCount = text.trim().split(/\s+/).length;
	return Math.round((wordCount / sentenceCount) * 10) / 10; // Round to 1 decimal place
}

// Count unique words
function countUniqueWords(text) {
	if (!text.trim()) return 0;
	// Convert to lowercase, remove punctuation, split by whitespace
	const words = text
		.toLowerCase()
		.replace(/[^\wа-яё\s]/g, '')
		.split(/\s+/);
	const uniqueWords = new Set(words);
	return uniqueWords.size;
}

// Calculate Flesch-Kincaid readability score, adapted for Russian
function calculateReadabilityScore(text, sentenceCount) {
	if (!text.trim() || sentenceCount === 0) return 0;

	const words = text.trim().split(/\s+/);
	const wordCount = words.length;

	if (wordCount === 0) return 0;

	// Simplified formula adapted for Russian
	// 206.835 - 1.3 * (words / sentences) - 60.1 * (syllables / words)
	// For Russian, we'll use a simplified estimation of syllables

	const avgWordsPerSentence = wordCount / sentenceCount;

	// Estimate syllables (simplified for Russian)
	let syllableCount = 0;
	for (const word of words) {
		// Count vowels as a rough estimate of syllables in Russian
		const vowelMatches = word.match(/[аеёэоуыиюяАЕЁЭОУЫИЮЯ]/g);
		syllableCount += vowelMatches ? vowelMatches.length : 1;
	}

	const avgSyllablesPerWord = syllableCount / wordCount;

	// Calculate score (adapted formula)
	let score =
		206.835 - 1.3 * avgWordsPerSentence - 60.1 * avgSyllablesPerWord;

	// Clamp score between 0 and 100
	score = Math.max(0, Math.min(100, score));

	return Math.round(score);
}

// Get top 10 most frequent words
function getTopWords(text, limit = 10) {
	if (!text.trim()) return [];

	// Convert to lowercase, remove punctuation, split by whitespace
	const words = text
		.toLowerCase()
		.replace(/[^\wа-яё\s]/g, '')
		.split(/\s+/);

	// Filter out very short words (less than 3 characters)
	const filteredWords = words.filter(word => word.length >= 3);

	// Count word frequencies
	const wordFrequency = {};
	for (const word of filteredWords) {
		wordFrequency[word] = (wordFrequency[word] || 0) + 1;
	}

	// Sort by frequency and get top N
	return Object.entries(wordFrequency)
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit)
		.map(([word, count]) => ({ word, count }));
}

// Save current text to history
function saveToHistory(text) {
	if (isRestoringFromHistory) return;

	// Don't save if text is empty or the same as the last entry
	if (
		!text.trim() ||
		(textHistory.length > 0 &&
			textHistory[textHistory.length - 1].text === text)
	) {
		return;
	}

	// Create history item with timestamp
	const historyItem = {
		text: text,
		timestamp: new Date().toISOString(),
		stats: {
			symbolsWithSpaces: text.length,
			symbolsNoSpaces: text.replace(/\s/g, '').length,
			words: text.trim() ? text.trim().split(/\s+/).length : 0,
			paragraphs: countParagraphs(text),
			sentences: countSentences(text),
		},
	};

	// Add to history and trim if needed
	textHistory.push(historyItem);
	if (textHistory.length > MAX_HISTORY_ITEMS) {
		textHistory.shift(); // Remove oldest item
	}

	// Update current index
	currentHistoryIndex = textHistory.length - 1;

	// Save to localStorage
	localStorage.setItem('textHistory', JSON.stringify(textHistory));

	// Update history UI
	updateHistoryUI();
}

// Load history from localStorage
function loadHistory() {
	const savedHistory = localStorage.getItem('textHistory');
	if (savedHistory) {
		try {
			textHistory = JSON.parse(savedHistory);
			updateHistoryUI();
		} catch (e) {
			console.error('Error loading history:', e);
			textHistory = [];
		}
	}
}

// Update history UI
function updateHistoryUI() {
	const historyList = document.querySelector('#history-list');
	if (!historyList) return;

	// Clear current list
	historyList.innerHTML = '';

	if (textHistory.length === 0) {
		const emptyItem = document.createElement('li');
		emptyItem.className = 'history-item empty';
		emptyItem.textContent = 'История пуста';
		historyList.appendChild(emptyItem);
		return;
	}

	// Add each history item to the list (in reverse order - newest first)
	textHistory
		.slice()
		.reverse()
		.forEach((item, index) => {
			const reversedIndex = textHistory.length - 1 - index;

			const listItem = document.createElement('li');
			listItem.className = 'history-item';
			listItem.dataset.index = reversedIndex;

			const preview =
				item.text.substring(0, 50) +
				(item.text.length > 50 ? '...' : '');

			const date = new Date(item.timestamp);
			const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString(
				[],
				{ hour: '2-digit', minute: '2-digit' }
			)}`;

			listItem.innerHTML = `
			<div class="history-item-header">
				<span class="history-date">${formattedDate}</span>
				<div class="history-actions">
					<button class="history-action-button history-restore" title="Восстановить">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M3 12h18M3 12l6-6M3 12l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
					<button class="history-action-button history-delete" title="Удалить">
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z" fill="currentColor"/>
							<path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
						</svg>
					</button>
				</div>
			</div>
			<div class="history-preview">${preview}</div>
			<div class="history-stats">
				<span>${item.stats.symbolsWithSpaces} симв.</span>
				<span>${item.stats.words} сл.</span>
				<span>${item.stats.paragraphs} абз.</span>
			</div>
		`;

			// Add event listeners
			listItem
				.querySelector('.history-restore')
				.addEventListener('click', e => {
					e.stopPropagation();
					restoreFromHistory(reversedIndex);
				});

			listItem
				.querySelector('.history-delete')
				.addEventListener('click', e => {
					e.stopPropagation();
					deleteFromHistory(reversedIndex);
				});

			// Add click event to the whole item
			listItem.addEventListener('click', () => {
				restoreFromHistory(reversedIndex);
			});

			historyList.appendChild(listItem);
		});
}

// Restore text from history
function restoreFromHistory(index) {
	if (index < 0 || index >= textHistory.length) return;

	isRestoringFromHistory = true;
	textarea.value = textHistory[index].text;
	currentHistoryIndex = index;
	updateStats();
	isRestoringFromHistory = false;

	showToast('Текст восстановлен из истории');
}

// Delete item from history
function deleteFromHistory(index) {
	if (index < 0 || index >= textHistory.length) return;

	textHistory.splice(index, 1);

	// Update current index
	if (currentHistoryIndex >= textHistory.length) {
		currentHistoryIndex = textHistory.length - 1;
	}

	// Save to localStorage
	localStorage.setItem('textHistory', JSON.stringify(textHistory));

	// Update history UI
	updateHistoryUI();

	showToast('Запись удалена из истории');
}

// Toggle history panel
function toggleHistoryPanel() {
	const historyPanel = document.querySelector('#history-panel');
	if (!historyPanel) return;

	historyPanel.classList.toggle('show');

	const isVisible = historyPanel.classList.contains('show');
	const historyToggle = document.querySelector('#history-toggle');

	if (historyToggle) {
		historyToggle.textContent = isVisible
			? 'Скрыть историю'
			: 'Показать историю';
	}

	// Save preference
	localStorage.setItem('showHistoryPanel', isVisible ? 'true' : 'false');
}

// Clear all history
function clearAllHistory() {
	if (textHistory.length === 0) return;

	if (confirm('Вы уверены, что хотите очистить всю историю?')) {
		textHistory = [];
		currentHistoryIndex = -1;

		// Save to localStorage
		localStorage.setItem('textHistory', JSON.stringify(textHistory));

		// Update history UI
		updateHistoryUI();

		showToast('История очищена');
	}
}

// Update statistics
function updateStats() {
	const text = textarea.value;
	const paragraphCount = countParagraphs(text);
	const sentenceCount = countSentences(text);
	const avgSentenceLength = calculateAvgSentenceLength(text, sentenceCount);
	const uniqueWordsCount = countUniqueWords(text);
	const readabilityScore = calculateReadabilityScore(text, sentenceCount);
	const topWords = getTopWords(text);

	const stats = {
		withSpaces: text.length,
		noSpaces: text.replace(/\s/g, '').length,
		words: text.trim() ? text.trim().split(/\s+/).length : 0,
		paragraphs: paragraphCount,
		sentences: sentenceCount,
		avgSentenceLength: avgSentenceLength,
		uniqueWords: uniqueWordsCount,
		readabilityScore: readabilityScore,
		topWords: topWords,
	};

	// Update display with animation
	if (
		stats.withSpaces !==
		parseInt(statsElements.symbolsWithSpaces.textContent)
	) {
		statsElements.symbolsWithSpaces.textContent = stats.withSpaces;
		animateValue(statsElements.symbolsWithSpaces);
	}

	if (
		stats.noSpaces !== parseInt(statsElements.symbolsNoSpaces.textContent)
	) {
		statsElements.symbolsNoSpaces.textContent = stats.noSpaces;
		animateValue(statsElements.symbolsNoSpaces);
	}

	if (stats.words !== parseInt(statsElements.wordCount.textContent)) {
		statsElements.wordCount.textContent = stats.words;
		animateValue(statsElements.wordCount);
	}

	if (
		stats.paragraphs !== parseInt(statsElements.paragraphCount.textContent)
	) {
		statsElements.paragraphCount.textContent = stats.paragraphs;
		animateValue(statsElements.paragraphCount);
	}

	if (stats.sentences !== parseInt(statsElements.sentenceCount.textContent)) {
		statsElements.sentenceCount.textContent = stats.sentences;
		animateValue(statsElements.sentenceCount);
	}

	if (
		stats.avgSentenceLength !==
		parseFloat(statsElements.avgSentenceLength.textContent)
	) {
		statsElements.avgSentenceLength.textContent = stats.avgSentenceLength;
		animateValue(statsElements.avgSentenceLength);
	}

	if (stats.uniqueWords !== parseInt(statsElements.uniqueWords.textContent)) {
		statsElements.uniqueWords.textContent = stats.uniqueWords;
		animateValue(statsElements.uniqueWords);
	}

	if (
		stats.readabilityScore !==
		parseInt(statsElements.readabilityScore.textContent)
	) {
		statsElements.readabilityScore.textContent = stats.readabilityScore;
		animateValue(statsElements.readabilityScore);

		// Update readability description
		updateReadabilityDescription(stats.readabilityScore);
	}

	// Update top words list
	updateTopWordsList(stats.topWords);

	// Save to history (with debounce)
	clearTimeout(window.saveHistoryTimeout);
	window.saveHistoryTimeout = setTimeout(() => {
		saveToHistory(text);
	}, 1000);
}

// Update readability description based on score
function updateReadabilityDescription(score) {
	const descriptionElement = document.querySelector(
		'#readability-description'
	);
	if (!descriptionElement) return;

	let description = '';

	if (score >= 80) {
		description = 'Очень простой текст';
	} else if (score >= 70) {
		description = 'Простой текст';
	} else if (score >= 60) {
		description = 'Средней сложности';
	} else if (score >= 50) {
		description = 'Умеренно сложный';
	} else if (score >= 30) {
		description = 'Сложный текст';
	} else {
		description = 'Очень сложный текст';
	}

	descriptionElement.textContent = description;
}

// Update top words list
function updateTopWordsList(topWords) {
	const listElement = statsElements.topWordsList;
	if (!listElement) return;

	// Clear previous list
	listElement.innerHTML = '';

	if (topWords.length === 0) {
		const emptyItem = document.createElement('li');
		emptyItem.className = 'top-word-item';
		emptyItem.textContent = 'Нет данных';
		listElement.appendChild(emptyItem);
		return;
	}

	// Add each word to the list
	topWords.forEach(({ word, count }) => {
		const listItem = document.createElement('li');
		listItem.className = 'top-word-item';

		const wordSpan = document.createElement('span');
		wordSpan.className = 'top-word-text';
		wordSpan.textContent = word;

		const countSpan = document.createElement('span');
		countSpan.className = 'top-word-count';
		countSpan.textContent = count;

		listItem.appendChild(wordSpan);
		listItem.appendChild(countSpan);
		listElement.appendChild(listItem);
	});
}

// Toggle advanced stats section
function toggleAdvancedStats() {
	if (advancedStatsSection) {
		advancedStatsSection.classList.toggle('show');
		const isVisible = advancedStatsSection.classList.contains('show');

		if (advancedStatsToggle) {
			advancedStatsToggle.textContent = isVisible
				? 'Скрыть расширенную статистику'
				: 'Показать расширенную статистику';
		}

		// Save preference
		localStorage.setItem('showAdvancedStats', isVisible ? 'true' : 'false');
	}
}

// Focus mode functions
function toggleFocusMode() {
	console.log('toggleFocusMode called');
	if (!focusMode) {
		console.error('Focus mode element not found!');
		return;
	}

	focusMode.classList.toggle('active');

	if (focusMode.classList.contains('active')) {
		// Copy text from main textarea to focus mode textarea
		focusModeTextarea.value = textarea.value;
		updateFocusModeStats();

		// Prevent scrolling of the background
		document.body.style.overflow = 'hidden';
	} else {
		// Copy text from focus mode textarea to main textarea
		textarea.value = focusModeTextarea.value;
		updateStats();

		// Restore scrolling
		document.body.style.overflow = '';
	}
}

function updateFocusModeStats() {
	const text = focusModeTextarea.value;
	const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
	const charCount = text.length;

	focusModeWordCount.textContent = wordCount;
	focusModeCharCount.textContent = charCount;
}

// Функции работы с текстом в режиме фокусировки

// Преобразование в верхний регистр
function convertToUpperCase() {
	if (!focusModeTextarea) return;

	const selection = getSelection(focusModeTextarea);
	if (selection.text) {
		replaceSelection(
			focusModeTextarea,
			selection.text.toUpperCase(),
			selection.start,
			selection.end
		);
	} else {
		focusModeTextarea.value = focusModeTextarea.value.toUpperCase();
	}
	updateFocusModeStats();
	showToast('Текст преобразован в верхний регистр');
}

// Преобразование в нижний регистр
function convertToLowerCase() {
	if (!focusModeTextarea) return;

	const selection = getSelection(focusModeTextarea);
	if (selection.text) {
		replaceSelection(
			focusModeTextarea,
			selection.text.toLowerCase(),
			selection.start,
			selection.end
		);
	} else {
		focusModeTextarea.value = focusModeTextarea.value.toLowerCase();
	}
	updateFocusModeStats();
	showToast('Текст преобразован в нижний регистр');
}

// Преобразование в начальные прописные
function convertToTitleCase() {
	if (!focusModeTextarea) return;

	const selection = getSelection(focusModeTextarea);
	if (selection.text) {
		replaceSelection(
			focusModeTextarea,
			selection.text.replace(
				/\b\w+/g,
				word =>
					word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
			),
			selection.start,
			selection.end
		);
	} else {
		focusModeTextarea.value = focusModeTextarea.value.replace(
			/\b\w+/g,
			word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
		);
	}
	updateFocusModeStats();
	showToast('Текст преобразован в начальные прописные');
}

// Удаление лишних пробелов
function cleanExtraSpaces() {
	if (!focusModeTextarea) return;

	const selection = getSelection(focusModeTextarea);
	if (selection.text) {
		// Заменяем двойные пробелы на одинарные и удаляем пробелы в начале строк
		const cleanedText = selection.text
			.replace(/[ \t]+/g, ' ')
			.replace(/\n[ \t]+/g, '\n')
			.replace(/[ \t]+\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n');

		replaceSelection(
			focusModeTextarea,
			cleanedText,
			selection.start,
			selection.end
		);
	} else {
		// Применяем ко всему тексту
		focusModeTextarea.value = focusModeTextarea.value
			.replace(/[ \t]+/g, ' ')
			.replace(/\n[ \t]+/g, '\n')
			.replace(/[ \t]+\n/g, '\n')
			.replace(/\n{3,}/g, '\n\n');
	}
	updateFocusModeStats();
	showToast('Лишние пробелы удалены');
}

// Удаление пробелов в начале и конце
function trimText() {
	if (!focusModeTextarea) return;

	const selection = getSelection(focusModeTextarea);
	if (selection.text) {
		// Удаляем пробелы в начале и конце выделенного текста
		replaceSelection(
			focusModeTextarea,
			selection.text.trim(),
			selection.start,
			selection.end
		);
	} else {
		// Применяем ко всему тексту
		focusModeTextarea.value = focusModeTextarea.value.trim();
	}
	updateFocusModeStats();
	showToast('Пробелы в начале и конце удалены');
}

// Транслитерация текста (кириллица -> латиница)
function transliterateText() {
	if (!focusModeTextarea) return;

	const selection = getSelection(focusModeTextarea);
	let textToTransliterate = selection.text || focusModeTextarea.value;

	// Таблица транслитерации
	const translitMap = {
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ё: 'yo',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'y',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'kh',
		ц: 'ts',
		ч: 'ch',
		ш: 'sh',
		щ: 'sch',
		ъ: '',
		ы: 'y',
		ь: '',
		э: 'e',
		ю: 'yu',
		я: 'ya',
		А: 'A',
		Б: 'B',
		В: 'V',
		Г: 'G',
		Д: 'D',
		Е: 'E',
		Ё: 'Yo',
		Ж: 'Zh',
		З: 'Z',
		И: 'I',
		Й: 'Y',
		К: 'K',
		Л: 'L',
		М: 'M',
		Н: 'N',
		О: 'O',
		П: 'P',
		Р: 'R',
		С: 'S',
		Т: 'T',
		У: 'U',
		Ф: 'F',
		Х: 'Kh',
		Ц: 'Ts',
		Ч: 'Ch',
		Ш: 'Sh',
		Щ: 'Sch',
		Ъ: '',
		Ы: 'Y',
		Ь: '',
		Э: 'E',
		Ю: 'Yu',
		Я: 'Ya',
	};

	// Выполняем транслитерацию
	const transliterated = textToTransliterate.replace(
		/[а-яА-ЯёЁ]/g,
		char => translitMap[char] || char
	);

	// Заменяем текст
	if (selection.text) {
		replaceSelection(
			focusModeTextarea,
			transliterated,
			selection.start,
			selection.end
		);
	} else {
		focusModeTextarea.value = transliterated;
	}

	updateFocusModeStats();
	showToast('Текст транслитерирован');
}

// Функции для поиска и замены
function toggleSearchReplacePanel() {
	if (!searchReplacePanel) return;

	searchReplacePanel.classList.toggle('show');

	if (searchReplacePanel.classList.contains('show')) {
		searchInput.focus();
		// Очищаем предыдущие результаты поиска
		clearSearchHighlights();
		searchResults = [];
		currentSearchIndex = -1;
	}
}

function searchText() {
	const searchTerm = searchInput.value.trim();
	if (!searchTerm || !focusModeTextarea) return;

	// Очищаем предыдущие результаты поиска
	clearSearchHighlights();

	const text = focusModeTextarea.value;
	searchResults = [];

	// Находим все вхождения
	let match;
	const regex = new RegExp(escapeRegExp(searchTerm), 'g');
	while ((match = regex.exec(text)) !== null) {
		searchResults.push({
			start: match.index,
			end: match.index + searchTerm.length,
			text: match[0],
		});
	}

	if (searchResults.length > 0) {
		// Выделяем первый результат
		currentSearchIndex = 0;
		highlightAllSearchResults();
		highlightCurrentResult();
		showToast(`Найдено ${searchResults.length} совпадений`);
	} else {
		showToast('Совпадений не найдено');
	}
}

function replaceCurrentMatch() {
	if (currentSearchIndex < 0 || currentSearchIndex >= searchResults.length)
		return;

	const replaceWith = replaceInput.value;
	const match = searchResults[currentSearchIndex];

	// Заменяем текущее совпадение
	replaceSelection(focusModeTextarea, replaceWith, match.start, match.end);

	// Обновляем позиции всех совпадений после замены
	const lengthDiff = replaceWith.length - match.text.length;
	for (let i = currentSearchIndex + 1; i < searchResults.length; i++) {
		searchResults[i].start += lengthDiff;
		searchResults[i].end += lengthDiff;
	}

	// Обновляем весь поиск
	searchText();
}

function replaceAllMatches() {
	if (searchResults.length === 0) return;

	const searchTerm = searchInput.value.trim();
	const replaceWith = replaceInput.value;

	if (!searchTerm) return;

	// Заменяем все совпадения
	focusModeTextarea.value = focusModeTextarea.value.replace(
		new RegExp(escapeRegExp(searchTerm), 'g'),
		replaceWith
	);

	updateFocusModeStats();

	// Обновляем поиск
	searchText();

	showToast(`Заменено ${searchResults.length} совпадений`);
}

// Вспомогательные функции

// Функция для экранирования спецсимволов в регулярных выражениях
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Получение выделенного текста
function getSelection(textareaElement) {
	const start = textareaElement.selectionStart;
	const end = textareaElement.selectionEnd;
	const text = textareaElement.value.substring(start, end);

	return { start, end, text };
}

// Замена выделенного текста
function replaceSelection(textareaElement, replacement, start, end) {
	const text = textareaElement.value;
	textareaElement.value =
		text.substring(0, start) + replacement + text.substring(end);

	// Устанавливаем курсор после замены
	textareaElement.selectionStart = start + replacement.length;
	textareaElement.selectionEnd = start + replacement.length;

	// Фокусируемся на элементе
	textareaElement.focus();
}

// Очистка всех подсветок поиска
function clearSearchHighlights() {
	// Реализация для textarea - сбрасываем выделение
	if (focusModeTextarea) {
		focusModeTextarea.blur();
		setTimeout(() => focusModeTextarea.focus(), 0);
	}
}

// Подсветка всех результатов поиска
function highlightAllSearchResults() {
	// В простом textarea мы не можем подсветить все результаты без дополнительного DOM
	// Эта функция будет просто заглушкой для будущей реализации
	console.log('Highlight all results:', searchResults.length);
}

// Подсветка текущего результата поиска
function highlightCurrentResult() {
	if (currentSearchIndex < 0 || currentSearchIndex >= searchResults.length)
		return;

	const match = searchResults[currentSearchIndex];

	// Выделяем текст и прокручиваем к нему
	focusModeTextarea.focus();
	focusModeTextarea.setSelectionRange(match.start, match.end);

	// Убедимся, что выделение видно в видимой области
	const textHeight = focusModeTextarea.scrollHeight;
	const textPosition =
		(match.start / focusModeTextarea.value.length) * textHeight;
	const viewportHeight = focusModeTextarea.clientHeight;

	focusModeTextarea.scrollTop = textPosition - viewportHeight / 2;
}

// Timer functions
function formatTime(minutes, seconds) {
	return `${minutes.toString().padStart(2, '0')}:${seconds
		.toString()
		.padStart(2, '0')}`;
}

function updateTimerDisplay() {
	timerDisplay.textContent = formatTime(timerMinutes, timerSeconds);
}

function startTimer() {
	if (timerRunning) return;

	timerRunning = true;
	timerStart.style.display = 'none';
	timerPause.style.display = 'flex';

	timerInterval = setInterval(() => {
		if (timerSeconds === 0) {
			if (timerMinutes === 0) {
				// Timer finished
				clearInterval(timerInterval);
				timerRunning = false;
				timerStart.style.display = 'flex';
				timerPause.style.display = 'none';

				// Play sound and show notification
				playTimerEndSound();
				showTimerEndNotification();

				return;
			}
			timerMinutes--;
			timerSeconds = 59;
		} else {
			timerSeconds--;
		}

		updateTimerDisplay();
	}, 1000);
}

function pauseTimer() {
	if (!timerRunning) return;

	clearInterval(timerInterval);
	timerRunning = false;
	timerStart.style.display = 'flex';
	timerPause.style.display = 'none';
}

function resetTimer() {
	pauseTimer();
	timerMinutes = 25;
	timerSeconds = 0;
	updateTimerDisplay();

	// Reset active preset
	timerPresets.forEach(preset => {
		preset.classList.remove('active');
		if (preset.dataset.minutes === '25') {
			preset.classList.add('active');
		}
	});
}

function setTimer(minutes) {
	pauseTimer();
	timerMinutes = minutes;
	timerSeconds = 0;
	updateTimerDisplay();
}

function toggleTimerSettings() {
	timerSettings.classList.toggle('show');
}

function playTimerEndSound() {
	// Create audio element
	const audio = new Audio(
		'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3'
	);
	audio.volume = 0.5;
	audio.play();
}

function showTimerEndNotification() {
	// Show toast notification
	showToast('Время вышло! Сделайте перерыв.', 5000);

	// Try to show browser notification if allowed
	if ('Notification' in window && Notification.permission === 'granted') {
		new Notification('Время вышло!', {
			body: 'Ваша сессия письма завершена. Сделайте перерыв.',
			icon: '/img/favicons/favicon.ico',
		});
	} else if (
		'Notification' in window &&
		Notification.permission !== 'denied'
	) {
		Notification.requestPermission();
	}
}

// Event listeners
textarea.addEventListener('input', updateStats);

clearButton.addEventListener('click', () => {
	textarea.value = '';
	updateStats();
	showToast('Текст очищен');
});

copyButton.addEventListener('click', async () => {
	try {
		await navigator.clipboard.writeText(textarea.value);
		showToast('Текст скопирован');
	} catch (err) {
		showToast('Не удалось скопировать текст');
	}
});

downloadButton.addEventListener('click', () => {
	downloadTextAsTxt();
});

if (advancedStatsToggle) {
	advancedStatsToggle.addEventListener('click', toggleAdvancedStats);
}

// Add event listeners for history
document.addEventListener('DOMContentLoaded', () => {
	// Инициализация элементов режима фокусировки
	focusModeButton = document.querySelector('#focusModeButton');
	focusMode = document.querySelector('#focus-mode');
	focusModeClose = document.querySelector('#focus-mode-close');
	focusModeTextarea = document.querySelector('#focus-mode-textarea');
	focusModeWordCount = document.querySelector('#focus-mode-word-count');
	focusModeCharCount = document.querySelector('#focus-mode-char-count');

	// Инициализация элементов инструментов работы с текстом
	textCaseUpperButton = document.querySelector('#text-case-upper');
	textCaseLowerButton = document.querySelector('#text-case-lower');
	textCaseTitleButton = document.querySelector('#text-case-title');
	textCleanSpacesButton = document.querySelector('#text-clean-spaces');
	textTrimButton = document.querySelector('#text-trim');
	textSearchReplaceButton = document.querySelector('#text-search-replace');
	textTransliterateButton = document.querySelector('#text-transliterate');
	searchReplacePanel = document.querySelector('#search-replace-panel');
	searchReplaceClose = document.querySelector('#search-replace-close');
	searchInput = document.querySelector('#search-input');
	replaceInput = document.querySelector('#replace-input');
	searchButton = document.querySelector('#search-button');
	replaceButton = document.querySelector('#replace-button');
	replaceAllButton = document.querySelector('#replace-all-button');

	// Инициализация элементов таймера
	timerDisplay = document.querySelector('#timer-display');
	timerSettingsButton = document.querySelector('#timer-settings-button');
	timerSettings = document.querySelector('#timer-settings');
	timerSettingsClose = document.querySelector('#timer-settings-close');
	timerPresets = document.querySelectorAll('.timer-preset');
	timerCustomInput = document.querySelector('#timer-custom-input');
	timerApply = document.querySelector('#timer-apply');
	timerStart = document.querySelector('#timer-start');
	timerPause = document.querySelector('#timer-pause');
	timerReset = document.querySelector('#timer-reset');

	// Initialize advanced stats visibility
	const showAdvancedStats =
		localStorage.getItem('showAdvancedStats') === 'true';
	if (advancedStatsSection && showAdvancedStats) {
		advancedStatsSection.classList.add('show');
		if (advancedStatsToggle) {
			advancedStatsToggle.textContent = 'Скрыть расширенную статистику';
		}
	}

	// Initialize history
	loadHistory();

	// Initialize history panel visibility
	const showHistoryPanel =
		localStorage.getItem('showHistoryPanel') === 'true';
	const historyPanel = document.querySelector('#history-panel');
	const historyToggle = document.querySelector('#history-toggle');

	if (historyPanel && showHistoryPanel) {
		historyPanel.classList.add('show');
		if (historyToggle) {
			historyToggle.textContent = 'Скрыть историю';
		}
	}

	// Add event listener for history toggle
	if (historyToggle) {
		historyToggle.addEventListener('click', toggleHistoryPanel);
	}

	// Add event listener for clear history button
	const clearHistoryButton = document.querySelector('#clear-history');
	if (clearHistoryButton) {
		clearHistoryButton.addEventListener('click', clearAllHistory);
	}

	updateStats();

	// Add event listeners for share buttons
	if (shareButtons.vk) {
		shareButtons.vk.addEventListener('click', shareToVK);
	}

	if (shareButtons.telegram) {
		shareButtons.telegram.addEventListener('click', shareToTelegram);
	}

	if (shareButtons.twitter) {
		shareButtons.twitter.addEventListener('click', shareToTwitter);
	}

	if (shareButtons.generateImage) {
		shareButtons.generateImage.addEventListener('click', generateImage);
	}

	// Event listeners for focus mode
	console.log('Setting up focus mode event listeners');
	console.log('focusModeButton:', focusModeButton);
	console.log('focusMode:', focusMode);
	console.log('focusModeClose:', focusModeClose);

	if (focusModeButton) {
		console.log('Adding click event listener to focusModeButton');
		focusModeButton.addEventListener('click', toggleFocusMode);
	}

	if (focusModeClose) {
		focusModeClose.addEventListener('click', toggleFocusMode);
	}

	if (focusModeTextarea) {
		focusModeTextarea.addEventListener('input', updateFocusModeStats);
	}

	// Event listeners for timer
	if (timerSettingsButton) {
		timerSettingsButton.addEventListener('click', toggleTimerSettings);
	}

	if (timerSettingsClose) {
		timerSettingsClose.addEventListener('click', () => {
			timerSettings.classList.remove('show');
		});
	}

	if (timerPresets) {
		timerPresets.forEach(preset => {
			preset.addEventListener('click', () => {
				// Remove active class from all presets
				timerPresets.forEach(p => p.classList.remove('active'));

				// Add active class to clicked preset
				preset.classList.add('active');

				// Set timer
				setTimer(parseInt(preset.dataset.minutes));
			});
		});
	}

	if (timerApply) {
		timerApply.addEventListener('click', () => {
			const minutes = parseInt(timerCustomInput.value);

			if (isNaN(minutes) || minutes < 1 || minutes > 120) {
				showToast('Пожалуйста, введите время от 1 до 120 минут');
				return;
			}

			// Remove active class from all presets
			timerPresets.forEach(p => p.classList.remove('active'));

			// Set timer
			setTimer(minutes);

			// Close settings
			timerSettings.classList.remove('show');

			// Clear input
			timerCustomInput.value = '';
		});
	}

	if (timerStart) {
		timerStart.addEventListener('click', startTimer);
	}

	if (timerPause) {
		timerPause.addEventListener('click', pauseTimer);
	}

	if (timerReset) {
		timerReset.addEventListener('click', resetTimer);
	}

	// Initialize timer display
	updateTimerDisplay();

	// Handle paste event
	textarea.addEventListener('paste', e => {
		e.preventDefault();
		const text = e.clipboardData.getData('text');
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;

		textarea.value =
			textarea.value.substring(0, start) +
			text +
			textarea.value.substring(end);

		textarea.selectionStart = textarea.selectionEnd = start + text.length;
		updateStats();
	});

	// Устанавливаем обработчики событий для текстовых инструментов
	if (textCaseUpperButton) {
		textCaseUpperButton.addEventListener('click', convertToUpperCase);
	}

	if (textCaseLowerButton) {
		textCaseLowerButton.addEventListener('click', convertToLowerCase);
	}

	if (textCaseTitleButton) {
		textCaseTitleButton.addEventListener('click', convertToTitleCase);
	}

	if (textCleanSpacesButton) {
		textCleanSpacesButton.addEventListener('click', cleanExtraSpaces);
	}

	if (textTrimButton) {
		textTrimButton.addEventListener('click', trimText);
	}

	if (textTransliterateButton) {
		textTransliterateButton.addEventListener('click', transliterateText);
	}

	if (textSearchReplaceButton) {
		textSearchReplaceButton.addEventListener(
			'click',
			toggleSearchReplacePanel
		);
	}

	if (searchReplaceClose) {
		searchReplaceClose.addEventListener('click', toggleSearchReplacePanel);
	}

	if (searchButton) {
		searchButton.addEventListener('click', searchText);
	}

	if (replaceButton) {
		replaceButton.addEventListener('click', replaceCurrentMatch);
	}

	if (replaceAllButton) {
		replaceAllButton.addEventListener('click', replaceAllMatches);
	}

	// Обработчик нажатия Enter в поле поиска
	if (searchInput) {
		searchInput.addEventListener('keydown', e => {
			if (e.key === 'Enter') {
				e.preventDefault();
				searchText();
			}
		});
	}
});

// Share functions
function shareToVK() {
	const text = textarea.value;
	if (!text.trim()) {
		showToast('Нечего публиковать. Введите текст.');
		return;
	}

	const stats = getTextStats();
	const title = 'Статистика текста на symbols.stdout.media';
	const description = `Символов: ${stats.withSpaces}, Слов: ${stats.words}, Индекс читабельности: ${stats.readabilityScore}/100`;

	// Ограничиваем текст для превью
	const previewText =
		text.length > 300 ? text.substring(0, 300) + '...' : text;

	const url = 'https://symbols.stdout.media/';
	const shareUrl = `https://vk.com/share.php?url=${encodeURIComponent(
		url
	)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(
		description
	)}&comment=${encodeURIComponent(previewText)}`;

	window.open(shareUrl, '_blank', 'width=640,height=480');
	showToast('Открываю окно публикации ВКонтакте');
}

function shareToTelegram() {
	const text = textarea.value;
	if (!text.trim()) {
		showToast('Нечего публиковать. Введите текст.');
		return;
	}

	const stats = getTextStats();
	const message = `📊 Статистика текста:\n\n📝 Символов: ${
		stats.withSpaces
	}\n🔤 Слов: ${stats.words}\n📋 Абзацев: ${
		stats.paragraphs
	}\n📖 Индекс читабельности: ${
		stats.readabilityScore
	}/100\n\n${text.substring(0, 200)}${
		text.length > 200 ? '...' : ''
	}\n\nСоздано в https://kianurivzzz.github.io/symbols/`;

	const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
		'https://symbols.stdout.media/'
	)}&text=${encodeURIComponent(message)}`;

	window.open(shareUrl, '_blank');
	showToast('Открываю Telegram');
}

function shareToTwitter() {
	const text = textarea.value;
	if (!text.trim()) {
		showToast('Нечего публиковать. Введите текст.');
		return;
	}

	const stats = getTextStats();
	const message = `📊 Статистика текста:\nСимволов: ${stats.withSpaces}, Слов: ${stats.words}, Индекс читабельности: ${stats.readabilityScore}/100\n\nСоздано в https://kianurivzzz.github.io/symbols/`;

	const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
		message
	)}`;

	window.open(shareUrl, '_blank');
	showToast('Открываю Twitter');
}

function generateImage() {
	const text = textarea.value;
	if (!text.trim()) {
		showToast('Нечего публиковать. Введите текст.');
		return;
	}

	// Создаем временный контейнер для изображения
	const container = document.createElement('div');
	container.className = 'stats-image-container';
	document.body.appendChild(container);

	// Получаем статистику
	const stats = getTextStats();

	// Создаем HTML для изображения
	container.innerHTML = `
		<div class="stats-image">
			<h2>Статистика текста</h2>
			<div class="stats-image-content">
				<div class="stats-image-item">
					<div class="stats-image-label">Символов с пробелами</div>
					<div class="stats-image-value">${stats.withSpaces}</div>
				</div>
				<div class="stats-image-item">
					<div class="stats-image-label">Символов без пробелов</div>
					<div class="stats-image-value">${stats.noSpaces}</div>
				</div>
				<div class="stats-image-item">
					<div class="stats-image-label">Количество слов</div>
					<div class="stats-image-value">${stats.words}</div>
				</div>
				<div class="stats-image-item">
					<div class="stats-image-label">Количество абзацев</div>
					<div class="stats-image-value">${stats.paragraphs}</div>
				</div>
				<div class="stats-image-item">
					<div class="stats-image-label">Индекс читабельности</div>
					<div class="stats-image-value">${stats.readabilityScore}/100</div>
				</div>
			</div>
			<div class="stats-image-text">
				${text.length > 200 ? text.substring(0, 200) + '...' : text}
			</div>
			<div class="stats-image-footer">
				Создано в https://kianurivzzz.github.io/symbols/
			</div>
		</div>
	`;

	// Используем html2canvas для создания изображения
	try {
		// Проверяем, загружена ли библиотека html2canvas
		if (typeof html2canvas === 'undefined') {
			// Если библиотека не загружена, загружаем её
			const script = document.createElement('script');
			script.src =
				'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
			script.onload = () => {
				// После загрузки библиотеки вызываем функцию снова
				generateImage();
			};
			document.head.appendChild(script);

			// Удаляем временный контейнер
			document.body.removeChild(container);
			return;
		}

		// Если библиотека загружена, создаем изображение
		html2canvas(container, {
			backgroundColor: document.body.classList.contains('dark-theme')
				? '#000000'
				: '#ffffff',
			scale: 2,
		}).then(canvas => {
			// Создаем ссылку для скачивания
			const link = document.createElement('a');
			link.download = 'symbols-stats.png';
			link.href = canvas.toDataURL('image/png');
			link.click();

			// Удаляем временный контейнер
			document.body.removeChild(container);
			showToast('Изображение сохранено');
		});
	} catch (error) {
		console.error('Ошибка при создании изображения:', error);
		showToast('Не удалось создать изображение');
		document.body.removeChild(container);
	}
}

// Получение текущей статистики текста
function getTextStats() {
	const text = textarea.value;
	return {
		withSpaces: text.length,
		noSpaces: text.replace(/\s/g, '').length,
		words: text.trim() ? text.trim().split(/\s+/).length : 0,
		paragraphs: countParagraphs(text),
		sentences: countSentences(text),
		readabilityScore: calculateReadabilityScore(text, countSentences(text)),
	};
}

// Функция для скачивания текста в формате TXT
function downloadTextAsTxt() {
	const text = textarea.value;
	if (!text.trim()) {
		showToast('Нечего скачивать. Введите текст.');
		return;
	}

	// Создаем элемент ссылки для скачивания
	const element = document.createElement('a');
	const file = new Blob([text], { type: 'text/plain' });
	element.href = URL.createObjectURL(file);

	// Генерируем имя файла с датой
	const date = new Date();
	const formattedDate = `${date.getDate()}-${
		date.getMonth() + 1
	}-${date.getFullYear()}`;
	element.download = `symbols-text-${formattedDate}.txt`;

	// Добавляем ссылку в DOM, кликаем по ней и удаляем
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);

	showToast('Текст скачан в формате TXT');
}

// Функция для автодополнения текста
function initAutoComplete() {
	// Словарь часто используемых слов и фраз на русском языке
	const commonWords = [
		'привет',
		'спасибо',
		'пожалуйста',
		'здравствуйте',
		'до свидания',
		'извините',
		'конечно',
		'возможно',
		'необходимо',
		'важно',
		'срочно',
		'интересно',
		'удивительно',
		'замечательно',
		'прекрасно',
		'великолепно',
		'отлично',
		'хорошо',
		'плохо',
		'ужасно',
		'быстро',
		'медленно',
		'внимательно',
		'осторожно',
		'аккуратно',
		'сегодня',
		'завтра',
		'вчера',
		'утром',
		'вечером',
		'днем',
		'ночью',
		'неделя',
		'месяц',
		'год',
		'время',
		'место',
		'человек',
		'люди',
		'работа',
		'учеба',
		'дом',
		'семья',
		'друзья',
		'коллеги',
	];

	// Загружаем пользовательские слова из localStorage
	let userWords = [];
	const savedWords = localStorage.getItem('userWords');
	if (savedWords) {
		try {
			userWords = JSON.parse(savedWords);
			console.log(`Загружено ${userWords.length} пользовательских слов`);
		} catch (e) {
			console.error('Ошибка при загрузке пользовательских слов:', e);
			userWords = [];
		}
	}

	// Объединяем стандартные и пользовательские слова
	const allWords = [...new Set([...commonWords, ...userWords])];

	// Переменные для инлайн-подсказок
	let currentSuggestion = '';
	let suggestionElement = null;

	// Функция для создания элемента инлайн-подсказки
	function createSuggestionElement(textareaElement) {
		const element = document.createElement('div');
		element.className = 'inline-suggestion';
		element.style.font = window.getComputedStyle(textareaElement).font;
		element.style.lineHeight =
			window.getComputedStyle(textareaElement).lineHeight;
		element.style.padding =
			window.getComputedStyle(textareaElement).padding;

		// Вставляем элемент после текстового поля
		textareaElement.parentNode.insertBefore(
			element,
			textareaElement.nextSibling
		);

		// Позиционируем элемент поверх текстового поля
		element.style.top = textareaElement.offsetTop + 'px';
		element.style.left = textareaElement.offsetLeft + 'px';
		element.style.width = textareaElement.offsetWidth + 'px';
		element.style.height = textareaElement.offsetHeight + 'px';

		return element;
	}

	// Функция для обновления инлайн-подсказки
	function updateInlineSuggestion(textareaElement, suggestionEl) {
		const text = textareaElement.value;
		const cursorPos = textareaElement.selectionStart;

		// Находим текущее слово
		let wordStart = cursorPos;
		while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
			wordStart--;
		}

		const currentWord = text.substring(wordStart, cursorPos);

		// Если слово слишком короткое, не показываем подсказку
		if (currentWord.length < 2) {
			suggestionEl.textContent = '';
			currentSuggestion = '';
			return;
		}

		// Ищем подходящее слово в словаре
		const suggestion = allWords.find(
			word =>
				word.toLowerCase().startsWith(currentWord.toLowerCase()) &&
				word.length > currentWord.length
		);

		if (suggestion) {
			// Создаем текст с подсказкой
			const beforeCursor = text.substring(0, wordStart);
			const afterCursor = text.substring(cursorPos);

			// Вычисляем отступы для правильного позиционирования
			const textBeforeCursor = beforeCursor + currentWord;

			// Создаем подсказку: текст до курсора + оставшаяся часть предлагаемого слова
			suggestionEl.textContent =
				textBeforeCursor +
				suggestion.substring(currentWord.length) +
				afterCursor;
			currentSuggestion = suggestion;
		} else {
			suggestionEl.textContent = '';
			currentSuggestion = '';
		}
	}

	// Функция для применения подсказки
	function applySuggestion(textareaElement) {
		if (!currentSuggestion) return false;

		const text = textareaElement.value;
		const cursorPos = textareaElement.selectionStart;

		// Находим начало текущего слова
		let wordStart = cursorPos;
		while (wordStart > 0 && !/\s/.test(text[wordStart - 1])) {
			wordStart--;
		}

		const currentWord = text.substring(wordStart, cursorPos);

		// Заменяем текущее слово предложенным
		const newText =
			text.substring(0, wordStart) +
			currentSuggestion +
			text.substring(cursorPos);
		textareaElement.value = newText;

		// Устанавливаем курсор после вставленного слова
		textareaElement.selectionStart = wordStart + currentSuggestion.length;
		textareaElement.selectionEnd = wordStart + currentSuggestion.length;

		// Сбрасываем подсказку
		currentSuggestion = '';
		if (suggestionElement) {
			suggestionElement.textContent = '';
		}

		// Обновляем статистику
		updateStats();

		return true;
	}

	// Создаем экземпляр autoComplete
	const autoCompleteJS = new autoComplete({
		selector: '#textarea',
		placeHolder: 'Вставь или введи текст для подсчёта',
		data: {
			src: allWords,
			cache: true,
		},
		resultItem: {
			highlight: true,
		},
		resultsList: {
			maxResults: 10,
			position: 'afterend',
		},
		events: {
			input: {
				selection: event => {
					const selection = event.detail.selection.value;
					const currentText = textarea.value;
					const cursorPos = textarea.selectionStart;

					// Находим начало текущего слова
					let wordStart = cursorPos;
					while (
						wordStart > 0 &&
						!/\s/.test(currentText[wordStart - 1])
					) {
						wordStart--;
					}

					// Заменяем текущее слово выбранным
					const newText =
						currentText.substring(0, wordStart) +
						selection +
						currentText.substring(cursorPos);

					textarea.value = newText;

					// Устанавливаем курсор после вставленного слова
					textarea.selectionStart = wordStart + selection.length;
					textarea.selectionEnd = wordStart + selection.length;

					// Обновляем статистику
					updateStats();

					// Показываем уведомление
					showToast(`Слово "${selection}" добавлено`);
				},
			},
		},
		threshold: 2,
		debounce: 300,
		searchEngine: 'strict',
	});

	// Создаем и настраиваем элемент инлайн-подсказки для основного текстового поля
	suggestionElement = createSuggestionElement(textarea);

	// Добавляем обработчики событий для инлайн-подсказок
	textarea.addEventListener('input', () => {
		updateInlineSuggestion(textarea, suggestionElement);
	});

	textarea.addEventListener('keydown', e => {
		// Применяем подсказку при нажатии Tab
		if (e.key === 'Tab' && currentSuggestion) {
			e.preventDefault(); // Предотвращаем стандартное поведение Tab
			applySuggestion(textarea);
		}
	});

	textarea.addEventListener('click', () => {
		updateInlineSuggestion(textarea, suggestionElement);
	});

	// Скрываем подсказку при потере фокуса
	textarea.addEventListener('blur', () => {
		if (suggestionElement) {
			suggestionElement.textContent = '';
		}
	});

	// Создаем экземпляр autoComplete для режима фокусировки
	if (focusModeTextarea) {
		const focusModeAutoComplete = new autoComplete({
			selector: '#focus-mode-textarea',
			placeHolder: 'Начни писать здесь...',
			data: {
				src: allWords,
				cache: true,
			},
			resultItem: {
				highlight: true,
			},
			resultsList: {
				maxResults: 10,
				position: 'beforebegin',
			},
			events: {
				input: {
					selection: event => {
						const selection = event.detail.selection.value;
						const currentText = focusModeTextarea.value;
						const cursorPos = focusModeTextarea.selectionStart;

						// Находим начало текущего слова
						let wordStart = cursorPos;
						while (
							wordStart > 0 &&
							!/\s/.test(currentText[wordStart - 1])
						) {
							wordStart--;
						}

						// Заменяем текущее слово выбранным
						const newText =
							currentText.substring(0, wordStart) +
							selection +
							currentText.substring(cursorPos);

						focusModeTextarea.value = newText;

						// Устанавливаем курсор после вставленного слова
						focusModeTextarea.selectionStart =
							wordStart + selection.length;
						focusModeTextarea.selectionEnd =
							wordStart + selection.length;

						// Обновляем статистику
						updateFocusModeStats();

						// Показываем уведомление
						showToast(`Слово "${selection}" добавлено`);
					},
				},
			},
			threshold: 2,
			debounce: 300,
			searchEngine: 'strict',
		});

		// Создаем и настраиваем элемент инлайн-подсказки для режима фокусировки
		const focusModeSuggestionElement =
			createSuggestionElement(focusModeTextarea);

		// Добавляем обработчики событий для инлайн-подсказок в режиме фокусировки
		focusModeTextarea.addEventListener('input', () => {
			updateInlineSuggestion(
				focusModeTextarea,
				focusModeSuggestionElement
			);
		});

		focusModeTextarea.addEventListener('keydown', e => {
			// Применяем подсказку при нажатии Tab
			if (e.key === 'Tab' && currentSuggestion) {
				e.preventDefault(); // Предотвращаем стандартное поведение Tab
				applySuggestion(focusModeTextarea);
				// Обновляем статистику для режима фокусировки
				updateFocusModeStats();
			}
		});

		focusModeTextarea.addEventListener('click', () => {
			updateInlineSuggestion(
				focusModeTextarea,
				focusModeSuggestionElement
			);
		});

		// Скрываем подсказку при потере фокуса
		focusModeTextarea.addEventListener('blur', () => {
			focusModeSuggestionElement.textContent = '';
		});
	}

	console.log('Автодополнение инициализировано');
}

// Инициализируем автодополнение при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
	// Существующий код инициализации...

	// Инициализация автодополнения
	setTimeout(() => {
		initAutoComplete();
		updateUserWordsCount(); // Обновляем счетчик слов
	}, 1000); // Небольшая задержка для уверенности, что DOM полностью загружен

	// Добавляем обработчик для кнопки очистки словаря
	const clearUserWordsButton = document.querySelector('#clear-user-words');
	if (clearUserWordsButton) {
		clearUserWordsButton.addEventListener('click', clearUserWords);
	}
});

// Функция для обновления счетчика пользовательских слов
function updateUserWordsCount() {
	const userWordsCountElement = document.querySelector('#user-words-count');
	if (!userWordsCountElement) return;

	const savedWords = localStorage.getItem('userWords');
	if (savedWords) {
		try {
			const userWords = JSON.parse(savedWords);
			userWordsCountElement.textContent = userWords.length;
		} catch (e) {
			console.error('Ошибка при загрузке пользовательских слов:', e);
			userWordsCountElement.textContent = '0';
		}
	} else {
		userWordsCountElement.textContent = '0';
	}
}

// Функция для очистки пользовательского словаря
function clearUserWords() {
	if (
		confirm(
			'Вы уверены, что хотите очистить словарь автодополнения? Все пользовательские слова будут удалены.'
		)
	) {
		localStorage.removeItem('userWords');
		showToast('Словарь автодополнения очищен');
		updateUserWordsCount();

		// Перезагружаем автодополнение с базовым словарем
		setTimeout(() => {
			initAutoComplete();
		}, 500);
	}
}

// Функция для обучения автодополнения на основе введенного текста
function learnFromUserText() {
	// Получаем текущий текст
	const text = textarea.value;

	// Если текст слишком короткий, не обрабатываем
	if (text.length < 50) return;

	// Разбиваем текст на слова
	const words = text
		.toLowerCase()
		.replace(/[^\wа-яё\s]/g, '')
		.split(/\s+/)
		.filter(word => word.length > 3); // Только слова длиннее 3 символов

	// Получаем уникальные слова
	const uniqueWords = [...new Set(words)];

	// Загружаем существующие пользовательские слова
	let userWords = [];
	const savedWords = localStorage.getItem('userWords');
	if (savedWords) {
		try {
			userWords = JSON.parse(savedWords);
		} catch (e) {
			console.error('Ошибка при загрузке пользовательских слов:', e);
			userWords = [];
		}
	}

	// Добавляем новые слова
	const newWords = uniqueWords.filter(word => !userWords.includes(word));

	if (newWords.length > 0) {
		// Объединяем с существующими словами
		const updatedWords = [...userWords, ...newWords];

		// Ограничиваем количество слов (например, до 1000)
		const MAX_WORDS = 1000;
		if (updatedWords.length > MAX_WORDS) {
			updatedWords.splice(0, updatedWords.length - MAX_WORDS);
		}

		// Сохраняем в localStorage
		localStorage.setItem('userWords', JSON.stringify(updatedWords));

		console.log(
			`Добавлено ${newWords.length} новых слов. Всего: ${updatedWords.length}`
		);

		// Показываем уведомление, если добавлено много слов
		if (newWords.length > 10) {
			showToast(
				`Словарь автодополнения пополнен ${newWords.length} новыми словами`
			);
		}

		// Обновляем счетчик слов
		updateUserWordsCount();
	}
}

// Добавляем обработчик для обучения на основе введенного текста
textarea.addEventListener('blur', learnFromUserText);
if (focusModeTextarea) {
	focusModeTextarea.addEventListener('blur', learnFromUserText);
}
