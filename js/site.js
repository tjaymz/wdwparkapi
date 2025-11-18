// Configuration - Easy to change the data source
const DEFAULT_DATA_SOURCE = 'parkAPI.json';

let parkData = null;

// Load data when page loads
window.addEventListener('DOMContentLoaded', () => {
	loadData();
});

async function loadData() {
	const apiUrlInput = document.getElementById('apiUrl');
	const dataSource = apiUrlInput.value.trim() || DEFAULT_DATA_SOURCE;

	showLoading(true);
	hideError();

	try {
		const response = await fetch(dataSource);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		parkData = await response.json();
		renderAllViews(parkData);
		showLoading(false);
	} catch (error) {
		showError(`Failed to load data: ${error.message}`);
		showLoading(false);
	}
}

function showLoading(show) {
	const loading = document.getElementById('loading');
	const allTabs = document.querySelectorAll('.tab-content');

	if (show) {
		loading.style.display = 'block';
		allTabs.forEach(tab => tab.style.visibility = 'hidden');
	} else {
		loading.style.display = 'none';
		allTabs.forEach(tab => tab.style.visibility = 'visible');
	}
}

function showError(message) {
	const errorDiv = document.getElementById('error');
	errorDiv.innerHTML = `<div class="error"><strong>Error:</strong> ${message}</div>`;
	errorDiv.style.display = 'block';
}

function hideError() {
	document.getElementById('error').style.display = 'none';
}

function switchTab(element, tabName) {
	// Update tab buttons
	document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
	element.classList.add('active');

	// Update tab content
	document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
	document.getElementById(`${tabName}-tab`).classList.add('active');
}

function renderAllViews(data) {
	renderPreview(data);
	renderExplorer(data);
	renderRawJSON(data);
}

function renderPreview(data) {
	const container = document.getElementById('preview-tab');

	let html = '';

	// Statistics
	const attractionCount = data.mapData?.location?.markers?.length || 0;
	const scheduleCount = data.infoBarData?.schedule?.schedules?.length || 0;

	html += '<div class="stats">';
	html += `
		<div class="stat-card">
			<div class="number">${attractionCount}</div>
			<div class="label">Attractions</div>
		</div>
		<div class="stat-card">
			<div class="number">${scheduleCount}</div>
			<div class="label">Schedule Entries</div>
		</div>
	`;
	html += '</div>';

	// Park Information
	if (data.meta || data.headerData) {
		html += '<div class="section">';
		html += '<h2>Park Information</h2>';
		html += '<div class="park-info">';

		if (data.headerData?.title) {
			html += `<h3 style="color: #2c3e50; margin-bottom: 10px;">${data.headerData.title}</h3>`;
		}

		if (data.headerData?.subtitle) {
			html += `<p><strong>Subtitle:</strong> ${data.headerData.subtitle}</p>`;
		}

		if (data.meta?.description) {
			html += `<p><strong>Description:</strong> ${data.meta.description}</p>`;
		}

		html += '</div></div>';
	}

	// Today's Schedule
	if (data.infoBarData?.schedule?.schedules) {
		html += '<div class="section">';
		html += '<h2>Park Schedule (Next 7 Days)</h2>';
		html += '<div class="schedule-grid">';

		const schedules = data.infoBarData.schedule.schedules;
		const uniqueDates = [...new Set(schedules.map(s => s.date))].slice(0, 7);

		uniqueDates.forEach(date => {
			const daySchedules = schedules.filter(s => s.date === date);

			html += '<div class="schedule-card">';
			html += `<div class="date">${formatDate(date)}</div>`;

			daySchedules.forEach(schedule => {
				html += `
					<div class="time-slot">
						<strong>${schedule.type}</strong><br>
						${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}
					</div>
				`;
			});

			html += '</div>';
		});

		html += '</div></div>';
	}

	// Attractions
	if (data.mapData?.location?.markers) {
		html += '<div class="section">';
		html += '<h2>Attractions</h2>';
		html += '<div class="attractions-grid">';

		data.mapData.location.markers.forEach(marker => {
			if (marker.card) {
				html += '<div class="attraction-card">';
				html += `<h3>${marker.card.name || marker.name}</h3>`;

				// Location
				if (marker.facets && marker.facets[2]) {
					html += `<div class="location">${marker.facets[2][1] || ''}</div>`;
				}

				// Tags
				if (marker.facets) {
					html += '<div class="tags">';

					// Height requirement
					if (marker.facets[0] && marker.facets[0][0]) {
						html += `<span class="tag">${marker.facets[0][0]}</span>`;
					}

					// Ride types
					if (marker.facets[1]) {
						marker.facets[1].forEach(tag => {
							html += `<span class="tag">${tag}</span>`;
						});
					}

					html += '</div>';
				}

				html += '</div>';
			}
		});

		html += '</div></div>';
	}

	container.innerHTML = html;
}

