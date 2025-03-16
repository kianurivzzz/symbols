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
const themeToggle = document.querySelector('#theme-toggle');
const advancedStatsToggle = document.querySelector('#advanced-stats-toggle');
const advancedStatsSection = document.querySelector('#advanced-stats');

// History management
const MAX_HISTORY_ITEMS = 10;
let textHistory = [];
let currentHistoryIndex = -1;
let isRestoringFromHistory = false;

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

// Event Listeners
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

if (advancedStatsToggle) {
	advancedStatsToggle.addEventListener('click', toggleAdvancedStats);
}

// Add event listeners for history
document.addEventListener('DOMContentLoaded', () => {
	const historyToggle = document.querySelector('#history-toggle');
	if (historyToggle) {
		historyToggle.addEventListener('click', toggleHistoryPanel);
	}

	const clearHistoryButton = document.querySelector('#clear-history');
	if (clearHistoryButton) {
		clearHistoryButton.addEventListener('click', clearAllHistory);
	}
});

themeToggle.addEventListener('click', () => {
	// Добавляем класс для анимации
	document.body.classList.add('theme-transition');

	// Переключаем тему после небольшой задержки
	setTimeout(() => {
		document.body.classList.toggle('dark-theme');
		const isDark = document.body.classList.contains('dark-theme');
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		showToast(isDark ? 'Тёмная тема включена' : 'Светлая тема включена');
	}, 50);

	// Удаляем класс анимации после завершения перехода
	setTimeout(() => {
		document.body.classList.remove('theme-transition');
	}, 800);
});

// Initialize theme based on system preference or saved preference
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
	document.body.classList.add('dark-theme');
}

// Listen for system theme changes
window
	.matchMedia('(prefers-color-scheme: dark)')
	.addEventListener('change', e => {
		if (!localStorage.getItem('theme')) {
			// Добавляем класс для анимации
			document.body.classList.add('theme-transition');

			// Переключаем тему после небольшой задержки
			setTimeout(() => {
				document.body.classList.toggle('dark-theme', e.matches);
			}, 50);

			// Удаляем класс анимации после завершения перехода
			setTimeout(() => {
				document.body.classList.remove('theme-transition');
			}, 800);
		}
	});

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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

	updateStats();
});
