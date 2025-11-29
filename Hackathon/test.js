// ==============================
// CONFIG
// ==============================
const WEBHOOK_URL = "https://zxjm2505.app.n8n.cloud/webhook/as";

// ==============================
// FORM REFERENCES
// ==============================
const solarForm = document.getElementById("solarPlanningForm");
const energyForm = document.getElementById("energySellingForm");

// Output boxes
const feature1Output = document.querySelector('#feature1 .output-box');
const feature2Output = document.querySelector('#feature2 .output-box');

// ==============================
// GENERIC SEND FUNCTION
// ==============================
async function sendToWebhook(payload, outputBox) {
    outputBox.innerHTML = "<em>Sending...</em>";

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        // Handle wrapper 'output' if present
        const out = json.output || json;

        // Only display AI analysis and recommendation
        let html = "<h3>AI Analysis</h3>";
        html += `<p>${out.analysis}</p>`;
        html += "<br>";
        html += "<h3>AI Recommendation</h3>";
        html += `<p>${out.recommendation}</p>`;

        outputBox.innerHTML = html;

    } catch (err) {
        outputBox.textContent = "Error: " + err.message;
    }
}

// ==============================
// FEATURE 1 — SOLAR PLANNING
// ==============================
solarForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(solarForm);

    const data = {
        Building_Name: fd.get("building_name"),
        Location: fd.get("location"),
        Roof_Area_: Number(fd.get("roof_area_m2")),
        Roof_Orientation: fd.get("roof_orientation"),
        Monthly_Consumption_kWh: Number(fd.get("monthly_consumption_kwh")),
        Installation_Cost: Number(fd.get("installation_cost")),
    };

    await sendToWebhook(data, feature1Output);
});

// ==============================
// FEATURE 2 — ENERGY SELLING
// ==============================
energyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(energyForm);

    const data = {
        battery_capacity: Number(fd.get("battery_capacity") || 0),
        panel_capacity: Number(fd.get("panel_capacity") || 0),
        sell_rate: Number(fd.get("sell_rate") || 0),
        avg_usage: Number(fd.get("avg_usage") || 0),
        gov_incentive: Number(fd.get("gov_incentive") || 0),
    };

    await sendToWebhook(data, feature2Output);
});

// ==============================
// FEATURE 3 — PREDICTION MODEL
// ==============================
document.getElementById("predict-form").addEventListener("submit", (e) => {
    e.preventDefault();  // prevent form from refreshing
    console.log("Button clicked!");  // <-- check if this runs
});

document.getElementById("predict-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const state = document.getElementById("state").value;
    const sunlight = 4.5;
    const panel_area_val = parseFloat(document.getElementById('panel_area').value);
    const panel_efficiency_val = parseFloat(document.getElementById('panel_efficiency').value) / 100; // convert % to decimal
    const earn_rate_val = parseFloat(document.getElementById('earn_rate').value);

    // Backend automatically calculates next month
    const response = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
    });

    const data = await response.json();
    const next_month_days = data.days_in_next_month;

    // kWh/day
    const daily_calc = panel_area_val * panel_efficiency_val * sunlight;
    // kWh/month
    const monthly_calc = daily_calc * next_month_days;
    // RM
    const monthly_income = monthly_calc * earn_rate_val;

    document.getElementById("result").innerText =
    `
    Predicted rainy days next month: ${data.predicted_rainy_days}
    Estimated monthly solar energy: ${monthly_calc.toFixed(2)} kWh
    Estimated income: RM ${monthly_income.toFixed(2)}
    `;
});