function renderExplorer(data) {
	const container = document.getElementById('explorer-tab');

	let html = '<div class="section">';
	html += '<h2>Data Structure Overview</h2>';

	// Data Summary
	html += '<div class="data-summary">';
	html += '<h3>Top-Level Fields</h3>';
	html += '<div class="summary-grid">';

	Object.keys(data).forEach(key => {
		const value = data[key];
		const type = Array.isArray(value) ? 'array' : typeof value;
		let info = '';

		if (Array.isArray(value)) {
			info = `Array with ${value.length} items`;
		} else if (typeof value === 'object' && value !== null) {
			const subKeys = Object.keys(value).length;
			info = `Object with ${subKeys} properties`;
		} else {
			info = `${type}: ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}`;
		}

		html += `
			<div class="summary-item">
				<strong>${key}</strong>
				<span>${info}</span>
			</div>
		`;
	});

	html += '</div></div>';

	// Detailed breakdown of important sections
	html += '<div class="data-summary">';
	html += '<h3>Detailed Data Breakdown</h3>';
	html += '<div style="line-height: 1.8; color: #555;">';

	// Meta information
	if (data.meta) {
		html += '<p><strong>meta:</strong> Contains page metadata (title, description, keywords)</p>';
		html += `<p style="margin-left: 20px;">- title: "${data.meta.title}"</p>`;
		html += `<p style="margin-left: 20px;">- description: ${data.meta.description ? data.meta.description.substring(0, 100) + '...' : 'N/A'}</p>`;
	}

	// Header data
	if (data.headerData) {
		html += '<p><strong>headerData:</strong> Page header information</p>';
		Object.keys(data.headerData).forEach(key => {
			html += `<p style="margin-left: 20px;">- ${key}: ${JSON.stringify(data.headerData[key]).substring(0, 80)}</p>`;
		});
	}

	// Info bar data (schedule)
	if (data.infoBarData) {
		html += '<p><strong>infoBarData:</strong> Information bar data including schedules</p>';
		if (data.infoBarData.schedule) {
			html += `<p style="margin-left: 20px;">- schedule: ${data.infoBarData.schedule.schedules?.length || 0} schedule entries</p>`;
			html += `<p style="margin-left: 20px;">- timezone: ${data.infoBarData.schedule.timeZone}</p>`;
		}
	}

	// Map data (attractions)
	if (data.mapData?.location?.markers) {
		html += '<p><strong>mapData.location.markers:</strong> Attraction markers for map</p>';
		html += `<p style="margin-left: 20px;">- Total attractions: ${data.mapData.location.markers.length}</p>`;
		const marker = data.mapData.location.markers[0];
		if (marker) {
			html += '<p style="margin-left: 20px;">- Each marker contains:</p>';
			Object.keys(marker).forEach(key => {
				html += `<p style="margin-left: 40px;">• ${key} (${typeof marker[key]})</p>`;
			});
		}
	}

	// Hero data
	if (data.heroData) {
		html += '<p><strong>heroData:</strong> Hero section media and content</p>';
		if (data.heroData.mediaEngine?.data) {
			html += `<p style="margin-left: 20px;">- ${data.heroData.mediaEngine.data.length} media items (videos/images)</p>`;
		}
	}

	html += '</div></div>';
	html += '</div>';

	container.innerHTML = html;
}

function renderRawJSON(data) {
	const container = document.getElementById('raw-tab');

	let html = '<div class="section">';
	html += '<h2>Raw JSON Data</h2>';
	html += '<input type="text" class="search-box" placeholder="Search JSON (press Enter)" onkeyup="searchJSON(event)">';
	html += '<div class="json-tree" id="json-display">';
	html += syntaxHighlight(JSON.stringify(data, null, 2));
	html += '</div></div>';

	container.innerHTML = html;
}

function syntaxHighlight(json) {
	json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
		let cls = 'json-number';
		if (/^"/.test(match)) {
			if (/:$/.test(match)) {
				cls = 'json-key';
			} else {
				cls = 'json-string';
			}
		} else if (/true|false/.test(match)) {
			cls = 'json-boolean';
		} else if (/null/.test(match)) {
			cls = 'json-null';
		}
		return '<span class="' + cls + '">' + match + '</span>';
	});
}

function searchJSON(event) {
	if (event.key !== 'Enter') return;

	const searchTerm = event.target.value.toLowerCase();
	const jsonDisplay = document.getElementById('json-display');

	if (!searchTerm) {
		jsonDisplay.innerHTML = syntaxHighlight(JSON.stringify(parkData, null, 2));
		return;
	}

	const jsonString = JSON.stringify(parkData, null, 2);
	const highlighted = jsonString.replace(
		new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
		match => `<mark class="highlight">${match}</mark>`
	);

	jsonDisplay.innerHTML = syntaxHighlight(highlighted);
}

function formatDate(dateString) {
	const date = new Date(dateString);
	const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
	return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
	const [hours, minutes] = timeString.split(':');
	const hour = parseInt(hours);
	const ampm = hour >= 12 ? 'PM' : 'AM';
	const displayHour = hour % 12 || 12;
	return `${displayHour}:${minutes} ${ampm}`;
}