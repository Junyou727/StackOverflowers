// Configure your n8n webhook URL here
const WEBHOOK_URL = 'https://zxjm2505.app.n8n.cloud/webhook-test/as';


const form = document.getElementById('buildingForm');
const statusDiv = document.getElementById('status');
const responseSection = document.getElementById('responseSection');
const responseContent = document.getElementById('responseContent');
const solarSummary = document.getElementById('solarSummary');
const solarSummaryContent = document.getElementById('solarSummaryContent');
const batterySummary = document.getElementById('batterySummary');
const batterySummaryContent = document.getElementById('batterySummaryContent');
const scenariosContainer = document.getElementById('scenariosContainer');
const scenariosContent = document.getElementById('scenariosContent');

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

function showRawResponse(data) {
    responseContent.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    responseSection.classList.add('show');
}

function renderSolar(solar) {
    if (!solar) return;
    solarSummaryContent.innerHTML = `
<strong>Avg generation:</strong> ${solar.estimated_generation_kwh_per_month ?? 'N/A'} kWh/month<br>
<strong>Yearly generation:</strong> ${solar.estimated_generation_kwh_per_year ?? 'N/A'} kWh<br>
<strong>Estimated savings:</strong> ${solar.estimated_savings_usd_per_month ?? 'N/A'} USD/month<br>
<strong>Installation cost:</strong> ${solar.installation_cost_usd ?? 'N/A'} USD<br>
<strong>Annual maintenance:</strong> ${solar.annual_maintenance_cost_usd ?? 'N/A'} USD<br>
<strong>Payback:</strong> ${solar.payback_years ?? 'N/A'} years<br>
<strong>ROI (20y):</strong> ${solar.roi_percent_20y ?? 'N/A'} %
`;
    solarSummary.style.display = 'block';
}

function renderBattery(battery) {
    if (!battery) return;
    const chargePolicy = (battery.charge_policy || []).map((p,i) => `${i+1}. ${p}`).join('\n');
    const sellSchedule = (battery.sell_to_grid_schedule || []).map(s => `- ${s.trigger}: ${s.action}`).join('\n');
    batterySummaryContent.innerHTML = `
<strong>Recommended size:</strong> ${battery.recommended_size_kwh ?? 'N/A'} kWh<br>
<strong>Round-trip efficiency:</strong> ${battery.round_trip_efficiency_percent ?? 'N/A'} %<br>
<strong>Replacement interval:</strong> ${battery.replacement_interval_years ?? 'N/A'} years<br>
<strong>Monthly earnings from grid:</strong> ${battery.monthly_earnings_from_grid_usd ?? 'N/A'} USD/month<br>
<strong>Charge policy:</strong><pre style="white-space:pre-wrap; margin:6px 0;">${chargePolicy || 'N/A'}</pre>
<strong>Sell schedule:</strong><pre style="white-space:pre-wrap; margin:6px 0;">${sellSchedule || 'N/A'}</pre>
`;
    batterySummary.style.display = 'block';
}

function renderScenarios(scenarios) {
    if (!scenarios) return;
    const renderScenario = (name, obj) => {
        const monthly = (obj.monthly_kwh || []).map((v,i) => `M${i+1}: ${v}`).join(', ');
        return `\n<strong>${name}:</strong> Annual kWh: ${obj.annual_kwh ?? 'N/A'}, Annual savings: ${obj.annual_savings_usd ?? 'N/A'} USD\nMonthly (Jan→Dec): ${monthly}`;
    };
    let out = '';
    if (scenarios.optimistic) out += renderScenario('Optimistic', scenarios.optimistic);
    if (scenarios.typical) out += renderScenario('\nTypical', scenarios.typical);
    if (scenarios.pessimistic) out += renderScenario('\nPessimistic', scenarios.pessimistic);
    scenariosContent.textContent = out.trim();
    scenariosContainer.style.display = 'block';
}

function tryParseJSON(text) {
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (e) {
        // try to extract JSON object from text
        const m = text.match(/\{[\s\S]*\}/);
        if (m) {
            try { return JSON.parse(m[0]); } catch (e2) { return null; }
        }
        return null;
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get form data
    const formData = new FormData(form);
    
    // DEBUG: Log all form fields
    console.log('=== FORM DATA DEBUG ===');
    console.log('building_name:', formData.get('building_name'));
    console.log('location:', formData.get('location'));
    console.log('roof_area_m2:', formData.get('roof_area_m2'));
    console.log('monthly_consumption_kwh:', formData.get('monthly_consumption_kwh'));
    
    const jsonData = {
        building_name: formData.get('building_name') || null,
        location: formData.get('location') || null,
        roof_area_m2: formData.get('roof_area_m2') ? Number(formData.get('roof_area_m2')) : null,
        monthly_consumption_kwh: formData.get('monthly_consumption_kwh') ? Number(formData.get('monthly_consumption_kwh')) : null
    };

    console.log('=== SENDING JSON TO WEBHOOK ===');
    console.log(JSON.stringify(jsonData, null, 2));
    showStatus('Sending data...', 'loading');

    // hide previous results
    responseSection.classList.remove('show');
    solarSummary.style.display = 'none';
    batterySummary.style.display = 'none';
    scenariosContainer.style.display = 'none';

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        });

        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response body:', responseText);

        if (response.ok) {
            showStatus('✓ Data sent successfully!', 'success');
            // attempt to parse structured JSON
            const parsed = tryParseJSON(responseText);
            if (parsed) {
                // show raw response too
                showRawResponse(parsed);
                // render sections if present
                renderSolar(parsed.solar);
                renderBattery(parsed.battery);
                renderScenarios(parsed.scenarios);
            } else {
                showRawResponse(responseText || 'No response body');
            }
            form.reset();
        } else {
            showStatus(`✗ Error: Server responded with status ${response.status}`, 'error');
            showRawResponse(responseText || 'No response body');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showStatus(`✗ Error: ${error.message}`, 'error');
        showRawResponse(`Error details: ${error.message}`);
    }
});